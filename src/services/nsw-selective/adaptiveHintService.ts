// =============================================================================
// ADAPTIVE HINT SERVICE
// =============================================================================
// FILE: src/services/nsw-selective/adaptiveHintService.ts
// DOMAIN: NSW Selective Exam Prep - AI Tutoring
// PURPOSE: Provide tailored hints based on error history and mastery level
// DO NOT: Reveal answers directly - always guide toward understanding

import { FirestoreQuestion, FirestoreHint, ArchetypeId } from '@/types';
import { DistractorType, getArchetypeDefinition } from '@/types/nsw-selective';

// =============================================================================
// TYPES
// =============================================================================

export interface AdaptiveHintRequest {
  question: FirestoreQuestion;
  archetypeId: ArchetypeId;
  errorHistory: Partial<Record<DistractorType, number>>;
  attemptsOnCurrentQuestion: number;
  selectedWrongOptions: string[]; // Options already tried (e.g., ["B", "D"])
  masteryLevel: number;
  hintsUsedThisQuestion: number;
}

export interface AdaptiveHint {
  content: string;
  targetedGuidance: string | null; // Based on detected error pattern
  scaffoldLevel: 'gentle' | 'moderate' | 'direct';
  focusArea: string; // What specific aspect to focus on
  revealsCriticalInfo: boolean;
  isAdapted: boolean; // Whether this was tailored vs static
}

export interface HintStrategy {
  priorityErrorType: DistractorType | null;
  recommendedFocus: string;
  avoidRevealing: string[];
}

// =============================================================================
// ERROR-SPECIFIC HINT TEMPLATES
// =============================================================================

/**
 * Templates for addressing specific error types
 * These never reveal the answer but guide toward the correct thinking
 */
const ERROR_TYPE_HINTS: Record<DistractorType, {
  gentle: string;
  moderate: string;
  direct: string;
  focusArea: string;
}> = {
  forward_calculation: {
    gentle: "Think carefully: is the value given in the question the START or the RESULT of the change?",
    moderate: "This problem gives you the final value. Working backwards means REVERSING the operation - what's the opposite?",
    direct: "When you have the result of a percentage change, divide to find the original. Set up: Original × (percentage factor) = Final.",
    focusArea: "Direction of calculation"
  },
  partial_solution: {
    gentle: "You've made good progress! But check - does your answer fully match what the question asks for?",
    moderate: "Look at the question again. Is there one more step needed after your current calculation?",
    direct: "Your intermediate value is correct, but the question asks for something else. What operation converts your answer to what's asked?",
    focusArea: "Completing all steps"
  },
  wrong_operation: {
    gentle: "Think about what relationship exists between the values. Does the answer need to be bigger or smaller?",
    moderate: "Consider: should we be multiplying, dividing, adding, or subtracting here? What makes sense in context?",
    direct: "Check your operation. Think about the formula: how do the given values relate to what you're finding?",
    focusArea: "Choosing the right operation"
  },
  computation_error: {
    gentle: "Your thinking is on track! Double-check your arithmetic carefully.",
    moderate: "The setup looks good. Try the calculation again, writing out each step.",
    direct: "Your approach is correct. Focus on the arithmetic: what's the exact result of your calculation?",
    focusArea: "Arithmetic accuracy"
  },
  sign_error: {
    gentle: "Is this an increase or a decrease? That affects which direction the answer should go.",
    moderate: "Pay attention to the words in the problem: 'increase', 'more', 'decrease', 'less' - these tell you the direction.",
    direct: "When something increases by a percentage, multiply by MORE than 1. When it decreases, multiply by LESS than 1.",
    focusArea: "Positive/negative direction"
  },
  unit_confusion: {
    gentle: "Check your units. Are all values in the same units before calculating?",
    moderate: "The question mixes different units. Convert everything to the same unit first.",
    direct: "Before calculating, ensure consistent units. Check: what unit is your answer in? Is that what's asked?",
    focusArea: "Unit consistency"
  },
  off_by_one: {
    gentle: "Count carefully. Does your counting include or exclude the endpoints?",
    moderate: "The question asks about counting items. Are you including the starting point? The ending point?",
    direct: "Counting from A to B inclusive means both A and B are counted. Exclusive means neither. Which does this question want?",
    focusArea: "Boundary counting"
  },
  misconception_answer: {
    gentle: "Let's check your understanding. What's the key concept being tested here?",
    moderate: "This answer comes from a common misunderstanding. What's the actual rule for this type of problem?",
    direct: "Remember the methodology: this type of problem requires a specific approach. What are the steps?",
    focusArea: "Core concept understanding"
  },
  misread_question: {
    gentle: "Read the question one more time, slowly. What exactly is it asking for?",
    moderate: "Underline the key words in the question. What's the final answer supposed to represent?",
    direct: "The question asks for [specific thing]. Your answer gives [different thing]. What adjustment is needed?",
    focusArea: "Question interpretation"
  },
  conceptual_error: {
    gentle: "Think about what type of problem this is. What approach works for this pattern?",
    moderate: "This problem follows a specific pattern. Can you identify what type it is?",
    direct: "Review the methodology for this archetype. The key relationship is: [methodology hint].",
    focusArea: "Problem type recognition"
  },
  setup_error: {
    gentle: "Start by writing out what you know and what you need to find.",
    moderate: "Before calculating, set up the equation that connects the given values to the unknown.",
    direct: "The setup should be: [Variable] [relationship] [Given values]. What equation represents this?",
    focusArea: "Problem setup"
  },
  place_value_error: {
    gentle: "Check the size of your answer. Does it make sense in context?",
    moderate: "You might be off by a factor of 10, 100, or 1000. Double-check your decimal placement.",
    direct: "Count the decimal places carefully. How many digits should be in your answer?",
    focusArea: "Place value and decimals"
  },
  inverted_ratio: {
    gentle: "Think about which quantity goes on top vs bottom in your ratio.",
    moderate: "The ratio might be flipped. If A:B is the ratio, make sure A is what you expect.",
    direct: "You've inverted the ratio. If X is to Y as A is to B, then X/Y = A/B, not B/A.",
    focusArea: "Ratio direction"
  },
  formula_confusion: {
    gentle: "Which formula applies to this type of problem?",
    moderate: "Make sure you're using the right formula. Area and perimeter are different, for example.",
    direct: "You may have applied the wrong formula. Review what this question is actually asking for.",
    focusArea: "Formula selection"
  },
  middle_value_trap: {
    gentle: "Don't pick an answer just because it looks reasonable. Check your work.",
    moderate: "This answer is a common trap - it looks plausible but isn't calculated correctly.",
    direct: "Work through the calculation step by step. Don't estimate or pick what 'looks right'.",
    focusArea: "Avoiding estimation traps"
  }
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Determine the most likely error type based on selected wrong option
 */
function detectErrorType(
  question: FirestoreQuestion,
  selectedOption: string
): DistractorType | null {
  const distractorTypes = question.nswSelective?.distractorTypes;
  if (distractorTypes && distractorTypes[selectedOption]) {
    return distractorTypes[selectedOption] as DistractorType;
  }
  return null;
}

/**
 * Get the most common error from history
 */
function getMostCommonError(
  errorHistory: Partial<Record<DistractorType, number>>
): DistractorType | null {
  let maxCount = 0;
  let maxError: DistractorType | null = null;

  for (const [errorType, count] of Object.entries(errorHistory)) {
    if (count && count > maxCount) {
      maxCount = count;
      maxError = errorType as DistractorType;
    }
  }

  return maxError;
}

/**
 * Determine scaffold level based on attempts and hints used
 */
function getScaffoldLevel(
  attemptsOnCurrentQuestion: number,
  hintsUsedThisQuestion: number,
  masteryLevel: number
): 'gentle' | 'moderate' | 'direct' {
  const totalHelp = attemptsOnCurrentQuestion + hintsUsedThisQuestion;

  if (totalHelp <= 1) {
    return 'gentle';
  } else if (totalHelp <= 3 || masteryLevel >= 4) {
    return 'moderate';
  } else {
    return 'direct';
  }
}

/**
 * Analyze hint strategy based on error patterns
 */
function analyzeHintStrategy(
  errorHistory: Partial<Record<DistractorType, number>>,
  selectedWrongOptions: string[],
  question: FirestoreQuestion
): HintStrategy {
  // Check current question errors first
  let priorityErrorType: DistractorType | null = null;
  const currentErrors = selectedWrongOptions
    .map(opt => detectErrorType(question, opt))
    .filter((e): e is DistractorType => e !== null);

  if (currentErrors.length > 0) {
    priorityErrorType = currentErrors[currentErrors.length - 1]; // Most recent error
  } else {
    priorityErrorType = getMostCommonError(errorHistory);
  }

  // Determine focus based on error type
  const recommendedFocus = priorityErrorType
    ? ERROR_TYPE_HINTS[priorityErrorType].focusArea
    : "Problem approach";

  // What we should NOT reveal
  const avoidRevealing = [
    'The correct answer',
    'The exact calculation result',
    'Which option is correct'
  ];

  return {
    priorityErrorType,
    recommendedFocus,
    avoidRevealing
  };
}

// =============================================================================
// MAIN FUNCTIONS
// =============================================================================

/**
 * Generate an adaptive hint based on error patterns and context
 */
export function generateAdaptiveHint(request: AdaptiveHintRequest): AdaptiveHint {
  const {
    question,
    archetypeId,
    errorHistory,
    attemptsOnCurrentQuestion,
    selectedWrongOptions,
    masteryLevel,
    hintsUsedThisQuestion
  } = request;

  const strategy = analyzeHintStrategy(errorHistory, selectedWrongOptions, question);
  const scaffoldLevel = getScaffoldLevel(attemptsOnCurrentQuestion, hintsUsedThisQuestion, masteryLevel);
  const archetype = getArchetypeDefinition(archetypeId);

  let content: string;
  let targetedGuidance: string | null = null;
  let isAdapted = false;

  // If we have a detected error type, use targeted hint
  if (strategy.priorityErrorType) {
    const errorHints = ERROR_TYPE_HINTS[strategy.priorityErrorType];
    content = errorHints[scaffoldLevel];
    targetedGuidance = `Based on your approach, focus on: ${errorHints.focusArea}`;
    isAdapted = true;
  } else {
    // Fallback to static hints from question
    const staticHint = question.hints?.[Math.min(hintsUsedThisQuestion, (question.hints?.length || 1) - 1)];
    content = staticHint?.content || `Remember the ${archetype.shortName} approach: ${archetype.solutionApproach}`;
  }

  // For high mastery students, add methodology reminder
  if (masteryLevel >= 4 && scaffoldLevel === 'gentle') {
    content = `Quick reminder: ${content}`;
  }

  // For struggling students, add encouragement
  if (attemptsOnCurrentQuestion >= 3) {
    content = `You're making progress! ${content}`;
  }

  return {
    content,
    targetedGuidance,
    scaffoldLevel,
    focusArea: strategy.recommendedFocus,
    revealsCriticalInfo: scaffoldLevel === 'direct',
    isAdapted
  };
}

/**
 * Get a sequence of progressive hints for a question
 */
export function getProgressiveHintSequence(
  question: FirestoreQuestion,
  archetypeId: ArchetypeId,
  errorHistory: Partial<Record<DistractorType, number>>
): AdaptiveHint[] {
  const hints: AdaptiveHint[] = [];
  const strategy = analyzeHintStrategy(errorHistory, [], question);
  const archetype = getArchetypeDefinition(archetypeId);

  // Hint 1: Gentle nudge
  hints.push({
    content: strategy.priorityErrorType
      ? ERROR_TYPE_HINTS[strategy.priorityErrorType].gentle
      : `What type of problem is this? Think about the ${archetype.shortName} pattern.`,
    targetedGuidance: strategy.priorityErrorType
      ? `Focus on: ${ERROR_TYPE_HINTS[strategy.priorityErrorType].focusArea}`
      : null,
    scaffoldLevel: 'gentle',
    focusArea: strategy.recommendedFocus,
    revealsCriticalInfo: false,
    isAdapted: !!strategy.priorityErrorType
  });

  // Hint 2: Moderate guidance
  hints.push({
    content: strategy.priorityErrorType
      ? ERROR_TYPE_HINTS[strategy.priorityErrorType].moderate
      : archetype.solutionApproach,
    targetedGuidance: `Apply the methodology: ${archetype.solutionApproach.split('.')[0]}`,
    scaffoldLevel: 'moderate',
    focusArea: strategy.recommendedFocus,
    revealsCriticalInfo: false,
    isAdapted: !!strategy.priorityErrorType
  });

  // Hint 3: Direct help (but still not the answer)
  const staticHint = question.hints?.find(h => h.revealsCriticalInfo);
  hints.push({
    content: strategy.priorityErrorType
      ? ERROR_TYPE_HINTS[strategy.priorityErrorType].direct
      : staticHint?.content || `Set up the equation: identify your unknown and what you're given.`,
    targetedGuidance: `Key insight: ${archetype.commonErrors[0] ? `Avoid the trap of "${archetype.commonErrors[0]}"` : 'Follow each step carefully'}`,
    scaffoldLevel: 'direct',
    focusArea: strategy.recommendedFocus,
    revealsCriticalInfo: true,
    isAdapted: !!strategy.priorityErrorType
  });

  return hints;
}

/**
 * Generate a hint specifically for a wrong answer selection
 */
export function generateWrongAnswerHint(
  question: FirestoreQuestion,
  selectedOption: string,
  archetypeId: ArchetypeId,
  isRepeatError: boolean
): AdaptiveHint {
  const errorType = detectErrorType(question, selectedOption);
  const archetype = getArchetypeDefinition(archetypeId);

  if (!errorType) {
    return {
      content: `That's not quite right. Think about the ${archetype.shortName} methodology.`,
      targetedGuidance: null,
      scaffoldLevel: 'gentle',
      focusArea: 'Problem approach',
      revealsCriticalInfo: false,
      isAdapted: false
    };
  }

  const errorHints = ERROR_TYPE_HINTS[errorType];
  const scaffoldLevel = isRepeatError ? 'moderate' : 'gentle';

  return {
    content: errorHints[scaffoldLevel],
    targetedGuidance: isRepeatError
      ? `You've made this type of error before. Let's focus specifically on: ${errorHints.focusArea}`
      : `Tip: ${errorHints.focusArea}`,
    scaffoldLevel,
    focusArea: errorHints.focusArea,
    revealsCriticalInfo: false,
    isAdapted: true
  };
}

/**
 * Check if student should be offered a hint proactively
 */
export function shouldOfferHint(
  timeOnQuestionSeconds: number,
  expectedTimeSeconds: number,
  attemptsOnCurrentQuestion: number,
  masteryLevel: number
): {
  shouldOffer: boolean;
  reason: string | null;
} {
  // Taking too long
  if (timeOnQuestionSeconds > expectedTimeSeconds * 1.5 && attemptsOnCurrentQuestion === 0) {
    return {
      shouldOffer: true,
      reason: "Taking a while? Would you like a hint to get started?"
    };
  }

  // Multiple wrong attempts
  if (attemptsOnCurrentQuestion >= 2) {
    return {
      shouldOffer: true,
      reason: "Let me help guide you to the right approach."
    };
  }

  // Low mastery student struggling
  if (masteryLevel <= 2 && timeOnQuestionSeconds > expectedTimeSeconds) {
    return {
      shouldOffer: true,
      reason: "Need a hint? I can help point you in the right direction."
    };
  }

  return {
    shouldOffer: false,
    reason: null
  };
}

export default {
  generateAdaptiveHint,
  getProgressiveHintSequence,
  generateWrongAnswerHint,
  shouldOfferHint
};

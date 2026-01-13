// =============================================================================
// ERROR FEEDBACK SERVICE
// =============================================================================
// FILE: src/services/nsw-selective/errorFeedbackService.ts
// DOMAIN: NSW Selective Exam Prep - AI Tutoring
// PURPOSE: Generate distractor-type-aware, personalized feedback for wrong answers
// DO NOT: Reveal correct answers, be discouraging, or use generic feedback

import { FirestoreQuestion } from '@/types';
import { DistractorType, ArchetypeProgress } from '@/types/nsw-selective';

// =============================================================================
// TYPES
// =============================================================================

export interface ErrorFeedback {
  /** The type of error made */
  errorType: DistractorType;

  /** Main feedback message */
  message: string;

  /** Whether this is a repeat error */
  isRepeatError: boolean;

  /** Count of how many times this error type has occurred */
  errorCount: number;

  /** Additional context for repeat errors */
  repeatContext?: string;

  /** Methodology reminder relevant to this error */
  methodologyReminder?: string;

  /** Socratic question to guide thinking */
  guidingQuestion?: string;

  /** Encouragement message */
  encouragement: string;
}

export interface ErrorFeedbackRequest {
  question: FirestoreQuestion;
  selectedOption: string;
  errorHistory: Partial<Record<DistractorType, number>>;
  currentStreak?: number;
  masteryLevel?: number;
}

// =============================================================================
// ERROR FEEDBACK TEMPLATES
// =============================================================================

/**
 * Templates for each distractor type
 * Each template includes:
 * - message: What went wrong (without revealing answer)
 * - guidingQuestion: Socratic question to redirect thinking
 * - methodologyHint: Which methodology step to review
 */
const ERROR_TEMPLATES: Record<DistractorType, {
  message: string;
  guidingQuestion: string;
  methodologyHint: string;
  repeatMessage: string;
}> = {
  forward_calculation: {
    message: "You applied the calculation in the forward direction, but this problem requires working backwards.",
    guidingQuestion: "Think about it: Is the value given the START or the RESULT of the operation?",
    methodologyHint: "Step 1 of the methodology: Identify what you're given vs what you need to find.",
    repeatMessage: "This is a pattern we've seen before - forward vs backwards thinking. Let's break the habit: Always ask 'What direction am I working in?'"
  },

  partial_solution: {
    message: "You're on the right track, but stopped one step too early!",
    guidingQuestion: "Re-read the question: What exactly is it asking for? Have you answered that specific question?",
    methodologyHint: "The final step is always: Check - does my answer actually answer the question asked?",
    repeatMessage: "We've noticed you sometimes stop before the finish line. Try this: After solving, physically point to what the question asks and verify your answer addresses it."
  },

  wrong_operation: {
    message: "The operation you used isn't quite right for this situation.",
    guidingQuestion: "What relationship exists between the quantities? Addition/subtraction for combining parts, multiplication/division for scaling - which applies here?",
    methodologyHint: "In the setup step, identify the relationship before choosing an operation.",
    repeatMessage: "Operation selection is tricky! Before calculating, write down the relationship in words: 'X is ___ of Y' or 'X and Y together make ___'"
  },

  computation_error: {
    message: "Your approach was correct, but there's a calculation error somewhere.",
    guidingQuestion: "Can you trace through your arithmetic step by step? Where might a slip have occurred?",
    methodologyHint: "Good news: Your methodology is sound! Just need to verify the arithmetic.",
    repeatMessage: "Calculation errors happen to everyone. Try this: Write out each step separately, and double-check division and subtraction especially."
  },

  sign_error: {
    message: "Watch the direction - there's a sign (positive/negative) issue in your working.",
    guidingQuestion: "Is the quantity increasing or decreasing? Does your calculation reflect that direction?",
    methodologyHint: "In the identify step, circle words like 'decrease', 'loss', 'less than' to flag negative operations.",
    repeatMessage: "Sign errors are sneaky! Before calculating, write down: Is this going UP (+) or DOWN (-)? Then verify your calculation matches."
  },

  unit_confusion: {
    message: "There seems to be a mix-up with units - make sure everything is in the same measurement system.",
    guidingQuestion: "What units is the question asking for? Are all your values in compatible units before calculating?",
    methodologyHint: "Before solving, convert ALL values to the same unit system.",
    repeatMessage: "Unit consistency is crucial! Start every problem by listing all given values WITH their units, then convert before calculating."
  },

  off_by_one: {
    message: "There's a counting boundary issue - check whether you're including or excluding endpoints.",
    guidingQuestion: "When counting items or intervals: Are you counting both ends? Neither? One? What does the problem require?",
    methodologyHint: "For counting problems, try listing the first few items to verify your counting method.",
    repeatMessage: "Off-by-one errors are common in counting. Try the 'fence post' check: How many posts for a 10m fence with posts every 2m? It's not 10÷2!"
  },

  misconception_answer: {
    message: "This answer comes from a common misunderstanding of how this concept works.",
    guidingQuestion: "Let's revisit the core concept: Can you explain in your own words what's really happening here?",
    methodologyHint: "Review the 'Pattern' section in the methodology - understanding WHY the method works helps avoid this trap.",
    repeatMessage: "This misconception keeps appearing. Let's address it directly: The key insight you might be missing is in the methodology pattern."
  },

  misread_question: {
    message: "Take another look at the question - there might be a detail you missed or misinterpreted.",
    guidingQuestion: "Read the question again slowly. What exactly is being asked? Are there any words like 'NOT', 'EXCEPT', or specific conditions?",
    methodologyHint: "Step 1: Read carefully and identify ALL conditions before solving.",
    repeatMessage: "Reading carefully is a skill! Try underlining key words and circling numbers before starting to solve."
  },

  conceptual_error: {
    message: "The underlying concept needs a bit more attention.",
    guidingQuestion: "Can you explain the relationship between the quantities in this problem without using numbers first?",
    methodologyHint: "Understanding the 'why' helps. Review the methodology's pattern section.",
    repeatMessage: "Building strong conceptual understanding takes time. Try explaining the concept to yourself as if teaching someone younger."
  },

  setup_error: {
    message: "The way the problem was set up needs adjustment.",
    guidingQuestion: "What equation or relationship connects the given information to what you need to find?",
    methodologyHint: "The setup step is crucial. Re-read the problem and identify: What do I know? What do I need?",
    repeatMessage: "Setup is where most problems are won or lost. Before any calculation, write: Given: ___, Find: ___, Relationship: ___"
  },

  place_value_error: {
    message: "Your answer seems to be off by a factor of 10, 100, or 1000.",
    guidingQuestion: "Check your decimal placement. Does the magnitude of your answer make sense in context?",
    methodologyHint: "When working with decimals or percentages, always verify the size of your answer is reasonable.",
    repeatMessage: "Place value errors are common. Try writing numbers with their full decimal places and count carefully when moving decimals."
  },

  inverted_ratio: {
    message: "The ratio appears to be flipped - which quantity should be on top?",
    guidingQuestion: "If the question asks for 'X per Y', is your answer X÷Y or Y÷X?",
    methodologyHint: "Always write out the ratio in words before calculating: 'A to B' means A÷B.",
    repeatMessage: "Ratio direction trips many students. Write out both ratios before calculating: 'A per B' vs 'B per A' - which did the question ask for?"
  },

  formula_confusion: {
    message: "You may have used a formula that doesn't apply here.",
    guidingQuestion: "What type of problem is this, and what formula matches that type exactly?",
    methodologyHint: "Before calculating, identify the problem type and write down the correct formula.",
    repeatMessage: "Formula selection is critical. Keep a mental library: When do I use each formula? What does each one find?"
  },

  middle_value_trap: {
    message: "This answer looks plausible but wasn't calculated correctly.",
    guidingQuestion: "Did you work through the calculation step by step, or did you estimate or pick what 'looked right'?",
    methodologyHint: "Trust your methodology. Work through each step - don't shortcut because an answer 'looks reasonable'.",
    repeatMessage: "Exam writers often include trap answers that look right. Always calculate fully - never guess based on appearance."
  }
};

// =============================================================================
// ENCOURAGEMENT MESSAGES
// =============================================================================

const ENCOURAGEMENT_MESSAGES = {
  firstError: [
    "No worries! Every mistake is a learning opportunity.",
    "Good attempt! Let's figure this out together.",
    "Almost there! Let's look at this from another angle."
  ],
  repeatError: [
    "This is a tricky pattern, but you're getting better at recognizing it.",
    "Every time we work through this, your understanding deepens.",
    "Persistence is key - you're building mastery one step at a time."
  ],
  breakingStreak: [
    "Hey, that's okay! You had a great run. Let's learn from this one.",
    "Even with a streak going, mistakes help us grow. Let's see what happened.",
    "Good news: You were doing great! This is just a chance to strengthen one area."
  ],
  lowMastery: [
    "You're in the learning zone - this is exactly where growth happens!",
    "Every question you work through is building your skills.",
    "Remember: Everyone starts somewhere. You're making progress!"
  ],
  highMastery: [
    "Interesting! Even masters encounter tricky questions. Let's analyze this.",
    "Good to find these edge cases - they sharpen your skills.",
    "This shows you're pushing into challenging territory. That's how you grow!"
  ]
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getEncouragement(
  isRepeat: boolean,
  currentStreak: number,
  masteryLevel: number
): string {
  if (currentStreak >= 3) {
    return getRandomItem(ENCOURAGEMENT_MESSAGES.breakingStreak);
  }
  if (isRepeat) {
    return getRandomItem(ENCOURAGEMENT_MESSAGES.repeatError);
  }
  if (masteryLevel <= 2) {
    return getRandomItem(ENCOURAGEMENT_MESSAGES.lowMastery);
  }
  if (masteryLevel >= 4) {
    return getRandomItem(ENCOURAGEMENT_MESSAGES.highMastery);
  }
  return getRandomItem(ENCOURAGEMENT_MESSAGES.firstError);
}

// =============================================================================
// MAIN FUNCTION
// =============================================================================

/**
 * Generate personalized feedback for a wrong answer
 *
 * This function:
 * 1. Identifies the error type from the question's distractor mapping
 * 2. Checks if this is a repeat error pattern
 * 3. Generates contextual feedback without revealing the answer
 * 4. Provides Socratic guidance toward the correct approach
 */
export function generateErrorFeedback(request: ErrorFeedbackRequest): ErrorFeedback {
  const {
    question,
    selectedOption,
    errorHistory,
    currentStreak = 0,
    masteryLevel = 1
  } = request;

  // Get the error type for this wrong answer
  const distractorTypes = question.nswSelective?.distractorTypes || {};
  const errorType = (distractorTypes[selectedOption] as DistractorType) || 'conceptual_error';

  // Check error history
  const previousCount = errorHistory[errorType] || 0;
  const isRepeatError = previousCount >= 1;
  const totalErrorCount = previousCount + 1;

  // Get template for this error type
  const template = ERROR_TEMPLATES[errorType] || ERROR_TEMPLATES.conceptual_error;

  // Build feedback
  const feedback: ErrorFeedback = {
    errorType,
    message: template.message,
    isRepeatError,
    errorCount: totalErrorCount,
    guidingQuestion: template.guidingQuestion,
    methodologyReminder: template.methodologyHint,
    encouragement: getEncouragement(isRepeatError, currentStreak, masteryLevel)
  };

  // Add repeat context if this error has happened before
  if (isRepeatError) {
    feedback.repeatContext = template.repeatMessage;

    // Escalate for frequent errors
    if (totalErrorCount >= 3) {
      feedback.repeatContext = `This is the ${totalErrorCount}th time we've seen this pattern. ${template.repeatMessage}`;
    }
  }

  // Add methodology reminder from question if available
  if (question.nswSelective?.methodologySteps && question.nswSelective.methodologySteps.length > 0) {
    // Find the most relevant methodology step based on error type
    const steps = question.nswSelective.methodologySteps;
    const relevantStep = findRelevantMethodologyStep(errorType, steps);
    if (relevantStep) {
      feedback.methodologyReminder = `📋 From the methodology: "${relevantStep}"`;
    }
  }

  return feedback;
}

/**
 * Find the most relevant methodology step for a given error type
 */
function findRelevantMethodologyStep(errorType: DistractorType, steps: string[]): string | null {
  // Keywords that suggest which step is relevant for each error type
  const stepKeywords: Partial<Record<DistractorType, string[]>> = {
    forward_calculation: ['identify', 'recognise', 'given', 'find'],
    partial_solution: ['check', 'verify', 'answer', 'final'],
    wrong_operation: ['set up', 'equation', 'relationship', 'multiply', 'divide'],
    setup_error: ['set up', 'equation', 'translate', 'relationship'],
    computation_error: ['calculate', 'solve', 'compute'],
    misconception_answer: ['understand', 'concept', 'means', 'pattern'],
    misread_question: ['read', 'identify', 'given', 'ask']
  };

  const keywords = stepKeywords[errorType] || [];

  for (const step of steps) {
    const stepLower = step.toLowerCase();
    if (keywords.some(kw => stepLower.includes(kw))) {
      return step;
    }
  }

  // Return first step as fallback
  return steps[0] || null;
}

/**
 * Check if student should receive an intervention
 * (popup methodology coach after multiple errors)
 */
export function shouldTriggerIntervention(
  errorHistory: Partial<Record<DistractorType, number>>,
  sessionErrorCount: number,
  sessionQuestionCount: number
): { shouldIntervene: boolean; reason?: string; focusErrorType?: DistractorType } {
  // Trigger if same error type occurs 3+ times
  for (const [errorType, count] of Object.entries(errorHistory)) {
    if (count >= 3) {
      return {
        shouldIntervene: true,
        reason: 'repeat_error',
        focusErrorType: errorType as DistractorType
      };
    }
  }

  // Trigger if error rate > 60% after 5+ questions
  if (sessionQuestionCount >= 5) {
    const errorRate = sessionErrorCount / sessionQuestionCount;
    if (errorRate > 0.6) {
      // Find most common error type
      let maxCount = 0;
      let maxType: DistractorType = 'conceptual_error';
      for (const [errorType, count] of Object.entries(errorHistory)) {
        if (count > maxCount) {
          maxCount = count;
          maxType = errorType as DistractorType;
        }
      }
      return {
        shouldIntervene: true,
        reason: 'high_error_rate',
        focusErrorType: maxType
      };
    }
  }

  return { shouldIntervene: false };
}

/**
 * Get a summary of error patterns for insights/session summary
 */
export function summarizeErrorPatterns(
  errorHistory: Partial<Record<DistractorType, number>>
): {
  topErrors: Array<{ type: DistractorType; count: number; description: string }>;
  totalErrors: number;
  hasPattern: boolean;
} {
  const entries = Object.entries(errorHistory) as [DistractorType, number][];
  const totalErrors = entries.reduce((sum, [, count]) => sum + count, 0);

  if (totalErrors === 0) {
    return { topErrors: [], totalErrors: 0, hasPattern: false };
  }

  // Sort by count descending
  const sorted = entries.sort((a, b) => b[1] - a[1]);

  // Get descriptions for top errors
  const errorDescriptions: Record<DistractorType, string> = {
    forward_calculation: 'Applying operations in the wrong direction',
    partial_solution: 'Stopping before completing all steps',
    wrong_operation: 'Using incorrect mathematical operations',
    computation_error: 'Arithmetic mistakes in calculations',
    sign_error: 'Positive/negative sign confusion',
    unit_confusion: 'Mixing up or ignoring units',
    off_by_one: 'Counting boundary errors',
    misconception_answer: 'Conceptual misunderstanding',
    misread_question: 'Missing details in the question',
    conceptual_error: 'Core concept needs review',
    setup_error: 'Problem setup issues',
    place_value_error: 'Decimal or place value mistakes',
    inverted_ratio: 'Ratio direction confusion',
    formula_confusion: 'Using wrong formula',
    middle_value_trap: 'Falling for plausible-looking answers'
  };

  const topErrors = sorted.slice(0, 3).map(([type, count]) => ({
    type,
    count,
    description: errorDescriptions[type] || 'Unknown error type'
  }));

  // Has pattern if one error type is > 40% of total
  const hasPattern = sorted.length > 0 && sorted[0][1] / totalErrors > 0.4;

  return { topErrors, totalErrors, hasPattern };
}

export default {
  generateErrorFeedback,
  shouldTriggerIntervention,
  summarizeErrorPatterns
};

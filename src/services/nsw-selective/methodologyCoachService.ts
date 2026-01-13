// =============================================================================
// METHODOLOGY COACH SERVICE
// =============================================================================
// FILE: src/services/nsw-selective/methodologyCoachService.ts
// DOMAIN: NSW Selective Exam Prep - AI Tutoring
// PURPOSE: Provide methodology coaching in intro, intervention, and on-demand modes
// DO NOT: Reveal answers or be discouraging

import { FirestoreQuestion, ArchetypeId } from '@/types';
import { ArchetypeDefinition, getArchetypeDefinition, DistractorType } from '@/types/nsw-selective';

// =============================================================================
// TYPES
// =============================================================================

export type CoachingMode = 'intro' | 'intervention' | 'on-demand';

export interface MethodologyCoachRequest {
  archetypeId: ArchetypeId;
  mode: CoachingMode;
  context?: {
    question?: FirestoreQuestion;
    errorHistory?: Partial<Record<DistractorType, number>>;
    previousAttempts?: string[]; // Wrong options already tried
    consecutiveWrong?: number;
    masteryLevel?: number;
  };
}

export interface MethodologyLesson {
  type: 'lesson';
  title: string;
  pattern: string;
  approach: string;
  steps: string[];
  commonTraps: string[];
  workedExample?: WorkedExample;
  interactiveQuestions?: SocraticQuestion[];
}

export interface SocraticIntervention {
  type: 'socratic';
  title: string;
  encouragement: string;
  questions: SocraticQuestion[];
  methodologyReminder: string;
  adaptedToError?: string; // Specific guidance based on error pattern
}

export interface OnDemandExplanation {
  type: 'explanation';
  title: string;
  steps: string[];
  workedExample?: WorkedExample;
  tips: string[];
}

export interface WorkedExample {
  problem: string;
  steps: Array<{
    step: number;
    action: string;
    result: string;
  }>;
  answer: string;
}

export interface SocraticQuestion {
  question: string;
  hint?: string;
  targetMisconception?: DistractorType;
}

export type MethodologyGuidance = MethodologyLesson | SocraticIntervention | OnDemandExplanation;

// =============================================================================
// WORKED EXAMPLES BY ARCHETYPE
// =============================================================================

const WORKED_EXAMPLES: Partial<Record<ArchetypeId, WorkedExample>> = {
  qa13: {
    problem: "After a 25% discount, a shirt costs $60. What was the original price?",
    steps: [
      { step: 1, action: "Identify: This is REVERSE percentage (final given, original wanted)", result: "Type: Reverse with decrease" },
      { step: 2, action: "Set up: 25% discount means Sale Price = Original × 0.75", result: "$60 = Original × 0.75" },
      { step: 3, action: "Solve: Divide both sides by 0.75", result: "Original = $60 ÷ 0.75 = $80" },
      { step: 4, action: "Check: Does $80 with 25% off = $60?", result: "$80 × 0.75 = $60 ✓" }
    ],
    answer: "$80"
  },
  qa7: {
    problem: "In a class, 15 students play soccer, 12 play basketball, and 5 play both. How many play at least one sport?",
    steps: [
      { step: 1, action: "Draw a Venn diagram with two overlapping circles", result: "Soccer circle, Basketball circle, overlap in middle" },
      { step: 2, action: "Fill in the overlap first (both sports)", result: "Overlap = 5" },
      { step: 3, action: "Calculate soccer-only: Total soccer - both", result: "15 - 5 = 10 soccer-only" },
      { step: 4, action: "Calculate basketball-only: Total basketball - both", result: "12 - 5 = 7 basketball-only" },
      { step: 5, action: "Add all regions: soccer-only + both + basketball-only", result: "10 + 5 + 7 = 22" }
    ],
    answer: "22 students"
  },
  qa20: {
    problem: "A car travels 150 km in 2.5 hours. What is its average speed?",
    steps: [
      { step: 1, action: "Identify the formula: Speed = Distance ÷ Time", result: "S = D/T" },
      { step: 2, action: "Substitute values", result: "S = 150 km ÷ 2.5 hours" },
      { step: 3, action: "Calculate", result: "S = 60 km/h" },
      { step: 4, action: "Check: Does 60 km/h × 2.5 hours = 150 km?", result: "60 × 2.5 = 150 ✓" }
    ],
    answer: "60 km/h"
  },
  qa4: {
    problem: "A train leaves Station A at 9:00 AM traveling at 80 km/h. Another train leaves Station B (200 km away) at 9:30 AM traveling toward Station A at 100 km/h. When do they meet?",
    steps: [
      { step: 1, action: "Calculate how far Train A travels in 30 min before Train B starts", result: "80 × 0.5 = 40 km" },
      { step: 2, action: "Find remaining distance when both are moving", result: "200 - 40 = 160 km" },
      { step: 3, action: "Combined speed when traveling toward each other", result: "80 + 100 = 180 km/h" },
      { step: 4, action: "Time to meet = Remaining distance ÷ Combined speed", result: "160 ÷ 180 = 8/9 hours ≈ 53 min" },
      { step: 5, action: "Add to Train B's start time", result: "9:30 AM + 53 min ≈ 10:23 AM" }
    ],
    answer: "10:23 AM"
  },
  qa17: {
    problem: "Emma is 4 years older than Liam. In 3 years, Emma will be twice Liam's current age. How old is Liam now?",
    steps: [
      { step: 1, action: "Let Liam's current age = L", result: "Emma's current age = L + 4" },
      { step: 2, action: "In 3 years, Emma's age will be", result: "(L + 4) + 3 = L + 7" },
      { step: 3, action: "Set up equation: Emma in 3 years = 2 × Liam now", result: "L + 7 = 2L" },
      { step: 4, action: "Solve for L", result: "7 = L, so Liam is 7" },
      { step: 5, action: "Check: Emma is 11, in 3 years she's 14, which is 2 × 7", result: "14 = 2 × 7 ✓" }
    ],
    answer: "Liam is 7 years old"
  }
};

// =============================================================================
// SOCRATIC QUESTIONS BY ERROR TYPE
// =============================================================================

const SOCRATIC_QUESTIONS_BY_ERROR: Record<DistractorType, SocraticQuestion[]> = {
  forward_calculation: [
    { question: "In this problem, what value are we given - the starting point or the end result?", hint: "Look for words like 'after', 'now costs', 'sale price'" },
    { question: "If we're working backwards, should we multiply or divide?", hint: "Reversing multiplication means dividing" },
    { question: "Let's check: if your answer is the original, does applying the percentage change give us the value in the question?" }
  ],
  partial_solution: [
    { question: "Have you completed ALL the steps the question is asking for?", hint: "Re-read what the question is asking for" },
    { question: "Is there one more operation you need to do with your current answer?", hint: "Sometimes we find an intermediate value first" },
    { question: "What exactly does the question ask you to find?" }
  ],
  wrong_operation: [
    { question: "What operation does this type of problem typically need?", hint: "Think about the relationship between the quantities" },
    { question: "If we're finding a larger original amount from a smaller final amount, what should happen to the number?", hint: "Should it get bigger or smaller?" },
    { question: "Let's trace through: what mathematical relationship connects these values?" }
  ],
  computation_error: [
    { question: "Can you show me your working step by step?", hint: "Let's find where the slip happened" },
    { question: "What calculation did you do? Let's check it together.", hint: "Sometimes rewriting helps catch errors" },
    { question: "Try the calculation again - take your time with each step" }
  ],
  sign_error: [
    { question: "Is this an increase or a decrease?", hint: "Look for words like 'more', 'less', 'increase', 'decrease'" },
    { question: "When something increases by a percentage, is the new value bigger or smaller than the original?" },
    { question: "What happens to the number when we apply this change - does it go up or down?" }
  ],
  unit_confusion: [
    { question: "What units are given in the question?", hint: "Look at all the numbers - what are they measuring?" },
    { question: "What units does your answer need to be in?", hint: "Check what the question is asking for" },
    { question: "Do all your units match up in your calculation?" }
  ],
  off_by_one: [
    { question: "Are you counting the starting point or not?", hint: "Does the range include the endpoints?" },
    { question: "Let's count together from the beginning - what's the first item?", hint: "Sometimes we need to include both ends, sometimes neither" },
    { question: "How many items are there from A to B, inclusive?" }
  ],
  misconception_answer: [
    { question: "What's the key concept we need to apply here?", hint: "Think about what type of problem this is" },
    { question: "Let me check your understanding: can you explain what this type of problem is asking?", hint: "Sometimes restating the problem helps" },
    { question: "What's the relationship between the values in this problem?" }
  ],
  misread_question: [
    { question: "Let's re-read the question carefully. What exactly is it asking for?", hint: "Underline the key words" },
    { question: "Are there any conditions or constraints in the question we might have missed?", hint: "Look for words like 'remaining', 'total', 'each'" },
    { question: "What information does the question give us? List each piece." }
  ],
  conceptual_error: [
    { question: "What concept or formula applies to this type of problem?", hint: "Think about what we're trying to find and what we know" },
    { question: "Can you explain in your own words what this problem is about?" },
    { question: "Have you seen a similar problem before? What approach did we use?" }
  ],
  setup_error: [
    { question: "What equation or relationship should we set up?", hint: "What equals what in this problem?" },
    { question: "Let's identify our unknown. What are we solving for?", hint: "Give it a variable name" },
    { question: "How do the given values relate to what we're finding?" }
  ],
  place_value_error: [
    { question: "How big should your answer be roughly?", hint: "Use estimation to check magnitude" },
    { question: "Let's count the decimal places - how many are there in each number?", hint: "Track decimals through each step" },
    { question: "Does the size of your answer make sense in the context of the problem?" }
  ],
  inverted_ratio: [
    { question: "What two quantities are being compared?", hint: "Identify what goes on top and what goes on bottom" },
    { question: "Is the question asking for 'A per B' or 'B per A'?", hint: "The wording tells you which way round" },
    { question: "If A is bigger than B, should the ratio be more or less than 1?" }
  ],
  formula_confusion: [
    { question: "What type of problem is this?", hint: "Identify the category before choosing a formula" },
    { question: "What formula matches this specific situation?", hint: "Think about what you're trying to find" },
    { question: "Can you write down the formula you're using before substituting numbers?" }
  ],
  middle_value_trap: [
    { question: "Did you actually calculate this answer, or did it just look reasonable?", hint: "Always work through the math" },
    { question: "Can you show me the working that led to this answer?", hint: "Step by step calculation" },
    { question: "Exam writers often include plausible-looking wrong answers - let's verify with calculation." }
  ]
};

// =============================================================================
// ENCOURAGEMENT MESSAGES
// =============================================================================

const INTERVENTION_ENCOURAGEMENTS = [
  "Let's pause and work through this together - that's how we build real understanding!",
  "I can see you're thinking hard about this. Let me guide you with some questions.",
  "Don't worry - tricky problems like this are exactly how we grow stronger.",
  "You're on the right track! Let's slow down and think step by step.",
  "Great effort so far. Let's break this down together."
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getMostCommonError(errorHistory: Partial<Record<DistractorType, number>>): DistractorType | null {
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

// =============================================================================
// MAIN FUNCTIONS
// =============================================================================

/**
 * Generate an introduction lesson for an archetype
 * Shows before the student starts practicing
 */
export function generateIntroLesson(archetypeId: ArchetypeId): MethodologyLesson {
  const archetype = getArchetypeDefinition(archetypeId);

  return {
    type: 'lesson',
    title: `How to Solve: ${archetype.shortName}`,
    pattern: archetype.pattern,
    approach: archetype.solutionApproach,
    steps: [
      `Step 1: Identify the type of ${archetype.shortName} problem`,
      `Step 2: Set up the relationship or equation`,
      `Step 3: Solve systematically`,
      `Step 4: Check your answer makes sense`
    ],
    commonTraps: archetype.commonErrors,
    workedExample: WORKED_EXAMPLES[archetypeId],
    interactiveQuestions: [
      { question: `What makes a problem a "${archetype.shortName}" type?`, hint: archetype.pattern },
      { question: "What's the first step you should always do?", hint: "Identify and understand what's being asked" },
      { question: "Why is checking your answer important?", hint: "It catches errors before you move on" }
    ]
  };
}

/**
 * Generate Socratic intervention when student is struggling
 * Never reveals the answer - guides through questions
 */
export function generateSocraticIntervention(
  archetypeId: ArchetypeId,
  context: {
    question?: FirestoreQuestion;
    errorHistory?: Partial<Record<DistractorType, number>>;
    previousAttempts?: string[];
    consecutiveWrong?: number;
  }
): SocraticIntervention {
  const archetype = getArchetypeDefinition(archetypeId);
  const mostCommonError = context.errorHistory ? getMostCommonError(context.errorHistory) : null;

  // Select Socratic questions based on error patterns
  let questions: SocraticQuestion[] = [];

  if (mostCommonError && SOCRATIC_QUESTIONS_BY_ERROR[mostCommonError]) {
    // Get questions targeting the specific error type
    questions = SOCRATIC_QUESTIONS_BY_ERROR[mostCommonError].slice(0, 3);
  } else {
    // Generic Socratic questions for the archetype
    questions = [
      { question: "What type of problem is this?", hint: archetype.pattern },
      { question: "What information does the question give you?", hint: "List all the values and what they represent" },
      { question: `What's the ${archetype.shortName} approach for this type?`, hint: archetype.solutionApproach }
    ];
  }

  // Generate adapted guidance if we know the error type
  let adaptedToError: string | undefined;
  if (mostCommonError) {
    const errorDescriptions: Record<DistractorType, string> = {
      forward_calculation: "working in the wrong direction (applying percentage forward instead of reverse)",
      partial_solution: "stopping before completing all steps",
      wrong_operation: "using the wrong mathematical operation",
      computation_error: "making arithmetic mistakes (the approach is right!)",
      sign_error: "getting increase/decrease direction wrong",
      unit_confusion: "mixing up or forgetting units",
      off_by_one: "counting errors at boundaries",
      misconception_answer: "a conceptual misunderstanding",
      misread_question: "missing details in the question",
      conceptual_error: "how this concept works",
      setup_error: "setting up the problem correctly",
      place_value_error: "making decimal or place value mistakes",
      inverted_ratio: "getting the ratio direction backwards",
      formula_confusion: "using the wrong formula for this problem type",
      middle_value_trap: "picking an answer that looks right without calculating"
    };
    adaptedToError = `I notice you might be ${errorDescriptions[mostCommonError]}. Let's focus on that.`;
  }

  return {
    type: 'socratic',
    title: "Let's Work Through This Together",
    encouragement: getRandomItem(INTERVENTION_ENCOURAGEMENTS),
    questions,
    methodologyReminder: `Remember the ${archetype.shortName} approach: ${archetype.solutionApproach}`,
    adaptedToError
  };
}

/**
 * Generate on-demand explanation when student asks for help
 */
export function generateOnDemandExplanation(archetypeId: ArchetypeId): OnDemandExplanation {
  const archetype = getArchetypeDefinition(archetypeId);

  return {
    type: 'explanation',
    title: `${archetype.shortName} - Quick Reference`,
    steps: [
      `1. Identify: Recognize this as a ${archetype.shortName} problem`,
      `2. Set up: ${archetype.solutionApproach}`,
      `3. Solve: Work through systematically`,
      `4. Check: Verify your answer makes sense`
    ],
    workedExample: WORKED_EXAMPLES[archetypeId],
    tips: [
      ...archetype.commonErrors.map(error => `Avoid: ${error}`),
      `Key insight: ${archetype.pattern}`
    ]
  };
}

/**
 * Main function to get methodology guidance based on mode
 */
export function getMethodologyGuidance(request: MethodologyCoachRequest): MethodologyGuidance {
  const { archetypeId, mode, context } = request;

  switch (mode) {
    case 'intro':
      return generateIntroLesson(archetypeId);

    case 'intervention':
      return generateSocraticIntervention(archetypeId, context || {});

    case 'on-demand':
      return generateOnDemandExplanation(archetypeId);

    default:
      return generateOnDemandExplanation(archetypeId);
  }
}

/**
 * Determine if intervention should be triggered
 */
export function shouldTriggerMethodologyIntervention(
  consecutiveWrong: number,
  sessionAccuracy: number,
  questionsAnswered: number
): boolean {
  // Trigger if:
  // 1. 2+ consecutive wrong answers
  // 2. Accuracy drops below 40% after 5+ questions
  return consecutiveWrong >= 2 || (questionsAnswered >= 5 && sessionAccuracy < 40);
}

export default {
  getMethodologyGuidance,
  generateIntroLesson,
  generateSocraticIntervention,
  generateOnDemandExplanation,
  shouldTriggerMethodologyIntervention
};

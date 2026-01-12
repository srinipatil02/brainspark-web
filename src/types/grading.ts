// =============================================================================
// GRADING & FEEDBACK TYPES
// Types for answer evaluation, scoring, and learning analytics
// =============================================================================

// -----------------------------------------------------------------------------
// Core Enums & Types
// -----------------------------------------------------------------------------

export type Correctness = 'correct' | 'partial' | 'incorrect';
export type MasteryLevel = 'novice' | 'developing' | 'proficient' | 'mastered';
export type GraderType = 'auto' | 'ai' | 'human';

// -----------------------------------------------------------------------------
// Feedback Structure
// -----------------------------------------------------------------------------

export interface GradingFeedback {
  /** Overall summary of the grading result */
  summary: string;
  /** What the student got right */
  whatWasRight: string[];
  /** What was missing or incomplete */
  whatWasMissing: string[];
  /** Misconceptions identified in the answer */
  misconceptions: string[];
  /** Suggestions for improvement */
  suggestions: string[];
}

// -----------------------------------------------------------------------------
// Rubric Scoring (for SHORT_ANSWER and EXTENDED_RESPONSE)
// -----------------------------------------------------------------------------

export interface RubricScore {
  criterion: string;
  score: number;
  maxScore: number;
  feedback?: string;
}

export interface GradingRubric {
  maxMarks: number;
  criteria: {
    name: string;
    maxMarks: number;
    descriptors?: {
      marks: number;
      description: string;
    }[];
  }[];
}

// -----------------------------------------------------------------------------
// Grading Result
// -----------------------------------------------------------------------------

export interface GradingResult {
  // Core scores
  score: number;
  maxScore: number;
  percentage: number;
  correctness: Correctness;

  // Detailed feedback
  feedback: GradingFeedback;

  // Rubric breakdown (optional, for SHORT_ANSWER/EXTENDED)
  rubricScores?: RubricScore[];

  // Concept tracking (optional)
  conceptsAssessed?: string[];
  conceptsMastered?: string[];
  conceptsToReview?: string[];

  // Metadata
  gradedAt: string;
  gradedBy: GraderType;
  confidence: number;
}

// -----------------------------------------------------------------------------
// Grading Request
// -----------------------------------------------------------------------------

export interface MCQOption {
  id: string;
  text: string;
  isCorrect: boolean;
  feedback?: string;
}

export interface GradingRequest {
  questionId: string;
  questionType: 'MCQ' | 'SHORT_ANSWER' | 'EXTENDED_RESPONSE' | 'EQUATION_ENTRY' | 'MULTI_STEP_MATH' | 'WORKED_SOLUTION';
  questionStem: string;
  modelSolution: string;
  studentAnswer: string;

  // MCQ-specific
  selectedOptionId?: string;
  correctOptionId?: string;
  mcqOptions?: MCQOption[];

  // WORKED_SOLUTION / Math specific
  correctAnswer?: string;  // Expected answer for math questions

  // Context
  curriculum?: {
    subject: string;
    year: number;
    topic?: string;
    strand?: string;
    concepts?: string[];
  };
  difficulty: number;
}

// -----------------------------------------------------------------------------
// Math-Specific Grading Types
// -----------------------------------------------------------------------------

export interface MathStepAnswer {
  stepNumber: number;
  latex: string;
  plainText: string;
  timeSpentMs?: number;
}

export interface MathStepResult {
  stepNumber: number;
  score: number;
  maxScore: number;
  isCorrect: boolean;
  feedback: string;
  hintsUsed: number;
}

export interface MathGradingRequest extends Omit<GradingRequest, 'questionType' | 'studentAnswer'> {
  questionType: 'EQUATION_ENTRY' | 'MULTI_STEP_MATH';

  // Math answer format
  studentAnswerLatex: string;
  studentAnswerPlainText: string;
  studentAnswerNumeric?: number;

  // For multi-step questions
  studentSteps?: MathStepAnswer[];
  expectedSteps?: {
    stepNumber: number;
    expectedPatterns: string[];  // Acceptable LaTeX patterns
    rubricWeight: number;
  }[];

  // Grading options
  numericTolerance?: number;           // e.g., 0.01 for 1% tolerance
  acceptEquivalentForms?: boolean;     // "2x+3" = "3+2x"
  acceptableFormats?: string[];        // ["decimal", "fraction", "percent"]
}

export interface MathGradingResult extends GradingResult {
  // Step-by-step results (for MULTI_STEP_MATH)
  stepResults?: MathStepResult[];

  // Math-specific analysis
  mathematicallyCorrect?: boolean;
  equivalentFormUsed?: boolean;
  computationErrors?: string[];
  algebraicErrors?: string[];

  // WORKED_SOLUTION specific - process-focused scoring
  processScore?: number;  // Score for reasoning/process (student-centered)
}

// -----------------------------------------------------------------------------
// Question Result (stored in progress)
// -----------------------------------------------------------------------------

export interface QuestionResult {
  answer: string;
  score: number;
  maxScore: number;
  percentage: number;
  correctness: Correctness;
  gradedAt: string;
  gradedBy: GraderType;
  attemptNumber: number;
  feedback?: GradingFeedback;  // Optional for backwards compatibility with existing data
  // Concept tracking for weakness analysis
  conceptsAssessed?: string[];
  conceptsMastered?: string[];
  conceptsToReview?: string[];
}

// -----------------------------------------------------------------------------
// Set Attempt (complete attempt at a question set)
// -----------------------------------------------------------------------------

export interface SetAttempt {
  attemptId: string;
  setId: string;
  startedAt: string;
  completedAt: string;

  // Progress metrics
  questionsAttempted: number;
  questionsCorrect: number;
  questionsPartial: number;
  questionsIncorrect: number;

  // Score metrics
  totalScore: number;
  totalMaxScore: number;
  percentage: number;
  masteryLevel: MasteryLevel;

  // Concept analysis for weakness report
  conceptsAssessed: string[];
  conceptsMastered: string[];
  conceptsToReview: string[];  // WEAK AREAS
  misconceptions: string[];    // Common errors made

  // Detailed results per question (snapshot)
  questionResults: QuestionResultSnapshot[];
}

export interface QuestionResultSnapshot {
  questionIndex: number;
  questionId?: string;
  answer: string;
  score: number;
  maxScore: number;
  percentage: number;
  correctness: Correctness;
  conceptsToReview?: string[];
}

// -----------------------------------------------------------------------------
// Set Metadata for Dashboard
// -----------------------------------------------------------------------------

export interface SetMetadataForDashboard {
  setId: string;
  subject: string;
  topic: string;
  year: number;
  setNumber: number;
  title: string;
}

// -----------------------------------------------------------------------------
// Attempt Summary for Dashboard Display
// -----------------------------------------------------------------------------

export interface AttemptSummary {
  attemptId: string;
  setMetadata: SetMetadataForDashboard;
  completedAt: string;
  questionsAttempted: number;
  questionsCorrect: number;
  totalScore: number;
  totalMaxScore: number;
  percentage: number;
  masteryLevel: MasteryLevel;
  conceptsToReview: string[];
}

// -----------------------------------------------------------------------------
// Mastery Utilities
// -----------------------------------------------------------------------------

export function getMasteryLevel(percentage: number): MasteryLevel {
  if (percentage >= 80) return 'mastered';
  if (percentage >= 60) return 'proficient';
  if (percentage >= 40) return 'developing';
  return 'novice';
}

export function getCorrectnessFromPercentage(percentage: number): Correctness {
  if (percentage >= 80) return 'correct';
  if (percentage >= 40) return 'partial';
  return 'incorrect';
}

// -----------------------------------------------------------------------------
// Mastery Configuration (for UI styling)
// -----------------------------------------------------------------------------

export const MASTERY_CONFIG: Record<MasteryLevel, {
  color: string;
  bgLight: string;
  bgSolid: string;
  text: string;
  border: string;
  label: string;
  emoji: string;
}> = {
  novice: {
    color: 'red',
    bgLight: 'bg-red-50',
    bgSolid: 'bg-red-500',
    text: 'text-red-600',
    border: 'border-red-200',
    label: 'Keep Practicing',
    emoji: '📚',
  },
  developing: {
    color: 'orange',
    bgLight: 'bg-orange-50',
    bgSolid: 'bg-orange-500',
    text: 'text-orange-600',
    border: 'border-orange-200',
    label: 'Getting There',
    emoji: '🌱',
  },
  proficient: {
    color: 'blue',
    bgLight: 'bg-blue-50',
    bgSolid: 'bg-blue-500',
    text: 'text-blue-600',
    border: 'border-blue-200',
    label: 'Good Job!',
    emoji: '👍',
  },
  mastered: {
    color: 'green',
    bgLight: 'bg-green-50',
    bgSolid: 'bg-green-500',
    text: 'text-green-600',
    border: 'border-green-200',
    label: 'Mastered!',
    emoji: '⭐',
  },
};

// -----------------------------------------------------------------------------
// Correctness Configuration (for UI styling)
// -----------------------------------------------------------------------------

export const CORRECTNESS_CONFIG: Record<Correctness, {
  bgSolid: string;
  bgLight: string;
  text: string;
  border: string;
  icon: 'check' | 'partial' | 'x';
  label: string;
}> = {
  correct: {
    bgSolid: 'bg-green-500',
    bgLight: 'bg-green-50',
    text: 'text-green-600',
    border: 'border-green-200',
    icon: 'check',
    label: 'Correct!',
  },
  partial: {
    bgSolid: 'bg-orange-500',
    bgLight: 'bg-orange-50',
    text: 'text-orange-600',
    border: 'border-orange-200',
    icon: 'partial',
    label: 'Partially Correct',
  },
  incorrect: {
    bgSolid: 'bg-red-500',
    bgLight: 'bg-red-50',
    text: 'text-red-600',
    border: 'border-red-200',
    icon: 'x',
    label: 'Incorrect',
  },
};

// -----------------------------------------------------------------------------
// Points Calculation
// -----------------------------------------------------------------------------

/**
 * Calculate maximum points based on question type and difficulty
 */
export function calculateMaxPoints(
  questionType: 'MCQ' | 'SHORT_ANSWER' | 'EXTENDED_RESPONSE' | 'EQUATION_ENTRY' | 'MULTI_STEP_MATH' | 'WORKED_SOLUTION',
  difficulty: number
): number {
  const pointsMatrix: Record<string, number[]> = {
    MCQ: [1, 1, 2, 2, 3],
    SHORT_ANSWER: [2, 3, 4, 5, 6],
    EXTENDED_RESPONSE: [4, 6, 8, 10, 12],
    EQUATION_ENTRY: [2, 3, 4, 5, 6],      // Same as SHORT_ANSWER
    MULTI_STEP_MATH: [4, 6, 8, 10, 12],   // Same as EXTENDED_RESPONSE (process-focused)
    WORKED_SOLUTION: [4, 6, 8, 10, 12],   // Student-centered "show your work" - values process
  };

  const difficultyIndex = Math.max(0, Math.min(4, difficulty - 1));
  return pointsMatrix[questionType]?.[difficultyIndex] ?? 1;
}

// -----------------------------------------------------------------------------
// Default Rubrics
// -----------------------------------------------------------------------------

export const SHORT_ANSWER_RUBRIC: GradingRubric = {
  maxMarks: 4,
  criteria: [
    {
      name: 'Understanding',
      maxMarks: 2,
      descriptors: [
        { marks: 2, description: 'Demonstrates clear understanding of the concept' },
        { marks: 1, description: 'Shows partial understanding' },
        { marks: 0, description: 'Does not demonstrate understanding' },
      ],
    },
    {
      name: 'Accuracy',
      maxMarks: 1,
      descriptors: [
        { marks: 1, description: 'Information is accurate' },
        { marks: 0, description: 'Contains inaccuracies' },
      ],
    },
    {
      name: 'Terminology',
      maxMarks: 1,
      descriptors: [
        { marks: 1, description: 'Uses appropriate terminology' },
        { marks: 0, description: 'Lacks appropriate terminology' },
      ],
    },
  ],
};

export const EXTENDED_RESPONSE_RUBRIC: GradingRubric = {
  maxMarks: 10,
  criteria: [
    {
      name: 'Content Knowledge',
      maxMarks: 4,
      descriptors: [
        { marks: 4, description: 'Comprehensive, accurate understanding with examples' },
        { marks: 3, description: 'Good understanding with minor gaps' },
        { marks: 2, description: 'Basic understanding, some inaccuracies' },
        { marks: 1, description: 'Limited understanding, significant gaps' },
        { marks: 0, description: 'Incorrect or irrelevant content' },
      ],
    },
    {
      name: 'Scientific Reasoning',
      maxMarks: 3,
      descriptors: [
        { marks: 3, description: 'Clear logical connections, cause-effect explained' },
        { marks: 2, description: 'Some reasoning shown, connections made' },
        { marks: 1, description: 'Limited reasoning, few connections' },
        { marks: 0, description: 'No reasoning or illogical' },
      ],
    },
    {
      name: 'Communication',
      maxMarks: 3,
      descriptors: [
        { marks: 3, description: 'Clear, well-organized, uses terminology correctly' },
        { marks: 2, description: 'Generally clear, some terminology used' },
        { marks: 1, description: 'Unclear or disorganized, limited terminology' },
        { marks: 0, description: 'Very unclear or no attempt' },
      ],
    },
  ],
};

// =============================================================================
// PHASE 3: STEP VALIDATION TYPES
// =============================================================================

export type StepValidationStatus = 'unchecked' | 'checking' | 'correct' | 'partial' | 'incorrect';

export interface StepValidationResult {
  stepNumber: number;
  status: StepValidationStatus;
  isCorrect: boolean;
  feedback: string;
  encouragement?: string;
  errorType?: MathErrorType;
  hintsRemaining: number;
}

export interface StepCheckRequest {
  stepNumber: number;
  stepLatex: string;
  stepPlainText: string;
  previousSteps: { latex: string; plainText: string }[];
  questionStem: string;
  startingExpression: string;
  expectedAnswers: string[];
}

// Common math error types for targeted feedback
export type MathErrorType =
  | 'arithmetic'           // Basic calculation error
  | 'sign_error'          // Wrong sign (+/-)
  | 'distribution'        // Didn't distribute correctly
  | 'combining_like_terms' // Error combining terms
  | 'inverse_operation'   // Wrong inverse (e.g., added instead of subtracted)
  | 'order_of_operations' // PEMDAS/BODMAS error
  | 'fraction_operation'  // Error with fractions
  | 'exponent_rule'       // Error with exponent rules
  | 'variable_isolation'  // Error isolating variable
  | 'logical_flow'        // Step doesn't follow from previous
  | 'notation'            // Notation/formatting issue
  | 'incomplete'          // Step is incomplete
  | 'correct'             // No error
  | 'unknown';            // Unidentified error type

// Common math error templates for helpful feedback
export const MATH_ERROR_TEMPLATES: Record<MathErrorType, {
  title: string;
  description: string;
  hint: string;
  encouragement: string;
}> = {
  arithmetic: {
    title: 'Arithmetic Error',
    description: "There's a small calculation mistake.",
    hint: 'Double-check your addition, subtraction, multiplication, or division.',
    encouragement: "Almost there! Just a tiny calculation to fix.",
  },
  sign_error: {
    title: 'Sign Error',
    description: "Watch out for the positive/negative signs.",
    hint: 'When you move a term to the other side, its sign changes.',
    encouragement: "You've got the right idea! Just check those +/- signs.",
  },
  distribution: {
    title: 'Distribution Error',
    description: "Remember to multiply by every term inside the brackets.",
    hint: 'a(b + c) = ab + ac — make sure to multiply by BOTH terms.',
    encouragement: "Good approach! Just make sure to distribute to all terms.",
  },
  combining_like_terms: {
    title: 'Combining Terms Error',
    description: "Only combine terms with the same variable and power.",
    hint: '3x and 2x are like terms. 3x and 2 are NOT like terms.',
    encouragement: "Nice work simplifying! Just check which terms can be combined.",
  },
  inverse_operation: {
    title: 'Inverse Operation Error',
    description: "To undo an operation, use its opposite.",
    hint: 'To undo +3, subtract 3. To undo ×2, divide by 2.',
    encouragement: "You're on the right track! Think about what undoes this operation.",
  },
  order_of_operations: {
    title: 'Order of Operations',
    description: "Remember PEMDAS/BODMAS: Parentheses, Exponents, Multiplication/Division, Addition/Subtraction.",
    hint: 'Work from the inside out — start with brackets first.',
    encouragement: "Good effort! Let's think about which operation comes first.",
  },
  fraction_operation: {
    title: 'Fraction Error',
    description: "Check how you're working with the fractions.",
    hint: 'To multiply fractions: multiply tops and bottoms. To divide: flip and multiply.',
    encouragement: "Fractions can be tricky! You're doing well.",
  },
  exponent_rule: {
    title: 'Exponent Rule Error',
    description: "Check the rules for working with powers.",
    hint: 'When multiplying same bases: add exponents. When dividing: subtract.',
    encouragement: "Exponent rules take practice. You're learning!",
  },
  variable_isolation: {
    title: 'Variable Isolation Error',
    description: "We need to get the variable alone on one side.",
    hint: 'Do the same operation to both sides to keep the equation balanced.',
    encouragement: "Good approach! Keep working to get x by itself.",
  },
  logical_flow: {
    title: 'Logical Flow Issue',
    description: "This step doesn't seem to follow from the previous one.",
    hint: "Each step should logically follow from what came before.",
    encouragement: "Let's trace through the steps again — you can do this!",
  },
  notation: {
    title: 'Notation Issue',
    description: "The mathematical notation might need adjustment.",
    hint: 'Make sure your equation is clearly written with proper symbols.',
    encouragement: "Your thinking is good — just clean up the notation.",
  },
  incomplete: {
    title: 'Incomplete Step',
    description: "This step isn't quite finished.",
    hint: 'Try to simplify or complete this step before moving on.',
    encouragement: "You're making progress! Keep going with this step.",
  },
  correct: {
    title: 'Correct!',
    description: 'This step is mathematically correct.',
    hint: 'Great work! Move on to the next step.',
    encouragement: "Excellent! You're solving this perfectly.",
  },
  unknown: {
    title: 'Let Me Help',
    description: "I'm not sure about this step.",
    hint: 'Try breaking this down into smaller steps.',
    encouragement: "Keep trying — every attempt is learning!",
  },
};

// =============================================================================
// PHASE 4: SKILL MASTERY TYPES (5-Level System)
// =============================================================================

/**
 * 5-Level Mastery System (Research-backed)
 * - NOT_STARTED: Haven't attempted any questions
 * - ATTEMPTED: Tried but <3 correct
 * - FAMILIAR: 3 correct in a row
 * - PROFICIENT: 5 correct in a row
 * - MASTERED: 7 correct + retention check after 7 days
 */
export type SkillMasteryLevel =
  | 'not_started'  // 0 attempts
  | 'attempted'    // Tried but <3 correct in a row
  | 'familiar'     // 3 correct in a row
  | 'proficient'   // 5 correct in a row
  | 'mastered';    // 7 correct + passed retention check

export interface SkillMastery {
  skillId: string;
  skillName: string;
  topic: string;
  subject: string;
  year: number;

  // Current mastery state
  level: SkillMasteryLevel;
  consecutiveCorrect: number;
  totalAttempts: number;
  totalCorrect: number;

  // Spaced repetition
  lastPracticedAt: string;       // ISO timestamp
  nextReviewAt: string | null;   // When to review (null = not scheduled)
  decayWarning: boolean;         // True if skill is about to decay

  // Performance metrics
  averageScore: number;
  bestScore: number;

  // History
  recentResults: { date: string; correct: boolean; score: number }[];
}

export interface SkillProgress {
  [skillId: string]: SkillMastery;
}

export interface TopicMastery {
  topicId: string;
  topicName: string;
  subject: string;
  year: number;

  // Aggregated from skills
  skills: SkillMastery[];
  overallLevel: SkillMasteryLevel;
  masteredCount: number;
  proficientCount: number;
  familiarCount: number;
  attemptedCount: number;
  notStartedCount: number;

  // Recommendations
  skillsToReview: string[];       // Skills due for review
  skillsDecaying: string[];       // Skills about to drop a level
  nextRecommendedSkill: string;   // Best skill to practice next
}

// Mastery level configuration
export const SKILL_MASTERY_CONFIG: Record<SkillMasteryLevel, {
  label: string;
  shortLabel: string;
  color: string;
  bgLight: string;
  bgSolid: string;
  text: string;
  border: string;
  emoji: string;
  consecutiveRequired: number;
  description: string;
}> = {
  not_started: {
    label: 'Not Started',
    shortLabel: 'New',
    color: 'gray',
    bgLight: 'bg-gray-50',
    bgSolid: 'bg-gray-400',
    text: 'text-gray-600',
    border: 'border-gray-200',
    emoji: '⭕',
    consecutiveRequired: 0,
    description: "You haven't practiced this skill yet",
  },
  attempted: {
    label: 'Attempted',
    shortLabel: 'Trying',
    color: 'red',
    bgLight: 'bg-red-50',
    bgSolid: 'bg-red-500',
    text: 'text-red-600',
    border: 'border-red-200',
    emoji: '🔴',
    consecutiveRequired: 0,
    description: 'Keep practicing to build your streak',
  },
  familiar: {
    label: 'Familiar',
    shortLabel: 'Getting It',
    color: 'orange',
    bgLight: 'bg-orange-50',
    bgSolid: 'bg-orange-500',
    text: 'text-orange-600',
    border: 'border-orange-200',
    emoji: '🟠',
    consecutiveRequired: 3,
    description: "You're getting the hang of this!",
  },
  proficient: {
    label: 'Proficient',
    shortLabel: 'Good',
    color: 'blue',
    bgLight: 'bg-blue-50',
    bgSolid: 'bg-blue-500',
    text: 'text-blue-600',
    border: 'border-blue-200',
    emoji: '🔵',
    consecutiveRequired: 5,
    description: "You've got a solid understanding",
  },
  mastered: {
    label: 'Mastered',
    shortLabel: 'Expert',
    color: 'green',
    bgLight: 'bg-green-50',
    bgSolid: 'bg-green-500',
    text: 'text-green-600',
    border: 'border-green-200',
    emoji: '🟢',
    consecutiveRequired: 7,
    description: 'Excellent! You own this skill!',
  },
};

// Spaced repetition intervals (in days)
export const SPACED_REPETITION_INTERVALS: Record<SkillMasteryLevel, number> = {
  not_started: 0,    // N/A
  attempted: 1,      // Review tomorrow
  familiar: 3,       // Review in 3 days
  proficient: 7,     // Review in 1 week
  mastered: 14,      // Review in 2 weeks
};

// Decay rules: Drop one level if not practiced within this many days
export const MASTERY_DECAY_DAYS: Record<SkillMasteryLevel, number> = {
  not_started: Infinity,  // Can't decay from not started
  attempted: 7,           // Drops to not_started after 7 days
  familiar: 14,           // Drops to attempted after 14 days
  proficient: 21,         // Drops to familiar after 21 days
  mastered: 28,           // Drops to proficient after 28 days
};

// =============================================================================
// PHASE 4: MASTERY UTILITY FUNCTIONS
// =============================================================================

/**
 * Calculate mastery level based on consecutive correct answers
 */
export function calculateMasteryLevel(consecutiveCorrect: number, hasRetentionCheck: boolean): SkillMasteryLevel {
  if (consecutiveCorrect >= 7 && hasRetentionCheck) return 'mastered';
  if (consecutiveCorrect >= 5) return 'proficient';
  if (consecutiveCorrect >= 3) return 'familiar';
  if (consecutiveCorrect > 0) return 'attempted';
  return 'not_started';
}

/**
 * Check if a skill should decay based on last practice date
 */
export function shouldSkillDecay(skill: SkillMastery): boolean {
  if (skill.level === 'not_started') return false;

  const lastPracticed = new Date(skill.lastPracticedAt);
  const now = new Date();
  const daysSinceLastPractice = Math.floor(
    (now.getTime() - lastPracticed.getTime()) / (1000 * 60 * 60 * 24)
  );

  return daysSinceLastPractice >= MASTERY_DECAY_DAYS[skill.level];
}

/**
 * Get the level a skill will decay to
 */
export function getDecayedLevel(currentLevel: SkillMasteryLevel): SkillMasteryLevel {
  const levelOrder: SkillMasteryLevel[] = ['not_started', 'attempted', 'familiar', 'proficient', 'mastered'];
  const currentIndex = levelOrder.indexOf(currentLevel);
  return currentIndex > 0 ? levelOrder[currentIndex - 1] : 'not_started';
}

/**
 * Calculate next review date based on mastery level
 */
export function calculateNextReviewDate(level: SkillMasteryLevel): string {
  const intervalDays = SPACED_REPETITION_INTERVALS[level];
  if (intervalDays === 0) return new Date().toISOString();

  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + intervalDays);
  return nextReview.toISOString();
}

/**
 * Check if a skill is due for review
 */
export function isSkillDueForReview(skill: SkillMastery): boolean {
  if (!skill.nextReviewAt) return false;
  return new Date() >= new Date(skill.nextReviewAt);
}

/**
 * Get skills sorted by review priority
 * Priority: 1) Decaying skills, 2) Due for review, 3) Lowest mastery
 */
export function getReviewPriority(skills: SkillMastery[]): SkillMastery[] {
  return [...skills].sort((a, b) => {
    // Decaying skills first
    const aDecaying = shouldSkillDecay(a);
    const bDecaying = shouldSkillDecay(b);
    if (aDecaying && !bDecaying) return -1;
    if (!aDecaying && bDecaying) return 1;

    // Then skills due for review
    const aDue = isSkillDueForReview(a);
    const bDue = isSkillDueForReview(b);
    if (aDue && !bDue) return -1;
    if (!aDue && bDue) return 1;

    // Then by mastery level (lower = higher priority)
    const levelOrder: SkillMasteryLevel[] = ['not_started', 'attempted', 'familiar', 'proficient', 'mastered'];
    return levelOrder.indexOf(a.level) - levelOrder.indexOf(b.level);
  });
}

// =============================================================================
// PHASE 4: MASTERY PROGRESS (Dashboard Data)
// =============================================================================

/**
 * Overall mastery progress for dashboard display
 */
export interface MasteryProgress {
  topics: TopicMastery[];
  skillsDueForReview: string[];
  skillsApproachingDecay: string[];
  totalMastered: number;
  totalSkills: number;
  streakDays: number;
  lastPracticedAt: string | null;
  suggestedAction?: {
    type: 'review' | 'prevent_decay' | 'level_up';
    skillId: string;
    skillName: string;
    reason: string;
  };
}

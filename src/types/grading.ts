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
  questionType: 'MCQ' | 'SHORT_ANSWER' | 'EXTENDED_RESPONSE';
  questionStem: string;
  modelSolution: string;
  studentAnswer: string;

  // MCQ-specific
  selectedOptionId?: string;
  correctOptionId?: string;
  mcqOptions?: MCQOption[];

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
  questionType: 'MCQ' | 'SHORT_ANSWER' | 'EXTENDED_RESPONSE',
  difficulty: number
): number {
  const pointsMatrix: Record<string, number[]> = {
    MCQ: [1, 1, 2, 2, 3],
    SHORT_ANSWER: [2, 3, 4, 5, 6],
    EXTENDED_RESPONSE: [4, 6, 8, 10, 12],
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

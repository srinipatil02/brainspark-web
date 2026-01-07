// =============================================================================
// GRADING SERVICE
// Handles answer evaluation for all question types
// =============================================================================

import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import {
  GradingRequest,
  GradingResult,
  GradingFeedback,
  RubricScore,
  MCQOption,
  calculateMaxPoints,
  getCorrectnessFromPercentage,
} from '@/types/grading';

// -----------------------------------------------------------------------------
// Grading Result Normalization
// -----------------------------------------------------------------------------

/**
 * Safely filter an array to remove null/undefined items and ensure all items are strings
 */
function safeStringArray(arr: unknown): string[] {
  if (!Array.isArray(arr)) return [];
  return arr.filter((item): item is string => typeof item === 'string' && item.length > 0);
}

/**
 * Normalize a grading result to ensure all fields exist with correct types
 */
function normalizeGradingResult(result: Partial<GradingResult> | null | undefined): GradingResult {
  // Handle null/undefined result from Cloud Function
  if (!result || typeof result !== 'object') {
    return {
      score: 0,
      maxScore: 1,
      percentage: 0,
      correctness: 'incorrect',
      feedback: {
        summary: 'Unable to process grading result.',
        whatWasRight: [],
        whatWasMissing: [],
        misconceptions: [],
        suggestions: [],
      },
      gradedAt: new Date().toISOString(),
      gradedBy: 'ai',
      confidence: 0,
    };
  }

  // Safely extract feedback arrays, filtering out any null/undefined items
  const normalizedFeedback: GradingFeedback = {
    summary: (typeof result.feedback?.summary === 'string' && result.feedback.summary)
      || 'Your answer has been graded.',
    whatWasRight: safeStringArray(result.feedback?.whatWasRight),
    whatWasMissing: safeStringArray(result.feedback?.whatWasMissing),
    misconceptions: safeStringArray(result.feedback?.misconceptions),
    suggestions: safeStringArray(result.feedback?.suggestions),
  };

  // Safely normalize rubric scores - filter out any invalid items
  let normalizedRubricScores: RubricScore[] | undefined;
  if (Array.isArray(result.rubricScores)) {
    normalizedRubricScores = result.rubricScores
      .filter((item): item is RubricScore =>
        item != null &&
        typeof item === 'object' &&
        typeof item.criterion === 'string' &&
        typeof item.score === 'number' &&
        typeof item.maxScore === 'number'
      );
    if (normalizedRubricScores.length === 0) {
      normalizedRubricScores = undefined;
    }
  }

  return {
    score: typeof result.score === 'number' ? result.score : 0,
    maxScore: typeof result.maxScore === 'number' ? result.maxScore : 1,
    percentage: typeof result.percentage === 'number' ? result.percentage : 0,
    correctness: result.correctness || 'incorrect',
    feedback: normalizedFeedback,
    rubricScores: normalizedRubricScores,
    conceptsAssessed: safeStringArray(result.conceptsAssessed),
    conceptsMastered: safeStringArray(result.conceptsMastered),
    conceptsToReview: safeStringArray(result.conceptsToReview),
    gradedAt: result.gradedAt || new Date().toISOString(),
    gradedBy: result.gradedBy || 'ai',
    confidence: typeof result.confidence === 'number' ? result.confidence : 0.8,
  };
}

// -----------------------------------------------------------------------------
// MCQ Auto-Grading (Instant, No API Call)
// -----------------------------------------------------------------------------

/**
 * Grade an MCQ answer instantly without any API calls
 * This is free and immediate - perfect for MCQ questions
 */
export function gradeMCQ(request: GradingRequest): GradingResult {
  const { selectedOptionId, correctOptionId, mcqOptions, difficulty } = request;

  // Validation
  if (!selectedOptionId) {
    return createEmptyResult('Please select an answer.', 1);
  }

  if (!correctOptionId || !mcqOptions) {
    throw new Error('MCQ grading requires correctOptionId and mcqOptions');
  }

  const isCorrect = selectedOptionId === correctOptionId;
  const selectedOption = mcqOptions.find(o => o.id === selectedOptionId);
  const correctOption = mcqOptions.find(o => o.id === correctOptionId);

  // Build detailed feedback
  const feedback: GradingFeedback = buildMCQFeedback(
    isCorrect,
    selectedOption,
    correctOption
  );

  // Calculate score based on difficulty
  const maxScore = calculateMaxPoints('MCQ', difficulty);
  const score = isCorrect ? maxScore : 0;

  return {
    score,
    maxScore,
    percentage: isCorrect ? 100 : 0,
    correctness: isCorrect ? 'correct' : 'incorrect',
    feedback,
    gradedAt: new Date().toISOString(),
    gradedBy: 'auto',
    confidence: 1.0,
  };
}

/**
 * Build feedback for MCQ answers
 */
function buildMCQFeedback(
  isCorrect: boolean,
  selectedOption?: MCQOption,
  correctOption?: MCQOption
): GradingFeedback {
  if (isCorrect) {
    return {
      summary: selectedOption?.feedback
        ? `Correct! ${selectedOption.feedback}`
        : 'Correct! Well done!',
      whatWasRight: ['You selected the correct answer'],
      whatWasMissing: [],
      misconceptions: [],
      suggestions: [],
    };
  }

  // Incorrect answer
  const summary = buildIncorrectSummary(selectedOption, correctOption);

  return {
    summary,
    whatWasRight: [],
    whatWasMissing: [
      `The correct answer is: ${correctOption?.text || 'Unknown'}`,
    ],
    misconceptions: selectedOption?.feedback
      ? [selectedOption.feedback]
      : [],
    suggestions: [
      'Review the solution explanation to understand why this answer is correct.',
    ],
  };
}

/**
 * Build summary for incorrect MCQ answer
 */
function buildIncorrectSummary(
  selectedOption?: MCQOption,
  correctOption?: MCQOption
): string {
  let summary = 'Incorrect. ';

  if (selectedOption?.feedback) {
    summary += selectedOption.feedback + ' ';
  }

  if (correctOption) {
    summary += `The correct answer was "${correctOption.text}".`;
  }

  return summary.trim();
}

// -----------------------------------------------------------------------------
// AI Grading (for SHORT_ANSWER and EXTENDED_RESPONSE)
// -----------------------------------------------------------------------------

/**
 * Grade a SHORT_ANSWER or EXTENDED_RESPONSE using AI
 * This calls a Cloud Function that uses Claude for evaluation
 */
export async function gradeWithAI(request: GradingRequest): Promise<GradingResult> {
  // Validate minimum answer length
  if (!request.studentAnswer || request.studentAnswer.trim().length < 5) {
    const maxScore = calculateMaxPoints(request.questionType, request.difficulty);
    return createEmptyResult(
      'Your answer is too short. Please provide a more complete response.',
      maxScore
    );
  }

  try {
    const gradeAnswer = httpsCallable<GradingRequest, GradingResult>(
      functions,
      'gradeAnswer'
    );

    const result = await gradeAnswer(request);
    // Normalize the response to ensure all fields exist
    return normalizeGradingResult(result.data);
  } catch (error) {
    console.error('AI grading error:', error);

    // Return a fallback result rather than crashing
    const maxScore = calculateMaxPoints(request.questionType, request.difficulty);
    return createFallbackResult(
      'Unable to grade your answer automatically. Please review the model solution.',
      maxScore
    );
  }
}

// -----------------------------------------------------------------------------
// Main Grading Function
// -----------------------------------------------------------------------------

/**
 * Grade any question type - routes to appropriate grader
 */
export async function gradeAnswer(request: GradingRequest): Promise<GradingResult> {
  // MCQ: instant auto-grading
  if (request.questionType === 'MCQ') {
    return gradeMCQ(request);
  }

  // SHORT_ANSWER and EXTENDED_RESPONSE: AI grading
  return gradeWithAI(request);
}

// -----------------------------------------------------------------------------
// Helper Functions
// -----------------------------------------------------------------------------

/**
 * Create an empty/invalid result
 */
function createEmptyResult(message: string, maxScore: number): GradingResult {
  return {
    score: 0,
    maxScore,
    percentage: 0,
    correctness: 'incorrect',
    feedback: {
      summary: message,
      whatWasRight: [],
      whatWasMissing: ['A complete answer'],
      misconceptions: [],
      suggestions: ['Please provide a substantive answer to the question.'],
    },
    gradedAt: new Date().toISOString(),
    gradedBy: 'auto',
    confidence: 1.0,
  };
}

/**
 * Create a fallback result when AI grading fails
 */
function createFallbackResult(message: string, maxScore: number): GradingResult {
  return {
    score: 0,
    maxScore,
    percentage: 0,
    correctness: 'partial', // Give benefit of doubt
    feedback: {
      summary: message,
      whatWasRight: ['Your answer has been recorded'],
      whatWasMissing: [],
      misconceptions: [],
      suggestions: ['Compare your answer with the model solution.'],
    },
    gradedAt: new Date().toISOString(),
    gradedBy: 'auto',
    confidence: 0,
  };
}

// -----------------------------------------------------------------------------
// Utility Functions
// -----------------------------------------------------------------------------

/**
 * Check if a question type can be auto-graded (no AI needed)
 */
export function canAutoGrade(questionType: string): boolean {
  return questionType === 'MCQ';
}

/**
 * Get estimated grading time based on question type
 */
export function getEstimatedGradingTime(questionType: string): string {
  switch (questionType) {
    case 'MCQ':
      return 'Instant';
    case 'SHORT_ANSWER':
      return '2-3 seconds';
    case 'EXTENDED_RESPONSE':
      return '3-5 seconds';
    default:
      return 'Unknown';
  }
}

/**
 * Calculate overall set score from individual question results
 */
export function calculateSetScore(
  results: Record<number, { score: number; maxScore: number }>
): { totalScore: number; totalMaxScore: number; percentage: number } {
  const entries = Object.values(results);

  if (entries.length === 0) {
    return { totalScore: 0, totalMaxScore: 0, percentage: 0 };
  }

  const totalScore = entries.reduce((sum, r) => sum + r.score, 0);
  const totalMaxScore = entries.reduce((sum, r) => sum + r.maxScore, 0);
  const percentage = totalMaxScore > 0
    ? Math.round((totalScore / totalMaxScore) * 100)
    : 0;

  return { totalScore, totalMaxScore, percentage };
}

/**
 * Determine if a result should be celebrated (confetti, etc.)
 */
export function shouldCelebrate(result: GradingResult): boolean {
  return result.correctness === 'correct' && result.percentage === 100;
}

/**
 * Get encouraging message based on result
 */
export function getEncouragingMessage(result: GradingResult): string {
  const { correctness, percentage } = result;

  if (correctness === 'correct') {
    if (percentage === 100) return 'Perfect! You nailed it!';
    return 'Great job! You got it right!';
  }

  if (correctness === 'partial') {
    if (percentage >= 60) return 'Good effort! You\'re on the right track.';
    return 'You\'re getting there! Keep practicing.';
  }

  // Incorrect
  return 'Don\'t worry! Every mistake is a chance to learn.';
}

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
  MathGradingRequest,
  MathGradingResult,
  MathStepResult,
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
// Math Grading (for EQUATION_ENTRY and MULTI_STEP_MATH)
// -----------------------------------------------------------------------------

/**
 * Grade an EQUATION_ENTRY question using AI
 * Handles single math expression answers with LaTeX support
 */
export async function gradeMathEquation(request: GradingRequest): Promise<MathGradingResult> {
  const { studentAnswer, difficulty } = request;
  const maxScore = calculateMaxPoints('EQUATION_ENTRY', difficulty);

  // Extract math-specific fields if present
  const mathRequest = request as GradingRequest & {
    studentAnswerLatex?: string;
    studentAnswerPlainText?: string;
  };

  // Validate answer presence
  if (!studentAnswer || studentAnswer.trim().length === 0) {
    return createMathEmptyResult('Please enter your equation or expression.', maxScore);
  }

  try {
    // Build enhanced request with math context
    const enhancedRequest = {
      ...request,
      // Provide grading hints to AI
      gradingInstructions: `
        This is a mathematics EQUATION_ENTRY question requiring a single mathematical expression or value as the answer.

        Student's answer (LaTeX): ${mathRequest.studentAnswerLatex || studentAnswer}
        Student's answer (Plain text): ${mathRequest.studentAnswerPlainText || studentAnswer}

        GRADING CRITERIA:
        1. Check if the answer is mathematically EQUIVALENT to the expected solution (not just identical notation)
        2. Accept equivalent forms: e.g., "x = 5" vs "5 = x", "2/4" vs "1/2", "0.5" vs "1/2"
        3. Check for correct simplification if required by the question
        4. Award partial credit for correct approach with arithmetic errors

        Provide specific feedback about:
        - Whether the mathematical expression is correct
        - Any calculation or algebraic errors
        - Alternative correct forms if applicable
      `,
    };

    const gradeAnswer = httpsCallable<typeof enhancedRequest, GradingResult>(
      functions,
      'gradeAnswer'
    );

    const result = await gradeAnswer(enhancedRequest);
    const normalizedResult = normalizeGradingResult(result.data);

    // Convert to MathGradingResult
    return {
      ...normalizedResult,
      mathematicallyCorrect: normalizedResult.correctness === 'correct',
    };
  } catch (error) {
    console.error('Math equation grading error:', error);
    return createMathFallbackResult(
      'Unable to grade your equation automatically. Please review the model solution.',
      maxScore
    );
  }
}

/**
 * Grade a MULTI_STEP_MATH question using AI
 * Handles step-by-step problem solving with partial credit per step
 */
export async function gradeMultiStepMath(request: GradingRequest): Promise<MathGradingResult> {
  const { studentAnswer, difficulty } = request;
  const maxScore = calculateMaxPoints('MULTI_STEP_MATH', difficulty);

  // Extract math-specific fields
  const mathRequest = request as GradingRequest & {
    studentAnswerLatex?: string;
    studentAnswerPlainText?: string;
    studentSteps?: Array<{ stepNumber: number; latex: string; plainText: string }>;
    expectedSteps?: Array<{ stepNumber: number; expectedPatterns: string[]; rubricWeight: number }>;
  };

  // Validate answer
  if (!studentAnswer || studentAnswer.trim().length === 0) {
    return createMathEmptyResult('Please work through the steps and provide your answer.', maxScore);
  }

  try {
    // Build enhanced request with step-by-step context
    const enhancedRequest = {
      ...request,
      // Provide detailed grading instructions
      gradingInstructions: `
        This is a MULTI_STEP_MATH question requiring step-by-step solution.

        Student's final answer (LaTeX): ${mathRequest.studentAnswerLatex || studentAnswer}
        Student's final answer (Plain text): ${mathRequest.studentAnswerPlainText || studentAnswer}

        ${mathRequest.studentSteps ? `
        Student's work by step:
        ${mathRequest.studentSteps.map(s => `Step ${s.stepNumber}: ${s.latex} (${s.plainText})`).join('\n')}
        ` : 'No intermediate steps provided.'}

        GRADING CRITERIA FOR MULTI-STEP MATH:
        1. Evaluate each step for mathematical correctness
        2. Check logical progression from one step to the next
        3. Award partial credit: correct process but wrong final answer earns points
        4. Identify WHERE errors occurred (which step)
        5. Check if the final answer follows logically from the work shown

        SCORING GUIDANCE:
        - Perfect solution: 100%
        - Correct method, minor arithmetic error: 70-85%
        - Correct setup, process error: 40-60%
        - Shows some understanding: 20-40%
        - No understanding shown: 0-20%

        Provide feedback that:
        - Identifies the specific step(s) where errors occurred
        - Explains what the correct approach should be
        - Acknowledges correct work before the error
        - Suggests how to avoid similar errors
      `,
    };

    const gradeAnswer = httpsCallable<typeof enhancedRequest, GradingResult>(
      functions,
      'gradeAnswer'
    );

    const result = await gradeAnswer(enhancedRequest);
    const normalizedResult = normalizeGradingResult(result.data);

    // Analyze for computation vs algebraic errors based on feedback
    const feedback = normalizedResult.feedback;
    const computationErrors: string[] = [];
    const algebraicErrors: string[] = [];

    // Look for error patterns in feedback
    if (feedback.misconceptions) {
      feedback.misconceptions.forEach(m => {
        if (m.toLowerCase().includes('arithmetic') || m.toLowerCase().includes('calculation')) {
          computationErrors.push(m);
        } else if (m.toLowerCase().includes('algebra') || m.toLowerCase().includes('equation')) {
          algebraicErrors.push(m);
        }
      });
    }

    return {
      ...normalizedResult,
      mathematicallyCorrect: normalizedResult.correctness === 'correct',
      computationErrors: computationErrors.length > 0 ? computationErrors : undefined,
      algebraicErrors: algebraicErrors.length > 0 ? algebraicErrors : undefined,
    };
  } catch (error) {
    console.error('Multi-step math grading error:', error);
    return createMathFallbackResult(
      'Unable to grade your solution automatically. Please review the model solution.',
      maxScore
    );
  }
}

/**
 * Create empty result for math questions
 */
function createMathEmptyResult(message: string, maxScore: number): MathGradingResult {
  return {
    score: 0,
    maxScore,
    percentage: 0,
    correctness: 'incorrect',
    feedback: {
      summary: message,
      whatWasRight: [],
      whatWasMissing: ['A mathematical expression or solution'],
      misconceptions: [],
      suggestions: ['Enter your equation using the math keyboard or keypad.'],
    },
    gradedAt: new Date().toISOString(),
    gradedBy: 'auto',
    confidence: 1.0,
    mathematicallyCorrect: false,
  };
}

/**
 * Create fallback result for math grading errors
 */
function createMathFallbackResult(message: string, maxScore: number): MathGradingResult {
  return {
    score: 0,
    maxScore,
    percentage: 0,
    correctness: 'partial',
    feedback: {
      summary: message,
      whatWasRight: ['Your answer has been recorded'],
      whatWasMissing: [],
      misconceptions: [],
      suggestions: ['Compare your working with the model solution.'],
    },
    gradedAt: new Date().toISOString(),
    gradedBy: 'auto',
    confidence: 0,
    mathematicallyCorrect: false,
  };
}

// -----------------------------------------------------------------------------
// Main Grading Function
// -----------------------------------------------------------------------------

/**
 * Grade WORKED_SOLUTION questions (Student-Centered "Show Your Work")
 *
 * Philosophy:
 * - Evaluate REASONING, not just final answers
 * - Accept MULTIPLE valid solution paths (celebrate different approaches!)
 * - Give partial credit for correct reasoning even with arithmetic errors
 * - Focus on mathematical validity, not pattern matching
 * - Hints used are NOT penalized (they're learning tools)
 */
export async function gradeWorkedSolution(request: GradingRequest): Promise<MathGradingResult> {
  const difficulty = request.difficulty || 3;
  const maxScore = calculateMaxPoints('WORKED_SOLUTION', difficulty);

  // Parse the student's working (expected format: JSON with workLines and finalAnswer)
  let studentWork: { workLines: { latex: string }[]; finalAnswer: string };
  try {
    studentWork = JSON.parse(request.studentAnswer);
  } catch {
    // If not JSON, treat as plain text answer
    studentWork = {
      workLines: [{ latex: request.studentAnswer }],
      finalAnswer: request.studentAnswer,
    };
  }

  // Empty answer check
  if (!studentWork || (!studentWork.finalAnswer && (!studentWork.workLines || studentWork.workLines.length <= 1))) {
    return createMathEmptyResult(
      'Please show your working and provide a final answer. Any approach is valid!',
      maxScore
    );
  }

  try {
    // Build the student-centered grading prompt
    const workingText = studentWork.workLines
      .map((line, i) => `Line ${i + 1}: ${line.latex}`)
      .join('\n');

    const enhancedRequest = {
      ...request,
      gradingInstructions: `
        STUDENT-CENTERED GRADING - Focus on REASONING, not just answers

        QUESTION: ${request.questionStem}
        CORRECT ANSWER: ${request.correctAnswer || 'See solution'}

        STUDENT'S WORKING:
        ${workingText}

        STUDENT'S FINAL ANSWER: ${studentWork.finalAnswer}

        ═══════════════════════════════════════════════════════════════════════════
        GRADING PHILOSOPHY (IMPORTANT - READ CAREFULLY)
        ═══════════════════════════════════════════════════════════════════════════

        1. ACCEPT MULTIPLE VALID PATHS
           The student may solve the problem differently than expected. Examples:
           - For "Solve 3(x+2)=21": Expanding first OR dividing by 3 first are BOTH correct
           - For "Simplify 2/4": The answer could be "1/2", "0.5", or even "2/4" if not simplified
           Accept ANY mathematically valid approach that reaches a correct answer.

        2. EVALUATE REASONING QUALITY
           Score based on whether each step LOGICALLY follows from the previous:
           - Does Line 2 follow from Line 1?
           - Are the operations mathematically valid?
           - Is the logic sound even if there's an arithmetic slip?

        3. PARTIAL CREDIT IS ESSENTIAL
           - Correct method + arithmetic error = 70-85%
           - Good setup + process mistake = 50-70%
           - Shows understanding but gets lost = 30-50%
           - Some relevant work = 15-30%

        4. CELEBRATE DIFFERENT APPROACHES
           If the student uses an elegant or creative method, note it positively!
           Mathematical fluency means knowing multiple paths to the same answer.

        5. BE ENCOURAGING, NOT PUNISHING
           Feedback should help the student learn, not make them feel bad.
           Start with what they did RIGHT before discussing errors.

        ═══════════════════════════════════════════════════════════════════════════
        SCORING RUBRIC
        ═══════════════════════════════════════════════════════════════════════════

        90-100%: Correct answer with valid reasoning (any approach)
        80-89%:  Correct answer with minor gaps in working, OR correct method with tiny arithmetic slip
        70-79%:  Mostly correct method, small error affecting final answer
        60-69%:  Good understanding shown, significant error but salvageable
        50-59%:  Partial understanding, major error but shows relevant knowledge
        30-49%:  Limited understanding, some relevant work shown
        10-29%:  Minimal understanding, attempted but largely incorrect
        0-9%:    No understanding demonstrated

        ═══════════════════════════════════════════════════════════════════════════
        FEEDBACK REQUIREMENTS
        ═══════════════════════════════════════════════════════════════════════════

        Provide feedback that:
        1. FIRST acknowledges what the student did well
        2. Explains errors in a constructive, growth-mindset way
        3. Shows the correct path without being condescending
        4. If they used a different-but-valid method, celebrate it!
        5. Ends with encouragement for next time

        Use language like:
        - "Great approach using..." NOT "Wrong method"
        - "Check your calculation in Line 3" NOT "You made an error"
        - "Almost there! Just..." NOT "You failed to..."
      `,
    };

    const gradeAnswerFn = httpsCallable<typeof enhancedRequest, GradingResult>(
      functions,
      'gradeAnswer'
    );

    const result = await gradeAnswerFn(enhancedRequest);
    const normalizedResult = normalizeGradingResult(result.data);

    // Analyze feedback for process vs answer correctness
    const feedback = normalizedResult.feedback;
    const processCorrect = normalizedResult.percentage >= 70;
    const answerCorrect = normalizedResult.percentage >= 90;

    return {
      ...normalizedResult,
      mathematicallyCorrect: answerCorrect,
      processScore: processCorrect ? normalizedResult.score * 0.7 : normalizedResult.score * 0.3,
    };
  } catch (error) {
    console.error('Worked solution grading error:', error);
    return createMathFallbackResult(
      'We couldn\'t grade your solution automatically. Your working has been saved - please compare with the model solution.',
      maxScore
    );
  }
}

/**
 * Grade any question type - routes to appropriate grader
 */
export async function gradeAnswer(request: GradingRequest): Promise<GradingResult> {
  // MCQ: instant auto-grading
  if (request.questionType === 'MCQ') {
    return gradeMCQ(request);
  }

  // EQUATION_ENTRY: Math equation grading with equivalence checking
  if (request.questionType === 'EQUATION_ENTRY') {
    return gradeMathEquation(request);
  }

  // MULTI_STEP_MATH: Step-by-step math with partial credit (legacy)
  if (request.questionType === 'MULTI_STEP_MATH') {
    return gradeMultiStepMath(request);
  }

  // WORKED_SOLUTION: Student-centered "show your work" (recommended)
  if (request.questionType === 'WORKED_SOLUTION') {
    return gradeWorkedSolution(request);
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
    case 'EQUATION_ENTRY':
      return '2-4 seconds';
    case 'MULTI_STEP_MATH':
      return '3-6 seconds';
    case 'WORKED_SOLUTION':
      return '4-7 seconds';  // Evaluates reasoning + multiple paths
    default:
      return 'Unknown';
  }
}

/**
 * Check if a question type is a math type
 */
export function isMathQuestionType(questionType: string): boolean {
  return questionType === 'EQUATION_ENTRY' ||
         questionType === 'MULTI_STEP_MATH' ||
         questionType === 'WORKED_SOLUTION';
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

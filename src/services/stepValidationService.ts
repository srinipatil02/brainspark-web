// =============================================================================
// STEP VALIDATION SERVICE (Phase 3)
// Provides real-time feedback on individual math steps
// =============================================================================

import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import {
  StepValidationResult,
  StepCheckRequest,
  MathErrorType,
  MATH_ERROR_TEMPLATES,
} from '@/types/grading';

// Maximum hints per step (checking a step costs 1 hint)
export const MAX_HINTS_PER_STEP = 3;

// -----------------------------------------------------------------------------
// Step Validation
// -----------------------------------------------------------------------------

/**
 * Validate a single step in the student's work
 * This costs 1 hint from the student's available hints for that step
 *
 * @param request - The step check request containing the step to validate
 * @param hintsUsed - Number of hints already used for this step
 * @returns StepValidationResult with feedback and error type
 */
export async function validateStep(
  request: StepCheckRequest,
  hintsUsed: number
): Promise<StepValidationResult> {
  // Check if student has hints remaining
  if (hintsUsed >= MAX_HINTS_PER_STEP) {
    return {
      stepNumber: request.stepNumber,
      status: 'unchecked',
      isCorrect: false,
      feedback: "You've used all your hints for this step. Submit your answer to see the full solution.",
      hintsRemaining: 0,
    };
  }

  // Empty step check
  if (!request.stepLatex || request.stepLatex.trim().length === 0) {
    return {
      stepNumber: request.stepNumber,
      status: 'incorrect',
      isCorrect: false,
      feedback: 'This step is empty. Enter your working before checking.',
      encouragement: 'Take your time — show what you would do next.',
      errorType: 'incomplete',
      hintsRemaining: MAX_HINTS_PER_STEP - hintsUsed,
    };
  }

  try {
    // Build context for AI evaluation
    const previousStepsText = request.previousSteps
      .map((s, i) => `Step ${i + 1}: ${s.latex}`)
      .join('\n');

    const validationPrompt = `
      STEP VALIDATION REQUEST
      =======================

      PROBLEM: ${request.questionStem}
      STARTING EXPRESSION: ${request.startingExpression}
      EXPECTED FINAL ANSWER(S): ${request.expectedAnswers.join(' or ')}

      PREVIOUS STEPS:
      ${previousStepsText || '(None yet)'}

      CURRENT STEP (Step ${request.stepNumber}): ${request.stepLatex}
      Plain text: ${request.stepPlainText}

      TASK: Evaluate if this step is mathematically valid and logically follows from the previous step.

      EVALUATION CRITERIA:
      1. Is the mathematical operation correct?
      2. Does this step logically follow from the previous step?
      3. Is the student making progress toward the solution?
      4. If there's an error, identify the type:
         - arithmetic: Basic calculation error
         - sign_error: Wrong positive/negative sign
         - distribution: Didn't distribute correctly
         - combining_like_terms: Error combining like terms
         - inverse_operation: Used wrong inverse operation
         - order_of_operations: PEMDAS/BODMAS error
         - fraction_operation: Error with fractions
         - exponent_rule: Error with exponents
         - variable_isolation: Error isolating variable
         - logical_flow: Step doesn't follow from previous
         - notation: Formatting/notation issue
         - incomplete: Step is incomplete
         - correct: No error

      RESPOND IN JSON FORMAT:
      {
        "isCorrect": true/false,
        "errorType": "error_type_or_correct",
        "feedback": "Specific, helpful feedback (1-2 sentences)",
        "encouragement": "Positive, growth-mindset message"
      }

      IMPORTANT:
      - Be encouraging, not punishing
      - Start with what's right before mentioning errors
      - For correct steps, celebrate the progress!
      - Never reveal the final answer
    `;

    // Call the Cloud Function for AI evaluation
    const validateStepFn = httpsCallable<{ prompt: string }, {
      isCorrect: boolean;
      errorType: string;
      feedback: string;
      encouragement: string;
    }>(functions, 'validateMathStep');

    const result = await validateStepFn({ prompt: validationPrompt });
    const data = result.data;

    const errorType = (data.errorType || 'unknown') as MathErrorType;
    const status = data.isCorrect ? 'correct' : errorType === 'incomplete' ? 'partial' : 'incorrect';

    return {
      stepNumber: request.stepNumber,
      status,
      isCorrect: data.isCorrect,
      feedback: data.feedback || getDefaultFeedback(errorType),
      encouragement: data.encouragement || MATH_ERROR_TEMPLATES[errorType]?.encouragement,
      errorType,
      hintsRemaining: MAX_HINTS_PER_STEP - hintsUsed - 1,
    };
  } catch (error) {
    console.error('Step validation error:', error);

    // Fallback to local validation for basic cases
    return performLocalValidation(request, hintsUsed);
  }
}

// -----------------------------------------------------------------------------
// Local Validation (Fallback)
// -----------------------------------------------------------------------------

/**
 * Perform basic local validation when AI is unavailable
 * This provides some feedback without requiring a server call
 */
function performLocalValidation(
  request: StepCheckRequest,
  hintsUsed: number
): StepValidationResult {
  const step = request.stepLatex.toLowerCase().trim();

  // Check for common patterns
  let errorType: MathErrorType = 'unknown';
  let feedback = '';
  let isCorrect = false;

  // Basic validation checks
  if (step.length < 3) {
    errorType = 'incomplete';
    feedback = 'This step seems incomplete. Try to show more of your working.';
  } else if (step.includes('=') && !request.previousSteps.some(s => s.latex.includes('='))) {
    // First step with equals sign - likely starting correctly
    isCorrect = true;
    errorType = 'correct';
    feedback = "Good start! You're working with the equation correctly.";
  } else if (step === request.previousSteps[request.previousSteps.length - 1]?.latex) {
    // Same as previous step
    errorType = 'logical_flow';
    feedback = "This step is the same as the previous one. What operation can you apply next?";
  } else {
    // Can't determine - give encouraging generic feedback
    feedback = "I can see you're working on this. Keep going and submit when you're ready to see how you did!";
    isCorrect = true; // Give benefit of doubt
    errorType = 'correct';
  }

  return {
    stepNumber: request.stepNumber,
    status: isCorrect ? 'correct' : 'partial',
    isCorrect,
    feedback,
    encouragement: MATH_ERROR_TEMPLATES[errorType].encouragement,
    errorType,
    hintsRemaining: MAX_HINTS_PER_STEP - hintsUsed - 1,
  };
}

// -----------------------------------------------------------------------------
// Helper Functions
// -----------------------------------------------------------------------------

/**
 * Get default feedback for an error type
 */
function getDefaultFeedback(errorType: MathErrorType): string {
  const template = MATH_ERROR_TEMPLATES[errorType];
  return template ? `${template.description} ${template.hint}` : "Let me help you with this step.";
}

/**
 * Get encouraging message based on step progress
 */
export function getStepProgressMessage(
  totalSteps: number,
  correctSteps: number
): string {
  if (correctSteps === 0) {
    return "Let's work through this together. You can do it!";
  }

  const percentage = (correctSteps / totalSteps) * 100;

  if (percentage === 100) {
    return "Perfect! Every step is correct!";
  } else if (percentage >= 75) {
    return "Excellent progress! You're almost there!";
  } else if (percentage >= 50) {
    return "Good work! You're making progress!";
  } else if (percentage >= 25) {
    return "You're on your way! Keep going!";
  } else {
    return "Every step is a learning opportunity. Keep trying!";
  }
}

/**
 * Calculate partial credit based on step validations
 */
export function calculateStepPartialCredit(
  stepResults: StepValidationResult[],
  maxScore: number
): number {
  if (stepResults.length === 0) return 0;

  const correctSteps = stepResults.filter(r => r.isCorrect).length;
  const partialSteps = stepResults.filter(r => r.status === 'partial').length;

  // Full credit for correct, half credit for partial
  const earnedCredit = correctSteps + (partialSteps * 0.5);
  const totalPossible = stepResults.length;

  return Math.round((earnedCredit / totalPossible) * maxScore * 10) / 10;
}

/**
 * Get the most common error type from step results
 */
export function getMostCommonError(
  stepResults: StepValidationResult[]
): MathErrorType | null {
  const errors = stepResults
    .filter(r => !r.isCorrect && r.errorType)
    .map(r => r.errorType!);

  if (errors.length === 0) return null;

  // Count occurrences
  const counts: Record<string, number> = {};
  errors.forEach(e => {
    counts[e] = (counts[e] || 0) + 1;
  });

  // Find most common
  let maxCount = 0;
  let mostCommon: MathErrorType | null = null;

  Object.entries(counts).forEach(([error, count]) => {
    if (count > maxCount) {
      maxCount = count;
      mostCommon = error as MathErrorType;
    }
  });

  return mostCommon;
}

/**
 * Generate targeted feedback based on error patterns
 */
export function generateTargetedFeedback(
  stepResults: StepValidationResult[]
): string {
  const mostCommonError = getMostCommonError(stepResults);

  if (!mostCommonError) {
    return "Great work on your solution!";
  }

  const template = MATH_ERROR_TEMPLATES[mostCommonError];
  return `Focus area: ${template.title}. ${template.hint}`;
}

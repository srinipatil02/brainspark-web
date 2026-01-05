import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';

/**
 * Writing submission for grading
 */
export interface WritingSubmission {
  promptId: string;
  promptText: string;
  promptType: 'narrative' | 'persuasive';
  response: string;
  wordCount: number;
  timeSpentSeconds?: number;
}

/**
 * Criteria scores with feedback
 */
export interface CriteriaScore {
  score: number;
  feedback: string;
}

/**
 * Writing grading result from AI
 */
export interface WritingGradingResult {
  overallScore: number;
  criteria: {
    content: CriteriaScore;
    structure: CriteriaScore;
    language: CriteriaScore;
    creativity: CriteriaScore;
  };
  strengths: string[];
  improvements: string[];
  overallFeedback: string;
  gradedAt: string;
}

/**
 * Response from grading function
 */
export interface GradingResponse {
  success: boolean;
  submissionId: string;
  grading: WritingGradingResult;
}

/**
 * Submit writing for AI grading
 */
export async function submitWritingForGrading(
  submission: WritingSubmission
): Promise<GradingResponse> {
  try {
    const gradeWriting = httpsCallable<WritingSubmission, GradingResponse>(
      functions,
      'gradeWriting'
    );

    const result = await gradeWriting(submission);
    return result.data;
  } catch (error: unknown) {
    console.error('Error submitting writing for grading:', error);

    // Handle Firebase function errors
    if (error && typeof error === 'object' && 'code' in error) {
      const firebaseError = error as { code: string; message: string };
      if (firebaseError.code === 'functions/unauthenticated') {
        throw new Error('Please sign in to submit your writing.');
      }
      if (firebaseError.code === 'functions/invalid-argument') {
        throw new Error(firebaseError.message || 'Invalid submission. Please check your writing.');
      }
    }

    throw new Error('Failed to grade writing. Please try again.');
  }
}

/**
 * Get score color based on score value
 */
export function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-yellow-600';
  if (score >= 40) return 'text-orange-600';
  return 'text-red-600';
}

/**
 * Get score label based on score value
 */
export function getScoreLabel(score: number): string {
  if (score >= 90) return 'Excellent';
  if (score >= 80) return 'Very Good';
  if (score >= 70) return 'Good';
  if (score >= 60) return 'Satisfactory';
  if (score >= 50) return 'Needs Improvement';
  return 'Keep Practicing';
}

/**
 * Get score background color for progress bars
 */
export function getScoreBgColor(score: number): string {
  if (score >= 80) return 'bg-green-500';
  if (score >= 60) return 'bg-yellow-500';
  if (score >= 40) return 'bg-orange-500';
  return 'bg-red-500';
}

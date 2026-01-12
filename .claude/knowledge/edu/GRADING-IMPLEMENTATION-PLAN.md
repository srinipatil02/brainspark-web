# Grading & Feedback System - Implementation Plan

## Overview

This plan transforms BrainSpark from "answer accepted" to "answer evaluated with feedback".

---

## Phase 1: Types & Interfaces

### File: `src/types/grading.ts` (NEW)

```typescript
// Core grading types
export type Correctness = 'correct' | 'partial' | 'incorrect';
export type MasteryLevel = 'novice' | 'developing' | 'proficient' | 'mastered';
export type GraderType = 'auto' | 'ai' | 'human';

export interface GradingFeedback {
  summary: string;
  whatWasRight: string[];
  whatWasMissing: string[];
  misconceptions: string[];
  suggestions: string[];
}

export interface RubricScore {
  criterion: string;
  score: number;
  maxScore: number;
  feedback?: string;
}

export interface GradingResult {
  score: number;
  maxScore: number;
  percentage: number;
  correctness: Correctness;
  feedback: GradingFeedback;
  rubricScores?: RubricScore[];
  conceptsAssessed?: string[];
  conceptsMastered?: string[];
  conceptsToReview?: string[];
  gradedAt: string;
  gradedBy: GraderType;
  confidence: number;
}

export interface GradingRequest {
  questionId: string;
  questionType: 'MCQ' | 'SHORT_ANSWER' | 'EXTENDED_RESPONSE';
  questionStem: string;
  modelSolution: string;
  studentAnswer: string;
  selectedOptionId?: string;
  correctOptionId?: string;
  mcqOptions?: {
    id: string;
    text: string;
    isCorrect: boolean;
    feedback?: string;
  }[];
  curriculum?: {
    subject: string;
    year: number;
    topic: string;
    concepts?: string[];
  };
  difficulty: number;
}

// Mastery utilities
export function getMasteryLevel(percentage: number): MasteryLevel {
  if (percentage >= 80) return 'mastered';
  if (percentage >= 60) return 'proficient';
  if (percentage >= 40) return 'developing';
  return 'novice';
}

export const MASTERY_CONFIG = {
  novice: { color: 'red', bgLight: 'bg-red-50', text: 'text-red-600', label: 'Keep Practicing' },
  developing: { color: 'orange', bgLight: 'bg-orange-50', text: 'text-orange-600', label: 'Getting There' },
  proficient: { color: 'blue', bgLight: 'bg-blue-50', text: 'text-blue-600', label: 'Good Job!' },
  mastered: { color: 'green', bgLight: 'bg-green-50', text: 'text-green-600', label: 'Mastered!' },
};
```

---

## Phase 2: Grading Service

### File: `src/services/gradingService.ts` (NEW)

```typescript
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import { GradingRequest, GradingResult, GradingFeedback } from '@/types/grading';

/**
 * Grade an MCQ answer instantly (no API call needed)
 */
export function gradeMCQ(request: GradingRequest): GradingResult {
  const { selectedOptionId, correctOptionId, mcqOptions } = request;

  if (!selectedOptionId || !correctOptionId || !mcqOptions) {
    throw new Error('MCQ grading requires selectedOptionId, correctOptionId, and mcqOptions');
  }

  const isCorrect = selectedOptionId === correctOptionId;
  const selectedOption = mcqOptions.find(o => o.id === selectedOptionId);
  const correctOption = mcqOptions.find(o => o.id === correctOptionId);

  const feedback: GradingFeedback = {
    summary: isCorrect
      ? `Correct! ${selectedOption?.feedback || 'Well done!'}`
      : `Incorrect. ${selectedOption?.feedback || ''} The correct answer was: ${correctOption?.text}`,
    whatWasRight: isCorrect ? ['You selected the correct answer'] : [],
    whatWasMissing: isCorrect ? [] : [`Understanding why "${correctOption?.text}" is the correct answer`],
    misconceptions: [],
    suggestions: isCorrect ? [] : ['Review the solution explanation carefully'],
  };

  return {
    score: isCorrect ? 1 : 0,
    maxScore: 1,
    percentage: isCorrect ? 100 : 0,
    correctness: isCorrect ? 'correct' : 'incorrect',
    feedback,
    gradedAt: new Date().toISOString(),
    gradedBy: 'auto',
    confidence: 1.0,
  };
}

/**
 * Grade a SHORT_ANSWER or EXTENDED_RESPONSE using AI
 */
export async function gradeWithAI(request: GradingRequest): Promise<GradingResult> {
  const gradeAnswer = httpsCallable<GradingRequest, GradingResult>(
    functions,
    'gradeAnswer'
  );

  try {
    const result = await gradeAnswer(request);
    return result.data;
  } catch (error) {
    console.error('AI grading error:', error);
    throw new Error('Failed to grade answer. Please try again.');
  }
}

/**
 * Grade any question type - routes to appropriate grader
 */
export async function gradeAnswer(request: GradingRequest): Promise<GradingResult> {
  if (request.questionType === 'MCQ') {
    return gradeMCQ(request);
  }
  return gradeWithAI(request);
}

/**
 * Calculate points based on question type and difficulty
 */
export function calculateMaxPoints(
  questionType: 'MCQ' | 'SHORT_ANSWER' | 'EXTENDED_RESPONSE',
  difficulty: number
): number {
  const pointsMatrix = {
    MCQ: [1, 1, 2, 2, 3],
    SHORT_ANSWER: [2, 3, 4, 5, 6],
    EXTENDED_RESPONSE: [4, 6, 8, 10, 12],
  };

  const difficultyIndex = Math.max(0, Math.min(4, difficulty - 1));
  return pointsMatrix[questionType][difficultyIndex];
}
```

---

## Phase 3: Cloud Function

### File: `functions/src/gradeAnswer.ts` (NEW)

```typescript
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import Anthropic from '@anthropic-ai/sdk';

interface GradingRequest {
  questionId: string;
  questionType: 'MCQ' | 'SHORT_ANSWER' | 'EXTENDED_RESPONSE';
  questionStem: string;
  modelSolution: string;
  studentAnswer: string;
  curriculum?: {
    subject: string;
    year: number;
    topic: string;
  };
  difficulty: number;
}

const SHORT_ANSWER_RUBRIC = {
  maxMarks: 4,
  criteria: [
    { name: 'Understanding', maxMarks: 2 },
    { name: 'Accuracy', maxMarks: 1 },
    { name: 'Terminology', maxMarks: 1 },
  ],
};

const EXTENDED_RUBRIC = {
  maxMarks: 10,
  criteria: [
    { name: 'Content Knowledge', maxMarks: 4 },
    { name: 'Scientific Reasoning', maxMarks: 3 },
    { name: 'Communication', maxMarks: 3 },
  ],
};

function buildGradingPrompt(request: GradingRequest, rubric: typeof SHORT_ANSWER_RUBRIC): string {
  const { questionStem, modelSolution, studentAnswer, curriculum } = request;

  const rubricText = rubric.criteria
    .map(c => `- ${c.name} (0-${c.maxMarks} marks)`)
    .join('\n');

  return `You are an expert teacher grading a Year ${curriculum?.year || 8} ${curriculum?.subject || 'Science'} question.

## Question
${questionStem}

## Model Solution
${modelSolution}

## Student Answer
${studentAnswer}

## Grading Rubric (Total: ${rubric.maxMarks} marks)
${rubricText}

## Instructions
1. Compare the student answer to the model solution
2. Award marks based on the rubric criteria
3. Identify what the student got right
4. Identify what is missing or incorrect
5. Note any misconceptions revealed
6. Provide constructive, encouraging feedback suitable for a Year ${curriculum?.year || 8} student

Respond ONLY with valid JSON in this exact format:
{
  "score": <number 0-${rubric.maxMarks}>,
  "rubricScores": [
    {"criterion": "Understanding", "score": <0-2>, "feedback": "..."},
    {"criterion": "Accuracy", "score": <0-1>, "feedback": "..."},
    {"criterion": "Terminology", "score": <0-1>, "feedback": "..."}
  ],
  "whatWasRight": ["...", "..."],
  "whatWasMissing": ["...", "..."],
  "misconceptions": ["..."],
  "summary": "A brief 1-2 sentence overall feedback",
  "suggestions": ["How to improve..."]
}`;
}

export const gradeAnswer = functions
  .region('us-central1')
  .https.onCall(async (data: GradingRequest, context) => {
    // Auth check
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Must be logged in to grade answers'
      );
    }

    const { questionType, studentAnswer } = data;

    // Validate input
    if (!studentAnswer || studentAnswer.trim().length < 3) {
      return {
        score: 0,
        maxScore: questionType === 'EXTENDED_RESPONSE' ? 10 : 4,
        percentage: 0,
        correctness: 'incorrect',
        feedback: {
          summary: 'Your answer is too short. Please provide a more complete response.',
          whatWasRight: [],
          whatWasMissing: ['A substantive answer'],
          misconceptions: [],
          suggestions: ['Read the question carefully and provide a complete answer'],
        },
        gradedAt: new Date().toISOString(),
        gradedBy: 'auto',
        confidence: 1.0,
      };
    }

    // Select rubric based on question type
    const rubric = questionType === 'EXTENDED_RESPONSE' ? EXTENDED_RUBRIC : SHORT_ANSWER_RUBRIC;

    // Call Claude API
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const prompt = buildGradingPrompt(data, rubric);

    try {
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      });

      // Parse response
      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type');
      }

      const parsed = JSON.parse(content.text);

      // Calculate percentage and correctness
      const percentage = Math.round((parsed.score / rubric.maxMarks) * 100);
      let correctness: 'correct' | 'partial' | 'incorrect';
      if (percentage >= 80) correctness = 'correct';
      else if (percentage >= 40) correctness = 'partial';
      else correctness = 'incorrect';

      const result = {
        score: parsed.score,
        maxScore: rubric.maxMarks,
        percentage,
        correctness,
        feedback: {
          summary: parsed.summary,
          whatWasRight: parsed.whatWasRight || [],
          whatWasMissing: parsed.whatWasMissing || [],
          misconceptions: parsed.misconceptions || [],
          suggestions: parsed.suggestions || [],
        },
        rubricScores: parsed.rubricScores,
        gradedAt: new Date().toISOString(),
        gradedBy: 'ai' as const,
        confidence: 0.85,
      };

      // Save attempt to Firestore
      const db = admin.firestore();
      await db.collection('users').doc(context.auth.uid).collection('attempts').add({
        questionId: data.questionId,
        answer: studentAnswer,
        grading: result,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return result;
    } catch (error) {
      console.error('Grading error:', error);
      throw new functions.https.HttpsError(
        'internal',
        'Failed to grade answer'
      );
    }
  });
```

---

## Phase 4: UI Components

### File: `src/components/GradingResultCard.tsx` (NEW)

```tsx
'use client';

import { GradingResult, getMasteryLevel, MASTERY_CONFIG } from '@/types/grading';

interface GradingResultCardProps {
  result: GradingResult;
  showDetails?: boolean;
}

export function GradingResultCard({ result, showDetails = true }: GradingResultCardProps) {
  const masteryLevel = getMasteryLevel(result.percentage);
  const config = MASTERY_CONFIG[masteryLevel];

  return (
    <div className={`rounded-xl p-6 ${config.bgLight} border-2 border-${config.color}-200`}>
      {/* Score Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          {/* Correctness Icon */}
          <div className={`w-14 h-14 rounded-full flex items-center justify-center ${
            result.correctness === 'correct' ? 'bg-green-500' :
            result.correctness === 'partial' ? 'bg-orange-500' : 'bg-red-500'
          }`}>
            {result.correctness === 'correct' && (
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
            {result.correctness === 'partial' && (
              <span className="text-white text-2xl font-bold">~</span>
            )}
            {result.correctness === 'incorrect' && (
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </div>

          {/* Score Text */}
          <div>
            <div className="text-3xl font-bold text-gray-900">
              {result.score}/{result.maxScore}
            </div>
            <div className="text-sm text-gray-600">
              {result.percentage}% • {config.label}
            </div>
          </div>
        </div>

        {/* Mastery Badge */}
        <div className={`px-4 py-2 rounded-full ${config.bgLight} border ${
          result.correctness === 'correct' ? 'border-green-300' :
          result.correctness === 'partial' ? 'border-orange-300' : 'border-red-300'
        }`}>
          <span className={config.text + ' font-semibold capitalize'}>
            {masteryLevel}
          </span>
        </div>
      </div>

      {/* Feedback Summary */}
      <div className="mb-4 p-4 bg-white rounded-lg shadow-sm">
        <p className="text-gray-800 leading-relaxed">{result.feedback.summary}</p>
      </div>

      {showDetails && (
        <div className="space-y-4">
          {/* What Was Right */}
          {result.feedback.whatWasRight.length > 0 && (
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                What you got right
              </h4>
              <ul className="space-y-1">
                {result.feedback.whatWasRight.map((item, i) => (
                  <li key={i} className="text-sm text-green-700 flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* What Was Missing */}
          {result.feedback.whatWasMissing.length > 0 && (
            <div className="bg-amber-50 p-4 rounded-lg">
              <h4 className="font-semibold text-amber-800 mb-2 flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                What was missing
              </h4>
              <ul className="space-y-1">
                {result.feedback.whatWasMissing.map((item, i) => (
                  <li key={i} className="text-sm text-amber-700 flex items-start gap-2">
                    <span className="text-amber-500 mt-0.5">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Misconceptions */}
          {result.feedback.misconceptions.length > 0 && (
            <div className="bg-red-50 p-4 rounded-lg">
              <h4 className="font-semibold text-red-800 mb-2 flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Watch out for
              </h4>
              <ul className="space-y-1">
                {result.feedback.misconceptions.map((item, i) => (
                  <li key={i} className="text-sm text-red-700 flex items-start gap-2">
                    <span className="text-red-500 mt-0.5">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Suggestions */}
          {result.feedback.suggestions.length > 0 && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
                </svg>
                To improve
              </h4>
              <ul className="space-y-1">
                {result.feedback.suggestions.map((item, i) => (
                  <li key={i} className="text-sm text-blue-700 flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Rubric Scores (if available) */}
          {result.rubricScores && result.rubricScores.length > 0 && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-800 mb-3">Detailed Scores</h4>
              <div className="space-y-2">
                {result.rubricScores.map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">{item.criterion}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${(item.score / item.maxScore) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-700">
                        {item.score}/{item.maxScore}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

---

## Phase 5: Update SetPlayerClient

### Modify: `src/components/SetPlayerClient.tsx`

Key changes:
1. Replace "Mark Complete" with "Submit Answer"
2. Add grading state management
3. Show GradingResultCard after submission
4. Track scores in progress

```tsx
// Add to SetPlayerClient.tsx

// New imports
import { GradingResult } from '@/types/grading';
import { gradeAnswer } from '@/services/gradingService';
import { GradingResultCard } from '@/components/GradingResultCard';

// Add state
const [gradingResult, setGradingResult] = useState<GradingResult | null>(null);
const [isGrading, setIsGrading] = useState(false);
const [hasSubmitted, setHasSubmitted] = useState(false);

// New submit handler
const handleSubmitAnswer = async () => {
  if (!currentQuestion || !userAnswer.trim()) return;

  setIsGrading(true);
  try {
    const result = await gradeAnswer({
      questionId: currentQuestion.questionId,
      questionType: currentQuestion.questionType,
      questionStem: currentQuestion.stem,
      modelSolution: currentQuestion.solution || '',
      studentAnswer: userAnswer,
      selectedOptionId: selectedOption, // For MCQ
      correctOptionId: currentQuestion.mcqOptions?.find(o => o.isCorrect)?.id,
      mcqOptions: currentQuestion.mcqOptions,
      curriculum: currentQuestion.curriculum,
      difficulty: currentQuestion.difficulty,
    });

    setGradingResult(result);
    setHasSubmitted(true);

    // Update progress with score
    markCompleted(currentQuestionIndex, userAnswer, result);
  } catch (error) {
    console.error('Grading failed:', error);
    // Show error toast
  } finally {
    setIsGrading(false);
  }
};

// Replace "Mark Complete" button with:
{!hasSubmitted ? (
  <button
    onClick={handleSubmitAnswer}
    disabled={!userAnswer.trim() || isGrading}
    className={`w-full py-3.5 px-4 ${colorClasses.progressBg} text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50`}
  >
    {isGrading ? (
      <>
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
        Grading...
      </>
    ) : (
      <>
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Submit Answer
      </>
    )}
  </button>
) : (
  <GradingResultCard result={gradingResult!} />
)}
```

---

## Phase 6: Update Progress Hook

### Modify: `src/hooks/useSetProgress.ts`

Add score tracking to progress:

```typescript
export interface QuestionResult {
  answer: string;
  score: number;
  maxScore: number;
  percentage: number;
  correctness: 'correct' | 'partial' | 'incorrect';
  gradedAt: string;
}

export interface SetProgress {
  completedQuestions: number[];
  answers: Record<number, string>;
  results: Record<number, QuestionResult>;  // NEW
  totalScore: number;                        // NEW
  totalMaxScore: number;                     // NEW
  lastAccessed: number;
  totalQuestions: number;
}

// Update markCompleted to include grading result
const markCompleted = useCallback((
  questionIndex: number,
  answer: string,
  gradingResult?: GradingResult
) => {
  setProgress(prev => {
    const newProgress: SetProgress = {
      ...prev,
      completedQuestions: prev.completedQuestions.includes(questionIndex)
        ? prev.completedQuestions
        : [...prev.completedQuestions, questionIndex],
      answers: { ...prev.answers, [questionIndex]: answer },
      results: gradingResult ? {
        ...prev.results,
        [questionIndex]: {
          answer,
          score: gradingResult.score,
          maxScore: gradingResult.maxScore,
          percentage: gradingResult.percentage,
          correctness: gradingResult.correctness,
          gradedAt: gradingResult.gradedAt,
        },
      } : prev.results,
      totalScore: gradingResult
        ? Object.values({ ...prev.results, [questionIndex]: { score: gradingResult.score } })
            .reduce((sum, r) => sum + r.score, 0)
        : prev.totalScore,
      totalMaxScore: gradingResult
        ? Object.values({ ...prev.results, [questionIndex]: { maxScore: gradingResult.maxScore } })
            .reduce((sum, r) => sum + r.maxScore, 0)
        : prev.totalMaxScore,
      lastAccessed: Date.now(),
    };

    // Save
    if (user) {
      saveSetProgressToFirestore(user.uid, setId, newProgress);
    } else {
      saveSetProgressToStorage(setId, newProgress);
    }

    return newProgress;
  });
}, [user, setId]);
```

---

## Implementation Checklist

### Week 1: Foundation
- [ ] Create `src/types/grading.ts`
- [ ] Create `src/services/gradingService.ts`
- [ ] Implement MCQ auto-grading
- [ ] Create `GradingResultCard` component
- [ ] Update `SetPlayerClient` with submit flow

### Week 2: AI Grading
- [ ] Create Cloud Function `gradeAnswer`
- [ ] Set up Anthropic API in Cloud Functions
- [ ] Build grading prompts for SHORT_ANSWER
- [ ] Build grading prompts for EXTENDED_RESPONSE
- [ ] Test with sample questions

### Week 3: Progress & Analytics
- [ ] Update `useSetProgress` hook
- [ ] Add score tracking to Firestore
- [ ] Create progress summary views
- [ ] Build mastery level indicators
- [ ] Add set completion summary

### Week 4: Polish & Deploy
- [ ] Error handling and edge cases
- [ ] Loading states and animations
- [ ] Mobile responsive design
- [ ] Performance optimization
- [ ] Deploy Cloud Functions
- [ ] End-to-end testing

---

## Files Summary

| File | Action | Priority |
|------|--------|----------|
| `src/types/grading.ts` | CREATE | P1 |
| `src/services/gradingService.ts` | CREATE | P1 |
| `src/components/GradingResultCard.tsx` | CREATE | P1 |
| `src/components/SetPlayerClient.tsx` | MODIFY | P1 |
| `src/hooks/useSetProgress.ts` | MODIFY | P1 |
| `functions/src/gradeAnswer.ts` | CREATE | P2 |
| `functions/src/index.ts` | MODIFY | P2 |
| `src/components/ProgressDashboard.tsx` | CREATE | P3 |
| `src/services/analyticsService.ts` | CREATE | P3 |

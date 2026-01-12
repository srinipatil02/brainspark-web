# AI Grading & Feedback Architecture

## Problem Statement

BrainSpark currently has **NO answer evaluation system**. Students:
- Submit answers that are accepted without evaluation
- Receive no feedback on correctness
- Cannot see scores or marks
- Have no way to track learning progress or identify weak areas

This is a **critical pedagogical gap** that undermines the learning experience.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           GRADING ARCHITECTURE                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────┐     ┌─────────────────┐     ┌──────────────────────┐     │
│   │   Client    │     │   Cloud Func    │     │    Firestore         │     │
│   │   (React)   │────▶│   (AI Grading)  │────▶│    (Results)         │     │
│   └─────────────┘     └─────────────────┘     └──────────────────────┘     │
│         │                     │                        │                    │
│         │                     ▼                        │                    │
│         │            ┌─────────────────┐               │                    │
│         │            │  Claude API     │               │                    │
│         │            │  (AI Evaluator) │               │                    │
│         │            └─────────────────┘               │                    │
│         │                                              │                    │
│         ▼                                              ▼                    │
│   ┌─────────────────────────────────────────────────────────────┐          │
│   │                    FEEDBACK DISPLAY                          │          │
│   │  • Score badge (2/4 marks)                                   │          │
│   │  • Correctness indicator (✓/✗/partial)                       │          │
│   │  • Detailed feedback (what was right/wrong)                  │          │
│   │  • Concept gaps identified                                   │          │
│   │  • Improvement suggestions                                    │          │
│   └─────────────────────────────────────────────────────────────┘          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Component Design

### 1. Answer Evaluation Service

```typescript
// src/services/answerGradingService.ts

export interface GradingRequest {
  questionId: string;
  questionType: 'MCQ' | 'SHORT_ANSWER' | 'EXTENDED_RESPONSE';
  questionStem: string;
  modelSolution: string;
  studentAnswer: string;
  curriculum: {
    subject: string;
    year: number;
    topic: string;
    concepts: string[];
  };
  rubric?: GradingRubric;
}

export interface GradingRubric {
  maxMarks: number;
  criteria: {
    name: string;
    maxMarks: number;
    descriptors: {
      marks: number;
      description: string;
    }[];
  }[];
}

export interface GradingResult {
  // Core result
  score: number;           // 0-maxMarks
  maxScore: number;        // Total possible marks
  percentage: number;      // 0-100
  isCorrect: boolean;      // For binary correct/incorrect
  correctness: 'correct' | 'partial' | 'incorrect';

  // Feedback
  feedback: {
    summary: string;       // "Good understanding of X, but missed Y"
    whatWasRight: string[];
    whatWasMissing: string[];
    misconceptions: string[];  // Identified misconceptions
    suggestions: string[];     // How to improve
  };

  // Detailed rubric breakdown (for SHORT_ANSWER/EXTENDED)
  rubricScores?: {
    criterion: string;
    score: number;
    maxScore: number;
    feedback: string;
  }[];

  // Concept tracking
  conceptsAssessed: string[];
  conceptsMastered: string[];
  conceptsToReview: string[];

  // Metadata
  gradedAt: string;
  gradedBy: 'auto' | 'ai' | 'human';
  confidence: number;      // AI confidence 0-1
}
```

### 2. Question Type-Specific Grading

#### MCQ - Automatic Grading
```typescript
// Instant, no AI needed
function gradeMCQ(
  selectedOptionId: string,
  correctOptionId: string,
  options: MCQOption[]
): GradingResult {
  const isCorrect = selectedOptionId === correctOptionId;
  const selectedOption = options.find(o => o.id === selectedOptionId);
  const correctOption = options.find(o => o.id === correctOptionId);

  return {
    score: isCorrect ? 1 : 0,
    maxScore: 1,
    percentage: isCorrect ? 100 : 0,
    isCorrect,
    correctness: isCorrect ? 'correct' : 'incorrect',
    feedback: {
      summary: isCorrect
        ? "Correct! " + (selectedOption?.feedback || "Well done!")
        : `Incorrect. ${selectedOption?.feedback || ''} The correct answer is ${correctOption?.text}`,
      whatWasRight: isCorrect ? ['Selected the correct answer'] : [],
      whatWasMissing: isCorrect ? [] : ['Understanding of why ' + correctOption?.text + ' is correct'],
      misconceptions: [],
      suggestions: isCorrect ? [] : ['Review the explanation in the solution'],
    },
    gradedAt: new Date().toISOString(),
    gradedBy: 'auto',
    confidence: 1.0,
  };
}
```

#### SHORT_ANSWER - AI Grading
```typescript
// Cloud Function: gradeShortAnswer
// Uses Claude to evaluate against model solution

const GRADING_PROMPT = `You are an expert teacher grading a Year {year} {subject} question.

## Question
{questionStem}

## Model Solution
{modelSolution}

## Student Answer
{studentAnswer}

## Grading Rubric
- Understanding of core concept (0-2 marks)
- Accuracy of information (0-1 mark)
- Use of scientific terminology (0-1 mark)
Total: 4 marks

## Instructions
1. Compare the student answer to the model solution
2. Award marks based on the rubric
3. Identify what the student got right
4. Identify what is missing or incorrect
5. Note any misconceptions revealed
6. Provide constructive feedback

Respond in JSON format:
{
  "score": <number 0-4>,
  "whatWasRight": ["...", "..."],
  "whatWasMissing": ["...", "..."],
  "misconceptions": ["...", "..."],
  "feedback": "...",
  "suggestions": ["...", "..."]
}`;
```

#### EXTENDED_RESPONSE - AI Grading with Rubric
```typescript
// More detailed rubric for longer responses
const EXTENDED_RUBRIC = {
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
      ]
    },
    {
      name: 'Scientific Reasoning',
      maxMarks: 3,
      descriptors: [
        { marks: 3, description: 'Clear logical connections, cause-effect explained' },
        { marks: 2, description: 'Some reasoning shown, connections made' },
        { marks: 1, description: 'Limited reasoning, few connections' },
        { marks: 0, description: 'No reasoning or illogical' },
      ]
    },
    {
      name: 'Communication',
      maxMarks: 3,
      descriptors: [
        { marks: 3, description: 'Clear, well-organized, uses terminology correctly' },
        { marks: 2, description: 'Generally clear, some terminology used' },
        { marks: 1, description: 'Unclear or disorganized, limited terminology' },
        { marks: 0, description: 'Very unclear or no attempt' },
      ]
    },
  ]
};
```

---

## 3. Scoring System

### Points Allocation

| Question Type | Difficulty 1 | Difficulty 2 | Difficulty 3 | Difficulty 4 | Difficulty 5 |
|---------------|--------------|--------------|--------------|--------------|--------------|
| MCQ | 1 pt | 1 pt | 2 pts | 2 pts | 3 pts |
| SHORT_ANSWER | 2 pts | 3 pts | 4 pts | 5 pts | 6 pts |
| EXTENDED | 4 pts | 6 pts | 8 pts | 10 pts | 12 pts |

### Mastery Levels

```typescript
export type MasteryLevel =
  | 'novice'        // 0-39%
  | 'developing'    // 40-59%
  | 'proficient'    // 60-79%
  | 'mastered'      // 80-100%

export function getMasteryLevel(percentage: number): MasteryLevel {
  if (percentage >= 80) return 'mastered';
  if (percentage >= 60) return 'proficient';
  if (percentage >= 40) return 'developing';
  return 'novice';
}

export const MASTERY_COLORS = {
  novice: 'red',
  developing: 'orange',
  proficient: 'blue',
  mastered: 'green',
};
```

---

## 4. Firestore Data Model

### Enhanced Attempt Document

```typescript
// Collection: users/{userId}/attempts/{attemptId}
interface AttemptDocument {
  // Identity
  attemptId: string;
  userId: string;
  questionId: string;
  setId: string;

  // Answer
  answer: string;
  selectedOptionId?: string;  // For MCQ

  // Grading Result
  grading: {
    score: number;
    maxScore: number;
    percentage: number;
    correctness: 'correct' | 'partial' | 'incorrect';

    feedback: {
      summary: string;
      whatWasRight: string[];
      whatWasMissing: string[];
      misconceptions: string[];
      suggestions: string[];
    };

    rubricScores?: {
      criterion: string;
      score: number;
      maxScore: number;
    }[];

    gradedBy: 'auto' | 'ai' | 'human';
    confidence: number;
  };

  // Context
  hintsUsed: number;
  timeSpentSeconds: number;
  attemptNumber: number;  // 1st, 2nd, 3rd attempt at same question

  // Timestamps
  createdAt: Timestamp;
  gradedAt: Timestamp;
}
```

### Progress Summary Document

```typescript
// Collection: users/{userId}/progress/{setId}
interface SetProgressDocument {
  setId: string;

  // Question-level tracking
  questions: {
    [questionIndex: number]: {
      attemptCount: number;
      bestScore: number;
      maxScore: number;
      bestPercentage: number;
      lastAttemptId: string;
      masteryLevel: MasteryLevel;
    };
  };

  // Set-level aggregates
  summary: {
    questionsAttempted: number;
    questionsCorrect: number;
    totalScore: number;
    maxPossibleScore: number;
    percentage: number;
    masteryLevel: MasteryLevel;
    averageTimePerQuestion: number;
    hintsUsed: number;
  };

  // Learning analytics
  analytics: {
    conceptScores: {
      [concept: string]: {
        score: number;
        maxScore: number;
        percentage: number;
      };
    };
    misconceptionsIdentified: string[];
    strongAreas: string[];
    areasToImprove: string[];
  };

  // Timestamps
  firstAttemptAt: Timestamp;
  lastAttemptAt: Timestamp;
  completedAt?: Timestamp;
}
```

### User Analytics Document

```typescript
// Collection: users/{userId}/analytics/summary
interface UserAnalyticsSummary {
  // Overall stats
  totalQuestionsAttempted: number;
  totalCorrect: number;
  totalScore: number;
  totalMaxScore: number;
  overallPercentage: number;
  overallMastery: MasteryLevel;

  // By subject
  bySubject: {
    [subject: string]: {
      questionsAttempted: number;
      percentage: number;
      masteryLevel: MasteryLevel;
      lastPracticeAt: Timestamp;
    };
  };

  // By topic
  byTopic: {
    [topicKey: string]: {
      questionsAttempted: number;
      percentage: number;
      masteryLevel: MasteryLevel;
    };
  };

  // Streaks and engagement
  currentStreak: number;
  longestStreak: number;
  questionsThisWeek: number;

  // Recommendations
  recommendedTopics: string[];
  conceptsToReview: string[];

  // Timestamps
  updatedAt: Timestamp;
}
```

---

## 5. UI Components

### GradingResultCard Component

```tsx
// src/components/GradingResultCard.tsx

interface GradingResultCardProps {
  result: GradingResult;
  showDetails?: boolean;
}

function GradingResultCard({ result, showDetails = true }: GradingResultCardProps) {
  const masteryLevel = getMasteryLevel(result.percentage);

  return (
    <div className={`rounded-xl p-6 ${MASTERY_BG_COLORS[masteryLevel]}`}>
      {/* Score Badge */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {result.correctness === 'correct' && (
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
              <CheckIcon className="w-6 h-6 text-white" />
            </div>
          )}
          {result.correctness === 'partial' && (
            <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold">~</span>
            </div>
          )}
          {result.correctness === 'incorrect' && (
            <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
              <XIcon className="w-6 h-6 text-white" />
            </div>
          )}
          <div>
            <div className="text-2xl font-bold">
              {result.score}/{result.maxScore}
            </div>
            <div className="text-sm text-gray-600">
              {result.percentage}%
            </div>
          </div>
        </div>
        <MasteryBadge level={masteryLevel} />
      </div>

      {/* Feedback Summary */}
      <div className="mb-4 p-4 bg-white/50 rounded-lg">
        <p className="text-gray-800">{result.feedback.summary}</p>
      </div>

      {showDetails && (
        <>
          {/* What Was Right */}
          {result.feedback.whatWasRight.length > 0 && (
            <div className="mb-3">
              <h4 className="font-semibold text-green-700 mb-2">✓ What you got right:</h4>
              <ul className="space-y-1">
                {result.feedback.whatWasRight.map((item, i) => (
                  <li key={i} className="text-sm text-gray-700 pl-4">• {item}</li>
                ))}
              </ul>
            </div>
          )}

          {/* What Was Missing */}
          {result.feedback.whatWasMissing.length > 0 && (
            <div className="mb-3">
              <h4 className="font-semibold text-amber-700 mb-2">△ What was missing:</h4>
              <ul className="space-y-1">
                {result.feedback.whatWasMissing.map((item, i) => (
                  <li key={i} className="text-sm text-gray-700 pl-4">• {item}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Misconceptions */}
          {result.feedback.misconceptions.length > 0 && (
            <div className="mb-3">
              <h4 className="font-semibold text-red-700 mb-2">⚠ Watch out for:</h4>
              <ul className="space-y-1">
                {result.feedback.misconceptions.map((item, i) => (
                  <li key={i} className="text-sm text-gray-700 pl-4">• {item}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Suggestions */}
          {result.feedback.suggestions.length > 0 && (
            <div>
              <h4 className="font-semibold text-blue-700 mb-2">💡 To improve:</h4>
              <ul className="space-y-1">
                {result.feedback.suggestions.map((item, i) => (
                  <li key={i} className="text-sm text-gray-700 pl-4">• {item}</li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}
```

### ProgressDashboard Component

```tsx
// src/components/ProgressDashboard.tsx

function ProgressDashboard({ userId }: { userId: string }) {
  const { analytics, loading } = useUserAnalytics(userId);

  if (loading) return <Skeleton />;

  return (
    <div className="space-y-6">
      {/* Overall Progress */}
      <div className="bg-white rounded-xl p-6 shadow">
        <h2 className="text-xl font-bold mb-4">Your Progress</h2>
        <div className="grid grid-cols-4 gap-4">
          <StatCard
            label="Questions Answered"
            value={analytics.totalQuestionsAttempted}
            icon="📝"
          />
          <StatCard
            label="Correct"
            value={`${analytics.totalCorrect} (${Math.round(analytics.totalCorrect/analytics.totalQuestionsAttempted*100)}%)`}
            icon="✓"
          />
          <StatCard
            label="Current Streak"
            value={`${analytics.currentStreak} days`}
            icon="🔥"
          />
          <StatCard
            label="Overall Mastery"
            value={analytics.overallMastery}
            icon="⭐"
          />
        </div>
      </div>

      {/* Subject Breakdown */}
      <div className="bg-white rounded-xl p-6 shadow">
        <h2 className="text-xl font-bold mb-4">By Subject</h2>
        <div className="space-y-4">
          {Object.entries(analytics.bySubject).map(([subject, data]) => (
            <SubjectProgressBar
              key={subject}
              subject={subject}
              percentage={data.percentage}
              masteryLevel={data.masteryLevel}
              questionsAttempted={data.questionsAttempted}
            />
          ))}
        </div>
      </div>

      {/* Areas to Improve */}
      {analytics.conceptsToReview.length > 0 && (
        <div className="bg-amber-50 rounded-xl p-6 border border-amber-200">
          <h2 className="text-xl font-bold mb-4 text-amber-800">
            📚 Recommended Review
          </h2>
          <div className="flex flex-wrap gap-2">
            {analytics.conceptsToReview.map((concept) => (
              <Link
                key={concept}
                href={`/practice/${concept}`}
                className="px-4 py-2 bg-amber-100 text-amber-800 rounded-lg hover:bg-amber-200"
              >
                {concept}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## 6. Cloud Functions

### gradeAnswer Function

```typescript
// functions/src/gradeAnswer.ts

import * as functions from 'firebase-functions';
import Anthropic from '@anthropic-ai/sdk';

export const gradeAnswer = functions
  .region('us-central1')
  .https.onCall(async (data, context) => {
    // Authentication check
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Must be logged in to grade answers'
      );
    }

    const { questionType, questionStem, modelSolution, studentAnswer, curriculum } = data;

    // MCQ - instant grading
    if (questionType === 'MCQ') {
      return gradeMCQ(data.selectedOptionId, data.correctOptionId, data.options);
    }

    // SHORT_ANSWER and EXTENDED_RESPONSE - AI grading
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const rubric = questionType === 'EXTENDED_RESPONSE'
      ? EXTENDED_RUBRIC
      : SHORT_ANSWER_RUBRIC;

    const prompt = buildGradingPrompt({
      questionStem,
      modelSolution,
      studentAnswer,
      curriculum,
      rubric,
    });

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const result = parseGradingResponse(response, rubric);

    // Save to Firestore
    await saveAttempt(context.auth.uid, data.questionId, {
      answer: studentAnswer,
      grading: result,
    });

    return result;
  });
```

---

## 7. Implementation Phases

### Phase 1: MCQ Auto-Grading (1-2 days)
- Add instant feedback for MCQ questions
- Show correct/incorrect indicator
- Display option-specific feedback
- Update progress tracking with scores

### Phase 2: Cloud Function for AI Grading (2-3 days)
- Create `gradeAnswer` Cloud Function
- Integrate Claude API for evaluation
- Build grading prompts for SHORT_ANSWER
- Test with sample questions

### Phase 3: UI Components (2-3 days)
- Build `GradingResultCard` component
- Update `SetPlayerClient` with grading flow
- Add loading states during grading
- Create "Submit for Grading" button

### Phase 4: Progress Analytics (2-3 days)
- Build analytics aggregation
- Create `ProgressDashboard` component
- Add mastery level tracking
- Implement concept-level scoring

### Phase 5: Enhanced Feedback (1-2 days)
- Misconception identification
- Improvement suggestions
- Link to related practice

---

## 8. Cost Considerations

### AI Grading Costs (Claude API)

| Question Type | Avg Tokens | Cost/Question | 1000 Questions |
|---------------|------------|---------------|----------------|
| MCQ | 0 (auto) | $0.00 | $0.00 |
| SHORT_ANSWER | ~800 | ~$0.002 | ~$2.00 |
| EXTENDED | ~1500 | ~$0.004 | ~$4.00 |

### Optimization Strategies
1. **MCQ first** - Instant, free grading
2. **Batch grading** - Grade at set completion, not per-question
3. **Caching** - Cache similar answers for identical questions
4. **Confidence threshold** - Only flag low-confidence for human review

---

## 9. Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Answer feedback rate | 0% | 100% |
| Time to feedback | N/A | <3 seconds (MCQ), <5 seconds (AI) |
| Student engagement | ? | +30% return rate |
| Learning visibility | None | Full progress dashboard |
| Concept mastery tracking | None | Per-concept scores |

---

## 10. Open Questions

1. **Retry policy**: How many attempts before showing solution?
2. **Partial credit**: How granular? (0.5 marks?)
3. **Human review**: When to flag for teacher review?
4. **Gamification**: Points, badges, leaderboards?
5. **Parent visibility**: Share progress reports?

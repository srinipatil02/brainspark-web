// =============================================================================
// SESSION SUMMARY SERVICE
// =============================================================================
// FILE: src/services/nsw-selective/sessionSummaryService.ts
// DOMAIN: NSW Selective Exam Prep - AI Tutoring
// PURPOSE: Generate personalized end-of-session analysis and recommendations
// DO NOT: Be discouraging or use generic feedback

import { FirestoreQuestion, ArchetypeId } from '@/types';
import { DistractorType, ArchetypeProgress, ARCHETYPE_CATALOG } from '@/types/nsw-selective';
import { summarizeErrorPatterns } from './errorFeedbackService';

// =============================================================================
// TYPES
// =============================================================================

export interface SessionAnswer {
  questionId: string;
  isCorrect: boolean;
  timeSeconds: number;
  selectedOption?: string;
  errorType?: string;
}

export interface SessionSummaryRequest {
  archetypeId: ArchetypeId;
  answers: SessionAnswer[];
  questions: FirestoreQuestion[];
  previousProgress?: ArchetypeProgress | null;
  totalSessionTime: number;
}

export interface SessionSummary {
  // Basic metrics
  totalQuestions: number;
  correctCount: number;
  accuracy: number;
  averageTimeSeconds: number;
  totalTimeSeconds: number;

  // Performance analysis
  performanceLevel: 'excellent' | 'good' | 'developing' | 'needs_work';
  performanceMessage: string;

  // Strengths identified
  strengths: string[];

  // Areas for improvement
  improvements: string[];

  // Error pattern analysis
  errorAnalysis: {
    topErrors: Array<{ type: DistractorType; count: number; description: string }>;
    hasPattern: boolean;
    patternMessage?: string;
  };

  // Time analysis
  timeAnalysis: {
    status: 'fast' | 'on_target' | 'slow';
    message: string;
    improvement?: number; // Percentage improvement from previous
  };

  // Recommendations
  recommendations: {
    immediate: string; // What to do right now
    nextSession: string; // What to focus on next time
    relatedArchetypes?: ArchetypeId[]; // Suggested archetypes to try
  };

  // Encouragement
  encouragement: string;

  // Mastery progress
  masteryProgress: {
    currentLevel: number;
    previousLevel?: number;
    leveledUp: boolean;
    progressToNext: number; // Percentage to next level
  };
}

// =============================================================================
// PERFORMANCE THRESHOLDS
// =============================================================================

const PERFORMANCE_THRESHOLDS = {
  excellent: 90, // 90%+ accuracy
  good: 70,      // 70-89% accuracy
  developing: 50, // 50-69% accuracy
  needs_work: 0   // <50% accuracy
};

// =============================================================================
// ENCOURAGEMENT MESSAGES
// =============================================================================

const ENCOURAGEMENT_MESSAGES = {
  excellent: [
    "Outstanding work! You're mastering this archetype beautifully.",
    "Fantastic session! Your methodology is solid and consistent.",
    "Impressive! You're demonstrating exam-ready skills.",
    "Brilliant work! Keep this momentum going."
  ],
  good: [
    "Great progress! You're building strong foundations.",
    "Solid work! A few more practice sessions and you'll be there.",
    "Nice job! Your understanding is clearly improving.",
    "Good effort! You're on the right track to mastery."
  ],
  developing: [
    "Keep going! Every practice session makes you stronger.",
    "You're building understanding - persistence pays off!",
    "Good effort! Focus on the methodology and you'll improve quickly.",
    "Don't give up! This archetype is tricky, but you're making progress."
  ],
  needs_work: [
    "Every expert was once a beginner. Keep practicing!",
    "Challenges help us grow. Let's review the methodology together.",
    "This is a tough one! But with focused practice, you'll crack it.",
    "Remember: Understanding the methodology is key. You've got this!"
  ]
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getPerformanceLevel(accuracy: number): 'excellent' | 'good' | 'developing' | 'needs_work' {
  if (accuracy >= PERFORMANCE_THRESHOLDS.excellent) return 'excellent';
  if (accuracy >= PERFORMANCE_THRESHOLDS.good) return 'good';
  if (accuracy >= PERFORMANCE_THRESHOLDS.developing) return 'developing';
  return 'needs_work';
}

function getPerformanceMessage(level: 'excellent' | 'good' | 'developing' | 'needs_work', accuracy: number): string {
  switch (level) {
    case 'excellent':
      return `${accuracy}% accuracy - exceptional performance!`;
    case 'good':
      return `${accuracy}% accuracy - solid understanding demonstrated.`;
    case 'developing':
      return `${accuracy}% accuracy - good progress, keep building.`;
    case 'needs_work':
      return `${accuracy}% accuracy - focus on the methodology.`;
  }
}

function analyzeTime(
  averageTime: number,
  targetTime: number,
  previousAverage?: number
): SessionSummary['timeAnalysis'] {
  const ratio = averageTime / targetTime;

  let status: 'fast' | 'on_target' | 'slow';
  let message: string;

  if (ratio <= 0.8) {
    status = 'fast';
    message = `Great time efficiency! You're solving questions ${Math.round((1 - ratio) * 100)}% faster than the target.`;
  } else if (ratio <= 1.2) {
    status = 'on_target';
    message = `Good pacing! You're right around the target time.`;
  } else {
    status = 'slow';
    message = `Taking a bit longer than target. Practice will improve your speed.`;
  }

  // Calculate improvement if we have previous data
  let improvement: number | undefined;
  if (previousAverage && previousAverage > 0) {
    const diff = previousAverage - averageTime;
    if (diff > 0) {
      improvement = Math.round((diff / previousAverage) * 100);
      message += ` Your time improved by ${improvement}% from your previous average!`;
    }
  }

  return { status, message, improvement };
}

function identifyStrengths(
  answers: SessionAnswer[],
  questions: FirestoreQuestion[],
  accuracy: number
): string[] {
  const strengths: string[] = [];

  // High accuracy is a strength
  if (accuracy >= 80) {
    strengths.push("Strong conceptual understanding of this archetype");
  }

  // Check for streak of correct answers
  let maxStreak = 0;
  let currentStreak = 0;
  for (const answer of answers) {
    if (answer.isCorrect) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  }
  if (maxStreak >= 3) {
    strengths.push(`Achieved a streak of ${maxStreak} correct answers`);
  }

  // Check for consistent timing
  if (answers.length >= 5) {
    const times = answers.map(a => a.timeSeconds);
    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    const variance = times.reduce((sum, t) => sum + Math.pow(t - avgTime, 2), 0) / times.length;
    const stdDev = Math.sqrt(variance);
    if (stdDev < avgTime * 0.3) { // Less than 30% standard deviation
      strengths.push("Consistent pacing across questions");
    }
  }

  // Check for getting harder questions right
  const hardQuestions = questions.filter((q, i) => q.difficulty >= 3 && answers[i]?.isCorrect);
  if (hardQuestions.length >= 2) {
    strengths.push("Successfully tackling challenging questions");
  }

  return strengths.slice(0, 3); // Return top 3 strengths
}

function identifyImprovements(
  answers: SessionAnswer[],
  errorHistory: Partial<Record<DistractorType, number>>,
  accuracy: number
): string[] {
  const improvements: string[] = [];

  // Based on accuracy
  if (accuracy < 70) {
    improvements.push("Review the methodology steps before starting each question");
  }

  // Based on error patterns
  const errorSummary = summarizeErrorPatterns(errorHistory);
  if (errorSummary.hasPattern && errorSummary.topErrors.length > 0) {
    const topError = errorSummary.topErrors[0];
    improvements.push(`Focus on avoiding ${topError.description.toLowerCase()}`);
  }

  // Check for rushing (many fast but wrong answers)
  const fastWrong = answers.filter(a => !a.isCorrect && a.timeSeconds < 30);
  if (fastWrong.length >= 2) {
    improvements.push("Take more time to read questions carefully");
  }

  // Check for struggling with time
  const slowAnswers = answers.filter(a => a.timeSeconds > 120);
  if (slowAnswers.length >= 3) {
    improvements.push("Practice to improve solving speed");
  }

  return improvements.slice(0, 3);
}

function getRecommendations(
  archetypeId: ArchetypeId,
  accuracy: number,
  errorHistory: Partial<Record<DistractorType, number>>
): SessionSummary['recommendations'] {
  const archetype = ARCHETYPE_CATALOG[archetypeId];

  // Immediate recommendation based on accuracy
  let immediate: string;
  if (accuracy >= 90) {
    immediate = "Try the next difficulty level or explore a related archetype.";
  } else if (accuracy >= 70) {
    immediate = "Review any questions you got wrong and understand the methodology.";
  } else if (accuracy >= 50) {
    immediate = "Take a break, then review the methodology lesson before trying again.";
  } else {
    immediate = "Review the methodology lesson thoroughly. Understanding the approach is key.";
  }

  // Next session recommendation
  let nextSession: string;
  const errorSummary = summarizeErrorPatterns(errorHistory);
  if (errorSummary.hasPattern) {
    nextSession = `Focus specifically on avoiding '${errorSummary.topErrors[0]?.description || 'common errors'}' in your next session.`;
  } else if (accuracy >= 80) {
    nextSession = "Continue building mastery with more practice at increasing difficulty.";
  } else {
    nextSession = `Practice ${archetype.shortName} with the methodology panel expanded.`;
  }

  // Related archetypes (simplified - would be enhanced with actual archetype connections)
  const relatedArchetypes: ArchetypeId[] = [];
  if (accuracy >= 70) {
    // Suggest related archetypes for exploration
    const allArchetypes = Object.keys(ARCHETYPE_CATALOG) as ArchetypeId[];
    const sameCategory = allArchetypes.filter(
      id => id !== archetypeId && ARCHETYPE_CATALOG[id].category === archetype.category
    );
    if (sameCategory.length > 0) {
      relatedArchetypes.push(sameCategory[0]);
    }
  }

  return {
    immediate,
    nextSession,
    relatedArchetypes: relatedArchetypes.length > 0 ? relatedArchetypes : undefined
  };
}

function calculateMasteryProgress(
  accuracy: number,
  questionsAnswered: number,
  previousProgress?: ArchetypeProgress | null
): SessionSummary['masteryProgress'] {
  // Simplified mastery calculation
  // Level 1: Started (0-19 questions at <50%)
  // Level 2: Developing (20+ questions or >50%)
  // Level 3: Competent (50+ questions at >60%)
  // Level 4: Proficient (100+ questions at >75%)
  // Level 5: Master (150+ questions at >85%)

  const previousLevel = previousProgress?.masteryLevel || 1;
  const previousQuestions = previousProgress?.questionsAttempted || 0;
  const totalQuestions = previousQuestions + questionsAnswered;

  let currentLevel = 1;
  if (totalQuestions >= 150 && accuracy >= 85) currentLevel = 5;
  else if (totalQuestions >= 100 && accuracy >= 75) currentLevel = 4;
  else if (totalQuestions >= 50 && accuracy >= 60) currentLevel = 3;
  else if (totalQuestions >= 20 || accuracy >= 50) currentLevel = 2;

  // Calculate progress to next level
  let progressToNext = 0;
  if (currentLevel < 5) {
    const thresholds = [
      { questions: 20, accuracy: 50 },
      { questions: 50, accuracy: 60 },
      { questions: 100, accuracy: 75 },
      { questions: 150, accuracy: 85 }
    ];
    const target = thresholds[currentLevel - 1];
    const questionProgress = Math.min(100, (totalQuestions / target.questions) * 100);
    const accuracyProgress = Math.min(100, (accuracy / target.accuracy) * 100);
    progressToNext = Math.round((questionProgress + accuracyProgress) / 2);
  } else {
    progressToNext = 100;
  }

  return {
    currentLevel,
    previousLevel,
    leveledUp: currentLevel > previousLevel,
    progressToNext
  };
}

// =============================================================================
// MAIN FUNCTION
// =============================================================================

/**
 * Generate a comprehensive session summary with personalized analysis
 *
 * This function analyzes:
 * - Overall accuracy and time performance
 * - Error patterns and their implications
 * - Strengths demonstrated during the session
 * - Areas needing improvement
 * - Specific recommendations for next steps
 */
export function generateSessionSummary(request: SessionSummaryRequest): SessionSummary {
  const {
    archetypeId,
    answers,
    questions,
    previousProgress,
    totalSessionTime
  } = request;

  const archetype = ARCHETYPE_CATALOG[archetypeId];

  // Basic metrics
  const totalQuestions = answers.length;
  const correctCount = answers.filter(a => a.isCorrect).length;
  const accuracy = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
  const averageTimeSeconds = totalQuestions > 0
    ? Math.round(answers.reduce((sum, a) => sum + a.timeSeconds, 0) / totalQuestions)
    : 0;

  // Performance level
  const performanceLevel = getPerformanceLevel(accuracy);
  const performanceMessage = getPerformanceMessage(performanceLevel, accuracy);

  // Build error history from this session
  const sessionErrorHistory: Partial<Record<DistractorType, number>> = {};
  for (const answer of answers) {
    if (!answer.isCorrect && answer.errorType) {
      const errorType = answer.errorType as DistractorType;
      sessionErrorHistory[errorType] = (sessionErrorHistory[errorType] || 0) + 1;
    }
  }

  // Combine with previous error history
  const combinedErrorHistory: Partial<Record<DistractorType, number>> = {
    ...(previousProgress?.errorFrequency || {}),
  };
  for (const [type, count] of Object.entries(sessionErrorHistory)) {
    combinedErrorHistory[type as DistractorType] =
      (combinedErrorHistory[type as DistractorType] || 0) + count;
  }

  // Error analysis
  const errorSummary = summarizeErrorPatterns(sessionErrorHistory);
  const errorAnalysis: SessionSummary['errorAnalysis'] = {
    topErrors: errorSummary.topErrors,
    hasPattern: errorSummary.hasPattern,
    patternMessage: errorSummary.hasPattern && errorSummary.topErrors.length > 0
      ? `You're frequently making "${errorSummary.topErrors[0].description}" errors. Let's work on this specific area.`
      : undefined
  };

  // Time analysis - using default target of 90 seconds per question
  const targetTime = 90;
  const timeAnalysis = analyzeTime(
    averageTimeSeconds,
    targetTime,
    previousProgress?.averageTimeSeconds
  );

  // Strengths and improvements
  const strengths = identifyStrengths(answers, questions, accuracy);
  const improvements = identifyImprovements(answers, sessionErrorHistory, accuracy);

  // Recommendations
  const recommendations = getRecommendations(archetypeId, accuracy, sessionErrorHistory);

  // Encouragement
  const encouragement = getRandomItem(ENCOURAGEMENT_MESSAGES[performanceLevel]);

  // Mastery progress
  const masteryProgress = calculateMasteryProgress(accuracy, totalQuestions, previousProgress);

  return {
    totalQuestions,
    correctCount,
    accuracy,
    averageTimeSeconds,
    totalTimeSeconds: totalSessionTime,
    performanceLevel,
    performanceMessage,
    strengths,
    improvements,
    errorAnalysis,
    timeAnalysis,
    recommendations,
    encouragement,
    masteryProgress
  };
}

/**
 * Generate a quick summary message (for toast/notification)
 */
export function getQuickSummaryMessage(accuracy: number, correctCount: number, totalCount: number): string {
  if (accuracy >= 90) {
    return `Excellent! ${correctCount}/${totalCount} correct (${accuracy}%)`;
  } else if (accuracy >= 70) {
    return `Good work! ${correctCount}/${totalCount} correct (${accuracy}%)`;
  } else if (accuracy >= 50) {
    return `Keep practicing! ${correctCount}/${totalCount} correct (${accuracy}%)`;
  }
  return `${correctCount}/${totalCount} correct - review the methodology`;
}

export default {
  generateSessionSummary,
  getQuickSummaryMessage
};

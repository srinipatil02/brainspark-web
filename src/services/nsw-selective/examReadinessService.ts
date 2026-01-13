// =============================================================================
// EXAM READINESS SERVICE
// =============================================================================
// FILE: src/services/nsw-selective/examReadinessService.ts
// DOMAIN: NSW Selective Exam Prep - AI Tutoring
// PURPOSE: Deep analysis of exam readiness across all 20 archetypes
// DO NOT: Discourage students - always provide actionable guidance

import { ArchetypeId } from '@/types';
import {
  DistractorType,
  ArchetypeCategory,
  ARCHETYPE_CATALOG,
  getArchetypeDefinition
} from '@/types/nsw-selective';
import { getLearningPathRecommendation } from './archetypeConnectionService';

// =============================================================================
// TYPES
// =============================================================================

export interface ArchetypePerformance {
  archetypeId: ArchetypeId;
  questionsAttempted: number;
  questionsCorrect: number;
  accuracy: number;
  averageTimeSeconds: number;
  masteryLevel: number;
  errorPatterns: Partial<Record<DistractorType, number>>;
  lastPracticed: Date | null;
  trend: 'improving' | 'stable' | 'declining' | 'new';
}

export interface ExamReadinessAnalysis {
  overallReadiness: number; // 0-100
  readinessLevel: 'not_ready' | 'developing' | 'approaching' | 'ready' | 'competitive';
  predictedScore: {
    min: number;
    max: number;
    likely: number;
  };

  // Breakdown by category
  categoryScores: Record<ArchetypeCategory, {
    score: number;
    archetypeCount: number;
    masteredCount: number;
  }>;

  // Archetype rankings
  strongestArchetypes: ArchetypeId[];
  weakestArchetypes: ArchetypeId[];
  mostImproved: ArchetypeId | null;
  needsAttention: ArchetypeId[];

  // Detailed analysis
  errorPatternSummary: {
    mostCommonError: DistractorType | null;
    errorCount: Record<DistractorType, number>;
    concerningPatterns: string[];
  };

  // Time analysis
  timeAnalysis: {
    averageTimePerQuestion: number;
    timeEfficiency: 'too_slow' | 'optimal' | 'rushing';
    slowestArchetypes: ArchetypeId[];
  };

  // Recommendations
  priorityFocus: ArchetypeId[];
  studyPlanSuggestions: string[];
  encouragement: string;
}

export interface ProgressSnapshot {
  date: Date;
  overallReadiness: number;
  archetypeMasteries: Partial<Record<ArchetypeId, number>>;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const ALL_ARCHETYPES: ArchetypeId[] = [
  'qa1', 'qa2', 'qa3', 'qa4', 'qa5', 'qa6', 'qa7', 'qa8', 'qa9', 'qa10',
  'qa11', 'qa12', 'qa13', 'qa14', 'qa15', 'qa16', 'qa17', 'qa18', 'qa19', 'qa20'
];

const READINESS_THRESHOLDS = {
  not_ready: 30,
  developing: 50,
  approaching: 65,
  ready: 80,
  competitive: 90
};

// Target time per question (seconds) - exam is 40 min for 35 questions
const TARGET_TIME_PER_QUESTION = 68; // ~1.1 minutes

// Weights for different factors in readiness calculation
const READINESS_WEIGHTS = {
  accuracy: 0.4,
  coverage: 0.25,
  mastery: 0.25,
  timeEfficiency: 0.1
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Calculate accuracy score (0-100)
 */
function calculateAccuracyScore(performances: ArchetypePerformance[]): number {
  const totalAttempted = performances.reduce((sum, p) => sum + p.questionsAttempted, 0);
  const totalCorrect = performances.reduce((sum, p) => sum + p.questionsCorrect, 0);

  if (totalAttempted === 0) return 0;
  return Math.round((totalCorrect / totalAttempted) * 100);
}

/**
 * Calculate coverage score - how many archetypes have been practiced
 */
function calculateCoverageScore(performances: ArchetypePerformance[]): number {
  const practicedArchetypes = performances.filter(p => p.questionsAttempted >= 5).length;
  return Math.round((practicedArchetypes / ALL_ARCHETYPES.length) * 100);
}

/**
 * Calculate mastery score - average mastery level
 */
function calculateMasteryScore(performances: ArchetypePerformance[]): number {
  const practicedPerformances = performances.filter(p => p.questionsAttempted > 0);
  if (practicedPerformances.length === 0) return 0;

  const totalMastery = practicedPerformances.reduce((sum, p) => sum + p.masteryLevel, 0);
  return Math.round((totalMastery / (practicedPerformances.length * 5)) * 100);
}

/**
 * Calculate time efficiency score
 */
function calculateTimeEfficiencyScore(performances: ArchetypePerformance[]): number {
  const practicedPerformances = performances.filter(p => p.questionsAttempted > 0);
  if (practicedPerformances.length === 0) return 50; // Neutral score

  const avgTime = practicedPerformances.reduce((sum, p) => sum + p.averageTimeSeconds, 0) / practicedPerformances.length;

  // Score based on how close to target time
  if (avgTime <= TARGET_TIME_PER_QUESTION) {
    // Under time is good, but too fast might mean rushing
    if (avgTime < TARGET_TIME_PER_QUESTION * 0.5) {
      return 80; // Might be rushing
    }
    return 100;
  }

  // Over time - penalize proportionally
  const overTimeFactor = avgTime / TARGET_TIME_PER_QUESTION;
  return Math.max(0, Math.round(100 - (overTimeFactor - 1) * 50));
}

/**
 * Get readiness level from score
 */
function getReadinessLevel(score: number): ExamReadinessAnalysis['readinessLevel'] {
  if (score >= READINESS_THRESHOLDS.competitive) return 'competitive';
  if (score >= READINESS_THRESHOLDS.ready) return 'ready';
  if (score >= READINESS_THRESHOLDS.approaching) return 'approaching';
  if (score >= READINESS_THRESHOLDS.developing) return 'developing';
  return 'not_ready';
}

/**
 * Predict exam score range based on current performance
 */
function predictExamScore(overallReadiness: number, accuracy: number): { min: number; max: number; likely: number } {
  // Exam has 35 questions
  const baseScore = Math.round((overallReadiness / 100) * 35);
  const accuracyAdjusted = Math.round((accuracy / 100) * 35);

  const likely = Math.round((baseScore + accuracyAdjusted) / 2);
  const variance = Math.round(35 * 0.1); // 10% variance

  return {
    min: Math.max(0, likely - variance),
    max: Math.min(35, likely + variance),
    likely
  };
}

/**
 * Aggregate error patterns across all archetypes
 */
function aggregateErrorPatterns(
  performances: ArchetypePerformance[]
): Record<DistractorType, number> {
  const aggregated: Record<DistractorType, number> = {
    forward_calculation: 0,
    partial_solution: 0,
    wrong_operation: 0,
    computation_error: 0,
    sign_error: 0,
    unit_confusion: 0,
    off_by_one: 0,
    misconception_answer: 0,
    misread_question: 0,
    conceptual_error: 0,
    setup_error: 0,
    place_value_error: 0,
    inverted_ratio: 0,
    formula_confusion: 0,
    middle_value_trap: 0
  };

  for (const perf of performances) {
    for (const [errorType, count] of Object.entries(perf.errorPatterns)) {
      if (count) {
        aggregated[errorType as DistractorType] += count;
      }
    }
  }

  return aggregated;
}

/**
 * Find most common error type
 */
function findMostCommonError(errors: Record<DistractorType, number>): DistractorType | null {
  let maxCount = 0;
  let maxError: DistractorType | null = null;

  for (const [errorType, count] of Object.entries(errors)) {
    if (count > maxCount) {
      maxCount = count;
      maxError = errorType as DistractorType;
    }
  }

  return maxError;
}

/**
 * Generate encouraging message based on readiness
 */
function generateEncouragement(
  readinessLevel: ExamReadinessAnalysis['readinessLevel'],
  mostImproved: ArchetypeId | null
): string {
  const improvementNote = mostImproved
    ? ` Great improvement on ${getArchetypeDefinition(mostImproved).shortName}!`
    : '';

  switch (readinessLevel) {
    case 'competitive':
      return `Outstanding work! You're performing at a competitive level.${improvementNote} Keep practicing to maintain your edge!`;
    case 'ready':
      return `You're well-prepared for the exam!${improvementNote} Focus on your weaker areas to boost your score even higher.`;
    case 'approaching':
      return `You're making solid progress!${improvementNote} A few more weeks of focused practice will get you exam-ready.`;
    case 'developing':
      return `You're building a good foundation!${improvementNote} Keep practicing daily and you'll see significant improvement.`;
    case 'not_ready':
      return `Every expert was once a beginner!${improvementNote} Start with the foundation archetypes and build up steadily.`;
  }
}

/**
 * Generate study plan suggestions
 */
function generateStudyPlan(
  weakestArchetypes: ArchetypeId[],
  timeAnalysis: ExamReadinessAnalysis['timeAnalysis'],
  errorPatternSummary: ExamReadinessAnalysis['errorPatternSummary']
): string[] {
  const suggestions: string[] = [];

  // Weak archetype suggestions
  if (weakestArchetypes.length > 0) {
    const weakNames = weakestArchetypes.slice(0, 3)
      .map(id => getArchetypeDefinition(id).shortName)
      .join(', ');
    suggestions.push(`Focus on: ${weakNames} - practice 10-15 questions each daily`);
  }

  // Time efficiency suggestions
  if (timeAnalysis.timeEfficiency === 'too_slow') {
    suggestions.push('Work on speed: Set a timer for 70 seconds per question during practice');
    if (timeAnalysis.slowestArchetypes.length > 0) {
      const slowName = getArchetypeDefinition(timeAnalysis.slowestArchetypes[0]).shortName;
      suggestions.push(`${slowName} is taking longest - drill this archetype for speed`);
    }
  } else if (timeAnalysis.timeEfficiency === 'rushing') {
    suggestions.push('Slow down slightly: Read questions carefully to avoid careless errors');
  }

  // Error pattern suggestions
  if (errorPatternSummary.mostCommonError) {
    const errorMessages: Record<DistractorType, string> = {
      forward_calculation: 'Practice reverse percentage problems - remember to divide, not multiply',
      partial_solution: 'Always re-read the question after calculating to ensure you answered what was asked',
      wrong_operation: 'Before calculating, write out which operation you need and why',
      computation_error: 'Double-check arithmetic - consider using estimation to verify',
      sign_error: 'Circle "increase" or "decrease" in each problem before solving',
      unit_confusion: 'Write units on every number in your working',
      off_by_one: 'Practice counting problems - ask "inclusive or exclusive?"',
      misconception_answer: 'Review the methodology lessons for your weak archetypes',
      misread_question: 'Underline what the question asks for before starting',
      conceptual_error: 'Revisit the intro lessons for struggling archetypes',
      setup_error: 'Write the formula/equation before plugging in numbers',
      place_value_error: 'Check decimal placement - estimate magnitude before calculating',
      inverted_ratio: 'Write ratios as "X per Y" before dividing to confirm direction',
      formula_confusion: 'Write down which formula applies before substituting values',
      middle_value_trap: 'Calculate step-by-step - never pick answers that "look right"'
    };
    suggestions.push(errorMessages[errorPatternSummary.mostCommonError]);
  }

  // General suggestions
  suggestions.push('Take a full practice simulation weekly to build exam stamina');

  return suggestions.slice(0, 5); // Max 5 suggestions
}

// =============================================================================
// MAIN FUNCTIONS
// =============================================================================

/**
 * Calculate comprehensive exam readiness analysis
 */
export function calculateExamReadiness(
  performances: ArchetypePerformance[]
): ExamReadinessAnalysis {
  // Calculate component scores
  const accuracyScore = calculateAccuracyScore(performances);
  const coverageScore = calculateCoverageScore(performances);
  const masteryScore = calculateMasteryScore(performances);
  const timeScore = calculateTimeEfficiencyScore(performances);

  // Calculate weighted overall readiness
  const overallReadiness = Math.round(
    accuracyScore * READINESS_WEIGHTS.accuracy +
    coverageScore * READINESS_WEIGHTS.coverage +
    masteryScore * READINESS_WEIGHTS.mastery +
    timeScore * READINESS_WEIGHTS.timeEfficiency
  );

  const readinessLevel = getReadinessLevel(overallReadiness);

  // Category scores
  const categoryScores: Record<ArchetypeCategory, { score: number; archetypeCount: number; masteredCount: number }> = {
    arithmetic_algebra: { score: 0, archetypeCount: 0, masteredCount: 0 },
    percentages_ratios: { score: 0, archetypeCount: 0, masteredCount: 0 },
    geometry_spatial: { score: 0, archetypeCount: 0, masteredCount: 0 },
    data_statistics: { score: 0, archetypeCount: 0, masteredCount: 0 },
    patterns_sequences: { score: 0, archetypeCount: 0, masteredCount: 0 },
    time_distance: { score: 0, archetypeCount: 0, masteredCount: 0 },
    problem_solving: { score: 0, archetypeCount: 0, masteredCount: 0 }
  };

  for (const perf of performances) {
    const category = ARCHETYPE_CATALOG[perf.archetypeId].category;
    categoryScores[category].archetypeCount++;
    categoryScores[category].score += perf.accuracy;
    if (perf.masteryLevel >= 4) {
      categoryScores[category].masteredCount++;
    }
  }

  // Average category scores
  for (const category of Object.keys(categoryScores) as ArchetypeCategory[]) {
    if (categoryScores[category].archetypeCount > 0) {
      categoryScores[category].score = Math.round(
        categoryScores[category].score / categoryScores[category].archetypeCount
      );
    }
  }

  // Rank archetypes
  const sortedByAccuracy = [...performances]
    .filter(p => p.questionsAttempted >= 3)
    .sort((a, b) => b.accuracy - a.accuracy);

  const strongestArchetypes = sortedByAccuracy.slice(0, 5).map(p => p.archetypeId);
  const weakestArchetypes = sortedByAccuracy.slice(-5).reverse().map(p => p.archetypeId);

  // Find most improved (comparing recent trend)
  const mostImproved = performances.find(p => p.trend === 'improving')?.archetypeId || null;

  // Needs attention: low accuracy + declining OR low accuracy + high attempts
  const needsAttention = performances
    .filter(p =>
      p.accuracy < 50 && (p.trend === 'declining' || p.questionsAttempted > 10)
    )
    .map(p => p.archetypeId);

  // Error pattern analysis
  const aggregatedErrors = aggregateErrorPatterns(performances);
  const mostCommonError = findMostCommonError(aggregatedErrors);

  const concerningPatterns: string[] = [];
  if (aggregatedErrors.forward_calculation > 5) {
    concerningPatterns.push('Frequent forward/reverse calculation confusion');
  }
  if (aggregatedErrors.partial_solution > 5) {
    concerningPatterns.push('Often stopping before completing all steps');
  }
  if (aggregatedErrors.misread_question > 5) {
    concerningPatterns.push('Need to read questions more carefully');
  }

  // Time analysis
  const avgTime = performances.reduce((sum, p) => sum + p.averageTimeSeconds, 0) / performances.length;
  const timeEfficiency: 'too_slow' | 'optimal' | 'rushing' =
    avgTime > TARGET_TIME_PER_QUESTION * 1.3 ? 'too_slow' :
    avgTime < TARGET_TIME_PER_QUESTION * 0.5 ? 'rushing' : 'optimal';

  const slowestArchetypes = [...performances]
    .filter(p => p.questionsAttempted >= 3)
    .sort((a, b) => b.averageTimeSeconds - a.averageTimeSeconds)
    .slice(0, 3)
    .map(p => p.archetypeId);

  // Get learning path recommendation
  const masteredArchetypes = performances
    .filter(p => p.masteryLevel >= 4)
    .map(p => p.archetypeId);
  const strugglingArchetypes = performances
    .filter(p => p.accuracy < 50 && p.questionsAttempted >= 5)
    .map(p => p.archetypeId);

  const learningPath = getLearningPathRecommendation(
    masteredArchetypes,
    strugglingArchetypes,
    performances.reduce((acc, p) => {
      if (Object.keys(p.errorPatterns).length > 0) {
        acc[p.archetypeId] = Object.keys(p.errorPatterns) as string[];
      }
      return acc;
    }, {} as Partial<Record<ArchetypeId, string[]>>)
  );

  // Build result
  const result: ExamReadinessAnalysis = {
    overallReadiness,
    readinessLevel,
    predictedScore: predictExamScore(overallReadiness, accuracyScore),
    categoryScores,
    strongestArchetypes,
    weakestArchetypes,
    mostImproved,
    needsAttention,
    errorPatternSummary: {
      mostCommonError,
      errorCount: aggregatedErrors,
      concerningPatterns
    },
    timeAnalysis: {
      averageTimePerQuestion: Math.round(avgTime),
      timeEfficiency,
      slowestArchetypes
    },
    priorityFocus: learningPath.nextArchetypes.slice(0, 5),
    studyPlanSuggestions: [],
    encouragement: ''
  };

  // Generate study plan and encouragement
  result.studyPlanSuggestions = generateStudyPlan(
    weakestArchetypes,
    result.timeAnalysis,
    result.errorPatternSummary
  );
  result.encouragement = generateEncouragement(readinessLevel, mostImproved);

  return result;
}

/**
 * Calculate readiness score for a single category
 */
export function calculateCategoryReadiness(
  category: ArchetypeCategory,
  performances: ArchetypePerformance[]
): {
  score: number;
  archetypes: Array<{ id: ArchetypeId; mastery: number; accuracy: number }>;
  recommendation: string;
} {
  const categoryPerformances = performances.filter(p =>
    ARCHETYPE_CATALOG[p.archetypeId].category === category
  );

  if (categoryPerformances.length === 0) {
    return {
      score: 0,
      archetypes: [],
      recommendation: `Start practicing ${category.replace('_', ' ')} archetypes`
    };
  }

  const avgAccuracy = categoryPerformances.reduce((sum, p) => sum + p.accuracy, 0) / categoryPerformances.length;
  const avgMastery = categoryPerformances.reduce((sum, p) => sum + p.masteryLevel, 0) / categoryPerformances.length;

  const score = Math.round((avgAccuracy * 0.6) + (avgMastery * 20 * 0.4));

  const archetypes = categoryPerformances.map(p => ({
    id: p.archetypeId,
    mastery: p.masteryLevel,
    accuracy: p.accuracy
  })).sort((a, b) => b.accuracy - a.accuracy);

  let recommendation: string;
  if (score >= 80) {
    recommendation = `Strong in ${category.replace('_', ' ')} - maintain with occasional practice`;
  } else if (score >= 60) {
    recommendation = `Good progress in ${category.replace('_', ' ')} - focus on weaker archetypes`;
  } else {
    const weakest = archetypes[archetypes.length - 1];
    recommendation = `Need work on ${category.replace('_', ' ')} - start with ${getArchetypeDefinition(weakest.id).shortName}`;
  }

  return { score, archetypes, recommendation };
}

/**
 * Generate weekly progress report
 */
export function generateWeeklyReport(
  currentPerformances: ArchetypePerformance[],
  previousWeekSnapshot: ProgressSnapshot | null
): {
  summary: string;
  improvements: string[];
  challenges: string[];
  nextWeekFocus: string[];
} {
  const current = calculateExamReadiness(currentPerformances);

  const improvements: string[] = [];
  const challenges: string[] = [];

  if (previousWeekSnapshot) {
    const readinessChange = current.overallReadiness - previousWeekSnapshot.overallReadiness;

    if (readinessChange > 0) {
      improvements.push(`Overall readiness improved by ${readinessChange}%`);
    } else if (readinessChange < 0) {
      challenges.push(`Overall readiness decreased by ${Math.abs(readinessChange)}% - need more practice`);
    }

    // Check individual archetype improvements
    for (const perf of currentPerformances) {
      const prevMastery = previousWeekSnapshot.archetypeMasteries[perf.archetypeId] || 0;
      if (perf.masteryLevel > prevMastery) {
        improvements.push(`${getArchetypeDefinition(perf.archetypeId).shortName}: Mastery ${prevMastery} → ${perf.masteryLevel}`);
      }
    }
  }

  // Current challenges
  for (const needsWork of current.needsAttention) {
    challenges.push(`${getArchetypeDefinition(needsWork).shortName} needs focused practice`);
  }

  if (current.timeAnalysis.timeEfficiency === 'too_slow') {
    challenges.push('Working too slowly - need to build speed');
  }

  // Next week focus
  const nextWeekFocus = current.priorityFocus.slice(0, 3).map(id =>
    `Practice ${getArchetypeDefinition(id).shortName} (15 questions)`
  );

  if (current.errorPatternSummary.concerningPatterns.length > 0) {
    nextWeekFocus.push(`Address: ${current.errorPatternSummary.concerningPatterns[0]}`);
  }

  const summary = `Exam Readiness: ${current.overallReadiness}% (${current.readinessLevel.replace('_', ' ')}). ` +
    `Predicted score: ${current.predictedScore.likely}/35. ${current.encouragement}`;

  return {
    summary,
    improvements: improvements.slice(0, 5),
    challenges: challenges.slice(0, 5),
    nextWeekFocus: nextWeekFocus.slice(0, 4)
  };
}

/**
 * Get quick readiness summary for dashboard
 */
export function getReadinessSummary(performances: ArchetypePerformance[]): {
  readiness: number;
  level: string;
  topStrength: string;
  topWeakness: string;
  quickTip: string;
} {
  const analysis = calculateExamReadiness(performances);

  const topStrength = analysis.strongestArchetypes.length > 0
    ? getArchetypeDefinition(analysis.strongestArchetypes[0]).shortName
    : 'Keep practicing!';

  const topWeakness = analysis.weakestArchetypes.length > 0
    ? getArchetypeDefinition(analysis.weakestArchetypes[0]).shortName
    : 'Great coverage!';

  const quickTip = analysis.studyPlanSuggestions[0] || 'Practice consistently for best results';

  return {
    readiness: analysis.overallReadiness,
    level: analysis.readinessLevel.replace('_', ' '),
    topStrength,
    topWeakness,
    quickTip
  };
}

export default {
  calculateExamReadiness,
  calculateCategoryReadiness,
  generateWeeklyReport,
  getReadinessSummary
};

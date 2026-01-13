// =============================================================================
// INSIGHTS CLIENT COMPONENT
// =============================================================================
// FILE: src/components/nsw-selective/InsightsClient.tsx
// DOMAIN: NSW Selective Exam Prep
// PURPOSE: Comprehensive analytics dashboard for archetype performance
// DO NOT: Import curriculum components or use learningArc fields

'use client';

import Link from 'next/link';
import { useState, useMemo } from 'react';
import { useAllArchetypeProgress } from '@/hooks/nsw-selective/useArchetypeProgress';
import { ARCHETYPE_CATALOG, ArchetypeCategory, getArchetypeDefinition, ArchetypeProgress, DistractorType } from '@/types/nsw-selective';
import { ArchetypeId } from '@/types';
import {
  calculateExamReadiness,
  ArchetypePerformance,
  ExamReadinessAnalysis
} from '@/services/nsw-selective/examReadinessService';

// =============================================================================
// CATEGORY CONFIGURATION
// =============================================================================

const CATEGORY_CONFIG: Record<ArchetypeCategory, { label: string; color: string; bgColor: string; borderColor: string }> = {
  arithmetic_algebra: { label: 'Arithmetic & Algebra', color: 'text-blue-700', bgColor: 'bg-blue-100', borderColor: 'border-blue-300' },
  percentages_ratios: { label: 'Percentages & Ratios', color: 'text-purple-700', bgColor: 'bg-purple-100', borderColor: 'border-purple-300' },
  geometry_spatial: { label: 'Geometry & Spatial', color: 'text-orange-700', bgColor: 'bg-orange-100', borderColor: 'border-orange-300' },
  data_statistics: { label: 'Data & Statistics', color: 'text-green-700', bgColor: 'bg-green-100', borderColor: 'border-green-300' },
  patterns_sequences: { label: 'Patterns & Sequences', color: 'text-pink-700', bgColor: 'bg-pink-100', borderColor: 'border-pink-300' },
  time_distance: { label: 'Time & Distance', color: 'text-cyan-700', bgColor: 'bg-cyan-100', borderColor: 'border-cyan-300' },
  problem_solving: { label: 'Problem Solving', color: 'text-amber-700', bgColor: 'bg-amber-100', borderColor: 'border-amber-300' },
};

const ALL_CATEGORIES: ArchetypeCategory[] = [
  'arithmetic_algebra',
  'percentages_ratios',
  'geometry_spatial',
  'data_statistics',
  'patterns_sequences',
  'time_distance',
  'problem_solving',
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function getMasteryColor(level: number): string {
  if (level >= 4) return 'text-green-600';
  if (level >= 3) return 'text-blue-600';
  if (level >= 2) return 'text-amber-600';
  return 'text-red-600';
}

function getAccuracyColor(accuracy: number): string {
  if (accuracy >= 80) return 'bg-green-500';
  if (accuracy >= 60) return 'bg-amber-500';
  if (accuracy >= 40) return 'bg-orange-500';
  return 'bg-red-500';
}

function getReadinessColor(readiness: number): { text: string; bg: string; border: string } {
  if (readiness >= 70) return { text: 'text-green-600', bg: 'bg-green-100', border: 'border-green-300' };
  if (readiness >= 50) return { text: 'text-amber-600', bg: 'bg-amber-100', border: 'border-amber-300' };
  return { text: 'text-red-600', bg: 'bg-red-100', border: 'border-red-300' };
}

function formatTime(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}m ${secs}s`;
}

/**
 * Convert ArchetypeProgress to ArchetypePerformance for exam readiness service
 */
function convertToPerformance(
  archetypeId: ArchetypeId,
  progress: ArchetypeProgress | null
): ArchetypePerformance {
  if (!progress) {
    return {
      archetypeId,
      questionsAttempted: 0,
      questionsCorrect: 0,
      accuracy: 0,
      averageTimeSeconds: 0,
      masteryLevel: 0,
      errorPatterns: {},
      lastPracticed: null,
      trend: 'new'
    };
  }

  return {
    archetypeId,
    questionsAttempted: progress.questionsAttempted,
    questionsCorrect: progress.questionsCorrect,
    accuracy: progress.questionsAttempted > 0
      ? Math.round((progress.questionsCorrect / progress.questionsAttempted) * 100)
      : 0,
    averageTimeSeconds: progress.averageTimeSeconds,
    masteryLevel: progress.masteryLevel,
    errorPatterns: progress.errorFrequency || {},
    lastPracticed: progress.lastPracticed ? new Date(progress.lastPracticed) : null,
    trend: determineTrend(progress)
  };
}

/**
 * Determine learning trend based on recent performance
 */
function determineTrend(progress: ArchetypeProgress): 'improving' | 'stable' | 'declining' | 'new' {
  if (progress.questionsAttempted < 5) return 'new';
  if (progress.consecutiveCorrect >= 3) return 'improving';
  if (progress.masteryLevel >= 4) return 'stable';
  if (progress.questionsCorrect / progress.questionsAttempted < 0.4) return 'declining';
  return 'stable';
}

/**
 * Get display name for distractor type
 */
function getErrorTypeName(errorType: DistractorType): string {
  const names: Record<DistractorType, string> = {
    forward_calculation: 'Forward/Reverse Confusion',
    partial_solution: 'Incomplete Solution',
    wrong_operation: 'Wrong Operation',
    computation_error: 'Calculation Mistake',
    sign_error: 'Sign Error (+/-)',
    unit_confusion: 'Unit Confusion',
    off_by_one: 'Off-by-One Error',
    misconception_answer: 'Conceptual Misunderstanding',
    misread_question: 'Question Misread',
    conceptual_error: 'Conceptual Error',
    setup_error: 'Setup Error',
    place_value_error: 'Place Value Error',
    inverted_ratio: 'Inverted Ratio',
    formula_confusion: 'Formula Confusion',
    middle_value_trap: 'Middle Value Trap'
  };
  return names[errorType] || errorType;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function InsightsClient() {
  const {
    allProgress,
    isLoading,
    examReadiness,
    weakArchetypes,
    strongArchetypes,
    notStartedArchetypes,
  } = useAllArchetypeProgress();

  const [expandedCategories, setExpandedCategories] = useState<Set<ArchetypeCategory>>(new Set());

  // Check if user has any progress data
  const hasProgress = Object.keys(allProgress).length > 0;
  const totalAttempted = Object.values(allProgress).reduce((sum, p) => sum + p.questionsAttempted, 0);

  // Calculate comprehensive exam readiness analysis
  const examReadinessAnalysis = useMemo<ExamReadinessAnalysis | null>(() => {
    if (!hasProgress) return null;

    const performances = (Object.keys(ARCHETYPE_CATALOG) as ArchetypeId[])
      .map(id => convertToPerformance(id, allProgress[id] || null))
      .filter(p => p.questionsAttempted > 0);

    if (performances.length === 0) return null;

    return calculateExamReadiness(performances);
  }, [allProgress, hasProgress]);

  // Group archetypes by category with progress
  const categoryData = useMemo(() => {
    return ALL_CATEGORIES.map(category => {
      const archetypeIds = (Object.keys(ARCHETYPE_CATALOG) as ArchetypeId[])
        .filter(id => ARCHETYPE_CATALOG[id].category === category);

      const archetypesWithProgress = archetypeIds.map(id => ({
        definition: getArchetypeDefinition(id),
        progress: allProgress[id] || null,
      }));

      // Calculate category averages
      const practiced = archetypesWithProgress.filter(a => a.progress && a.progress.questionsAttempted > 0);
      const avgMastery = practiced.length > 0
        ? practiced.reduce((sum, a) => sum + (a.progress?.masteryLevel || 0), 0) / practiced.length
        : 0;
      const avgAccuracy = practiced.length > 0
        ? practiced.reduce((sum, a) => {
            const p = a.progress;
            return sum + (p && p.questionsAttempted > 0 ? (p.questionsCorrect / p.questionsAttempted) * 100 : 0);
          }, 0) / practiced.length
        : 0;

      return {
        category,
        config: CATEGORY_CONFIG[category],
        archetypes: archetypesWithProgress,
        totalArchetypes: archetypeIds.length,
        practicedCount: practiced.length,
        avgMastery,
        avgAccuracy,
      };
    });
  }, [allProgress]);

  // Sort archetypes by mastery for weakest/strongest display
  const sortedByMastery = useMemo(() => {
    return (Object.keys(ARCHETYPE_CATALOG) as ArchetypeId[])
      .map(id => ({
        id,
        definition: getArchetypeDefinition(id),
        progress: allProgress[id] || null,
      }))
      .filter(a => a.progress && a.progress.questionsAttempted > 0)
      .sort((a, b) => {
        const masteryA = a.progress?.masteryLevel || 0;
        const masteryB = b.progress?.masteryLevel || 0;
        if (masteryA !== masteryB) return masteryA - masteryB;
        // Secondary sort by accuracy
        const accA = a.progress ? (a.progress.questionsCorrect / a.progress.questionsAttempted) : 0;
        const accB = b.progress ? (b.progress.questionsCorrect / b.progress.questionsAttempted) : 0;
        return accA - accB;
      });
  }, [allProgress]);

  const weakest5 = sortedByMastery.slice(0, 5);
  const strongest5 = [...sortedByMastery].reverse().slice(0, 5);

  // Time analysis
  const timeAnalysis = useMemo(() => {
    const withTime = (Object.keys(ARCHETYPE_CATALOG) as ArchetypeId[])
      .map(id => ({
        id,
        definition: getArchetypeDefinition(id),
        progress: allProgress[id] || null,
      }))
      .filter(a => a.progress && a.progress.questionsAttempted > 0 && a.progress.averageTimeSeconds > 0);

    if (withTime.length === 0) return null;

    const avgTime = withTime.reduce((sum, a) => sum + (a.progress?.averageTimeSeconds || 0), 0) / withTime.length;
    const sorted = [...withTime].sort((a, b) => (a.progress?.averageTimeSeconds || 0) - (b.progress?.averageTimeSeconds || 0));

    return {
      average: avgTime,
      fastest: sorted[0] || null,
      slowest: sorted[sorted.length - 1] || null,
    };
  }, [allProgress]);

  const toggleCategory = (category: ArchetypeCategory) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const readinessColors = getReadinessColor(examReadiness);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading insights...</p>
        </div>
      </div>
    );
  }

  // Empty state - no progress yet
  if (!hasProgress) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header examReadiness={0} />
        <main className="max-w-6xl mx-auto px-4 py-8">
          <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
            <svg className="w-20 h-20 mx-auto text-gray-300 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Practice Data Yet</h2>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Start practicing to see your performance insights. We recommend beginning with the Diagnostic Assessment to identify your strengths and areas for improvement.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/nsw-selective/diagnostic"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                Take Diagnostic Assessment
              </Link>
              <Link
                href="/nsw-selective/practice"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                Browse Practice Topics
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header examReadiness={examReadiness} />

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Section 1: Overall Readiness */}
        <section className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex flex-col md:flex-row items-center gap-8">
            {/* Circular Progress Indicator */}
            <div className="relative w-40 h-40 flex-shrink-0">
              <svg className="w-full h-full transform -rotate-90">
                {/* Background circle */}
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="12"
                />
                {/* Progress circle */}
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  fill="none"
                  stroke={examReadiness >= 70 ? '#22c55e' : examReadiness >= 50 ? '#f59e0b' : '#ef4444'}
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={`${(examReadiness / 100) * 440} 440`}
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-4xl font-bold ${readinessColors.text}`}>
                  {examReadiness}%
                </span>
                <span className="text-sm text-gray-500">Ready</span>
              </div>
            </div>

            {/* Summary stats */}
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Exam Readiness</h2>
              <p className="text-gray-500 mb-4">
                Based on your practice across {20 - notStartedArchetypes.length} of 20 archetypes
              </p>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-2xl font-bold text-gray-900">{totalAttempted}</p>
                  <p className="text-xs text-gray-500">Questions Practiced</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-2xl font-bold text-green-600">{strongArchetypes.length}</p>
                  <p className="text-xs text-gray-500">Strong Archetypes</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-2xl font-bold text-amber-600">{weakArchetypes.length}</p>
                  <p className="text-xs text-gray-500">Need Work</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 1.5: Predicted Score & AI Insights */}
        {examReadinessAnalysis && (
          <section className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl shadow-sm border border-purple-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <h2 className="text-lg font-semibold text-gray-900">AI-Powered Insights</h2>
            </div>

            {/* Predicted Score */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white/80 rounded-lg p-4 text-center border border-purple-100">
                <p className="text-sm text-gray-500 mb-1">Predicted Exam Score</p>
                <p className="text-3xl font-bold text-purple-700">
                  {examReadinessAnalysis.predictedScore.likely}/35
                </p>
                <p className="text-xs text-gray-400">
                  Range: {examReadinessAnalysis.predictedScore.min}-{examReadinessAnalysis.predictedScore.max}
                </p>
              </div>

              <div className="bg-white/80 rounded-lg p-4 text-center border border-purple-100">
                <p className="text-sm text-gray-500 mb-1">Readiness Level</p>
                <p className={`text-xl font-bold capitalize ${
                  examReadinessAnalysis.readinessLevel === 'competitive' ? 'text-green-600' :
                  examReadinessAnalysis.readinessLevel === 'ready' ? 'text-green-500' :
                  examReadinessAnalysis.readinessLevel === 'approaching' ? 'text-amber-600' :
                  examReadinessAnalysis.readinessLevel === 'developing' ? 'text-orange-500' :
                  'text-red-500'
                }`}>
                  {examReadinessAnalysis.readinessLevel.replace('_', ' ')}
                </p>
                <p className="text-xs text-gray-400">
                  {examReadinessAnalysis.predictedScore.likely >= 25 ? 'On track for selection' : 'Keep practicing!'}
                </p>
              </div>

              <div className="bg-white/80 rounded-lg p-4 text-center border border-purple-100">
                <p className="text-sm text-gray-500 mb-1">Time Efficiency</p>
                <p className={`text-xl font-bold ${
                  examReadinessAnalysis.timeAnalysis.timeEfficiency === 'optimal' ? 'text-green-600' :
                  examReadinessAnalysis.timeAnalysis.timeEfficiency === 'rushing' ? 'text-amber-600' :
                  'text-red-500'
                }`}>
                  {examReadinessAnalysis.timeAnalysis.timeEfficiency === 'optimal' ? 'Good Pace' :
                   examReadinessAnalysis.timeAnalysis.timeEfficiency === 'rushing' ? 'Too Fast' :
                   'Too Slow'}
                </p>
                <p className="text-xs text-gray-400">
                  {formatTime(examReadinessAnalysis.timeAnalysis.averageTimePerQuestion)} avg/question
                </p>
              </div>
            </div>

            {/* Encouragement Message */}
            <div className="bg-white/60 rounded-lg p-4 mb-6 border border-purple-100">
              <p className="text-gray-700 italic">
                &quot;{examReadinessAnalysis.encouragement}&quot;
              </p>
            </div>

            {/* Study Plan Suggestions */}
            {examReadinessAnalysis.studyPlanSuggestions.length > 0 && (
              <div className="bg-white/80 rounded-lg p-4 border border-purple-100">
                <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                  Study Plan Suggestions
                </h3>
                <ul className="space-y-2">
                  {examReadinessAnalysis.studyPlanSuggestions.map((suggestion, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="text-purple-500 mt-0.5">•</span>
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        {/* Section 1.75: Error Pattern Analysis */}
        {examReadinessAnalysis && examReadinessAnalysis.errorPatternSummary.mostCommonError && (
          <section className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h2 className="text-lg font-semibold text-gray-900">Error Pattern Analysis</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Most Common Error */}
              <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                <p className="text-sm text-gray-500 mb-1">Most Common Mistake</p>
                <p className="font-medium text-orange-700">
                  {getErrorTypeName(examReadinessAnalysis.errorPatternSummary.mostCommonError)}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  {examReadinessAnalysis.errorPatternSummary.errorCount[examReadinessAnalysis.errorPatternSummary.mostCommonError]} occurrences
                </p>
              </div>

              {/* Concerning Patterns */}
              {examReadinessAnalysis.errorPatternSummary.concerningPatterns.length > 0 && (
                <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                  <p className="text-sm text-gray-500 mb-2">Patterns to Address</p>
                  <ul className="space-y-1">
                    {examReadinessAnalysis.errorPatternSummary.concerningPatterns.map((pattern, index) => (
                      <li key={index} className="text-sm text-red-700 flex items-start gap-2">
                        <span className="text-red-500 mt-0.5">!</span>
                        {pattern}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Error Type Breakdown */}
            <div className="mt-4">
              <p className="text-sm text-gray-500 mb-2">Error Distribution</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(examReadinessAnalysis.errorPatternSummary.errorCount)
                  .filter(([, count]) => count > 0)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 5)
                  .map(([errorType, count]) => (
                    <span
                      key={errorType}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-xs"
                    >
                      <span className="text-gray-700">{getErrorTypeName(errorType as DistractorType)}</span>
                      <span className="text-gray-400">({count})</span>
                    </span>
                  ))}
              </div>
            </div>
          </section>
        )}

        {/* Section 2: Category Performance */}
        <section className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Category Performance</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {categoryData.map(({ category, config, totalArchetypes, practicedCount, avgMastery, avgAccuracy }) => (
              <div
                key={category}
                className={`rounded-xl border ${config.borderColor} p-4 ${config.bgColor}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm font-medium ${config.color}`}>
                    {config.label}
                  </span>
                  <span className="text-xs text-gray-500">
                    {practicedCount}/{totalArchetypes}
                  </span>
                </div>
                {practicedCount > 0 ? (
                  <>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex-1 h-2 bg-white/50 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${getAccuracyColor(avgAccuracy)}`}
                          style={{ width: `${avgAccuracy}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-gray-700">
                        {Math.round(avgAccuracy)}%
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg
                          key={star}
                          className={`w-3.5 h-3.5 ${star <= Math.round(avgMastery) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                      <span className="text-xs text-gray-500 ml-1">avg</span>
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-gray-500">Not started</p>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Section 3: Archetype Mastery */}
        <section className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Archetype Mastery</h2>
          <p className="text-sm text-gray-500 mb-4">
            Click on a category to expand and see individual archetypes. Sorted by mastery level (weakest first).
          </p>

          <div className="space-y-4">
            {categoryData.map(({ category, config, archetypes }) => {
              const isExpanded = expandedCategories.has(category);
              const sortedArchetypes = [...archetypes].sort((a, b) => {
                const masteryA = a.progress?.masteryLevel || 0;
                const masteryB = b.progress?.masteryLevel || 0;
                return masteryA - masteryB;
              });

              return (
                <div key={category} className="border rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleCategory(category)}
                    className={`w-full px-4 py-3 flex items-center justify-between ${config.bgColor} hover:opacity-90 transition-opacity`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`font-medium ${config.color}`}>
                        {config.label}
                      </span>
                      <span className="text-xs text-gray-500">
                        {archetypes.filter(a => a.progress).length}/{archetypes.length} practiced
                      </span>
                    </div>
                    <svg
                      className={`w-5 h-5 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {isExpanded && (
                    <div className="p-4 space-y-3">
                      {sortedArchetypes.map(({ definition, progress }) => {
                        const accuracy = progress && progress.questionsAttempted > 0
                          ? Math.round((progress.questionsCorrect / progress.questionsAttempted) * 100)
                          : 0;

                        return (
                          <div
                            key={definition.id}
                            className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-mono text-gray-500">
                                  {definition.id.toUpperCase()}
                                </span>
                                <span className="font-medium text-gray-900 truncate">
                                  {definition.shortName}
                                </span>
                              </div>
                              {progress ? (
                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                  <span>{progress.questionsAttempted} Q</span>
                                  <span>{accuracy}% accuracy</span>
                                  {progress.averageTimeSeconds > 0 && (
                                    <span>{formatTime(progress.averageTimeSeconds)} avg</span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-xs text-gray-400">Not started</span>
                              )}
                            </div>

                            {/* Mastery stars */}
                            <div className="flex items-center gap-0.5">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <svg
                                  key={star}
                                  className={`w-4 h-4 ${star <= (progress?.masteryLevel || 0) ? 'text-yellow-400 fill-current' : 'text-gray-200'}`}
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                              ))}
                            </div>

                            {/* Practice button */}
                            <Link
                              href={`/nsw-selective/practice/${definition.id}`}
                              className="px-3 py-1.5 text-xs font-medium text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                            >
                              Practice
                            </Link>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Section 4 & 5: Weakest and Strongest Areas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Weakest Areas */}
          <section className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h2 className="text-lg font-semibold text-gray-900">Focus Areas</h2>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              These archetypes need the most practice. Focus here to improve your overall readiness.
            </p>

            {weakest5.length > 0 ? (
              <div className="space-y-3">
                {weakest5.map(({ id, definition, progress }) => {
                  const accuracy = progress && progress.questionsAttempted > 0
                    ? Math.round((progress.questionsCorrect / progress.questionsAttempted) * 100)
                    : 0;
                  const categoryConfig = CATEGORY_CONFIG[definition.category];

                  return (
                    <div key={id} className="flex items-center gap-3 p-3 bg-red-50 border border-red-100 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs px-1.5 py-0.5 rounded ${categoryConfig.bgColor} ${categoryConfig.color}`}>
                            {definition.id.toUpperCase()}
                          </span>
                          <span className="font-medium text-gray-900 truncate">
                            {definition.shortName}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">
                          {accuracy}% accuracy, {progress?.questionsAttempted || 0} questions
                        </p>
                      </div>
                      <Link
                        href={`/nsw-selective/practice/${id}`}
                        className="px-3 py-1.5 text-xs font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
                      >
                        Practice Now
                      </Link>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-4">
                Complete more practice to see focus areas
              </p>
            )}

            {notStartedArchetypes.length > 0 && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>{notStartedArchetypes.length}</strong> archetypes not yet started.{' '}
                  <Link href="/nsw-selective/practice" className="text-purple-600 hover:underline">
                    Explore all archetypes
                  </Link>
                </p>
              </div>
            )}
          </section>

          {/* Strongest Areas */}
          <section className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h2 className="text-lg font-semibold text-gray-900">Your Strengths</h2>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Great work on these archetypes! Keep practicing to maintain your mastery.
            </p>

            {strongest5.length > 0 ? (
              <div className="space-y-3">
                {strongest5.map(({ id, definition, progress }) => {
                  const accuracy = progress && progress.questionsAttempted > 0
                    ? Math.round((progress.questionsCorrect / progress.questionsAttempted) * 100)
                    : 0;
                  const categoryConfig = CATEGORY_CONFIG[definition.category];

                  return (
                    <div key={id} className="flex items-center gap-3 p-3 bg-green-50 border border-green-100 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs px-1.5 py-0.5 rounded ${categoryConfig.bgColor} ${categoryConfig.color}`}>
                            {definition.id.toUpperCase()}
                          </span>
                          <span className="font-medium text-gray-900 truncate">
                            {definition.shortName}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <svg
                                key={star}
                                className={`w-3 h-3 ${star <= (progress?.masteryLevel || 0) ? 'text-yellow-400 fill-current' : 'text-gray-200'}`}
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                          <span className="text-xs text-gray-500">
                            {accuracy}% accuracy
                          </span>
                        </div>
                      </div>
                      <Link
                        href={`/nsw-selective/practice/${id}`}
                        className="px-3 py-1.5 text-xs font-medium text-green-700 bg-green-100 rounded-lg hover:bg-green-200 transition-colors"
                      >
                        Review
                      </Link>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-4">
                Keep practicing to build your strengths!
              </p>
            )}

            {strongest5.length >= 3 && (
              <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-100">
                <p className="text-sm text-green-700">
                  You&apos;re doing great! Focus on your weak areas while maintaining these strengths.
                </p>
              </div>
            )}
          </section>
        </div>

        {/* Section 6: Time Analysis */}
        {timeAnalysis && (
          <section className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h2 className="text-lg font-semibold text-gray-900">Time Analysis</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-blue-700">
                  {formatTime(timeAnalysis.average)}
                </p>
                <p className="text-sm text-blue-600">Average per Question</p>
                <p className="text-xs text-gray-500 mt-1">
                  Target: ~68s for the exam
                </p>
              </div>

              {timeAnalysis.fastest && (
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500 mb-1">Fastest Archetype</p>
                  <p className="font-medium text-gray-900">
                    {timeAnalysis.fastest.definition.shortName}
                  </p>
                  <p className="text-lg font-bold text-green-600">
                    {formatTime(timeAnalysis.fastest.progress?.averageTimeSeconds || 0)}
                  </p>
                </div>
              )}

              {timeAnalysis.slowest && (
                <div className="bg-amber-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500 mb-1">Slowest Archetype</p>
                  <p className="font-medium text-gray-900">
                    {timeAnalysis.slowest.definition.shortName}
                  </p>
                  <p className="text-lg font-bold text-amber-600">
                    {formatTime(timeAnalysis.slowest.progress?.averageTimeSeconds || 0)}
                  </p>
                </div>
              )}
            </div>

            {timeAnalysis.average > 90 && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-700">
                  <strong>Time Management Tip:</strong> Your average time is above the exam target of 68 seconds per question.
                  Practice identifying question patterns quickly and using efficient solution methods.
                </p>
              </div>
            )}

            {timeAnalysis.average <= 60 && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700">
                  <strong>Great pace!</strong> You&apos;re answering questions faster than the exam average.
                  Make sure accuracy isn&apos;t being sacrificed for speed.
                </p>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

// =============================================================================
// HEADER COMPONENT
// =============================================================================

function Header({ examReadiness }: { examReadiness: number }) {
  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/nsw-selective" className="text-gray-500 hover:text-gray-700">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Performance Insights</h1>
              <p className="text-sm text-gray-500">Track your progress across all 20 archetypes</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Exam Readiness</p>
            <p className={`text-lg font-bold ${
              examReadiness >= 70 ? 'text-green-600' :
              examReadiness >= 50 ? 'text-amber-600' : 'text-red-600'
            }`}>
              {examReadiness}%
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}

export default InsightsClient;

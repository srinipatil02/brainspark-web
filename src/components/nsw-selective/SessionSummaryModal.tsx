// =============================================================================
// SESSION SUMMARY MODAL COMPONENT
// =============================================================================
// FILE: src/components/nsw-selective/SessionSummaryModal.tsx
// DOMAIN: NSW Selective Exam Prep - AI Tutoring
// PURPOSE: Display comprehensive end-of-session analysis and recommendations
// DO NOT: Be discouraging or show only negative feedback

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { SessionSummary } from '@/services/nsw-selective/sessionSummaryService';
import { ArchetypeId } from '@/types';
import { getArchetypeDefinition, ARCHETYPE_CATALOG } from '@/types/nsw-selective';

// =============================================================================
// AI ANALYSIS TYPES (matches Cloud Function response)
// =============================================================================

export interface AISessionAnalysis {
  success: boolean;
  deepInsight?: string;
  strengthsIdentified?: string[];
  rootCauseAnalysis?: {
    primaryGap: string;
    evidence: string;
    severity: 'minor' | 'moderate' | 'significant';
  };
  recommendations?: {
    immediate: string;
    nextSession: string;
    prerequisiteReview: string | null;
  };
  personalizedEncouragement?: string;
  progressIndicator?: 'improving' | 'stable' | 'needsAttention';
  error?: string;
  processingTime?: number;
}

// =============================================================================
// TYPES
// =============================================================================

interface SessionSummaryModalProps {
  summary: SessionSummary;
  archetypeId: ArchetypeId;
  isOpen: boolean;
  onClose: () => void;
  onPracticeAgain: () => void;
  aiAnalysis?: AISessionAnalysis | null;
  isAIAnalysisLoading?: boolean;
}

// =============================================================================
// ICON COMPONENTS
// =============================================================================

function TrophyIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  );
}

function ChartIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}

function ClockIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function StarIcon({ className = "w-5 h-5", filled = false }: { className?: string; filled?: boolean }) {
  return filled ? (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  ) : (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
  );
}

function CheckIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function ArrowRightIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
    </svg>
  );
}

function AlertIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );
}

function SparklesIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  );
}

function BrainIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  );
}

function LoadingSpinner({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={`${className} animate-spin`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

function MasteryStars({ level, progressToNext }: { level: number; progressToNext: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <StarIcon
          key={star}
          className={`w-6 h-6 ${star <= level ? 'text-yellow-400' : 'text-gray-300'}`}
          filled={star <= level}
        />
      ))}
      {level < 5 && (
        <span className="ml-2 text-xs text-gray-500">{progressToNext}% to next level</span>
      )}
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  subtext,
  color
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtext?: string;
  color: 'blue' | 'green' | 'purple' | 'amber';
}) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    amber: 'bg-amber-50 text-amber-600 border-amber-200'
  };

  return (
    <div className={`p-4 rounded-xl border ${colors[color]}`}>
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-xs font-medium opacity-75">{label}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
      {subtext && <p className="text-xs opacity-75 mt-1">{subtext}</p>}
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function SessionSummaryModal({
  summary,
  archetypeId,
  isOpen,
  onClose,
  onPracticeAgain,
  aiAnalysis,
  isAIAnalysisLoading = false
}: SessionSummaryModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'analysis' | 'ai' | 'next'>('overview');
  const hasAIContent = aiAnalysis?.success && aiAnalysis?.deepInsight;

  if (!isOpen) return null;

  const archetype = getArchetypeDefinition(archetypeId);

  const getPerformanceColor = () => {
    switch (summary.performanceLevel) {
      case 'excellent': return 'from-green-500 to-emerald-600';
      case 'good': return 'from-blue-500 to-indigo-600';
      case 'developing': return 'from-amber-500 to-orange-600';
      case 'needs_work': return 'from-purple-500 to-pink-600';
    }
  };

  const getPerformanceEmoji = () => {
    switch (summary.performanceLevel) {
      case 'excellent': return '';
      case 'good': return '';
      case 'developing': return '';
      case 'needs_work': return '';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden my-8">
        {/* Header with gradient */}
        <div className={`bg-gradient-to-r ${getPerformanceColor()} px-6 py-6 text-white`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90 mb-1">Session Complete</p>
              <h2 className="text-2xl font-bold">{archetype.shortName}</h2>
            </div>
            <div className="text-right">
              <p className="text-4xl font-bold">{summary.accuracy}%</p>
              <p className="text-sm opacity-90">{summary.correctCount}/{summary.totalQuestions} correct</p>
            </div>
          </div>

          {/* Mastery progress */}
          <div className="mt-4 pt-4 border-t border-white/20">
            <div className="flex items-center justify-between">
              <span className="text-sm opacity-90">Mastery Level</span>
              {summary.masteryProgress.leveledUp && (
                <span className="px-2 py-1 bg-white/20 rounded-full text-xs font-medium">
                  Level Up!
                </span>
              )}
            </div>
            <div className="mt-2">
              <MasteryStars
                level={summary.masteryProgress.currentLevel}
                progressToNext={summary.masteryProgress.progressToNext}
              />
            </div>
          </div>
        </div>

        {/* Tab navigation */}
        <div className="border-b">
          <div className="flex">
            {(['overview', 'analysis', 'ai', 'next'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors relative ${
                  activeTab === tab
                    ? 'text-purple-600 border-b-2 border-purple-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <span className="flex items-center justify-center gap-1">
                  {tab === 'overview' && 'Overview'}
                  {tab === 'analysis' && 'Analysis'}
                  {tab === 'ai' && (
                    <>
                      <SparklesIcon className="w-4 h-4" />
                      <span>AI Insights</span>
                      {isAIAnalysisLoading && (
                        <LoadingSpinner className="w-3 h-3 ml-1" />
                      )}
                      {hasAIContent && !isAIAnalysisLoading && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-purple-500 rounded-full" />
                      )}
                    </>
                  )}
                  {tab === 'next' && 'Next Steps'}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div className="p-6 max-h-[400px] overflow-y-auto">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Encouragement */}
              <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100">
                <p className="text-gray-700">{summary.encouragement}</p>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 gap-4">
                <MetricCard
                  icon={<ChartIcon className="w-4 h-4" />}
                  label="Accuracy"
                  value={`${summary.accuracy}%`}
                  subtext={summary.performanceMessage}
                  color="blue"
                />
                <MetricCard
                  icon={<ClockIcon className="w-4 h-4" />}
                  label="Avg Time"
                  value={`${summary.averageTimeSeconds}s`}
                  subtext={summary.timeAnalysis.message}
                  color={summary.timeAnalysis.status === 'fast' ? 'green' : summary.timeAnalysis.status === 'slow' ? 'amber' : 'purple'}
                />
              </div>

              {/* Strengths */}
              {summary.strengths.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <CheckIcon className="w-4 h-4 text-green-500" />
                    Your Strengths
                  </h4>
                  <ul className="space-y-2">
                    {summary.strengths.map((strength, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                        <span className="text-green-500 mt-0.5">•</span>
                        {strength}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Analysis Tab */}
          {activeTab === 'analysis' && (
            <div className="space-y-6">
              {/* Error patterns */}
              {summary.errorAnalysis.topErrors.length > 0 ? (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <AlertIcon className="w-4 h-4 text-amber-500" />
                    Error Patterns Detected
                  </h4>
                  <div className="space-y-3">
                    {summary.errorAnalysis.topErrors.map((error, i) => (
                      <div key={i} className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-amber-800">{error.description}</span>
                          <span className="text-xs text-amber-600">{error.count} times</span>
                        </div>
                        {i === 0 && summary.errorAnalysis.patternMessage && (
                          <p className="text-xs text-amber-700 mt-2">{summary.errorAnalysis.patternMessage}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-green-50 rounded-xl border border-green-200 text-center">
                  <CheckIcon className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <p className="text-green-700 font-medium">No error patterns detected</p>
                  <p className="text-sm text-green-600">Great job maintaining consistency!</p>
                </div>
              )}

              {/* Areas for improvement */}
              {summary.improvements.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Areas to Focus On</h4>
                  <ul className="space-y-2">
                    {summary.improvements.map((improvement, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600 p-2 bg-gray-50 rounded-lg">
                        <ArrowRightIcon className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                        {improvement}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Time analysis */}
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                <h4 className="text-sm font-semibold text-blue-800 mb-2 flex items-center gap-2">
                  <ClockIcon className="w-4 h-4" />
                  Time Analysis
                </h4>
                <p className="text-sm text-blue-700">{summary.timeAnalysis.message}</p>
                {summary.timeAnalysis.improvement && (
                  <p className="text-sm text-green-600 mt-2">
                    Your time improved by {summary.timeAnalysis.improvement}% from previous sessions!
                  </p>
                )}
              </div>
            </div>
          )}

          {/* AI Insights Tab */}
          {activeTab === 'ai' && (
            <div className="space-y-6">
              {/* Loading state */}
              {isAIAnalysisLoading && (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="relative">
                    <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg">
                      <BrainIcon className="w-8 h-8 text-white" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow">
                      <LoadingSpinner className="w-4 h-4 text-purple-600" />
                    </div>
                  </div>
                  <p className="mt-4 text-sm font-medium text-gray-700">Analyzing your session...</p>
                  <p className="text-xs text-gray-500">Our AI tutor is reviewing your answers</p>
                </div>
              )}

              {/* No AI content available */}
              {!isAIAnalysisLoading && !hasAIContent && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <SparklesIcon className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-600 font-medium">AI Insights Not Available</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Complete more questions to unlock personalized AI analysis
                  </p>
                </div>
              )}

              {/* AI Analysis Content */}
              {!isAIAnalysisLoading && hasAIContent && aiAnalysis && (
                <>
                  {/* AI Badge Header */}
                  <div className="flex items-center gap-2 pb-3 border-b border-purple-100">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-xs font-semibold rounded-full shadow-sm">
                      <SparklesIcon className="w-3 h-3" />
                      AI-Powered Analysis
                    </span>
                    {aiAnalysis.progressIndicator && (
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        aiAnalysis.progressIndicator === 'improving'
                          ? 'bg-green-100 text-green-700'
                          : aiAnalysis.progressIndicator === 'stable'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-amber-100 text-amber-700'
                      }`}>
                        {aiAnalysis.progressIndicator === 'improving' && 'Improving'}
                        {aiAnalysis.progressIndicator === 'stable' && 'Stable Progress'}
                        {aiAnalysis.progressIndicator === 'needsAttention' && 'Needs Focus'}
                      </span>
                    )}
                  </div>

                  {/* Deep Insight - The main AI insight prominently displayed */}
                  {aiAnalysis.deepInsight && (
                    <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-200">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                          <BrainIcon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-purple-900 mb-1">Key Insight</h4>
                          <p className="text-sm text-purple-800 leading-relaxed">{aiAnalysis.deepInsight}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* AI-Identified Strengths */}
                  {aiAnalysis.strengthsIdentified && aiAnalysis.strengthsIdentified.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <CheckIcon className="w-4 h-4 text-green-500" />
                        What You're Doing Well
                      </h4>
                      <ul className="space-y-2">
                        {aiAnalysis.strengthsIdentified.map((strength, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-600 p-2 bg-green-50 rounded-lg border border-green-100">
                            <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>
                            {strength}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Root Cause Analysis */}
                  {aiAnalysis.rootCauseAnalysis && (
                    <div className={`p-4 rounded-xl border ${
                      aiAnalysis.rootCauseAnalysis.severity === 'significant'
                        ? 'bg-red-50 border-red-200'
                        : aiAnalysis.rootCauseAnalysis.severity === 'moderate'
                          ? 'bg-amber-50 border-amber-200'
                          : 'bg-yellow-50 border-yellow-200'
                    }`}>
                      <h4 className={`text-sm font-semibold mb-2 flex items-center gap-2 ${
                        aiAnalysis.rootCauseAnalysis.severity === 'significant'
                          ? 'text-red-800'
                          : aiAnalysis.rootCauseAnalysis.severity === 'moderate'
                            ? 'text-amber-800'
                            : 'text-yellow-800'
                      }`}>
                        <AlertIcon className="w-4 h-4" />
                        Area to Focus On
                        <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${
                          aiAnalysis.rootCauseAnalysis.severity === 'significant'
                            ? 'bg-red-200 text-red-700'
                            : aiAnalysis.rootCauseAnalysis.severity === 'moderate'
                              ? 'bg-amber-200 text-amber-700'
                              : 'bg-yellow-200 text-yellow-700'
                        }`}>
                          {aiAnalysis.rootCauseAnalysis.severity}
                        </span>
                      </h4>
                      <p className={`text-sm font-medium mb-1 ${
                        aiAnalysis.rootCauseAnalysis.severity === 'significant'
                          ? 'text-red-700'
                          : 'text-amber-700'
                      }`}>
                        {aiAnalysis.rootCauseAnalysis.primaryGap}
                      </p>
                      <p className="text-xs text-gray-600 italic">
                        Evidence: {aiAnalysis.rootCauseAnalysis.evidence}
                      </p>
                    </div>
                  )}

                  {/* AI Recommendations */}
                  {aiAnalysis.recommendations && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <ArrowRightIcon className="w-4 h-4 text-indigo-500" />
                        AI Recommendations
                      </h4>

                      <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                        <p className="text-xs font-medium text-indigo-600 mb-1">Right Now</p>
                        <p className="text-sm text-indigo-800">{aiAnalysis.recommendations.immediate}</p>
                      </div>

                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-xs font-medium text-blue-600 mb-1">Next Session</p>
                        <p className="text-sm text-blue-800">{aiAnalysis.recommendations.nextSession}</p>
                      </div>

                      {aiAnalysis.recommendations.prerequisiteReview && (
                        <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                          <p className="text-xs font-medium text-purple-600 mb-1">Prerequisite to Review</p>
                          <p className="text-sm text-purple-800">{aiAnalysis.recommendations.prerequisiteReview}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Personalized Encouragement from AI */}
                  {aiAnalysis.personalizedEncouragement && (
                    <div className="p-4 bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl border border-pink-200">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">💪</span>
                        <p className="text-sm text-pink-800 leading-relaxed">{aiAnalysis.personalizedEncouragement}</p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Next Steps Tab */}
          {activeTab === 'next' && (
            <div className="space-y-6">
              {/* Immediate recommendation */}
              <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
                <h4 className="text-sm font-semibold text-purple-800 mb-2">Right Now</h4>
                <p className="text-sm text-purple-700">{summary.recommendations.immediate}</p>
              </div>

              {/* Next session */}
              <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-200">
                <h4 className="text-sm font-semibold text-indigo-800 mb-2">Next Session</h4>
                <p className="text-sm text-indigo-700">{summary.recommendations.nextSession}</p>
              </div>

              {/* Related archetypes */}
              {summary.recommendations.relatedArchetypes && summary.recommendations.relatedArchetypes.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Try These Related Archetypes</h4>
                  <div className="space-y-2">
                    {summary.recommendations.relatedArchetypes.map((id) => {
                      const related = ARCHETYPE_CATALOG[id];
                      return (
                        <Link
                          key={id}
                          href={`/nsw-selective/practice/${id}`}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <div>
                            <p className="text-sm font-medium text-gray-900">{related.shortName}</p>
                            <p className="text-xs text-gray-500">Difficulty {related.difficulty}</p>
                          </div>
                          <ArrowRightIcon className="w-5 h-5 text-gray-400" />
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Methodology reminder */}
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                <h4 className="text-sm font-semibold text-amber-800 mb-2">Remember the Methodology</h4>
                <p className="text-sm text-amber-700 mb-2">{archetype.solutionApproach}</p>
                <Link
                  href={`/nsw-selective/methodology/${archetypeId}`}
                  className="text-xs text-amber-600 hover:text-amber-700 font-medium"
                >
                  Review full methodology →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t flex gap-3">
          <button
            onClick={onPracticeAgain}
            className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-colors"
          >
            Practice Again
          </button>
          <Link
            href="/nsw-selective/practice"
            className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 transition-colors text-center"
            onClick={onClose}
          >
            Choose Another Type
          </Link>
        </div>
      </div>
    </div>
  );
}

export default SessionSummaryModal;

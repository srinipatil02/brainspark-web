'use client';

import { useState } from 'react';
import {
  GradingResult,
  getMasteryLevel,
  MASTERY_CONFIG,
  CORRECTNESS_CONFIG,
  Correctness,
} from '@/types/grading';

// -----------------------------------------------------------------------------
// Props
// -----------------------------------------------------------------------------

interface GradingResultCardProps {
  result: GradingResult;
  showDetails?: boolean;
  onRetry?: () => void;
  onNext?: () => void;
  colorTheme?: string;
}

// -----------------------------------------------------------------------------
// Icons
// -----------------------------------------------------------------------------

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function PartialIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M20 12H4" />
    </svg>
  );
}

function LightbulbIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
    </svg>
  );
}

function WarningIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
  );
}

function AlertIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
  );
}

// -----------------------------------------------------------------------------
// Correctness Icon Component
// -----------------------------------------------------------------------------

function CorrectnessIcon({ correctness, size = 'lg' }: { correctness: Correctness; size?: 'sm' | 'md' | 'lg' }) {
  const config = CORRECTNESS_CONFIG[correctness];
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-14 h-14',
  };
  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <div className={`${sizeClasses[size]} rounded-full flex items-center justify-center ${config.bgSolid}`}>
      {correctness === 'correct' && <CheckIcon className={`${iconSizes[size]} text-white`} />}
      {correctness === 'partial' && <PartialIcon className={`${iconSizes[size]} text-white`} />}
      {correctness === 'incorrect' && <XIcon className={`${iconSizes[size]} text-white`} />}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Main Component
// -----------------------------------------------------------------------------

export function GradingResultCard({
  result,
  showDetails = true,
  onRetry,
  onNext,
  colorTheme = 'emerald',
}: GradingResultCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const masteryLevel = getMasteryLevel(result.percentage);
  const masteryConfig = MASTERY_CONFIG[masteryLevel];
  const correctnessConfig = CORRECTNESS_CONFIG[result.correctness];

  return (
    <div className={`rounded-xl overflow-hidden border-2 ${correctnessConfig.border} animate-fade-in-up`}>
      {/* Header with score */}
      <div className={`${correctnessConfig.bgLight} p-5`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Correctness Icon */}
            <CorrectnessIcon correctness={result.correctness} />

            {/* Score Display */}
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-gray-900">
                  {result.score}
                </span>
                <span className="text-xl text-gray-500">
                  / {result.maxScore}
                </span>
              </div>
              <div className="text-sm text-gray-600">
                {result.percentage}% - {correctnessConfig.label}
              </div>
            </div>
          </div>

          {/* Mastery Badge */}
          <div className={`px-4 py-2 rounded-full ${masteryConfig.bgLight} border ${masteryConfig.border}`}>
            <span className={`font-semibold capitalize ${masteryConfig.text}`}>
              {masteryConfig.emoji} {masteryLevel}
            </span>
          </div>
        </div>
      </div>

      {/* Feedback Summary */}
      <div className="p-5 bg-white border-b border-gray-100">
        <p className="text-gray-800 leading-relaxed">{result.feedback?.summary || 'Your answer has been graded.'}</p>
      </div>

      {/* Detailed Feedback */}
      {showDetails && (
        <div className="p-5 bg-gray-50 space-y-4">
          {/* Toggle button for mobile */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-between text-sm font-medium text-gray-600 md:hidden"
          >
            <span>{isExpanded ? 'Hide Details' : 'Show Details'}</span>
            <svg
              className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <div className={`space-y-4 ${isExpanded ? 'block' : 'hidden md:block'}`}>
            {/* What Was Right */}
            {(result.feedback?.whatWasRight?.length ?? 0) > 0 && (
              <FeedbackSection
                title="What you got right"
                items={result.feedback?.whatWasRight ?? []}
                icon={<CheckIcon className="w-5 h-5" />}
                bgColor="bg-green-50"
                textColor="text-green-800"
                bulletColor="text-green-500"
              />
            )}

            {/* What Was Missing */}
            {(result.feedback?.whatWasMissing?.length ?? 0) > 0 && (
              <FeedbackSection
                title="What was missing"
                items={result.feedback?.whatWasMissing ?? []}
                icon={<WarningIcon className="w-5 h-5" />}
                bgColor="bg-amber-50"
                textColor="text-amber-800"
                bulletColor="text-amber-500"
              />
            )}

            {/* Misconceptions */}
            {(result.feedback?.misconceptions?.length ?? 0) > 0 && (
              <FeedbackSection
                title="Watch out for"
                items={result.feedback?.misconceptions ?? []}
                icon={<AlertIcon className="w-5 h-5" />}
                bgColor="bg-red-50"
                textColor="text-red-800"
                bulletColor="text-red-500"
              />
            )}

            {/* Suggestions */}
            {(result.feedback?.suggestions?.length ?? 0) > 0 && (
              <FeedbackSection
                title="To improve"
                items={result.feedback?.suggestions ?? []}
                icon={<LightbulbIcon className="w-5 h-5" />}
                bgColor="bg-blue-50"
                textColor="text-blue-800"
                bulletColor="text-blue-500"
              />
            )}

            {/* Rubric Scores (if available) */}
            {Array.isArray(result.rubricScores) && result.rubricScores.length > 0 && (
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h4 className="font-semibold text-gray-800 mb-3">Detailed Scores</h4>
                <div className="space-y-3">
                  {result.rubricScores.map((item, i) => {
                    // Skip any invalid items that might have slipped through
                    if (!item || typeof item !== 'object') return null;
                    const criterion = item.criterion ?? 'Unknown';
                    const score = typeof item.score === 'number' ? item.score : 0;
                    const maxScore = typeof item.maxScore === 'number' ? item.maxScore : 1;
                    const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;

                    return (
                      <div key={i}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-700">{criterion}</span>
                          <span className="text-sm font-medium text-gray-700">
                            {score}/{maxScore}
                          </span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              score === maxScore
                                ? 'bg-green-500'
                                : score >= maxScore / 2
                                  ? 'bg-blue-500'
                                  : 'bg-orange-500'
                            }`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        {item.feedback && (
                          <p className="text-xs text-gray-500 mt-1">{item.feedback}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {(onRetry || onNext) && (
        <div className="p-4 bg-white border-t border-gray-100 flex gap-3">
          {onRetry && result.correctness !== 'correct' && (
            <button
              onClick={onRetry}
              className="flex-1 py-2.5 px-4 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              Try Again
            </button>
          )}
          {onNext && (
            <button
              onClick={onNext}
              className={`flex-1 py-2.5 px-4 bg-${colorTheme}-600 text-white rounded-lg font-medium hover:bg-${colorTheme}-700 transition-colors`}
            >
              Next Question
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Feedback Section Component
// -----------------------------------------------------------------------------

interface FeedbackSectionProps {
  title: string;
  items: string[];
  icon: React.ReactNode;
  bgColor: string;
  textColor: string;
  bulletColor: string;
}

function FeedbackSection({
  title,
  items,
  icon,
  bgColor,
  textColor,
  bulletColor,
}: FeedbackSectionProps) {
  // Filter out any null/undefined/empty items just to be safe
  const safeItems = Array.isArray(items)
    ? items.filter((item): item is string => typeof item === 'string' && item.length > 0)
    : [];

  if (safeItems.length === 0) return null;

  return (
    <div className={`${bgColor} p-4 rounded-lg`}>
      <h4 className={`font-semibold ${textColor} mb-2 flex items-center gap-2`}>
        {icon}
        {title}
      </h4>
      <ul className="space-y-1.5">
        {safeItems.map((item, i) => (
          <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
            <span className={`${bulletColor} mt-0.5 flex-shrink-0`}>•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Compact Result Badge (for question navigator)
// -----------------------------------------------------------------------------

interface ResultBadgeProps {
  result: GradingResult;
  size?: 'sm' | 'md';
}

export function ResultBadge({ result, size = 'sm' }: ResultBadgeProps) {
  const config = CORRECTNESS_CONFIG[result.correctness];
  const sizeClasses = size === 'sm' ? 'w-6 h-6 text-xs' : 'w-8 h-8 text-sm';

  return (
    <div
      className={`${sizeClasses} rounded-full ${config.bgSolid} text-white flex items-center justify-center font-bold`}
      title={`${result.score}/${result.maxScore} (${result.percentage}%)`}
    >
      {result.correctness === 'correct' && (
        <CheckIcon className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />
      )}
      {result.correctness === 'partial' && (
        <span>~</span>
      )}
      {result.correctness === 'incorrect' && (
        <XIcon className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Score Summary (for set completion)
// -----------------------------------------------------------------------------

interface ScoreSummaryProps {
  totalScore: number;
  totalMaxScore: number;
  questionsCorrect: number;
  totalQuestions: number;
}

export function ScoreSummary({
  totalScore,
  totalMaxScore,
  questionsCorrect,
  totalQuestions,
}: ScoreSummaryProps) {
  const percentage = totalMaxScore > 0 ? Math.round((totalScore / totalMaxScore) * 100) : 0;
  const masteryLevel = getMasteryLevel(percentage);
  const config = MASTERY_CONFIG[masteryLevel];

  return (
    <div className={`${config.bgLight} rounded-xl p-6 border-2 ${config.border}`}>
      <div className="text-center mb-4">
        <div className="text-5xl mb-2">{config.emoji}</div>
        <h3 className={`text-2xl font-bold ${config.text}`}>{config.label}</h3>
      </div>

      <div className="grid grid-cols-2 gap-4 text-center">
        <div className="bg-white rounded-lg p-4">
          <div className="text-3xl font-bold text-gray-900">{totalScore}/{totalMaxScore}</div>
          <div className="text-sm text-gray-500">Total Score</div>
        </div>
        <div className="bg-white rounded-lg p-4">
          <div className="text-3xl font-bold text-gray-900">{percentage}%</div>
          <div className="text-sm text-gray-500">Percentage</div>
        </div>
      </div>

      <div className="mt-4 text-center text-sm text-gray-600">
        {questionsCorrect} of {totalQuestions} questions correct
      </div>

      {/* Progress bar */}
      <div className="mt-4 w-full h-3 bg-white rounded-full overflow-hidden">
        <div
          className={`h-full ${config.bgSolid} rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

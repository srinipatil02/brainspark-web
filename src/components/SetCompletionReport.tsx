'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  SetAttempt,
  MasteryLevel,
  MASTERY_CONFIG,
  getMasteryLevel,
} from '@/types/grading';

// -----------------------------------------------------------------------------
// Props
// -----------------------------------------------------------------------------

interface SetCompletionReportProps {
  attempt: SetAttempt;
  setTitle: string;
  setSubtitle?: string;
  backLink: string;
  onTryAgain?: () => void;
  attemptHistory?: SetAttempt[];
  bestPercentage?: number;
  colorTheme?: string;
}

// -----------------------------------------------------------------------------
// Icons
// -----------------------------------------------------------------------------

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function PartialIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function TrophyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M5 5a3 3 0 015-2.236A3 3 0 0114.83 6H16a2 2 0 110 4h-1.17A3 3 0 0111 13.17V14h.5a.5.5 0 01.5.5v2a.5.5 0 01-.5.5h-3a.5.5 0 01-.5-.5v-2a.5.5 0 01.5-.5H9v-.83A3 3 0 015.17 10H4a2 2 0 110-4h1.17A3 3 0 015 5z" clipRule="evenodd" />
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

function AlertIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
  );
}

function ChartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}

// -----------------------------------------------------------------------------
// Helper Components
// -----------------------------------------------------------------------------

function StatCard({
  label,
  value,
  icon,
  colorClass
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  colorClass: string;
}) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClass}`}>
          {icon}
        </div>
        <div>
          <div className="text-2xl font-bold text-gray-900">{value}</div>
          <div className="text-sm text-gray-500">{label}</div>
        </div>
      </div>
    </div>
  );
}

function ConceptList({
  title,
  items,
  icon,
  bgColor,
  textColor,
  emptyMessage,
}: {
  title: string;
  items: string[];
  icon: React.ReactNode;
  bgColor: string;
  textColor: string;
  emptyMessage: string;
}) {
  if (items.length === 0) {
    return (
      <div className={`${bgColor} rounded-xl p-4`}>
        <h4 className={`font-semibold ${textColor} mb-2 flex items-center gap-2`}>
          {icon}
          {title}
        </h4>
        <p className="text-gray-500 text-sm italic">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={`${bgColor} rounded-xl p-4`}>
      <h4 className={`font-semibold ${textColor} mb-3 flex items-center gap-2`}>
        {icon}
        {title}
      </h4>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
            <span className={`${textColor} mt-0.5`}>•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Main Component
// -----------------------------------------------------------------------------

export function SetCompletionReport({
  attempt,
  setTitle,
  setSubtitle,
  backLink,
  onTryAgain,
  attemptHistory = [],
  bestPercentage = 0,
  colorTheme = 'emerald',
}: SetCompletionReportProps) {
  const [showHistory, setShowHistory] = useState(false);
  const masteryConfig = MASTERY_CONFIG[attempt.masteryLevel];

  // Calculate if this is a new best
  const isNewBest = attempt.percentage >= bestPercentage && attemptHistory.length > 0;

  // Format date for display
  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in-up">
      {/* Header with Score */}
      <div className={`${masteryConfig.bgLight} rounded-2xl p-6 border-2 ${masteryConfig.border}`}>
        <div className="text-center">
          {/* Mastery Badge */}
          <div className="text-6xl mb-3">{masteryConfig.emoji}</div>
          <h2 className={`text-2xl font-bold ${masteryConfig.text} mb-1`}>
            {masteryConfig.label}
          </h2>
          <p className="text-gray-600 mb-4">{setTitle}</p>

          {/* Score Display */}
          <div className="flex items-center justify-center gap-8 mb-4">
            <div className="text-center">
              <div className="text-5xl font-bold text-gray-900">{attempt.totalScore}</div>
              <div className="text-gray-500">of {attempt.totalMaxScore} points</div>
            </div>
            <div className={`w-24 h-24 rounded-full ${masteryConfig.bgSolid} flex items-center justify-center`}>
              <span className="text-3xl font-bold text-white">{attempt.percentage}%</span>
            </div>
          </div>

          {/* New Best Badge */}
          {isNewBest && (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full text-sm font-semibold">
              <TrophyIcon className="w-5 h-5" />
              New Personal Best!
            </div>
          )}
        </div>
      </div>

      {/* Question Breakdown */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          label="Attempted"
          value={attempt.questionsAttempted}
          icon={<ChartIcon className="w-5 h-5 text-blue-600" />}
          colorClass="bg-blue-100"
        />
        <StatCard
          label="Correct"
          value={attempt.questionsCorrect}
          icon={<CheckIcon className="w-5 h-5 text-green-600" />}
          colorClass="bg-green-100"
        />
        <StatCard
          label="Partial"
          value={attempt.questionsPartial}
          icon={<PartialIcon className="w-5 h-5 text-orange-600" />}
          colorClass="bg-orange-100"
        />
        <StatCard
          label="Incorrect"
          value={attempt.questionsIncorrect}
          icon={<XIcon className="w-5 h-5 text-red-600" />}
          colorClass="bg-red-100"
        />
      </div>

      {/* Weakness Analysis */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <LightbulbIcon className="w-5 h-5 text-amber-500" />
          Areas to Improve
        </h3>

        <div className="space-y-4">
          {/* Concepts to Review */}
          <ConceptList
            title="Concepts to Review"
            items={attempt.conceptsToReview}
            icon={<AlertIcon className="w-5 h-5" />}
            bgColor="bg-amber-50"
            textColor="text-amber-700"
            emptyMessage="Great job! No specific concepts need review."
          />

          {/* Misconceptions */}
          {attempt.misconceptions.length > 0 && (
            <ConceptList
              title="Watch Out For"
              items={attempt.misconceptions}
              icon={<AlertIcon className="w-5 h-5" />}
              bgColor="bg-red-50"
              textColor="text-red-700"
              emptyMessage=""
            />
          )}

          {/* Concepts Mastered */}
          {attempt.conceptsMastered.length > 0 && (
            <ConceptList
              title="Concepts Mastered"
              items={attempt.conceptsMastered}
              icon={<CheckIcon className="w-5 h-5" />}
              bgColor="bg-green-50"
              textColor="text-green-700"
              emptyMessage=""
            />
          )}
        </div>
      </div>

      {/* Attempt History */}
      {attemptHistory.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="w-full flex items-center justify-between text-lg font-semibold text-gray-800"
          >
            <span className="flex items-center gap-2">
              <ChartIcon className="w-5 h-5 text-purple-500" />
              Attempt History ({attemptHistory.length + 1} attempts)
            </span>
            <svg
              className={`w-5 h-5 transition-transform ${showHistory ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showHistory && (
            <div className="mt-4 space-y-3">
              {/* Current attempt */}
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
                <div>
                  <span className="font-medium text-purple-800">
                    Attempt {attemptHistory.length + 1} (Current)
                  </span>
                  <div className="text-xs text-purple-600">{formatDate(attempt.completedAt)}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600">
                    {attempt.questionsAttempted} questions
                  </span>
                  <span className={`font-bold ${MASTERY_CONFIG[attempt.masteryLevel].text}`}>
                    {attempt.percentage}%
                  </span>
                </div>
              </div>

              {/* Previous attempts */}
              {[...attemptHistory].reverse().map((hist, i) => {
                const histMastery = MASTERY_CONFIG[hist.masteryLevel];
                return (
                  <div key={hist.attemptId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <span className="font-medium text-gray-700">
                        Attempt {attemptHistory.length - i}
                      </span>
                      <div className="text-xs text-gray-500">{formatDate(hist.completedAt)}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-600">
                        {hist.questionsAttempted} questions
                      </span>
                      <span className={`font-bold ${histMastery.text}`}>
                        {hist.percentage}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Link
          href={backLink}
          className="flex-1 py-3 px-6 bg-gray-100 text-gray-700 rounded-xl font-medium text-center hover:bg-gray-200 transition-colors"
        >
          Back to Topic
        </Link>
        {onTryAgain && (
          <button
            onClick={onTryAgain}
            className={`flex-1 py-3 px-6 bg-${colorTheme}-600 text-white rounded-xl font-medium hover:bg-${colorTheme}-700 transition-colors`}
          >
            Try Again
          </button>
        )}
        <Link
          href="/dashboard"
          className="flex-1 py-3 px-6 bg-purple-600 text-white rounded-xl font-medium text-center hover:bg-purple-700 transition-colors"
        >
          View Dashboard
        </Link>
      </div>

      {/* Timestamp */}
      <p className="text-center text-sm text-gray-400">
        Completed on {formatDate(attempt.completedAt)}
      </p>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Compact Report Card (for embedding in other views)
// -----------------------------------------------------------------------------

interface CompactReportProps {
  attempt: SetAttempt;
  onClick?: () => void;
}

export function CompactReportCard({ attempt, onClick }: CompactReportProps) {
  const masteryConfig = MASTERY_CONFIG[attempt.masteryLevel];
  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl ${masteryConfig.bgLight} flex items-center justify-center text-2xl`}>
            {masteryConfig.emoji}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-lg font-bold ${masteryConfig.text}`}>
                {attempt.percentage}%
              </span>
              <span className="text-gray-400">•</span>
              <span className="text-gray-600">
                {attempt.totalScore}/{attempt.totalMaxScore} pts
              </span>
            </div>
            <div className="text-sm text-gray-500">
              {attempt.questionsAttempted} questions • {formatDate(attempt.completedAt)}
            </div>
          </div>
        </div>
        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>

      {/* Weak areas preview */}
      {attempt.conceptsToReview.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {attempt.conceptsToReview.slice(0, 3).map((concept, i) => (
            <span key={i} className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">
              {concept}
            </span>
          ))}
          {attempt.conceptsToReview.length > 3 && (
            <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">
              +{attempt.conceptsToReview.length - 3} more
            </span>
          )}
        </div>
      )}
    </button>
  );
}

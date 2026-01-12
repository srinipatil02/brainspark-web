'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAllSetsProgress, SetProgress } from '@/hooks/useSetProgress';
import {
  SetAttempt,
  MasteryLevel,
  MASTERY_CONFIG,
  getMasteryLevel,
} from '@/types/grading';
import { MasteryDashboard } from '@/components/MasteryDashboard';

// -----------------------------------------------------------------------------
// Set Metadata Registry
// -----------------------------------------------------------------------------

interface SetMetadata {
  setId: string;
  subject: string;
  topic: string;
  topicSlug: string;
  year: number;
  setNumber: number;
  title: string;
  color: string;
}

// Registry of all known sets with their metadata
const SET_REGISTRY: Record<string, SetMetadata> = {
  'year8-science-cells-set1': {
    setId: 'year8-science-cells-set1',
    subject: 'Science',
    topic: 'Cells & Body Systems',
    topicSlug: 'year8-cells',
    year: 8,
    setNumber: 1,
    title: 'Cell Foundations',
    color: 'emerald',
  },
  'year8-science-cells-set2': {
    setId: 'year8-science-cells-set2',
    subject: 'Science',
    topic: 'Cells & Body Systems',
    topicSlug: 'year8-cells',
    year: 8,
    setNumber: 2,
    title: 'Fuel Systems',
    color: 'amber',
  },
  'year8-science-cells-set3': {
    setId: 'year8-science-cells-set3',
    subject: 'Science',
    topic: 'Cells & Body Systems',
    topicSlug: 'year8-cells',
    year: 8,
    setNumber: 3,
    title: 'Transport Networks',
    color: 'red',
  },
  'year8-science-cells-set4': {
    setId: 'year8-science-cells-set4',
    subject: 'Science',
    topic: 'Cells & Body Systems',
    topicSlug: 'year8-cells',
    year: 8,
    setNumber: 4,
    title: 'Control & Movement',
    color: 'purple',
  },
  'year8-science-cells-set5': {
    setId: 'year8-science-cells-set5',
    subject: 'Science',
    topic: 'Cells & Body Systems',
    topicSlug: 'year8-cells',
    year: 8,
    setNumber: 5,
    title: 'Body Integration',
    color: 'blue',
  },
  'year8-science-states-of-matter-set1': {
    setId: 'year8-science-states-of-matter-set1',
    subject: 'Science',
    topic: 'States of Matter',
    topicSlug: 'year8-states-of-matter',
    year: 8,
    setNumber: 1,
    title: 'Particle Basics',
    color: 'cyan',
  },
  'year8-science-elements-compounds-set1': {
    setId: 'year8-science-elements-compounds-set1',
    subject: 'Science',
    topic: 'Elements & Compounds',
    topicSlug: 'year8-elements-compounds',
    year: 8,
    setNumber: 1,
    title: 'Atoms & Elements',
    color: 'indigo',
  },
  'year8-science-chemical-reactions-set1': {
    setId: 'year8-science-chemical-reactions-set1',
    subject: 'Science',
    topic: 'Chemical Reactions',
    topicSlug: 'year8-chemical-reactions',
    year: 8,
    setNumber: 1,
    title: 'Reaction Basics',
    color: 'orange',
  },
  'year8-science-rocks-minerals-set1': {
    setId: 'year8-science-rocks-minerals-set1',
    subject: 'Science',
    topic: 'Rocks & Minerals',
    topicSlug: 'year8-rocks-minerals',
    year: 8,
    setNumber: 1,
    title: 'Rock Types',
    color: 'stone',
  },
  'year8-science-energy-set1': {
    setId: 'year8-science-energy-set1',
    subject: 'Science',
    topic: 'Energy',
    topicSlug: 'year8-energy',
    year: 8,
    setNumber: 1,
    title: 'Energy Forms',
    color: 'yellow',
  },
};

// Get metadata for a setId, with fallback for unknown sets
function getSetMetadata(setId: string): SetMetadata {
  if (SET_REGISTRY[setId]) {
    return SET_REGISTRY[setId];
  }

  // Parse setId to extract info (format: year8-science-topic-setN)
  const parts = setId.split('-');
  const yearMatch = parts[0]?.match(/year(\d+)/);
  const year = yearMatch ? parseInt(yearMatch[1]) : 8;
  const subject = parts[1] || 'Unknown';
  const topic = parts.slice(2, -1).join(' ') || 'Unknown Topic';
  const setMatch = setId.match(/set(\d+)/);
  const setNumber = setMatch ? parseInt(setMatch[1]) : 1;

  return {
    setId,
    subject: subject.charAt(0).toUpperCase() + subject.slice(1),
    topic: topic.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    topicSlug: parts.slice(0, -1).join('-'),
    year,
    setNumber,
    title: `Set ${setNumber}`,
    color: 'gray',
  };
}

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface AttemptWithMetadata {
  attempt: SetAttempt;
  metadata: SetMetadata;
  setProgress: SetProgress;
}

type SortOption = 'date' | 'score' | 'topic';
type FilterOption = 'all' | 'today' | 'week' | 'month';

// -----------------------------------------------------------------------------
// Icons
// -----------------------------------------------------------------------------

function ChartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
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

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function BookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
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
// Main Component
// -----------------------------------------------------------------------------

type ViewTab = 'history' | 'mastery';

export default function DashboardPage() {
  const { allProgress, isLoaded, isAuthenticated } = useAllSetsProgress();
  const [sortBy, setSortBy] = useState<SortOption>('date');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<ViewTab>('history');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Collect all attempts from all sets
  const allAttempts = useMemo(() => {
    const attempts: AttemptWithMetadata[] = [];

    for (const [setId, progress] of Object.entries(allProgress)) {
      const metadata = getSetMetadata(setId);

      // Add attempts from history
      for (const attempt of (progress.attemptHistory || [])) {
        attempts.push({ attempt, metadata, setProgress: progress });
      }

      // Add current progress as an "in progress" attempt if there are results
      if (Object.keys(progress.results || {}).length > 0 && progress.completedQuestions.length > 0) {
        const currentAttempt: SetAttempt = {
          attemptId: `current-${setId}`,
          setId,
          startedAt: progress.currentAttemptStarted || new Date().toISOString(),
          completedAt: new Date(progress.lastAccessed).toISOString(),
          questionsAttempted: progress.completedQuestions.length,
          questionsCorrect: Object.values(progress.results).filter(r => r.correctness === 'correct').length,
          questionsPartial: Object.values(progress.results).filter(r => r.correctness === 'partial').length,
          questionsIncorrect: Object.values(progress.results).filter(r => r.correctness === 'incorrect').length,
          totalScore: progress.totalScore,
          totalMaxScore: progress.totalMaxScore,
          percentage: progress.totalMaxScore > 0 ? Math.round((progress.totalScore / progress.totalMaxScore) * 100) : 0,
          masteryLevel: getMasteryLevel(progress.totalMaxScore > 0 ? Math.round((progress.totalScore / progress.totalMaxScore) * 100) : 0),
          conceptsAssessed: [],
          conceptsMastered: [],
          conceptsToReview: [],
          misconceptions: [],
          questionResults: [],
        };

        // Only add if not already in history (current session)
        const isInHistory = (progress.attemptHistory || []).some(
          h => h.completedAt === currentAttempt.completedAt
        );
        if (!isInHistory) {
          attempts.push({ attempt: currentAttempt, metadata, setProgress: progress });
        }
      }
    }

    return attempts;
  }, [allProgress]);

  // Filter attempts
  const filteredAttempts = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    return allAttempts.filter(({ attempt }) => {
      const attemptDate = new Date(attempt.completedAt);
      switch (filterBy) {
        case 'today':
          return attemptDate >= today;
        case 'week':
          return attemptDate >= weekAgo;
        case 'month':
          return attemptDate >= monthAgo;
        default:
          return true;
      }
    });
  }, [allAttempts, filterBy]);

  // Sort attempts
  const sortedAttempts = useMemo(() => {
    return [...filteredAttempts].sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.attempt.completedAt).getTime() - new Date(a.attempt.completedAt).getTime();
        case 'score':
          return b.attempt.percentage - a.attempt.percentage;
        case 'topic':
          return a.metadata.topic.localeCompare(b.metadata.topic);
        default:
          return 0;
      }
    });
  }, [filteredAttempts, sortBy]);

  // Calculate overall stats
  const stats = useMemo(() => {
    const totalAttempts = allAttempts.length;
    const totalQuestions = allAttempts.reduce((sum, a) => sum + a.attempt.questionsAttempted, 0);
    const totalCorrect = allAttempts.reduce((sum, a) => sum + a.attempt.questionsCorrect, 0);
    const avgPercentage = totalAttempts > 0
      ? Math.round(allAttempts.reduce((sum, a) => sum + a.attempt.percentage, 0) / totalAttempts)
      : 0;

    // Collect all weak concepts
    const allWeakConcepts: Record<string, number> = {};
    for (const { attempt } of allAttempts) {
      for (const concept of attempt.conceptsToReview) {
        allWeakConcepts[concept] = (allWeakConcepts[concept] || 0) + 1;
      }
    }

    // Sort by frequency
    const topWeakConcepts = Object.entries(allWeakConcepts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([concept]) => concept);

    return {
      totalAttempts,
      totalQuestions,
      totalCorrect,
      avgPercentage,
      topWeakConcepts,
    };
  }, [allAttempts]);

  // Format date for display
  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  if (!mounted || !isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/curriculum" className="text-purple-600 hover:text-purple-700 text-sm flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Curriculum
              </Link>
              <h1 className="text-2xl font-bold text-gray-800 mt-1">Progress Dashboard</h1>
              <p className="text-gray-500 text-sm">
                Track your learning journey across all topics
              </p>
            </div>
            {!isAuthenticated && (
              <div className="px-4 py-2 bg-amber-100 text-amber-800 rounded-lg text-sm">
                Sign in to sync progress across devices
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Overall Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <ChartIcon className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.totalAttempts}</div>
                <div className="text-sm text-gray-500">Total Attempts</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <BookIcon className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.totalQuestions}</div>
                <div className="text-sm text-gray-500">Questions Answered</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <TrophyIcon className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.totalCorrect}</div>
                <div className="text-sm text-gray-500">Correct Answers</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <CalendarIcon className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.avgPercentage}%</div>
                <div className="text-sm text-gray-500">Avg Score</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 font-medium transition-colors border-b-2 -mb-px ${
              activeTab === 'history'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Attempt History
          </button>
          <button
            onClick={() => setActiveTab('mastery')}
            className={`px-4 py-2 font-medium transition-colors border-b-2 -mb-px ${
              activeTab === 'mastery'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Skill Mastery
          </button>
        </div>

        {/* Mastery Dashboard View */}
        {activeTab === 'mastery' && (
          <MasteryDashboard colorTheme="purple" />
        )}

        {/* History View */}
        {activeTab === 'history' && (
          <>
            {/* Weak Concepts */}
            {stats.topWeakConcepts.length > 0 && (
              <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                <h3 className="font-semibold text-amber-800 mb-3 flex items-center gap-2">
                  <AlertIcon className="w-5 h-5" />
                  Focus Areas (Concepts to Review)
                </h3>
                <div className="flex flex-wrap gap-2">
                  {stats.topWeakConcepts.map((concept, i) => (
                    <span key={i} className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm">
                      {concept}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Filter and Sort Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Show:</span>
            {(['all', 'today', 'week', 'month'] as FilterOption[]).map((option) => (
              <button
                key={option}
                onClick={() => setFilterBy(option)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  filterBy === option
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {option === 'all' ? 'All Time' : option.charAt(0).toUpperCase() + option.slice(1)}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-3 py-1 rounded-lg border border-gray-200 text-sm bg-white"
            >
              <option value="date">Most Recent</option>
              <option value="score">Highest Score</option>
              <option value="topic">Topic</option>
            </select>
          </div>
        </div>

        {/* Attempts List */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800">
              Attempt History ({sortedAttempts.length} {sortedAttempts.length === 1 ? 'attempt' : 'attempts'})
            </h2>
          </div>

          {sortedAttempts.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">📚</div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No attempts yet</h3>
              <p className="text-gray-500 mb-4">Start practicing to see your progress here!</p>
              <Link
                href="/curriculum"
                className="inline-flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Browse Topics
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {sortedAttempts.map(({ attempt, metadata, setProgress }) => {
                const masteryConfig = MASTERY_CONFIG[attempt.masteryLevel];
                const isCurrent = attempt.attemptId.startsWith('current-');

                return (
                  <div key={attempt.attemptId} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {/* Mastery Indicator */}
                        <div className={`w-12 h-12 rounded-xl ${masteryConfig.bgLight} flex items-center justify-center text-2xl`}>
                          {masteryConfig.emoji}
                        </div>

                        {/* Details */}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-800">{metadata.topic}</span>
                            <span className="text-gray-400">•</span>
                            <span className="text-gray-600">{metadata.title}</span>
                            {isCurrent && (
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                                In Progress
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center gap-3">
                            <span>Year {metadata.year} {metadata.subject}</span>
                            <span className="text-gray-300">|</span>
                            <span>{attempt.questionsAttempted} questions</span>
                            <span className="text-gray-300">|</span>
                            <span>{formatDate(attempt.completedAt)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Score */}
                      <div className="text-right">
                        <div className={`text-xl font-bold ${masteryConfig.text}`}>
                          {attempt.percentage}%
                        </div>
                        <div className="text-sm text-gray-500">
                          {attempt.totalScore}/{attempt.totalMaxScore} pts
                        </div>
                      </div>
                    </div>

                    {/* Weak concepts for this attempt */}
                    {attempt.conceptsToReview.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {attempt.conceptsToReview.slice(0, 4).map((concept, i) => (
                          <span key={i} className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">
                            {concept}
                          </span>
                        ))}
                        {attempt.conceptsToReview.length > 4 && (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">
                            +{attempt.conceptsToReview.length - 4} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        </>
        )}
      </main>
    </div>
  );
}

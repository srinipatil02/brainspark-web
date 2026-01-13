// =============================================================================
// STUDY PLAN DASHBOARD COMPONENT
// =============================================================================
// FILE: src/components/nsw-selective/StudyPlanDashboard.tsx
// DOMAIN: NSW Selective Exam Prep - AI Tutoring
// PURPOSE: Display AI-generated personalized study plans with weekly schedules
// GOAL: Help students know exactly what to study and when for maximum progress

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getAllArchetypeProgress } from '@/services/nsw-selective/progressService';
import { getAIStudyPlan, StudyPlanResponse, PriorityArchetype } from '@/services/nsw-selective/aiTutoringService';
import { ArchetypeId, ArchetypeProgress, ARCHETYPE_CATALOG } from '@/types/nsw-selective';

// =============================================================================
// ICON COMPONENTS
// =============================================================================

function CalendarIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
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

function TargetIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" strokeWidth={2} />
      <circle cx="12" cy="12" r="6" strokeWidth={2} />
      <circle cx="12" cy="12" r="2" fill="currentColor" />
    </svg>
  );
}

function SparklesIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
    </svg>
  );
}

function CheckCircleIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function ChartBarIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}

function RefreshIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
        <svg className="w-8 h-8 animate-spin text-indigo-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
      <p className="text-gray-600 font-medium">Generating your personalized study plan...</p>
      <p className="text-sm text-gray-400 mt-1">Analyzing your progress across all archetypes</p>
    </div>
  );
}

// =============================================================================
// SETTINGS FORM
// =============================================================================

interface StudySettings {
  weeklyHours: number;
  sessionLength: number;
  targetExamDate: string;
}

function SettingsForm({
  settings,
  onChange,
  onGenerate,
  isLoading,
}: {
  settings: StudySettings;
  onChange: (settings: StudySettings) => void;
  onGenerate: () => void;
  isLoading: boolean;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <CalendarIcon className="w-5 h-5 text-indigo-500" />
        Study Preferences
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Weekly Study Hours
          </label>
          <select
            value={settings.weeklyHours}
            onChange={(e) => onChange({ ...settings, weeklyHours: parseInt(e.target.value) })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value={3}>3 hours/week</option>
            <option value={5}>5 hours/week</option>
            <option value={7}>7 hours/week</option>
            <option value={10}>10 hours/week</option>
            <option value={14}>14 hours/week</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Session Length
          </label>
          <select
            value={settings.sessionLength}
            onChange={(e) => onChange({ ...settings, sessionLength: parseInt(e.target.value) })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value={15}>15 minutes</option>
            <option value={20}>20 minutes</option>
            <option value={30}>30 minutes</option>
            <option value={45}>45 minutes</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Target Exam Date (Optional)
          </label>
          <input
            type="date"
            value={settings.targetExamDate}
            onChange={(e) => onChange({ ...settings, targetExamDate: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
      </div>

      <button
        onClick={onGenerate}
        disabled={isLoading}
        className="w-full bg-indigo-600 text-white rounded-lg py-2.5 font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Generating Plan...
          </>
        ) : (
          <>
            <SparklesIcon className="w-5 h-5" />
            Generate AI Study Plan
          </>
        )}
      </button>
    </div>
  );
}

// =============================================================================
// PRIORITY ARCHETYPE CARD
// =============================================================================

function PriorityArchetypeCard({
  priority,
  index,
  onPractice,
}: {
  priority: PriorityArchetype;
  index: number;
  onPractice: (archetypeId: ArchetypeId) => void;
}) {
  const catalog = ARCHETYPE_CATALOG[priority.archetypeId];

  const priorityColors = [
    { bg: 'bg-red-50', border: 'border-red-200', badge: 'bg-red-500', text: 'text-red-800' },
    { bg: 'bg-orange-50', border: 'border-orange-200', badge: 'bg-orange-500', text: 'text-orange-800' },
    { bg: 'bg-yellow-50', border: 'border-yellow-200', badge: 'bg-yellow-500', text: 'text-yellow-800' },
    { bg: 'bg-blue-50', border: 'border-blue-200', badge: 'bg-blue-500', text: 'text-blue-800' },
  ];

  const colors = priorityColors[Math.min(index, priorityColors.length - 1)];

  return (
    <div className={`${colors.bg} ${colors.border} border rounded-xl p-4`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`${colors.badge} text-white text-xs font-bold px-2 py-1 rounded-full`}>
            #{index + 1}
          </span>
          <h4 className={`font-semibold ${colors.text}`}>
            {catalog?.shortName || priority.archetypeId}
          </h4>
        </div>
        <div className="flex items-center gap-1 text-gray-500">
          <ClockIcon className="w-4 h-4" />
          <span className="text-sm">{priority.suggestedTimeMinutes} min</span>
        </div>
      </div>

      <p className="text-sm text-gray-600 mb-3">
        {priority.reason}
      </p>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2">
          <TargetIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <span className="text-xs text-gray-600">
            <span className="font-medium">Focus:</span> {priority.specificFocus}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircleIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <span className="text-xs text-gray-600">
            <span className="font-medium">Goal:</span> {priority.targetMilestone}
          </span>
        </div>
      </div>

      <button
        onClick={() => onPractice(priority.archetypeId)}
        className="w-full bg-white text-indigo-600 border border-indigo-200 rounded-lg py-2 text-sm font-medium hover:bg-indigo-50 transition-colors"
      >
        Start Practice
      </button>
    </div>
  );
}

// =============================================================================
// WEEKLY SCHEDULE DISPLAY
// =============================================================================

function WeeklySchedule({
  schedule,
}: {
  schedule: Record<string, { archetype: ArchetypeId; duration: number; focus: string }>;
}) {
  const dayLabels: Record<string, string> = {
    day1: 'Monday',
    day2: 'Tuesday',
    day3: 'Wednesday',
    day4: 'Thursday',
    day5: 'Friday',
    day6: 'Saturday',
    day7: 'Sunday',
  };

  const dayColors: Record<string, string> = {
    day1: 'bg-blue-100 text-blue-800',
    day2: 'bg-green-100 text-green-800',
    day3: 'bg-purple-100 text-purple-800',
    day4: 'bg-orange-100 text-orange-800',
    day5: 'bg-pink-100 text-pink-800',
    day6: 'bg-teal-100 text-teal-800',
    day7: 'bg-indigo-100 text-indigo-800',
  };

  const entries = Object.entries(schedule);
  if (entries.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <CalendarIcon className="w-5 h-5 text-indigo-500" />
        Weekly Schedule
      </h3>

      <div className="space-y-3">
        {entries.map(([day, session]) => {
          const catalog = ARCHETYPE_CATALOG[session.archetype];
          return (
            <div key={day} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className={`px-3 py-1 rounded-lg text-sm font-medium ${dayColors[day] || 'bg-gray-100 text-gray-800'}`}>
                {dayLabels[day] || day}
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-800 text-sm">
                  {catalog?.shortName || session.archetype}
                </div>
                <div className="text-xs text-gray-500">{session.focus}</div>
              </div>
              <div className="flex items-center gap-1 text-gray-500">
                <ClockIcon className="w-4 h-4" />
                <span className="text-sm">{session.duration}m</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// =============================================================================
// WEEKLY GOALS DISPLAY
// =============================================================================

function WeeklyGoals({ goals }: { goals: string[] }) {
  if (!goals || goals.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <TargetIcon className="w-5 h-5 text-green-500" />
        This Week's Goals
      </h3>

      <ul className="space-y-2">
        {goals.map((goal, index) => (
          <li key={index} className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-sm font-medium">
              {index + 1}
            </div>
            <span className="text-gray-700 text-sm pt-0.5">{goal}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// =============================================================================
// MAINTENANCE ARCHETYPES
// =============================================================================

function MaintenanceArchetypes({
  archetypes,
  onPractice,
}: {
  archetypes: ArchetypeId[];
  onPractice: (archetypeId: ArchetypeId) => void;
}) {
  if (!archetypes || archetypes.length === 0) return null;

  return (
    <div className="bg-green-50 border border-green-200 rounded-xl p-6">
      <h3 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
        <CheckCircleIcon className="w-5 h-5" />
        Strong Areas (Keep Fresh)
      </h3>
      <p className="text-sm text-green-700 mb-4">
        You're doing great in these areas! Just do a quick review occasionally to maintain mastery.
      </p>
      <div className="flex flex-wrap gap-2">
        {archetypes.map((archetypeId) => {
          const catalog = ARCHETYPE_CATALOG[archetypeId];
          return (
            <button
              key={archetypeId}
              onClick={() => onPractice(archetypeId)}
              className="px-3 py-1.5 bg-white border border-green-200 rounded-full text-sm text-green-700 hover:bg-green-100 transition-colors"
            >
              {catalog?.shortName || archetypeId}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// =============================================================================
// PROGRESS OVERVIEW
// =============================================================================

function ProgressOverview({
  progress,
}: {
  progress: Record<ArchetypeId, ArchetypeProgress>;
}) {
  const totalArchetypes = Object.keys(ARCHETYPE_CATALOG).length;
  const attemptedArchetypes = Object.keys(progress).length;

  // Calculate overall stats
  let totalQuestions = 0;
  let totalCorrect = 0;
  let masterySum = 0;

  Object.values(progress).forEach(p => {
    totalQuestions += p.questionsAttempted;
    totalCorrect += p.questionsCorrect;
    masterySum += p.masteryLevel;
  });

  const overallAccuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
  const averageMastery = attemptedArchetypes > 0 ? (masterySum / attemptedArchetypes).toFixed(1) : '0';
  const coveragePercent = Math.round((attemptedArchetypes / totalArchetypes) * 100);

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <ChartBarIcon className="w-5 h-5 text-indigo-500" />
        Your Progress Overview
      </h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{attemptedArchetypes}/{totalArchetypes}</div>
          <div className="text-xs text-blue-700">Archetypes Practiced</div>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{overallAccuracy}%</div>
          <div className="text-xs text-green-700">Overall Accuracy</div>
        </div>
        <div className="text-center p-3 bg-purple-50 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">{averageMastery}</div>
          <div className="text-xs text-purple-700">Avg Mastery Level</div>
        </div>
        <div className="text-center p-3 bg-orange-50 rounded-lg">
          <div className="text-2xl font-bold text-orange-600">{totalQuestions}</div>
          <div className="text-xs text-orange-700">Questions Completed</div>
        </div>
      </div>

      {/* Coverage bar */}
      <div className="mt-4">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Topic Coverage</span>
          <span>{coveragePercent}%</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-500 rounded-full transition-all duration-500"
            style={{ width: `${coveragePercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

interface StudyPlanDashboardProps {
  onNavigateToArchetype?: (archetypeId: ArchetypeId) => void;
}

export function StudyPlanDashboard({ onNavigateToArchetype }: StudyPlanDashboardProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [progress, setProgress] = useState<Record<ArchetypeId, ArchetypeProgress>>({} as Record<ArchetypeId, ArchetypeProgress>);
  const [studyPlan, setStudyPlan] = useState<StudyPlanResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<StudySettings>({
    weeklyHours: 5,
    sessionLength: 20,
    targetExamDate: '',
  });

  // Load progress on mount
  useEffect(() => {
    async function loadProgress() {
      try {
        const allProgress = await getAllArchetypeProgress(user?.uid || null);
        setProgress(allProgress);
      } catch (err) {
        console.error('Failed to load progress:', err);
      } finally {
        setIsInitialLoading(false);
      }
    }
    loadProgress();
  }, [user?.uid]);

  // Generate study plan
  const generateStudyPlan = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Convert progress to format expected by API
      const progressArray = Object.values(progress).map(p => ({
        archetypeId: p.archetypeId,
        archetypeName: ARCHETYPE_CATALOG[p.archetypeId]?.name || p.archetypeId,
        masteryLevel: p.masteryLevel,
        questionsAttempted: p.questionsAttempted,
        accuracy: p.questionsAttempted > 0
          ? Math.round((p.questionsCorrect / p.questionsAttempted) * 100)
          : 0,
        lastPracticed: p.lastPracticed instanceof Date
          ? p.lastPracticed.toISOString()
          : new Date(p.lastPracticed).toISOString(),
        commonErrors: Object.keys(p.errorFrequency || {}).slice(0, 3) as import('@/types/nsw-selective').DistractorType[],
      }));

      // Add archetypes with no progress yet
      Object.keys(ARCHETYPE_CATALOG).forEach(archetypeId => {
        if (!progressArray.find(p => p.archetypeId === archetypeId)) {
          progressArray.push({
            archetypeId: archetypeId as ArchetypeId,
            archetypeName: ARCHETYPE_CATALOG[archetypeId as ArchetypeId].name,
            masteryLevel: 1, // Minimum level (not started)
            questionsAttempted: 0,
            accuracy: 0,
            lastPracticed: new Date().toISOString(),
            commonErrors: [],
          });
        }
      });

      const result = await getAIStudyPlan({
        userId: user?.uid || 'anonymous',
        targetExamDate: settings.targetExamDate || undefined,
        weeklyAvailableHours: settings.weeklyHours,
        preferredSessionLength: settings.sessionLength,
        progressAcrossArchetypes: progressArray,
      });

      if (result.success) {
        setStudyPlan(result);
      } else {
        setError(result.error || 'Failed to generate study plan');
      }
    } catch (err) {
      console.error('Study plan generation failed:', err);
      setError('Could not connect to AI service. Please try again.');
    }

    setIsLoading(false);
  }, [progress, settings, user?.uid]);

  const handlePractice = (archetypeId: ArchetypeId) => {
    if (onNavigateToArchetype) {
      onNavigateToArchetype(archetypeId);
    } else {
      // Fallback: navigate via URL
      window.location.href = `/nsw-selective/practice/${archetypeId}`;
    }
  };

  if (isInitialLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-48 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <SparklesIcon className="w-7 h-7 text-indigo-500" />
            AI Study Planner
          </h1>
          <p className="text-gray-500 mt-1">
            Get a personalized plan based on your progress and goals
          </p>
        </div>
        {studyPlan && (
          <button
            onClick={generateStudyPlan}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
          >
            <RefreshIcon className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Plan
          </button>
        )}
      </div>

      {/* Progress Overview */}
      <ProgressOverview progress={progress} />

      {/* Settings & Generate */}
      <SettingsForm
        settings={settings}
        onChange={setSettings}
        onGenerate={generateStudyPlan}
        isLoading={isLoading}
      />

      {/* Loading State */}
      {isLoading && <LoadingSpinner />}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
          <p className="text-red-700">{error}</p>
          <button
            onClick={generateStudyPlan}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Study Plan Results */}
      {studyPlan && !isLoading && (
        <>
          {/* Overall Strategy */}
          {studyPlan.overallStrategy && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-6">
              <h3 className="font-semibold text-indigo-800 mb-2 flex items-center gap-2">
                <SparklesIcon className="w-5 h-5" />
                Your Strategy
              </h3>
              <p className="text-indigo-700">{studyPlan.overallStrategy}</p>
            </div>
          )}

          {/* Motivational Message */}
          {studyPlan.motivationalMessage && (
            <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl p-6 text-white">
              <p className="text-lg font-medium">{studyPlan.motivationalMessage}</p>
            </div>
          )}

          {/* Priority Archetypes */}
          {studyPlan.priorityArchetypes && studyPlan.priorityArchetypes.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <TargetIcon className="w-5 h-5 text-red-500" />
                Focus Areas (Priority Order)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {studyPlan.priorityArchetypes.map((priority, index) => (
                  <PriorityArchetypeCard
                    key={priority.archetypeId}
                    priority={priority}
                    index={index}
                    onPractice={handlePractice}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Weekly Schedule */}
          {studyPlan.weeklySchedule && (
            <WeeklySchedule schedule={studyPlan.weeklySchedule} />
          )}

          {/* Weekly Goals */}
          {studyPlan.weeklyGoals && (
            <WeeklyGoals goals={studyPlan.weeklyGoals} />
          )}

          {/* Maintenance Archetypes */}
          {studyPlan.maintenanceArchetypes && (
            <MaintenanceArchetypes
              archetypes={studyPlan.maintenanceArchetypes}
              onPractice={handlePractice}
            />
          )}
        </>
      )}

      {/* Empty State - No Plan Yet */}
      {!studyPlan && !isLoading && !error && (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <SparklesIcon className="w-8 h-8 text-indigo-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            Ready to create your study plan?
          </h3>
          <p className="text-gray-500 mb-4 max-w-md mx-auto">
            Set your preferences above and click "Generate AI Study Plan" to get a personalized
            learning path based on your progress.
          </p>
        </div>
      )}
    </div>
  );
}

export default StudyPlanDashboard;

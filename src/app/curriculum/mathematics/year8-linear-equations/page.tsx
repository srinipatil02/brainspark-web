'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAllSetsProgress } from '@/hooks/useSetProgress';

// Linear Equations question sets - 12 sets across 4 phases
const difficultyLevels = [
  {
    id: 'foundation',
    name: 'Foundation',
    description: 'Build core technique and confidence',
    color: 'indigo',
    icon: '🌱',
    sets: [
      {
        setNumber: 1,
        id: 'year8-linear-equations-set1',
        title: 'One-Step Equations (+/-)',
        subtitle: 'Addition and subtraction equations',
        icon: '➕',
        questions: 10,
        topics: ['x + a = b', 'x - a = b', 'Inverse operations'],
        phase: 'Foundation',
      },
      {
        setNumber: 2,
        id: 'year8-linear-equations-set2',
        title: 'One-Step Equations (×/÷)',
        subtitle: 'Multiplication and division equations',
        icon: '✖️',
        questions: 10,
        topics: ['ax = b', 'x/a = b', 'Inverse operations'],
        phase: 'Foundation',
      },
      {
        setNumber: 3,
        id: 'year8-linear-equations-set3',
        title: 'Mixed One-Step',
        subtitle: 'All four operations combined',
        icon: '🔄',
        questions: 10,
        topics: ['Mixed operations', 'Different variables', 'Intro two-step'],
        phase: 'Foundation',
      },
    ],
  },
  {
    id: 'application',
    name: 'Application',
    description: 'Apply skills to varied problems',
    color: 'blue',
    icon: '🔧',
    sets: [
      {
        setNumber: 4,
        id: 'year8-linear-equations-set4',
        title: 'Two-Step Equations',
        subtitle: 'Varied coefficients and constants',
        icon: '2️⃣',
        questions: 10,
        topics: ['ax + b = c', 'ax - b = c', 'Order of operations'],
        phase: 'Application',
      },
      {
        setNumber: 5,
        id: 'year8-linear-equations-set5',
        title: 'Negative Constants',
        subtitle: 'Two-step with negative numbers',
        icon: '➖',
        questions: 10,
        topics: ['Negative constants', 'Sign errors', 'Checking solutions'],
        phase: 'Application',
      },
      {
        setNumber: 6,
        id: 'year8-linear-equations-set6',
        title: 'Real-World Context',
        subtitle: 'Word problems and applications',
        icon: '🌍',
        questions: 10,
        topics: ['Cost problems', 'Distance/rate', 'Setting up equations'],
        phase: 'Application',
      },
    ],
  },
  {
    id: 'connection',
    name: 'Connection',
    description: 'Connect concepts and methods',
    color: 'purple',
    icon: '🔗',
    sets: [
      {
        setNumber: 7,
        id: 'year8-linear-equations-set7',
        title: 'Equations with Brackets',
        subtitle: 'Distributive law and expansion',
        icon: '📦',
        questions: 10,
        topics: ['a(x + b) = c', 'Expanding brackets', 'Distributive law'],
        phase: 'Connection',
      },
      {
        setNumber: 8,
        id: 'year8-linear-equations-set8',
        title: 'Equations with Fractions',
        subtitle: 'Fractional coefficients',
        icon: '🔢',
        questions: 10,
        topics: ['x/a + b = c', 'Clearing fractions', 'Common denominators'],
        phase: 'Connection',
      },
      {
        setNumber: 9,
        id: 'year8-linear-equations-set9',
        title: 'Combined Techniques',
        subtitle: 'Brackets and fractions together',
        icon: '🎯',
        questions: 10,
        topics: ['Mixed techniques', 'Multiple steps', 'Strategy choice'],
        phase: 'Connection',
      },
    ],
  },
  {
    id: 'mastery',
    name: 'Mastery',
    description: 'Master complex problems',
    color: 'amber',
    icon: '🏆',
    sets: [
      {
        setNumber: 10,
        id: 'year8-linear-equations-set10',
        title: 'Variables Both Sides',
        subtitle: 'Collecting like terms',
        icon: '⚖️',
        questions: 10,
        topics: ['ax + b = cx + d', 'Collecting terms', 'Rearranging'],
        phase: 'Mastery',
      },
      {
        setNumber: 11,
        id: 'year8-linear-equations-set11',
        title: 'Complex Multi-Step',
        subtitle: 'Advanced equation solving',
        icon: '🧩',
        questions: 10,
        topics: ['Nested brackets', 'Multiple fractions', 'Strategic solving'],
        phase: 'Mastery',
      },
      {
        setNumber: 12,
        id: 'year8-linear-equations-set12',
        title: 'Word Problems',
        subtitle: 'Real-world mastery challenges',
        icon: '📝',
        questions: 10,
        topics: ['Age problems', 'Geometry', 'Number puzzles'],
        phase: 'Mastery',
      },
    ],
  },
];

// Color utility
function getColorClasses(color: string) {
  const colors: Record<string, { bg: string; bgLight: string; text: string; border: string; progress: string }> = {
    indigo: {
      bg: 'bg-indigo-500',
      bgLight: 'bg-indigo-50',
      text: 'text-indigo-600',
      border: 'border-indigo-200',
      progress: 'stroke-indigo-500',
    },
    purple: {
      bg: 'bg-purple-500',
      bgLight: 'bg-purple-50',
      text: 'text-purple-600',
      border: 'border-purple-200',
      progress: 'stroke-purple-500',
    },
    blue: {
      bg: 'bg-blue-500',
      bgLight: 'bg-blue-50',
      text: 'text-blue-600',
      border: 'border-blue-200',
      progress: 'stroke-blue-500',
    },
    amber: {
      bg: 'bg-amber-500',
      bgLight: 'bg-amber-50',
      text: 'text-amber-600',
      border: 'border-amber-200',
      progress: 'stroke-amber-500',
    },
  };
  return colors[color] || colors.indigo;
}

// Circular progress component
function CircularProgress({ percent, size = 64, strokeWidth = 6, color = 'indigo' }: {
  percent: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percent / 100) * circumference;
  const colorClass = getColorClasses(color);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-gray-200"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          className={colorClass.progress}
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: offset,
            transition: 'stroke-dashoffset 0.5s ease-out',
          }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold text-gray-700">{percent}%</span>
      </div>
    </div>
  );
}

export default function Year8LinearEquationsPage() {
  const { getCompletedCount } = useAllSetsProgress();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Calculate total progress across ALL phases
  const allSets = difficultyLevels.flatMap(level => level.sets);
  const totalCompleted = allSets.reduce(
    (sum, set) => sum + getCompletedCount(set.id),
    0
  );
  const totalQuestions = allSets.reduce((sum, set) => sum + set.questions, 0);
  const overallProgress = Math.round((totalCompleted / totalQuestions) * 100);
  const completedSets = allSets.filter(
    set => getCompletedCount(set.id) === set.questions
  ).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/curriculum" className="text-indigo-600 hover:text-indigo-700 text-sm flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Curriculum
              </Link>
              <h1 className="text-2xl font-bold text-gray-800 mt-1">
                Year 8 Mathematics: Linear Equations
              </h1>
              <p className="text-gray-500 text-sm">
                ACARA ACMNA194 • {totalQuestions} questions • WORKED_SOLUTION format
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Overall Progress Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-indigo-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">📐</span>
                <h2 className="text-lg font-semibold text-gray-800">Overall Progress</h2>
              </div>
              <p className="text-gray-500 text-sm mt-1">
                {mounted ? `${totalCompleted} of ${totalQuestions} questions completed` : 'Loading...'}
              </p>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-indigo-600">{mounted ? completedSets : 0}</div>
                <div className="text-xs text-gray-500 uppercase tracking-wide">Sets Done</div>
              </div>
              {mounted && <CircularProgress percent={overallProgress} size={72} strokeWidth={8} color="indigo" />}
            </div>
          </div>

          <div className="mt-4">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 transition-all duration-500"
                style={{ width: mounted ? `${overallProgress}%` : '0%' }}
              />
            </div>
          </div>
        </div>

        {/* Learning Path Info */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <span className="text-xl">🎯</span>
            <div>
              <h3 className="font-semibold text-indigo-800">Learning Path: 4 Phases, 12 Sets</h3>
              <p className="text-sm text-indigo-700 mt-1">
                Progress from Foundation → Application → Connection → Mastery.
                Each set has 10 WORKED_SOLUTION questions with step-by-step AI grading.
              </p>
            </div>
          </div>
        </div>

        {/* Phase Sections */}
        {difficultyLevels.map((level) => {
          const levelColorClasses = getColorClasses(level.color);
          const levelCompleted = level.sets.reduce((sum, set) => sum + getCompletedCount(set.id), 0);
          const levelTotal = level.sets.reduce((sum, set) => sum + set.questions, 0);
          const levelPercent = Math.round((levelCompleted / levelTotal) * 100);

          return (
            <div key={level.id} className="mb-8">
              {/* Phase Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{level.icon}</span>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800">{level.name}</h2>
                    <p className="text-sm text-gray-500">{level.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${levelColorClasses.text}`}>
                    {mounted ? `${levelCompleted}/${levelTotal}` : '...'}
                  </span>
                  {mounted && <CircularProgress percent={levelPercent} size={40} strokeWidth={4} color={level.color} />}
                </div>
              </div>

              {/* Sets Grid */}
              <div className="grid gap-4 md:grid-cols-3">
                {level.sets.map((set) => {
                  const completed = mounted ? getCompletedCount(set.id) : 0;
                  const percent = Math.round((completed / set.questions) * 100);
                  const isComplete = completed === set.questions;
                  const colorClasses = getColorClasses(level.color);

                  return (
                    <Link
                      key={set.id}
                      href={`/curriculum/mathematics/year8-linear-equations/set/${set.setNumber}`}
                      className="group"
                    >
                      <div className={`
                        bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300
                        border-2 ${isComplete ? colorClasses.border : 'border-transparent'}
                        hover:scale-[1.02] overflow-hidden h-full
                      `}>
                        <div className={`h-1 ${colorClasses.bg}`} />

                        <div className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <div className={`w-10 h-10 ${colorClasses.bgLight} rounded-lg flex items-center justify-center text-xl`}>
                                {set.icon}
                              </div>
                              <div>
                                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                                  Set {set.setNumber}
                                </span>
                                <h3 className="text-sm font-semibold text-gray-800 group-hover:text-gray-900">
                                  {set.title}
                                </h3>
                              </div>
                            </div>

                            {isComplete && (
                              <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                                ✓
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-gray-500 mt-2">{set.subtitle}</p>

                          <div className="mt-3 flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${colorClasses.bg} transition-all duration-500`}
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium text-gray-500">
                              {completed}/{set.questions}
                            </span>
                          </div>

                          <div className="mt-3 flex items-center justify-between">
                            <span className="text-xs text-gray-400">
                              ~{Math.ceil((set.questions - completed) * 2)} min
                            </span>
                            <span className={`text-xs font-medium ${colorClasses.text} group-hover:underline flex items-center gap-1`}>
                              {completed === 0 ? 'Start' : isComplete ? 'Review' : 'Continue'}
                              <svg className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Quick Stats */}
        <div className="mt-8 grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-4 shadow text-center border border-gray-100">
            <div className="text-3xl font-bold text-indigo-600">{totalQuestions}</div>
            <div className="text-sm text-gray-500">Total Questions</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow text-center border border-gray-100">
            <div className="text-3xl font-bold text-amber-600">~{Math.round(totalQuestions * 2)}</div>
            <div className="text-sm text-gray-500">Total Minutes</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow text-center border border-gray-100">
            <div className="text-3xl font-bold text-purple-600">{allSets.length}</div>
            <div className="text-sm text-gray-500">Question Sets</div>
          </div>
        </div>

        {/* Curriculum Info */}
        <div className="mt-8 bg-gray-50 rounded-xl p-4 border border-gray-200">
          <h3 className="font-semibold text-gray-700 mb-2">ACARA Curriculum Alignment</h3>
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm">
              ACMNA194 - Solve linear equations
            </span>
          </div>
          <p className="mt-3 text-sm text-gray-600">
            Solve linear equations using algebraic and graphical techniques. Verify solutions by substitution.
            Progress from one-step to multi-step equations with variables on both sides.
          </p>
        </div>
      </main>
    </div>
  );
}

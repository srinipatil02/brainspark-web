'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAllSetsProgress } from '@/hooks/useSetProgress';

interface CircularProgressProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
}

function CircularProgress({ progress, size = 60, strokeWidth = 4 }: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
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
        stroke="currentColor"
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="text-indigo-600 transition-all duration-500"
        strokeLinecap="round"
      />
      <text
        x="50%"
        y="50%"
        dy=".3em"
        textAnchor="middle"
        className="text-sm font-bold fill-gray-800 transform rotate-90"
        style={{ transformOrigin: 'center' }}
      >
        {progress}%
      </text>
    </svg>
  );
}

export default function ElementsCompoundsTopicPage() {
  const [selectedDifficulty, setSelectedDifficulty] = useState<'medium'>('medium');

  // Hook to track progress across all 13 sets (8 Learning Arc + 5 Classic)
  const mediumSetIds = [
    'year8-elements-compounds-mixtures-set1',
    'year8-elements-compounds-mixtures-set2',
    'year8-elements-compounds-mixtures-set3',
    'year8-elements-compounds-mixtures-set4',
    'year8-elements-compounds-mixtures-set5',
    'year8-elements-compounds-mixtures-set6',
    'year8-elements-compounds-mixtures-set7',
    'year8-elements-compounds-mixtures-set8',
    'year8-elements-compounds-mixtures-set9',
    'year8-elements-compounds-mixtures-set10',
    'year8-elements-compounds-mixtures-set11',
    'year8-elements-compounds-mixtures-set12',
    'year8-elements-compounds-mixtures-set13',
  ];

  const { allProgress, isLoaded, getCompletedCount } = useAllSetsProgress();

  // Calculate progress for medium sets
  const mediumProgress = mediumSetIds.map(setId => ({
    setId,
    completed: getCompletedCount(setId),
    total: 10,
  }));

  const totalCompleted = mediumProgress.reduce((sum, set) => sum + set.completed, 0);
  const totalQuestions = mediumProgress.length * 10;
  const mediumOverallProgress = Math.round((totalCompleted / totalQuestions) * 100);

  const sets = [
    // Phase 1: Foundation (Sets 1-2)
    {
      number: 1,
      title: 'Pure Substances & Mixtures',
      topics: ['Matter classification', 'Pure substances', 'Mixtures', 'Particle basics'],
      icon: '🔬',
      color: 'indigo',
      phase: 'Foundation',
    },
    {
      number: 2,
      title: 'Elements & Compounds Intro',
      topics: ['Elements', 'Compounds', 'Atoms', 'Molecules'],
      icon: '⚛️',
      color: 'indigo',
      phase: 'Foundation',
    },
    // Phase 2: Application (Sets 3-4)
    {
      number: 3,
      title: 'Symbols & Formulas',
      topics: ['Chemical symbols', 'Periodic table', 'Molecular formulas', 'Subscripts'],
      icon: '📊',
      color: 'violet',
      phase: 'Application',
    },
    {
      number: 4,
      title: 'Real-World Applications',
      topics: ['Gold karats', 'Steel vs iron', 'Air as mixture', 'Compound properties'],
      icon: '🌍',
      color: 'violet',
      phase: 'Application',
    },
    // Phase 3: Connection (Sets 5-6)
    {
      number: 5,
      title: 'Misconception Challenges',
      topics: ['Diatomic elements', 'O₂ confusion', 'Solutions vs compounds', 'Particle diagrams'],
      icon: '🧪',
      color: 'purple',
      phase: 'Connection',
    },
    {
      number: 6,
      title: 'Deep Connections',
      topics: ['Homogeneous mixtures', 'Property changes', 'Alloys', 'Chemical bonding'],
      icon: '🔗',
      color: 'purple',
      phase: 'Connection',
    },
    // Phase 4: Mastery (Sets 7-8)
    {
      number: 7,
      title: 'Synthesis & Prediction',
      topics: ['Separation methods', 'Compound vs mixture', 'Multi-step reasoning', 'Evidence analysis'],
      icon: '🎯',
      color: 'fuchsia',
      phase: 'Mastery',
    },
    {
      number: 8,
      title: 'Mastery Challenge',
      topics: ['Complex scenarios', 'Diamond vs graphite', 'Real-world synthesis', 'Advanced problems'],
      icon: '🏆',
      color: 'fuchsia',
      phase: 'Mastery',
    },
    // Classic Sets (Sets 9-13) - Original questions
    {
      number: 9,
      title: 'Classic: Atomic Structure',
      topics: ['Atoms', 'Subatomic particles', 'Electron shells', 'Bohr model'],
      icon: '📚',
      color: 'slate',
      phase: 'Classic',
    },
    {
      number: 10,
      title: 'Classic: Periodic Table',
      topics: ['Groups', 'Periods', 'Metals', 'Non-metals'],
      icon: '📚',
      color: 'slate',
      phase: 'Classic',
    },
    {
      number: 11,
      title: 'Classic: Compounds & Bonding',
      topics: ['Chemical bonds', 'Ionic compounds', 'Covalent bonds', 'Formulas'],
      icon: '📚',
      color: 'slate',
      phase: 'Classic',
    },
    {
      number: 12,
      title: 'Classic: Mixtures & Separation',
      topics: ['Solutions', 'Suspensions', 'Filtration', 'Distillation'],
      icon: '📚',
      color: 'slate',
      phase: 'Classic',
    },
    {
      number: 13,
      title: 'Classic: Applied Chemistry',
      topics: ['Everyday compounds', 'Chemical reactions', 'Conservation of mass', 'Applications'],
      icon: '📚',
      color: 'slate',
      phase: 'Classic',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-sm shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/curriculum" className="text-indigo-600 hover:text-indigo-700">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-2xl">
                  ⚛️
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Elements & Compounds</h1>
                  <p className="text-gray-600 text-sm">NSW Year 8 Science • ACSSU152</p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Overall Progress</div>
              <div className="text-2xl font-bold text-indigo-600">{mediumOverallProgress}%</div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Topic Overview */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-3">What You'll Learn</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-indigo-600 mt-1">✓</span>
                <p className="text-gray-700">Understand atomic structure and how elements are organized</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-indigo-600 mt-1">✓</span>
                <p className="text-gray-700">Navigate the periodic table and identify element patterns</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-indigo-600 mt-1">✓</span>
                <p className="text-gray-700">Distinguish between elements, compounds, and mixtures</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-indigo-600 mt-1">✓</span>
                <p className="text-gray-700">Write and interpret chemical formulas</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-indigo-600 mt-1">✓</span>
                <p className="text-gray-700">Recognize common compounds in everyday life</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-indigo-600 mt-1">✓</span>
                <p className="text-gray-700">Apply chemistry concepts to real-world applications</p>
              </div>
            </div>
          </div>
        </div>

        {/* Difficulty Selector */}
        <div className="mb-6">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700">Difficulty:</span>
            <button
              onClick={() => setSelectedDifficulty('medium')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedDifficulty === 'medium'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              Medium
            </button>
          </div>
        </div>

        {/* Sets Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {sets.map((set, index) => {
            const progressData = mediumProgress[index] || { completed: 0, total: 10 };
            const setProgress = Math.round((progressData.completed / progressData.total) * 100);
            const isComplete = progressData.completed === progressData.total;

            return (
              <Link
                key={set.number}
                href={`/curriculum/science/year8-elements-compounds/set/${set.number}`}
                className="block group"
              >
                <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden h-full border-2 border-transparent hover:border-indigo-200">
                  {/* Card Header */}
                  <div className={`bg-gradient-to-r from-${set.color}-500 to-${set.color}-600 p-5 text-white`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="text-4xl">{set.icon}</span>
                        <div>
                          <div className="text-sm opacity-90 font-medium">Set {set.number} of 13 • {set.phase}</div>
                          <h3 className="text-xl font-bold">{set.title}</h3>
                        </div>
                      </div>
                      {isComplete && (
                        <div className="bg-white/20 rounded-full p-2">
                          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-5">
                    <div className="mb-4">
                      <div className="text-sm font-medium text-gray-500 mb-2">Topics Covered:</div>
                      <div className="flex flex-wrap gap-2">
                        {set.topics.map((topic, idx) => (
                          <span
                            key={idx}
                            className={`px-2 py-1 bg-${set.color}-50 text-${set.color}-700 text-xs rounded-full`}
                          >
                            {topic}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Progress */}
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-600">Progress</span>
                          <span className="text-sm font-bold text-gray-900">{setProgress}%</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full bg-gradient-to-r from-${set.color}-500 to-${set.color}-600 transition-all duration-500`}
                            style={{ width: `${setProgress}%` }}
                          />
                        </div>
                        <div className="text-xs text-gray-500 mt-1">10 questions</div>
                      </div>
                      <div className="ml-4">
                        <CircularProgress progress={setProgress} size={50} strokeWidth={4} />
                      </div>
                    </div>

                    {/* Start Button */}
                    <div className="mt-4 pt-4 border-t">
                      <div className={`w-full py-2 px-4 bg-gradient-to-r from-${set.color}-500 to-${set.color}-600 text-white rounded-lg font-medium text-center group-hover:shadow-md transition-shadow`}>
                        {isComplete ? 'Review Set' : setProgress > 0 ? 'Continue' : 'Start Set'}
                        <span className="ml-2">→</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Footer Info */}
        <div className="mt-8 bg-white rounded-xl shadow p-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">About This Topic</h3>
              <p className="text-gray-600 text-sm">
                This topic covers the fundamental concepts of atoms, elements, compounds, and mixtures. You'll learn how the periodic
                table organizes elements, how to write chemical formulas, and how chemistry relates to everyday life. Each set contains
                10 carefully crafted questions with hints and detailed solutions to support your learning journey.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

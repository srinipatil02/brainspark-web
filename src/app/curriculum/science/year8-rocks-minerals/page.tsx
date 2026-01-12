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
        className="text-amber-600 transition-all duration-500"
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

// Color mapping for Tailwind classes
const getColorClasses = (color: string) => {
  const colorMap: Record<string, { bg: string; bgLight: string; text: string; gradient: string }> = {
    amber: { bg: 'bg-amber-500', bgLight: 'bg-amber-50', text: 'text-amber-700', gradient: 'from-amber-500 to-amber-600' },
    yellow: { bg: 'bg-yellow-500', bgLight: 'bg-yellow-50', text: 'text-yellow-700', gradient: 'from-yellow-500 to-yellow-600' },
    orange: { bg: 'bg-orange-500', bgLight: 'bg-orange-50', text: 'text-orange-700', gradient: 'from-orange-500 to-orange-600' },
    stone: { bg: 'bg-stone-500', bgLight: 'bg-stone-50', text: 'text-stone-700', gradient: 'from-stone-500 to-stone-600' },
    teal: { bg: 'bg-teal-500', bgLight: 'bg-teal-50', text: 'text-teal-700', gradient: 'from-teal-500 to-teal-600' },
    cyan: { bg: 'bg-cyan-500', bgLight: 'bg-cyan-50', text: 'text-cyan-700', gradient: 'from-cyan-500 to-cyan-600' },
    indigo: { bg: 'bg-indigo-500', bgLight: 'bg-indigo-50', text: 'text-indigo-700', gradient: 'from-indigo-500 to-indigo-600' },
    purple: { bg: 'bg-purple-500', bgLight: 'bg-purple-50', text: 'text-purple-700', gradient: 'from-purple-500 to-purple-600' },
    zinc: { bg: 'bg-zinc-500', bgLight: 'bg-zinc-50', text: 'text-zinc-700', gradient: 'from-zinc-500 to-zinc-600' },
    slate: { bg: 'bg-slate-500', bgLight: 'bg-slate-50', text: 'text-slate-700', gradient: 'from-slate-500 to-slate-600' },
    gray: { bg: 'bg-gray-500', bgLight: 'bg-gray-50', text: 'text-gray-700', gradient: 'from-gray-500 to-gray-600' },
    neutral: { bg: 'bg-neutral-500', bgLight: 'bg-neutral-50', text: 'text-neutral-700', gradient: 'from-neutral-500 to-neutral-600' },
  };
  return colorMap[color] || colorMap.amber;
};

export default function RocksMineralsTopicPage() {
  const [selectedDifficulty, setSelectedDifficulty] = useState<'medium'>('medium');

  // Hook to track progress across all 13 sets (8 Learning Arc + 5 Classic)
  const setIds = [
    'year8-rocks-minerals-set1',
    'year8-rocks-minerals-set2',
    'year8-rocks-minerals-set3',
    'year8-rocks-minerals-set4',
    'year8-rocks-minerals-set5',
    'year8-rocks-minerals-set6',
    'year8-rocks-minerals-set7',
    'year8-rocks-minerals-set8',
    'year8-rocks-minerals-set9',
    'year8-rocks-minerals-set10',
    'year8-rocks-minerals-set11',
    'year8-rocks-minerals-set12',
    'year8-rocks-minerals-set13',
  ];

  const { getCompletedCount } = useAllSetsProgress();

  // Calculate progress for all sets
  const setProgress = setIds.map(setId => ({
    setId,
    completed: getCompletedCount(setId),
    total: 10,
  }));

  const totalCompleted = setProgress.reduce((sum, set) => sum + set.completed, 0);
  const totalQuestions = setProgress.length * 10;
  const overallProgress = Math.round((totalCompleted / totalQuestions) * 100);

  // Learning Arc phases with sets
  const phases = [
    {
      name: 'Foundation',
      description: 'Build core knowledge of rock types and mineral properties',
      sets: [
        {
          number: 1,
          title: 'Rock Types & Formation',
          topics: ['Igneous rocks', 'Sedimentary rocks', 'Metamorphic rocks', 'Formation processes'],
          icon: '🪨',
          color: 'amber',
        },
        {
          number: 2,
          title: 'Mineral Properties',
          topics: ['Hardness', 'Lustre', 'Streak', 'Cleavage & fracture'],
          icon: '💎',
          color: 'yellow',
        },
      ],
    },
    {
      name: 'Application',
      description: 'Apply concepts to real-world geological processes',
      sets: [
        {
          number: 3,
          title: 'Rock Cycle & Processes',
          topics: ['Rock cycle', 'Weathering', 'Erosion', 'Deposition'],
          icon: '🔄',
          color: 'orange',
        },
        {
          number: 4,
          title: 'Real-World Applications',
          topics: ['Mining', 'Building materials', 'Fossil fuels', 'Sustainability'],
          icon: '⛏️',
          color: 'stone',
        },
      ],
    },
    {
      name: 'Connection',
      description: 'Connect concepts across geological systems and time',
      sets: [
        {
          number: 5,
          title: 'Cross-Concept Connections',
          topics: ['Mineral-rock relationships', 'Process interactions', 'Cause and effect'],
          icon: '🔗',
          color: 'teal',
        },
        {
          number: 6,
          title: 'Geological Time & Scale',
          topics: ['Fossils', 'Rock layers', 'Dating methods', 'Earth history'],
          icon: '🦴',
          color: 'cyan',
        },
      ],
    },
    {
      name: 'Mastery',
      description: 'Synthesize knowledge for advanced problem solving',
      sets: [
        {
          number: 7,
          title: 'Complex Analysis',
          topics: ['Rock identification', 'Process analysis', 'Evidence interpretation'],
          icon: '🔬',
          color: 'indigo',
        },
        {
          number: 8,
          title: 'Mastery Challenge',
          topics: ['Synthesis', 'Critical analysis', 'Real-world scenarios', 'Scientific reasoning'],
          icon: '🏆',
          color: 'purple',
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-sm shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/curriculum" className="text-amber-600 hover:text-amber-700">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center text-2xl">
                  🪨
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Rocks & Minerals</h1>
                  <p className="text-gray-600 text-sm">NSW Year 8 Science - ACSSU153</p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Overall Progress</div>
              <div className="text-2xl font-bold text-amber-600">{overallProgress}%</div>
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
                <span className="text-amber-600 mt-1">~</span>
                <p className="text-gray-700">Identify and classify different types of rocks</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-amber-600 mt-1">~</span>
                <p className="text-gray-700">Understand the rock cycle and Earth processes</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-amber-600 mt-1">~</span>
                <p className="text-gray-700">Test and identify mineral properties</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-amber-600 mt-1">~</span>
                <p className="text-gray-700">Explore weathering, erosion, and deposition</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-amber-600 mt-1">~</span>
                <p className="text-gray-700">Learn about geological resources and sustainability</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-amber-600 mt-1">~</span>
                <p className="text-gray-700">Understand geological time and fossil evidence</p>
              </div>
            </div>
          </div>
        </div>

        {/* Learning Arc Info */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl shadow-lg p-6 mb-8 text-white">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-3xl">🎯</span>
            <h2 className="text-xl font-bold">Learning Arc - 80 Questions + 50 Classic</h2>
          </div>
          <p className="text-amber-100 mb-4">
            Progress through 4 phases designed to build deep understanding, plus 5 Classic practice sets.
          </p>
          <div className="grid grid-cols-4 gap-2 text-center text-sm">
            <div className="bg-white/20 rounded-lg p-2">
              <div className="font-bold">Phase 1</div>
              <div className="text-amber-100">Foundation</div>
            </div>
            <div className="bg-white/20 rounded-lg p-2">
              <div className="font-bold">Phase 2</div>
              <div className="text-amber-100">Application</div>
            </div>
            <div className="bg-white/20 rounded-lg p-2">
              <div className="font-bold">Phase 3</div>
              <div className="text-amber-100">Connection</div>
            </div>
            <div className="bg-white/20 rounded-lg p-2">
              <div className="font-bold">Phase 4</div>
              <div className="text-amber-100">Mastery</div>
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
                  ? 'bg-amber-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              Standard
            </button>
          </div>
        </div>

        {/* Sets by Phase */}
        {phases.map((phase, phaseIndex) => (
          <div key={phase.name} className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center font-bold text-amber-700">
                {phaseIndex + 1}
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">{phase.name}</h3>
                <p className="text-sm text-gray-600">{phase.description}</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {phase.sets.map((set) => {
                const progressData = setProgress[set.number - 1] || { completed: 0, total: 10 };
                const setProgressPercent = Math.round((progressData.completed / progressData.total) * 100);
                const isComplete = progressData.completed === progressData.total;
                const colors = getColorClasses(set.color);

                return (
                  <Link
                    key={set.number}
                    href={`/curriculum/science/year8-rocks-minerals/set/${set.number}`}
                    className="block group"
                  >
                    <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden h-full border-2 border-transparent hover:border-amber-200">
                      {/* Card Header */}
                      <div className={`bg-gradient-to-r ${colors.gradient} p-5 text-white`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <span className="text-4xl">{set.icon}</span>
                            <div>
                              <div className="text-sm opacity-90 font-medium">Set {set.number} of 8</div>
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
                                className={`px-2 py-1 ${colors.bgLight} ${colors.text} text-xs rounded-full`}
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
                              <span className="text-sm font-bold text-gray-900">{setProgressPercent}%</span>
                            </div>
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full bg-gradient-to-r ${colors.gradient} transition-all duration-500`}
                                style={{ width: `${setProgressPercent}%` }}
                              />
                            </div>
                            <div className="text-xs text-gray-500 mt-1">10 questions</div>
                          </div>
                          <div className="ml-4">
                            <CircularProgress progress={setProgressPercent} size={50} strokeWidth={4} />
                          </div>
                        </div>

                        {/* Start Button */}
                        <div className="mt-4 pt-4 border-t">
                          <div className={`w-full py-2 px-4 bg-gradient-to-r ${colors.gradient} text-white rounded-lg font-medium text-center group-hover:shadow-md transition-shadow`}>
                            {isComplete ? 'Review Set' : setProgressPercent > 0 ? 'Continue' : 'Start Set'}
                            <span className="ml-2">-&gt;</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        {/* Classic Sets Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
              <span className="text-lg">📚</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Classic Practice Sets</h3>
              <p className="text-sm text-gray-600">Additional practice with varied question formats (50 questions)</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { number: 9, title: 'Classic: Rock Foundations', topics: ['Rock types', 'Formation', 'Identification'], icon: '📚', color: 'slate' },
              { number: 10, title: 'Classic: Mineral Basics', topics: ['Mineral properties', 'Testing', 'Classification'], icon: '📖', color: 'gray' },
              { number: 11, title: 'Classic: Earth Processes', topics: ['Weathering', 'Erosion', 'Rock cycle'], icon: '🌏', color: 'zinc' },
              { number: 12, title: 'Classic: Resources', topics: ['Mining', 'Sustainability', 'Uses'], icon: '💰', color: 'neutral' },
              { number: 13, title: 'Classic: Geology Mastery', topics: ['Fossils', 'Time', 'Advanced concepts'], icon: '🎓', color: 'stone' },
            ].map((set) => {
              const progressData = setProgress[set.number - 1] || { completed: 0, total: 10 };
              const setProgressPercent = Math.round((progressData.completed / progressData.total) * 100);
              const isComplete = progressData.completed === progressData.total;
              const colors = getColorClasses(set.color);

              return (
                <Link
                  key={set.number}
                  href={`/curriculum/science/year8-rocks-minerals/set/${set.number}`}
                  className="block group"
                >
                  <div className="bg-white rounded-xl shadow hover:shadow-lg transition-all duration-300 overflow-hidden h-full border border-gray-200 hover:border-slate-300">
                    <div className={`bg-gradient-to-r ${colors.gradient} p-4 text-white`}>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{set.icon}</span>
                        <div>
                          <div className="text-xs opacity-90">Set {set.number}</div>
                          <h4 className="font-bold text-sm">{set.title}</h4>
                        </div>
                        {isComplete && (
                          <svg className="w-5 h-5 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <div className="p-3">
                      <div className="flex flex-wrap gap-1 mb-2">
                        {set.topics.map((topic, idx) => (
                          <span key={idx} className={`px-2 py-0.5 ${colors.bgLight} ${colors.text} text-xs rounded-full`}>
                            {topic}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">10 questions</span>
                        <span className="font-bold text-gray-700">{setProgressPercent}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-200 rounded-full mt-1 overflow-hidden">
                        <div className={`h-full bg-gradient-to-r ${colors.gradient}`} style={{ width: `${setProgressPercent}%` }} />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-8 bg-white rounded-xl shadow p-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                This topic explores rocks, minerals, and the processes that shape our Earth. You'll learn to identify
                different rock types, test mineral properties, understand the rock cycle, and explore how weathering and
                erosion change Earth's surface. 130 total questions: 80 Learning Arc questions across 4 phases plus 50 Classic practice questions.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

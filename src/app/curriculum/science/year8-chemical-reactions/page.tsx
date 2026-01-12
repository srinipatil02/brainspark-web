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
        className="text-rose-600 transition-all duration-500"
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

export default function ChemicalReactionsTopicPage() {
  const [selectedDifficulty, setSelectedDifficulty] = useState<'medium'>('medium');

  // Hook to track progress across all 13 sets (8 new + 5 classic)
  const setIds = [
    'year8-chemical-reactions-set1',
    'year8-chemical-reactions-set2',
    'year8-chemical-reactions-set3',
    'year8-chemical-reactions-set4',
    'year8-chemical-reactions-set5',
    'year8-chemical-reactions-set6',
    'year8-chemical-reactions-set7',
    'year8-chemical-reactions-set8',
    'year8-chemical-reactions-set9',
    'year8-chemical-reactions-set10',
    'year8-chemical-reactions-set11',
    'year8-chemical-reactions-set12',
    'year8-chemical-reactions-set13',
  ];

  const { allProgress, isLoaded, getCompletedCount } = useAllSetsProgress();

  // Calculate progress for all sets
  const setsProgress = setIds.map(setId => ({
    setId,
    completed: getCompletedCount(setId),
    total: 10,
  }));

  const totalCompleted = setsProgress.reduce((sum, set) => sum + set.completed, 0);
  const totalQuestions = setsProgress.length * 10;
  const overallProgress = Math.round((totalCompleted / totalQuestions) * 100);

  const sets = [
    // Phase 1: Foundation (Sets 1-2)
    {
      number: 1,
      title: 'Physical vs Chemical Changes',
      topics: ['Physical changes', 'Chemical changes', 'Reversibility', 'Evidence of reactions'],
      icon: '🔬',
      color: 'rose',
      phase: 'Foundation',
    },
    {
      number: 2,
      title: 'Signs of Chemical Reactions',
      topics: ['Colour change', 'Gas production', 'Precipitate', 'Temperature change'],
      icon: '✨',
      color: 'pink',
      phase: 'Foundation',
    },
    // Phase 2: Application (Sets 3-4)
    {
      number: 3,
      title: 'Reactants and Products',
      topics: ['Word equations', 'Reactants', 'Products', 'Combustion basics'],
      icon: '⚗️',
      color: 'orange',
      phase: 'Application',
    },
    {
      number: 4,
      title: 'Combustion Reactions',
      topics: ['Burning fuels', 'Oxygen role', 'Carbon dioxide', 'Water vapour'],
      icon: '🔥',
      color: 'amber',
      phase: 'Application',
    },
    // Phase 3: Connection (Sets 5-6)
    {
      number: 5,
      title: 'Conservation of Mass',
      topics: ['Law of conservation', 'Atom rearrangement', 'Mass in reactions', 'Balanced equations'],
      icon: '⚖️',
      color: 'yellow',
      phase: 'Connection',
    },
    {
      number: 6,
      title: 'Oxidation and Corrosion',
      topics: ['Rusting', 'Oxidation', 'Corrosion prevention', 'Types of reactions'],
      icon: '🔩',
      color: 'lime',
      phase: 'Connection',
    },
    // Phase 4: Mastery (Sets 7-8)
    {
      number: 7,
      title: 'Energy in Reactions',
      topics: ['Exothermic reactions', 'Endothermic reactions', 'Energy release', 'Energy absorption'],
      icon: '⚡',
      color: 'emerald',
      phase: 'Mastery',
    },
    {
      number: 8,
      title: 'Reaction Rates',
      topics: ['Temperature effects', 'Surface area', 'Concentration', 'Catalysts'],
      icon: '🚀',
      color: 'teal',
      phase: 'Mastery',
    },
    // Classic Sets (Sets 9-13) - Additional practice
    {
      number: 9,
      title: 'Classic: Reaction Basics',
      topics: ['Reaction evidence', 'Physical vs chemical', 'Observable changes'],
      icon: '📚',
      color: 'slate',
      phase: 'Classic',
    },
    {
      number: 10,
      title: 'Classic: Reaction Types',
      topics: ['Combustion', 'Synthesis', 'Decomposition', 'Displacement'],
      icon: '📖',
      color: 'gray',
      phase: 'Classic',
    },
    {
      number: 11,
      title: 'Classic: Word Equations',
      topics: ['Word equations', 'Reactants', 'Products', 'Balancing'],
      icon: '📝',
      color: 'zinc',
      phase: 'Classic',
    },
    {
      number: 12,
      title: 'Classic: Mass & Energy',
      topics: ['Mass conservation', 'Energy changes', 'Exothermic', 'Endothermic'],
      icon: '📊',
      color: 'neutral',
      phase: 'Classic',
    },
    {
      number: 13,
      title: 'Classic: Applied Chemistry',
      topics: ['Everyday reactions', 'Industrial chemistry', 'Environmental impact'],
      icon: '🔬',
      color: 'stone',
      phase: 'Classic',
    },
  ];

  // Color classes mapping for Tailwind
  const colorClasses: Record<string, { bg: string; text: string; light: string }> = {
    rose: { bg: 'bg-rose-500', text: 'text-rose-700', light: 'bg-rose-50' },
    pink: { bg: 'bg-pink-500', text: 'text-pink-700', light: 'bg-pink-50' },
    orange: { bg: 'bg-orange-500', text: 'text-orange-700', light: 'bg-orange-50' },
    amber: { bg: 'bg-amber-500', text: 'text-amber-700', light: 'bg-amber-50' },
    yellow: { bg: 'bg-yellow-500', text: 'text-yellow-700', light: 'bg-yellow-50' },
    lime: { bg: 'bg-lime-500', text: 'text-lime-700', light: 'bg-lime-50' },
    emerald: { bg: 'bg-emerald-500', text: 'text-emerald-700', light: 'bg-emerald-50' },
    teal: { bg: 'bg-teal-500', text: 'text-teal-700', light: 'bg-teal-50' },
    // Classic set colors
    slate: { bg: 'bg-slate-500', text: 'text-slate-700', light: 'bg-slate-50' },
    gray: { bg: 'bg-gray-500', text: 'text-gray-700', light: 'bg-gray-50' },
    zinc: { bg: 'bg-zinc-500', text: 'text-zinc-700', light: 'bg-zinc-50' },
    neutral: { bg: 'bg-neutral-500', text: 'text-neutral-700', light: 'bg-neutral-50' },
    stone: { bg: 'bg-stone-500', text: 'text-stone-700', light: 'bg-stone-50' },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-orange-50 to-amber-50">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-sm shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/curriculum" className="text-rose-600 hover:text-rose-700">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center text-2xl">
                  🔬
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Chemical Reactions</h1>
                  <p className="text-gray-600 text-sm">NSW Year 8 Science • ACSSU225</p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Overall Progress</div>
              <div className="text-2xl font-bold text-rose-600">{overallProgress}%</div>
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
                <span className="text-rose-600 mt-1">✓</span>
                <p className="text-gray-700">Distinguish between physical and chemical changes</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-rose-600 mt-1">✓</span>
                <p className="text-gray-700">Identify different types of chemical reactions</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-rose-600 mt-1">✓</span>
                <p className="text-gray-700">Understand the law of conservation of mass</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-rose-600 mt-1">✓</span>
                <p className="text-gray-700">Explore factors that affect reaction rates</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-rose-600 mt-1">✓</span>
                <p className="text-gray-700">Recognize chemical reactions in everyday life</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-rose-600 mt-1">✓</span>
                <p className="text-gray-700">Apply chemistry concepts to real-world phenomena</p>
              </div>
            </div>
          </div>
        </div>

        {/* Learning Arc Info */}
        <div className="mb-6 flex flex-wrap items-center gap-3 text-sm">
          <span className="px-3 py-1 bg-rose-100 text-rose-700 rounded-full font-medium">Foundation: Sets 1-2</span>
          <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full font-medium">Application: Sets 3-4</span>
          <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full font-medium">Connection: Sets 5-6</span>
          <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full font-medium">Mastery: Sets 7-8</span>
          <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full font-medium">Classic: Sets 9-13</span>
        </div>

        {/* Sets Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {sets.map((set, index) => {
            const progressData = setsProgress[index] || { completed: 0, total: 10 };
            const setProgress = Math.round((progressData.completed / progressData.total) * 100);
            const isComplete = progressData.completed === progressData.total;
            const colors = colorClasses[set.color] || colorClasses.rose;

            return (
              <Link
                key={set.number}
                href={`/curriculum/science/year8-chemical-reactions/set/${set.number}`}
                className="block group"
              >
                <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden h-full border-2 border-transparent hover:border-rose-200">
                  {/* Card Header */}
                  <div className={`${colors.bg} p-5 text-white`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="text-4xl">{set.icon}</span>
                        <div>
                          <div className="text-sm opacity-90 font-medium">Set {set.number} of 13</div>
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
                            className={`px-2 py-1 ${colors.light} ${colors.text} text-xs rounded-full`}
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
                            className={`h-full ${colors.bg} transition-all duration-500`}
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
                      <div className={`w-full py-2 px-4 ${colors.bg} text-white rounded-lg font-medium text-center group-hover:shadow-md transition-shadow`}>
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
            <div className="w-10 h-10 bg-rose-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                This topic explores chemical reactions through 130 questions across 13 sets.
                You'll progress through four learning phases: Foundation (understanding basic concepts),
                Application (real-world examples), Connection (linking ideas and challenging misconceptions),
                and Mastery (complex problem-solving), plus 5 Classic sets for additional practice.
                Each question includes hints and detailed solutions to deepen your understanding of chemical changes.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

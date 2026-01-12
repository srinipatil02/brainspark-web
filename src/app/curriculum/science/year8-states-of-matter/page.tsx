'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAllSetsProgress } from '@/hooks/useSetProgress';

// Difficulty levels with their question sets
// Each set has a unique firestoreSetId for direct querying
const difficultyLevels = [
  {
    id: 'medium',
    name: 'Standard',
    description: 'Build solid understanding of particle theory and state changes',
    color: 'sky',
    icon: '🧊',
    sets: [
      // Phase 1: Foundation (Q1-20)
      {
        setNumber: 1,
        id: 'year8-science-states-of-matter-set1',
        title: 'States & Particles',
        subtitle: 'Introduction to the three states and particle model',
        icon: '⚛️',
        questions: 10,
        topics: ['Three states', 'Particle model', 'Arrangement', 'Movement'],
        phase: 'Foundation',
      },
      {
        setNumber: 2,
        id: 'year8-science-states-of-matter-set2',
        title: 'Particle Properties',
        subtitle: 'How particles behave in solids, liquids, and gases',
        icon: '🔬',
        questions: 10,
        topics: ['Spacing', 'Energy', 'Forces', 'Comparing states'],
        phase: 'Foundation',
      },
      // Phase 2: Application (Q21-40)
      {
        setNumber: 3,
        id: 'year8-science-states-of-matter-set3',
        title: 'Real-World States',
        subtitle: 'Applying particle theory to everyday phenomena',
        icon: '🌡️',
        questions: 10,
        topics: ['Melting ice cream', 'Steam', 'Diffusion', 'Compression'],
        phase: 'Application',
      },
      {
        setNumber: 4,
        id: 'year8-science-states-of-matter-set4',
        title: 'Energy & Change',
        subtitle: 'Temperature, energy transfer, and state changes',
        icon: '🔥',
        questions: 10,
        topics: ['Temperature', 'Kinetic energy', 'Heating', 'Boiling'],
        phase: 'Application',
      },
      // Phase 3: Connection (Q41-60)
      {
        setNumber: 5,
        id: 'year8-science-states-of-matter-set5',
        title: 'Challenging Ideas',
        subtitle: 'Addressing misconceptions about matter',
        icon: '💡',
        questions: 10,
        topics: ['Common mistakes', 'Dissolving vs melting', 'Gas mass', 'Particle size'],
        phase: 'Connection',
      },
      {
        setNumber: 6,
        id: 'year8-science-states-of-matter-set6',
        title: 'Connecting Concepts',
        subtitle: 'Linking particle theory across states',
        icon: '🔗',
        questions: 10,
        topics: ['State transitions', 'Energy flow', 'Particle diagrams', 'Predictions'],
        phase: 'Connection',
      },
      // Phase 4: Mastery (Q61-80)
      {
        setNumber: 7,
        id: 'year8-science-states-of-matter-set7',
        title: 'Complex Scenarios',
        subtitle: 'Applying knowledge to new situations',
        icon: '🧪',
        questions: 10,
        topics: ['Multi-step problems', 'Explanations', 'Analysis', 'Synthesis'],
        phase: 'Mastery',
      },
      {
        setNumber: 8,
        id: 'year8-science-states-of-matter-set8',
        title: 'Mastery Challenge',
        subtitle: 'Demonstrating deep understanding',
        icon: '🏆',
        questions: 10,
        topics: ['Expert reasoning', 'Novel contexts', 'Critical thinking', 'Integration'],
        phase: 'Mastery',
      },
      // Classic Sets (9-13) - Original question bank
      {
        setNumber: 9,
        id: 'year8-science-states-of-matter-set9',
        title: 'Classic: Particle Model',
        subtitle: 'Foundation questions on particle theory',
        icon: '📚',
        questions: 10,
        topics: ['Particle arrangement', 'Movement', 'Spacing', 'States'],
        phase: 'Classic',
      },
      {
        setNumber: 10,
        id: 'year8-science-states-of-matter-set10',
        title: 'Classic: State Properties',
        subtitle: 'Properties of solids, liquids, and gases',
        icon: '📖',
        questions: 10,
        topics: ['Solid properties', 'Liquid properties', 'Gas properties', 'Comparisons'],
        phase: 'Classic',
      },
      {
        setNumber: 11,
        id: 'year8-science-states-of-matter-set11',
        title: 'Classic: Changes',
        subtitle: 'State changes and energy',
        icon: '📝',
        questions: 10,
        topics: ['Melting', 'Freezing', 'Evaporation', 'Condensation'],
        phase: 'Classic',
      },
      {
        setNumber: 12,
        id: 'year8-science-states-of-matter-set12',
        title: 'Classic: Applications',
        subtitle: 'Real-world applications',
        icon: '📋',
        questions: 10,
        topics: ['Everyday examples', 'Problem solving', 'Explanations', 'Predictions'],
        phase: 'Classic',
      },
      {
        setNumber: 13,
        id: 'year8-science-states-of-matter-set13',
        title: 'Classic: Mastery',
        subtitle: 'Advanced particle theory',
        icon: '🎓',
        questions: 10,
        topics: ['Complex scenarios', 'Deep understanding', 'Synthesis', 'Analysis'],
        phase: 'Classic',
      },
    ],
  },
];

// Color utility
function getColorClasses(color: string) {
  const colors: Record<string, { bg: string; bgLight: string; text: string; border: string; progress: string }> = {
    sky: {
      bg: 'bg-sky-500',
      bgLight: 'bg-sky-50',
      text: 'text-sky-600',
      border: 'border-sky-200',
      progress: 'stroke-sky-500',
    },
    emerald: {
      bg: 'bg-emerald-500',
      bgLight: 'bg-emerald-50',
      text: 'text-emerald-600',
      border: 'border-emerald-200',
      progress: 'stroke-emerald-500',
    },
    amber: {
      bg: 'bg-amber-500',
      bgLight: 'bg-amber-50',
      text: 'text-amber-600',
      border: 'border-amber-200',
      progress: 'stroke-amber-500',
    },
    red: {
      bg: 'bg-red-500',
      bgLight: 'bg-red-50',
      text: 'text-red-600',
      border: 'border-red-200',
      progress: 'stroke-red-500',
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
    indigo: {
      bg: 'bg-indigo-500',
      bgLight: 'bg-indigo-50',
      text: 'text-indigo-600',
      border: 'border-indigo-200',
      progress: 'stroke-indigo-500',
    },
    orange: {
      bg: 'bg-orange-500',
      bgLight: 'bg-orange-50',
      text: 'text-orange-600',
      border: 'border-orange-200',
      progress: 'stroke-orange-500',
    },
    teal: {
      bg: 'bg-teal-500',
      bgLight: 'bg-teal-50',
      text: 'text-teal-600',
      border: 'border-teal-200',
      progress: 'stroke-teal-500',
    },
    slate: {
      bg: 'bg-slate-500',
      bgLight: 'bg-slate-50',
      text: 'text-slate-600',
      border: 'border-slate-200',
      progress: 'stroke-slate-500',
    },
    stone: {
      bg: 'bg-stone-500',
      bgLight: 'bg-stone-50',
      text: 'text-stone-600',
      border: 'border-stone-200',
      progress: 'stroke-stone-500',
    },
    zinc: {
      bg: 'bg-zinc-500',
      bgLight: 'bg-zinc-50',
      text: 'text-zinc-600',
      border: 'border-zinc-200',
      progress: 'stroke-zinc-500',
    },
    gray: {
      bg: 'bg-gray-500',
      bgLight: 'bg-gray-50',
      text: 'text-gray-600',
      border: 'border-gray-200',
      progress: 'stroke-gray-500',
    },
    neutral: {
      bg: 'bg-neutral-500',
      bgLight: 'bg-neutral-50',
      text: 'text-neutral-600',
      border: 'border-neutral-200',
      progress: 'stroke-neutral-500',
    },
  };
  return colors[color] || colors.sky;
}

// Circular progress component
function CircularProgress({ percent, size = 64, strokeWidth = 6, color = 'sky' }: {
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

export default function Year8StatesOfMatterPage() {
  const { allProgress, isLoaded, getCompletedCount } = useAllSetsProgress();
  const [mounted, setMounted] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('medium');

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentLevel = difficultyLevels.find(l => l.id === selectedDifficulty) || difficultyLevels[0];
  const levelColor = getColorClasses(currentLevel.color);

  // Calculate total progress for current difficulty
  const totalCompleted = currentLevel.sets.reduce(
    (sum, set) => sum + getCompletedCount(set.id),
    0
  );
  const totalQuestions = currentLevel.sets.reduce((sum, set) => sum + set.questions, 0);
  const overallProgress = Math.round((totalCompleted / totalQuestions) * 100);
  const completedSets = currentLevel.sets.filter(
    set => getCompletedCount(set.id) === set.questions
  ).length;

  // Get color for each set based on its position
  // 13 unique colors for 13 sets (8 new + 5 classic)
  const setColors = [
    'blue', 'indigo', 'orange', 'red', 'amber', 'teal', 'purple', 'emerald',  // Sets 1-8 (Learning Arc)
    'slate', 'stone', 'zinc', 'gray', 'neutral'  // Sets 9-13 (Classic)
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/curriculum" className="text-sky-600 hover:text-sky-700 text-sm flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Curriculum
              </Link>
              <h1 className="text-2xl font-bold text-gray-800 mt-1">
                Year 8 Science: States of Matter
              </h1>
              <p className="text-gray-500 text-sm">
                NSW Curriculum ACSSU151 • {totalQuestions} questions total
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Overall Progress Card */}
        <div className={`bg-white rounded-2xl shadow-lg p-6 mb-8 border ${levelColor.border}`}>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{currentLevel.icon}</span>
                <h2 className="text-lg font-semibold text-gray-800">{currentLevel.name} Progress</h2>
              </div>
              <p className="text-gray-500 text-sm mt-1">
                {mounted ? `${totalCompleted} of ${totalQuestions} questions completed` : 'Loading...'}
              </p>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className={`text-3xl font-bold ${levelColor.text}`}>{mounted ? completedSets : 0}</div>
                <div className="text-xs text-gray-500 uppercase tracking-wide">Sets Done</div>
              </div>
              {mounted && <CircularProgress percent={overallProgress} size={72} strokeWidth={8} color={currentLevel.color} />}
            </div>
          </div>

          <div className="mt-4">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full ${levelColor.bg} transition-all duration-500`}
                style={{ width: mounted ? `${overallProgress}%` : '0%' }}
              />
            </div>
          </div>
        </div>

        {/* Sets Grid */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">Question Sets</h2>

          <div className="grid gap-4 md:grid-cols-2">
            {currentLevel.sets.map((set, idx) => {
              const completed = mounted ? getCompletedCount(set.id) : 0;
              const percent = Math.round((completed / set.questions) * 100);
              const isComplete = completed === set.questions;
              const setColor = setColors[idx] || 'sky';
              const colorClasses = getColorClasses(setColor);

              return (
                <Link
                  key={set.id}
                  href={`/curriculum/science/year8-states-of-matter/set/${set.setNumber}`}
                  className="group"
                >
                  <div className={`
                    bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300
                    border-2 ${isComplete ? colorClasses.border : 'border-transparent'}
                    hover:scale-[1.02] overflow-hidden
                  `}>
                    <div className={`h-1.5 ${colorClasses.bg}`} />

                    <div className="p-5">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 ${colorClasses.bgLight} rounded-xl flex items-center justify-center text-2xl`}>
                            {set.icon}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                                Set {set.setNumber}
                              </span>
                              {isComplete && (
                                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                                  Complete
                                </span>
                              )}
                            </div>
                            <h3 className="text-lg font-semibold text-gray-800 group-hover:text-gray-900">
                              {set.title}
                            </h3>
                            <p className="text-sm text-gray-500">{set.subtitle}</p>
                          </div>
                        </div>

                        <CircularProgress
                          percent={percent}
                          size={56}
                          strokeWidth={5}
                          color={setColor}
                        />
                      </div>

                      <div className="flex flex-wrap gap-1.5 mt-4">
                        {set.topics.map((topic, tidx) => (
                          <span
                            key={tidx}
                            className={`px-2 py-0.5 ${colorClasses.bgLight} ${colorClasses.text} text-xs rounded-full`}
                          >
                            {topic}
                          </span>
                        ))}
                      </div>

                      <div className="mt-4 flex items-center gap-3">
                        <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${colorClasses.bg} transition-all duration-500`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-600 whitespace-nowrap">
                          {completed}/{set.questions}
                        </span>
                      </div>

                      <div className="mt-4 flex items-center justify-between">
                        <span className="text-sm text-gray-400">
                          ~{Math.ceil((set.questions - completed) * 2)} min remaining
                        </span>
                        <span className={`text-sm font-medium ${colorClasses.text} group-hover:underline flex items-center gap-1`}>
                          {completed === 0 ? 'Start Set' : isComplete ? 'Review' : 'Continue'}
                          <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

        {/* Quick Stats */}
        <div className="mt-8 grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-4 shadow text-center border border-gray-100">
            <div className="text-3xl font-bold text-sky-600">{totalQuestions}</div>
            <div className="text-sm text-gray-500">Total Questions</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow text-center border border-gray-100">
            <div className="text-3xl font-bold text-amber-600">~{totalQuestions * 2}</div>
            <div className="text-sm text-gray-500">Total Minutes</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow text-center border border-gray-100">
            <div className="text-3xl font-bold text-purple-600">{currentLevel.sets.length}</div>
            <div className="text-sm text-gray-500">Question Sets</div>
          </div>
        </div>

        {/* Curriculum Info */}
        <div className="mt-8 bg-gray-50 rounded-xl p-4 border border-gray-200">
          <h3 className="font-semibold text-gray-700 mb-2">NSW Curriculum Alignment</h3>
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1 bg-sky-100 text-sky-700 rounded-full text-sm">
              ACSSU151 - Properties of states of matter and particle model
            </span>
          </div>
          <p className="mt-3 text-sm text-gray-600">
            Explore how the particle model explains the properties of solids, liquids, and gases,
            including changes of state and the effects of temperature on particle movement.
          </p>
        </div>
      </main>
    </div>
  );
}

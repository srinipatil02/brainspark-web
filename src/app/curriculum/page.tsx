'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAllSetsProgress } from '@/hooks/useSetProgress';

interface TopicConfig {
  id: string;
  title: string;
  description: string;
  questionCount: number;
  isRich?: boolean;
  // Set IDs that belong to this topic (for calculating progress)
  setIds: string[];
}

interface Subject {
  id: string;
  title: string;
  icon: string;
  color: string;
  topics: TopicConfig[];
}

const subjects: Subject[] = [
  {
    id: 'mathematics',
    title: 'Mathematics',
    icon: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z',
    color: 'blue',
    topics: [
      {
        id: 'year8-linear-equations',
        title: 'Linear Equations',
        description: 'Solve one-step to multi-step equations with step-by-step AI grading',
        questionCount: 120,
        isRich: true,
        setIds: [
          'year8-linear-equations-set1',
          'year8-linear-equations-set2',
          'year8-linear-equations-set3',
          'year8-linear-equations-set4',
          'year8-linear-equations-set5',
          'year8-linear-equations-set6',
          'year8-linear-equations-set7',
          'year8-linear-equations-set8',
          'year8-linear-equations-set9',
          'year8-linear-equations-set10',
          'year8-linear-equations-set11',
          'year8-linear-equations-set12',
        ],
      },
      {
        id: 'year8-percentages-applications',
        title: 'Percentages & Applications',
        description: 'Percentage increases, decreases, profit/loss, and interest calculations',
        questionCount: 120,
        isRich: true,
        setIds: [
          'year8-percentages-applications-set1',
          'year8-percentages-applications-set2',
          'year8-percentages-applications-set3',
          'year8-percentages-applications-set4',
          'year8-percentages-applications-set5',
          'year8-percentages-applications-set6',
          'year8-percentages-applications-set7',
          'year8-percentages-applications-set8',
          'year8-percentages-applications-set9',
          'year8-percentages-applications-set10',
          'year8-percentages-applications-set11',
          'year8-percentages-applications-set12',
        ],
      },
      {
        id: 'year8-ratios-rates',
        title: 'Ratios & Rates',
        description: 'Simplifying ratios, dividing quantities, unit rates, and proportional reasoning',
        questionCount: 120,
        isRich: true,
        setIds: [
          'year8-ratios-rates-set1',
          'year8-ratios-rates-set2',
          'year8-ratios-rates-set3',
          'year8-ratios-rates-set4',
          'year8-ratios-rates-set5',
          'year8-ratios-rates-set6',
          'year8-ratios-rates-set7',
          'year8-ratios-rates-set8',
          'year8-ratios-rates-set9',
          'year8-ratios-rates-set10',
          'year8-ratios-rates-set11',
          'year8-ratios-rates-set12',
        ],
      },
    ],
  },
  {
    id: 'science',
    title: 'Science',
    icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z',
    color: 'green',
    topics: [
      {
        id: 'year8-cells',
        title: 'Cells',
        description: 'Cell structure, function, and energy',
        questionCount: 70,
        isRich: true,
        setIds: ['year8-science-cells-set1', 'year8-science-cells-set2', 'year8-science-cells-set3', 'year8-science-cells-set4', 'year8-science-cells-set5', 'year8-science-cells-hard-set1', 'year8-science-cells-hard-set2'],
      },
      {
        id: 'year8-cells-structure',
        title: 'Cells & Cell Structure',
        description: 'Deep dive into cell theory, organelles, photosynthesis, and cellular respiration',
        questionCount: 80,
        isRich: true,
        setIds: [
          'year8-cells-cell-structure-set1',
          'year8-cells-cell-structure-set2',
          'year8-cells-cell-structure-set3',
          'year8-cells-cell-structure-set4',
          'year8-cells-cell-structure-set5',
          'year8-cells-cell-structure-set6',
          'year8-cells-cell-structure-set7',
          'year8-cells-cell-structure-set8',
        ],
      },
      {
        id: 'year8-states-of-matter',
        title: 'States of Matter',
        description: 'Particle model, solids, liquids, gases, and state changes',
        questionCount: 50,
        isRich: true,
        setIds: ['year8-science-states-of-matter-set1', 'year8-science-states-of-matter-set2', 'year8-science-states-of-matter-set3', 'year8-science-states-of-matter-set4', 'year8-science-states-of-matter-set5'],
      },
      {
        id: 'year8-elements-compounds',
        title: 'Elements & Compounds',
        description: 'Pure substances, mixtures, elements, compounds, and particle diagrams',
        questionCount: 130,
        isRich: true,
        setIds: [
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
        ],
      },
      {
        id: 'year8-chemical-reactions',
        title: 'Chemical Reactions',
        description: 'Reaction indicators, reactants, products, and mass conservation',
        questionCount: 130,
        isRich: true,
        setIds: [
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
        ],
      },
      {
        id: 'year8-rocks-minerals',
        title: 'Rocks & Minerals',
        description: 'Rock cycle, rock types, mineral properties, and geological processes',
        questionCount: 50,
        isRich: true,
        setIds: ['year8-science-rocks-minerals-set1', 'year8-science-rocks-minerals-set2', 'year8-science-rocks-minerals-set3', 'year8-science-rocks-minerals-set4', 'year8-science-rocks-minerals-set5'],
      },
      {
        id: 'year8-energy-forms-transformations',
        title: 'Energy Forms & Transformations',
        description: 'Kinetic, potential, thermal energy, transformations, conservation, and efficiency',
        questionCount: 80,
        isRich: true,
        setIds: [
          'year8-science-energy-forms-transformations-set1',
          'year8-science-energy-forms-transformations-set2',
          'year8-science-energy-forms-transformations-set3',
          'year8-science-energy-forms-transformations-set4',
          'year8-science-energy-forms-transformations-set5',
          'year8-science-energy-forms-transformations-set6',
          'year8-science-energy-forms-transformations-set7',
          'year8-science-energy-forms-transformations-set8',
        ],
      },
    ],
  },
];

export default function Curriculum() {
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const { allProgress, isLoaded, getCompletedCount } = useAllSetsProgress();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Calculate progress for a topic based on its sets
  const getTopicProgress = (topic: TopicConfig): number => {
    if (!mounted || !isLoaded || topic.setIds.length === 0) return 0;

    let totalCompleted = 0;
    let totalQuestions = 0;

    for (const setId of topic.setIds) {
      const completed = getCompletedCount(setId);
      totalCompleted += completed;
      totalQuestions += 10; // Each set has 10 questions
    }

    if (totalQuestions === 0) return 0;
    return Math.round((totalCompleted / totalQuestions) * 100);
  };

  // Calculate total progress for a subject
  const getSubjectProgress = (subject: Subject): { completed: number; total: number; percent: number } => {
    if (!mounted || !isLoaded) return { completed: 0, total: 0, percent: 0 };

    let totalCompleted = 0;
    let totalQuestions = 0;

    for (const topic of subject.topics) {
      for (const setId of topic.setIds) {
        const completed = getCompletedCount(setId);
        totalCompleted += completed;
        totalQuestions += 10;
      }
    }

    return {
      completed: totalCompleted,
      total: totalQuestions,
      percent: totalQuestions > 0 ? Math.round((totalCompleted / totalQuestions) * 100) : 0,
    };
  };

  if (selectedSubject) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSelectedSubject(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{selectedSubject.title}</h1>
                <p className="text-sm text-gray-500">Year 8 Curriculum</p>
              </div>
            </div>
            <Link
              href="/dashboard"
              className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-200 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Dashboard
            </Link>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="space-y-4">
            {selectedSubject.topics.map((topic) => {
              const href = `/curriculum/${selectedSubject.id}/${topic.id}`;
              const progress = getTopicProgress(topic);

              return (
                <Link key={topic.id} href={href}>
                  <div className={`bg-white rounded-xl shadow-sm border p-5 hover:shadow-md transition-shadow ${topic.isRich ? 'ring-2 ring-purple-200 ring-offset-2' : ''}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold text-gray-900">{topic.title}</h3>
                          {topic.isRich && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 rounded-full flex items-center gap-1">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6z" />
                              </svg>
                              AI Tutor
                            </span>
                          )}
                          {progress === 100 && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                              Complete
                            </span>
                          )}
                        </div>
                        <p className="text-gray-500 text-sm">{topic.description}</p>
                      </div>
                      <span className="text-sm text-gray-400">{topic.questionCount} questions</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${
                            progress === 100 ? 'bg-green-500' :
                            selectedSubject.color === 'blue' ? 'bg-blue-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className={`text-sm font-medium ${progress === 100 ? 'text-green-600' : 'text-gray-600'}`}>
                        {mounted ? `${progress}%` : '...'}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-gray-500 hover:text-gray-700">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Year 8 Curriculum</h1>
              <p className="text-sm text-gray-500">Mathematics & Science</p>
            </div>
          </div>
          <Link
            href="/dashboard"
            className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-200 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900">Select a Subject</h2>
          <p className="text-gray-500">Choose what you&apos;d like to practice today</p>
        </div>

        <div className="space-y-4">
          {subjects.map((subject) => {
            const subjectProgress = getSubjectProgress(subject);

            return (
              <button
                key={subject.id}
                onClick={() => setSelectedSubject(subject)}
                className="w-full text-left bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 ${subject.color === 'blue' ? 'bg-blue-100' : 'bg-green-100'} rounded-xl flex items-center justify-center`}>
                    <svg className={`w-7 h-7 ${subject.color === 'blue' ? 'text-blue-600' : 'text-green-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={subject.icon} />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{subject.title}</h3>
                    <p className="text-gray-500 text-sm">
                      {subject.topics.length} topics • {subject.topics.reduce((sum, t) => sum + t.questionCount, 0)} questions
                    </p>
                    {/* Progress bar */}
                    {subjectProgress.total > 0 && (
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 ${subject.color === 'blue' ? 'bg-blue-500' : 'bg-green-500'}`}
                            style={{ width: `${subjectProgress.percent}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500">
                          {mounted ? `${subjectProgress.percent}%` : '...'}
                        </span>
                      </div>
                    )}
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            );
          })}
        </div>
      </main>
    </div>
  );
}

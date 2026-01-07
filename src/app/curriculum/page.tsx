'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Topic {
  id: string;
  title: string;
  description: string;
  questionCount: number;
  progress: number;
  isRich?: boolean; // Rich content with AI chat
}

interface Subject {
  id: string;
  title: string;
  icon: string;
  color: string;
  topics: Topic[];
}

const subjects: Subject[] = [
  {
    id: 'mathematics',
    title: 'Mathematics',
    icon: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z',
    color: 'blue',
    topics: [
      { id: 'algebra', title: 'Algebra', description: 'Equations, expressions, and functions', questionCount: 25, progress: 0 },
      { id: 'geometry', title: 'Geometry', description: 'Shapes, angles, and measurements', questionCount: 20, progress: 0 },
      { id: 'statistics', title: 'Statistics', description: 'Data analysis and probability', questionCount: 15, progress: 0 },
      { id: 'number-theory', title: 'Number Theory', description: 'Integers, primes, and divisibility', questionCount: 18, progress: 0 },
    ],
  },
  {
    id: 'science',
    title: 'Science',
    icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z',
    color: 'green',
    topics: [
      { id: 'year8-cells', title: 'Cells', description: 'Cell structure, function, and energy', questionCount: 70, progress: 0, isRich: true },
      { id: 'year8-states-of-matter', title: 'States of Matter', description: 'Particle model, solids, liquids, gases, and state changes', questionCount: 50, progress: 0, isRich: true },
      { id: 'year8-elements-compounds', title: 'Elements & Compounds', description: 'Atoms, periodic table, compounds, formulas, and everyday chemistry', questionCount: 50, progress: 0, isRich: true },
      { id: 'year8-chemical-reactions', title: 'Chemical Reactions', description: 'Reaction indicators, reactants, products, and mass conservation', questionCount: 50, progress: 0, isRich: true },
      { id: 'year8-rocks-minerals', title: 'Rocks & Minerals', description: 'Rock cycle, rock types, mineral properties, and geological processes', questionCount: 50, progress: 0, isRich: true },
      { id: 'year8-energy', title: 'Energy', description: 'Energy forms, transformations, transfers, and conservation', questionCount: 50, progress: 0, isRich: true },
    ],
  },
];

export default function Curriculum() {
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);

  const getColorClasses = (color: string) => ({
    bg: `bg-${color}-100`,
    text: `text-${color}-600`,
    button: `bg-${color}-600 hover:bg-${color}-700`,
    progress: `bg-${color}-500`,
  });

  if (selectedSubject) {
    const colors = getColorClasses(selectedSubject.color);

    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
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
        </header>

        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="space-y-4">
            {selectedSubject.topics.map((topic) => {
              // Rich topics have their own dedicated pages with AI chat
              const href = topic.isRich
                ? `/curriculum/${selectedSubject.id}/${topic.id}`
                : `/curriculum/${selectedSubject.id}/${topic.id}`;

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
                        </div>
                        <p className="text-gray-500 text-sm">{topic.description}</p>
                      </div>
                      <span className="text-sm text-gray-400">{topic.questionCount} questions</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${selectedSubject.color === 'blue' ? 'bg-blue-500' : 'bg-green-500'} transition-all`}
                          style={{ width: `${topic.progress}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-600">{topic.progress}%</span>
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
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
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
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900">Select a Subject</h2>
          <p className="text-gray-500">Choose what you&apos;d like to practice today</p>
        </div>

        <div className="space-y-4">
          {subjects.map((subject) => (
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
                  <p className="text-gray-500 text-sm">{subject.topics.length} topics • {subject.topics.reduce((sum, t) => sum + t.questionCount, 0)} questions</p>
                </div>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}

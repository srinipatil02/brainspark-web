// =============================================================================
// NSW SELECTIVE DASHBOARD
// =============================================================================
// FILE: src/app/nsw-selective/page.tsx
// DOMAIN: NSW Selective Exam Prep
// PURPOSE: Main dashboard with readiness metrics, quick actions, and focus areas
// DO NOT: Import curriculum components or use learningArc fields

'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { ARCHETYPE_CATALOG, ArchetypeCategory, getArchetypeDefinition } from '@/types/nsw-selective';
import { ArchetypeId } from '@/types';

// Category display configuration
const CATEGORY_CONFIG: Record<ArchetypeCategory, { label: string; color: string; bgColor: string }> = {
  arithmetic_algebra: { label: 'Arithmetic & Algebra', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  percentages_ratios: { label: 'Percentages & Ratios', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  geometry_spatial: { label: 'Geometry & Spatial', color: 'text-orange-700', bgColor: 'bg-orange-100' },
  data_statistics: { label: 'Data & Statistics', color: 'text-green-700', bgColor: 'bg-green-100' },
  patterns_sequences: { label: 'Patterns & Sequences', color: 'text-pink-700', bgColor: 'bg-pink-100' },
  time_distance: { label: 'Time & Distance', color: 'text-cyan-700', bgColor: 'bg-cyan-100' },
  problem_solving: { label: 'Problem Solving', color: 'text-amber-700', bgColor: 'bg-amber-100' },
};

export default function NswSelectiveDashboard() {
  const [mounted, setMounted] = useState(false);

  // Mock readiness data - will be replaced with real Firestore data
  const [readinessScore] = useState(0); // New users start at 0
  const [diagnosticCompleted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Group archetypes by category
  const archetypesByCategory = Object.entries(ARCHETYPE_CATALOG).reduce((acc, [id, def]) => {
    const category = def.category;
    if (!acc[category]) acc[category] = [];
    acc[category].push({ id: id as ArchetypeId, ...def });
    return acc;
  }, {} as Record<ArchetypeCategory, Array<{ id: ArchetypeId } & typeof ARCHETYPE_CATALOG[ArchetypeId]>>);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-gray-500 hover:text-gray-700">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">NSW Selective Exam Prep</h1>
              <p className="text-sm text-gray-500">Year 6 Mathematics - 35 Questions, 40 Minutes</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-gray-500">Exam Readiness</p>
              <p className="text-lg font-bold text-purple-600">
                {mounted ? `${readinessScore}%` : '...'}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Readiness Progress Bar */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Your Exam Readiness</h2>
              <p className="text-sm text-gray-500">Master all 20 question types to be fully prepared</p>
            </div>
            <span className={`text-3xl font-bold ${readinessScore >= 70 ? 'text-green-600' : readinessScore >= 40 ? 'text-amber-600' : 'text-gray-400'}`}>
              {mounted ? `${readinessScore}%` : '...'}
            </span>
          </div>
          <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                readinessScore >= 70 ? 'bg-green-500' :
                readinessScore >= 40 ? 'bg-amber-500' : 'bg-purple-500'
              }`}
              style={{ width: `${mounted ? readinessScore : 0}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>Getting Started</span>
            <span>Building Skills</span>
            <span>Nearly Ready</span>
            <span>Exam Ready!</span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Diagnostic */}
          <Link href="/nsw-selective/diagnostic" className="block h-full">
            <div className={`bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow h-full flex flex-col ${
              !diagnosticCompleted ? 'ring-2 ring-purple-200 ring-offset-2' : ''
            }`}>
              <div className="flex items-center gap-4 mb-3">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Diagnostic Test</h3>
                  <p className="text-sm text-gray-500">Find your weak spots</p>
                </div>
              </div>
              <div className="mt-auto">
                <p className="text-xs text-gray-400">20 questions • 20 minutes</p>
                {!diagnosticCompleted && (
                  <span className="inline-block mt-2 px-2 py-1 text-xs font-medium bg-purple-100 text-purple-700 rounded-full">
                    Start Here
                  </span>
                )}
              </div>
            </div>
          </Link>

          {/* Practice */}
          <Link href="/nsw-selective/practice" className="block h-full">
            <div className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow h-full flex flex-col">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Practice by Type</h3>
                  <p className="text-sm text-gray-500">Master each archetype</p>
                </div>
              </div>
              <div className="mt-auto">
                <p className="text-xs text-gray-400">20 archetypes • 500 questions</p>
              </div>
            </div>
          </Link>

          {/* Simulation */}
          <Link href="/nsw-selective/simulation" className="block h-full">
            <div className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow h-full flex flex-col">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Mock Exam</h3>
                  <p className="text-sm text-gray-500">Full exam simulation</p>
                </div>
              </div>
              <div className="mt-auto">
                <p className="text-xs text-gray-400">35 questions • 40 minutes</p>
              </div>
            </div>
          </Link>

          {/* Insights */}
          <Link href="/nsw-selective/insights" className="block h-full">
            <div className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow h-full flex flex-col">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Insights</h3>
                  <p className="text-sm text-gray-500">View your analytics</p>
                </div>
              </div>
              <div className="mt-auto">
                <p className="text-xs text-gray-400">Performance • Strengths • Focus</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Question Types Overview */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Question Archetypes</h2>
              <p className="text-sm text-gray-500">20 question types you need to master</p>
            </div>
            <Link
              href="/nsw-selective/practice"
              className="text-sm text-purple-600 hover:text-purple-700 font-medium"
            >
              View All →
            </Link>
          </div>

          <div className="space-y-6">
            {(Object.entries(archetypesByCategory) as [ArchetypeCategory, typeof archetypesByCategory[ArchetypeCategory]][]).map(([category, archetypes]) => (
              <div key={category}>
                <div className="flex items-center gap-2 mb-3">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${CATEGORY_CONFIG[category].bgColor} ${CATEGORY_CONFIG[category].color}`}>
                    {CATEGORY_CONFIG[category].label}
                  </span>
                  <span className="text-xs text-gray-400">{archetypes.length} types</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {archetypes.slice(0, 3).map((archetype) => (
                    <Link
                      key={archetype.id}
                      href={`/nsw-selective/practice/${archetype.id}`}
                      className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{archetype.shortName}</p>
                          <p className="text-xs text-gray-500">Difficulty {archetype.difficulty}</p>
                        </div>
                        {archetype.visualRequired && (
                          <span className="text-xs text-orange-600">Has diagrams</span>
                        )}
                      </div>
                    </Link>
                  ))}
                  {archetypes.length > 3 && (
                    <Link
                      href="/nsw-selective/practice"
                      className="flex items-center justify-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-sm text-gray-500"
                    >
                      +{archetypes.length - 3} more
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Exam Format Info */}
        <div className="mt-8 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-100 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">About the NSW Selective Exam</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-purple-600">35</p>
              <p className="text-sm text-gray-600">Questions</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-600">40</p>
              <p className="text-sm text-gray-600">Minutes</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-600">5</p>
              <p className="text-sm text-gray-600">Options (A-E)</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-600">~68s</p>
              <p className="text-sm text-gray-600">Per Question</p>
            </div>
          </div>
          <p className="mt-4 text-sm text-gray-600">
            The mathematics section tests problem-solving, not just calculations. Master the methodology for each question type to save time and reduce errors.
          </p>
        </div>
      </main>
    </div>
  );
}

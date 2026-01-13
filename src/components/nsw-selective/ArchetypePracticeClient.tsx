// =============================================================================
// ARCHETYPE PRACTICE CLIENT COMPONENT
// =============================================================================
// FILE: src/components/nsw-selective/ArchetypePracticeClient.tsx
// DOMAIN: NSW Selective Exam Prep
// PURPOSE: Client-side practice page for a specific archetype with methodology coaching
// DO NOT: Import curriculum components or use learningArc fields

'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { ARCHETYPE_CATALOG, getArchetypeDefinition, ArchetypeCategory } from '@/types/nsw-selective';
import { ArchetypeId, FirestoreQuestion } from '@/types';
import { getQuestionsByArchetype } from '@/services/nsw-selective/archetypeService';
import { ArchetypePlayer } from './ArchetypePlayer';

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

interface ArchetypePracticeClientProps {
  archetypeId: string;
}

export function ArchetypePracticeClient({ archetypeId }: ArchetypePracticeClientProps) {
  const [showMethodology, setShowMethodology] = useState(true);
  const [questions, setQuestions] = useState<FirestoreQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPracticing, setIsPracticing] = useState(false);

  // Validate archetype ID
  const isValidArchetype = archetypeId && archetypeId in ARCHETYPE_CATALOG;
  const archetype = isValidArchetype ? getArchetypeDefinition(archetypeId as ArchetypeId) : null;

  // Fetch questions from Firestore
  useEffect(() => {
    async function fetchQuestions() {
      if (!isValidArchetype) return;

      setLoading(true);
      try {
        const fetchedQuestions = await getQuestionsByArchetype(archetypeId as ArchetypeId, 25);
        setQuestions(fetchedQuestions);
      } catch (error) {
        console.error('Error fetching questions:', error);
        setQuestions([]);
      } finally {
        setLoading(false);
      }
    }

    fetchQuestions();
  }, [archetypeId, isValidArchetype]);

  if (!isValidArchetype || !archetype) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">404</div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Archetype Not Found</h1>
          <p className="text-gray-500 mb-4">The archetype &quot;{archetypeId}&quot; does not exist.</p>
          <Link
            href="/nsw-selective/practice"
            className="text-purple-600 hover:text-purple-700 font-medium"
          >
            Back to Practice
          </Link>
        </div>
      </div>
    );
  }

  const categoryConfig = CATEGORY_CONFIG[archetype.category];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/nsw-selective/practice" className="text-gray-500 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-gray-500">{archetype.id.toUpperCase()}</span>
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${categoryConfig.bgColor} ${categoryConfig.color}`}>
                    {categoryConfig.label}
                  </span>
                </div>
                <h1 className="text-xl font-semibold text-gray-900">{archetype.name}</h1>
              </div>
            </div>
            <button
              onClick={() => setShowMethodology(!showMethodology)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                showMethodology
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {showMethodology ? 'Hide' : 'Show'} Methodology
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Methodology Panel */}
        {showMethodology && (
          <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <h2 className="text-lg font-semibold text-gray-900">Methodology: {archetype.shortName}</h2>
            </div>

            {/* Pattern */}
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-700 mb-1">The Pattern</h3>
              <p className="text-gray-600 bg-gray-50 rounded-lg p-3 text-sm">
                {archetype.pattern}
              </p>
            </div>

            {/* Solution Approach */}
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-700 mb-1">The Approach</h3>
              <p className="text-gray-600 bg-green-50 rounded-lg p-3 text-sm border border-green-100">
                {archetype.solutionApproach}
              </p>
            </div>

            {/* Common Errors */}
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Common Traps to Avoid</h3>
              <ul className="space-y-2">
                {archetype.commonErrors.map((error, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                    <svg className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    {error}
                  </li>
                ))}
              </ul>
            </div>

            {/* Concepts Required */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Concepts You Need</h3>
              <div className="flex flex-wrap gap-2">
                {archetype.conceptsRequired.map((concept) => (
                  <span
                    key={concept}
                    className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full"
                  >
                    {concept.replace(/-/g, ' ')}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Questions Section */}
        {isPracticing && questions.length > 0 ? (
          <ArchetypePlayer
            questions={questions}
            archetypeId={archetypeId as ArchetypeId}
            onComplete={() => setIsPracticing(false)}
          />
        ) : (
          <div className="bg-white rounded-xl shadow-sm border p-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                  <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Loading Questions...</h3>
                <p className="text-gray-500">Fetching questions for {archetype.shortName}</p>
              </div>
            ) : questions.length > 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to Practice!</h3>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                  {questions.length} questions available for &quot;{archetype.shortName}&quot;.
                  Practice with methodology coaching to master this archetype.
                </p>
                <button
                  onClick={() => setIsPracticing(true)}
                  className="px-6 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-colors"
                >
                  Start Practice Session
                </button>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Questions Coming Soon</h3>
                <p className="text-gray-500 mb-4 max-w-md mx-auto">
                  Questions for &quot;{archetype.shortName}&quot; are being generated.
                  Check back soon or try another archetype.
                </p>
                <div className="flex justify-center gap-3">
                  <Link
                    href="/nsw-selective/practice"
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
                  >
                    Browse Other Types
                  </Link>
                  <Link
                    href="/nsw-selective"
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                  >
                    Back to Dashboard
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Archetype Info */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border p-4 text-center">
            <p className="text-2xl font-bold text-purple-600">
              {archetype.difficulty}
            </p>
            <p className="text-xs text-gray-500">Base Difficulty</p>
          </div>
          <div className="bg-white rounded-lg border p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">
              {archetype.visualRequired ? 'Yes' : 'No'}
            </p>
            <p className="text-xs text-gray-500">Has Diagrams</p>
          </div>
          <div className="bg-white rounded-lg border p-4 text-center">
            <p className="text-2xl font-bold text-green-600">
              {archetype.conceptsRequired.length}
            </p>
            <p className="text-xs text-gray-500">Concepts</p>
          </div>
          <div className="bg-white rounded-lg border p-4 text-center">
            <p className="text-2xl font-bold text-amber-600">
              {archetype.commonErrors.length}
            </p>
            <p className="text-xs text-gray-500">Common Traps</p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default ArchetypePracticeClient;

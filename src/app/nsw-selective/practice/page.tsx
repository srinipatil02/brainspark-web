// =============================================================================
// NSW SELECTIVE PRACTICE PAGE
// =============================================================================
// FILE: src/app/nsw-selective/practice/page.tsx
// DOMAIN: NSW Selective Exam Prep
// PURPOSE: Display all 23 archetypes in a filterable grid for practice selection
// DO NOT: Import curriculum components or use learningArc fields

'use client';

import Link from 'next/link';
import { useState, useMemo } from 'react';
import { ARCHETYPE_CATALOG, ArchetypeCategory, getArchetypeDefinition } from '@/types/nsw-selective';
import { ArchetypeId } from '@/types';
import { ArchetypeCard } from '@/components/nsw-selective/ArchetypeCard';
import { useAllArchetypeProgress } from '@/hooks/nsw-selective/useArchetypeProgress';

// Category display configuration
const CATEGORY_CONFIG: Record<ArchetypeCategory, { label: string; color: string; bgColor: string; borderColor: string }> = {
  arithmetic_algebra: { label: 'Arithmetic & Algebra', color: 'text-blue-700', bgColor: 'bg-blue-100', borderColor: 'border-blue-300' },
  percentages_ratios: { label: 'Percentages & Ratios', color: 'text-purple-700', bgColor: 'bg-purple-100', borderColor: 'border-purple-300' },
  geometry_spatial: { label: 'Geometry & Spatial', color: 'text-orange-700', bgColor: 'bg-orange-100', borderColor: 'border-orange-300' },
  data_statistics: { label: 'Data & Statistics', color: 'text-green-700', bgColor: 'bg-green-100', borderColor: 'border-green-300' },
  patterns_sequences: { label: 'Patterns & Sequences', color: 'text-pink-700', bgColor: 'bg-pink-100', borderColor: 'border-pink-300' },
  time_distance: { label: 'Time & Distance', color: 'text-cyan-700', bgColor: 'bg-cyan-100', borderColor: 'border-cyan-300' },
  problem_solving: { label: 'Problem Solving', color: 'text-amber-700', bgColor: 'bg-amber-100', borderColor: 'border-amber-300' },
};

// All categories for filtering
const ALL_CATEGORIES: ArchetypeCategory[] = [
  'arithmetic_algebra',
  'percentages_ratios',
  'geometry_spatial',
  'data_statistics',
  'patterns_sequences',
  'time_distance',
  'problem_solving',
];

export default function PracticePage() {
  const [selectedCategory, setSelectedCategory] = useState<ArchetypeCategory | 'all'>('all');
  const [showOnlyVisual, setShowOnlyVisual] = useState(false);
  const [sortBy, setSortBy] = useState<'id' | 'difficulty' | 'category'>('id');

  // Load progress for all archetypes
  const { allProgress, isLoading: progressLoading } = useAllArchetypeProgress();

  // Convert catalog to array with IDs
  const allArchetypes = useMemo(() => {
    return (Object.entries(ARCHETYPE_CATALOG) as [ArchetypeId, typeof ARCHETYPE_CATALOG[ArchetypeId]][])
      .map(([id, def]) => getArchetypeDefinition(id));
  }, []);

  // Filter and sort archetypes
  const filteredArchetypes = useMemo(() => {
    let result = [...allArchetypes];

    // Filter by category
    if (selectedCategory !== 'all') {
      result = result.filter(a => a.category === selectedCategory);
    }

    // Filter by visual requirement
    if (showOnlyVisual) {
      result = result.filter(a => a.visualRequired);
    }

    // Sort
    if (sortBy === 'difficulty') {
      result.sort((a, b) => a.difficulty - b.difficulty);
    } else if (sortBy === 'category') {
      result.sort((a, b) => a.category.localeCompare(b.category));
    }
    // Default: sort by ID

    return result;
  }, [allArchetypes, selectedCategory, showOnlyVisual, sortBy]);

  // Group by category for category view
  const archetypesByCategory = useMemo(() => {
    const grouped: Partial<Record<ArchetypeCategory, typeof filteredArchetypes>> = {};
    for (const archetype of filteredArchetypes) {
      if (!grouped[archetype.category]) {
        grouped[archetype.category] = [];
      }
      grouped[archetype.category]!.push(archetype);
    }
    return grouped;
  }, [filteredArchetypes]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/nsw-selective" className="text-gray-500 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Practice by Question Type</h1>
                <p className="text-sm text-gray-500">23 archetypes • 700 questions</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            {/* Category filter */}
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs text-gray-500 block mb-1">Category</label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-3 py-1 text-sm rounded-full transition-colors ${
                    selectedCategory === 'all'
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  All (23)
                </button>
                {ALL_CATEGORIES.map(cat => {
                  const count = allArchetypes.filter(a => a.category === cat).length;
                  const config = CATEGORY_CONFIG[cat];
                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1 text-sm rounded-full transition-colors ${
                        selectedCategory === cat
                          ? `${config.bgColor} ${config.color} border ${config.borderColor}`
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {config.label.split(' ')[0]} ({count})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sort and filter options */}
            <div className="flex items-center gap-4">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Sort by</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="px-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg"
                >
                  <option value="id">Archetype ID</option>
                  <option value="difficulty">Difficulty</option>
                  <option value="category">Category</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-500 block mb-1">Filter</label>
                <label className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showOnlyVisual}
                    onChange={(e) => setShowOnlyVisual(e.target.checked)}
                    className="rounded text-purple-600"
                  />
                  <span>Has diagrams</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Results summary */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-500">
            Showing {filteredArchetypes.length} archetype{filteredArchetypes.length !== 1 ? 's' : ''}
          </p>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Text-only: {allArchetypes.filter(a => !a.visualRequired).length}
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              With diagrams: {allArchetypes.filter(a => a.visualRequired).length}
            </span>
          </div>
        </div>

        {/* Archetype Grid */}
        {sortBy === 'category' ? (
          // Grouped by category view
          <div className="space-y-8">
            {(Object.entries(archetypesByCategory) as [ArchetypeCategory, typeof filteredArchetypes][]).map(([category, archetypes]) => (
              <div key={category}>
                <div className="flex items-center gap-2 mb-4">
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${CATEGORY_CONFIG[category].bgColor} ${CATEGORY_CONFIG[category].color}`}>
                    {CATEGORY_CONFIG[category].label}
                  </span>
                  <span className="text-sm text-gray-400">{archetypes.length} types</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {archetypes.map((archetype) => {
                    const progress = allProgress[archetype.id as ArchetypeId];
                    return (
                      <ArchetypeCard
                        key={archetype.id}
                        archetype={archetype}
                        showDetails
                        progress={progress && progress.questionsAttempted > 0 ? {
                          masteryLevel: progress.masteryLevel,
                          questionsAttempted: progress.questionsAttempted,
                          questionsCorrect: progress.questionsCorrect,
                          averageTimeSeconds: progress.averageTimeSeconds,
                        } : undefined}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Flat grid view
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredArchetypes.map((archetype) => {
              const progress = allProgress[archetype.id as ArchetypeId];
              return (
                <ArchetypeCard
                  key={archetype.id}
                  archetype={archetype}
                  showDetails
                  progress={progress && progress.questionsAttempted > 0 ? {
                    masteryLevel: progress.masteryLevel,
                    questionsAttempted: progress.questionsAttempted,
                    questionsCorrect: progress.questionsCorrect,
                    averageTimeSeconds: progress.averageTimeSeconds,
                  } : undefined}
                />
              );
            })}
          </div>
        )}

        {/* Empty state */}
        {filteredArchetypes.length === 0 && (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-gray-500">No archetypes match your filters</p>
            <button
              onClick={() => {
                setSelectedCategory('all');
                setShowOnlyVisual(false);
              }}
              className="mt-4 text-purple-600 hover:text-purple-700 text-sm font-medium"
            >
              Clear filters
            </button>
          </div>
        )}

        {/* Legend */}
        <div className="mt-8 p-4 bg-gray-50 rounded-xl">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Difficulty Levels</h3>
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-green-500"></span>
              <span className="text-gray-600">Foundation (Level 1)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500"></span>
              <span className="text-gray-600">Standard (Level 2)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500"></span>
              <span className="text-gray-600">Challenging (Level 3)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500"></span>
              <span className="text-gray-600">Advanced (Level 4)</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

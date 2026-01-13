// =============================================================================
// ARCHETYPE CARD COMPONENT
// =============================================================================
// FILE: src/components/nsw-selective/ArchetypeCard.tsx
// DOMAIN: NSW Selective Exam Prep
// PURPOSE: Display a single archetype with progress and mastery indicators
// DO NOT: Import curriculum components or use learningArc fields

'use client';

import Link from 'next/link';
import { ArchetypeDefinition, ArchetypeCategory } from '@/types/nsw-selective';

interface ArchetypeCardProps {
  archetype: ArchetypeDefinition;
  progress?: {
    masteryLevel: 1 | 2 | 3 | 4 | 5;
    questionsAttempted: number;
    questionsCorrect: number;
    averageTimeSeconds: number;
  };
  showDetails?: boolean;
}

// Category color configuration
const CATEGORY_COLORS: Record<ArchetypeCategory, { bg: string; text: string; border: string }> = {
  arithmetic_algebra: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  percentages_ratios: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  geometry_spatial: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  data_statistics: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  patterns_sequences: { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200' },
  time_distance: { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
  problem_solving: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
};

// Difficulty indicators
const DIFFICULTY_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: 'Foundation', color: 'text-green-600' },
  2: { label: 'Standard', color: 'text-blue-600' },
  3: { label: 'Challenging', color: 'text-amber-600' },
  4: { label: 'Advanced', color: 'text-red-600' },
};

export function ArchetypeCard({ archetype, progress, showDetails = false }: ArchetypeCardProps) {
  const colors = CATEGORY_COLORS[archetype.category];
  const difficulty = DIFFICULTY_LABELS[archetype.difficulty];

  // Calculate accuracy percentage
  const accuracy = progress && progress.questionsAttempted > 0
    ? Math.round((progress.questionsCorrect / progress.questionsAttempted) * 100)
    : 0;

  // Mastery stars
  const masteryLevel = progress?.masteryLevel || 0;

  return (
    <Link href={`/nsw-selective/practice/${archetype.id}`}>
      <div className={`bg-white rounded-xl border ${colors.border} shadow-sm hover:shadow-md transition-all hover:scale-[1.02] p-4`}>
        {/* Header with ID and difficulty */}
        <div className="flex items-center justify-between mb-2">
          <span className={`text-xs font-mono ${colors.text} ${colors.bg} px-2 py-0.5 rounded`}>
            {archetype.id.toUpperCase()}
          </span>
          <span className={`text-xs ${difficulty.color}`}>
            {difficulty.label}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-gray-900 mb-1">{archetype.shortName}</h3>

        {/* Pattern description (if showing details) */}
        {showDetails && (
          <p className="text-xs text-gray-500 mb-2 line-clamp-2">{archetype.pattern}</p>
        )}

        {/* Visual indicator */}
        {archetype.visualRequired && (
          <div className="flex items-center gap-1 text-xs text-orange-600 mb-2">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Includes diagrams
          </div>
        )}

        {/* Progress section */}
        {progress ? (
          <div className="mt-3 pt-3 border-t border-gray-100">
            {/* Mastery stars */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    className={`w-4 h-4 ${star <= masteryLevel ? 'text-yellow-400 fill-current' : 'text-gray-200'}`}
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-xs text-gray-500">
                {progress.questionsAttempted} practiced
              </span>
            </div>

            {/* Accuracy bar */}
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    accuracy >= 80 ? 'bg-green-500' :
                    accuracy >= 60 ? 'bg-amber-500' :
                    accuracy >= 40 ? 'bg-orange-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${accuracy}%` }}
                />
              </div>
              <span className="text-xs font-medium text-gray-600">{accuracy}%</span>
            </div>

            {/* Average time */}
            {progress.averageTimeSeconds > 0 && (
              <div className="mt-1 text-xs text-gray-400">
                Avg: {Math.round(progress.averageTimeSeconds)}s
              </div>
            )}
          </div>
        ) : (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Not started yet
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}

// Compact version for smaller displays
export function ArchetypeCardCompact({ archetype, progress }: Omit<ArchetypeCardProps, 'showDetails'>) {
  const colors = CATEGORY_COLORS[archetype.category];
  const masteryLevel = progress?.masteryLevel || 0;

  return (
    <Link href={`/nsw-selective/practice/${archetype.id}`}>
      <div className={`${colors.bg} rounded-lg p-3 hover:opacity-80 transition-opacity`}>
        <div className="flex items-center justify-between">
          <div>
            <span className={`text-xs font-mono ${colors.text}`}>{archetype.id.toUpperCase()}</span>
            <p className="text-sm font-medium text-gray-900">{archetype.shortName}</p>
          </div>
          {masteryLevel > 0 && (
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <div
                  key={star}
                  className={`w-2 h-2 rounded-full ${star <= masteryLevel ? 'bg-yellow-400' : 'bg-gray-200'}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

export default ArchetypeCard;

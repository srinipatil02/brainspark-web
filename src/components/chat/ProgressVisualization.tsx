'use client';

import React from 'react';

interface ProgressVisualizationProps {
  questionsAsked: number;
  conceptsExplored?: number;
  currentStreak?: number;
}

/**
 * Progress bar and stats shown in chat header
 * Shows questions asked, concepts explored, and streak
 */
export function ProgressVisualization({
  questionsAsked,
  conceptsExplored = 0,
  currentStreak = 0,
}: ProgressVisualizationProps) {
  return (
    <div className="mt-3 pt-3 border-t border-white/20">
      <div className="flex items-center justify-between gap-4">
        {/* Questions asked */}
        <div className="flex items-center gap-1.5">
          <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-white/70" stroke="currentColor" strokeWidth="2">
            <path d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-xs text-white/80">
            {questionsAsked} {questionsAsked === 1 ? 'question' : 'questions'}
          </span>
        </div>

        {/* Concepts explored (if any) */}
        {conceptsExplored > 0 && (
          <div className="flex items-center gap-1.5">
            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-white/70" stroke="currentColor" strokeWidth="2">
              <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-xs text-white/80">
              {conceptsExplored} {conceptsExplored === 1 ? 'concept' : 'concepts'}
            </span>
          </div>
        )}

        {/* Streak badge */}
        {currentStreak > 0 && (
          <div className="flex items-center gap-1.5">
            <span className={`text-sm ${currentStreak >= 3 ? 'animate-pulse' : ''}`}>
              {currentStreak >= 7 ? '🔥' : currentStreak >= 3 ? '⚡' : '✨'}
            </span>
            <span className="text-xs text-white/80">
              {currentStreak} day{currentStreak !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      {/* Progress bar (engagement level) */}
      <div className="mt-2">
        <div className="h-1 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-white/60 rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(questionsAsked * 10, 100)}%`,
            }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-white/50">Getting started</span>
          <span className="text-[10px] text-white/50">Deep dive</span>
        </div>
      </div>

      {/* Achievement badge (show after 5+ questions) */}
      {questionsAsked >= 5 && (
        <div className="mt-2 flex items-center justify-center gap-1.5 px-2 py-1 bg-white/10 rounded-full">
          <span>🎯</span>
          <span className="text-[10px] text-white font-medium">
            {questionsAsked >= 10 ? 'Expert Explorer!' : 'Curious Learner!'}
          </span>
        </div>
      )}
    </div>
  );
}

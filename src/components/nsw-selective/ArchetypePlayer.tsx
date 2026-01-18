// =============================================================================
// ARCHETYPE PLAYER COMPONENT
// =============================================================================
// FILE: src/components/nsw-selective/ArchetypePlayer.tsx
// DOMAIN: NSW Selective Exam Prep
// PURPOSE: Display questions with methodology coaching for archetype practice
// DO NOT: Import curriculum components or use learningArc fields

'use client';

import { useState, useEffect, useCallback } from 'react';
import { FirestoreQuestion, ArchetypeId, FirestoreMCQOption, hasVisualContent } from '@/types';
import { ArchetypeDefinition, getArchetypeDefinition, DistractorType } from '@/types/nsw-selective';
import { useQuestionTimer, useQuestionSession, useArchetypeProgress } from '@/hooks/nsw-selective/useArchetypeProgress';
import { ArchetypeVisual } from '@/components/shared/QuestionVisual';
import {
  generateErrorFeedback,
  shouldTriggerIntervention,
  ErrorFeedback
} from '@/services/nsw-selective/errorFeedbackService';
import {
  generateSessionSummary,
  SessionSummary as FullSessionSummary
} from '@/services/nsw-selective/sessionSummaryService';
import {
  shouldTriggerAIFeedback,
  getAIDiagnosticFeedback,
  getAISessionAnalysis
} from '@/services/nsw-selective/aiTutoringService';
import {
  generateIntroLesson,
  generateSocraticIntervention,
  generateOnDemandExplanation,
  shouldTriggerMethodologyIntervention,
  MethodologyGuidance
} from '@/services/nsw-selective/methodologyCoachService';
import {
  generateAdaptiveHint,
  shouldOfferHint,
  AdaptiveHint
} from '@/services/nsw-selective/adaptiveHintService';
import { AIFeedbackPanel, InterventionModal } from '@/components/nsw-selective/AIFeedbackPanel';
import { SessionSummaryModal, AISessionAnalysis } from '@/components/nsw-selective/SessionSummaryModal';
import { MethodologyCoachModal } from '@/components/nsw-selective/MethodologyCoachModal';
import { SocraticChatModal } from '@/components/nsw-selective/SocraticChatModal';
import { ConceptExplainerModal } from '@/components/nsw-selective/ConceptExplainerModal';
import { TeachMeModal } from '@/components/nsw-selective/TeachMeModal';
import { ARCHETYPE_CATALOG } from '@/types/nsw-selective';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// =============================================================================
// TYPES
// =============================================================================

interface ArchetypePlayerProps {
  questions: FirestoreQuestion[];
  archetypeId: ArchetypeId;
  onComplete?: (summary: SessionSummary) => void;
  showMethodology?: boolean;
  showTimer?: boolean;
}

interface SessionSummary {
  totalQuestions: number;
  correctCount: number;
  accuracy: number;
  totalTimeSeconds: number;
  averageTimeSeconds: number;
}

type QuestionState = 'answering' | 'feedback' | 'complete';

// =============================================================================
// METHODOLOGY PANEL
// =============================================================================

function MethodologyPanel({
  archetype,
  isExpanded,
  onToggle
}: {
  archetype: ArchetypeDefinition;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-200 mb-6">
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <span className="font-medium text-purple-800">Methodology: {archetype.shortName}</span>
        </div>
        <svg
          className={`w-5 h-5 text-purple-600 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-4">
          {/* Pattern */}
          <div>
            <h4 className="text-sm font-medium text-purple-700 mb-1">The Pattern</h4>
            <p className="text-sm text-gray-700 bg-white/60 rounded-lg p-2">
              {archetype.pattern}
            </p>
          </div>

          {/* Approach */}
          <div>
            <h4 className="text-sm font-medium text-purple-700 mb-1">The Approach</h4>
            <p className="text-sm text-gray-700 bg-green-50 rounded-lg p-2 border border-green-200">
              {archetype.solutionApproach}
            </p>
          </div>

          {/* Common Errors */}
          <div>
            <h4 className="text-sm font-medium text-purple-700 mb-1">Watch Out For</h4>
            <ul className="space-y-1">
              {archetype.commonErrors.map((error, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                  <svg className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>{error}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// MCQ OPTIONS
// =============================================================================

interface MCQOptionsProps {
  options: FirestoreMCQOption[];
  selectedOption: string | null;
  showFeedback: boolean;
  onSelect: (optionId: string) => void;
  disabled: boolean;
}

function MCQOptions({ options, selectedOption, showFeedback, onSelect, disabled }: MCQOptionsProps) {
  return (
    <div className="space-y-3">
      {options.map((option) => {
        const isSelected = selectedOption === option.id;
        const isCorrect = option.isCorrect;

        let bgColor = 'bg-white hover:bg-gray-50';
        let borderColor = 'border-gray-200';
        let textColor = 'text-gray-900';

        if (showFeedback) {
          if (isCorrect) {
            bgColor = 'bg-green-50';
            borderColor = 'border-green-300';
            textColor = 'text-green-900';
          } else if (isSelected && !isCorrect) {
            bgColor = 'bg-red-50';
            borderColor = 'border-red-300';
            textColor = 'text-red-900';
          }
        } else if (isSelected) {
          bgColor = 'bg-purple-50';
          borderColor = 'border-purple-300';
        }

        return (
          <button
            key={option.id}
            onClick={() => !disabled && onSelect(option.id)}
            disabled={disabled}
            className={`w-full p-4 rounded-xl border-2 ${borderColor} ${bgColor} text-left transition-all ${
              disabled ? 'cursor-default' : 'cursor-pointer hover:shadow-sm'
            }`}
          >
            <div className="flex items-start gap-3">
              <span className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                showFeedback && isCorrect ? 'bg-green-500 text-white' :
                showFeedback && isSelected && !isCorrect ? 'bg-red-500 text-white' :
                isSelected ? 'bg-purple-500 text-white' :
                'bg-gray-100 text-gray-600'
              }`}>
                {option.id}
              </span>
              <div className="flex-1">
                <p className={`${textColor}`}>{option.text}</p>
                {showFeedback && isSelected && option.feedback && (
                  <p className={`mt-2 text-sm ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                    {option.feedback}
                  </p>
                )}
              </div>
              {showFeedback && isCorrect && (
                <svg className="w-6 h-6 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
              {showFeedback && isSelected && !isCorrect && (
                <svg className="w-6 h-6 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

// =============================================================================
// HINTS PANEL
// =============================================================================

interface HintsPanelProps {
  hints: FirestoreQuestion['hints'];
  visibleHintLevel: number;
  onRevealHint: () => void;
  adaptiveHint: AdaptiveHint | null;
  onRequestMethodologyHelp: () => void;
  onOpenSocraticChat: () => void;
  onOpenConceptExplainer: () => void;
  onOpenTeachMe: () => void;
  showAIButtons: boolean;
  showTeachMeButton: boolean; // Show when student is stuck (3+ wrong attempts or 3+ Socratic exchanges)
}

function HintsPanel({
  hints,
  visibleHintLevel,
  onRevealHint,
  adaptiveHint,
  onRequestMethodologyHelp,
  onOpenSocraticChat,
  onOpenConceptExplainer,
  onOpenTeachMe,
  showAIButtons,
  showTeachMeButton
}: HintsPanelProps) {
  const maxHints = hints?.length || 3;

  return (
    <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-200">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-amber-800 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          Need Help?
        </h4>
        <div className="flex items-center gap-2">
          <button
            onClick={onRequestMethodologyHelp}
            className="text-xs text-purple-600 hover:text-purple-800 font-medium px-2 py-1 bg-purple-50 rounded-lg"
          >
            Review Methodology
          </button>
          {visibleHintLevel < maxHints && (
            <button
              onClick={onRevealHint}
              className="text-sm text-amber-700 hover:text-amber-800 font-medium"
            >
              Get hint {visibleHintLevel + 1}
            </button>
          )}
        </div>
      </div>

      {/* AI Help Buttons */}
      {showAIButtons && (
        <div className="space-y-2 mb-3">
          <div className="flex gap-2">
            <button
              onClick={onOpenSocraticChat}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-indigo-100 text-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-200 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Get Coaching
            </button>
            <button
              onClick={onOpenConceptExplainer}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-200 transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
              Explain Concept
            </button>
          </div>

          {/* Teach Me Button - Shows when student is stuck */}
          {showTeachMeButton && (
            <button
              onClick={onOpenTeachMe}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-sm font-semibold hover:from-amber-600 hover:to-orange-600 transition-all shadow-md hover:shadow-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              🎓 Teach Me This Concept
            </button>
          )}
        </div>
      )}

      {/* Adaptive hints (personalized based on error history) */}
      {adaptiveHint && (
        <div
          className={`p-3 rounded-lg text-sm mb-2 ${
            adaptiveHint.revealsCriticalInfo
              ? 'bg-amber-100 border border-amber-300 text-amber-900'
              : adaptiveHint.isAdapted
                ? 'bg-purple-50 border border-purple-200 text-purple-900'
                : 'bg-white/60 text-gray-700'
          }`}
        >
          {adaptiveHint.isAdapted && (
            <span className="inline-block text-xs font-medium text-purple-600 bg-purple-100 px-2 py-0.5 rounded mb-1">
              Personalized for you
            </span>
          )}
          <p className="mt-1">{adaptiveHint.content}</p>
          {adaptiveHint.targetedGuidance && (
            <p className="mt-2 text-xs text-gray-600 italic">{adaptiveHint.targetedGuidance}</p>
          )}
        </div>
      )}

      {/* Static hints from question (fallback) */}
      {!adaptiveHint && hints && visibleHintLevel > 0 && (
        <div className="space-y-2">
          {hints.slice(0, visibleHintLevel).map((hint, i) => (
            <div
              key={i}
              className={`p-2 rounded-lg text-sm ${
                hint.revealsCriticalInfo
                  ? 'bg-amber-100 border border-amber-300 text-amber-900'
                  : 'bg-white/60 text-gray-700'
              }`}
            >
              <span className="font-medium text-amber-700">Hint {hint.level}: </span>
              {hint.content}
            </div>
          ))}
        </div>
      )}

      {visibleHintLevel === 0 && !adaptiveHint && (
        <p className="text-sm text-gray-500">Click "Get hint" for a personalized nudge in the right direction.</p>
      )}
    </div>
  );
}

// =============================================================================
// TIMER DISPLAY
// =============================================================================

function TimerDisplay({ seconds, targetSeconds }: { seconds: number; targetSeconds?: number }) {
  const isOverTime = targetSeconds && seconds > targetSeconds;

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`flex items-center gap-2 text-sm font-mono ${isOverTime ? 'text-amber-600' : 'text-gray-500'}`}>
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>{formatTime(seconds)}</span>
      {targetSeconds && (
        <span className="text-gray-400">/ {formatTime(targetSeconds)}</span>
      )}
    </div>
  );
}

// =============================================================================
// PROGRESS BAR
// =============================================================================

function ProgressBar({ current, total, remaining }: { current: number; total: number; remaining?: number }) {
  const percentage = (current / total) * 100;

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-purple-500 transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-sm text-gray-500 whitespace-nowrap">
        {current} / {total}
        {remaining !== undefined && remaining > 0 && (
          <span className="text-purple-600 ml-1">({remaining} left)</span>
        )}
      </span>
    </div>
  );
}

// =============================================================================
// RESUME SESSION MODAL
// =============================================================================

interface ResumeSessionModalProps {
  isOpen: boolean;
  existingSession: {
    currentIndex: number;
    totalQuestions: number;
    correctCount: number;
    incorrectCount: number;
    startedAt: string;
  };
  archetypeName: string;
  onResume: () => void;
  onStartFresh: () => void;
}

function ResumeSessionModal({
  isOpen,
  existingSession,
  archetypeName,
  onResume,
  onStartFresh,
}: ResumeSessionModalProps) {
  if (!isOpen) return null;

  const questionsAnswered = existingSession.currentIndex;
  const questionsRemaining = existingSession.totalQuestions - existingSession.currentIndex;
  const accuracy = questionsAnswered > 0
    ? Math.round((existingSession.correctCount / questionsAnswered) * 100)
    : 0;

  // Format time since started
  const startedAt = new Date(existingSession.startedAt);
  const timeSince = Math.floor((Date.now() - startedAt.getTime()) / (1000 * 60 * 60));
  const timeLabel = timeSince < 1 ? 'Less than an hour ago' :
    timeSince < 24 ? `${timeSince} hours ago` :
    `${Math.floor(timeSince / 24)} days ago`;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">
                Continue Your Session?
              </h3>
              <p className="text-sm text-purple-100">
                {archetypeName}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-600 mb-4">
            You have an unfinished practice session from <span className="font-medium">{timeLabel}</span>.
          </p>

          {/* Progress Summary */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-purple-600">{questionsAnswered}</p>
                <p className="text-xs text-gray-500">Answered</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-600">{questionsRemaining}</p>
                <p className="text-xs text-gray-500">Remaining</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{accuracy}%</p>
                <p className="text-xs text-gray-500">Accuracy</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={onResume}
              className="w-full px-6 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Continue Where I Left Off
            </button>
            <button
              onClick={onStartFresh}
              className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Start Fresh
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// SESSION COMPLETE
// =============================================================================

function SessionComplete({
  summary,
  archetype,
  onRestart
}: {
  summary: SessionSummary;
  archetype: ArchetypeDefinition;
  onRestart: () => void;
}) {
  const getAccuracyColor = () => {
    if (summary.accuracy >= 80) return 'text-green-600';
    if (summary.accuracy >= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
      <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-10 h-10 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>

      <h2 className="text-2xl font-bold text-gray-900 mb-2">Session Complete!</h2>
      <p className="text-gray-500 mb-6">{archetype.shortName} practice finished</p>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-gray-50 rounded-xl p-4">
          <p className={`text-3xl font-bold ${getAccuracyColor()}`}>{summary.accuracy}%</p>
          <p className="text-xs text-gray-500 mt-1">Accuracy</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-3xl font-bold text-purple-600">
            {summary.correctCount}/{summary.totalQuestions}
          </p>
          <p className="text-xs text-gray-500 mt-1">Correct</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-3xl font-bold text-blue-600">{summary.averageTimeSeconds}s</p>
          <p className="text-xs text-gray-500 mt-1">Avg Time</p>
        </div>
      </div>

      {/* Performance feedback */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4 mb-6 text-left">
        <h3 className="font-medium text-purple-800 mb-2">Tips for next time</h3>
        {summary.accuracy >= 80 ? (
          <p className="text-sm text-gray-700">
            Excellent work! You've demonstrated strong mastery of the {archetype.shortName} methodology.
            Consider trying more challenging questions or moving to another archetype.
          </p>
        ) : summary.accuracy >= 60 ? (
          <p className="text-sm text-gray-700">
            Good progress! Review the methodology approach and common errors before your next session.
            Focus on: {archetype.solutionApproach}
          </p>
        ) : (
          <p className="text-sm text-gray-700">
            Keep practicing! Remember the key approach: {archetype.solutionApproach}.
            Review the common traps to avoid: {archetype.commonErrors[0]}.
          </p>
        )}
      </div>

      <div className="flex justify-center gap-4">
        <button
          onClick={onRestart}
          className="px-6 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-colors"
        >
          Practice Again
        </button>
        <a
          href="/nsw-selective/practice"
          className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
        >
          Choose Another Type
        </a>
      </div>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function ArchetypePlayer({
  questions,
  archetypeId,
  onComplete,
  showMethodology = true,
  showTimer = true,
}: ArchetypePlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [questionState, setQuestionState] = useState<QuestionState>('answering');
  const [visibleHintLevel, setVisibleHintLevel] = useState(0);
  const [methodologyExpanded, setMethodologyExpanded] = useState(true);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [sessionSummary, setSessionSummary] = useState<SessionSummary | null>(null);
  const [fullSessionSummary, setFullSessionSummary] = useState<FullSessionSummary | null>(null);
  const [showSummaryModal, setShowSummaryModal] = useState(false);

  // AI Feedback state
  const [currentFeedback, setCurrentFeedback] = useState<ErrorFeedback | null>(null);
  const [showIntervention, setShowIntervention] = useState(false);
  const [interventionErrorType, setInterventionErrorType] = useState<DistractorType>('conceptual_error');
  const [sessionErrorHistory, setSessionErrorHistory] = useState<Partial<Record<DistractorType, number>>>({});
  const [isAIFeedbackLoading, setIsAIFeedbackLoading] = useState(false);
  const [isAIGenerated, setIsAIGenerated] = useState(false);
  const [previousFeedbackThisSession, setPreviousFeedbackThisSession] = useState<string[]>([]);

  // AI Session Analysis state
  const [aiSessionAnalysis, setAISessionAnalysis] = useState<AISessionAnalysis | null>(null);
  const [isAIAnalysisLoading, setIsAIAnalysisLoading] = useState(false);

  // Methodology Coach state
  const [showMethodologyCoach, setShowMethodologyCoach] = useState(false);
  const [methodologyGuidance, setMethodologyGuidance] = useState<MethodologyGuidance | null>(null);
  const [hasSeenIntro, setHasSeenIntro] = useState(false);
  const [consecutiveWrong, setConsecutiveWrong] = useState(0);
  const [hasShownTimeNudge, setHasShownTimeNudge] = useState(false); // 30-second nudge tracking

  // Adaptive Hints state
  const [currentAdaptiveHint, setCurrentAdaptiveHint] = useState<AdaptiveHint | null>(null);
  const [wrongOptionsThisQuestion, setWrongOptionsThisQuestion] = useState<string[]>([]);

  // Socratic Chat state
  const [showSocraticChat, setShowSocraticChat] = useState(false);
  const [hintsSeenThisQuestion, setHintsSeenThisQuestion] = useState<string[]>([]);

  // Concept Explainer state
  const [showConceptExplainer, setShowConceptExplainer] = useState(false);
  const [previousExplanationsSeen, setPreviousExplanationsSeen] = useState<string[]>([]);

  // Teach Me state
  const [showTeachMe, setShowTeachMe] = useState(false);
  const [socraticExchangeCount, setSocraticExchangeCount] = useState(0);

  const archetype = getArchetypeDefinition(archetypeId);

  // Get question IDs for session tracking
  const questionIds = questions.map(q => q.questionId);

  const timer = useQuestionTimer();
  const session = useQuestionSession(questions.length, archetypeId, questionIds);

  // Resume session state
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [sessionInitialized, setSessionInitialized] = useState(false);

  // Get persistent progress for error history
  const { progress: archetypeProgress } = useArchetypeProgress(archetypeId);

  // ==========================================================================
  // SESSION RESUME LOGIC
  // ==========================================================================

  // Check for existing session on mount and show resume modal if needed
  // IMPORTANT: Wait for session.hasCheckedSession before deciding what to do
  useEffect(() => {
    // Wait until the hook has finished checking for existing session
    if (!session.hasCheckedSession) return;

    if (!sessionInitialized && session.hasExistingSession && session.activeSession) {
      // Show resume modal
      setShowResumeModal(true);
    } else if (!sessionInitialized && !session.hasExistingSession) {
      // No existing session - start fresh automatically
      session.startNewSession(questionIds);
      setSessionInitialized(true);
    }
  }, [session.hasCheckedSession, session.hasExistingSession, session.activeSession, sessionInitialized, questionIds]);

  // Handle resume session
  const handleResumeSession = useCallback(() => {
    if (session.activeSession) {
      // Sync React state with persisted session
      setCurrentIndex(session.activeSession.currentIndex);
      session.resumeSession();
      setSessionInitialized(true);
      setShowResumeModal(false);
    }
  }, [session]);

  // Handle start fresh
  const handleStartFresh = useCallback(() => {
    setCurrentIndex(0);
    session.startNewSession(questionIds);
    setSessionInitialized(true);
    setShowResumeModal(false);
  }, [session, questionIds]);

  // Determine current question based on session state
  const currentQuestion = questions[currentIndex];

  // Show methodology intro on first load (if not already seen)
  useEffect(() => {
    if (!hasSeenIntro && showMethodology) {
      const introLesson = generateIntroLesson(archetypeId);
      setMethodologyGuidance(introLesson);
      setShowMethodologyCoach(true);
    }
  }, [archetypeId, hasSeenIntro, showMethodology]);

  // Start timer when question changes
  useEffect(() => {
    timer.reset();
    timer.start();
    setSelectedOption(null);
    setQuestionState('answering');
    setVisibleHintLevel(0);
    setCurrentAdaptiveHint(null);
    setWrongOptionsThisQuestion([]);
    setHintsSeenThisQuestion([]);
    setShowSocraticChat(false);
    setShowTeachMe(false);
    setSocraticExchangeCount(0);
    setHasShownTimeNudge(false); // Reset 30-second nudge for new question
  }, [currentIndex]);

  // 30-second coaching nudge - show guidance if student is stuck
  useEffect(() => {
    const NUDGE_THRESHOLD_SECONDS = 30;

    // Only trigger if: 30+ seconds passed, still answering, hasn't been shown, and have a question
    if (
      timer.elapsedSeconds >= NUDGE_THRESHOLD_SECONDS &&
      questionState === 'answering' &&
      !hasShownTimeNudge &&
      currentQuestion
    ) {
      setHasShownTimeNudge(true);

      // Generate a gentle nudge intervention
      const timeNudge = generateSocraticIntervention(archetypeId, {
        question: currentQuestion,
        errorHistory: sessionErrorHistory,
        previousAttempts: wrongOptionsThisQuestion,
        consecutiveWrong: 0, // Not from wrong answers - just time-based
        isTimeBasedNudge: true // Flag to indicate this is a time-based nudge
      });

      setMethodologyGuidance(timeNudge);
      setShowMethodologyCoach(true);
    }
  }, [timer.elapsedSeconds, questionState, hasShownTimeNudge, currentQuestion, archetypeId, sessionErrorHistory, wrongOptionsThisQuestion]);

  // Handle option selection
  const handleSelectOption = useCallback((optionId: string) => {
    if (questionState !== 'answering') return;
    setSelectedOption(optionId);
  }, [questionState]);

  // Handle answer submission
  const handleSubmit = useCallback(() => {
    if (!selectedOption || !currentQuestion.mcqOptions) return;

    timer.pause();
    const timeSpent = timer.getElapsed();
    const isCorrect = currentQuestion.mcqOptions.find(o => o.id === selectedOption)?.isCorrect || false;

    // Determine error type if incorrect
    const errorType = !isCorrect && currentQuestion.nswSelective?.distractorTypes?.[selectedOption]
      ? currentQuestion.nswSelective.distractorTypes[selectedOption]
      : undefined;

    session.recordAnswer(
      currentQuestion.questionId,
      isCorrect,
      timeSpent,
      selectedOption,
      errorType
    );

    // Generate AI feedback for wrong answers
    if (!isCorrect) {
      // Combine persistent and session error history
      const combinedErrorHistory: Partial<Record<DistractorType, number>> = {
        ...(archetypeProgress?.errorFrequency || {}),
        ...sessionErrorHistory
      };

      const errorTypeKey = errorType as DistractorType || 'conceptual_error';
      const recentCorrectStreak = session.session.correctCount > 0 ?
        session.session.answers.filter((a, i) =>
          i >= session.session.answers.length - session.session.correctCount && a.isCorrect
        ).length : 0;

      // Check if we should trigger TRUE AI feedback (Cloud Function)
      const aiTrigger = shouldTriggerAIFeedback({
        errorHistory: combinedErrorHistory,
        currentErrorType: errorTypeKey,
        attemptsOnCurrentQuestion: wrongOptionsThisQuestion.length + 1,
        sessionErrorCount: session.session.incorrectCount + 1,
        sessionQuestionCount: session.session.answers.length + 1
      });

      if (aiTrigger.shouldTrigger) {
        // Use TRUE AI for deeper feedback
        console.log(`[AI Tutoring] Triggering AI feedback: ${aiTrigger.reason}`);
        setIsAIFeedbackLoading(true);

        // Start with template feedback immediately, then upgrade if AI succeeds
        const templateFeedback = generateErrorFeedback({
          question: currentQuestion,
          selectedOption,
          errorHistory: combinedErrorHistory,
          currentStreak: recentCorrectStreak,
          masteryLevel: archetypeProgress?.masteryLevel || 1
        });
        setCurrentFeedback(templateFeedback);
        setIsAIGenerated(false);

        // Call AI in background
        getAIDiagnosticFeedback({
          question: currentQuestion,
          selectedOption,
          errorType: errorTypeKey,
          timeSpentSeconds: timeSpent,
          errorHistory: combinedErrorHistory,
          previousFeedbackThisSession,
          masteryLevel: archetypeProgress?.masteryLevel || 1,
          questionsAttemptedThisArchetype: archetypeProgress?.questionsAttempted || session.session.answers.length,
          recentCorrectStreak
        }).then(aiResponse => {
          // Upgrade to AI feedback (preserve template fields, override with AI response)
          setCurrentFeedback({
            ...templateFeedback,
            message: aiResponse.feedback,
            encouragement: aiResponse.encouragement,
            guidingQuestion: aiResponse.guidingQuestion,
            methodologyReminder: aiResponse.suggestedNextStep
          });
          setIsAIGenerated(aiResponse.isAIGenerated);
          setPreviousFeedbackThisSession(prev => [...prev, aiResponse.feedback]);
          if (aiResponse.processingTime) {
            console.log(`[AI Tutoring] AI response in ${aiResponse.processingTime}ms`);
          }
        }).catch(err => {
          console.warn('[AI Tutoring] AI feedback failed, keeping template:', err);
        }).finally(() => {
          setIsAIFeedbackLoading(false);
        });
      } else {
        // Use template-based feedback (first occurrence of error)
        const feedback = generateErrorFeedback({
          question: currentQuestion,
          selectedOption,
          errorHistory: combinedErrorHistory,
          currentStreak: recentCorrectStreak,
          masteryLevel: archetypeProgress?.masteryLevel || 1
        });
        setCurrentFeedback(feedback);
        setIsAIGenerated(false);
      }

      // Update session error history (errorTypeKey already declared above)
      setSessionErrorHistory(prev => ({
        ...prev,
        [errorTypeKey]: (prev[errorTypeKey] || 0) + 1
      }));

      // Check if we should trigger an intervention
      const intervention = shouldTriggerIntervention(
        { ...combinedErrorHistory, [errorTypeKey]: (combinedErrorHistory[errorTypeKey] || 0) + 1 },
        session.session.incorrectCount + 1,
        session.session.answers.length + 1
      );

      if (intervention.shouldIntervene && intervention.focusErrorType) {
        setInterventionErrorType(intervention.focusErrorType);
        setShowIntervention(true);
      }

      // Track consecutive wrong answers
      setConsecutiveWrong(prev => prev + 1);
      setWrongOptionsThisQuestion(prev => [...prev, selectedOption]);

      // Check if we should trigger methodology intervention
      const sessionAnswers = session.session.answers;
      const sessionAccuracy = sessionAnswers.length > 0
        ? (sessionAnswers.filter(a => a.isCorrect).length / sessionAnswers.length) * 100
        : 0;

      if (shouldTriggerMethodologyIntervention(
        consecutiveWrong + 1,
        sessionAccuracy,
        sessionAnswers.length + 1
      )) {
        const intervention = generateSocraticIntervention(archetypeId, {
          question: currentQuestion,
          errorHistory: combinedErrorHistory,
          previousAttempts: wrongOptionsThisQuestion,
          consecutiveWrong: consecutiveWrong + 1
        });
        setMethodologyGuidance(intervention);
        // Show methodology coach after a short delay to not overwhelm
        setTimeout(() => setShowMethodologyCoach(true), 500);
      }
    } else {
      setCurrentFeedback(null);
      setConsecutiveWrong(0); // Reset consecutive wrong on correct answer
    }

    setQuestionState('feedback');
  }, [selectedOption, currentQuestion, timer, session, archetypeProgress, sessionErrorHistory, consecutiveWrong, wrongOptionsThisQuestion, archetypeId]);

  // Handle next question
  const handleNext = useCallback(() => {
    // Clear AI feedback when moving to next question
    setCurrentFeedback(null);

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      session.nextQuestion();
    } else {
      // Session complete
      const basicSummary = session.getSessionSummary();
      const completeSummary: SessionSummary = {
        totalQuestions: questions.length,
        correctCount: session.session.correctCount,
        accuracy: basicSummary.accuracy,
        totalTimeSeconds: basicSummary.totalTime,
        averageTimeSeconds: basicSummary.averageTime,
      };
      setSessionSummary(completeSummary);

      // Generate full AI-powered session summary (template-based)
      const fullSummary = generateSessionSummary({
        archetypeId,
        answers: session.session.answers,
        questions,
        previousProgress: archetypeProgress,
        totalSessionTime: basicSummary.totalTime
      });
      setFullSessionSummary(fullSummary);
      setShowSummaryModal(true);

      // Also trigger TRUE AI session analysis for deeper insights
      if (session.session.answers.length >= 3) {
        console.log('[AI Tutoring] Requesting AI session analysis...');
        setIsAIAnalysisLoading(true);

        getAISessionAnalysis({
          archetypeId,
          sessionStartTime: Date.now() - (basicSummary.totalTime * 1000),
          sessionEndTime: Date.now(),
          answers: session.session.answers.map((answer, idx) => {
            const q = questions[idx];
            const correctOption = q?.mcqOptions?.find(o => o.isCorrect);
            return {
              questionId: answer.questionId,
              stem: q?.stem || '',
              correctAnswer: correctOption?.text || '',
              studentAnswer: q?.mcqOptions?.find(o => o.id === answer.selectedOption)?.text || '',
              isCorrect: answer.isCorrect,
              timeSeconds: answer.timeSeconds,
              errorType: answer.errorType as DistractorType | undefined,
              hintsUsed: 0, // Would need to track this
            };
          }),
          previousProgress: archetypeProgress,
        }).then(aiAnalysis => {
          console.log('[AI Tutoring] AI analysis received:', aiAnalysis.success ? aiAnalysis.progressIndicator : 'failed');
          setAISessionAnalysis(aiAnalysis);
        }).catch(err => {
          console.warn('[AI Tutoring] AI session analysis failed:', err);
          setAISessionAnalysis({ success: false, error: 'Analysis unavailable' });
        }).finally(() => {
          setIsAIAnalysisLoading(false);
        });
      }

      setSessionComplete(true);
      onComplete?.(completeSummary);
    }
  }, [currentIndex, questions.length, session, onComplete, archetypeId, archetypeProgress, questions]);

  // Handle restart
  const handleRestart = useCallback(() => {
    setCurrentIndex(0);
    setSessionComplete(false);
    setSessionSummary(null);
    setFullSessionSummary(null);
    setShowSummaryModal(false);
    setCurrentFeedback(null);
    setSessionErrorHistory({});
    setConsecutiveWrong(0);
    setCurrentAdaptiveHint(null);
    setWrongOptionsThisQuestion([]);
    setIsAIFeedbackLoading(false);
    setIsAIGenerated(false);
    setPreviousFeedbackThisSession([]);
    // Clear AI session analysis state
    setAISessionAnalysis(null);
    setIsAIAnalysisLoading(false);
    // Clear Socratic/Concept explainer state
    setShowSocraticChat(false);
    setHintsSeenThisQuestion([]);
    setShowConceptExplainer(false);
    setPreviousExplanationsSeen([]);
    // Clear Teach Me state
    setShowTeachMe(false);
    setSocraticExchangeCount(0);
    // Start a new session (clears storage and creates fresh session)
    session.startNewSession(questionIds);
  }, [session, questionIds]);

  // Handle reveal hint - uses adaptive hint service
  const handleRevealHint = useCallback(() => {
    // Combine error history
    const combinedErrorHistory: Partial<Record<DistractorType, number>> = {
      ...(archetypeProgress?.errorFrequency || {}),
      ...sessionErrorHistory
    };

    // Generate adaptive hint
    const adaptiveHint = generateAdaptiveHint({
      question: currentQuestion,
      archetypeId,
      errorHistory: combinedErrorHistory,
      attemptsOnCurrentQuestion: wrongOptionsThisQuestion.length,
      selectedWrongOptions: wrongOptionsThisQuestion,
      masteryLevel: archetypeProgress?.masteryLevel || 1,
      hintsUsedThisQuestion: visibleHintLevel
    });

    setCurrentAdaptiveHint(adaptiveHint);
    setVisibleHintLevel(prev => prev + 1);
  }, [currentQuestion, archetypeId, archetypeProgress, sessionErrorHistory, wrongOptionsThisQuestion, visibleHintLevel]);

  // Handle request for methodology help (on-demand)
  const handleRequestMethodologyHelp = useCallback(() => {
    const explanation = generateOnDemandExplanation(archetypeId);
    setMethodologyGuidance(explanation);
    setShowMethodologyCoach(true);
  }, [archetypeId]);

  // Handle closing methodology coach
  const handleCloseMethodologyCoach = useCallback(() => {
    setShowMethodologyCoach(false);
    if (!hasSeenIntro) {
      setHasSeenIntro(true);
    }
  }, [hasSeenIntro]);

  // Session complete screen
  if (sessionComplete && sessionSummary) {
    return (
      <SessionComplete
        summary={sessionSummary}
        archetype={archetype}
        onRestart={handleRestart}
      />
    );
  }

  // No questions
  if (questions.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
        <p className="text-gray-500">No questions available for this archetype yet.</p>
        <a
          href="/nsw-selective/practice"
          className="mt-4 inline-block px-4 py-2 bg-purple-600 text-white rounded-lg text-sm"
        >
          Back to Practice
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Progress and Timer */}
      <div className="flex items-center justify-between">
        <ProgressBar current={currentIndex + 1} total={questions.length} remaining={session.questionsRemaining} />
        {showTimer && (
          <TimerDisplay
            seconds={timer.elapsedSeconds}
            targetSeconds={currentQuestion.nswSelective?.timeTarget}
          />
        )}
      </div>

      {/* Methodology Panel */}
      {showMethodology && (
        <MethodologyPanel
          archetype={archetype}
          isExpanded={methodologyExpanded}
          onToggle={() => setMethodologyExpanded(!methodologyExpanded)}
        />
      )}

      {/* Question Card */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        {/* Question stem */}
        <div className="mb-6">
          <p className="text-lg text-gray-900 leading-relaxed">
            {currentQuestion.stem}
          </p>
        </div>

        {/* Visual content (diagrams, charts, images) */}
        <ArchetypeVisual question={currentQuestion} className="mb-6" />

        {/* MCQ Options */}
        {currentQuestion.mcqOptions && (
          <MCQOptions
            options={currentQuestion.mcqOptions}
            selectedOption={selectedOption}
            showFeedback={questionState === 'feedback'}
            onSelect={handleSelectOption}
            disabled={questionState !== 'answering'}
          />
        )}

        {/* Hints (only during answering) */}
        {questionState === 'answering' && (
          <HintsPanel
            hints={currentQuestion.hints}
            visibleHintLevel={visibleHintLevel}
            onRevealHint={handleRevealHint}
            adaptiveHint={currentAdaptiveHint}
            onRequestMethodologyHelp={handleRequestMethodologyHelp}
            onOpenSocraticChat={() => setShowSocraticChat(true)}
            onOpenConceptExplainer={() => setShowConceptExplainer(true)}
            onOpenTeachMe={() => setShowTeachMe(true)}
            showAIButtons={wrongOptionsThisQuestion.length > 0 || timer.elapsedSeconds > 90}
            showTeachMeButton={wrongOptionsThisQuestion.length >= 3 || socraticExchangeCount >= 3}
          />
        )}

        {/* AI Feedback Panel (after wrong answer) */}
        {questionState === 'feedback' && currentFeedback && (
          <AIFeedbackPanel
            feedback={currentFeedback}
            isVisible={true}
            showMethodology={true}
            className="mt-6"
            isAIGenerated={isAIGenerated}
            isLoading={isAIFeedbackLoading}
          />
        )}

        {/* Solution (after answering) */}
        {questionState === 'feedback' && currentQuestion.solution && (
          <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
            <h4 className="text-sm font-medium text-blue-800 mb-2">Solution</h4>
            <div className="text-sm text-gray-700 prose prose-sm prose-slate max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {currentQuestion.solution}
              </ReactMarkdown>
            </div>
          </div>
        )}

        {/* Methodology Steps (after answering) */}
        {questionState === 'feedback' && currentQuestion.nswSelective?.methodologySteps && (
          <div className="mt-4 p-4 bg-purple-50 rounded-xl border border-purple-200">
            <h4 className="text-sm font-medium text-purple-800 mb-2">Methodology Steps</h4>
            <ol className="list-decimal list-inside space-y-1">
              {currentQuestion.nswSelective.methodologySteps.map((step, i) => (
                <li key={i} className="text-sm text-gray-700">{step}</li>
              ))}
            </ol>
          </div>
        )}

        {/* Action Button */}
        <div className="mt-6 flex justify-end">
          {questionState === 'answering' ? (
            <button
              onClick={handleSubmit}
              disabled={!selectedOption}
              className={`px-6 py-3 rounded-xl font-medium transition-colors ${
                selectedOption
                  ? 'bg-purple-600 text-white hover:bg-purple-700'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              Check Answer
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="px-6 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-colors"
            >
              {currentIndex < questions.length - 1 ? 'Next Question' : 'Finish Session'}
            </button>
          )}
        </div>
      </div>

      {/* Intervention Modal - shows when error pattern detected */}
      <InterventionModal
        isOpen={showIntervention}
        onClose={() => setShowIntervention(false)}
        errorType={interventionErrorType}
        errorCount={sessionErrorHistory[interventionErrorType] || 0}
        methodologySteps={currentQuestion.nswSelective?.methodologySteps}
      />

      {/* Session Summary Modal - shows at end of session */}
      {fullSessionSummary && (
        <SessionSummaryModal
          isOpen={showSummaryModal}
          onClose={() => setShowSummaryModal(false)}
          summary={fullSessionSummary}
          archetypeId={archetypeId}
          onPracticeAgain={handleRestart}
          aiAnalysis={aiSessionAnalysis}
          isAIAnalysisLoading={isAIAnalysisLoading}
        />
      )}

      {/* Methodology Coach Modal - intro, intervention, or on-demand */}
      {methodologyGuidance && (
        <MethodologyCoachModal
          isOpen={showMethodologyCoach}
          onClose={handleCloseMethodologyCoach}
          guidance={methodologyGuidance}
          onStartPractice={handleCloseMethodologyCoach}
        />
      )}

      {/* Socratic Chat Modal - AI-powered guided questioning */}
      {currentQuestion && (
        <SocraticChatModal
          isOpen={showSocraticChat}
          onClose={() => setShowSocraticChat(false)}
          question={currentQuestion}
          correctAnswer={currentQuestion.mcqOptions?.find(o => o.isCorrect)?.text || ''}
          wrongAnswersSelected={wrongOptionsThisQuestion}
          hintsAlreadySeen={hintsSeenThisQuestion}
          timeOnQuestionSeconds={timer.elapsedSeconds}
          masteryLevel={archetypeProgress?.masteryLevel || 1}
          onInsightGained={() => {
            console.log('[AI Tutoring] Student gained insight from Socratic chat');
          }}
          onExchangeComplete={() => {
            setSocraticExchangeCount(prev => prev + 1);
            console.log('[AI Tutoring] Socratic exchange completed');
          }}
        />
      )}

      {/* Concept Explainer Modal - Multi-modal explanations */}
      <ConceptExplainerModal
        isOpen={showConceptExplainer}
        onClose={() => setShowConceptExplainer(false)}
        conceptName={archetype.shortName}
        conceptDefinition={archetype.pattern}
        methodology={archetype.solutionApproach.split('.').filter(s => s.trim())}
        examples={archetype.commonErrors}
        previousExplanationsSeen={previousExplanationsSeen}
        preferredLearningStyle={undefined}
        relatedConceptsMastered={[]}
        specificConfusion={undefined}
        onExplanationViewed={(type) => {
          setPreviousExplanationsSeen(prev => [...prev, type]);
          console.log(`[AI Tutoring] Student viewed ${type} explanation`);
        }}
      />

      {/* Teach Me Modal - Direct teaching mode for stuck students */}
      {currentQuestion && (
        <TeachMeModal
          isOpen={showTeachMe}
          onClose={() => setShowTeachMe(false)}
          question={currentQuestion}
          wrongAnswersSelected={wrongOptionsThisQuestion}
          hintsAlreadySeen={visibleHintLevel}
          timeOnQuestionSeconds={timer.elapsedSeconds}
          socraticExchanges={socraticExchangeCount}
          masteryLevel={archetypeProgress?.masteryLevel || 1}
          onTeachingCompleted={() => {
            console.log('[AI Tutoring] Student completed Teach Me session');
          }}
        />
      )}

      {/* Resume Session Modal - when returning to an in-progress session */}
      {session.activeSession && (
        <ResumeSessionModal
          isOpen={showResumeModal}
          existingSession={{
            currentIndex: session.activeSession.currentIndex,
            totalQuestions: session.activeSession.questionIds.length,
            correctCount: session.activeSession.correctCount,
            incorrectCount: session.activeSession.incorrectCount,
            startedAt: session.activeSession.startedAt,
          }}
          archetypeName={archetype.shortName}
          onResume={handleResumeSession}
          onStartFresh={handleStartFresh}
        />
      )}
    </div>
  );
}

export default ArchetypePlayer;

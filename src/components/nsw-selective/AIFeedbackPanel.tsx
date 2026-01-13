// =============================================================================
// AI FEEDBACK PANEL COMPONENT
// =============================================================================
// FILE: src/components/nsw-selective/AIFeedbackPanel.tsx
// DOMAIN: NSW Selective Exam Prep - AI Tutoring
// PURPOSE: Display personalized, error-type-aware feedback for wrong answers
// DO NOT: Show correct answers, be discouraging, or use generic feedback

'use client';

import { useState } from 'react';
import { ErrorFeedback } from '@/services/nsw-selective/errorFeedbackService';

// =============================================================================
// TYPES
// =============================================================================

interface AIFeedbackPanelProps {
  feedback: ErrorFeedback;
  isVisible: boolean;
  onDismiss?: () => void;
  showMethodology?: boolean;
  className?: string;
  isAIGenerated?: boolean;
  isLoading?: boolean;
}

// =============================================================================
// ICON COMPONENTS
// =============================================================================

function LightbulbIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  );
}

function BrainIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

function HeartIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  );
}

function AlertIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function AIFeedbackPanel({
  feedback,
  isVisible,
  onDismiss,
  showMethodology = true,
  className = '',
  isAIGenerated = false,
  isLoading = false
}: AIFeedbackPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!isVisible) return null;

  return (
    <div className={`ai-feedback-panel rounded-xl border-2 overflow-hidden transition-all duration-300 ${
      feedback.isRepeatError
        ? 'border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50'
        : 'border-indigo-300 bg-gradient-to-r from-indigo-50 to-purple-50'
    } ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-opacity-30 border-current">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            feedback.isRepeatError ? 'bg-amber-200' : 'bg-indigo-200'
          }`}>
            {isLoading ? (
              <svg className="w-4 h-4 animate-spin text-indigo-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : feedback.isRepeatError ? (
              <AlertIcon className={`w-4 h-4 ${feedback.isRepeatError ? 'text-amber-700' : 'text-indigo-700'}`} />
            ) : (
              <LightbulbIcon className={`w-4 h-4 ${feedback.isRepeatError ? 'text-amber-700' : 'text-indigo-700'}`} />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className={`font-semibold text-sm ${
                feedback.isRepeatError ? 'text-amber-800' : 'text-indigo-800'
              }`}>
                {feedback.isRepeatError ? 'Pattern Detected' : 'Learning Moment'}
              </h4>
              {isAIGenerated && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-[10px] font-semibold rounded-full">
                  <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                  AI
                </span>
              )}
            </div>
            {feedback.isRepeatError && (
              <p className="text-xs text-amber-600">
                Error type seen {feedback.errorCount} times
              </p>
            )}
            {isLoading && (
              <p className="text-xs text-indigo-500">
                Generating personalized feedback...
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`p-1 rounded hover:bg-white/50 ${
              feedback.isRepeatError ? 'text-amber-600' : 'text-indigo-600'
            }`}
          >
            <svg
              className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className={`p-1 rounded hover:bg-white/50 ${
                feedback.isRepeatError ? 'text-amber-600' : 'text-indigo-600'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Encouragement - Always first */}
          <div className="flex items-start gap-3 p-3 bg-white/60 rounded-lg">
            <HeartIcon className="w-5 h-5 text-pink-500 flex-shrink-0 mt-0.5" />
            <p className="text-gray-700 text-sm">
              {feedback.encouragement}
            </p>
          </div>

          {/* Main message - What happened */}
          <div className="space-y-2">
            <h5 className={`text-sm font-medium ${
              feedback.isRepeatError ? 'text-amber-800' : 'text-indigo-800'
            }`}>
              What happened:
            </h5>
            <p className={`text-sm ${
              feedback.isRepeatError ? 'text-amber-700' : 'text-indigo-700'
            }`}>
              {feedback.message}
            </p>
          </div>

          {/* Repeat context - If applicable */}
          {feedback.isRepeatError && feedback.repeatContext && (
            <div className="p-3 bg-amber-100 rounded-lg border border-amber-200">
              <div className="flex items-start gap-2">
                <AlertIcon className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800 mb-1">
                    Breaking the pattern:
                  </p>
                  <p className="text-sm text-amber-700">
                    {feedback.repeatContext}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Guiding question - Socratic prompt */}
          {feedback.guidingQuestion && (
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start gap-2">
                <span className="text-blue-500 text-lg">?</span>
                <div>
                  <p className="text-sm font-medium text-blue-800 mb-1">
                    Think about this:
                  </p>
                  <p className="text-sm text-blue-700 italic">
                    {feedback.guidingQuestion}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Methodology reminder */}
          {showMethodology && feedback.methodologyReminder && (
            <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex items-start gap-2">
                <BrainIcon className="w-4 h-4 text-purple-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-purple-700">
                  {feedback.methodologyReminder}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// COMPACT FEEDBACK (for inline display)
// =============================================================================

interface CompactFeedbackProps {
  feedback: ErrorFeedback;
  className?: string;
}

export function CompactFeedback({ feedback, className = '' }: CompactFeedbackProps) {
  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg ${
      feedback.isRepeatError
        ? 'bg-amber-50 border border-amber-200'
        : 'bg-indigo-50 border border-indigo-200'
    } ${className}`}>
      <LightbulbIcon className={`w-5 h-5 flex-shrink-0 ${
        feedback.isRepeatError ? 'text-amber-500' : 'text-indigo-500'
      }`} />
      <div className="flex-1 min-w-0">
        <p className={`text-sm ${
          feedback.isRepeatError ? 'text-amber-700' : 'text-indigo-700'
        }`}>
          {feedback.message}
        </p>
        {feedback.guidingQuestion && (
          <p className="text-xs text-gray-500 mt-1 italic">
            {feedback.guidingQuestion}
          </p>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// INTERVENTION MODAL
// =============================================================================

interface InterventionModalProps {
  isOpen: boolean;
  onClose: () => void;
  errorType: string;
  errorCount: number;
  methodologySteps?: string[];
}

export function InterventionModal({
  isOpen,
  onClose,
  errorType,
  errorCount,
  methodologySteps
}: InterventionModalProps) {
  if (!isOpen) return null;

  const errorDescriptions: Record<string, string> = {
    forward_calculation: 'working in the wrong direction',
    partial_solution: 'stopping before completing all steps',
    wrong_operation: 'choosing the wrong mathematical operation',
    computation_error: 'making calculation mistakes',
    sign_error: 'getting positive/negative signs mixed up',
    unit_confusion: 'mixing up or forgetting units',
    off_by_one: 'counting boundary errors',
    misconception_answer: 'a conceptual misunderstanding',
    misread_question: 'missing details in the question',
    conceptual_error: 'a concept that needs review',
    setup_error: 'problem setup issues'
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <AlertIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">
                Let's Pause and Reflect
              </h3>
              <p className="text-sm text-amber-100">
                I've noticed a pattern we should address
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-gray-700">
            We've seen <span className="font-semibold text-amber-600">{errorDescriptions[errorType] || errorType}</span> come up <span className="font-semibold">{errorCount} times</span> now.
            This is actually valuable - it means we've found something specific to work on!
          </p>

          {methodologySteps && methodologySteps.length > 0 && (
            <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
              <h4 className="text-sm font-semibold text-purple-800 mb-2 flex items-center gap-2">
                <BrainIcon className="w-4 h-4" />
                Quick Methodology Review
              </h4>
              <ol className="list-decimal list-inside space-y-1">
                {methodologySteps.slice(0, 4).map((step, i) => (
                  <li key={i} className="text-sm text-purple-700">
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          )}

          <div className="bg-green-50 rounded-xl p-4 border border-green-200">
            <p className="text-sm text-green-700">
              <span className="font-semibold">Good news:</span> Recognizing a pattern is the first step to fixing it.
              For the next few questions, try to consciously apply each methodology step before solving.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-medium hover:from-purple-700 hover:to-indigo-700 transition-all"
          >
            Got it! Let's continue
          </button>
        </div>
      </div>
    </div>
  );
}

export default AIFeedbackPanel;

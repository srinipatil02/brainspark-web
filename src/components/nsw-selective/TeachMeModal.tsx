// =============================================================================
// TEACH ME MODAL COMPONENT
// =============================================================================
// FILE: src/components/nsw-selective/TeachMeModal.tsx
// DOMAIN: NSW Selective Exam Prep - AI Tutoring
// PURPOSE: Direct teaching mode when students need more than Socratic questioning
// GOAL: Make concepts click with relatable analogies and worked examples

'use client';

import { useState, useEffect } from 'react';
import { getAITeachMe, TeachMeResponse } from '@/services/nsw-selective/aiTutoringService';
import { FirestoreQuestion } from '@/types';

// =============================================================================
// TYPES
// =============================================================================

interface TeachMeModalProps {
  isOpen: boolean;
  onClose: () => void;
  question: FirestoreQuestion;
  wrongAnswersSelected: string[];
  hintsAlreadySeen: number;
  timeOnQuestionSeconds: number;
  socraticExchanges: number;
  masteryLevel: number;
  onTeachingCompleted?: () => void;
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

function BookOpenIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  );
}

function WarningIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );
}

function ArrowRightIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
    </svg>
  );
}

function SparklesIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
    </svg>
  );
}

function HeartIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
    </svg>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="w-20 h-20 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full flex items-center justify-center mb-4 animate-pulse">
        <BookOpenIcon className="w-10 h-10 text-emerald-600" />
      </div>
      <p className="text-gray-700 font-medium text-lg">Let me teach you this...</p>
      <p className="text-sm text-gray-500 mt-2">Creating a personalized explanation just for you</p>
      <div className="mt-4 flex gap-1">
        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  );
}

// =============================================================================
// SECTION COMPONENTS
// =============================================================================

function KeyInsightSection({ insight }: { insight: string }) {
  return (
    <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-2xl p-5 mb-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
          <LightbulbIcon className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <h4 className="font-semibold text-amber-800 mb-1">The Key Insight</h4>
          <p className="text-amber-900 text-lg leading-relaxed">{insight}</p>
        </div>
      </div>
    </div>
  );
}

function RelatableSection({ relatable }: {
  relatable: { setup: string; connection: string; whyItMatters: string }
}) {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-5 mb-4">
      <h4 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
        <span className="text-xl">🎯</span> Think of it like this...
      </h4>
      <div className="space-y-3">
        <p className="text-blue-900 text-base leading-relaxed italic">
          &quot;{relatable.setup}&quot;
        </p>
        <p className="text-blue-800 text-sm">
          <span className="font-medium">How it connects:</span> {relatable.connection}
        </p>
        <p className="text-blue-700 text-sm bg-blue-100 rounded-lg px-3 py-2">
          <span className="font-medium">Why this helps:</span> {relatable.whyItMatters}
        </p>
      </div>
    </div>
  );
}

function WorkedExampleSection({ example }: {
  example: {
    problemStatement: string;
    stepByStep: Array<{ stepNumber: number; action: string; result: string; insight: string }>;
    finalAnswer: string;
    keyTakeaway: string;
  }
}) {
  return (
    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-5 mb-4">
      <h4 className="font-semibold text-emerald-800 mb-3 flex items-center gap-2">
        <span className="text-xl">📝</span> Watch me solve a similar problem
      </h4>

      {/* Problem Statement */}
      <div className="bg-white border border-emerald-200 rounded-xl p-4 mb-4">
        <p className="text-emerald-900 font-medium">{example.problemStatement}</p>
      </div>

      {/* Steps */}
      <div className="space-y-3 mb-4">
        {example.stepByStep.map((step, index) => (
          <div key={index} className="bg-white rounded-xl p-4 border border-emerald-100">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-emerald-700">
                {step.stepNumber}
              </div>
              <div className="flex-1">
                <p className="text-gray-700 font-medium">{step.action}</p>
                <p className="text-emerald-600 font-mono text-sm mt-1 bg-emerald-50 rounded px-2 py-1 inline-block">
                  {step.result}
                </p>
                <p className="text-gray-600 text-sm mt-2 italic">{step.insight}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Final Answer */}
      <div className="bg-emerald-100 rounded-xl p-4 mb-3">
        <p className="text-emerald-800">
          <span className="font-semibold">Answer:</span> {example.finalAnswer}
        </p>
      </div>

      {/* Key Takeaway */}
      <div className="bg-white border-2 border-emerald-300 border-dashed rounded-xl p-3">
        <p className="text-emerald-700 text-sm">
          <span className="font-semibold">🔑 Remember:</span> {example.keyTakeaway}
        </p>
      </div>
    </div>
  );
}

function TrapToAvoidSection({ trap }: {
  trap: { trap: string; whyTempting: string; howToAvoid: string }
}) {
  return (
    <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-2xl p-5 mb-4">
      <h4 className="font-semibold text-red-800 mb-3 flex items-center gap-2">
        <WarningIcon className="w-5 h-5 text-red-600" />
        <span>Trap to Avoid</span>
      </h4>
      <div className="space-y-3">
        <div className="bg-white rounded-lg p-3 border border-red-200">
          <p className="text-red-800 font-medium">{trap.trap}</p>
        </div>
        <p className="text-red-700 text-sm">
          <span className="font-medium">Why it&apos;s tempting:</span> {trap.whyTempting}
        </p>
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-green-800 text-sm">
            <span className="font-medium">How to avoid it:</span> {trap.howToAvoid}
          </p>
        </div>
      </div>
    </div>
  );
}

function TryYourProblemSection({ prompt }: { prompt: string }) {
  return (
    <div className="bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-200 rounded-2xl p-5 mb-4">
      <h4 className="font-semibold text-purple-800 mb-2 flex items-center gap-2">
        <ArrowRightIcon className="w-5 h-5 text-purple-600" />
        <span>🚀 Now try YOUR problem!</span>
      </h4>
      <p className="text-purple-900 text-base leading-relaxed">{prompt}</p>
    </div>
  );
}

function EncouragementSection({ message }: { message: string }) {
  return (
    <div className="bg-gradient-to-r from-pink-50 to-rose-50 border border-pink-200 rounded-2xl p-4">
      <div className="flex items-center gap-2 text-pink-800">
        <HeartIcon className="w-5 h-5 text-pink-500" />
        <p className="text-sm">{message}</p>
      </div>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function TeachMeModal({
  isOpen,
  onClose,
  question,
  wrongAnswersSelected,
  hintsAlreadySeen,
  timeOnQuestionSeconds,
  socraticExchanges,
  masteryLevel,
  onTeachingCompleted,
}: TeachMeModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<TeachMeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch teaching content when modal opens
  useEffect(() => {
    if (isOpen && !response) {
      fetchTeaching();
    }
  }, [isOpen]);

  const fetchTeaching = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await getAITeachMe({
        question,
        wrongAnswersSelected,
        hintsAlreadySeen,
        timeOnQuestionSeconds,
        socraticExchanges,
        masteryLevel,
      });

      if (result.success) {
        setResponse(result);
      } else {
        setError(result.error || 'Failed to generate teaching content');
      }
    } catch (err) {
      console.error('Teaching request failed:', err);
      setError('Could not connect to AI service');
    }

    setIsLoading(false);
  };

  const handleClose = () => {
    onTeachingCompleted?.();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <SparklesIcon className="w-5 h-5 text-emerald-200" />
                <span className="text-emerald-100 text-sm font-medium">AI Teacher</span>
              </div>
              <h3 className="text-2xl font-bold text-white">
                Let me teach you this! 📚
              </h3>
              <p className="text-emerald-100 text-sm mt-1">
                A worked example with different numbers - you&apos;ll still solve yours!
              </p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <LoadingSpinner />
          ) : error ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <WarningIcon className="w-8 h-8 text-red-500" />
              </div>
              <p className="text-gray-600 font-medium">{error}</p>
              <button
                onClick={fetchTeaching}
                className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : response ? (
            <div className="space-y-2">
              {/* Key Insight - Always show first */}
              {response.keyInsight && (
                <KeyInsightSection insight={response.keyInsight} />
              )}

              {/* Relatable Analogy */}
              {response.relatable && (
                <RelatableSection relatable={response.relatable} />
              )}

              {/* Worked Example - The main teaching content */}
              {response.workedExample && (
                <WorkedExampleSection example={response.workedExample} />
              )}

              {/* Trap to Avoid */}
              {response.trapToAvoid && (
                <TrapToAvoidSection trap={response.trapToAvoid} />
              )}

              {/* Try Your Problem */}
              {response.tryYourProblem && (
                <TryYourProblemSection prompt={response.tryYourProblem} />
              )}

              {/* Encouragement */}
              {response.encouragement && (
                <EncouragementSection message={response.encouragement} />
              )}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">
              You&apos;ve got the method now - go solve YOUR problem!
            </p>
            <button
              onClick={handleClose}
              className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors text-sm font-medium flex items-center gap-2"
            >
              <span>I&apos;m ready to try!</span>
              <ArrowRightIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TeachMeModal;

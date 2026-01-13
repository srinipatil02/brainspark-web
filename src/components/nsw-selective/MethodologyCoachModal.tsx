// =============================================================================
// METHODOLOGY COACH MODAL COMPONENT
// =============================================================================
// FILE: src/components/nsw-selective/MethodologyCoachModal.tsx
// DOMAIN: NSW Selective Exam Prep - AI Tutoring
// PURPOSE: Display methodology coaching in intro, intervention, and on-demand modes
// DO NOT: Reveal answers or be discouraging

'use client';

import { useState } from 'react';
import {
  MethodologyGuidance,
  MethodologyLesson,
  SocraticIntervention,
  OnDemandExplanation,
  WorkedExample
} from '@/services/nsw-selective/methodologyCoachService';

// =============================================================================
// TYPES
// =============================================================================

interface MethodologyCoachModalProps {
  isOpen: boolean;
  onClose: () => void;
  guidance: MethodologyGuidance;
  onStartPractice?: () => void; // For intro mode
}

// =============================================================================
// ICON COMPONENTS
// =============================================================================

function BrainIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  );
}

function LightbulbIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
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

function CheckCircleIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function QuestionIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

// =============================================================================
// WORKED EXAMPLE COMPONENT
// =============================================================================

function WorkedExampleDisplay({ example }: { example: WorkedExample }) {
  const [showSteps, setShowSteps] = useState(false);

  return (
    <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
      <h4 className="font-medium text-blue-800 mb-3 flex items-center gap-2">
        <LightbulbIcon className="w-5 h-5" />
        Worked Example
      </h4>

      <div className="bg-white rounded-lg p-3 mb-3 border border-blue-100">
        <p className="text-sm text-gray-800 font-medium">{example.problem}</p>
      </div>

      <button
        onClick={() => setShowSteps(!showSteps)}
        className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
      >
        {showSteps ? 'Hide' : 'Show'} step-by-step solution
        <svg
          className={`w-4 h-4 transition-transform ${showSteps ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {showSteps && (
        <div className="mt-3 space-y-2">
          {example.steps.map((step, i) => (
            <div key={i} className="flex gap-3 text-sm">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-medium text-xs">
                {step.step}
              </span>
              <div>
                <p className="text-gray-700">{step.action}</p>
                <p className="text-blue-600 font-medium">{step.result}</p>
              </div>
            </div>
          ))}
          <div className="mt-3 p-2 bg-green-50 rounded-lg border border-green-200">
            <p className="text-sm font-medium text-green-800">
              Answer: {example.answer}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// LESSON VIEW (INTRO MODE)
// =============================================================================

function LessonView({
  lesson,
  onStartPractice,
  onClose
}: {
  lesson: MethodologyLesson;
  onStartPractice?: () => void;
  onClose: () => void;
}) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center pb-4 border-b">
        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <BrainIcon className="w-8 h-8 text-purple-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">{lesson.title}</h2>
        <p className="text-sm text-gray-500 mt-1">Master the methodology before you start</p>
      </div>

      {/* Pattern Recognition */}
      <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
        <h3 className="font-medium text-purple-800 mb-2">The Pattern</h3>
        <p className="text-sm text-gray-700">{lesson.pattern}</p>
      </div>

      {/* The Approach */}
      <div className="bg-green-50 rounded-xl p-4 border border-green-200">
        <h3 className="font-medium text-green-800 mb-2">The Approach</h3>
        <p className="text-sm text-gray-700">{lesson.approach}</p>
      </div>

      {/* Step-by-Step */}
      <div>
        <h3 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
          <CheckCircleIcon className="w-5 h-5 text-blue-500" />
          Step-by-Step Method
        </h3>
        <ol className="space-y-2">
          {lesson.steps.map((step, i) => (
            <li key={i} className="flex gap-3 text-sm">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-medium text-xs">
                {i + 1}
              </span>
              <span className="text-gray-700">{step}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Common Traps */}
      <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
        <h3 className="font-medium text-amber-800 mb-2 flex items-center gap-2">
          <AlertIcon className="w-5 h-5" />
          Common Traps to Avoid
        </h3>
        <ul className="space-y-1">
          {lesson.commonTraps.map((trap, i) => (
            <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
              <span className="text-amber-500">•</span>
              {trap}
            </li>
          ))}
        </ul>
      </div>

      {/* Worked Example */}
      {lesson.workedExample && (
        <WorkedExampleDisplay example={lesson.workedExample} />
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 border-t">
        <button
          onClick={onClose}
          className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
        >
          I'll review later
        </button>
        {onStartPractice && (
          <button
            onClick={() => {
              onStartPractice();
              onClose();
            }}
            className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-colors"
          >
            Got it! Start Practice
          </button>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// SOCRATIC VIEW (INTERVENTION MODE)
// =============================================================================

function SocraticView({
  intervention,
  onClose
}: {
  intervention: SocraticIntervention;
  onClose: () => void;
}) {
  const [revealedHints, setRevealedHints] = useState<number[]>([]);

  const toggleHint = (index: number) => {
    setRevealedHints(prev =>
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 -mx-6 -mt-6 px-6 py-5 rounded-t-2xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
            <QuestionIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">{intervention.title}</h2>
            <p className="text-sm text-indigo-100">Let me guide you with some questions</p>
          </div>
        </div>
      </div>

      {/* Encouragement */}
      <div className="flex items-start gap-3 p-4 bg-green-50 rounded-xl border border-green-200">
        <span className="text-2xl">💪</span>
        <p className="text-sm text-green-800">{intervention.encouragement}</p>
      </div>

      {/* Adapted Error Message */}
      {intervention.adaptedToError && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl border border-amber-200">
          <AlertIcon className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">{intervention.adaptedToError}</p>
        </div>
      )}

      {/* Socratic Questions */}
      <div>
        <h3 className="font-medium text-gray-800 mb-3">Think about these questions:</h3>
        <div className="space-y-3">
          {intervention.questions.map((q, i) => (
            <div key={i} className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center font-medium text-sm">
                  {i + 1}
                </span>
                <div className="flex-1">
                  <p className="text-sm text-gray-800 font-medium">{q.question}</p>
                  {q.hint && (
                    <button
                      onClick={() => toggleHint(i)}
                      className="mt-2 text-xs text-blue-600 hover:text-blue-700"
                    >
                      {revealedHints.includes(i) ? 'Hide hint' : 'Need a hint?'}
                    </button>
                  )}
                  {q.hint && revealedHints.includes(i) && (
                    <p className="mt-2 text-xs text-blue-700 bg-blue-100 rounded-lg p-2">
                      💡 {q.hint}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Methodology Reminder */}
      <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
        <p className="text-sm text-purple-800">
          <span className="font-medium">📋 Remember:</span> {intervention.methodologyReminder}
        </p>
      </div>

      {/* Action Button */}
      <button
        onClick={onClose}
        className="w-full px-4 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-colors"
      >
        Got it! Let me try again
      </button>
    </div>
  );
}

// =============================================================================
// EXPLANATION VIEW (ON-DEMAND MODE)
// =============================================================================

function ExplanationView({
  explanation,
  onClose
}: {
  explanation: OnDemandExplanation;
  onClose: () => void;
}) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-4 border-b">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <BrainIcon className="w-6 h-6 text-purple-600" />
          {explanation.title}
        </h2>
        <p className="text-sm text-gray-500 mt-1">Quick reference guide</p>
      </div>

      {/* Steps */}
      <div>
        <h3 className="font-medium text-gray-800 mb-3">The Method:</h3>
        <ol className="space-y-2">
          {explanation.steps.map((step, i) => (
            <li key={i} className="flex gap-3 text-sm">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-medium text-xs">
                {i + 1}
              </span>
              <span className="text-gray-700">{step}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Worked Example */}
      {explanation.workedExample && (
        <WorkedExampleDisplay example={explanation.workedExample} />
      )}

      {/* Tips */}
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
        <h3 className="font-medium text-gray-800 mb-2">Tips & Warnings:</h3>
        <ul className="space-y-1">
          {explanation.tips.map((tip, i) => (
            <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
              <span className="text-amber-500">•</span>
              {tip}
            </li>
          ))}
        </ul>
      </div>

      {/* Action Button */}
      <button
        onClick={onClose}
        className="w-full px-4 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-colors"
      >
        Got it!
      </button>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function MethodologyCoachModal({
  isOpen,
  onClose,
  guidance,
  onStartPractice
}: MethodologyCoachModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-6">
          {guidance.type === 'lesson' && (
            <LessonView
              lesson={guidance}
              onStartPractice={onStartPractice}
              onClose={onClose}
            />
          )}
          {guidance.type === 'socratic' && (
            <SocraticView
              intervention={guidance}
              onClose={onClose}
            />
          )}
          {guidance.type === 'explanation' && (
            <ExplanationView
              explanation={guidance}
              onClose={onClose}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default MethodologyCoachModal;

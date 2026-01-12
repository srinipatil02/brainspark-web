'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import type { WorkLine, EncouragingHint, WorkedSolutionAnswer, WorkedSolutionConfig } from '@/types';
import { QuestionRenderer } from '@/components/QuestionRenderer';
import { StepValidationResult, StepValidationStatus, MATH_ERROR_TEMPLATES, MathErrorType } from '@/types/grading';
import { validateStep, MAX_HINTS_PER_STEP } from '@/services/stepValidationService';
import { MathChatModal } from './MathChatModal';

// Dynamic import MathInputField to avoid SSR issues
const MathInputField = dynamic(
  () => import('./MathInputField').then(mod => ({ default: mod.MathInputField })),
  { ssr: false, loading: () => <div className="h-12 bg-gray-100 animate-pulse rounded-lg" /> }
);

// Define MathfieldElement interface for ref typing
interface MathfieldElement extends HTMLElement {
  value: string;
  getValue(format?: string): string;
  focus(): void;
}

// Step state tracking
interface StepState {
  hintsUsed: number;
  validationResult: StepValidationResult | null;
  isChecking: boolean;
}

export interface WorkedSolutionInputProps {
  /** The problem stem/question */
  stem: string;
  /** Configuration for the worked solution */
  config: WorkedSolutionConfig;
  /** Available hints (encouraging, no penalty) */
  hints?: EncouragingHint[];
  /** Whether the question has been submitted */
  isSubmitted?: boolean;
  /** Callback when answer is ready to submit */
  onAnswerChange?: (answer: WorkedSolutionAnswer) => void;
  /** Color theme for styling */
  colorTheme?: string;
}

/**
 * WorkedSolutionInput - Student-Centered "Show Your Work" Component
 *
 * Philosophy:
 * - Students choose their own solution path (autonomy)
 * - Multiple valid approaches are celebrated
 * - Hints are FREE - they're learning tools, not penalties
 * - Focus on the JOURNEY (reasoning), not just the destination (answer)
 * - Mobile-first design with Focus Mode
 */
export function WorkedSolutionInput({
  stem,
  config,
  hints = [],
  isSubmitted = false,
  onAnswerChange,
  colorTheme = 'blue',
}: WorkedSolutionInputProps) {
  // Work lines state - starts with the given expression
  const [workLines, setWorkLines] = useState<WorkLine[]>([
    { lineNumber: 1, latex: config.startingExpression, plainText: config.startingExpression }
  ]);

  // Final answer state
  const [finalAnswer, setFinalAnswer] = useState('');
  const [finalAnswerPlainText, setFinalAnswerPlainText] = useState('');

  // UI state
  const [focusedLineIndex, setFocusedLineIndex] = useState<number | null>(null);
  const [showHints, setShowHints] = useState(false);
  const [hintsViewed, setHintsViewed] = useState<number[]>([]);
  const [showEncouragement, setShowEncouragement] = useState(false);

  // Phase 5: Socratic AI tutor chat
  const [showMathChat, setShowMathChat] = useState(false);

  // Phase 3: Step validation state
  const [stepStates, setStepStates] = useState<Record<number, StepState>>({});

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const finalAnswerRef = useRef<MathfieldElement | null>(null);

  // Get step state for a specific step
  const getStepState = useCallback((stepIndex: number): StepState => {
    return stepStates[stepIndex] || {
      hintsUsed: 0,
      validationResult: null,
      isChecking: false,
    };
  }, [stepStates]);

  // Check a step (costs 1 hint)
  const checkStep = useCallback(async (stepIndex: number) => {
    if (stepIndex === 0) return; // Can't check starting expression

    const currentState = getStepState(stepIndex);
    if (currentState.hintsUsed >= MAX_HINTS_PER_STEP) return;

    // Mark as checking
    setStepStates(prev => ({
      ...prev,
      [stepIndex]: { ...currentState, isChecking: true }
    }));

    const workLine = workLines[stepIndex];
    const previousSteps = workLines.slice(0, stepIndex).map(l => ({
      latex: l.latex,
      plainText: l.plainText,
    }));

    try {
      const result = await validateStep(
        {
          stepNumber: stepIndex + 1,
          stepLatex: workLine.latex,
          stepPlainText: workLine.plainText,
          previousSteps,
          questionStem: stem,
          startingExpression: config.startingExpression,
          expectedAnswers: config.expectedAnswers,
        },
        currentState.hintsUsed
      );

      setStepStates(prev => ({
        ...prev,
        [stepIndex]: {
          hintsUsed: currentState.hintsUsed + 1,
          validationResult: result,
          isChecking: false,
        }
      }));

      // Show encouragement on correct
      if (result.isCorrect) {
        setShowEncouragement(true);
        setTimeout(() => setShowEncouragement(false), 3000);
      }
    } catch (error) {
      console.error('Step validation error:', error);
      setStepStates(prev => ({
        ...prev,
        [stepIndex]: { ...currentState, isChecking: false }
      }));
    }
  }, [workLines, stem, config.startingExpression, config.expectedAnswers, getStepState]);

  // Clear validation when step content changes
  const handleStepChange = useCallback((index: number, latex: string, plainText: string) => {
    setWorkLines(prev => prev.map((line, i) =>
      i === index ? { ...line, latex, plainText } : line
    ));

    // Clear validation result when step is edited
    setStepStates(prev => {
      const currentState = prev[index];
      if (currentState?.validationResult) {
        return {
          ...prev,
          [index]: { ...currentState, validationResult: null }
        };
      }
      return prev;
    });
  }, []);

  // Color classes based on theme - supports all standard Tailwind colors
  const colorMap: Record<string, {
    primary: string;
    primaryHover: string;
    light: string;
    border: string;
    text: string;
    focusRing: string;
  }> = {
    blue: {
      primary: 'bg-blue-500',
      primaryHover: 'hover:bg-blue-600',
      light: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-600',
      focusRing: 'focus:ring-blue-500',
    },
    green: {
      primary: 'bg-green-500',
      primaryHover: 'hover:bg-green-600',
      light: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-600',
      focusRing: 'focus:ring-green-500',
    },
    emerald: {
      primary: 'bg-emerald-500',
      primaryHover: 'hover:bg-emerald-600',
      light: 'bg-emerald-50',
      border: 'border-emerald-200',
      text: 'text-emerald-600',
      focusRing: 'focus:ring-emerald-500',
    },
    purple: {
      primary: 'bg-purple-500',
      primaryHover: 'hover:bg-purple-600',
      light: 'bg-purple-50',
      border: 'border-purple-200',
      text: 'text-purple-600',
      focusRing: 'focus:ring-purple-500',
    },
    orange: {
      primary: 'bg-orange-500',
      primaryHover: 'hover:bg-orange-600',
      light: 'bg-orange-50',
      border: 'border-orange-200',
      text: 'text-orange-600',
      focusRing: 'focus:ring-orange-500',
    },
    amber: {
      primary: 'bg-amber-500',
      primaryHover: 'hover:bg-amber-600',
      light: 'bg-amber-50',
      border: 'border-amber-200',
      text: 'text-amber-600',
      focusRing: 'focus:ring-amber-500',
    },
    red: {
      primary: 'bg-red-500',
      primaryHover: 'hover:bg-red-600',
      light: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-600',
      focusRing: 'focus:ring-red-500',
    },
    rose: {
      primary: 'bg-rose-500',
      primaryHover: 'hover:bg-rose-600',
      light: 'bg-rose-50',
      border: 'border-rose-200',
      text: 'text-rose-600',
      focusRing: 'focus:ring-rose-500',
    },
    teal: {
      primary: 'bg-teal-500',
      primaryHover: 'hover:bg-teal-600',
      light: 'bg-teal-50',
      border: 'border-teal-200',
      text: 'text-teal-600',
      focusRing: 'focus:ring-teal-500',
    },
    cyan: {
      primary: 'bg-cyan-500',
      primaryHover: 'hover:bg-cyan-600',
      light: 'bg-cyan-50',
      border: 'border-cyan-200',
      text: 'text-cyan-600',
      focusRing: 'focus:ring-cyan-500',
    },
    sky: {
      primary: 'bg-sky-500',
      primaryHover: 'hover:bg-sky-600',
      light: 'bg-sky-50',
      border: 'border-sky-200',
      text: 'text-sky-600',
      focusRing: 'focus:ring-sky-500',
    },
    indigo: {
      primary: 'bg-indigo-500',
      primaryHover: 'hover:bg-indigo-600',
      light: 'bg-indigo-50',
      border: 'border-indigo-200',
      text: 'text-indigo-600',
      focusRing: 'focus:ring-indigo-500',
    },
    yellow: {
      primary: 'bg-yellow-500',
      primaryHover: 'hover:bg-yellow-600',
      light: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-600',
      focusRing: 'focus:ring-yellow-500',
    },
    lime: {
      primary: 'bg-lime-500',
      primaryHover: 'hover:bg-lime-600',
      light: 'bg-lime-50',
      border: 'border-lime-200',
      text: 'text-lime-600',
      focusRing: 'focus:ring-lime-500',
    },
    slate: {
      primary: 'bg-slate-500',
      primaryHover: 'hover:bg-slate-600',
      light: 'bg-slate-50',
      border: 'border-slate-200',
      text: 'text-slate-600',
      focusRing: 'focus:ring-slate-500',
    },
    gray: {
      primary: 'bg-gray-500',
      primaryHover: 'hover:bg-gray-600',
      light: 'bg-gray-50',
      border: 'border-gray-200',
      text: 'text-gray-600',
      focusRing: 'focus:ring-gray-500',
    },
    zinc: {
      primary: 'bg-zinc-500',
      primaryHover: 'hover:bg-zinc-600',
      light: 'bg-zinc-50',
      border: 'border-zinc-200',
      text: 'text-zinc-600',
      focusRing: 'focus:ring-zinc-500',
    },
    neutral: {
      primary: 'bg-neutral-500',
      primaryHover: 'hover:bg-neutral-600',
      light: 'bg-neutral-50',
      border: 'border-neutral-200',
      text: 'text-neutral-600',
      focusRing: 'focus:ring-neutral-500',
    },
    stone: {
      primary: 'bg-stone-500',
      primaryHover: 'hover:bg-stone-600',
      light: 'bg-stone-50',
      border: 'border-stone-200',
      text: 'text-stone-600',
      focusRing: 'focus:ring-stone-500',
    },
  };
  const colorClasses = colorMap[colorTheme] || colorMap.blue;

  // Store callback in ref to avoid infinite loops
  const onAnswerChangeRef = useRef(onAnswerChange);
  onAnswerChangeRef.current = onAnswerChange;

  // Update parent when answer changes
  useEffect(() => {
    if (onAnswerChangeRef.current) {
      onAnswerChangeRef.current({
        workLines,
        finalAnswer,
        finalAnswerPlainText,
        hintsViewed,
      });
    }
  }, [workLines, finalAnswer, finalAnswerPlainText, hintsViewed]);

  // Add a new work line
  const addWorkLine = useCallback(() => {
    const newLineNumber = workLines.length + 1;
    setWorkLines(prev => [
      ...prev,
      { lineNumber: newLineNumber, latex: '', plainText: '' }
    ]);
    // Focus the new line after render
    setTimeout(() => setFocusedLineIndex(workLines.length), 100);
  }, [workLines.length]);

  // Update a work line
  const updateWorkLine = useCallback((index: number, latex: string, plainText: string) => {
    setWorkLines(prev => prev.map((line, i) =>
      i === index ? { ...line, latex, plainText } : line
    ));
  }, []);

  // Remove a work line (except the first one - that's the starting expression)
  const removeWorkLine = useCallback((index: number) => {
    if (index === 0) return; // Can't remove starting expression
    setWorkLines(prev => {
      const newLines = prev.filter((_, i) => i !== index);
      // Re-number the lines
      return newLines.map((line, i) => ({ ...line, lineNumber: i + 1 }));
    });
  }, []);

  // View a hint (track for analytics, but NO penalty!)
  const viewHint = useCallback((level: number) => {
    if (!hintsViewed.includes(level)) {
      setHintsViewed(prev => [...prev, level]);
    }
    setShowEncouragement(true);
    setTimeout(() => setShowEncouragement(false), 3000);
  }, [hintsViewed]);

  // Encouragement messages (shown randomly when students use hints)
  const encouragements = [
    "You're doing great! Taking time to think is what good mathematicians do.",
    "Asking for help shows strength, not weakness. Keep going!",
    "Every expert was once a beginner. You've got this!",
    "Using hints is smart - it's how we learn best.",
  ];

  const randomEncouragement = encouragements[Math.floor(Math.random() * encouragements.length)];

  return (
    <div ref={containerRef} className="space-y-4">
      {/* Problem Statement - Sticky on mobile for context */}
      <div className={`sticky top-0 z-10 ${colorClasses.light} ${colorClasses.border} border rounded-xl p-4 shadow-sm`}>
        <div className="flex items-start gap-3">
          <div className={`w-8 h-8 ${colorClasses.primary} rounded-full flex items-center justify-center flex-shrink-0`}>
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-500 mb-1">Problem</p>
            <QuestionRenderer content={stem} className="text-lg font-semibold" />
          </div>
        </div>
      </div>

      {/* Your Working Section */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              <span className="font-semibold text-gray-700">Your Working</span>
            </div>
            <span className="text-sm text-gray-500">
              Show your steps - any approach works!
            </span>
          </div>
        </div>

        <div className="p-4 space-y-3">
          {/* Work lines */}
          {workLines.map((line, index) => (
            <div
              key={index}
              className={`relative transition-all duration-200 ${
                focusedLineIndex === index ? 'ring-2 ring-blue-400 rounded-lg' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Line number */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  index === 0 ? `${colorClasses.light} ${colorClasses.text}` : 'bg-gray-100 text-gray-500'
                }`}>
                  <span className="text-sm font-medium">{index + 1}</span>
                </div>

                {/* Input or display */}
                <div className="flex-1">
                  {index === 0 ? (
                    // First line - read-only starting expression
                    <div className={`px-4 py-3 ${colorClasses.light} rounded-lg border ${colorClasses.border}`}>
                      <span className="text-gray-700 font-medium">{line.latex}</span>
                      <span className="ml-2 text-xs text-gray-400">(starting point)</span>
                    </div>
                  ) : (
                    // Editable work lines with step validation
                    <div className="space-y-2">
                      <div className="relative">
                        {/* Step validation border color */}
                        <div className={`rounded-lg transition-all ${
                          getStepState(index).validationResult?.status === 'correct' ? 'ring-2 ring-green-400' :
                          getStepState(index).validationResult?.status === 'incorrect' ? 'ring-2 ring-red-400' :
                          getStepState(index).validationResult?.status === 'partial' ? 'ring-2 ring-amber-400' :
                          ''
                        }`}>
                          <MathInputField
                            value={line.latex}
                            onChange={(latex, plainText) => handleStepChange(index, latex, plainText)}
                            placeholder="Enter your next step..."
                            disabled={isSubmitted}
                            onFocus={() => setFocusedLineIndex(index)}
                            onBlur={() => setFocusedLineIndex(null)}
                            inputType="expression"
                            ariaLabel={`Work step ${index + 1}`}
                            hasError={getStepState(index).validationResult?.status === 'incorrect'}
                          />
                        </div>
                        {/* Remove button (not for first line or when submitted) */}
                        {!isSubmitted && (
                          <button
                            onClick={() => removeWorkLine(index)}
                            className="absolute -right-2 -top-2 w-6 h-6 bg-red-100 hover:bg-red-200 text-red-600 rounded-full flex items-center justify-center transition-colors z-10"
                            aria-label="Remove this step"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>

                      {/* Check Step Button and Validation Feedback */}
                      {!isSubmitted && line.latex.trim() && (
                        <div className="flex items-start gap-3 pl-2">
                          {/* Check Step Button */}
                          {!getStepState(index).validationResult && (
                            <button
                              onClick={() => checkStep(index)}
                              disabled={getStepState(index).isChecking || getStepState(index).hintsUsed >= MAX_HINTS_PER_STEP}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                getStepState(index).isChecking
                                  ? 'bg-gray-100 text-gray-400 cursor-wait'
                                  : getStepState(index).hintsUsed >= MAX_HINTS_PER_STEP
                                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                  : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                              }`}
                            >
                              {getStepState(index).isChecking ? (
                                <>
                                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                  </svg>
                                  Checking...
                                </>
                              ) : (
                                <>
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  Check Step
                                </>
                              )}
                            </button>
                          )}

                          {/* Hints Remaining Indicator */}
                          {getStepState(index).hintsUsed > 0 && !getStepState(index).validationResult && (
                            <span className="text-xs text-gray-500 py-1.5">
                              {MAX_HINTS_PER_STEP - getStepState(index).hintsUsed} check{MAX_HINTS_PER_STEP - getStepState(index).hintsUsed !== 1 ? 's' : ''} remaining
                            </span>
                          )}

                          {/* No checks remaining message */}
                          {getStepState(index).hintsUsed >= MAX_HINTS_PER_STEP && !getStepState(index).validationResult && (
                            <span className="text-xs text-amber-600 py-1.5">
                              No checks left - submit to see feedback
                            </span>
                          )}
                        </div>
                      )}

                      {/* Validation Result Feedback */}
                      {getStepState(index).validationResult && (
                        <div className={`rounded-lg p-3 ${
                          getStepState(index).validationResult?.status === 'correct'
                            ? 'bg-green-50 border border-green-200'
                            : getStepState(index).validationResult?.status === 'incorrect'
                            ? 'bg-red-50 border border-red-200'
                            : 'bg-amber-50 border border-amber-200'
                        }`}>
                          {/* Status Icon and Feedback */}
                          <div className="flex items-start gap-2">
                            <span className="text-lg flex-shrink-0">
                              {getStepState(index).validationResult?.status === 'correct' ? '✓' :
                               getStepState(index).validationResult?.status === 'incorrect' ? '✗' : '~'}
                            </span>
                            <div className="flex-1">
                              <p className={`text-sm font-medium ${
                                getStepState(index).validationResult?.status === 'correct' ? 'text-green-800' :
                                getStepState(index).validationResult?.status === 'incorrect' ? 'text-red-800' :
                                'text-amber-800'
                              }`}>
                                {getStepState(index).validationResult?.feedback}
                              </p>
                              {/* Encouragement message */}
                              {getStepState(index).validationResult?.encouragement && (
                                <p className={`text-xs mt-1 ${
                                  getStepState(index).validationResult?.status === 'correct' ? 'text-green-600' :
                                  getStepState(index).validationResult?.status === 'incorrect' ? 'text-red-600' :
                                  'text-amber-600'
                                }`}>
                                  {getStepState(index).validationResult?.encouragement}
                                </p>
                              )}
                              {/* Error type hint for incorrect answers */}
                              {getStepState(index).validationResult?.errorType &&
                               getStepState(index).validationResult?.errorType !== 'correct' &&
                               getStepState(index).validationResult?.errorType !== 'unknown' &&
                               MATH_ERROR_TEMPLATES[getStepState(index).validationResult!.errorType!] && (
                                <div className="mt-2 text-xs text-gray-600 bg-white/50 rounded p-2">
                                  <span className="font-medium">
                                    {MATH_ERROR_TEMPLATES[getStepState(index).validationResult!.errorType!].title}:
                                  </span>{' '}
                                  {MATH_ERROR_TEMPLATES[getStepState(index).validationResult!.errorType!].hint}
                                </div>
                              )}
                            </div>
                            {/* Try Again Button */}
                            {getStepState(index).validationResult?.status !== 'correct' &&
                             getStepState(index).hintsUsed < MAX_HINTS_PER_STEP && (
                              <button
                                onClick={() => {
                                  // Clear result so they can try again
                                  setStepStates(prev => ({
                                    ...prev,
                                    [index]: { ...prev[index], validationResult: null }
                                  }));
                                }}
                                className="px-2 py-1 text-xs font-medium bg-white rounded border border-gray-200 hover:bg-gray-50 text-gray-600"
                              >
                                Try Again
                              </button>
                            )}
                          </div>
                          {/* Checks remaining after feedback */}
                          <div className="mt-2 pt-2 border-t border-gray-200/50">
                            <span className="text-xs text-gray-500">
                              {getStepState(index).validationResult?.hintsRemaining || 0} check{(getStepState(index).validationResult?.hintsRemaining || 0) !== 1 ? 's' : ''} remaining for this step
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Add Step Button */}
          {!isSubmitted && (
            <button
              onClick={addWorkLine}
              className={`w-full py-3 px-4 border-2 border-dashed ${colorClasses.border} rounded-lg ${colorClasses.text} hover:${colorClasses.light} transition-colors flex items-center justify-center gap-2`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="font-medium">Add another step</span>
            </button>
          )}
        </div>
      </div>

      {/* Final Answer Section */}
      <div className="bg-white rounded-xl border-2 border-gray-300 overflow-hidden">
        <div className={`px-4 py-3 ${colorClasses.primary} text-white`}>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-semibold">Final Answer</span>
          </div>
        </div>
        <div className="p-4">
          <MathInputField
            value={finalAnswer}
            onChange={(latex, plainText) => {
              setFinalAnswer(latex);
              setFinalAnswerPlainText(plainText);
            }}
            placeholder="Enter your final answer..."
            disabled={isSubmitted}
            inputType="equation"
            ariaLabel="Final answer"
            className={isSubmitted ? 'opacity-75' : ''}
          />
          {config.encourageExplanation && !isSubmitted && (
            <p className="mt-2 text-sm text-gray-500 italic">
              Tip: Make sure your answer matches what the question is asking for!
            </p>
          )}
        </div>
      </div>

      {/* Hints Section - FREE, encouraging, no penalty */}
      {hints.length > 0 && (
        <div className="bg-amber-50 rounded-xl border border-amber-200 overflow-hidden">
          <button
            onClick={() => setShowHints(!showHints)}
            className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-amber-100 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="text-2xl">💡</span>
              <div>
                <span className="font-semibold text-amber-800">Need a hint?</span>
                <span className="text-sm text-amber-600 ml-2">
                  (Free to use - hints help you learn!)
                </span>
              </div>
            </div>
            <svg
              className={`w-5 h-5 text-amber-600 transition-transform ${showHints ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showHints && (
            <div className="px-4 pb-4 space-y-3">
              {/* Encouragement banner */}
              {showEncouragement && (
                <div className="bg-green-100 border border-green-200 rounded-lg p-3 flex items-start gap-2">
                  <span className="text-xl">🌟</span>
                  <p className="text-sm text-green-800">{randomEncouragement}</p>
                </div>
              )}

              {/* Hint levels */}
              {hints.map((hint, index) => (
                <div
                  key={hint.level}
                  className={`rounded-lg border transition-all ${
                    hintsViewed.includes(hint.level)
                      ? 'bg-white border-amber-300'
                      : 'bg-amber-100/50 border-amber-200 hover:bg-amber-100'
                  }`}
                >
                  {hintsViewed.includes(hint.level) ? (
                    // Show the hint content
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          hint.level === 1 ? 'bg-green-100 text-green-700' :
                          hint.level === 2 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-orange-100 text-orange-700'
                        }`}>
                          Hint {hint.level}
                        </span>
                        {hint.encouragement && (
                          <span className="text-sm text-gray-500">{hint.encouragement}</span>
                        )}
                      </div>
                      <p className="text-gray-700">{hint.content}</p>
                      {hint.questionPrompt && (
                        <p className="mt-2 text-sm text-blue-600 italic">
                          🤔 {hint.questionPrompt}
                        </p>
                      )}
                    </div>
                  ) : (
                    // Show "reveal hint" button
                    <button
                      onClick={() => viewHint(hint.level)}
                      className="w-full p-4 text-left flex items-center justify-between"
                      disabled={isSubmitted}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          hint.level === 1 ? 'bg-green-100 text-green-700' :
                          hint.level === 2 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-orange-100 text-orange-700'
                        }`}>
                          Hint {hint.level}
                        </span>
                        <span className="text-amber-700">
                          {hint.level === 1 ? 'Gentle nudge' :
                           hint.level === 2 ? 'More guidance' :
                           'Strong scaffold'}
                        </span>
                      </div>
                      <span className="text-amber-600 text-sm font-medium">
                        Reveal →
                      </span>
                    </button>
                  )}
                </div>
              ))}

              {/* No penalty reminder */}
              <p className="text-xs text-amber-600 text-center italic">
                ✨ Using hints doesn&apos;t affect your score - they&apos;re here to help you learn!
              </p>
            </div>
          )}
        </div>
      )}

      {/* Minimum work lines reminder */}
      {config.minimumWorkLines && config.minimumWorkLines > 0 && workLines.length < config.minimumWorkLines + 1 && !isSubmitted && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
          <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-blue-700">
            Show at least {config.minimumWorkLines} step{config.minimumWorkLines > 1 ? 's' : ''} of your working.
            This helps us understand your thinking!
          </p>
        </div>
      )}

      {/* Phase 5: Ask Tutor Button - Socratic AI Tutor */}
      {!isSubmitted && (
        <div className="bg-indigo-50 rounded-xl border border-indigo-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🧮</span>
              <div>
                <h4 className="font-semibold text-indigo-800">Stuck? Talk to the Math Tutor</h4>
                <p className="text-sm text-indigo-600">
                  Get guided help without getting the answer
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowMathChat(true)}
              className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Ask Tutor
            </button>
          </div>
        </div>
      )}

      {/* Phase 5: Math Chat Modal - Socratic AI Tutor */}
      <MathChatModal
        isOpen={showMathChat}
        onClose={() => setShowMathChat(false)}
        problemStem={stem}
        startingExpression={config.startingExpression}
        expectedAnswers={config.expectedAnswers}
        studentWork={workLines}
        studentFinalAnswer={finalAnswer}
        topic={config.topic || 'algebra'}
        year={config.year || 8}
        keyConcepts={config.keyConcepts || []}
        colorTheme={colorTheme}
      />
    </div>
  );
}

export default WorkedSolutionInput;

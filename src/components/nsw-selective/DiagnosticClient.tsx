// =============================================================================
// DIAGNOSTIC CLIENT COMPONENT
// =============================================================================
// FILE: src/components/nsw-selective/DiagnosticClient.tsx
// DOMAIN: NSW Selective Exam Prep
// PURPOSE: Diagnostic assessment testing one question per archetype (20 total)
// DO NOT: Import curriculum components or use learningArc fields

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { FirestoreQuestion, ArchetypeId, FirestoreMCQOption } from '@/types';
import { ARCHETYPE_CATALOG, getArchetypeDefinition, ArchetypeCategory } from '@/types/nsw-selective';
import { getDiagnosticQuestions } from '@/services/nsw-selective/archetypeService';

// =============================================================================
// TYPES
// =============================================================================

interface ArchetypeResult {
  archetypeId: ArchetypeId;
  questionId: string;
  isCorrect: boolean;
  timeSeconds: number;
  selectedOption: string;
}

type DiagnosticPhase = 'intro' | 'assessment' | 'results';

// Category display configuration (copied from ArchetypePracticeClient)
const CATEGORY_CONFIG: Record<ArchetypeCategory, { label: string; color: string; bgColor: string }> = {
  arithmetic_algebra: { label: 'Arithmetic & Algebra', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  percentages_ratios: { label: 'Percentages & Ratios', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  geometry_spatial: { label: 'Geometry & Spatial', color: 'text-orange-700', bgColor: 'bg-orange-100' },
  data_statistics: { label: 'Data & Statistics', color: 'text-green-700', bgColor: 'bg-green-100' },
  patterns_sequences: { label: 'Patterns & Sequences', color: 'text-pink-700', bgColor: 'bg-pink-100' },
  time_distance: { label: 'Time & Distance', color: 'text-cyan-700', bgColor: 'bg-cyan-100' },
  problem_solving: { label: 'Problem Solving', color: 'text-amber-700', bgColor: 'bg-amber-100' },
};

// =============================================================================
// COUNTDOWN TIMER HOOK
// =============================================================================

function useCountdownTimer(initialSeconds: number, onTimeUp: () => void) {
  const [remainingSeconds, setRemainingSeconds] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const onTimeUpRef = useRef(onTimeUp);

  // Keep callback ref updated
  useEffect(() => {
    onTimeUpRef.current = onTimeUp;
  }, [onTimeUp]);

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setRemainingSeconds(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsRunning(false);
          onTimeUpRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning]);

  const start = useCallback(() => setIsRunning(true), []);
  const pause = useCallback(() => setIsRunning(false), []);
  const reset = useCallback(() => {
    setRemainingSeconds(initialSeconds);
    setIsRunning(false);
  }, [initialSeconds]);

  return { remainingSeconds, isRunning, start, pause, reset };
}

// =============================================================================
// TIMER DISPLAY COMPONENT
// =============================================================================

function CountdownTimerDisplay({ seconds }: { seconds: number }) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  // Color based on remaining time
  let colorClass = 'text-gray-700 bg-gray-100';
  if (seconds <= 60) {
    colorClass = 'text-red-700 bg-red-100 animate-pulse';
  } else if (seconds <= 300) {
    colorClass = 'text-amber-700 bg-amber-100';
  }

  return (
    <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-lg font-semibold ${colorClass}`}>
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>{mins.toString().padStart(2, '0')}:{secs.toString().padStart(2, '0')}</span>
    </div>
  );
}

// =============================================================================
// PROGRESS BAR COMPONENT
// =============================================================================

function DiagnosticProgressBar({ current, total }: { current: number; total: number }) {
  const percentage = (current / total) * 100;

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-purple-500 transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-sm text-gray-500 whitespace-nowrap font-medium">
        {current} / {total}
      </span>
    </div>
  );
}

// =============================================================================
// MCQ OPTIONS COMPONENT
// =============================================================================

function DiagnosticMCQOptions({
  options,
  selectedOption,
  onSelect,
  disabled
}: {
  options: FirestoreMCQOption[];
  selectedOption: string | null;
  onSelect: (optionId: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="space-y-3">
      {options.map((option) => {
        const isSelected = selectedOption === option.id;

        let bgColor = 'bg-white hover:bg-gray-50';
        let borderColor = 'border-gray-200';

        if (isSelected) {
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
                isSelected ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-600'
              }`}>
                {option.id}
              </span>
              <p className="text-gray-900 pt-1">{option.text}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// =============================================================================
// INTRO SCREEN COMPONENT
// =============================================================================

function IntroScreen({ onStart, isLoading }: { onStart: () => void; isLoading: boolean }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-8">
      <div className="max-w-2xl mx-auto text-center">
        {/* Icon */}
        <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-4">Ready to Begin?</h2>

        <p className="text-gray-600 mb-8">
          This diagnostic assessment will test your skills across all 20 question archetypes
          found in the NSW Selective exam. Take your time to read each question carefully.
        </p>

        {/* Rules */}
        <div className="bg-gray-50 rounded-xl p-6 mb-8 text-left">
          <h3 className="font-semibold text-gray-900 mb-4">Assessment Rules</h3>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <svg className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-gray-700">
                <strong>20 minutes</strong> to complete all 20 questions
              </span>
            </li>
            <li className="flex items-start gap-3">
              <svg className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
              <span className="text-gray-700">
                <strong>No going back</strong> - once you answer, you move to the next question
              </span>
            </li>
            <li className="flex items-start gap-3">
              <svg className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-gray-700">
                <strong>One question per archetype</strong> - each tests a different pattern
              </span>
            </li>
            <li className="flex items-start gap-3">
              <svg className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="text-gray-700">
                <strong>Auto-submit at timeout</strong> - unanswered questions count as incorrect
              </span>
            </li>
          </ul>
        </div>

        {/* Start Button */}
        <button
          onClick={onStart}
          disabled={isLoading}
          className={`px-8 py-4 rounded-xl font-semibold text-lg transition-colors ${
            isLoading
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-purple-600 text-white hover:bg-purple-700'
          }`}
        >
          {isLoading ? 'Loading Questions...' : 'Start Assessment'}
        </button>
      </div>
    </div>
  );
}

// =============================================================================
// RESULTS SCREEN COMPONENT
// =============================================================================

function ResultsScreen({
  results,
  questions,
  totalTimeSeconds,
  onRestart
}: {
  results: ArchetypeResult[];
  questions: FirestoreQuestion[];
  totalTimeSeconds: number;
  onRestart: () => void;
}) {
  const correctCount = results.filter(r => r.isCorrect).length;
  const percentage = Math.round((correctCount / results.length) * 100);

  // Group results by category
  const resultsByCategory: Record<ArchetypeCategory, ArchetypeResult[]> = {
    arithmetic_algebra: [],
    percentages_ratios: [],
    geometry_spatial: [],
    data_statistics: [],
    patterns_sequences: [],
    time_distance: [],
    problem_solving: [],
  };

  results.forEach(result => {
    const archetype = getArchetypeDefinition(result.archetypeId);
    resultsByCategory[archetype.category].push(result);
  });

  // Find weakest archetypes (incorrect answers)
  const weakArchetypes = results
    .filter(r => !r.isCorrect)
    .map(r => r.archetypeId)
    .slice(0, 3);

  // Get color for accuracy
  const getAccuracyColor = () => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  const getAccuracyBg = () => {
    if (percentage >= 80) return 'bg-green-100';
    if (percentage >= 60) return 'bg-amber-100';
    return 'bg-red-100';
  };

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <div className="bg-white rounded-xl shadow-sm border p-8">
        <div className="text-center mb-8">
          <div className={`w-24 h-24 ${getAccuracyBg()} rounded-full flex items-center justify-center mx-auto mb-4`}>
            <span className={`text-3xl font-bold ${getAccuracyColor()}`}>{percentage}%</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Diagnostic Complete!</h2>
          <p className="text-gray-500">
            You answered {correctCount} out of {results.length} questions correctly
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-50 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-purple-600">{correctCount}</p>
            <p className="text-sm text-gray-500">Correct</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-red-600">{results.length - correctCount}</p>
            <p className="text-sm text-gray-500">Incorrect</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-blue-600">{Math.round(totalTimeSeconds / 60)}m</p>
            <p className="text-sm text-gray-500">Time Used</p>
          </div>
        </div>

        {/* Performance Message */}
        <div className={`${getAccuracyBg()} rounded-xl p-4 text-center`}>
          {percentage >= 80 ? (
            <p className="text-gray-700">
              Excellent! You have a strong foundation across most archetypes.
              Focus on perfecting the few areas where you struggled.
            </p>
          ) : percentage >= 60 ? (
            <p className="text-gray-700">
              Good effort! You understand many patterns but have room for improvement.
              Practice the archetypes below to boost your score.
            </p>
          ) : (
            <p className="text-gray-700">
              This is a great starting point! The diagnostic has identified key areas
              where focused practice will make a big difference.
            </p>
          )}
        </div>
      </div>

      {/* Breakdown by Category */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Results by Category</h3>

        <div className="space-y-4">
          {(Object.entries(resultsByCategory) as [ArchetypeCategory, ArchetypeResult[]][]).map(([category, categoryResults]) => {
            if (categoryResults.length === 0) return null;

            const config = CATEGORY_CONFIG[category];
            const categoryCorrect = categoryResults.filter(r => r.isCorrect).length;

            return (
              <div key={category} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${config.bgColor} ${config.color}`}>
                    {config.label}
                  </span>
                  <span className="text-sm font-medium text-gray-600">
                    {categoryCorrect} / {categoryResults.length} correct
                  </span>
                </div>

                <div className="space-y-2">
                  {categoryResults.map(result => {
                    const archetype = getArchetypeDefinition(result.archetypeId);
                    return (
                      <div
                        key={result.archetypeId}
                        className="flex items-center justify-between py-2 border-t border-gray-100"
                      >
                        <div className="flex items-center gap-2">
                          {result.isCorrect ? (
                            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          )}
                          <span className="text-sm text-gray-700">{archetype.shortName}</span>
                        </div>
                        <span className="text-xs text-gray-400 font-mono">{archetype.id.toUpperCase()}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recommended Practice */}
      {weakArchetypes.length > 0 && (
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-200 p-6">
          <h3 className="text-lg font-semibold text-purple-800 mb-4">
            Recommended Practice
          </h3>
          <p className="text-gray-600 mb-4">
            Focus on these archetypes to improve your score:
          </p>

          <div className="space-y-3">
            {weakArchetypes.map((archetypeId, index) => {
              const archetype = getArchetypeDefinition(archetypeId);
              const config = CATEGORY_CONFIG[archetype.category];

              return (
                <Link
                  key={archetypeId}
                  href={`/nsw-selective/practice/${archetypeId}`}
                  className="flex items-center justify-between bg-white rounded-lg p-4 border border-purple-100 hover:border-purple-300 hover:shadow-sm transition-all"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-semibold">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-medium text-gray-900">{archetype.shortName}</p>
                      <p className="text-xs text-gray-500">{archetype.pattern}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${config.bgColor} ${config.color}`}>
                      {config.label}
                    </span>
                    <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-center gap-4">
        <button
          onClick={onRestart}
          className="px-6 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-colors"
        >
          Retake Diagnostic
        </button>
        <Link
          href="/nsw-selective/practice"
          className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
        >
          Start Practicing
        </Link>
        <Link
          href="/nsw-selective"
          className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}

// =============================================================================
// MAIN DIAGNOSTIC CLIENT COMPONENT
// =============================================================================

export function DiagnosticClient() {
  const [phase, setPhase] = useState<DiagnosticPhase>('intro');
  const [questions, setQuestions] = useState<FirestoreQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [results, setResults] = useState<ArchetypeResult[]>([]);
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
  const [totalTimeUsed, setTotalTimeUsed] = useState(0);

  // 20 minute timer (1200 seconds)
  const TOTAL_TIME_SECONDS = 20 * 60;

  // Handle time up
  const handleTimeUp = useCallback(() => {
    // Auto-submit remaining questions as incorrect
    const currentResults = [...results];
    const remainingQuestions = questions.slice(currentIndex);

    remainingQuestions.forEach(q => {
      if (q.nswSelective?.archetypeId) {
        currentResults.push({
          archetypeId: q.nswSelective.archetypeId,
          questionId: q.questionId,
          isCorrect: false,
          timeSeconds: 0,
          selectedOption: '',
        });
      }
    });

    setResults(currentResults);
    setTotalTimeUsed(TOTAL_TIME_SECONDS);
    setPhase('results');
  }, [results, questions, currentIndex, TOTAL_TIME_SECONDS]);

  const timer = useCountdownTimer(TOTAL_TIME_SECONDS, handleTimeUp);

  // Fetch questions on mount
  useEffect(() => {
    async function fetchQuestions() {
      setLoading(true);
      try {
        const diagnosticQuestions = await getDiagnosticQuestions();
        setQuestions(diagnosticQuestions);
      } catch (error) {
        console.error('Error fetching diagnostic questions:', error);
        setQuestions([]);
      } finally {
        setLoading(false);
      }
    }

    fetchQuestions();
  }, []);

  // Start assessment
  const handleStart = useCallback(() => {
    setPhase('assessment');
    setCurrentIndex(0);
    setResults([]);
    setQuestionStartTime(Date.now());
    timer.reset();
    timer.start();
  }, [timer]);

  // Submit answer and move to next
  const handleSubmitAnswer = useCallback(() => {
    if (!selectedOption) return;

    const currentQuestion = questions[currentIndex];
    if (!currentQuestion || !currentQuestion.mcqOptions || !currentQuestion.nswSelective?.archetypeId) return;

    const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);
    const isCorrect = currentQuestion.mcqOptions.find(o => o.id === selectedOption)?.isCorrect || false;

    const newResult: ArchetypeResult = {
      archetypeId: currentQuestion.nswSelective.archetypeId,
      questionId: currentQuestion.questionId,
      isCorrect,
      timeSeconds: timeSpent,
      selectedOption,
    };

    const newResults = [...results, newResult];
    setResults(newResults);
    setSelectedOption(null);

    // Check if assessment complete
    if (currentIndex >= questions.length - 1) {
      timer.pause();
      setTotalTimeUsed(TOTAL_TIME_SECONDS - timer.remainingSeconds);
      setPhase('results');
    } else {
      setCurrentIndex(prev => prev + 1);
      setQuestionStartTime(Date.now());
    }
  }, [selectedOption, questions, currentIndex, questionStartTime, results, timer, TOTAL_TIME_SECONDS]);

  // Restart assessment
  const handleRestart = useCallback(() => {
    setPhase('intro');
    setCurrentIndex(0);
    setResults([]);
    setSelectedOption(null);
    timer.reset();
  }, [timer]);

  // Current question
  const currentQuestion = questions[currentIndex];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/nsw-selective" className="text-gray-500 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Diagnostic Assessment</h1>
                <p className="text-sm text-gray-500">
                  {phase === 'intro' && 'Discover your strengths and areas for growth'}
                  {phase === 'assessment' && `Question ${currentIndex + 1} of ${questions.length}`}
                  {phase === 'results' && 'Your results are ready'}
                </p>
              </div>
            </div>

            {/* Timer (only during assessment) */}
            {phase === 'assessment' && (
              <CountdownTimerDisplay seconds={timer.remainingSeconds} />
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Intro Phase */}
        {phase === 'intro' && (
          <IntroScreen onStart={handleStart} isLoading={loading || questions.length === 0} />
        )}

        {/* Assessment Phase */}
        {phase === 'assessment' && currentQuestion && (
          <div className="space-y-4">
            {/* Progress Bar */}
            <DiagnosticProgressBar current={currentIndex + 1} total={questions.length} />

            {/* Question Card */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              {/* Archetype Info */}
              {currentQuestion.nswSelective && (
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xs font-mono text-gray-400">
                    {currentQuestion.nswSelective.archetypeId.toUpperCase()}
                  </span>
                  <span className="text-gray-300">|</span>
                  <span className="text-xs text-gray-500">
                    {currentQuestion.nswSelective.archetype}
                  </span>
                </div>
              )}

              {/* Question Stem */}
              <div className="mb-6">
                <p className="text-lg text-gray-900 leading-relaxed">
                  {currentQuestion.stem}
                </p>
              </div>

              {/* MCQ Options */}
              {currentQuestion.mcqOptions && (
                <DiagnosticMCQOptions
                  options={currentQuestion.mcqOptions}
                  selectedOption={selectedOption}
                  onSelect={setSelectedOption}
                  disabled={false}
                />
              )}

              {/* Submit Button */}
              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleSubmitAnswer}
                  disabled={!selectedOption}
                  className={`px-6 py-3 rounded-xl font-medium transition-colors ${
                    selectedOption
                      ? 'bg-purple-600 text-white hover:bg-purple-700'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {currentIndex < questions.length - 1 ? 'Next Question' : 'Finish Assessment'}
                </button>
              </div>
            </div>

            {/* No Hints Notice */}
            <div className="bg-amber-50 rounded-lg border border-amber-200 p-3 text-center">
              <p className="text-sm text-amber-700">
                <strong>Note:</strong> Hints are not available during the diagnostic assessment.
              </p>
            </div>
          </div>
        )}

        {/* Results Phase */}
        {phase === 'results' && (
          <ResultsScreen
            results={results}
            questions={questions}
            totalTimeSeconds={totalTimeUsed}
            onRestart={handleRestart}
          />
        )}

        {/* Loading State (during assessment if no current question) */}
        {phase === 'assessment' && !currentQuestion && (
          <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Loading Question...</h3>
          </div>
        )}
      </main>
    </div>
  );
}

export default DiagnosticClient;

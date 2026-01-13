// =============================================================================
// SIMULATION CLIENT COMPONENT
// =============================================================================
// FILE: src/components/nsw-selective/SimulationClient.tsx
// DOMAIN: NSW Selective Exam Prep
// PURPOSE: Full exam simulation with 35 questions, 40 minute time limit
// DO NOT: Import curriculum components, show hints, show methodology (exam conditions)

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { FirestoreQuestion, FirestoreMCQOption, ArchetypeId } from '@/types';
import { ARCHETYPE_CATALOG } from '@/types/nsw-selective';
import { getSimulationQuestions } from '@/services/nsw-selective/archetypeService';

// =============================================================================
// TYPES
// =============================================================================

type SimulationPhase = 'pre_exam' | 'loading' | 'active' | 'times_up' | 'results';

interface AnswerRecord {
  questionId: string;
  archetypeId: ArchetypeId;
  difficulty: number;
  selectedOption: string | null;
  isCorrect: boolean;
  timeSpentSeconds: number;
}

interface SimulationResults {
  totalQuestions: number;
  correctCount: number;
  percentage: number;
  timeTakenSeconds: number;
  byDifficulty: Record<number, { correct: number; total: number }>;
  byArchetype: Record<ArchetypeId, { correct: number; total: number }>;
  answers: AnswerRecord[];
}

// =============================================================================
// CONSTANTS
// =============================================================================

const TOTAL_TIME_SECONDS = 40 * 60; // 40 minutes
const WARNING_10_MIN = 10 * 60;
const WARNING_5_MIN = 5 * 60;
const WARNING_1_MIN = 1 * 60;

// =============================================================================
// EXAM TIMER COMPONENT
// =============================================================================

function ExamTimer({
  remainingSeconds,
  onTimeUp
}: {
  remainingSeconds: number;
  onTimeUp: () => void;
}) {
  useEffect(() => {
    if (remainingSeconds <= 0) {
      onTimeUp();
    }
  }, [remainingSeconds, onTimeUp]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Determine warning state
  let timerClass = 'bg-gray-100 text-gray-700';
  let pulseClass = '';

  if (remainingSeconds <= WARNING_1_MIN) {
    timerClass = 'bg-red-100 text-red-700';
    pulseClass = 'animate-pulse';
  } else if (remainingSeconds <= WARNING_5_MIN) {
    timerClass = 'bg-orange-100 text-orange-700';
  } else if (remainingSeconds <= WARNING_10_MIN) {
    timerClass = 'bg-amber-100 text-amber-700';
  }

  return (
    <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-lg font-semibold ${timerClass} ${pulseClass}`}>
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>{formatTime(remainingSeconds)}</span>
    </div>
  );
}

// =============================================================================
// PROGRESS BAR COMPONENT
// =============================================================================

function SimulationProgress({ current, total }: { current: number; total: number }) {
  const percentage = (current / total) * 100;

  return (
    <div className="w-full">
      <div className="flex justify-between text-sm text-gray-500 mb-1">
        <span>Question {current} of {total}</span>
        <span>{Math.round(percentage)}% complete</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-purple-500 transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// =============================================================================
// MCQ OPTIONS (EXAM MODE - NO FEEDBACK DURING EXAM)
// =============================================================================

function ExamMCQOptions({
  options,
  selectedOption,
  onSelect,
  disabled,
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

        return (
          <button
            key={option.id}
            onClick={() => !disabled && onSelect(option.id)}
            disabled={disabled}
            className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
              isSelected
                ? 'border-purple-300 bg-purple-50'
                : 'border-gray-200 bg-white hover:bg-gray-50'
            } ${disabled ? 'cursor-default' : 'cursor-pointer hover:shadow-sm'}`}
          >
            <div className="flex items-start gap-3">
              <span
                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                  isSelected ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {option.id}
              </span>
              <div className="flex-1">
                <p className="text-gray-900">{option.text}</p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// =============================================================================
// TIME'S UP MODAL
// =============================================================================

function TimesUpModal({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-md mx-4 text-center shadow-2xl">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Time's Up!</h2>
        <p className="text-gray-600 mb-6">
          Your 40 minutes have ended. Any unanswered questions will be marked as incorrect.
        </p>
        <button
          onClick={onContinue}
          className="px-6 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-colors"
        >
          View Results
        </button>
      </div>
    </div>
  );
}

// =============================================================================
// RESULTS COMPONENT
// =============================================================================

function SimulationResultsView({
  results,
  questions,
  onReviewAnswers,
  onTryAgain,
}: {
  results: SimulationResults;
  questions: FirestoreQuestion[];
  onReviewAnswers: () => void;
  onTryAgain: () => void;
}) {
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getScoreColor = (percentage: number): string => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  const getScoreBg = (percentage: number): string => {
    if (percentage >= 80) return 'bg-green-100';
    if (percentage >= 60) return 'bg-amber-100';
    return 'bg-red-100';
  };

  // Find weak and strong archetypes
  const archetypeEntries = Object.entries(results.byArchetype) as [ArchetypeId, { correct: number; total: number }][];
  const weakArchetypes = archetypeEntries
    .filter(([, data]) => data.total > 0 && data.correct / data.total < 0.5)
    .map(([id]) => id);
  const strongArchetypes = archetypeEntries
    .filter(([, data]) => data.total > 0 && data.correct / data.total >= 0.8)
    .map(([id]) => id);

  return (
    <div className="space-y-6">
      {/* Main Score Card */}
      <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
        <div className={`w-24 h-24 ${getScoreBg(results.percentage)} rounded-full flex items-center justify-center mx-auto mb-4`}>
          <span className={`text-3xl font-bold ${getScoreColor(results.percentage)}`}>
            {results.percentage}%
          </span>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-2">Exam Complete!</h2>
        <p className="text-gray-500 mb-6">
          You scored {results.correctCount} out of {results.totalQuestions} questions
        </p>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 rounded-xl p-4">
            <p className={`text-2xl font-bold ${getScoreColor(results.percentage)}`}>
              {results.correctCount}/{results.totalQuestions}
            </p>
            <p className="text-xs text-gray-500 mt-1">Correct</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-2xl font-bold text-blue-600">
              {formatTime(results.timeTakenSeconds)}
            </p>
            <p className="text-xs text-gray-500 mt-1">Time Taken</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-2xl font-bold text-purple-600">
              {Math.round(results.timeTakenSeconds / results.totalQuestions)}s
            </p>
            <p className="text-xs text-gray-500 mt-1">Avg per Q</p>
          </div>
        </div>
      </div>

      {/* Difficulty Breakdown */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Performance by Difficulty</h3>
        <div className="space-y-3">
          {[
            { level: 1, label: 'Easy', color: 'bg-green-500' },
            { level: 2, label: 'Medium', color: 'bg-blue-500' },
            { level: 3, label: 'Challenging', color: 'bg-amber-500' },
            { level: 4, label: 'Hard', color: 'bg-red-500' },
          ].map(({ level, label, color }) => {
            const data = results.byDifficulty[level];
            if (!data || data.total === 0) return null;
            const pct = Math.round((data.correct / data.total) * 100);

            return (
              <div key={level} className="flex items-center gap-3">
                <span className="w-24 text-sm text-gray-600">{label}</span>
                <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
                </div>
                <span className="w-16 text-sm text-gray-700 text-right">
                  {data.correct}/{data.total}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Archetype Analysis */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Performance by Question Type</h3>

        {weakArchetypes.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-red-700 mb-2">Areas to Improve</h4>
            <div className="flex flex-wrap gap-2">
              {weakArchetypes.map((id) => (
                <Link
                  key={id}
                  href={`/nsw-selective/practice/${id}`}
                  className="px-3 py-1 bg-red-50 text-red-700 rounded-full text-sm hover:bg-red-100 transition-colors"
                >
                  {ARCHETYPE_CATALOG[id]?.shortName || id}
                </Link>
              ))}
            </div>
          </div>
        )}

        {strongArchetypes.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-green-700 mb-2">Strong Areas</h4>
            <div className="flex flex-wrap gap-2">
              {strongArchetypes.map((id) => (
                <span
                  key={id}
                  className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm"
                >
                  {ARCHETYPE_CATALOG[id]?.shortName || id}
                </span>
              ))}
            </div>
          </div>
        )}

        {weakArchetypes.length === 0 && strongArchetypes.length === 0 && (
          <p className="text-sm text-gray-500">
            Complete more questions to see archetype analysis.
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row justify-center gap-3">
        <button
          onClick={onReviewAnswers}
          className="px-6 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-colors"
        >
          Review Answers
        </button>
        <button
          onClick={onTryAgain}
          className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
        >
          Try Again
        </button>
        <Link
          href="/nsw-selective"
          className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors text-center"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}

// =============================================================================
// REVIEW ANSWERS COMPONENT
// =============================================================================

function ReviewAnswers({
  questions,
  answers,
  onBack,
}: {
  questions: FirestoreQuestion[];
  answers: AnswerRecord[];
  onBack: () => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const question = questions[currentIndex];
  const answer = answers[currentIndex];

  return (
    <div className="space-y-4">
      {/* Navigation */}
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Results
          </button>
          <span className="text-sm text-gray-500">
            Question {currentIndex + 1} of {questions.length}
          </span>
        </div>

        {/* Question grid */}
        <div className="grid grid-cols-7 sm:grid-cols-10 md:grid-cols-14 gap-2">
          {answers.map((a, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                i === currentIndex
                  ? 'bg-purple-600 text-white'
                  : a.isCorrect
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-red-100 text-red-700 hover:bg-red-200'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Question Review Card */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        {/* Status badge */}
        <div className="flex items-center gap-2 mb-4">
          {answer.isCorrect ? (
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
              Correct
            </span>
          ) : (
            <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
              Incorrect
            </span>
          )}
          <span className="text-sm text-gray-500">
            {ARCHETYPE_CATALOG[answer.archetypeId]?.shortName || answer.archetypeId}
          </span>
        </div>

        {/* Question stem */}
        <div className="mb-6">
          <p className="text-lg text-gray-900 leading-relaxed">{question.stem}</p>
        </div>

        {/* Options with feedback */}
        {question.mcqOptions && (
          <div className="space-y-3">
            {question.mcqOptions.map((option) => {
              const isSelected = answer.selectedOption === option.id;
              const isCorrectOption = option.isCorrect;

              let bgColor = 'bg-white';
              let borderColor = 'border-gray-200';

              if (isCorrectOption) {
                bgColor = 'bg-green-50';
                borderColor = 'border-green-300';
              } else if (isSelected && !isCorrectOption) {
                bgColor = 'bg-red-50';
                borderColor = 'border-red-300';
              }

              return (
                <div
                  key={option.id}
                  className={`p-4 rounded-xl border-2 ${borderColor} ${bgColor}`}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                        isCorrectOption
                          ? 'bg-green-500 text-white'
                          : isSelected
                          ? 'bg-red-500 text-white'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {option.id}
                    </span>
                    <div className="flex-1">
                      <p className="text-gray-900">{option.text}</p>
                      {option.feedback && (isSelected || isCorrectOption) && (
                        <p className={`mt-2 text-sm ${isCorrectOption ? 'text-green-700' : 'text-red-700'}`}>
                          {option.feedback}
                        </p>
                      )}
                    </div>
                    {isCorrectOption && (
                      <svg className="w-6 h-6 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    {isSelected && !isCorrectOption && (
                      <svg className="w-6 h-6 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Solution */}
        {question.solution && (
          <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
            <h4 className="text-sm font-medium text-blue-800 mb-2">Solution</h4>
            <div className="text-sm text-gray-700 prose prose-sm prose-slate max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {question.solution}
              </ReactMarkdown>
            </div>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="mt-6 flex justify-between">
          <button
            onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
            disabled={currentIndex === 0}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              currentIndex === 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Previous
          </button>
          <button
            onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
            disabled={currentIndex === questions.length - 1}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              currentIndex === questions.length - 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-purple-600 text-white hover:bg-purple-700'
            }`}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// MAIN SIMULATION CLIENT COMPONENT
// =============================================================================

export function SimulationClient() {
  const [phase, setPhase] = useState<SimulationPhase>('pre_exam');
  const [questions, setQuestions] = useState<FirestoreQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [remainingSeconds, setRemainingSeconds] = useState(TOTAL_TIME_SECONDS);
  const [results, setResults] = useState<SimulationResults | null>(null);
  const [showReview, setShowReview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmStart, setShowConfirmStart] = useState(false);

  const questionStartTime = useRef<number>(Date.now());
  const timerInterval = useRef<NodeJS.Timeout | null>(null);

  // Load questions
  const loadQuestions = useCallback(async () => {
    setPhase('loading');
    setError(null);

    try {
      const fetchedQuestions = await getSimulationQuestions();

      if (fetchedQuestions.length === 0) {
        setError('No questions available for simulation. Please try again later.');
        setPhase('pre_exam');
        return;
      }

      setQuestions(fetchedQuestions);
      setPhase('active');
      questionStartTime.current = Date.now();

      // Start timer
      timerInterval.current = setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            if (timerInterval.current) clearInterval(timerInterval.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      console.error('Error loading simulation questions:', err);
      setError('Failed to load questions. Please try again.');
      setPhase('pre_exam');
    }
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerInterval.current) clearInterval(timerInterval.current);
    };
  }, []);

  // Handle time up
  const handleTimeUp = useCallback(() => {
    if (timerInterval.current) clearInterval(timerInterval.current);

    // Record remaining unanswered questions as incorrect
    const currentQuestion = questions[currentIndex];
    const timeSpent = Math.floor((Date.now() - questionStartTime.current) / 1000);

    const updatedAnswers = [...answers];

    // Add current question if not yet recorded
    if (currentIndex < questions.length && updatedAnswers.length <= currentIndex) {
      updatedAnswers.push({
        questionId: currentQuestion.questionId,
        archetypeId: currentQuestion.nswSelective?.archetypeId || 'qa1',
        difficulty: currentQuestion.difficulty,
        selectedOption: selectedOption,
        isCorrect: selectedOption
          ? currentQuestion.mcqOptions?.find((o) => o.id === selectedOption)?.isCorrect || false
          : false,
        timeSpentSeconds: timeSpent,
      });
    }

    // Add remaining unanswered questions
    for (let i = updatedAnswers.length; i < questions.length; i++) {
      const q = questions[i];
      updatedAnswers.push({
        questionId: q.questionId,
        archetypeId: q.nswSelective?.archetypeId || 'qa1',
        difficulty: q.difficulty,
        selectedOption: null,
        isCorrect: false,
        timeSpentSeconds: 0,
      });
    }

    setAnswers(updatedAnswers);
    setPhase('times_up');
  }, [questions, currentIndex, answers, selectedOption]);

  // Calculate results
  const calculateResults = useCallback((): SimulationResults => {
    const byDifficulty: Record<number, { correct: number; total: number }> = {};
    const byArchetype: Record<string, { correct: number; total: number }> = {};

    let correctCount = 0;
    let totalTime = 0;

    answers.forEach((answer) => {
      if (answer.isCorrect) correctCount++;
      totalTime += answer.timeSpentSeconds;

      // By difficulty
      if (!byDifficulty[answer.difficulty]) {
        byDifficulty[answer.difficulty] = { correct: 0, total: 0 };
      }
      byDifficulty[answer.difficulty].total++;
      if (answer.isCorrect) byDifficulty[answer.difficulty].correct++;

      // By archetype
      if (!byArchetype[answer.archetypeId]) {
        byArchetype[answer.archetypeId] = { correct: 0, total: 0 };
      }
      byArchetype[answer.archetypeId].total++;
      if (answer.isCorrect) byArchetype[answer.archetypeId].correct++;
    });

    return {
      totalQuestions: questions.length,
      correctCount,
      percentage: Math.round((correctCount / questions.length) * 100),
      timeTakenSeconds: TOTAL_TIME_SECONDS - remainingSeconds,
      byDifficulty,
      byArchetype: byArchetype as Record<ArchetypeId, { correct: number; total: number }>,
      answers,
    };
  }, [answers, questions.length, remainingSeconds]);

  // Handle next question
  const handleNext = useCallback(() => {
    const currentQuestion = questions[currentIndex];
    const timeSpent = Math.floor((Date.now() - questionStartTime.current) / 1000);

    // Record answer
    const isCorrect = selectedOption
      ? currentQuestion.mcqOptions?.find((o) => o.id === selectedOption)?.isCorrect || false
      : false;

    const newAnswer: AnswerRecord = {
      questionId: currentQuestion.questionId,
      archetypeId: currentQuestion.nswSelective?.archetypeId || 'qa1',
      difficulty: currentQuestion.difficulty,
      selectedOption,
      isCorrect,
      timeSpentSeconds: timeSpent,
    };

    const updatedAnswers = [...answers, newAnswer];
    setAnswers(updatedAnswers);

    // Check if exam is complete
    if (currentIndex >= questions.length - 1) {
      // Stop timer
      if (timerInterval.current) clearInterval(timerInterval.current);

      // Calculate and show results
      setAnswers(updatedAnswers);
      setPhase('results');
    } else {
      // Move to next question
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      questionStartTime.current = Date.now();
    }
  }, [currentIndex, questions, selectedOption, answers]);

  // Process results after phase change
  useEffect(() => {
    if (phase === 'results' && !results) {
      setResults(calculateResults());
    }
  }, [phase, results, calculateResults]);

  // Handle try again
  const handleTryAgain = useCallback(() => {
    setQuestions([]);
    setCurrentIndex(0);
    setSelectedOption(null);
    setAnswers([]);
    setRemainingSeconds(TOTAL_TIME_SECONDS);
    setResults(null);
    setShowReview(false);
    setPhase('pre_exam');
  }, []);

  // Continue from time's up modal
  const handleContinueFromTimesUp = useCallback(() => {
    setPhase('results');
  }, []);

  // =============================================================================
  // RENDER PHASES
  // =============================================================================

  // Pre-exam phase
  if (phase === 'pre_exam') {
    return (
      <div className="space-y-6">
        {/* Confirmation Modal */}
        {showConfirmStart && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 max-w-md mx-4 shadow-2xl">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Start Exam Simulation?</h3>
              <p className="text-gray-600 mb-6">
                Once you start, the 40-minute timer will begin immediately. You cannot pause or go back to previous questions.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmStart(false)}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowConfirmStart(false);
                    loadQuestions();
                  }}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors"
                >
                  Start Now
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
            {error}
          </div>
        )}

        {/* Start button */}
        <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Ready to Begin?</h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            This simulation matches the real NSW Selective Mathematics exam. Make sure you have 40 uninterrupted minutes.
          </p>
          <button
            onClick={() => setShowConfirmStart(true)}
            className="px-8 py-4 bg-red-600 text-white rounded-xl font-semibold text-lg hover:bg-red-700 transition-colors"
          >
            Start Exam Simulation
          </button>
        </div>
      </div>
    );
  }

  // Loading phase
  if (phase === 'loading') {
    return (
      <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
        <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Preparing your exam...</p>
      </div>
    );
  }

  // Time's up modal
  if (phase === 'times_up') {
    return <TimesUpModal onContinue={handleContinueFromTimesUp} />;
  }

  // Results phase
  if (phase === 'results' && results) {
    if (showReview) {
      return (
        <ReviewAnswers
          questions={questions}
          answers={results.answers}
          onBack={() => setShowReview(false)}
        />
      );
    }

    return (
      <SimulationResultsView
        results={results}
        questions={questions}
        onReviewAnswers={() => setShowReview(true)}
        onTryAgain={handleTryAgain}
      />
    );
  }

  // Active exam phase
  const currentQuestion = questions[currentIndex];

  if (!currentQuestion) {
    return (
      <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
        <p className="text-gray-600">No question available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Timer and Progress */}
      <div className="flex items-center justify-between gap-4">
        <SimulationProgress current={currentIndex + 1} total={questions.length} />
        <ExamTimer remainingSeconds={remainingSeconds} onTimeUp={handleTimeUp} />
      </div>

      {/* Warning banner */}
      {remainingSeconds <= WARNING_1_MIN && remainingSeconds > 0 && (
        <div className="bg-red-100 border border-red-300 rounded-xl p-3 text-center text-red-700 font-medium animate-pulse">
          Less than 1 minute remaining!
        </div>
      )}
      {remainingSeconds <= WARNING_5_MIN && remainingSeconds > WARNING_1_MIN && (
        <div className="bg-orange-100 border border-orange-300 rounded-xl p-3 text-center text-orange-700 font-medium">
          5 minutes remaining - stay focused!
        </div>
      )}
      {remainingSeconds <= WARNING_10_MIN && remainingSeconds > WARNING_5_MIN && (
        <div className="bg-amber-100 border border-amber-300 rounded-xl p-3 text-center text-amber-700 font-medium">
          10 minutes remaining
        </div>
      )}

      {/* Question Card */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        {/* Question stem */}
        <div className="mb-6">
          <p className="text-lg text-gray-900 leading-relaxed">{currentQuestion.stem}</p>
        </div>

        {/* MCQ Options */}
        {currentQuestion.mcqOptions && (
          <ExamMCQOptions
            options={currentQuestion.mcqOptions}
            selectedOption={selectedOption}
            onSelect={setSelectedOption}
            disabled={false}
          />
        )}

        {/* Next button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleNext}
            className={`px-6 py-3 rounded-xl font-medium transition-colors ${
              selectedOption
                ? 'bg-purple-600 text-white hover:bg-purple-700'
                : 'bg-gray-200 text-gray-500'
            }`}
          >
            {currentIndex < questions.length - 1 ? 'Next Question' : 'Finish Exam'}
          </button>
        </div>
      </div>

      {/* No going back reminder */}
      <p className="text-center text-sm text-gray-400">
        You cannot return to previous questions
      </p>
    </div>
  );
}

export default SimulationClient;

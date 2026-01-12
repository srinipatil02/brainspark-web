'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { FirestoreQuestion, isMathQuestion, isWorkedSolutionQuestion, WorkedSolutionAnswer, EncouragingHint } from '@/types';
import { ConceptChatWidget } from '@/components/chat';
import { ConceptContext } from '@/lib/chatTypes';
import { useSetProgress } from '@/hooks/useSetProgress';
import { GradingResult, SetAttempt } from '@/types/grading';
import { gradeAnswer, shouldCelebrate, getEncouragingMessage } from '@/services/gradingService';
import { updateSkillMastery } from '@/services/masteryService';
import { GradingResultCard } from '@/components/GradingResultCard';
import { SetCompletionReport } from '@/components/SetCompletionReport';
import dynamic from 'next/dynamic';
import { QuestionRenderer } from '@/components/QuestionRenderer';

// Define MathfieldElement interface (avoids importing from mathlive at build time)
interface MathfieldElement extends HTMLElement {
  value: string;
  getValue(format?: string): string;
  insert(text: string, options?: { insertionMode?: string; selectionMode?: string }): void;
  executeCommand(command: string): void;
  focus(): void;
}

// Dynamically import MathInputField to avoid SSR issues with MathLive
const MathInputField = dynamic(
  () => import('@/components/math/MathInputField').then(mod => mod.MathInputField),
  { ssr: false, loading: () => <div className="h-12 bg-gray-100 rounded-lg animate-pulse" /> }
);
const MathKeypad = dynamic(
  () => import('@/components/math/MathKeypad').then(mod => mod.MathKeypad),
  { ssr: false }
);
// Student-centered "Show Your Work" component for WORKED_SOLUTION questions
const WorkedSolutionInput = dynamic(
  () => import('@/components/math/WorkedSolutionInput').then(mod => mod.WorkedSolutionInput),
  { ssr: false, loading: () => <div className="h-48 bg-gray-100 rounded-xl animate-pulse" /> }
);

interface SetMetadata {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  firestoreSetId: string;
  topics: string[];
  backLink: string;
  backText: string;
  misconceptions?: string[];
}

interface SetPlayerClientProps {
  setNumber: number;
  setMeta: SetMetadata;
}

// Color utility - returns complete Tailwind class names for static analysis
// IMPORTANT: All classes must be complete strings - no dynamic generation!
function getColorClasses(color: string) {
  const colors: Record<string, {
    bg: string;
    bgLight: string;
    text: string;
    textHover: string;
    border: string;
    spinnerBorder: string;
    gradient: string;
    buttonBg: string;
    buttonHover: string;
    progressBg: string;
    focusRing: string;
  }> = {
    emerald: {
      bg: 'bg-emerald-500',
      bgLight: 'bg-emerald-50',
      text: 'text-emerald-600',
      textHover: 'hover:text-emerald-700',
      border: 'border-emerald-200',
      spinnerBorder: 'border-emerald-600',
      gradient: 'from-emerald-50 to-teal-50',
      buttonBg: 'bg-emerald-600',
      buttonHover: 'hover:bg-emerald-700',
      progressBg: 'bg-gradient-to-r from-emerald-500 to-emerald-600',
      focusRing: 'focus:ring-emerald-500 focus:border-emerald-500',
    },
    amber: {
      bg: 'bg-amber-500',
      bgLight: 'bg-amber-50',
      text: 'text-amber-600',
      textHover: 'hover:text-amber-700',
      border: 'border-amber-200',
      spinnerBorder: 'border-amber-600',
      gradient: 'from-amber-50 to-orange-50',
      buttonBg: 'bg-amber-600',
      buttonHover: 'hover:bg-amber-700',
      progressBg: 'bg-gradient-to-r from-amber-500 to-amber-600',
      focusRing: 'focus:ring-amber-500 focus:border-amber-500',
    },
    red: {
      bg: 'bg-red-500',
      bgLight: 'bg-red-50',
      text: 'text-red-600',
      textHover: 'hover:text-red-700',
      border: 'border-red-200',
      spinnerBorder: 'border-red-600',
      gradient: 'from-red-50 to-pink-50',
      buttonBg: 'bg-red-600',
      buttonHover: 'hover:bg-red-700',
      progressBg: 'bg-gradient-to-r from-red-500 to-red-600',
      focusRing: 'focus:ring-red-500 focus:border-red-500',
    },
    purple: {
      bg: 'bg-purple-500',
      bgLight: 'bg-purple-50',
      text: 'text-purple-600',
      textHover: 'hover:text-purple-700',
      border: 'border-purple-200',
      spinnerBorder: 'border-purple-600',
      gradient: 'from-purple-50 to-indigo-50',
      buttonBg: 'bg-purple-600',
      buttonHover: 'hover:bg-purple-700',
      progressBg: 'bg-gradient-to-r from-purple-500 to-purple-600',
      focusRing: 'focus:ring-purple-500 focus:border-purple-500',
    },
    blue: {
      bg: 'bg-blue-500',
      bgLight: 'bg-blue-50',
      text: 'text-blue-600',
      textHover: 'hover:text-blue-700',
      border: 'border-blue-200',
      spinnerBorder: 'border-blue-600',
      gradient: 'from-blue-50 to-cyan-50',
      buttonBg: 'bg-blue-600',
      buttonHover: 'hover:bg-blue-700',
      progressBg: 'bg-gradient-to-r from-blue-500 to-blue-600',
      focusRing: 'focus:ring-blue-500 focus:border-blue-500',
    },
    rose: {
      bg: 'bg-rose-500',
      bgLight: 'bg-rose-50',
      text: 'text-rose-600',
      textHover: 'hover:text-rose-700',
      border: 'border-rose-200',
      spinnerBorder: 'border-rose-600',
      gradient: 'from-rose-50 to-pink-50',
      buttonBg: 'bg-rose-600',
      buttonHover: 'hover:bg-rose-700',
      progressBg: 'bg-gradient-to-r from-rose-500 to-rose-600',
      focusRing: 'focus:ring-rose-500 focus:border-rose-500',
    },
    orange: {
      bg: 'bg-orange-500',
      bgLight: 'bg-orange-50',
      text: 'text-orange-600',
      textHover: 'hover:text-orange-700',
      border: 'border-orange-200',
      spinnerBorder: 'border-orange-600',
      gradient: 'from-orange-50 to-amber-50',
      buttonBg: 'bg-orange-600',
      buttonHover: 'hover:bg-orange-700',
      progressBg: 'bg-gradient-to-r from-orange-500 to-orange-600',
      focusRing: 'focus:ring-orange-500 focus:border-orange-500',
    },
    yellow: {
      bg: 'bg-yellow-500',
      bgLight: 'bg-yellow-50',
      text: 'text-yellow-600',
      textHover: 'hover:text-yellow-700',
      border: 'border-yellow-200',
      spinnerBorder: 'border-yellow-600',
      gradient: 'from-yellow-50 to-amber-50',
      buttonBg: 'bg-yellow-600',
      buttonHover: 'hover:bg-yellow-700',
      progressBg: 'bg-gradient-to-r from-yellow-500 to-yellow-600',
      focusRing: 'focus:ring-yellow-500 focus:border-yellow-500',
    },
    lime: {
      bg: 'bg-lime-500',
      bgLight: 'bg-lime-50',
      text: 'text-lime-600',
      textHover: 'hover:text-lime-700',
      border: 'border-lime-200',
      spinnerBorder: 'border-lime-600',
      gradient: 'from-lime-50 to-green-50',
      buttonBg: 'bg-lime-600',
      buttonHover: 'hover:bg-lime-700',
      progressBg: 'bg-gradient-to-r from-lime-500 to-lime-600',
      focusRing: 'focus:ring-lime-500 focus:border-lime-500',
    },
    green: {
      bg: 'bg-green-500',
      bgLight: 'bg-green-50',
      text: 'text-green-600',
      textHover: 'hover:text-green-700',
      border: 'border-green-200',
      spinnerBorder: 'border-green-600',
      gradient: 'from-green-50 to-emerald-50',
      buttonBg: 'bg-green-600',
      buttonHover: 'hover:bg-green-700',
      progressBg: 'bg-gradient-to-r from-green-500 to-green-600',
      focusRing: 'focus:ring-green-500 focus:border-green-500',
    },
    teal: {
      bg: 'bg-teal-500',
      bgLight: 'bg-teal-50',
      text: 'text-teal-600',
      textHover: 'hover:text-teal-700',
      border: 'border-teal-200',
      spinnerBorder: 'border-teal-600',
      gradient: 'from-teal-50 to-cyan-50',
      buttonBg: 'bg-teal-600',
      buttonHover: 'hover:bg-teal-700',
      progressBg: 'bg-gradient-to-r from-teal-500 to-teal-600',
      focusRing: 'focus:ring-teal-500 focus:border-teal-500',
    },
    cyan: {
      bg: 'bg-cyan-500',
      bgLight: 'bg-cyan-50',
      text: 'text-cyan-600',
      textHover: 'hover:text-cyan-700',
      border: 'border-cyan-200',
      spinnerBorder: 'border-cyan-600',
      gradient: 'from-cyan-50 to-blue-50',
      buttonBg: 'bg-cyan-600',
      buttonHover: 'hover:bg-cyan-700',
      progressBg: 'bg-gradient-to-r from-cyan-500 to-cyan-600',
      focusRing: 'focus:ring-cyan-500 focus:border-cyan-500',
    },
    sky: {
      bg: 'bg-sky-500',
      bgLight: 'bg-sky-50',
      text: 'text-sky-600',
      textHover: 'hover:text-sky-700',
      border: 'border-sky-200',
      spinnerBorder: 'border-sky-600',
      gradient: 'from-sky-50 to-blue-50',
      buttonBg: 'bg-sky-600',
      buttonHover: 'hover:bg-sky-700',
      progressBg: 'bg-gradient-to-r from-sky-500 to-sky-600',
      focusRing: 'focus:ring-sky-500 focus:border-sky-500',
    },
    stone: {
      bg: 'bg-stone-500',
      bgLight: 'bg-stone-50',
      text: 'text-stone-600',
      textHover: 'hover:text-stone-700',
      border: 'border-stone-200',
      spinnerBorder: 'border-stone-600',
      gradient: 'from-stone-50 to-gray-50',
      buttonBg: 'bg-stone-600',
      buttonHover: 'hover:bg-stone-700',
      progressBg: 'bg-gradient-to-r from-stone-500 to-stone-600',
      focusRing: 'focus:ring-stone-500 focus:border-stone-500',
    },
    zinc: {
      bg: 'bg-zinc-500',
      bgLight: 'bg-zinc-50',
      text: 'text-zinc-600',
      textHover: 'hover:text-zinc-700',
      border: 'border-zinc-200',
      spinnerBorder: 'border-zinc-600',
      gradient: 'from-zinc-50 to-gray-50',
      buttonBg: 'bg-zinc-600',
      buttonHover: 'hover:bg-zinc-700',
      progressBg: 'bg-gradient-to-r from-zinc-500 to-zinc-600',
      focusRing: 'focus:ring-zinc-500 focus:border-zinc-500',
    },
    slate: {
      bg: 'bg-slate-500',
      bgLight: 'bg-slate-50',
      text: 'text-slate-600',
      textHover: 'hover:text-slate-700',
      border: 'border-slate-200',
      spinnerBorder: 'border-slate-600',
      gradient: 'from-slate-50 to-gray-50',
      buttonBg: 'bg-slate-600',
      buttonHover: 'hover:bg-slate-700',
      progressBg: 'bg-gradient-to-r from-slate-500 to-slate-600',
      focusRing: 'focus:ring-slate-500 focus:border-slate-500',
    },
    gray: {
      bg: 'bg-gray-500',
      bgLight: 'bg-gray-50',
      text: 'text-gray-600',
      textHover: 'hover:text-gray-700',
      border: 'border-gray-200',
      spinnerBorder: 'border-gray-600',
      gradient: 'from-gray-50 to-slate-50',
      buttonBg: 'bg-gray-600',
      buttonHover: 'hover:bg-gray-700',
      progressBg: 'bg-gradient-to-r from-gray-500 to-gray-600',
      focusRing: 'focus:ring-gray-500 focus:border-gray-500',
    },
    neutral: {
      bg: 'bg-neutral-500',
      bgLight: 'bg-neutral-50',
      text: 'text-neutral-600',
      textHover: 'hover:text-neutral-700',
      border: 'border-neutral-200',
      spinnerBorder: 'border-neutral-600',
      gradient: 'from-neutral-50 to-gray-50',
      buttonBg: 'bg-neutral-600',
      buttonHover: 'hover:bg-neutral-700',
      progressBg: 'bg-gradient-to-r from-neutral-500 to-neutral-600',
      focusRing: 'focus:ring-neutral-500 focus:border-neutral-500',
    },
    indigo: {
      bg: 'bg-indigo-500',
      bgLight: 'bg-indigo-50',
      text: 'text-indigo-600',
      textHover: 'hover:text-indigo-700',
      border: 'border-indigo-200',
      spinnerBorder: 'border-indigo-600',
      gradient: 'from-indigo-50 to-purple-50',
      buttonBg: 'bg-indigo-600',
      buttonHover: 'hover:bg-indigo-700',
      progressBg: 'bg-gradient-to-r from-indigo-500 to-indigo-600',
      focusRing: 'focus:ring-indigo-500 focus:border-indigo-500',
    },
  };
  return colors[color] || colors.emerald;
}

// Format question stem with proper markdown-like rendering
function formatQuestionStem(stem: string): string {
  return stem
    // Headers: ## Title
    .replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold text-gray-900 mb-4 mt-2">$1</h2>')
    // Bold: **text**
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
    // Numbered lists: 1. item
    .replace(/^(\d+)\. (.+)$/gm, '<div class="flex gap-3 mb-2"><span class="flex-shrink-0 w-6 h-6 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-sm font-medium">$1</span><span class="text-gray-700">$2</span></div>')
    // Bullet points: - item
    .replace(/^- (.+)$/gm, '<div class="flex gap-3 mb-2"><span class="flex-shrink-0 w-2 h-2 bg-emerald-500 rounded-full mt-2"></span><span class="text-gray-700">$1</span></div>')
    // Double newlines to paragraphs
    .replace(/\n\n/g, '</p><p class="mb-4 text-gray-700 leading-relaxed">')
    // Single newlines to line breaks (but not after list items)
    .replace(/(?<!<\/div>)\n(?!<div)/g, '<br/>');
}

// Format solution with proper styling
function formatSolution(solution: string): string {
  return solution
    // Headers
    .replace(/^## (.+)$/gm, '<h3 class="font-semibold text-gray-800 mt-4 mb-2">$1</h3>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Numbered lists
    .replace(/^(\d+)\. (.+)$/gm, '<div class="flex gap-3 mb-2"><span class="flex-shrink-0 w-5 h-5 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-xs font-medium">$1</span><span class="text-gray-700">$2</span></div>')
    // Bullet points
    .replace(/^- (.+)$/gm, '<div class="flex gap-2 mb-1"><span class="text-emerald-500 mt-1">•</span><span class="text-gray-700">$1</span></div>')
    // Paragraphs
    .replace(/\n\n/g, '</p><p class="mb-3">')
    .replace(/(?<!<\/div>)\n(?!<div)/g, '<br/>');
}

// Circular Progress Ring Component
function ProgressRing({ progress, size = 56, strokeWidth = 4, color = 'emerald' }: {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  const colorMap: Record<string, string> = {
    emerald: '#10b981',
    amber: '#f59e0b',
    red: '#ef4444',
    purple: '#8b5cf6',
    blue: '#3b82f6',
    rose: '#f43f5e',
  };

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          className="text-gray-200"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className="transition-all duration-500 ease-out"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          stroke={colorMap[color] || colorMap.emerald}
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: offset,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold text-gray-700">{progress}%</span>
      </div>
    </div>
  );
}

// Confetti Component
function Confetti({ show }: { show: boolean }) {
  if (!show) return null;

  const colors = ['#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6', '#f43f5e'];
  const confettiPieces = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 0.5,
    color: colors[Math.floor(Math.random() * colors.length)],
    size: Math.random() * 8 + 4,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {confettiPieces.map((piece) => (
        <div
          key={piece.id}
          className="absolute animate-confetti"
          style={{
            left: `${piece.left}%`,
            top: '-20px',
            width: piece.size,
            height: piece.size,
            backgroundColor: piece.color,
            animationDelay: `${piece.delay}s`,
            borderRadius: Math.random() > 0.5 ? '50%' : '0',
          }}
        />
      ))}
    </div>
  );
}

export function SetPlayerClient({ setNumber, setMeta }: SetPlayerClientProps) {
  const colorClasses = getColorClasses(setMeta.color);
  const [questions, setQuestions] = useState<FirestoreQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Math input state (for EQUATION_ENTRY and MULTI_STEP_MATH question types)
  const [mathAnswerLatex, setMathAnswerLatex] = useState('');
  const [mathAnswerPlainText, setMathAnswerPlainText] = useState('');
  const [showMathKeypad, setShowMathKeypad] = useState(true);
  const mathFieldRef = useRef<MathfieldElement | null>(null);

  // Worked solution state (for student-centered "show your work" questions)
  const [workedSolutionAnswer, setWorkedSolutionAnswer] = useState<WorkedSolutionAnswer | null>(null);

  // Grading state
  const [gradingResult, setGradingResult] = useState<GradingResult | null>(null);
  const [isGrading, setIsGrading] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // Completion report state
  const [showCompletionReport, setShowCompletionReport] = useState(false);
  const [completedAttempt, setCompletedAttempt] = useState<SetAttempt | null>(null);

  const {
    progress,
    progressPercent,
    markCompleted,
    isQuestionCompleted,
    getResult,
    totalScore,
    totalMaxScore,
    scorePercent,
    correctCount,
    // Attempt tracking
    attemptHistory,
    bestPercentage,
    completeAttempt,
    startNewAttempt,
    isSetComplete,
  } = useSetProgress(setMeta.id, questions.length);

  // Fetch questions for this set
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const q = query(
          collection(db, 'questions'),
          where('paperMetadata.setId', '==', setMeta.firestoreSetId)
        );

        const snapshot = await getDocs(q);
        const allQuestions = snapshot.docs.map(doc => ({
          ...doc.data(),
          questionId: doc.id,
        })) as FirestoreQuestion[];

        // Sort by questionId to maintain consistent order
        allQuestions.sort((a, b) => a.questionId.localeCompare(b.questionId));

        // Use all questions returned - each set has its own unique setId
        // No slicing needed since we query by specific setId
        setQuestions(allQuestions);
      } catch (error) {
        console.error('Error fetching questions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuestions();
  }, [setMeta.firestoreSetId]);

  const currentQuestion = questions[currentQuestionIndex];
  const isComplete = isQuestionCompleted(currentQuestionIndex);
  const previousResult = getResult(currentQuestionIndex);

  // Track previous question index to detect navigation vs progress updates
  const prevQuestionIndexRef = useRef(currentQuestionIndex);

  // Load previous results ONLY when navigating to a different question
  // This prevents overwriting fresh grading results after submission
  useEffect(() => {
    const isNavigation = prevQuestionIndexRef.current !== currentQuestionIndex;
    prevQuestionIndexRef.current = currentQuestionIndex;

    // Only load stored results when navigating to a different question
    if (!isNavigation) {
      return; // Don't overwrite current state on progress updates
    }

    if (previousResult) {
      // Load previous grading result - use stored feedback if available
      setHasSubmitted(true);

      // Fallback feedback for older results that don't have stored feedback
      const fallbackFeedback = {
        summary: previousResult.correctness === 'correct'
          ? 'You answered this question correctly!'
          : previousResult.correctness === 'partial'
            ? 'You partially answered this question.'
            : 'Review the solution to understand the correct answer.',
        whatWasRight: [],
        whatWasMissing: [],
        misconceptions: [],
        suggestions: [],
      };

      // Normalize all fields to prevent undefined errors
      setGradingResult({
        score: previousResult.score ?? 0,
        maxScore: previousResult.maxScore ?? 1,
        percentage: previousResult.percentage ?? 0,
        correctness: previousResult.correctness || 'incorrect',
        feedback: previousResult.feedback || fallbackFeedback,
        gradedAt: previousResult.gradedAt || new Date().toISOString(),
        gradedBy: previousResult.gradedBy || 'auto',
        confidence: 1,
      });
      setUserAnswer(previousResult.answer || '');
    } else {
      setHasSubmitted(false);
      setGradingResult(null);
      setUserAnswer('');
      setSelectedOptionId(null);
    }
  }, [currentQuestionIndex, previousResult]);

  const navigateToQuestion = (index: number) => {
    if (index === currentQuestionIndex) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentQuestionIndex(index);
      setUserAnswer('');
      setSelectedOptionId(null);
      setMathAnswerLatex('');
      setMathAnswerPlainText('');
      setWorkedSolutionAnswer(null);  // Clear worked solution state
      setShowHint(false);
      setShowSolution(false);
      setGradingResult(null);
      setHasSubmitted(false);
      setTimeout(() => setIsTransitioning(false), 50);
    }, 150);
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      navigateToQuestion(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      navigateToQuestion(currentQuestionIndex - 1);
    }
  };


  // Submit answer for grading
  const handleSubmitAnswer = async () => {
    if (!currentQuestion) return;

    // Determine question type and validation requirements
    const isMCQ = currentQuestion.questionType === 'MCQ';
    const isMathType = isMathQuestion(currentQuestion);
    const isWorkedSolution = isWorkedSolutionQuestion(currentQuestion);

    // Validate input based on question type
    if (isMCQ && !selectedOptionId) return;
    if (isWorkedSolution && (!workedSolutionAnswer || !workedSolutionAnswer.finalAnswer.trim())) return;
    if (isMathType && !isWorkedSolution && !mathAnswerLatex.trim()) return;
    if (!isMCQ && !isMathType && !userAnswer.trim()) return;

    setIsGrading(true);

    try {
      // Find correct option for MCQ
      const correctOption = currentQuestion.mcqOptions?.find(o => o.isCorrect);

      // Determine the student answer based on question type
      let studentAnswer: string;
      if (isMCQ) {
        studentAnswer = selectedOptionId || '';
      } else if (isWorkedSolution && workedSolutionAnswer) {
        // For WORKED_SOLUTION, serialize the full answer (working + final answer)
        studentAnswer = JSON.stringify({
          workLines: workedSolutionAnswer.workLines,
          finalAnswer: workedSolutionAnswer.finalAnswer,
          finalAnswerPlainText: workedSolutionAnswer.finalAnswerPlainText,
        });
      } else if (isMathType) {
        // For other math questions, use LaTeX as primary answer
        studentAnswer = mathAnswerLatex;
      } else {
        studentAnswer = userAnswer;
      }

      const result = await gradeAnswer({
        questionId: currentQuestion.questionId,
        questionType: currentQuestion.questionType,
        questionStem: currentQuestion.stem,
        modelSolution: currentQuestion.solution || '',
        studentAnswer,
        correctAnswer: currentQuestion.workedSolutionConfig?.expectedAnswers?.[0],
        selectedOptionId: selectedOptionId || undefined,
        correctOptionId: correctOption?.id,
        mcqOptions: currentQuestion.mcqOptions?.map(o => ({
          id: o.id,
          text: o.text,
          isCorrect: o.isCorrect,
          feedback: o.feedback,
        })),
        curriculum: currentQuestion.curriculum ? {
          subject: currentQuestion.curriculum.subject,
          year: currentQuestion.curriculum.year,
          topic: currentQuestion.curriculum.strand,
        } : undefined,
        difficulty: currentQuestion.difficulty ?? 3,  // Default to medium difficulty if not set
        // Include math-specific context for AI grading
        ...(isMathType && !isWorkedSolution && {
          studentAnswerLatex: mathAnswerLatex,
          studentAnswerPlainText: mathAnswerPlainText,
        }),
      });

      setGradingResult(result);
      setHasSubmitted(true);

      // Save to progress - use appropriate answer format based on question type
      const savedAnswer = isMCQ
        ? (selectedOptionId || '')
        : isWorkedSolution && workedSolutionAnswer
          ? JSON.stringify(workedSolutionAnswer)
          : isMathType
            ? mathAnswerLatex
            : userAnswer;
      markCompleted(currentQuestionIndex, savedAnswer, result);

      // Update skill mastery tracking (Phase 4)
      if (currentQuestion.curriculum) {
        const skillId = `${currentQuestion.curriculum.subject}-${currentQuestion.curriculum.strand}-y${currentQuestion.curriculum.year}`.toLowerCase().replace(/\s+/g, '-');
        const skillName = `${currentQuestion.curriculum.strand} (Year ${currentQuestion.curriculum.year})`;
        const topic = currentQuestion.curriculum.strand;
        const isCorrect = result.correctness === 'correct' || (result.correctness === 'partial' && result.score >= result.maxScore * 0.7);

        updateSkillMastery(
          skillId,
          skillName,
          topic,
          currentQuestion.curriculum.subject,
          currentQuestion.curriculum.year,
          isCorrect,
          result.score / result.maxScore
        );
      }

      // Celebrate if perfect!
      if (shouldCelebrate(result)) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
      }

      // Check if all questions now complete
      const newCompletedCount = questions.filter((_, idx) =>
        idx === currentQuestionIndex ? true : isQuestionCompleted(idx)
      ).length;

      if (newCompletedCount === questions.length) {
        // All questions completed - big celebration and show report!
        setTimeout(async () => {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 5000);

          // Complete the attempt and get the summary
          const attempt = await completeAttempt();
          if (attempt) {
            setCompletedAttempt(attempt);
            // Show report after a brief delay for confetti
            setTimeout(() => setShowCompletionReport(true), 1500);
          }
        }, 500);
      }
    } catch (error) {
      console.error('Grading failed:', error);
      // Still allow progression even if grading fails
      setHasSubmitted(true);
    } finally {
      setIsGrading(false);
    }
  };

  // Retry the current question
  const handleRetry = () => {
    setHasSubmitted(false);
    setGradingResult(null);
    setUserAnswer('');
    setSelectedOptionId(null);
    setMathAnswerLatex('');
    setMathAnswerPlainText('');
    setWorkedSolutionAnswer(null);
  };

  // Start a new attempt (try the whole set again)
  const handleTryAgain = async () => {
    await startNewAttempt();
    setShowCompletionReport(false);
    setCompletedAttempt(null);
    setCurrentQuestionIndex(0);
    setUserAnswer('');
    setSelectedOptionId(null);
    setMathAnswerLatex('');
    setMathAnswerPlainText('');
    setWorkedSolutionAnswer(null);
    setShowHint(false);
    setShowSolution(false);
    setGradingResult(null);
    setHasSubmitted(false);
  };

  // Build concept context for AI chat
  const conceptContext = useMemo<ConceptContext>(() => {
    const topics = questions
      .filter(q => q?.stem)
      .map(q => (q.stem.split(/[.!?]/)[0] || '').substring(0, 100))
      .filter(Boolean);
    const vocabulary: Record<string, string> = {};

    return {
      keyQuestion: `Learn about ${setMeta.title}`,
      conceptOverview: setMeta.subtitle,
      coreExplanation: questions.length > 0
        ? `This set covers ${setMeta.title} including topics like ${setMeta.topics.slice(0, 3).join(', ')}...`
        : `Explore ${setMeta.title} concepts.`,
      vocabulary,
      misconceptions: setMeta.misconceptions || [],
      subject: 'science',
      competencyLevel: 'developing',
      cognitiveLevel: 'understand',
      learningObjectives: [
        `Understand key concepts in ${setMeta.title}`,
        'Apply scientific knowledge to answer questions',
        'Connect concepts to real-world examples',
      ],
      keyConcepts: setMeta.topics,
    };
  }, [questions, setMeta]);

  const topicKey = 'default';

  if (isLoading) {
    return (
      <div className={`min-h-screen bg-gradient-to-br ${colorClasses.gradient} flex items-center justify-center`}>
        <div className="text-center">
          <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${colorClasses.spinnerBorder} mx-auto mb-4`}></div>
          <p className="text-gray-600">Loading questions...</p>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className={`min-h-screen bg-gradient-to-br ${colorClasses.gradient} flex items-center justify-center`}>
        <div className="text-center">
          <p className="text-gray-600 mb-4">No questions found for this set.</p>
          <Link
            href={setMeta.backLink}
            className={`${colorClasses.text} ${colorClasses.textHover} font-medium`}
          >
            ← {setMeta.backText}
          </Link>
        </div>
      </div>
    );
  }

  // Show completion report if set is complete and report is ready
  if (showCompletionReport && completedAttempt) {
    return (
      <div className={`min-h-screen bg-gradient-to-br ${colorClasses.gradient}`}>
        {/* Confetti for celebration */}
        <Confetti show={showConfetti} />

        {/* Header */}
        <header className="bg-white/90 backdrop-blur-sm shadow-sm sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Link
                href={setMeta.backLink}
                className={`${colorClasses.text} ${colorClasses.textHover}`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 ${colorClasses.bgLight} rounded-lg flex items-center justify-center text-xl`}>
                    {setMeta.icon}
                  </div>
                  <div>
                    <h1 className="text-lg font-bold text-gray-900">{setMeta.title}</h1>
                    <p className="text-sm text-gray-600">Set Complete!</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-4 py-8">
          <SetCompletionReport
            attempt={completedAttempt}
            setTitle={setMeta.title}
            setSubtitle={setMeta.subtitle}
            backLink={setMeta.backLink}
            onTryAgain={handleTryAgain}
            attemptHistory={attemptHistory}
            bestPercentage={bestPercentage}
            colorTheme={setMeta.color}
          />
        </main>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${colorClasses.gradient}`}>
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-sm shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link
              href={setMeta.backLink}
              className={`${colorClasses.text} ${colorClasses.textHover}`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 ${colorClasses.bgLight} rounded-lg flex items-center justify-center text-xl`}>
                  {setMeta.icon}
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900">{setMeta.title}</h1>
                  <p className="text-sm text-gray-600">{setMeta.subtitle}</p>
                </div>
              </div>
            </div>
            <ProgressRing progress={progressPercent} color={setMeta.color} />
          </div>
        </div>
      </header>

      {/* Confetti celebration */}
      <Confetti show={showConfetti} />

      <main className="max-w-3xl mx-auto px-4 py-6">
        {/* Compact Question Navigator with Grading Status */}
        <div className="flex items-center justify-center gap-1.5 mb-6">
          {questions.map((_, idx) => {
            const result = getResult(idx);
            const isCurrent = idx === currentQuestionIndex;

            // Determine button style based on grading result
            let buttonStyle = 'bg-white text-gray-500 hover:bg-gray-100 shadow-sm border border-gray-200';
            let iconOrNumber: React.ReactNode = idx + 1;

            if (isCurrent) {
              buttonStyle = `${colorClasses.progressBg} text-white shadow-lg scale-110`;
            } else if (result) {
              if (result.correctness === 'correct') {
                buttonStyle = 'bg-green-500 text-white';
                iconOrNumber = (
                  <svg className="w-4 h-4 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                );
              } else if (result.correctness === 'partial') {
                buttonStyle = 'bg-orange-500 text-white';
                iconOrNumber = <span className="text-sm">~</span>;
              } else {
                buttonStyle = 'bg-red-400 text-white';
                iconOrNumber = (
                  <svg className="w-4 h-4 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                );
              }
            } else if (isQuestionCompleted(idx)) {
              // Completed but no grading result (legacy)
              buttonStyle = 'bg-gray-400 text-white';
            }

            return (
              <button
                key={idx}
                onClick={() => navigateToQuestion(idx)}
                title={result ? `${result.score}/${result.maxScore} points` : undefined}
                className={`w-9 h-9 rounded-full font-semibold text-sm transition-all duration-200 ${buttonStyle}`}
              >
                {iconOrNumber}
              </button>
            );
          })}
        </div>

        {/* Question Card - Main Focus */}
        <div
          key={currentQuestionIndex}
          className={`bg-white rounded-2xl shadow-xl overflow-hidden transition-all duration-200 ${
            isTransitioning ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0 animate-fade-in-up'
          }`}
        >
          {/* Card accent bar */}
          <div className={`h-1.5 ${colorClasses.progressBg}`} />

          <div className="p-8">
            {/* Question Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 ${colorClasses.bgLight} rounded-xl flex items-center justify-center`}>
                  <span className={`text-lg font-bold ${colorClasses.text}`}>{currentQuestionIndex + 1}</span>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Question {currentQuestionIndex + 1} of {questions.length}</div>
                  {isComplete && (
                    <div className="flex items-center gap-1 text-green-600 text-sm font-medium">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Completed
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-medium text-gray-600">
                  ~{currentQuestion.estimatedTime ? Math.ceil(currentQuestion.estimatedTime / 60) : 2} min
                </span>
              </div>
            </div>

              <QuestionRenderer
                content={currentQuestion.stem}
                className="prose-lg mb-6"
              />

              {/* Answer Input - Different UI for MCQ vs Text */}
              {currentQuestion.questionType === 'MCQ' && currentQuestion.mcqOptions ? (
                // MCQ Options
                <div className="mb-5 space-y-3">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Select your answer
                  </label>
                  {currentQuestion.mcqOptions.map((option) => {
                    const isSelected = selectedOptionId === option.id;
                    const showResult = hasSubmitted && gradingResult;
                    const isCorrect = option.isCorrect;

                    let optionStyle = 'border-gray-200 bg-gray-50 hover:bg-gray-100 hover:border-gray-300';
                    if (isSelected && !showResult) {
                      optionStyle = `border-${setMeta.color}-500 bg-${setMeta.color}-50 ring-2 ring-${setMeta.color}-200`;
                    } else if (showResult) {
                      if (isCorrect) {
                        optionStyle = 'border-green-500 bg-green-50';
                      } else if (isSelected && !isCorrect) {
                        optionStyle = 'border-red-500 bg-red-50';
                      }
                    }

                    return (
                      <button
                        key={option.id}
                        onClick={() => !hasSubmitted && setSelectedOptionId(option.id)}
                        disabled={hasSubmitted}
                        className={`w-full p-4 text-left border-2 rounded-xl transition-all ${optionStyle} ${hasSubmitted ? 'cursor-default' : 'cursor-pointer'}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold ${
                            showResult && isCorrect
                              ? 'bg-green-500 text-white'
                              : showResult && isSelected && !isCorrect
                                ? 'bg-red-500 text-white'
                                : isSelected
                                  ? `bg-${setMeta.color}-500 text-white`
                                  : 'bg-gray-200 text-gray-600'
                          }`}>
                            {showResult && isCorrect ? (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            ) : showResult && isSelected && !isCorrect ? (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            ) : (
                              option.id
                            )}
                          </div>
                          <span className={`text-gray-800 ${showResult && isCorrect ? 'font-semibold' : ''}`}>
                            {option.text}
                          </span>
                        </div>
                        {showResult && isSelected && option.feedback && (
                          <p className={`mt-2 ml-11 text-sm ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                            {option.feedback}
                          </p>
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : isWorkedSolutionQuestion(currentQuestion) ? (
                // WORKED_SOLUTION - Student-centered "Show Your Work" input
                <div className="mb-5">
                  <WorkedSolutionInput
                    stem={currentQuestion.stem}
                    config={currentQuestion.workedSolutionConfig || {
                      startingExpression: '',
                      expectedAnswers: [],
                      gradingGuidance: '',
                    }}
                    hints={currentQuestion.encouragingHints as EncouragingHint[] || []}
                    isSubmitted={hasSubmitted}
                    onAnswerChange={(answer) => setWorkedSolutionAnswer(answer)}
                    colorTheme={setMeta.color}
                  />
                </div>
              ) : isMathQuestion(currentQuestion) ? (
                // Math Input (EQUATION_ENTRY or MULTI_STEP_MATH)
                <div className="mb-5">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    Your Answer (use the keyboard or keypad below)
                  </label>
                  <MathInputField
                    value={mathAnswerLatex}
                    onChange={(latex, plainText) => {
                      setMathAnswerLatex(latex);
                      setMathAnswerPlainText(plainText);
                    }}
                    placeholder="Enter your equation or expression..."
                    disabled={hasSubmitted}
                    hasError={false}
                    inputType={currentQuestion.questionType === 'EQUATION_ENTRY' ? 'equation' : 'expression'}
                    ariaLabel="Math answer input"
                    className={hasSubmitted ? 'opacity-75' : ''}
                  />
                  {/* Math Keypad for quick symbol access */}
                  {!hasSubmitted && (
                    <div className="mt-3">
                      <MathKeypad
                        mathFieldRef={mathFieldRef}
                        isVisible={showMathKeypad}
                        onVisibilityChange={setShowMathKeypad}
                        groups={['numbers', 'operators', 'variables', 'fractions', 'powers', 'brackets']}
                      />
                    </div>
                  )}
                </div>
              ) : (
                // Text Answer (SHORT_ANSWER or EXTENDED_RESPONSE)
                <div className="mb-5">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    Your Answer
                  </label>
                  <textarea
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    disabled={hasSubmitted}
                    className={`w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 ${colorClasses.focusRing} focus:border-transparent bg-gray-50 focus:bg-white transition-colors resize-none ${hasSubmitted ? 'opacity-75 cursor-not-allowed' : ''}`}
                    rows={currentQuestion.questionType === 'EXTENDED_RESPONSE' ? 8 : 4}
                    placeholder="Type your answer here..."
                  />
                </div>
              )}

              {/* Hint */}
              {currentQuestion.hints && currentQuestion.hints.length > 0 && (
                <div className="mb-4">
                  <button
                    onClick={() => setShowHint(!showHint)}
                    className="flex items-center gap-2 text-amber-600 hover:text-amber-700 font-medium"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {showHint ? 'Hide Hint' : 'Show Hint'}
                  </button>
                  {showHint && (
                    <div className="mt-2 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-amber-900">{currentQuestion.hints[0].content}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Solution */}
              <div className="mb-4">
                <button
                  onClick={() => setShowSolution(!showSolution)}
                  className={`flex items-center gap-2 ${colorClasses.text} ${colorClasses.textHover} font-medium`}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                    <path
                      fillRule="evenodd"
                      d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {showSolution ? 'Hide Solution' : 'Show Solution'}
                </button>
                {showSolution && currentQuestion.solution && (
                  <div className={`mt-3 p-5 ${colorClasses.bgLight} border ${colorClasses.border} rounded-xl`}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className={`w-8 h-8 ${colorClasses.bg} rounded-lg flex items-center justify-center`}>
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <h3 className={`font-semibold ${colorClasses.text}`}>Model Answer</h3>
                    </div>
                    <div
                      className="prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{
                        __html: formatSolution(currentQuestion.solution)
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Grading Result */}
              {hasSubmitted && gradingResult && (
                <div className="mb-5">
                  <GradingResultCard
                    result={gradingResult}
                    showDetails={true}
                    onRetry={gradingResult.correctness !== 'correct' ? handleRetry : undefined}
                    colorTheme={setMeta.color}
                  />
                </div>
              )}

              {/* Submit Button or Already Completed */}
              {!hasSubmitted ? (
                <button
                  onClick={handleSubmitAnswer}
                  disabled={
                    isGrading ||
                    (currentQuestion.questionType === 'MCQ'
                      ? !selectedOptionId
                      : isWorkedSolutionQuestion(currentQuestion)
                        ? !workedSolutionAnswer?.finalAnswer.trim()
                        : isMathQuestion(currentQuestion)
                          ? !mathAnswerLatex.trim()
                          : !userAnswer.trim())
                  }
                  className={`w-full py-3.5 px-4 ${colorClasses.progressBg} text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isGrading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Grading...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Submit Answer
                    </>
                  )}
                </button>
              ) : (
                <div className="text-center text-sm text-gray-500">
                  Answer submitted • {gradingResult ? `${gradingResult.score}/${gradingResult.maxScore} points` : 'Completed'}
                </div>
              )}
              </div>
            </div>

        {/* Navigation */}
        <div className="flex gap-4 mt-6">
          <button
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            className="flex-1 py-3.5 px-4 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Previous
          </button>
          <button
            onClick={handleNext}
            disabled={currentQuestionIndex === questions.length - 1}
            className={`flex-1 py-3.5 px-4 ${colorClasses.progressBg} text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
          >
            Next
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* AI Chat Widget */}
        <div className="fixed bottom-6 right-6 z-50">
          <ConceptChatWidget
            conceptCardId={setMeta.id}
            conceptContext={conceptContext}
            topicTitle={setMeta.title}
            topicKey={topicKey}
            initialSocraticMode={false}
          />
        </div>
      </main>
    </div>
  );
}

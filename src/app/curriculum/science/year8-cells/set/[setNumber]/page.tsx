'use client';

import { useState, useEffect, use, useMemo } from 'react';
import Link from 'next/link';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useSetProgress } from '@/hooks/useSetProgress';
import { ConceptChatWidget } from '@/components/chat';
import { ConceptContext } from '@/lib/chatTypes';

// Set metadata for medium questions
const mediumSetMetadata: Record<number, {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  firestoreSetId: string;
}> = {
  1: {
    id: 'year8-science-cells-set1',
    title: 'Cell Foundations',
    subtitle: 'Cell structure, organelles & energy',
    icon: '🔬',
    color: 'emerald',
    firestoreSetId: 'year8-science-cells-medium',
  },
  2: {
    id: 'year8-science-cells-set2',
    title: 'Fuel Systems',
    subtitle: 'Digestive system & nutrients',
    icon: '🍎',
    color: 'amber',
    firestoreSetId: 'year8-science-cells-medium',
  },
  3: {
    id: 'year8-science-cells-set3',
    title: 'Transport Networks',
    subtitle: 'Circulatory & respiratory systems',
    icon: '❤️',
    color: 'red',
    firestoreSetId: 'year8-science-cells-medium',
  },
  4: {
    id: 'year8-science-cells-set4',
    title: 'Control & Movement',
    subtitle: 'Nervous, skeletal & muscular',
    icon: '🧠',
    color: 'purple',
    firestoreSetId: 'year8-science-cells-medium',
  },
  5: {
    id: 'year8-science-cells-set5',
    title: 'Body Integration',
    subtitle: 'Excretion, homeostasis & connections',
    icon: '⚖️',
    color: 'blue',
    firestoreSetId: 'year8-science-cells-medium',
  },
};

// Set metadata for hard questions
const hardSetMetadata: Record<number, {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  firestoreSetId: string;
}> = {
  1: {
    id: 'year8-science-cells-hard-set1',
    title: 'Cell Deep Dive',
    subtitle: 'Advanced cell biology concepts',
    icon: '🧬',
    color: 'rose',
    firestoreSetId: 'year8-science-cells-body-systems',
  },
  2: {
    id: 'year8-science-cells-hard-set2',
    title: 'Systems Mastery',
    subtitle: 'Complex body system interactions',
    icon: '🫀',
    color: 'rose',
    firestoreSetId: 'year8-science-cells-body-systems',
  },
};

interface FirestoreQuestion {
  questionId: string;
  questionType: string;
  stem: string;
  solution: string;
  difficulty: number;
  estimatedTime: number;
  curriculum: {
    system: string;
    codes: string[];
    year: number;
    subject: string;
    strand: string;
  };
  hints: {
    level: number;
    content: string;
    revealsCriticalInfo: boolean;
  }[];
  status: string;
}

// Color utility
function getColorClasses(color: string) {
  const colors: Record<string, {
    bg: string;
    bgLight: string;
    text: string;
    border: string;
    gradient: string;
    buttonBg: string;
    buttonHover: string;
  }> = {
    emerald: {
      bg: 'bg-emerald-500',
      bgLight: 'bg-emerald-50',
      text: 'text-emerald-600',
      border: 'border-emerald-200',
      gradient: 'from-emerald-50 to-teal-50',
      buttonBg: 'bg-emerald-600',
      buttonHover: 'hover:bg-emerald-700',
    },
    amber: {
      bg: 'bg-amber-500',
      bgLight: 'bg-amber-50',
      text: 'text-amber-600',
      border: 'border-amber-200',
      gradient: 'from-amber-50 to-orange-50',
      buttonBg: 'bg-amber-600',
      buttonHover: 'hover:bg-amber-700',
    },
    red: {
      bg: 'bg-red-500',
      bgLight: 'bg-red-50',
      text: 'text-red-600',
      border: 'border-red-200',
      gradient: 'from-red-50 to-pink-50',
      buttonBg: 'bg-red-600',
      buttonHover: 'hover:bg-red-700',
    },
    purple: {
      bg: 'bg-purple-500',
      bgLight: 'bg-purple-50',
      text: 'text-purple-600',
      border: 'border-purple-200',
      gradient: 'from-purple-50 to-indigo-50',
      buttonBg: 'bg-purple-600',
      buttonHover: 'hover:bg-purple-700',
    },
    blue: {
      bg: 'bg-blue-500',
      bgLight: 'bg-blue-50',
      text: 'text-blue-600',
      border: 'border-blue-200',
      gradient: 'from-blue-50 to-cyan-50',
      buttonBg: 'bg-blue-600',
      buttonHover: 'hover:bg-blue-700',
    },
    rose: {
      bg: 'bg-rose-500',
      bgLight: 'bg-rose-50',
      text: 'text-rose-600',
      border: 'border-rose-200',
      gradient: 'from-rose-50 to-pink-50',
      buttonBg: 'bg-rose-600',
      buttonHover: 'hover:bg-rose-700',
    },
  };
  return colors[color] || colors.emerald;
}

export default function SetPlayerPage({ params }: { params: Promise<{ setNumber: string }> }) {
  const resolvedParams = use(params);

  // Parse setNumber - could be "1", "2", etc. or "hard-1", "hard-2"
  const isHard = resolvedParams.setNumber.startsWith('hard-');
  const setNumber = isHard
    ? parseInt(resolvedParams.setNumber.replace('hard-', ''), 10)
    : parseInt(resolvedParams.setNumber, 10);
  const setInfo = isHard ? hardSetMetadata[setNumber] : mediumSetMetadata[setNumber];

  const [questions, setQuestions] = useState<FirestoreQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showSolution, setShowSolution] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);

  const {
    progress,
    isLoaded: progressLoaded,
    completedCount,
    isSetComplete,
    progressPercent,
    markCompleted,
    saveAnswer,
    isQuestionCompleted,
    getAnswer,
  } = useSetProgress(setInfo?.id || '', 10);

  // Local answer state (synced with progress)
  const [userAnswer, setUserAnswer] = useState('');

  // Sync user answer when question changes
  useEffect(() => {
    if (progressLoaded) {
      setUserAnswer(getAnswer(currentIndex));
    }
  }, [currentIndex, progressLoaded, getAnswer]);

  // Auto-save answer on change
  useEffect(() => {
    if (progressLoaded && userAnswer) {
      saveAnswer(currentIndex, userAnswer);
    }
  }, [userAnswer, currentIndex, progressLoaded, saveAnswer]);

  useEffect(() => {
    async function fetchQuestions() {
      if (!setInfo) return;

      try {
        setIsLoading(true);
        const q = query(
          collection(db, 'questions'),
          where('paperMetadata.setId', '==', setInfo.firestoreSetId)
        );

        const snapshot = await getDocs(q);
        const allQuestions = snapshot.docs.map(doc => ({
          ...doc.data(),
          questionId: doc.id,
        })) as FirestoreQuestion[];

        // Sort by questionId
        allQuestions.sort((a, b) => a.questionId.localeCompare(b.questionId));

        // Filter to this set's questions (0-indexed: set 1 = index 0-9, set 2 = 10-19, etc.)
        const startIdx = (setNumber - 1) * 10;
        const endIdx = startIdx + 10;
        const questionsForSet = allQuestions.slice(startIdx, endIdx);

        setQuestions(questionsForSet);
        setError(null);
      } catch (err) {
        console.error('Error fetching questions:', err);
        setError('Failed to load questions. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchQuestions();
  }, [setNumber, setInfo]);

  // Invalid set number
  if (!setInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl p-8 shadow-lg max-w-md text-center">
          <div className="text-red-500 text-5xl mb-4">🚫</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Invalid Set</h2>
          <p className="text-gray-600">Set {setNumber} does not exist.</p>
          <Link href="/curriculum/science/year8-cells" className="mt-4 inline-block px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
            Back to Sets
          </Link>
        </div>
      </div>
    );
  }

  const colorClasses = getColorClasses(setInfo.color);
  const currentQuestion = questions[currentIndex];

  const handleMarkComplete = () => {
    if (userAnswer.trim()) {
      markCompleted(currentIndex, userAnswer);
      // Check if this was the last question
      if (completedCount === 9 && !isQuestionCompleted(currentIndex)) {
        setShowCelebration(true);
      }
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setShowSolution(false);
      setShowHints(false);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setShowSolution(false);
      setShowHints(false);
    }
  };

  const getDifficultyLabel = (level: number) => {
    const labels = ['', 'Easy', 'Easy-Medium', 'Medium', 'Medium-Hard', 'Hard'];
    return labels[level] || 'Unknown';
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={`min-h-screen bg-gradient-to-br ${colorClasses.gradient} flex items-center justify-center`}>
        <div className="text-center">
          <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${colorClasses.border} mx-auto`}></div>
          <p className="mt-4 text-gray-600">Loading {setInfo.title}...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`min-h-screen bg-gradient-to-br ${colorClasses.gradient} flex items-center justify-center`}>
        <div className="bg-white rounded-xl p-8 shadow-lg max-w-md text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Error</h2>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className={`mt-4 px-6 py-2 ${colorClasses.buttonBg} text-white rounded-lg ${colorClasses.buttonHover}`}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // No questions
  if (questions.length === 0) {
    return (
      <div className={`min-h-screen bg-gradient-to-br ${colorClasses.gradient} flex items-center justify-center`}>
        <div className="bg-white rounded-xl p-8 shadow-lg max-w-md text-center">
          <div className="text-5xl mb-4">{setInfo.icon}</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">No Questions Yet</h2>
          <p className="text-gray-600">Questions for this set are being prepared.</p>
          <Link href="/curriculum/science/year8-cells" className={`mt-4 inline-block px-6 py-2 ${colorClasses.buttonBg} text-white rounded-lg ${colorClasses.buttonHover}`}>
            Back to Sets
          </Link>
        </div>
      </div>
    );
  }

  // Celebration modal
  if (showCelebration) {
    return (
      <div className={`min-h-screen bg-gradient-to-br ${colorClasses.gradient} flex items-center justify-center`}>
        <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-md text-center transform animate-bounce-slow">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Set Complete!</h2>
          <p className="text-gray-600 mb-4">
            You've completed all 10 questions in <strong>{setInfo.title}</strong>!
          </p>
          <div className={`inline-block px-4 py-2 ${colorClasses.bgLight} ${colorClasses.text} rounded-full font-medium mb-6`}>
            {setInfo.icon} {setInfo.title}
          </div>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => setShowCelebration(false)}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Review Answers
            </button>
            <Link
              href="/curriculum/science/year8-cells"
              className={`px-6 py-2 ${colorClasses.buttonBg} text-white rounded-lg ${colorClasses.buttonHover}`}
            >
              Back to Sets
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${colorClasses.gradient}`}>
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-sm shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/curriculum/science/year8-cells" className={`${colorClasses.text} hover:opacity-80`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div className={`w-10 h-10 ${colorClasses.bgLight} rounded-lg flex items-center justify-center text-xl`}>
                {setInfo.icon}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-400 uppercase">Set {setNumber}</span>
                  {isSetComplete && (
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                      Complete
                    </span>
                  )}
                </div>
                <h1 className="text-lg font-bold text-gray-800">{setInfo.title}</h1>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-xl font-bold ${colorClasses.text}`}>
                {currentIndex + 1} / 10
              </div>
              <div className="text-xs text-gray-500">{completedCount} done</div>
            </div>
          </div>
        </div>

        {/* Progress indicator - dots */}
        <div className="px-4 pb-3">
          <div className="max-w-4xl mx-auto flex gap-1">
            {Array.from({ length: 10 }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setCurrentIndex(idx);
                  setShowSolution(false);
                  setShowHints(false);
                }}
                className={`flex-1 h-2 rounded-full transition-all ${
                  idx === currentIndex
                    ? colorClasses.bg
                    : isQuestionCompleted(idx)
                    ? 'bg-green-400'
                    : 'bg-gray-200'
                }`}
                title={`Question ${idx + 1}${isQuestionCompleted(idx) ? ' (completed)' : ''}`}
              />
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Question Header */}
          <div className={`${colorClasses.bg} text-white px-6 py-4`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="font-medium">Question {currentIndex + 1}</span>
                {isQuestionCompleted(currentIndex) && (
                  <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs">
                    ✓ Completed
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className={`px-3 py-1 rounded-full bg-white/20`}>
                  {getDifficultyLabel(currentQuestion.difficulty)}
                </span>
                <span className="opacity-75">
                  ⏱️ {Math.ceil(currentQuestion.estimatedTime / 60)} min
                </span>
              </div>
            </div>
          </div>

          {/* Question Content */}
          <div className="p-6">
            {/* Question Stem */}
            <div className="prose prose-emerald max-w-none mb-6">
              <div
                dangerouslySetInnerHTML={{
                  __html: currentQuestion.stem
                    .replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold text-gray-800 mb-3">$1</h2>')
                    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\n\n/g, '</p><p class="mb-3">')
                    .replace(/\n/g, '<br/>')
                }}
              />
            </div>

            {/* Answer Area */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Answer
                {isQuestionCompleted(currentIndex) && (
                  <span className="ml-2 text-green-600 text-xs font-normal">(Saved)</span>
                )}
              </label>
              <textarea
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder="Type your response here..."
                className={`w-full p-4 border rounded-xl focus:ring-2 min-h-[150px] resize-y ${
                  isQuestionCompleted(currentIndex)
                    ? 'border-green-300 bg-green-50 focus:ring-green-500 focus:border-green-500'
                    : 'border-gray-300 focus:ring-emerald-500 focus:border-emerald-500'
                }`}
              />
            </div>

            {/* Mark Complete Button */}
            {!isQuestionCompleted(currentIndex) && userAnswer.trim() && (
              <button
                onClick={handleMarkComplete}
                className={`mt-4 w-full py-3 ${colorClasses.buttonBg} text-white rounded-xl ${colorClasses.buttonHover} font-medium flex items-center justify-center gap-2`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Mark as Complete
              </button>
            )}

            {/* Hints Section */}
            {currentQuestion.hints && currentQuestion.hints.length > 0 && (
              <div className="mt-6">
                <button
                  onClick={() => setShowHints(!showHints)}
                  className="flex items-center gap-2 text-amber-600 hover:text-amber-700 font-medium"
                >
                  <span>{showHints ? '🙈' : '💡'}</span>
                  {showHints ? 'Hide Hints' : 'Need a Hint?'}
                </button>

                {showHints && (
                  <div className="mt-3 space-y-2">
                    {currentQuestion.hints.map((hint, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-lg ${
                          hint.revealsCriticalInfo
                            ? 'bg-amber-50 border border-amber-200'
                            : 'bg-blue-50 border border-blue-200'
                        }`}
                      >
                        <span className="text-sm font-medium text-gray-600">
                          Hint {hint.level}:
                        </span>
                        <p className="text-gray-700">{hint.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Solution Section */}
            <div className="mt-6">
              <button
                onClick={() => setShowSolution(!showSolution)}
                className={`flex items-center gap-2 ${colorClasses.text} hover:opacity-80 font-medium`}
              >
                <span>{showSolution ? '🙈' : '📖'}</span>
                {showSolution ? 'Hide Model Answer' : 'Show Model Answer'}
              </button>

              {showSolution && (
                <div className={`mt-3 p-4 ${colorClasses.bgLight} border ${colorClasses.border} rounded-xl`}>
                  <h3 className={`font-semibold ${colorClasses.text} mb-2`}>Model Answer</h3>
                  <div
                    className="text-gray-700 prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{
                      __html: currentQuestion.solution
                        .replace(/^## (.+)$/gm, '<h3 class="font-semibold text-gray-800 mt-3">$1</h3>')
                        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                        .replace(/^- (.+)$/gm, '<li>$1</li>')
                        .replace(/\n\n/g, '</p><p class="mb-2">')
                        .replace(/\n/g, '<br/>')
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <div className="bg-gray-50 px-6 py-4 flex items-center justify-between">
            <button
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className={`px-4 py-2 rounded-lg font-medium ${
                currentIndex === 0
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              ← Previous
            </button>

            <div className="flex items-center gap-2">
              {Array.from({ length: 10 }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setCurrentIndex(idx);
                    setShowSolution(false);
                    setShowHints(false);
                  }}
                  className={`w-8 h-8 rounded-full text-sm font-medium transition-all ${
                    idx === currentIndex
                      ? `${colorClasses.bg} text-white`
                      : isQuestionCompleted(idx)
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {isQuestionCompleted(idx) && idx !== currentIndex ? '✓' : idx + 1}
                </button>
              ))}
            </div>

            <button
              onClick={handleNext}
              disabled={currentIndex === questions.length - 1}
              className={`px-4 py-2 rounded-lg font-medium ${
                currentIndex === questions.length - 1
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : `${colorClasses.buttonBg} text-white ${colorClasses.buttonHover}`
              }`}
            >
              Next →
            </button>
          </div>
        </div>

        {/* Set Progress Summary */}
        <div className="mt-6 bg-white rounded-xl p-4 shadow flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-500">Set Progress</div>
            <div className="text-lg font-semibold text-gray-800">
              {completedCount}/10 questions completed
            </div>
          </div>
          <div className={`text-3xl font-bold ${colorClasses.text}`}>
            {progressPercent}%
          </div>
        </div>
      </main>
    </div>
  );
}

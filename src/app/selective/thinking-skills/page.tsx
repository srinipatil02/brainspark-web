'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Question } from '@/types';
import { getNSWSelectiveQuestions } from '@/services/questionService';
import { getOptionIdFromAnswer, getFeedbackForOption, isAnswerCorrect } from '@/services/questionTransformer';

// Fallback sample questions (used when Firestore is empty)
const SAMPLE_QUESTIONS: Question[] = [
  {
    id: 'sample-ts-1',
    text: 'If all Bloops are Razzles and all Razzles are Lazzles, which statement must be true?',
    type: 'multiple_choice',
    options: ['All Lazzles are Bloops', 'All Bloops are Lazzles', 'Some Lazzles are not Bloops', 'No Bloops are Lazzles'],
    optionIds: ['A', 'B', 'C', 'D'],
    correctAnswer: 'All Bloops are Lazzles',
    correctOptionId: 'B',
    explanation: 'Since all Bloops are Razzles, and all Razzles are Lazzles, then by the transitive property, all Bloops must also be Lazzles.',
    optionFeedback: {
      'A': 'We know Bloops are Lazzles, but not all Lazzles need to be Bloops.',
      'B': 'Correct! Bloops → Razzles → Lazzles, so all Bloops are Lazzles.',
      'C': 'This could be true but isn\'t necessarily true from the given information.',
      'D': 'This contradicts the given statements - Bloops ARE Lazzles (through Razzles).',
    },
    subject: 'reasoning',
    topic: 'Logical Reasoning',
    difficulty: 'medium',
    section: 'thinkingSkills',
  },
  {
    id: 'sample-ts-2',
    text: 'What number comes next in the sequence: 2, 6, 12, 20, 30, ?',
    type: 'multiple_choice',
    options: ['40', '42', '44', '46'],
    optionIds: ['A', 'B', 'C', 'D'],
    correctAnswer: '42',
    correctOptionId: 'B',
    explanation: 'The pattern shows differences increasing by 2 each time: +4, +6, +8, +10, +12. So 30 + 12 = 42.',
    optionFeedback: {
      'A': 'Check the pattern of differences between numbers.',
      'B': 'Correct! The differences are 4, 6, 8, 10, 12... so 30 + 12 = 42.',
      'C': 'The sequence has a specific pattern - look at the differences.',
      'D': 'This would require a different pattern than what\'s shown.',
    },
    subject: 'reasoning',
    topic: 'Pattern Recognition',
    difficulty: 'easy',
    section: 'thinkingSkills',
  },
  {
    id: 'sample-ts-3',
    text: 'A cube is painted red on all sides, then cut into 27 smaller equal cubes. How many small cubes have exactly 2 red faces?',
    type: 'multiple_choice',
    options: ['6', '8', '12', '16'],
    optionIds: ['A', 'B', 'C', 'D'],
    correctAnswer: '12',
    correctOptionId: 'C',
    explanation: 'Edge cubes (not corners) have exactly 2 red faces. A cube has 12 edges, and when cut into 3×3×3, each edge has 1 middle cube. So 12 edge cubes have 2 red faces.',
    optionFeedback: {
      'A': 'These are the face centers (1 red face each). Count the edge pieces.',
      'B': 'These are the corner cubes (3 red faces each).',
      'C': 'Correct! 12 edge-middle cubes, each with 2 painted faces.',
      'D': 'Too many - remember corners have 3 faces, edges have 2.',
    },
    subject: 'reasoning',
    topic: 'Spatial Reasoning',
    difficulty: 'hard',
    section: 'thinkingSkills',
  },
  {
    id: 'sample-ts-4',
    text: 'If APPLE is coded as DSSOH, how is MANGO coded?',
    type: 'multiple_choice',
    options: ['PDQJR', 'PDQIR', 'OCPHN', 'PDQJM'],
    optionIds: ['A', 'B', 'C', 'D'],
    correctAnswer: 'PDQJR',
    correctOptionId: 'A',
    explanation: 'Each letter is shifted forward by 3 positions. M→P, A→D, N→Q, G→J, O→R.',
    optionFeedback: {
      'A': 'Correct! Each letter shifts forward 3 places in the alphabet.',
      'B': 'Check the fourth letter - G+3 should be J, not I.',
      'C': 'This would be shifting forward by 2, not 3.',
      'D': 'Check the last letter - O+3 should be R, not M.',
    },
    subject: 'reasoning',
    topic: 'Code Breaking',
    difficulty: 'medium',
    section: 'thinkingSkills',
  },
];

export default function ThinkingSkillsPractice() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);

  useEffect(() => {
    const loadQuestions = async () => {
      try {
        // Try to load from Firestore
        const firestoreQuestions = await getNSWSelectiveQuestions('thinkingSkills', 10);

        if (firestoreQuestions.length > 0) {
          setQuestions(firestoreQuestions);
          setUsingFallback(false);
        } else {
          // Use sample questions as fallback
          console.log('Using sample questions (Firestore empty)');
          setQuestions(SAMPLE_QUESTIONS);
          setUsingFallback(true);
        }
      } catch (error) {
        console.error('Error loading questions:', error);
        setQuestions(SAMPLE_QUESTIONS);
        setUsingFallback(true);
      } finally {
        setIsLoading(false);
      }
    };

    loadQuestions();
  }, []);

  const currentQuestion = questions[currentIndex];

  const handleAnswerSelect = (answer: string, index: number) => {
    if (isAnswered) return;
    setSelectedAnswer(answer);
    // Get option ID (A, B, C, D) from the question
    const optionId = currentQuestion.optionIds?.[index] ||
      getOptionIdFromAnswer(currentQuestion, answer) ||
      String.fromCharCode(65 + index);
    setSelectedOptionId(optionId);
  };

  const handleSubmit = () => {
    if (!selectedAnswer || !selectedOptionId || isAnswered) return;

    const correct = isAnswerCorrect(currentQuestion, selectedOptionId);
    setIsAnswered(true);
    setScore(prev => ({
      correct: prev.correct + (correct ? 1 : 0),
      total: prev.total + 1,
    }));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setSelectedOptionId(null);
      setIsAnswered(false);
    }
  };

  const getAnswerStyle = (option: string, index: number): string => {
    const optionId = currentQuestion.optionIds?.[index] || String.fromCharCode(65 + index);

    if (!isAnswered) {
      return selectedAnswer === option
        ? 'border-teal-500 bg-teal-50'
        : 'border-gray-200 hover:border-teal-300';
    }

    if (optionId === currentQuestion.correctOptionId) {
      return 'border-green-500 bg-green-50';
    }
    if (optionId === selectedOptionId && optionId !== currentQuestion.correctOptionId) {
      return 'border-red-500 bg-red-50';
    }
    return 'border-gray-200 opacity-50';
  };

  // Get feedback for the selected wrong answer
  const wrongAnswerFeedback = isAnswered && selectedOptionId && selectedOptionId !== currentQuestion?.correctOptionId
    ? getFeedbackForOption(currentQuestion, selectedOptionId) || currentQuestion?.optionFeedback?.[selectedOptionId]
    : null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/selective" className="text-gray-500 hover:text-gray-700">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Thinking Skills</h1>
              <p className="text-sm text-gray-500">NSW Selective Practice</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Score</p>
            <p className="text-lg font-bold text-teal-600">{score.correct}/{score.total}</p>
          </div>
        </div>
      </header>

      {/* Fallback notice */}
      {usingFallback && (
        <div className="max-w-4xl mx-auto px-4 pt-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 text-sm text-amber-700">
            Using sample questions (Firestore data not loaded)
          </div>
        </div>
      )}

      {/* Progress Bar */}
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-sm text-gray-500">Question {currentIndex + 1} of {questions.length}</span>
          <span className="px-2 py-0.5 bg-teal-100 text-teal-700 text-xs rounded-full font-medium">
            {currentQuestion?.topic}
          </span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-teal-600 transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Question Card */}
      <main className="max-w-4xl mx-auto px-4 py-4">
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <p className="text-lg text-gray-900 leading-relaxed">{currentQuestion?.text}</p>
        </div>

        {/* Options */}
        <div className="space-y-3 mb-6">
          {currentQuestion?.options?.map((option, index) => {
            const optionId = currentQuestion.optionIds?.[index] || String.fromCharCode(65 + index);
            return (
              <button
                key={index}
                onClick={() => handleAnswerSelect(option, index)}
                disabled={isAnswered}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${getAnswerStyle(option, index)}`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium">
                    {optionId}
                  </span>
                  <span className="text-gray-900 flex-1">{option}</span>
                  {isAnswered && optionId === currentQuestion.correctOptionId && (
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {isAnswered && optionId === selectedOptionId && optionId !== currentQuestion.correctOptionId && (
                    <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Feedback */}
        {isAnswered && (
          <div className={`p-4 rounded-xl mb-6 ${
            selectedOptionId === currentQuestion.correctOptionId
              ? 'bg-green-50 border border-green-200'
              : 'bg-amber-50 border border-amber-200'
          }`}>
            {selectedOptionId === currentQuestion.correctOptionId ? (
              <p className="font-medium text-green-700">Correct! Well done!</p>
            ) : (
              <>
                <p className="font-medium text-amber-700">Not quite right</p>
                {wrongAnswerFeedback && (
                  <p className="text-gray-600 text-sm mt-1">{wrongAnswerFeedback}</p>
                )}
                <p className="text-gray-600 text-sm mt-2">
                  The correct answer is: <span className="font-medium">{currentQuestion.correctAnswer}</span>
                </p>
              </>
            )}
            {currentQuestion.explanation && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-sm text-gray-600">{currentQuestion.explanation}</p>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          {!isAnswered ? (
            <button
              onClick={handleSubmit}
              disabled={!selectedAnswer}
              className="flex-1 py-3 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Submit Answer
            </button>
          ) : currentIndex < questions.length - 1 ? (
            <button
              onClick={handleNext}
              className="flex-1 py-3 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-700 transition-colors"
            >
              Next Question
            </button>
          ) : (
            <Link href="/selective" className="flex-1">
              <button className="w-full py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors">
                Complete - View Results
              </button>
            </Link>
          )}
        </div>
      </main>
    </div>
  );
}

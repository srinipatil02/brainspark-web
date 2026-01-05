'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Question, Passage } from '@/types';
import { getNSWSelectiveQuestions } from '@/services/questionService';
import { getPassages } from '@/services/passageService';
import { getOptionIdFromAnswer, getFeedbackForOption, isAnswerCorrect } from '@/services/questionTransformer';

// Extended question with inline passage for rendering
interface QuestionWithPassage extends Question {
  passage?: Passage;
}

// Fallback sample questions (used when Firestore is empty)
const SAMPLE_QUESTIONS: QuestionWithPassage[] = [
  {
    id: 'sample-reading-1',
    text: 'What does the word "sentinel" most likely mean in this context?',
    type: 'multiple_choice',
    options: ['A soldier', 'A watchful guardian', 'A tall building', 'A warning sign'],
    optionIds: ['A', 'B', 'C', 'D'],
    correctAnswer: 'A watchful guardian',
    correctOptionId: 'B',
    explanation: 'The word "sentinel" is used to describe the lighthouse standing watch over the waters, which aligns with the meaning of a watchful guardian.',
    optionFeedback: {
      'A': 'While soldiers can be sentinels, the context describes a lighthouse, not a person.',
      'B': 'Correct! The lighthouse acts as a watchful guardian over the waters.',
      'C': 'The passage describes the lighthouse\'s function, not just its physical appearance.',
      'D': 'A sentinel is more than just a sign - it actively watches and guards.',
    },
    subject: 'english',
    topic: 'Vocabulary in Context',
    difficulty: 'medium',
    section: 'reading',
    passage: {
      id: 'sample-passage-1',
      title: 'The Lighthouse',
      content: 'The old lighthouse stood sentinel on the rocky promontory, its beam sweeping across the dark waters like a tireless guardian. For generations, it had warned sailors of the treacherous shoals that lay hidden beneath the waves. Now, with modern GPS navigation, some questioned its relevance, yet the lighthouse keeper, Martha, continued her nightly vigil.',
      genre: 'fiction',
      wordCount: 56,
      readingLevel: 'Year 6-7',
    },
  },
  {
    id: 'sample-reading-2',
    text: 'What is the main purpose of this passage?',
    type: 'multiple_choice',
    options: ['To argue for preserving lighthouses', 'To describe a lighthouse and its keeper', 'To explain GPS navigation', 'To warn about dangerous waters'],
    optionIds: ['A', 'B', 'C', 'D'],
    correctAnswer: 'To describe a lighthouse and its keeper',
    correctOptionId: 'B',
    explanation: 'The passage primarily describes the lighthouse and introduces its keeper Martha, rather than making an argument or explaining technology.',
    optionFeedback: {
      'A': 'The passage mentions questioning relevance but doesn\'t actively argue for preservation.',
      'B': 'Correct! The passage describes the lighthouse\'s role and introduces Martha.',
      'C': 'GPS is only briefly mentioned as context, not explained.',
      'D': 'Dangerous waters are mentioned but are not the main focus.',
    },
    subject: 'english',
    topic: 'Main Idea',
    difficulty: 'easy',
    section: 'reading',
    passage: {
      id: 'sample-passage-1',
      title: 'The Lighthouse',
      content: 'The old lighthouse stood sentinel on the rocky promontory, its beam sweeping across the dark waters like a tireless guardian. For generations, it had warned sailors of the treacherous shoals that lay hidden beneath the waves. Now, with modern GPS navigation, some questioned its relevance, yet the lighthouse keeper, Martha, continued her nightly vigil.',
      genre: 'fiction',
      wordCount: 56,
      readingLevel: 'Year 6-7',
    },
  },
  {
    id: 'sample-reading-3',
    text: 'What does Martha\'s "nightly vigil" suggest about her character?',
    type: 'multiple_choice',
    options: ['She is afraid of the dark', 'She is dedicated and responsible', 'She has trouble sleeping', 'She dislikes modern technology'],
    optionIds: ['A', 'B', 'C', 'D'],
    correctAnswer: 'She is dedicated and responsible',
    correctOptionId: 'B',
    explanation: 'A "vigil" implies watchfulness and dedication. Martha continues her duties despite questions about the lighthouse\'s relevance, showing commitment.',
    optionFeedback: {
      'A': 'There\'s no indication of fear in the passage.',
      'B': 'Correct! Her continued vigil despite questions shows dedication.',
      'C': 'A vigil is intentional watching, not sleeplessness.',
      'D': 'The passage doesn\'t suggest any hostility toward technology.',
    },
    subject: 'english',
    topic: 'Character Analysis',
    difficulty: 'medium',
    section: 'reading',
    passage: {
      id: 'sample-passage-1',
      title: 'The Lighthouse',
      content: 'The old lighthouse stood sentinel on the rocky promontory, its beam sweeping across the dark waters like a tireless guardian. For generations, it had warned sailors of the treacherous shoals that lay hidden beneath the waves. Now, with modern GPS navigation, some questioned its relevance, yet the lighthouse keeper, Martha, continued her nightly vigil.',
      genre: 'fiction',
      wordCount: 56,
      readingLevel: 'Year 6-7',
    },
  },
];

export default function ReadingPractice() {
  const [questions, setQuestions] = useState<QuestionWithPassage[]>([]);
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
        const firestoreQuestions = await getNSWSelectiveQuestions('reading', 10);

        if (firestoreQuestions.length > 0) {
          // Collect unique passage IDs
          const passageIds = [...new Set(
            firestoreQuestions
              .filter(q => q.passageId)
              .map(q => q.passageId!)
          )];

          // Fetch all passages in parallel
          const passageMap = passageIds.length > 0
            ? await getPassages(passageIds)
            : new Map();

          // Attach passages to questions
          const questionsWithPassages: QuestionWithPassage[] = firestoreQuestions.map(q => ({
            ...q,
            passage: q.passageId ? passageMap.get(q.passageId) : undefined,
          }));

          setQuestions(questionsWithPassages);
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
        ? 'border-blue-500 bg-blue-50'
        : 'border-gray-200 hover:border-blue-300';
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
              <h1 className="text-xl font-semibold text-gray-900">Reading</h1>
              <p className="text-sm text-gray-500">NSW Selective Practice</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Score</p>
            <p className="text-lg font-bold text-blue-600">{score.correct}/{score.total}</p>
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
          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
            {currentQuestion?.topic}
          </span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-4">
        {/* Passage Card */}
        {currentQuestion?.passage && (
          <div className="bg-white rounded-xl shadow-sm border p-6 mb-4">
            <div className="flex items-center gap-3 mb-3">
              <p className="text-sm font-medium text-gray-500">Reading Passage</p>
              {currentQuestion.passage.title && (
                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                  {currentQuestion.passage.title}
                </span>
              )}
              {currentQuestion.passage.wordCount && (
                <span className="text-xs text-gray-400">
                  {currentQuestion.passage.wordCount} words
                </span>
              )}
            </div>
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {currentQuestion.passage.content}
            </p>
          </div>
        )}

        {/* Question Card */}
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
              className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Submit Answer
            </button>
          ) : currentIndex < questions.length - 1 ? (
            <button
              onClick={handleNext}
              className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
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

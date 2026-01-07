'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
}

// Sample questions by topic
const questionsByTopic: Record<string, Question[]> = {
  algebra: [
    { id: '1', text: 'Solve for x: 2x + 5 = 15', options: ['3', '5', '7', '10'], correctAnswer: '5', explanation: '2x + 5 = 15 → 2x = 10 → x = 5' },
    { id: '2', text: 'Simplify: 3(x + 2) - 2x', options: ['x + 6', '5x + 6', 'x + 2', '5x + 2'], correctAnswer: 'x + 6', explanation: '3x + 6 - 2x = x + 6' },
    { id: '3', text: 'If y = 2x - 1, find y when x = 4', options: ['5', '6', '7', '8'], correctAnswer: '7', explanation: 'y = 2(4) - 1 = 8 - 1 = 7' },
  ],
  geometry: [
    { id: '1', text: 'What is the sum of angles in a triangle?', options: ['90°', '180°', '270°', '360°'], correctAnswer: '180°', explanation: 'The sum of interior angles in any triangle is always 180°' },
    { id: '2', text: 'A rectangle has length 8cm and width 5cm. What is its perimeter?', options: ['13cm', '26cm', '40cm', '80cm'], correctAnswer: '26cm', explanation: 'Perimeter = 2(l + w) = 2(8 + 5) = 26cm' },
    { id: '3', text: 'What is the area of a circle with radius 7cm? (Use π ≈ 22/7)', options: ['44 cm²', '154 cm²', '308 cm²', '22 cm²'], correctAnswer: '154 cm²', explanation: 'Area = πr² = (22/7) × 7² = 154 cm²' },
  ],
  physics: [
    { id: '1', text: 'What is the SI unit of force?', options: ['Joule', 'Watt', 'Newton', 'Pascal'], correctAnswer: 'Newton', explanation: 'Force is measured in Newtons (N), named after Isaac Newton' },
    { id: '2', text: 'If a car travels 100km in 2 hours, what is its average speed?', options: ['25 km/h', '50 km/h', '100 km/h', '200 km/h'], correctAnswer: '50 km/h', explanation: 'Speed = Distance/Time = 100/2 = 50 km/h' },
    { id: '3', text: 'What type of energy does a moving object have?', options: ['Potential', 'Kinetic', 'Thermal', 'Chemical'], correctAnswer: 'Kinetic', explanation: 'Moving objects have kinetic energy, which depends on mass and velocity' },
  ],
  chemistry: [
    { id: '1', text: 'What is the chemical symbol for water?', options: ['H₂O', 'CO₂', 'NaCl', 'O₂'], correctAnswer: 'H₂O', explanation: 'Water is made of 2 hydrogen atoms and 1 oxygen atom' },
    { id: '2', text: 'How many elements are in the periodic table?', options: ['92', '108', '118', '126'], correctAnswer: '118', explanation: 'As of now, 118 elements have been confirmed' },
    { id: '3', text: 'What is the pH of a neutral solution?', options: ['0', '7', '10', '14'], correctAnswer: '7', explanation: 'pH 7 is neutral; below 7 is acidic, above 7 is basic' },
  ],
};

interface TopicPracticeClientProps {
  subject: string;
  topic: string;
}

export function TopicPracticeClient({ subject, topic }: TopicPracticeClientProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load questions for this topic
    const topicQuestions = questionsByTopic[topic] || questionsByTopic.algebra;
    setQuestions(topicQuestions);
    setIsLoading(false);
  }, [topic]);

  const currentQuestion = questions[currentIndex];

  const handleAnswerSelect = (answer: string) => {
    if (isAnswered) return;
    setSelectedAnswer(answer);
  };

  const handleSubmit = () => {
    if (!selectedAnswer || isAnswered) return;
    setIsAnswered(true);
    setScore(prev => ({
      correct: prev.correct + (selectedAnswer === currentQuestion.correctAnswer ? 1 : 0),
      total: prev.total + 1,
    }));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
    }
  };

  const getAnswerStyle = (option: string): string => {
    if (!isAnswered) {
      return selectedAnswer === option ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300';
    }
    if (option === currentQuestion.correctAnswer) return 'border-green-500 bg-green-50';
    if (option === selectedAnswer) return 'border-red-500 bg-red-50';
    return 'border-gray-200 opacity-50';
  };

  const topicTitle = topic.charAt(0).toUpperCase() + topic.slice(1).replace(/-/g, ' ');
  const subjectTitle = subject.charAt(0).toUpperCase() + subject.slice(1);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/curriculum" className="text-gray-500 hover:text-gray-700">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">{topicTitle}</h1>
              <p className="text-sm text-gray-500">{subjectTitle} • Year 8</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Score</p>
            <p className="text-lg font-bold text-blue-600">{score.correct}/{score.total}</p>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-sm text-gray-500">Question {currentIndex + 1} of {questions.length}</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-blue-600 transition-all" style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }} />
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-4">
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <p className="text-lg text-gray-900 leading-relaxed">{currentQuestion?.text}</p>
        </div>

        <div className="space-y-3 mb-6">
          {currentQuestion?.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleAnswerSelect(option)}
              disabled={isAnswered}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all ${getAnswerStyle(option)}`}
            >
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium">
                  {String.fromCharCode(65 + index)}
                </span>
                <span className="text-gray-900">{option}</span>
              </div>
            </button>
          ))}
        </div>

        {isAnswered && currentQuestion?.explanation && (
          <div className={`p-4 rounded-xl mb-6 ${selectedAnswer === currentQuestion.correctAnswer ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}>
            <p className={`font-medium mb-1 ${selectedAnswer === currentQuestion.correctAnswer ? 'text-green-700' : 'text-amber-700'}`}>
              {selectedAnswer === currentQuestion.correctAnswer ? 'Correct!' : 'Not quite right'}
            </p>
            <p className="text-gray-600 text-sm">{currentQuestion.explanation}</p>
          </div>
        )}

        <div className="flex gap-3">
          {!isAnswered ? (
            <button onClick={handleSubmit} disabled={!selectedAnswer} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
              Submit Answer
            </button>
          ) : currentIndex < questions.length - 1 ? (
            <button onClick={handleNext} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors">
              Next Question
            </button>
          ) : (
            <Link href="/curriculum" className="flex-1">
              <button className="w-full py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors">
                Complete - Back to Topics
              </button>
            </Link>
          )}
        </div>
      </main>
    </div>
  );
}

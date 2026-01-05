'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  submitWritingForGrading,
  WritingGradingResult,
  getScoreColor,
  getScoreLabel,
  getScoreBgColor,
} from '@/services/writingGradingService';

interface WritingPrompt {
  id: string;
  title: string;
  prompt: string;
  type: 'narrative' | 'persuasive';
  timeLimit: number;
  wordLimit: { min: number; max: number };
  tips?: string[];
}

// Fallback sample prompts (used when Firestore is empty)
const SAMPLE_PROMPTS: WritingPrompt[] = [
  {
    id: 'sample-writing-1',
    title: 'Narrative Writing',
    prompt: 'Write a story that begins with the sentence: "The moment I opened the mysterious package, everything changed."',
    type: 'narrative',
    timeLimit: 20,
    wordLimit: { min: 300, max: 500 },
    tips: [
      'Start with a hook that captures the reader\'s attention',
      'Include sensory details to bring your story to life',
      'Build tension towards a climax',
      'End with a meaningful resolution',
    ],
  },
  {
    id: 'sample-writing-2',
    title: 'Persuasive Writing',
    prompt: 'Should students be allowed to use mobile phones at school? Write a persuasive essay presenting your argument.',
    type: 'persuasive',
    timeLimit: 20,
    wordLimit: { min: 300, max: 500 },
    tips: [
      'State your position clearly in the introduction',
      'Provide at least three strong arguments with evidence',
      'Address counter-arguments and refute them',
      'End with a powerful call to action',
    ],
  },
  {
    id: 'sample-writing-3',
    title: 'Creative Narrative',
    prompt: 'You discover that your reflection in the mirror has started moving independently. Write a story about what happens next.',
    type: 'narrative',
    timeLimit: 20,
    wordLimit: { min: 300, max: 500 },
    tips: [
      'Use the first person perspective to create immediacy',
      'Build suspense through gradual revelation',
      'Include dialogue to develop characters',
      'Consider an unexpected twist',
    ],
  },
  {
    id: 'sample-writing-4',
    title: 'Opinion Essay',
    prompt: 'Is it better to read books in print or digitally? Write a persuasive argument supporting your view.',
    type: 'persuasive',
    timeLimit: 20,
    wordLimit: { min: 300, max: 500 },
    tips: [
      'Consider environmental, practical, and experiential factors',
      'Use specific examples to support your points',
      'Acknowledge the benefits of the opposing view',
      'Conclude with a strong summary of your position',
    ],
  },
];

export default function WritingPractice() {
  const [prompts, setPrompts] = useState<WritingPrompt[]>([]);
  const [selectedPrompt, setSelectedPrompt] = useState<WritingPrompt | null>(null);
  const [response, setResponse] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gradingResult, setGradingResult] = useState<WritingGradingResult | null>(null);
  const [gradingError, setGradingError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);
  const [showTips, setShowTips] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load prompts
  useEffect(() => {
    const loadPrompts = async () => {
      try {
        // For now, use sample prompts
        // TODO: Add Firestore integration for writing prompts when collection is available
        setPrompts(SAMPLE_PROMPTS);
        setUsingFallback(true);
      } catch (error) {
        console.error('Error loading writing prompts:', error);
        setPrompts(SAMPLE_PROMPTS);
        setUsingFallback(true);
      } finally {
        setIsLoading(false);
      }
    };

    loadPrompts();
  }, []);

  // Timer effect
  useEffect(() => {
    if (timeRemaining !== null && timeRemaining > 0 && selectedPrompt && !gradingResult) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev === null || prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [timeRemaining, selectedPrompt, gradingResult]);

  const wordCount = response.trim().split(/\s+/).filter(Boolean).length;

  const handleStartWriting = (prompt: WritingPrompt) => {
    setSelectedPrompt(prompt);
    setTimeRemaining(prompt.timeLimit * 60);
    setStartTime(Date.now());
    setShowTips(true);
    setGradingResult(null);
    setGradingError(null);
  };

  const handleSubmit = async () => {
    if (!selectedPrompt || isSubmitting) return;
    if (timerRef.current) clearInterval(timerRef.current);

    setIsSubmitting(true);
    setGradingError(null);

    try {
      const timeSpentSeconds = startTime ? Math.round((Date.now() - startTime) / 1000) : undefined;

      const result = await submitWritingForGrading({
        promptId: selectedPrompt.id,
        promptText: selectedPrompt.prompt,
        promptType: selectedPrompt.type,
        response,
        wordCount,
        timeSpentSeconds,
      });

      setGradingResult(result.grading);
    } catch (error) {
      console.error('Grading error:', error);
      setGradingError(error instanceof Error ? error.message : 'Failed to grade writing. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackToSelection = () => {
    setSelectedPrompt(null);
    setResponse('');
    setGradingResult(null);
    setGradingError(null);
    setTimeRemaining(null);
    setStartTime(null);
    setShowTips(true);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  const getTimeColor = (): string => {
    if (timeRemaining === null) return 'text-gray-600';
    if (timeRemaining <= 60) return 'text-red-600';
    if (timeRemaining <= 300) return 'text-amber-600';
    return 'text-orange-600';
  };

  const getWordCountColor = (): string => {
    if (!selectedPrompt) return 'text-gray-600';
    if (wordCount >= selectedPrompt.wordLimit.min && wordCount <= selectedPrompt.wordLimit.max) {
      return 'text-green-600';
    }
    if (wordCount > selectedPrompt.wordLimit.max) {
      return 'text-red-600';
    }
    return 'text-orange-600';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  // Grading results view
  if (gradingResult && selectedPrompt) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <h1 className="text-xl font-semibold text-gray-900">Writing Feedback</h1>
            <p className="text-sm text-gray-500">{selectedPrompt.title}</p>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-6">
          {/* Overall Score Card */}
          <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Overall Score</h2>
                <p className="text-sm text-gray-500">{getScoreLabel(gradingResult.overallScore)}</p>
              </div>
              <div className={`text-4xl font-bold ${getScoreColor(gradingResult.overallScore)}`}>
                {gradingResult.overallScore}
                <span className="text-lg text-gray-400">/100</span>
              </div>
            </div>
            <p className="text-gray-700">{gradingResult.overallFeedback}</p>
          </div>

          {/* Criteria Scores */}
          <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Detailed Scores</h3>
            <div className="space-y-4">
              {Object.entries(gradingResult.criteria).map(([key, value]) => (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700 capitalize">{key}</span>
                    <span className={`text-sm font-bold ${getScoreColor(value.score)}`}>
                      {value.score}/100
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
                    <div
                      className={`h-full transition-all ${getScoreBgColor(value.score)}`}
                      style={{ width: `${value.score}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-600">{value.feedback}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Strengths & Improvements */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="bg-green-50 rounded-xl border border-green-200 p-4">
              <h4 className="font-medium text-green-800 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Strengths
              </h4>
              <ul className="space-y-2">
                {gradingResult.strengths.map((strength, index) => (
                  <li key={index} className="text-sm text-green-700 flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">•</span>
                    {strength}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-amber-50 rounded-xl border border-amber-200 p-4">
              <h4 className="font-medium text-amber-800 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Areas to Improve
              </h4>
              <ul className="space-y-2">
                {gradingResult.improvements.map((improvement, index) => (
                  <li key={index} className="text-sm text-amber-700 flex items-start gap-2">
                    <span className="text-amber-500 mt-0.5">•</span>
                    {improvement}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Your Response */}
          <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
            <h4 className="font-medium text-gray-900 mb-2">Your Response ({wordCount} words)</h4>
            <p className="text-gray-600 text-sm whitespace-pre-wrap max-h-48 overflow-y-auto">
              {response}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleBackToSelection}
              className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 transition-colors"
            >
              Try Another Prompt
            </button>
            <Link href="/selective" className="flex-1">
              <button className="w-full py-3 bg-orange-600 text-white rounded-xl font-medium hover:bg-orange-700 transition-colors">
                Back to Hub
              </button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // Writing interface
  if (selectedPrompt) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={handleBackToSelection} className="text-gray-500 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{selectedPrompt.title}</h1>
                <p className="text-sm text-gray-500">NSW Selective Practice</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-sm text-gray-500">Words</p>
                <p className={`text-lg font-bold ${getWordCountColor()}`}>
                  {wordCount}
                  <span className="text-sm font-normal text-gray-400">
                    /{selectedPrompt.wordLimit.min}-{selectedPrompt.wordLimit.max}
                  </span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Time</p>
                <p className={`text-lg font-bold ${getTimeColor()}`}>
                  {formatTime(timeRemaining || 0)}
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-6">
          {/* Prompt Card */}
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-orange-800 mb-1">Writing Prompt</p>
                <p className="text-gray-900">{selectedPrompt.prompt}</p>
                <p className="text-sm text-gray-500 mt-2">
                  Word limit: {selectedPrompt.wordLimit.min}-{selectedPrompt.wordLimit.max} words
                </p>
              </div>
              <span className={`ml-4 px-2 py-0.5 text-xs rounded-full font-medium ${
                selectedPrompt.type === 'narrative' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
              }`}>
                {selectedPrompt.type === 'narrative' ? 'Narrative' : 'Persuasive'}
              </span>
            </div>
          </div>

          {/* Tips (collapsible) */}
          {selectedPrompt.tips && selectedPrompt.tips.length > 0 && (
            <div className="mb-4">
              <button
                onClick={() => setShowTips(!showTips)}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
              >
                <svg
                  className={`w-4 h-4 transition-transform ${showTips ? 'rotate-90' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                Writing Tips
              </button>
              {showTips && (
                <div className="mt-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <ul className="text-sm text-blue-800 space-y-1">
                    {selectedPrompt.tips.map((tip, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-blue-500 mt-0.5">•</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Writing Area */}
          <textarea
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            placeholder="Start writing your response here..."
            className="w-full h-96 p-4 border rounded-xl resize-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900"
            autoFocus
            disabled={isSubmitting}
          />

          {/* Time warning */}
          {timeRemaining !== null && timeRemaining <= 60 && timeRemaining > 0 && (
            <div className="mt-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700">
              Less than 1 minute remaining!
            </div>
          )}

          {/* Time expired */}
          {timeRemaining === 0 && (
            <div className="mt-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700">
              Time is up! Please submit your writing.
            </div>
          )}

          {/* Grading error */}
          {gradingError && (
            <div className="mt-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700">
              {gradingError}
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-3 mt-4">
            <button
              onClick={handleSubmit}
              disabled={wordCount < selectedPrompt.wordLimit.min || isSubmitting}
              className="flex-1 py-3 bg-orange-600 text-white rounded-xl font-medium hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Grading your writing...
                </>
              ) : wordCount < selectedPrompt.wordLimit.min ? (
                `Write at least ${selectedPrompt.wordLimit.min - wordCount} more words`
              ) : (
                'Submit for AI Grading'
              )}
            </button>
          </div>
        </main>
      </div>
    );
  }

  // Prompt selection
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/selective" className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Writing</h1>
            <p className="text-sm text-gray-500">NSW Selective Practice</p>
          </div>
        </div>
      </header>

      {/* Fallback notice */}
      {usingFallback && (
        <div className="max-w-4xl mx-auto px-4 pt-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 text-sm text-amber-700">
            Using sample prompts (Firestore data not loaded)
          </div>
        </div>
      )}

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900">Choose a Writing Task</h2>
          <p className="text-gray-500">Select a prompt to practice your writing skills. Your response will be graded by AI.</p>
        </div>

        <div className="space-y-4">
          {prompts.map((prompt) => (
            <div key={prompt.id} className="bg-white rounded-xl shadow-sm border p-6 hover:border-orange-300 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                      prompt.type === 'narrative' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {prompt.type === 'narrative' ? 'Narrative' : 'Persuasive'}
                    </span>
                    <span className="text-sm text-gray-500">{prompt.timeLimit} minutes</span>
                    <span className="text-sm text-gray-400">•</span>
                    <span className="text-sm text-gray-500">{prompt.wordLimit.min}-{prompt.wordLimit.max} words</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{prompt.title}</h3>
                  <p className="text-gray-600 text-sm">{prompt.prompt}</p>
                </div>
                <button
                  onClick={() => handleStartWriting(prompt)}
                  className="ml-4 px-4 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors"
                >
                  Start
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

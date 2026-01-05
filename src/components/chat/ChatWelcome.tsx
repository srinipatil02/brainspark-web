'use client';

import React from 'react';
import { QUICK_START_QUESTIONS } from '@/lib/chatTypes';

interface ChatWelcomeProps {
  topicTitle: string;
  topicKey?: string;
  onQuestionClick: (question: string) => void;
  socraticMode?: boolean;
}

/**
 * Welcome screen shown when chat has no messages
 * - Personalized greeting
 * - Topic-specific quick-start questions
 * - Capabilities overview
 */
export function ChatWelcome({
  topicTitle,
  topicKey,
  onQuestionClick,
  socraticMode = false,
}: ChatWelcomeProps) {
  // Get topic-specific questions or fall back to default
  const quickQuestions = topicKey && QUICK_START_QUESTIONS[topicKey]
    ? QUICK_START_QUESTIONS[topicKey]
    : QUICK_START_QUESTIONS.default;

  return (
    <div className="flex flex-col items-center justify-center h-full px-4 py-8">
      {/* Brain icon with gradient background */}
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
          <svg viewBox="0 0 24 24" fill="none" className="w-10 h-10 text-white" stroke="currentColor" strokeWidth="1.5">
            <path
              d="M12 3c-1.5 0-2.8.6-3.8 1.6-.5-.2-1-.3-1.6-.3-2.2 0-4 1.8-4 4 0 .5.1 1 .2 1.4C2.3 10.5 2 11.5 2 12.5c0 1.5.7 2.9 1.8 3.8-.1.4-.2.8-.2 1.2 0 2.2 1.8 4 4 4 .6 0 1.2-.1 1.7-.4.9.9 2.2 1.4 3.5 1.4s2.6-.5 3.5-1.4c.5.2 1.1.4 1.7.4 2.2 0 4-1.8 4-4 0-.4-.1-.8-.2-1.2 1.1-.9 1.8-2.3 1.8-3.8 0-1-.3-2-1-2.9.1-.4.2-.9.2-1.4 0-2.2-1.8-4-4-4-.6 0-1.1.1-1.6.3C14.8 3.6 13.5 3 12 3z"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path d="M12 8v3m0 2v3m-3-4h6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        {/* Sparkle accents */}
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-300 rounded-full animate-pulse shadow-md" />
        <span className="absolute -bottom-1 -left-1 w-3 h-3 bg-pink-300 rounded-full animate-pulse delay-150 shadow-md" />
      </div>

      {/* Greeting */}
      <h3 className="text-xl font-semibold text-gray-800 mb-2 text-center">
        Hi! I&apos;m your AI tutor
      </h3>

      <p className="text-gray-500 text-sm text-center mb-6 max-w-xs">
        {socraticMode ? (
          <>I&apos;ll guide you with questions to help you discover answers about <span className="font-medium text-indigo-600">{topicTitle}</span>.</>
        ) : (
          <>Ask me anything about <span className="font-medium text-indigo-600">{topicTitle}</span>. I&apos;m here to help you learn!</>
        )}
      </p>

      {/* Quick-start questions */}
      <div className="w-full space-y-2">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3 text-center">
          Quick questions to get started
        </p>

        {quickQuestions.map((question, index) => (
          <button
            key={index}
            onClick={() => onQuestionClick(question)}
            className="
              w-full text-left text-sm
              px-4 py-3 rounded-xl
              bg-white border border-gray-200
              text-gray-700 hover:text-indigo-600
              hover:border-indigo-300 hover:bg-indigo-50
              transition-all duration-200
              shadow-sm hover:shadow
            "
          >
            <span className="flex items-center gap-2">
              <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 flex-shrink-0 text-indigo-400" stroke="currentColor" strokeWidth="2">
                <path d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {question}
            </span>
          </button>
        ))}
      </div>

      {/* Capabilities */}
      <div className="mt-6 pt-6 border-t border-gray-100 w-full">
        <p className="text-xs text-gray-400 text-center mb-3">I can help you with:</p>
        <div className="flex flex-wrap justify-center gap-2">
          {[
            { icon: '💡', label: 'Explanations' },
            { icon: '🔬', label: 'Examples' },
            { icon: '❓', label: 'Practice' },
            { icon: '🧩', label: 'Connections' },
          ].map((item, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 rounded-full text-xs text-gray-600"
            >
              <span>{item.icon}</span>
              {item.label}
            </span>
          ))}
        </div>
      </div>

      {/* Socratic mode indicator */}
      {socraticMode && (
        <div className="mt-4 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700 flex items-center gap-2">
          <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="2">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Socratic Mode: I&apos;ll help you think through problems step by step
        </div>
      )}
    </div>
  );
}

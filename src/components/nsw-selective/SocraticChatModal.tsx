// =============================================================================
// SOCRATIC CHAT MODAL COMPONENT
// =============================================================================
// FILE: src/components/nsw-selective/SocraticChatModal.tsx
// DOMAIN: NSW Selective Exam Prep - AI Tutoring
// PURPOSE: Real-time Socratic dialogue to guide students through problems
// CRITICAL: NEVER reveal answers, only ask guiding questions

'use client';

import { useState, useRef, useEffect } from 'react';
import { FirestoreQuestion } from '@/types';
import { getAISocraticCoaching, SocraticCoachResponse } from '@/services/nsw-selective/aiTutoringService';

// =============================================================================
// TYPES
// =============================================================================

interface SocraticChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  question: FirestoreQuestion;
  correctAnswer: string;
  wrongAnswersSelected: string[];
  hintsAlreadySeen: string[];
  timeOnQuestionSeconds: number;
  masteryLevel: number;
  onInsightGained?: () => void;
}

interface ChatMessage {
  role: 'student' | 'tutor';
  message: string;
  timestamp: number;
}

// =============================================================================
// ICON COMPONENTS
// =============================================================================

function BrainIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  );
}

function SendIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
    </svg>
  );
}

function SparklesIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
    </svg>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex items-center gap-2 text-indigo-600">
      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
      </svg>
      <span className="text-sm">Thinking...</span>
    </div>
  );
}

// =============================================================================
// QUICK RESPONSE BUTTONS
// =============================================================================

const QUICK_RESPONSES = [
  { label: "I'm stuck", value: "I'm not sure where to start with this problem." },
  { label: "Can you explain?", value: "Can you help me understand what the question is asking?" },
  { label: "What's the first step?", value: "What should I focus on first?" },
  { label: "I tried but...", value: "I tried solving it but I'm getting confused." },
];

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function SocraticChatModal({
  isOpen,
  onClose,
  question,
  correctAnswer,
  wrongAnswersSelected,
  hintsAlreadySeen,
  timeOnQuestionSeconds,
  masteryLevel,
  onInsightGained,
}: SocraticChatModalProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastResponse, setLastResponse] = useState<SocraticCoachResponse | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      // Send initial greeting if no messages
      if (messages.length === 0) {
        sendInitialGreeting();
      }
    }
  }, [isOpen]);

  const sendInitialGreeting = async () => {
    setIsLoading(true);
    try {
      const response = await getAISocraticCoaching({
        question,
        correctAnswer,
        conversation: [],
        wrongAnswersSelected,
        hintsAlreadySeen,
        timeOnQuestionSeconds,
        masteryLevel,
      });

      if (response.success && response.nextQuestion) {
        const tutorMessage: ChatMessage = {
          role: 'tutor',
          message: response.nextQuestion,
          timestamp: Date.now(),
        };
        setMessages([tutorMessage]);
        setLastResponse(response);
      } else {
        // Fallback greeting
        const fallbackMessage: ChatMessage = {
          role: 'tutor',
          message: "Hi! I'm here to help you work through this problem. What part are you finding tricky?",
          timestamp: Date.now(),
        };
        setMessages([fallbackMessage]);
      }
    } catch (error) {
      console.error('Initial greeting failed:', error);
      const fallbackMessage: ChatMessage = {
        role: 'tutor',
        message: "Hi! Let's work through this together. Tell me what you're thinking so far.",
        timestamp: Date.now(),
      };
      setMessages([fallbackMessage]);
    }
    setIsLoading(false);
  };

  const handleSendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    // Add student message
    const studentMessage: ChatMessage = {
      role: 'student',
      message: messageText.trim(),
      timestamp: Date.now(),
    };
    const updatedMessages = [...messages, studentMessage];
    setMessages(updatedMessages);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await getAISocraticCoaching({
        question,
        correctAnswer,
        conversation: updatedMessages,
        studentCurrentThinking: messageText.trim(),
        wrongAnswersSelected,
        hintsAlreadySeen,
        timeOnQuestionSeconds,
        masteryLevel,
      });

      if (response.success && response.nextQuestion) {
        const tutorMessage: ChatMessage = {
          role: 'tutor',
          message: response.nextQuestion,
          timestamp: Date.now(),
        };
        setMessages(prev => [...prev, tutorMessage]);
        setLastResponse(response);

        // Check if student seems to be getting it
        if (response.targetInsight?.toLowerCase().includes('correct') ||
            response.targetInsight?.toLowerCase().includes('understand')) {
          onInsightGained?.();
        }
      } else {
        // Fallback response
        const fallbackMessage: ChatMessage = {
          role: 'tutor',
          message: lastResponse?.fallbackHint || "That's interesting! Can you tell me more about your thinking?",
          timestamp: Date.now(),
        };
        setMessages(prev => [...prev, fallbackMessage]);
      }
    } catch (error) {
      console.error('Socratic coaching failed:', error);
      const errorMessage: ChatMessage = {
        role: 'tutor',
        message: "I'm having trouble connecting right now. Try thinking about what the question is really asking - what information do you have, and what do you need to find?",
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMessage]);
    }

    setIsLoading(false);
  };

  const handleQuickResponse = (value: string) => {
    handleSendMessage(value);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputValue);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <BrainIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">
                Thinking Coach
              </h3>
              <p className="text-sm text-indigo-100">
                I'll guide you with questions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 min-h-[300px]">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.role === 'student' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  msg.role === 'student'
                    ? 'bg-indigo-600 text-white rounded-br-md'
                    : 'bg-white shadow-md text-gray-800 rounded-bl-md border border-gray-100'
                }`}
              >
                {msg.role === 'tutor' && (
                  <div className="flex items-center gap-1 mb-1">
                    <SparklesIcon className="w-3 h-3 text-purple-500" />
                    <span className="text-xs text-purple-500 font-medium">AI Coach</span>
                  </div>
                )}
                <p className="text-sm leading-relaxed">{msg.message}</p>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white shadow-md rounded-2xl rounded-bl-md px-4 py-3 border border-gray-100">
                <LoadingSpinner />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Responses */}
        {messages.length <= 2 && !isLoading && (
          <div className="px-4 py-2 bg-gray-50 border-t">
            <p className="text-xs text-gray-500 mb-2">Quick responses:</p>
            <div className="flex flex-wrap gap-2">
              {QUICK_RESPONSES.map((response, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickResponse(response.value)}
                  className="px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs text-gray-700 hover:bg-indigo-50 hover:border-indigo-200 transition-colors"
                >
                  {response.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="p-4 bg-white border-t">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Share your thinking..."
              disabled={isLoading}
              className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm disabled:bg-gray-50"
            />
            <button
              onClick={() => handleSendMessage(inputValue)}
              disabled={!inputValue.trim() || isLoading}
              className="px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <SendIcon className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2 text-center">
            I'll ask questions to guide your thinking - I won't give you the answer!
          </p>
        </div>
      </div>
    </div>
  );
}

export default SocraticChatModal;

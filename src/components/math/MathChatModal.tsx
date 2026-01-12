'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { QuestionRenderer } from '@/components/QuestionRenderer';
import {
  sendMathSocraticMessage,
  checkStudentWork,
  getMathFollowUpQuestions,
  formatWorkForChat,
  MATH_ENCOURAGEMENTS,
  type MathChatContext,
  type MathChatMessage,
  type MathChatResponse,
  type WorkCheckResult,
} from '@/services/mathSocraticChatService';
import type { WorkLine } from '@/types';

// =============================================================================
// MATH CHAT MODAL (Phase 5)
// Pure Socratic AI tutor with LaTeX support and "Check My Work" mode
// =============================================================================

interface MathChatModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback to close the modal */
  onClose: () => void;
  /** Problem context */
  problemStem: string;
  /** Starting expression */
  startingExpression: string;
  /** Expected answers (for AI guidance, never revealed) */
  expectedAnswers: string[];
  /** Student's current work */
  studentWork: WorkLine[];
  /** Student's final answer attempt */
  studentFinalAnswer?: string;
  /** Topic name */
  topic: string;
  /** Year level */
  year: number;
  /** Key concepts */
  keyConcepts?: string[];
  /** Color theme */
  colorTheme?: string;
}

/**
 * MathChatModal - Socratic AI tutor for math problems
 *
 * Features:
 * - Pure Socratic method (never gives answers)
 * - LaTeX rendering in responses
 * - "Check My Work" mode
 * - Guiding questions
 * - Encouragement system
 */
export function MathChatModal({
  isOpen,
  onClose,
  problemStem,
  startingExpression,
  expectedAnswers,
  studentWork,
  studentFinalAnswer,
  topic,
  year,
  keyConcepts = [],
  colorTheme = 'indigo',
}: MathChatModalProps) {
  const [messages, setMessages] = useState<MathChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<'socratic' | 'check_work' | 'explain_concept'>('socratic');
  const [workCheckResult, setWorkCheckResult] = useState<WorkCheckResult | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Build context for API calls
  const context: MathChatContext = {
    problemStem,
    startingExpression,
    expectedAnswers,
    studentWork,
    studentFinalAnswer,
    topic,
    year,
    keyConcepts,
  };

  // Scroll to bottom of messages
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Scroll when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      // Add welcome message if no messages
      if (messages.length === 0) {
        const welcomeMessage: MathChatMessage = {
          role: 'assistant',
          content: getWelcomeMessage(topic),
          timestamp: new Date(),
        };
        setMessages([welcomeMessage]);
      }
    }
  }, [isOpen, messages.length, topic]);

  // Send a message
  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: MathChatMessage = {
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await sendMathSocraticMessage({
        question: userMessage.content,
        context,
        mode,
        history: messages.slice(-10),
      });

      const assistantMessage: MathChatMessage = {
        role: 'assistant',
        content: response.response || "I'm here to help! What would you like to explore?",
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: MathChatMessage = {
        role: 'assistant',
        content: "I'm having trouble connecting right now. Let me still try to help - what specific step are you working on?",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Check student's work
  const handleCheckWork = async () => {
    setIsLoading(true);
    setMode('check_work');

    try {
      const result = await checkStudentWork(context);
      setWorkCheckResult(result);

      // Add a message about the check
      const checkMessage: MathChatMessage = {
        role: 'assistant',
        content: formatWorkCheckMessage(result),
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, checkMessage]);
    } catch (error) {
      console.error('Work check error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Use a suggested follow-up question
  const useFollowUp = (question: string) => {
    setInputValue(question);
    inputRef.current?.focus();
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) return null;

  const followUpQuestions = getMathFollowUpQuestions(topic);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className={`px-6 py-4 bg-gradient-to-r from-${colorTheme}-500 to-${colorTheme}-600 text-white`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🧮</span>
              <div>
                <h2 className="font-bold text-lg">Math Tutor</h2>
                <p className="text-sm text-white/80">I'll guide you, not give you answers</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Mode Tabs */}
          <div className="flex gap-2 mt-4">
            <ModeButton
              active={mode === 'socratic'}
              onClick={() => setMode('socratic')}
              icon="💬"
              label="Ask a Question"
            />
            <ModeButton
              active={mode === 'check_work'}
              onClick={handleCheckWork}
              icon="✓"
              label="Check My Work"
            />
            <ModeButton
              active={mode === 'explain_concept'}
              onClick={() => setMode('explain_concept')}
              icon="📚"
              label="Explain Concept"
            />
          </div>
        </div>

        {/* Current Problem Context */}
        <div className="px-4 py-3 bg-gray-50 border-b">
          <div className="text-xs text-gray-500 mb-1">Current Problem</div>
          <QuestionRenderer content={problemStem} className="text-sm font-medium" />
          {studentWork.length > 0 && (
            <div className="mt-2 text-xs text-gray-500">
              Your work: {studentWork.length - 1} step{studentWork.length !== 2 ? 's' : ''} shown
            </div>
          )}
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message, index) => (
            <ChatBubble key={index} message={message} />
          ))}

          {/* Work Check Result */}
          {workCheckResult && mode === 'check_work' && (
            <WorkCheckFeedback result={workCheckResult} />
          )}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex items-center gap-2 text-gray-500">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-sm">Thinking...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Follow-up Questions */}
        {messages.length > 0 && messages.length < 3 && (
          <div className="px-4 py-2 border-t bg-gray-50">
            <p className="text-xs text-gray-500 mb-2">Suggested questions:</p>
            <div className="flex flex-wrap gap-2">
              {followUpQuestions.slice(0, 3).map((question, i) => (
                <button
                  key={i}
                  onClick={() => useFollowUp(question)}
                  className="text-xs px-3 py-1.5 bg-white border border-gray-200 rounded-full hover:bg-gray-100 transition-colors"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="p-4 border-t bg-white">
          <div className="flex gap-3">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me a question about this problem..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              disabled={isLoading}
            />
            <button
              onClick={sendMessage}
              disabled={!inputValue.trim() || isLoading}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                inputValue.trim() && !isLoading
                  ? 'bg-indigo-500 hover:bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>
          <p className="mt-2 text-xs text-gray-400 text-center">
            Remember: I'll guide you with questions, not give you answers. That's how you learn best!
          </p>
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Sub-components
// -----------------------------------------------------------------------------

interface ModeButtonProps {
  active: boolean;
  onClick: () => void;
  icon: string;
  label: string;
}

function ModeButton({ active, onClick, icon, label }: ModeButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
        active
          ? 'bg-white text-indigo-600'
          : 'bg-white/20 text-white hover:bg-white/30'
      }`}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

interface ChatBubbleProps {
  message: MathChatMessage;
}

function ChatBubble({ message }: ChatBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-indigo-500 text-white rounded-br-sm'
            : 'bg-gray-100 text-gray-800 rounded-bl-sm'
        }`}
      >
        {/* Render with LaTeX support */}
        <QuestionRenderer
          content={message.content}
          className={isUser ? 'text-white' : 'text-gray-800'}
        />
        <div className={`text-xs mt-1 ${isUser ? 'text-indigo-200' : 'text-gray-400'}`}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
}

interface WorkCheckFeedbackProps {
  result: WorkCheckResult;
}

function WorkCheckFeedback({ result }: WorkCheckFeedbackProps) {
  const assessmentColors = {
    excellent: 'bg-green-50 border-green-200',
    correct_path: 'bg-blue-50 border-blue-200',
    minor_error: 'bg-amber-50 border-amber-200',
    significant_error: 'bg-red-50 border-red-200',
  };

  const assessmentIcons = {
    excellent: '🌟',
    correct_path: '✓',
    minor_error: '~',
    significant_error: '⚠️',
  };

  return (
    <div className={`rounded-xl border-2 p-4 ${assessmentColors[result.assessment]}`}>
      <div className="flex items-start gap-3">
        <span className="text-2xl">{assessmentIcons[result.assessment]}</span>
        <div className="flex-1">
          <h4 className="font-semibold text-gray-800">{result.encouragement}</h4>

          {/* Step-by-step feedback */}
          {result.stepFeedback.length > 0 && (
            <div className="mt-3 space-y-2">
              {result.stepFeedback.map((step) => (
                <div key={step.stepNumber} className="flex items-start gap-2">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                    step.status === 'correct' ? 'bg-green-100 text-green-600' :
                    step.status === 'needs_attention' ? 'bg-amber-100 text-amber-600' :
                    'bg-blue-100 text-blue-600'
                  }`}>
                    {step.stepNumber}
                  </span>
                  <p className="text-sm text-gray-600">{step.guidingQuestion}</p>
                </div>
              ))}
            </div>
          )}

          {/* Next step hint */}
          <div className="mt-3 p-2 bg-white/50 rounded-lg">
            <p className="text-sm">
              <span className="font-medium">Think about:</span> {result.nextStepHint}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Helper Functions
// -----------------------------------------------------------------------------

function getWelcomeMessage(topic: string): string {
  const messages = [
    `Hi! I'm your math tutor. I'm here to help you think through this ${topic} problem step by step.\n\nI won't just give you answers - that wouldn't help you learn! Instead, I'll ask questions that guide you to discover the solution yourself. What would you like to explore?`,
    `Welcome! Ready to work through this ${topic} problem together?\n\nI'll be your guide, helping you think critically about each step. Remember, making mistakes is part of learning - they help us understand better! What's on your mind?`,
    `Hey there! Let's tackle this ${topic} problem.\n\nI'm a Socratic tutor, which means I'll help you by asking questions rather than just giving answers. This way, you'll really understand the math. What's your first question?`,
  ];
  return messages[Math.floor(Math.random() * messages.length)];
}

function formatWorkCheckMessage(result: WorkCheckResult): string {
  let message = result.encouragement + '\n\n';

  if (result.assessment === 'excellent') {
    message += "Your work looks great! ";
  } else if (result.assessment === 'correct_path') {
    message += "You're on the right track. ";
  } else {
    message += "Let me help guide you through this. ";
  }

  message += result.nextStepHint;

  return message;
}

export default MathChatModal;

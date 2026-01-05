'use client';

import React, { useRef, useEffect } from 'react';
import { ChatMessage as ChatMessageType } from '@/lib/chatTypes';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { ChatWelcome } from './ChatWelcome';
import { SocraticToggle } from './SocraticToggle';
import { ProgressVisualization } from './ProgressVisualization';

interface ConceptChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  topicTitle: string;
  topicKey?: string;
  messages: ChatMessageType[];
  isLoading: boolean;
  error: string | null;
  socraticMode: boolean;
  onToggleSocraticMode: () => void;
  onSendMessage: (message: string) => void;
  onFollowUpClick: (question: string) => void;
  onClearSession: () => void;
  conceptsExplored?: number;
  questionsAsked?: number;
  currentStreak?: number;
}

/**
 * Full-screen chat modal with all chat functionality
 */
export function ConceptChatModal({
  isOpen,
  onClose,
  topicTitle,
  topicKey,
  messages,
  isLoading,
  error,
  socraticMode,
  onToggleSocraticMode,
  onSendMessage,
  onFollowUpClick,
  onClearSession,
  conceptsExplored = 0,
  questionsAsked = 0,
  currentStreak = 0,
}: ConceptChatModalProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Handle escape key to close
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const hasMessages = messages.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="
          relative w-full max-w-lg h-[80vh] max-h-[700px]
          mx-4 bg-white rounded-2xl shadow-2xl
          flex flex-col overflow-hidden
          animate-in fade-in slide-in-from-bottom-4 duration-300
        "
        role="dialog"
        aria-modal="true"
        aria-labelledby="chat-title"
      >
        {/* Header */}
        <div className="flex-shrink-0 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Brain icon */}
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth="1.5">
                  <path
                    d="M12 3c-1.5 0-2.8.6-3.8 1.6-.5-.2-1-.3-1.6-.3-2.2 0-4 1.8-4 4 0 .5.1 1 .2 1.4C2.3 10.5 2 11.5 2 12.5c0 1.5.7 2.9 1.8 3.8-.1.4-.2.8-.2 1.2 0 2.2 1.8 4 4 4 .6 0 1.2-.1 1.7-.4.9.9 2.2 1.4 3.5 1.4s2.6-.5 3.5-1.4c.5.2 1.1.4 1.7.4 2.2 0 4-1.8 4-4 0-.4-.1-.8-.2-1.2 1.1-.9 1.8-2.3 1.8-3.8 0-1-.3-2-1-2.9.1-.4.2-.9.2-1.4 0-2.2-1.8-4-4-4-.6 0-1.1.1-1.6.3C14.8 3.6 13.5 3 12 3z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              <div>
                <h2 id="chat-title" className="font-semibold text-base">AI Tutor</h2>
                <p className="text-xs text-white/80 truncate max-w-[180px]">{topicTitle}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Socratic mode toggle */}
              <SocraticToggle
                enabled={socraticMode}
                onToggle={onToggleSocraticMode}
              />

              {/* Clear session button */}
              {hasMessages && (
                <button
                  onClick={onClearSession}
                  className="p-2 rounded-lg hover:bg-white/20 transition-colors"
                  title="Start new conversation"
                >
                  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4v5h5M20 20v-5h-5M4 9a9 9 0 019-9 9.75 9.75 0 016.74 2.74L20 4M4 20l.26-1.26A9.75 9.75 0 0111 21a9 9 0 009-9" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              )}

              {/* Close button */}
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white/20 transition-colors"
                aria-label="Close chat"
              >
                <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="2">
                  <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>

          {/* Progress bar (when messages exist) */}
          {hasMessages && (
            <ProgressVisualization
              questionsAsked={questionsAsked}
              conceptsExplored={conceptsExplored}
              currentStreak={currentStreak}
            />
          )}
        </div>

        {/* Messages area */}
        <div
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto p-4 bg-gray-50"
        >
          {hasMessages ? (
            <>
              {messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  onFollowUpClick={onFollowUpClick}
                />
              ))}
              <div ref={messagesEndRef} />
            </>
          ) : (
            <ChatWelcome
              topicTitle={topicTitle}
              topicKey={topicKey}
              onQuestionClick={onSendMessage}
              socraticMode={socraticMode}
            />
          )}
        </div>

        {/* Error banner */}
        {error && (
          <div className="flex-shrink-0 bg-red-50 border-t border-red-100 px-4 py-2">
            <p className="text-sm text-red-600 flex items-center gap-2">
              <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 flex-shrink-0" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4M12 16h.01" strokeLinecap="round" />
              </svg>
              {error}
            </p>
          </div>
        )}

        {/* Input area */}
        <ChatInput
          onSend={onSendMessage}
          isLoading={isLoading}
          placeholder={socraticMode ? "What do you think...?" : "Ask about this topic..."}
        />
      </div>
    </div>
  );
}

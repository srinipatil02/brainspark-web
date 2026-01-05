'use client';

import React from 'react';
import { ChatMessage as ChatMessageType } from '@/lib/chatTypes';

interface ChatMessageProps {
  message: ChatMessageType;
  onFollowUpClick?: (question: string) => void;
}

/**
 * Chat message bubble component
 * - User messages: Blue, right-aligned
 * - AI messages: White with border, left-aligned
 * - Typing indicator: Animated dots
 */
export function ChatMessage({ message, onFollowUpClick }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const isError = message.metadata?.provider === 'error';

  // Typing indicator
  if (message.isTyping) {
    return (
      <div className="flex justify-start mb-4">
        <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
          <div className="flex space-x-1.5">
            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`
          max-w-[85%] px-4 py-3 shadow-sm
          ${isUser
            ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-2xl rounded-tr-sm'
            : isError
              ? 'bg-red-50 border border-red-200 text-red-700 rounded-2xl rounded-tl-sm'
              : 'bg-white border border-gray-200 text-gray-800 rounded-2xl rounded-tl-sm'
          }
        `}
      >
        {/* Message content */}
        <div className={`text-sm leading-relaxed whitespace-pre-wrap ${isUser ? 'text-white' : ''}`}>
          {message.content}
        </div>

        {/* Follow-up questions (for AI messages only) */}
        {!isUser && message.suggestedFollowUps && message.suggestedFollowUps.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
            <p className="text-xs text-gray-500 font-medium">Continue exploring:</p>
            {message.suggestedFollowUps.map((question, index) => (
              <button
                key={index}
                onClick={() => onFollowUpClick?.(question)}
                className="
                  block w-full text-left text-sm
                  px-3 py-2 rounded-lg
                  bg-indigo-50 text-indigo-700
                  hover:bg-indigo-100 transition-colors
                  border border-indigo-100
                "
              >
                {question}
              </button>
            ))}
          </div>
        )}

        {/* Metadata (optional, for debugging) */}
        {!isUser && message.metadata && process.env.NODE_ENV === 'development' && (
          <div className="mt-2 pt-2 border-t border-gray-100 text-xs text-gray-400">
            {message.metadata.provider && <span className="mr-2">via {message.metadata.provider}</span>}
            {message.metadata.processingTime && <span>{message.metadata.processingTime}ms</span>}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * System message component (for explain-back prompts, etc.)
 */
export function SystemMessage({ content }: { content: string }) {
  return (
    <div className="flex justify-center mb-4">
      <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl px-4 py-3 max-w-[90%]">
        <div className="flex items-start gap-2">
          <span className="text-xl">💡</span>
          <p className="text-sm text-amber-800 leading-relaxed">{content}</p>
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  disabled?: boolean;
}

/**
 * Chat input field with send button
 * - Auto-resize textarea
 * - Enter to send (Shift+Enter for new line)
 * - Send button with loading state
 */
export function ChatInput({
  onSend,
  isLoading = false,
  placeholder = 'Ask about this topic...',
  disabled = false,
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea based on content
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
    }
  }, [message]);

  // Focus input when component mounts
  useEffect(() => {
    if (!disabled && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [disabled]);

  const handleSend = () => {
    if (message.trim() && !isLoading && !disabled) {
      onSend(message.trim());
      setMessage('');
      // Reset height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter to send (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const canSend = message.trim().length > 0 && !isLoading && !disabled;

  return (
    <div className="border-t border-gray-200 bg-white p-4">
      <div className="flex items-end gap-3">
        {/* Input field */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || isLoading}
            rows={1}
            className="
              w-full resize-none
              px-4 py-3 pr-12
              border border-gray-200 rounded-xl
              bg-gray-50 text-gray-800
              placeholder-gray-400
              focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
              focus:bg-white
              disabled:opacity-50 disabled:cursor-not-allowed
              text-sm leading-relaxed
              transition-all duration-200
            "
            style={{ minHeight: '44px', maxHeight: '150px' }}
          />

          {/* Character count (optional) */}
          {message.length > 200 && (
            <span
              className={`
                absolute bottom-2 right-14 text-xs
                ${message.length > 500 ? 'text-red-500' : 'text-gray-400'}
              `}
            >
              {message.length}/500
            </span>
          )}
        </div>

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={!canSend}
          className={`
            flex items-center justify-center
            w-11 h-11 rounded-xl
            transition-all duration-200
            ${canSend
              ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:scale-105 active:scale-95'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }
          `}
          aria-label="Send message"
        >
          {isLoading ? (
            <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          ) : (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="w-5 h-5"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                d="M22 2L11 13M22 2L15 22L11 13L2 9L22 2Z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>
      </div>

      {/* Helper text */}
      <p className="mt-2 text-xs text-gray-400 text-center">
        Press Enter to send, Shift+Enter for new line
      </p>
    </div>
  );
}

'use client';

import React from 'react';

interface ConceptChatButtonProps {
  onClick: () => void;
  hasMessages?: boolean;
  isLoading?: boolean;
}

/**
 * Floating chat button with gradient and pulse animation
 * Position: fixed bottom-right corner
 */
export function ConceptChatButton({
  onClick,
  hasMessages = false,
  isLoading = false,
}: ConceptChatButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className="fixed bottom-6 right-6 z-50 group"
      aria-label="Open AI tutor chat"
    >
      {/* Pulse ring animation */}
      <span className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 opacity-75 animate-ping" />

      {/* Main button */}
      <span
        className={`
          relative flex items-center justify-center
          w-14 h-14 rounded-full
          bg-gradient-to-r from-indigo-500 to-purple-600
          shadow-lg shadow-indigo-500/30
          transform transition-all duration-200
          hover:scale-110 hover:shadow-xl hover:shadow-indigo-500/40
          active:scale-95
          ${isLoading ? 'opacity-75' : ''}
        `}
      >
        {/* Brain/Sparkle Icon */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="w-7 h-7 text-white"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          {/* Brain path */}
          <path
            d="M12 3c-1.5 0-2.8.6-3.8 1.6-.5-.2-1-.3-1.6-.3-2.2 0-4 1.8-4 4 0 .5.1 1 .2 1.4C2.3 10.5 2 11.5 2 12.5c0 1.5.7 2.9 1.8 3.8-.1.4-.2.8-.2 1.2 0 2.2 1.8 4 4 4 .6 0 1.2-.1 1.7-.4.9.9 2.2 1.4 3.5 1.4s2.6-.5 3.5-1.4c.5.2 1.1.4 1.7.4 2.2 0 4-1.8 4-4 0-.4-.1-.8-.2-1.2 1.1-.9 1.8-2.3 1.8-3.8 0-1-.3-2-1-2.9.1-.4.2-.9.2-1.4 0-2.2-1.8-4-4-4-.6 0-1.1.1-1.6.3C14.8 3.6 13.5 3 12 3z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Neural connections */}
          <path
            d="M12 8v3m0 2v3m-3-4h6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        {/* Sparkle accents */}
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-300 rounded-full animate-pulse" />
        <span className="absolute -bottom-0.5 -left-0.5 w-2 h-2 bg-pink-300 rounded-full animate-pulse delay-150" />
      </span>

      {/* Message indicator badge */}
      {hasMessages && (
        <span className="absolute -top-1 -left-1 flex h-4 w-4 items-center justify-center">
          <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 animate-ping" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-green-500" />
        </span>
      )}

      {/* Tooltip */}
      <span
        className="
          absolute right-full mr-3 top-1/2 -translate-y-1/2
          px-3 py-1.5 rounded-lg
          bg-gray-900 text-white text-sm font-medium
          whitespace-nowrap
          opacity-0 invisible
          group-hover:opacity-100 group-hover:visible
          transition-all duration-200
          pointer-events-none
        "
      >
        Ask AI Tutor
        <span className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-gray-900" />
      </span>
    </button>
  );
}

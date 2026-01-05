'use client';

import React, { useState } from 'react';

interface SocraticToggleProps {
  enabled: boolean;
  onToggle: () => void;
}

/**
 * Toggle switch for Socratic mode in chat header
 * Shows tooltip explaining what Socratic mode does
 */
export function SocraticToggle({ enabled, onToggle }: SocraticToggleProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={onToggle}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`
          flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg
          text-xs font-medium transition-all duration-200
          ${enabled
            ? 'bg-white/30 text-white'
            : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
          }
        `}
        title={enabled ? 'Socratic mode is ON' : 'Enable Socratic mode'}
      >
        {/* Thinking icon */}
        <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="2">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>

        <span className="hidden sm:inline">Socratic</span>

        {/* Toggle switch */}
        <div
          className={`
            relative w-7 h-4 rounded-full transition-colors duration-200
            ${enabled ? 'bg-white/40' : 'bg-white/20'}
          `}
        >
          <span
            className={`
              absolute top-0.5 w-3 h-3 rounded-full transition-all duration-200
              ${enabled ? 'left-3.5 bg-white' : 'left-0.5 bg-white/60'}
            `}
          />
        </div>
      </button>

      {/* Tooltip */}
      {showTooltip && (
        <div
          className="
            absolute top-full left-1/2 -translate-x-1/2 mt-2
            w-56 p-3 rounded-lg
            bg-gray-900 text-white text-xs
            shadow-xl z-50
            animate-in fade-in slide-in-from-top-1 duration-200
          "
        >
          <p className="font-medium mb-1.5">
            {enabled ? 'Socratic Mode ON' : 'Socratic Mode'}
          </p>
          <p className="text-gray-300 leading-relaxed">
            {enabled
              ? "I'll guide you with questions to help you discover answers yourself. This builds deeper understanding!"
              : "Enable this to learn through guided questions instead of direct answers. Great for building critical thinking!"}
          </p>
          {/* Arrow */}
          <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 border-4 border-transparent border-b-gray-900" />
        </div>
      )}
    </div>
  );
}

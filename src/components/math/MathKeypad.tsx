'use client';

import { useState, useCallback } from 'react';

// Define MathfieldElement interface (avoids importing from mathlive at build time)
interface MathfieldElement extends HTMLElement {
  value: string;
  getValue(format?: string): string;
  insert(text: string, options?: { insertionMode?: string; selectionMode?: string }): void;
  executeCommand(command: string): void;
  focus(): void;
}

// Type for keypad symbol groups
export type KeypadGroupKey = 'numbers' | 'operators' | 'variables' | 'fractions' | 'powers' | 'brackets' | 'greek';

export interface MathKeypadProps {
  /** Reference to the MathLive field to insert into */
  mathFieldRef: React.RefObject<MathfieldElement | null>;
  /** Whether the keypad is visible */
  isVisible?: boolean;
  /** Callback when keypad visibility changes */
  onVisibilityChange?: (visible: boolean) => void;
  /** Which symbol groups to show */
  groups?: KeypadGroupKey[];
  /** Additional CSS classes */
  className?: string;
}

interface KeypadButton {
  label: string;
  latex: string;
  tooltip?: string;
  wide?: boolean;
}

interface KeypadGroup {
  name: string;
  buttons: KeypadButton[];
}

// Define symbol groups for Year 8 Mathematics
const KEYPAD_GROUPS: Record<string, KeypadGroup> = {
  numbers: {
    name: 'Numbers',
    buttons: [
      { label: '7', latex: '7' },
      { label: '8', latex: '8' },
      { label: '9', latex: '9' },
      { label: '4', latex: '4' },
      { label: '5', latex: '5' },
      { label: '6', latex: '6' },
      { label: '1', latex: '1' },
      { label: '2', latex: '2' },
      { label: '3', latex: '3' },
      { label: '0', latex: '0' },
      { label: '.', latex: '.' },
      { label: '=', latex: '=' },
    ],
  },
  operators: {
    name: 'Operations',
    buttons: [
      { label: '+', latex: '+' },
      { label: '-', latex: '-' },
      { label: '×', latex: '\\times', tooltip: 'Multiply' },
      { label: '÷', latex: '\\div', tooltip: 'Divide' },
      { label: '±', latex: '\\pm', tooltip: 'Plus or minus' },
      { label: '≠', latex: '\\neq', tooltip: 'Not equal' },
      { label: '<', latex: '<', tooltip: 'Less than' },
      { label: '>', latex: '>', tooltip: 'Greater than' },
      { label: '≤', latex: '\\leq', tooltip: 'Less than or equal' },
      { label: '≥', latex: '\\geq', tooltip: 'Greater than or equal' },
    ],
  },
  variables: {
    name: 'Variables',
    buttons: [
      { label: 'x', latex: 'x' },
      { label: 'y', latex: 'y' },
      { label: 'z', latex: 'z' },
      { label: 'a', latex: 'a' },
      { label: 'b', latex: 'b' },
      { label: 'c', latex: 'c' },
      { label: 'n', latex: 'n' },
      { label: 'm', latex: 'm' },
    ],
  },
  fractions: {
    name: 'Fractions',
    buttons: [
      { label: '⬚/⬚', latex: '\\frac{#@}{#?}', tooltip: 'Fraction', wide: true },
      { label: '½', latex: '\\frac{1}{2}' },
      { label: '⅓', latex: '\\frac{1}{3}' },
      { label: '¼', latex: '\\frac{1}{4}' },
      { label: '¾', latex: '\\frac{3}{4}' },
    ],
  },
  powers: {
    name: 'Powers & Roots',
    buttons: [
      { label: 'x²', latex: '#@^{2}', tooltip: 'Square' },
      { label: 'x³', latex: '#@^{3}', tooltip: 'Cube' },
      { label: 'xⁿ', latex: '#@^{#?}', tooltip: 'Power' },
      { label: '√', latex: '\\sqrt{#?}', tooltip: 'Square root' },
      { label: '∛', latex: '\\sqrt[3]{#?}', tooltip: 'Cube root' },
      { label: 'ⁿ√', latex: '\\sqrt[#?]{#?}', tooltip: 'nth root' },
    ],
  },
  brackets: {
    name: 'Brackets',
    buttons: [
      { label: '( )', latex: '(#?)' },
      { label: '[ ]', latex: '[#?]' },
      { label: '{ }', latex: '\\{#?\\}' },
      { label: '| |', latex: '|#?|', tooltip: 'Absolute value' },
    ],
  },
  greek: {
    name: 'Greek',
    buttons: [
      { label: 'π', latex: '\\pi', tooltip: 'Pi' },
      { label: 'θ', latex: '\\theta', tooltip: 'Theta' },
      { label: 'α', latex: '\\alpha', tooltip: 'Alpha' },
      { label: 'β', latex: '\\beta', tooltip: 'Beta' },
      { label: '∞', latex: '\\infty', tooltip: 'Infinity' },
    ],
  },
};

// Default groups for Year 8 algebra
const DEFAULT_GROUPS: KeypadGroupKey[] = [
  'numbers',
  'operators',
  'variables',
  'fractions',
  'powers',
  'brackets',
];

/**
 * MathKeypad - Supplementary quick-access keypad for common math symbols
 *
 * Provides large, touch-friendly buttons for:
 * - Numbers and basic operations
 * - Variables commonly used in algebra
 * - Fractions, powers, and roots
 * - Brackets and special symbols
 */
export function MathKeypad({
  mathFieldRef,
  isVisible = true,
  onVisibilityChange,
  groups = DEFAULT_GROUPS,
  className = '',
}: MathKeypadProps) {
  // Ensure we always have valid groups - use default if not provided
  const effectiveGroups: KeypadGroupKey[] = groups && groups.length > 0 ? groups : DEFAULT_GROUPS;
  const [activeGroup, setActiveGroup] = useState<KeypadGroupKey>(effectiveGroups[0]);

  // Insert LaTeX into the math field
  const handleInsert = useCallback((latex: string) => {
    const mathField = mathFieldRef.current;
    if (!mathField) return;

    // Use MathLive's insert method with smart positioning
    mathField.insert(latex, {
      insertionMode: 'replaceSelection',
      selectionMode: 'placeholder', // Move to next placeholder
    });

    // Keep focus on the math field
    mathField.focus();
  }, [mathFieldRef]);

  // Handle backspace/delete
  const handleBackspace = useCallback(() => {
    const mathField = mathFieldRef.current;
    if (!mathField) return;

    mathField.executeCommand('deleteBackward');
    mathField.focus();
  }, [mathFieldRef]);

  // Handle clear all
  const handleClear = useCallback(() => {
    const mathField = mathFieldRef.current;
    if (!mathField) return;

    mathField.value = '';
    mathField.focus();
  }, [mathFieldRef]);

  // Toggle visibility
  const toggleVisibility = useCallback(() => {
    onVisibilityChange?.(!isVisible);
  }, [isVisible, onVisibilityChange]);

  if (!isVisible) {
    return (
      <button
        onClick={toggleVisibility}
        className="w-full py-2 text-sm text-blue-600 hover:text-blue-800 flex items-center justify-center gap-2"
        aria-label="Show math keypad"
      >
        <span>Show Keypad</span>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    );
  }

  const activeGroupData = KEYPAD_GROUPS[activeGroup];

  return (
    <div className={`bg-gray-50 rounded-lg border border-gray-200 ${className}`}>
      {/* Group tabs */}
      <div className="flex overflow-x-auto border-b border-gray-200 p-1 gap-1">
        {effectiveGroups.map((groupKey) => {
          const group = KEYPAD_GROUPS[groupKey];
          if (!group) return null;
          return (
            <button
              key={groupKey}
              onClick={() => setActiveGroup(groupKey)}
              className={`
                px-3 py-1.5 text-xs font-medium rounded whitespace-nowrap transition-colors
                ${activeGroup === groupKey
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
                }
              `}
            >
              {group.name}
            </button>
          );
        })}

        {/* Hide keypad button */}
        <button
          onClick={toggleVisibility}
          className="ml-auto px-2 py-1.5 text-gray-400 hover:text-gray-600"
          aria-label="Hide keypad"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </button>
      </div>

      {/* Symbol buttons */}
      <div className="p-2">
        <div className="grid grid-cols-4 gap-1.5">
          {activeGroupData?.buttons.map((button, index) => (
            <button
              key={`${activeGroup}-${index}`}
              onClick={() => handleInsert(button.latex)}
              title={button.tooltip}
              className={`
                py-3 px-2 text-lg font-medium rounded-lg transition-all
                bg-white border border-gray-200 hover:bg-blue-50 hover:border-blue-300
                active:bg-blue-100 active:scale-95
                touch-manipulation select-none
                ${button.wide ? 'col-span-2' : ''}
              `}
            >
              {button.label}
            </button>
          ))}
        </div>

        {/* Action buttons row */}
        <div className="flex gap-2 mt-2 pt-2 border-t border-gray-200">
          <button
            onClick={handleBackspace}
            className="flex-1 py-2.5 px-4 text-sm font-medium rounded-lg
              bg-orange-100 text-orange-700 hover:bg-orange-200
              active:bg-orange-300 transition-colors touch-manipulation"
            aria-label="Delete"
          >
            ← Delete
          </button>
          <button
            onClick={handleClear}
            className="flex-1 py-2.5 px-4 text-sm font-medium rounded-lg
              bg-red-100 text-red-700 hover:bg-red-200
              active:bg-red-300 transition-colors touch-manipulation"
            aria-label="Clear all"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * CompactMathKeypad - Single-row keypad for inline use
 * Shows only the most common symbols for quick access
 */
export interface CompactMathKeypadProps {
  mathFieldRef: React.RefObject<MathfieldElement | null>;
  className?: string;
}

export function CompactMathKeypad({ mathFieldRef, className = '' }: CompactMathKeypadProps) {
  const handleInsert = useCallback((latex: string) => {
    const mathField = mathFieldRef.current;
    if (!mathField) return;
    mathField.insert(latex, {
      insertionMode: 'replaceSelection',
      selectionMode: 'placeholder',
    });
    mathField.focus();
  }, [mathFieldRef]);

  const quickSymbols = [
    { label: '⬚/⬚', latex: '\\frac{#@}{#?}', tooltip: 'Fraction' },
    { label: 'x²', latex: '#@^{2}', tooltip: 'Square' },
    { label: '√', latex: '\\sqrt{#?}', tooltip: 'Square root' },
    { label: '( )', latex: '(#?)', tooltip: 'Brackets' },
    { label: '±', latex: '\\pm', tooltip: 'Plus/minus' },
  ];

  return (
    <div className={`flex gap-1 ${className}`}>
      {quickSymbols.map((symbol, index) => (
        <button
          key={index}
          onClick={() => handleInsert(symbol.latex)}
          title={symbol.tooltip}
          className="
            w-10 h-10 flex items-center justify-center
            text-sm font-medium rounded-lg
            bg-gray-100 hover:bg-blue-100 active:bg-blue-200
            transition-colors touch-manipulation
          "
        >
          {symbol.label}
        </button>
      ))}
    </div>
  );
}

export default MathKeypad;

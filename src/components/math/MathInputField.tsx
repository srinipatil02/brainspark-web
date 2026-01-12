'use client';

import { useEffect, useRef, useCallback, useState } from 'react';

// Define MathfieldElement interface for ref typing (avoids importing from mathlive at build time)
interface MathfieldElement extends HTMLElement {
  value: string;
  getValue(format?: string): string;
  insert(text: string, options?: { insertionMode?: string; selectionMode?: string }): void;
  executeCommand(command: string): void;
  focus(): void;
}

export interface MathInputFieldProps {
  /** Current LaTeX value */
  value?: string;
  /** Callback when value changes */
  onChange?: (latex: string, plainText: string) => void;
  /** Placeholder text shown when empty */
  placeholder?: string;
  /** Whether the field is read-only */
  readOnly?: boolean;
  /** Whether the field is disabled */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Input type for styling context */
  inputType?: 'equation' | 'number' | 'expression';
  /** Autofocus on mount */
  autoFocus?: boolean;
  /** Callback when field gains focus */
  onFocus?: () => void;
  /** Callback when field loses focus */
  onBlur?: () => void;
  /** Callback when Enter is pressed */
  onSubmit?: () => void;
  /** Error state for validation feedback */
  hasError?: boolean;
  /** Label for accessibility */
  ariaLabel?: string;
}

/**
 * MathInputField - A React wrapper for MathLive's math-field element
 *
 * Provides a rich math equation editor with:
 * - LaTeX input/output
 * - Virtual keyboard for mobile
 * - Accessibility support (screen readers)
 * - Smart math formatting
 */
export function MathInputField({
  value = '',
  onChange,
  placeholder = 'Enter your answer...',
  readOnly = false,
  disabled = false,
  className = '',
  inputType = 'equation',
  autoFocus = false,
  onFocus,
  onBlur,
  onSubmit,
  hasError = false,
  ariaLabel = 'Math input field',
}: MathInputFieldProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mathFieldRef = useRef<MathfieldElement | null>(null);
  const mountedRef = useRef(true);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load MathLive and create math-field element dynamically
  useEffect(() => {
    mountedRef.current = true;
    let mathField: MathfieldElement | null = null;

    const loadMathLive = async () => {
      try {
        // Dynamic import to avoid SSR issues
        await import('mathlive');

        // Check if component is still mounted and container exists
        if (!mountedRef.current || !containerRef.current) return;

        // Check if a math-field already exists (React Strict Mode protection)
        const existingMathField = containerRef.current.querySelector('math-field');
        if (existingMathField) {
          mathFieldRef.current = existingMathField as MathfieldElement;
          setIsLoaded(true);
          return;
        }

        // Create math-field element programmatically
        mathField = document.createElement('math-field') as MathfieldElement;
        mathField.setAttribute('virtual-keyboard-mode', 'onfocus');
        mathField.setAttribute('smart-mode', 'true');
        mathField.setAttribute('smart-fence', 'true');
        mathField.setAttribute('smart-superscript', 'true');
        mathField.setAttribute('remove-extraneous-parentheses', 'true');

        if (placeholder) {
          mathField.setAttribute('placeholder', placeholder);
        }
        if (readOnly) {
          mathField.setAttribute('read-only', 'true');
        }
        if (disabled) {
          mathField.setAttribute('disabled', 'true');
        }
        if (ariaLabel) {
          mathField.setAttribute('aria-label', ariaLabel);
        }

        // Set initial value
        if (value) {
          mathField.value = value;
        }

        // Apply styles
        mathField.style.cssText = `
          width: 100%;
          min-height: 48px;
          padding: 12px;
          border-radius: 8px;
          border: 2px solid ${hasError ? '#fca5a5' : '#e5e7eb'};
          background: ${disabled ? '#f3f4f6' : hasError ? '#fef2f2' : 'white'};
          font-size: 1.125rem;
          outline: none;
          transition: all 0.2s;
          text-align: ${inputType === 'equation' ? 'center' : inputType === 'number' ? 'right' : 'left'};
          --caret-color: #3b82f6;
          --selection-background-color: #dbeafe;
          --placeholder-color: #9ca3af;
        `;

        // Add to container
        containerRef.current.appendChild(mathField);
        mathFieldRef.current = mathField;

        // Set up event listeners
        mathField.addEventListener('input', () => {
          if (onChange && mathFieldRef.current) {
            const latex = mathFieldRef.current.value;
            const plainText = mathFieldRef.current.getValue('ascii-math') || latex;
            onChange(latex, plainText);
          }
        });

        if (onFocus) {
          mathField.addEventListener('focus', onFocus);
        }
        if (onBlur) {
          mathField.addEventListener('blur', onBlur);
        }
        if (onSubmit) {
          mathField.addEventListener('keydown', (e: KeyboardEvent) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              onSubmit();
            }
          });
        }

        if (autoFocus) {
          mathField.focus();
        }

        setIsLoaded(true);
      } catch (error) {
        console.error('Failed to load MathLive:', error);
      }
    };

    loadMathLive();

    // Cleanup
    return () => {
      mountedRef.current = false;
      if (mathField && containerRef.current && containerRef.current.contains(mathField)) {
        containerRef.current.removeChild(mathField);
      }
      mathFieldRef.current = null;
    };
  }, []);  // Only run on mount

  // Update value when prop changes
  useEffect(() => {
    if (mathFieldRef.current && isLoaded && value !== mathFieldRef.current.value) {
      mathFieldRef.current.value = value;
    }
  }, [value, isLoaded]);

  // Update styles when state changes
  useEffect(() => {
    if (mathFieldRef.current) {
      mathFieldRef.current.style.borderColor = hasError ? '#fca5a5' : '#e5e7eb';
      mathFieldRef.current.style.background = disabled ? '#f3f4f6' : hasError ? '#fef2f2' : 'white';
    }
  }, [hasError, disabled]);

  // Always return the same structure - show loading overlay when not ready
  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
    >
      {!isLoaded && (
        <div className="absolute inset-0 w-full min-h-[48px] p-3 rounded-lg border-2 border-gray-200 bg-gray-50 flex items-center justify-center z-10">
          <span className="text-gray-400">Loading math input...</span>
        </div>
      )}
    </div>
  );
}

/**
 * MathDisplay - Read-only math rendering component
 * Uses MathLive for consistent rendering with input fields
 */
export interface MathDisplayProps {
  /** LaTeX string to render */
  latex: string;
  /** Additional CSS classes */
  className?: string;
  /** Display mode: inline or block */
  display?: 'inline' | 'block';
}

export function MathDisplay({ latex, className = '', display = 'inline' }: MathDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let mathField: MathfieldElement | null = null;

    const loadMathLive = async () => {
      try {
        await import('mathlive');

        if (!containerRef.current) return;

        mathField = document.createElement('math-field') as MathfieldElement;
        mathField.setAttribute('read-only', 'true');
        mathField.value = latex;

        mathField.style.cssText = `
          display: ${display === 'block' ? 'block' : 'inline-block'};
          text-align: ${display === 'block' ? 'center' : 'inherit'};
          border: none;
          background: transparent;
          padding: 0;
          min-height: auto;
        `;

        containerRef.current.appendChild(mathField);
        setIsLoaded(true);
      } catch (error) {
        console.error('Failed to load MathLive:', error);
      }
    };

    loadMathLive();

    return () => {
      if (mathField && containerRef.current) {
        containerRef.current.removeChild(mathField);
      }
    };
  }, []);

  useEffect(() => {
    if (containerRef.current && isLoaded) {
      const mathField = containerRef.current.querySelector('math-field') as MathfieldElement;
      if (mathField) {
        mathField.value = latex;
      }
    }
  }, [latex, isLoaded]);

  if (!isLoaded) {
    return <span className={className}>{latex}</span>;
  }

  return (
    <div
      ref={containerRef}
      className={`${display === 'block' ? 'block text-center my-2' : 'inline-block align-middle'} ${className}`}
    />
  );
}

export default MathInputField;

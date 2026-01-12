'use client';

import React, { useMemo, useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import mermaid from 'mermaid';
import 'katex/dist/katex.min.css';

// Initialize mermaid with default config
mermaid.initialize({
  startOnLoad: false,
  theme: 'neutral',
  securityLevel: 'loose',
  fontFamily: 'inherit',
});

interface QuestionRendererProps {
  content: string;
  className?: string;
}

/**
 * MermaidDiagram - Renders a mermaid diagram from text
 */
function MermaidDiagram({ chart }: { chart: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const renderDiagram = async () => {
      if (!containerRef.current) return;

      try {
        // Generate unique ID for this diagram
        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
        const { svg } = await mermaid.render(id, chart.trim());
        setSvg(svg);
        setError(null);
      } catch (err) {
        console.error('Mermaid rendering error:', err);
        setError(err instanceof Error ? err.message : 'Failed to render diagram');
      }
    };

    renderDiagram();
  }, [chart]);

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 my-4">
        <p className="text-red-600 dark:text-red-400 text-sm font-medium">Diagram Error</p>
        <pre className="text-xs text-red-500 mt-2 overflow-x-auto">{error}</pre>
        <details className="mt-2">
          <summary className="text-xs text-slate-500 cursor-pointer">Show diagram code</summary>
          <pre className="text-xs bg-slate-100 dark:bg-slate-800 p-2 rounded mt-1 overflow-x-auto">
            {chart}
          </pre>
        </details>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="mermaid-diagram my-4 flex justify-center overflow-x-auto"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

/**
 * QuestionRenderer - Renders educational content with rich formatting support
 *
 * Supports:
 * - Markdown (headers, bold, italic, lists, links)
 * - LaTeX equations (inline $...$ and block $$...$$)
 * - GitHub Flavored Markdown tables
 * - Mermaid diagrams (```mermaid code blocks)
 * - Code blocks with syntax highlighting
 */
export function QuestionRenderer({ content, className = '' }: QuestionRendererProps) {
  // Memoize the rendered content to avoid unnecessary re-renders
  const processedContent = useMemo(() => {
    // Pre-process content to handle common formatting issues
    let processed = content;

    // Ensure block equations have proper spacing
    // Using [\s\S] instead of 's' flag for broader compatibility
    processed = processed.replace(/\$\$([\s\S]*?)\$\$/g, '\n\n$$$1$$\n\n');

    return processed;
  }, [content]);

  return (
    <div className={`question-renderer prose prose-slate dark:prose-invert max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkGfm]}
        rehypePlugins={[rehypeKatex]}
        components={{
          // Custom table styling for better mobile display
          table: ({ children }) => (
            <div className="overflow-x-auto my-4">
              <table className="min-w-full border-collapse border border-slate-300 dark:border-slate-600">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-slate-100 dark:bg-slate-700">
              {children}
            </thead>
          ),
          th: ({ children }) => (
            <th className="px-4 py-2 text-left font-semibold border border-slate-300 dark:border-slate-600">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-4 py-2 border border-slate-300 dark:border-slate-600">
              {children}
            </td>
          ),
          // Custom pre block to handle mermaid
          pre: ({ children }) => {
            return <>{children}</>;
          },
          // Custom code block styling with Mermaid support
          code: ({ className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';
            const codeContent = String(children).replace(/\n$/, '');

            // Handle mermaid diagrams
            if (language === 'mermaid') {
              return <MermaidDiagram chart={codeContent} />;
            }

            // Inline code (no language class)
            const isInline = !className;
            if (isInline) {
              return (
                <code
                  className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-sm font-mono"
                  {...props}
                >
                  {children}
                </code>
              );
            }

            // Block code with language
            return (
              <div className="relative my-4">
                {language && (
                  <div className="absolute top-0 right-0 px-2 py-1 text-xs text-slate-500 dark:text-slate-400 bg-slate-200 dark:bg-slate-700 rounded-bl">
                    {language}
                  </div>
                )}
                <pre className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg overflow-x-auto">
                  <code className={`text-sm font-mono ${className}`} {...props}>
                    {children}
                  </code>
                </pre>
              </div>
            );
          },
          // Custom paragraph styling
          p: ({ children }) => (
            <p className="my-3 leading-relaxed">
              {children}
            </p>
          ),
          // Custom list styling
          ul: ({ children }) => (
            <ul className="my-3 ml-6 list-disc space-y-1">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="my-3 ml-6 list-decimal space-y-1">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="leading-relaxed">
              {children}
            </li>
          ),
          // Custom strong/bold styling
          strong: ({ children }) => (
            <strong className="font-semibold text-slate-900 dark:text-white">
              {children}
            </strong>
          ),
          // Custom blockquote for hints or important notes
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-blue-500 pl-4 my-4 italic text-slate-600 dark:text-slate-400">
              {children}
            </blockquote>
          ),
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
}

/**
 * QuestionStem - Specifically styled for question stems
 */
export function QuestionStem({ content, className = '' }: QuestionRendererProps) {
  return (
    <QuestionRenderer
      content={content}
      className={`text-lg ${className}`}
    />
  );
}

/**
 * SolutionRenderer - Specifically styled for solutions/explanations
 */
export function SolutionRenderer({ content, className = '' }: QuestionRendererProps) {
  return (
    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
      <QuestionRenderer
        content={content}
        className={`text-base ${className}`}
      />
    </div>
  );
}

/**
 * HintRenderer - Specifically styled for hints
 */
interface HintRendererProps {
  content: string;
  level: number;
  className?: string;
}

export function HintRenderer({ content, level, className = '' }: HintRendererProps) {
  const levelColors = {
    1: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    2: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
    3: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
  };

  const colorClass = levelColors[level as keyof typeof levelColors] || levelColors[1];

  return (
    <div className={`border rounded-lg p-3 ${colorClass} ${className}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
          💡 Hint {level}
        </span>
      </div>
      <QuestionRenderer content={content} className="text-sm" />
    </div>
  );
}

/**
 * FeedbackRenderer - For MCQ option feedback
 */
interface FeedbackRendererProps {
  content: string;
  isCorrect: boolean;
  className?: string;
}

export function FeedbackRenderer({ content, isCorrect, className = '' }: FeedbackRendererProps) {
  const colorClass = isCorrect
    ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700 text-green-800 dark:text-green-200'
    : 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700 text-red-800 dark:text-red-200';

  return (
    <div className={`border rounded-lg p-3 ${colorClass} ${className}`}>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-sm font-medium">
          {isCorrect ? '✓ Correct!' : '✗ Not quite'}
        </span>
      </div>
      <QuestionRenderer content={content} className="text-sm" />
    </div>
  );
}

export default QuestionRenderer;

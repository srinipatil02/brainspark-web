// =============================================================================
// QUESTION IMAGE COMPONENT
// =============================================================================
// FILE: src/components/shared/QuestionImage.tsx
// DOMAIN: Shared infrastructure
// PURPOSE: Render images, SVGs, and diagrams for questions
// USED BY: QuestionRenderer in both Curriculum and NSW Selective

'use client';

import Image from 'next/image';
import { useState } from 'react';

interface QuestionImageProps {
  imageUrl?: string;
  imageAlt?: string;
  svgContent?: string;
  className?: string;
  priority?: boolean;
}

/**
 * QuestionImage component for rendering visual content in questions
 *
 * Supports:
 * - Firebase Storage URLs (imageUrl)
 * - Inline SVG content (svgContent)
 * - Responsive sizing
 * - Loading states
 * - Error handling
 */
export function QuestionImage({
  imageUrl,
  imageAlt = 'Question diagram',
  svgContent,
  className = '',
  priority = false,
}: QuestionImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Render inline SVG
  if (svgContent) {
    return (
      <div
        className={`question-image-container ${className}`}
        dangerouslySetInnerHTML={{ __html: svgContent }}
        aria-label={imageAlt}
        role="img"
      />
    );
  }

  // Render image from URL
  if (imageUrl) {
    // Check if it's an external URL or Firebase Storage URL
    const isExternalUrl = imageUrl.startsWith('http://') || imageUrl.startsWith('https://');

    if (hasError) {
      return (
        <div
          className={`question-image-error flex items-center justify-center bg-gray-100 rounded-lg p-4 ${className}`}
          role="alert"
        >
          <div className="text-center text-gray-500">
            <svg
              className="w-12 h-12 mx-auto mb-2 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="text-sm">Failed to load diagram</p>
          </div>
        </div>
      );
    }

    return (
      <div className={`question-image-container relative ${className}`}>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="animate-pulse">
              <div className="w-48 h-32 bg-gray-200 rounded" />
            </div>
          </div>
        )}
        {isExternalUrl ? (
          // Use regular img for external URLs (Next.js Image requires configuration for external domains)
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={imageAlt}
            className={`max-w-full h-auto rounded-lg ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              setHasError(true);
            }}
          />
        ) : (
          // Use Next.js Image for internal images (Firebase Storage should be configured)
          <Image
            src={imageUrl}
            alt={imageAlt}
            width={400}
            height={300}
            className={`max-w-full h-auto rounded-lg ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
            onLoadingComplete={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              setHasError(true);
            }}
            priority={priority}
            unoptimized // For Firebase Storage URLs
          />
        )}
      </div>
    );
  }

  // No image content provided
  return null;
}

// =============================================================================
// PLACEHOLDER COMPONENT FOR MISSING DIAGRAMS
// =============================================================================

interface DiagramPlaceholderProps {
  type: 'geometry' | 'graph' | 'table' | 'diagram';
  message?: string;
  className?: string;
}

/**
 * Placeholder shown when a diagram is referenced but not yet available
 */
export function DiagramPlaceholder({
  type,
  message = 'Diagram not available',
  className = '',
}: DiagramPlaceholderProps) {
  const icons: Record<string, React.ReactNode> = {
    geometry: (
      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21l10-18M3 21h18" />
      </svg>
    ),
    graph: (
      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      </svg>
    ),
    table: (
      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
        />
      </svg>
    ),
    diagram: (
      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
    ),
  };

  return (
    <div
      className={`flex flex-col items-center justify-center p-6 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg text-gray-400 ${className}`}
    >
      {icons[type] || icons.diagram}
      <p className="mt-2 text-sm">{message}</p>
    </div>
  );
}

// =============================================================================
// STYLES (add to globals.css if needed)
// =============================================================================

/*
.question-image-container {
  @apply my-4;
}

.question-image-container svg {
  @apply max-w-full h-auto;
}
*/

export default QuestionImage;

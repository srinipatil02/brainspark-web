// =============================================================================
// QUESTION VISUAL COMPONENT
// =============================================================================
// FILE: src/components/shared/QuestionVisual.tsx
// DOMAIN: Shared infrastructure
// PURPOSE: Unified visual content rendering for questions
// USED BY: ArchetypePlayer, SetPlayerClient for visual questions

'use client';

import { FirestoreQuestion, hasVisualContent, GeometryConfig, ChartConfig } from '@/types';
import { QuestionImage, DiagramPlaceholder } from './QuestionImage';
import { ChartRenderer } from './ChartRenderer';
import dynamic from 'next/dynamic';

// Dynamically import GeometryDiagram to avoid SSR issues with Mafs
const GeometryDiagram = dynamic(
  () => import('./GeometryDiagram').then(mod => mod.GeometryDiagram),
  { ssr: false, loading: () => <DiagramPlaceholder type="geometry" message="Loading diagram..." /> }
);

// Dynamically import archetype-specific diagrams
const CubeDiagram = dynamic(
  () => import('./GeometryDiagram').then(mod => mod.CubeDiagram),
  { ssr: false }
);
const VennDiagram = dynamic(
  () => import('./GeometryDiagram').then(mod => mod.VennDiagram),
  { ssr: false }
);
const PaintedCubeGrid = dynamic(
  () => import('./GeometryDiagram').then(mod => mod.PaintedCubeGrid),
  { ssr: false }
);
const ShadedRegion = dynamic(
  () => import('./GeometryDiagram').then(mod => mod.ShadedRegion),
  { ssr: false }
);

interface QuestionVisualProps {
  question: FirestoreQuestion;
  className?: string;
}

/**
 * QuestionVisual - Renders all visual content for a question
 *
 * Priority order:
 * 1. svgContent (inline SVG)
 * 2. imageUrl (static image)
 * 3. geometryConfig (programmatic Mafs rendering)
 * 4. chartConfig (Recharts visualization)
 *
 * For NSW Selective archetypes, may auto-generate diagrams based on question content.
 */
export function QuestionVisual({ question, className = '' }: QuestionVisualProps) {
  // Check if question has any visual content
  if (!hasVisualContent(question)) {
    return null;
  }

  return (
    <div className={`question-visual my-4 flex justify-center ${className}`}>
      {/* 1. Inline SVG content */}
      {question.svgContent && (
        <QuestionImage svgContent={question.svgContent} imageAlt={question.stem} />
      )}

      {/* 2. Static image URL */}
      {question.imageUrl && !question.svgContent && (
        <QuestionImage imageUrl={question.imageUrl} imageAlt={question.imageAlt || question.stem} />
      )}

      {/* 3. Programmatic geometry */}
      {question.geometryConfig && !question.svgContent && !question.imageUrl && (
        <GeometryDiagram config={question.geometryConfig} />
      )}

      {/* 4. Chart visualization */}
      {question.chartConfig && !question.svgContent && !question.imageUrl && !question.geometryConfig && (
        <ChartRenderer config={question.chartConfig} />
      )}
    </div>
  );
}

// =============================================================================
// ARCHETYPE-SPECIFIC VISUAL RENDERERS
// =============================================================================

interface ArchetypeVisualProps {
  question: FirestoreQuestion;
  className?: string;
}

/**
 * Renders visual content for qa3 (3D Shape Properties)
 * Auto-generates cube/prism diagrams based on question content
 */
export function Qa3Visual({ question, className = '' }: ArchetypeVisualProps) {
  // If question has explicit visual, use that
  if (hasVisualContent(question)) {
    return <QuestionVisual question={question} className={className} />;
  }

  // Auto-generate cube diagram for 3D shape questions
  const stem = question.stem.toLowerCase();
  const showLabels = stem.includes('vertex') || stem.includes('edge') || stem.includes('face');

  return (
    <div className={`question-visual my-4 flex justify-center ${className}`}>
      <CubeDiagram size={200} showLabels={showLabels} />
    </div>
  );
}

/**
 * Renders visual content for qa7 (Venn Diagram Area Problem)
 * Parses question stem for set values
 */
export function Qa7Visual({ question, className = '' }: ArchetypeVisualProps) {
  if (hasVisualContent(question)) {
    return <QuestionVisual question={question} className={className} />;
  }

  // Parse question for Venn diagram values
  const extractVennValues = (stem: string) => {
    // Look for patterns like "Set A has 15 members" or "A only: 15"
    const patterns = {
      setAOnly: /(?:set\s*a\s*only|a\s*only|only\s*a)[:\s]*(\d+)/i,
      setBOnly: /(?:set\s*b\s*only|b\s*only|only\s*b)[:\s]*(\d+)/i,
      intersection: /(?:both|intersection|a\s*and\s*b|a\s*∩\s*b)[:\s]*(\d+)/i,
      outside: /(?:neither|outside|not\s*in)[:\s]*(\d+)/i,
    };

    return {
      setAOnly: stem.match(patterns.setAOnly)?.[1] || '',
      setBOnly: stem.match(patterns.setBOnly)?.[1] || '',
      intersection: stem.match(patterns.intersection)?.[1] || '',
      outside: stem.match(patterns.outside)?.[1] || '',
    };
  };

  const values = extractVennValues(question.stem);

  return (
    <div className={`question-visual my-4 flex justify-center ${className}`}>
      <VennDiagram
        size={280}
        setALabel="A"
        setBLabel="B"
        setAOnly={values.setAOnly}
        setBOnly={values.setBOnly}
        intersection={values.intersection}
        outside={values.outside}
      />
    </div>
  );
}

/**
 * Renders visual content for qa14 (Painted Cubes)
 * Generates cube grid based on dimensions mentioned
 */
export function Qa14Visual({ question, className = '' }: ArchetypeVisualProps) {
  if (hasVisualContent(question)) {
    return <QuestionVisual question={question} className={className} />;
  }

  // Parse for grid size (e.g., "3 × 3 × 3", "4x4x4")
  const sizeMatch = question.stem.match(/(\d)\s*[×x]\s*\1\s*[×x]\s*\1/i);
  const gridSize = sizeMatch ? parseInt(sizeMatch[1]) : 3;

  return (
    <div className={`question-visual my-4 flex justify-center ${className}`}>
      <PaintedCubeGrid gridSize={gridSize} size={250} />
    </div>
  );
}

/**
 * Renders visual content for qa19 (Shaded Region Area)
 * Generates shaded region diagram based on dimensions
 */
export function Qa19Visual({ question, className = '' }: ArchetypeVisualProps) {
  if (hasVisualContent(question)) {
    return <QuestionVisual question={question} className={className} />;
  }

  // Parse dimensions from stem
  const dimensionPatterns = {
    rectangle: /rectangle[^.]*?(\d+)\s*(?:cm|m)?\s*(?:by|×|x)\s*(\d+)/i,
    circle: /circle[^.]*?radius[^.]*?(\d+)/i,
    square: /square[^.]*?side[^.]*?(\d+)/i,
  };

  const rectMatch = question.stem.match(dimensionPatterns.rectangle);
  const circleMatch = question.stem.match(dimensionPatterns.circle);

  const outerDimensions = rectMatch
    ? { width: parseInt(rectMatch[1]), height: parseInt(rectMatch[2]) }
    : { width: 10, height: 8 };

  const innerRadius = circleMatch ? parseInt(circleMatch[1]) : 3;

  return (
    <div className={`question-visual my-4 flex justify-center ${className}`}>
      <ShadedRegion
        shape="rectangle"
        outerDimensions={outerDimensions}
        innerShape="circle"
        innerDimensions={{ radius: innerRadius }}
        size={280}
        showDimensions={true}
      />
    </div>
  );
}

/**
 * Smart visual renderer that selects the appropriate diagram based on archetype
 */
export function ArchetypeVisual({ question, className = '' }: ArchetypeVisualProps) {
  const archetypeId = question.nswSelective?.archetypeId;

  // First check if question has explicit visual content
  if (hasVisualContent(question)) {
    return <QuestionVisual question={question} className={className} />;
  }

  // Auto-generate based on archetype
  switch (archetypeId) {
    case 'qa3':
      return <Qa3Visual question={question} className={className} />;
    case 'qa7':
      return <Qa7Visual question={question} className={className} />;
    case 'qa14':
      return <Qa14Visual question={question} className={className} />;
    case 'qa19':
      return <Qa19Visual question={question} className={className} />;
    default:
      return null;
  }
}

export default QuestionVisual;

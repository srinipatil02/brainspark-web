// =============================================================================
// GEOMETRY DIAGRAM COMPONENT
// =============================================================================
// FILE: src/components/shared/GeometryDiagram.tsx
// DOMAIN: Shared infrastructure
// PURPOSE: Render programmatic geometry diagrams using Mafs and custom SVG
// USED BY: QuestionImage, ArchetypePlayer for visual questions

'use client';

import { Mafs, Coordinates, Point, Line, Circle, Polygon, Text, Plot, Theme } from 'mafs';
import 'mafs/core.css';
import { GeometryConfig, GeometryElement } from '@/types';

interface GeometryDiagramProps {
  config: GeometryConfig;
  className?: string;
  width?: number;
  height?: number;
}

/**
 * GeometryDiagram - Renders coordinate geometry using Mafs
 *
 * Supports:
 * - Points with labels
 * - Lines and segments
 * - Circles
 * - Polygons
 * - Function plots
 * - Custom view boxes
 */
export function GeometryDiagram({
  config,
  className = '',
  width = 400,
  height = 300,
}: GeometryDiagramProps) {
  const { elements, viewBox, showGrid = true, showAxes = true } = config;

  // Build a map of point IDs to coordinates for reference
  const pointMap: Record<string, [number, number]> = {};
  elements.forEach(el => {
    if (el.type === 'point' && el.coords) {
      pointMap[el.id] = el.coords;
    }
  });

  // Helper to get coordinates by ID or direct coords
  const getCoords = (id: string): [number, number] => {
    return pointMap[id] || [0, 0];
  };

  // Calculate view box
  const xMin = viewBox?.xMin ?? -5;
  const xMax = viewBox?.xMax ?? 5;
  const yMin = viewBox?.yMin ?? -5;
  const yMax = viewBox?.yMax ?? 5;

  return (
    <div className={`geometry-diagram ${className}`} style={{ width, height }}>
      <Mafs
        viewBox={{ x: [xMin, xMax], y: [yMin, yMax] }}
        preserveAspectRatio={false}
      >
        {/* Cartesian coordinates include grid when subdivisions > 0 */}
        {(showGrid || showAxes) && <Coordinates.Cartesian subdivisions={showGrid ? 2 : 0} />}

        {elements.map((element) => {
          switch (element.type) {
            case 'point':
              return element.coords ? (
                <Point
                  key={element.id}
                  x={element.coords[0]}
                  y={element.coords[1]}
                  color={element.color || Theme.foreground}
                />
              ) : null;

            case 'line':
              // Line through two points
              if (element.points && element.points.length >= 2) {
                const p1 = getCoords(element.points[0]);
                const p2 = getCoords(element.points[1]);
                return (
                  <Line.Segment
                    key={element.id}
                    point1={p1}
                    point2={p2}
                    color={element.color || Theme.foreground}
                  />
                );
              }
              return null;

            case 'segment':
              if (element.points && element.points.length >= 2) {
                const p1 = getCoords(element.points[0]);
                const p2 = getCoords(element.points[1]);
                return (
                  <Line.Segment
                    key={element.id}
                    point1={p1}
                    point2={p2}
                    color={element.color || Theme.foreground}
                  />
                );
              }
              return null;

            case 'circle':
              if (element.center && element.radius) {
                return (
                  <Circle
                    key={element.id}
                    center={element.center}
                    radius={element.radius}
                    color={element.color || Theme.foreground}
                  />
                );
              }
              return null;

            case 'polygon':
              if (element.points && element.points.length >= 3) {
                const points = element.points.map(id => getCoords(id));
                return (
                  <Polygon
                    key={element.id}
                    points={points}
                    color={element.color || Theme.foreground}
                  />
                );
              }
              return null;

            case 'label':
              if (element.coords && element.label) {
                return (
                  <Text
                    key={element.id}
                    x={element.coords[0]}
                    y={element.coords[1]}
                    color={element.color || Theme.foreground}
                  >
                    {element.label}
                  </Text>
                );
              }
              return null;

            case 'function':
              if (element.expression) {
                // Parse simple expressions
                // For more complex expressions, consider using mathjs
                try {
                  const fn = createFunction(element.expression);
                  return (
                    <Plot.OfX
                      key={element.id}
                      y={fn}
                      color={element.color || Theme.blue}
                    />
                  );
                } catch {
                  console.error(`Failed to parse function: ${element.expression}`);
                  return null;
                }
              }
              return null;

            default:
              return null;
          }
        })}

        {/* Render labels for points */}
        {elements
          .filter(el => el.type === 'point' && el.showLabel !== false && el.label)
          .map(el => (
            <Text
              key={`label-${el.id}`}
              x={(el.coords?.[0] ?? 0) + 0.3}
              y={(el.coords?.[1] ?? 0) + 0.3}
              color={el.color || Theme.foreground}
            >
              {el.label}
            </Text>
          ))}
      </Mafs>
    </div>
  );
}

/**
 * Create a function from a simple expression string
 * Supports: x, x^2, x^3, sin(x), cos(x), sqrt(x)
 */
function createFunction(expression: string): (x: number) => number {
  // Sanitize and parse simple expressions
  const sanitized = expression
    .replace(/\^/g, '**')
    .replace(/sin/g, 'Math.sin')
    .replace(/cos/g, 'Math.cos')
    .replace(/tan/g, 'Math.tan')
    .replace(/sqrt/g, 'Math.sqrt')
    .replace(/abs/g, 'Math.abs')
    .replace(/pi/gi, 'Math.PI')
    .replace(/e(?![a-z])/gi, 'Math.E');

  // Create function - note: this is safe because we control the input
  // eslint-disable-next-line no-new-func
  return new Function('x', `return ${sanitized}`) as (x: number) => number;
}

// =============================================================================
// PRE-BUILT DIAGRAM COMPONENTS FOR NSW SELECTIVE ARCHETYPES
// =============================================================================

/**
 * 3D Cube diagram for qa3 (3D Shape Properties) and qa14 (Painted Cubes)
 */
type CubeFace = 'front' | 'back' | 'top' | 'bottom' | 'left' | 'right';

interface CubeDiagramProps {
  size?: number;
  showEdges?: boolean;
  showLabels?: boolean;
  paintedFaces?: CubeFace[];
  className?: string;
}

export function CubeDiagram({
  size = 200,
  showEdges = true,
  showLabels = true,
  paintedFaces = [],
  className = '',
}: CubeDiagramProps) {
  // Isometric projection angles
  const angle = Math.PI / 6; // 30 degrees
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  // Cube vertices in 3D, projected to 2D isometric
  const project = (x: number, y: number, z: number): [number, number] => {
    const isoX = (x - z) * cos;
    const isoY = (x + z) * sin - y;
    return [isoX * 50 + size / 2, isoY * 50 + size / 2];
  };

  // Cube vertices
  const vertices = {
    A: project(0, 0, 0),
    B: project(1, 0, 0),
    C: project(1, 0, 1),
    D: project(0, 0, 1),
    E: project(0, 1, 0),
    F: project(1, 1, 0),
    G: project(1, 1, 1),
    H: project(0, 1, 1),
  };

  // Face colors
  const getFaceColor = (face: CubeFace) => {
    if (paintedFaces.includes(face)) {
      return '#ef4444'; // red for painted
    }
    return '#e2e8f0'; // gray for unpainted
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={`cube-diagram ${className}`}
    >
      {/* Back faces (hidden lines) */}
      {showEdges && (
        <g stroke="#94a3b8" strokeWidth="1" strokeDasharray="4,4" fill="none">
          <line x1={vertices.A[0]} y1={vertices.A[1]} x2={vertices.D[0]} y2={vertices.D[1]} />
          <line x1={vertices.A[0]} y1={vertices.A[1]} x2={vertices.E[0]} y2={vertices.E[1]} />
          <line x1={vertices.D[0]} y1={vertices.D[1]} x2={vertices.H[0]} y2={vertices.H[1]} />
        </g>
      )}

      {/* Visible faces */}
      {/* Top face */}
      <polygon
        points={`${vertices.E[0]},${vertices.E[1]} ${vertices.F[0]},${vertices.F[1]} ${vertices.G[0]},${vertices.G[1]} ${vertices.H[0]},${vertices.H[1]}`}
        fill={getFaceColor('top')}
        stroke="#475569"
        strokeWidth="2"
      />
      {/* Front face */}
      <polygon
        points={`${vertices.B[0]},${vertices.B[1]} ${vertices.C[0]},${vertices.C[1]} ${vertices.G[0]},${vertices.G[1]} ${vertices.F[0]},${vertices.F[1]}`}
        fill={getFaceColor('front')}
        stroke="#475569"
        strokeWidth="2"
      />
      {/* Right face */}
      <polygon
        points={`${vertices.C[0]},${vertices.C[1]} ${vertices.D[0]},${vertices.D[1]} ${vertices.H[0]},${vertices.H[1]} ${vertices.G[0]},${vertices.G[1]}`}
        fill={getFaceColor('right')}
        stroke="#475569"
        strokeWidth="2"
      />

      {/* Labels */}
      {showLabels && (
        <g fill="#1e293b" fontSize="12" fontWeight="500">
          <text x={vertices.B[0] + 5} y={vertices.B[1] + 15}>A</text>
          <text x={vertices.C[0] + 5} y={vertices.C[1] + 15}>B</text>
          <text x={vertices.F[0] + 5} y={vertices.F[1] - 5}>C</text>
          <text x={vertices.G[0] + 5} y={vertices.G[1] - 5}>D</text>
        </g>
      )}
    </svg>
  );
}

/**
 * Venn Diagram for qa7 (Venn Diagram Area Problem)
 */
interface VennDiagramProps {
  size?: number;
  setALabel?: string;
  setBLabel?: string;
  setAOnly?: number | string;
  setBOnly?: number | string;
  intersection?: number | string;
  outside?: number | string;
  highlightRegion?: 'A' | 'B' | 'intersection' | 'outside' | 'none';
  className?: string;
}

export function VennDiagram({
  size = 300,
  setALabel = 'A',
  setBLabel = 'B',
  setAOnly = '',
  setBOnly = '',
  intersection = '',
  outside = '',
  highlightRegion = 'none',
  className = '',
}: VennDiagramProps) {
  const cx1 = size * 0.38; // Center of circle A
  const cx2 = size * 0.62; // Center of circle B
  const cy = size * 0.5;
  const r = size * 0.28;

  const getOpacity = (region: string) => {
    if (highlightRegion === 'none') return 0.3;
    return region === highlightRegion ? 0.6 : 0.15;
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={`venn-diagram ${className}`}
    >
      {/* Background rectangle for "outside" */}
      <rect
        x="10"
        y="10"
        width={size - 20}
        height={size - 20}
        fill="#f1f5f9"
        stroke="#94a3b8"
        strokeWidth="1"
        rx="8"
      />

      {/* Circle A */}
      <circle
        cx={cx1}
        cy={cy}
        r={r}
        fill="#3b82f6"
        fillOpacity={getOpacity('A')}
        stroke="#2563eb"
        strokeWidth="2"
      />

      {/* Circle B */}
      <circle
        cx={cx2}
        cy={cy}
        r={r}
        fill="#22c55e"
        fillOpacity={getOpacity('B')}
        stroke="#16a34a"
        strokeWidth="2"
      />

      {/* Intersection highlight */}
      {highlightRegion === 'intersection' && (
        <clipPath id="clipA">
          <circle cx={cx1} cy={cy} r={r} />
        </clipPath>
      )}

      {/* Labels */}
      <g fill="#1e293b" fontSize="14" fontWeight="600" textAnchor="middle">
        <text x={cx1 - r * 0.5} y={cy}>{setAOnly}</text>
        <text x={(cx1 + cx2) / 2} y={cy}>{intersection}</text>
        <text x={cx2 + r * 0.5} y={cy}>{setBOnly}</text>
        <text x={size / 2} y={size - 25}>{outside && `Outside: ${outside}`}</text>
      </g>

      {/* Set labels */}
      <g fill="#1e293b" fontSize="16" fontWeight="700" textAnchor="middle">
        <text x={cx1} y={cy - r - 10}>{setALabel}</text>
        <text x={cx2} y={cy - r - 10}>{setBLabel}</text>
      </g>

      {/* Universal set label */}
      <text x="25" y="30" fill="#64748b" fontSize="14" fontWeight="500">U</text>
    </svg>
  );
}

/**
 * Painted Cube Grid for qa14
 * Shows a larger cube made of unit cubes
 */
interface PaintedCubeGridProps {
  gridSize?: number; // 2x2x2, 3x3x3, etc.
  size?: number;
  highlightPosition?: [number, number, number];
  className?: string;
}

export function PaintedCubeGrid({
  gridSize = 3,
  size = 250,
  highlightPosition,
  className = '',
}: PaintedCubeGridProps) {
  const angle = Math.PI / 6;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const cubeSize = size / (gridSize * 2.5);

  const project = (x: number, y: number, z: number): [number, number] => {
    const isoX = (x - z) * cos * cubeSize;
    const isoY = ((x + z) * sin - y) * cubeSize;
    return [isoX + size / 2, isoY + size * 0.6];
  };

  // Generate visible unit cubes (only front-facing visible ones)
  const cubes: { x: number; y: number; z: number; faces: number }[] = [];
  for (let x = 0; x < gridSize; x++) {
    for (let y = 0; y < gridSize; y++) {
      for (let z = 0; z < gridSize; z++) {
        // Count painted faces
        let paintedFaces = 0;
        if (x === 0) paintedFaces++;
        if (x === gridSize - 1) paintedFaces++;
        if (y === 0) paintedFaces++;
        if (y === gridSize - 1) paintedFaces++;
        if (z === 0) paintedFaces++;
        if (z === gridSize - 1) paintedFaces++;

        cubes.push({ x, y, z, faces: paintedFaces });
      }
    }
  }

  // Sort cubes for proper rendering (back to front)
  cubes.sort((a, b) => (a.x + a.z) - (b.x + b.z));

  const renderUnitCube = (x: number, y: number, z: number, faces: number, index: number) => {
    const v = {
      A: project(x, y, z),
      B: project(x + 1, y, z),
      C: project(x + 1, y, z + 1),
      D: project(x, y, z + 1),
      E: project(x, y + 1, z),
      F: project(x + 1, y + 1, z),
      G: project(x + 1, y + 1, z + 1),
      H: project(x, y + 1, z + 1),
    };

    const isHighlighted = highlightPosition &&
      x === highlightPosition[0] &&
      y === highlightPosition[1] &&
      z === highlightPosition[2];

    // Color based on painted faces
    const colors = ['#f1f5f9', '#dbeafe', '#bfdbfe', '#93c5fd', '#60a5fa', '#3b82f6', '#2563eb'];
    const fillColor = isHighlighted ? '#fbbf24' : colors[Math.min(faces, 6)];

    return (
      <g key={`cube-${index}`}>
        {/* Top face */}
        <polygon
          points={`${v.E[0]},${v.E[1]} ${v.F[0]},${v.F[1]} ${v.G[0]},${v.G[1]} ${v.H[0]},${v.H[1]}`}
          fill={fillColor}
          stroke="#475569"
          strokeWidth="0.5"
        />
        {/* Front face */}
        <polygon
          points={`${v.B[0]},${v.B[1]} ${v.C[0]},${v.C[1]} ${v.G[0]},${v.G[1]} ${v.F[0]},${v.F[1]}`}
          fill={fillColor}
          stroke="#475569"
          strokeWidth="0.5"
          fillOpacity="0.9"
        />
        {/* Right face */}
        <polygon
          points={`${v.C[0]},${v.C[1]} ${v.D[0]},${v.D[1]} ${v.H[0]},${v.H[1]} ${v.G[0]},${v.G[1]}`}
          fill={fillColor}
          stroke="#475569"
          strokeWidth="0.5"
          fillOpacity="0.8"
        />
      </g>
    );
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={`painted-cube-grid ${className}`}
    >
      {cubes.map((cube, i) => renderUnitCube(cube.x, cube.y, cube.z, cube.faces, i))}

      {/* Legend */}
      <g transform={`translate(10, ${size - 60})`}>
        <text fontSize="10" fill="#64748b" fontWeight="500">Painted faces:</text>
        {[0, 1, 2, 3].map((n, i) => (
          <g key={n} transform={`translate(${i * 40}, 15)`}>
            <rect width="12" height="12" fill={['#f1f5f9', '#bfdbfe', '#93c5fd', '#3b82f6'][n]} stroke="#475569" strokeWidth="0.5" />
            <text x="16" y="10" fontSize="10" fill="#64748b">{n}</text>
          </g>
        ))}
      </g>
    </svg>
  );
}

/**
 * Shaded Region diagram for qa19
 */
interface ShadedRegionProps {
  shape: 'rectangle' | 'circle' | 'triangle' | 'composite';
  outerDimensions?: { width: number; height: number };
  innerShape?: 'rectangle' | 'circle' | 'triangle';
  innerDimensions?: { width?: number; height?: number; radius?: number };
  size?: number;
  showDimensions?: boolean;
  className?: string;
}

export function ShadedRegion({
  shape,
  outerDimensions = { width: 8, height: 6 },
  innerShape = 'circle',
  innerDimensions = { radius: 2 },
  size = 300,
  showDimensions = true,
  className = '',
}: ShadedRegionProps) {
  const padding = 40;
  const drawWidth = size - padding * 2;
  const drawHeight = size - padding * 2;

  // Scale factor
  const scale = Math.min(
    drawWidth / outerDimensions.width,
    drawHeight / outerDimensions.height
  );

  const cx = size / 2;
  const cy = size / 2;
  const scaledWidth = outerDimensions.width * scale;
  const scaledHeight = outerDimensions.height * scale;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={`shaded-region ${className}`}
    >
      <defs>
        <pattern id="diagonal-stripe" patternUnits="userSpaceOnUse" width="8" height="8">
          <path d="M-1,1 l2,-2 M0,8 l8,-8 M7,9 l2,-2" stroke="#3b82f6" strokeWidth="1.5" />
        </pattern>
      </defs>

      {/* Outer shape with shading */}
      {shape === 'rectangle' && (
        <rect
          x={cx - scaledWidth / 2}
          y={cy - scaledHeight / 2}
          width={scaledWidth}
          height={scaledHeight}
          fill="url(#diagonal-stripe)"
          stroke="#1e40af"
          strokeWidth="2"
        />
      )}

      {/* Inner shape (white/removed area) */}
      {innerShape === 'circle' && innerDimensions.radius && (
        <circle
          cx={cx}
          cy={cy}
          r={innerDimensions.radius * scale}
          fill="white"
          stroke="#1e40af"
          strokeWidth="2"
        />
      )}

      {innerShape === 'rectangle' && innerDimensions.width && innerDimensions.height && (
        <rect
          x={cx - (innerDimensions.width * scale) / 2}
          y={cy - (innerDimensions.height * scale) / 2}
          width={innerDimensions.width * scale}
          height={innerDimensions.height * scale}
          fill="white"
          stroke="#1e40af"
          strokeWidth="2"
        />
      )}

      {/* Dimension labels */}
      {showDimensions && (
        <g fill="#1e293b" fontSize="14" fontWeight="500" textAnchor="middle">
          {/* Width label */}
          <text x={cx} y={cy + scaledHeight / 2 + 25}>
            {outerDimensions.width} cm
          </text>
          {/* Height label */}
          <text
            x={cx - scaledWidth / 2 - 20}
            y={cy}
            transform={`rotate(-90, ${cx - scaledWidth / 2 - 20}, ${cy})`}
          >
            {outerDimensions.height} cm
          </text>
          {/* Inner dimension */}
          {innerShape === 'circle' && innerDimensions.radius && (
            <text x={cx + innerDimensions.radius * scale + 20} y={cy}>
              r = {innerDimensions.radius} cm
            </text>
          )}
        </g>
      )}
    </svg>
  );
}

export default GeometryDiagram;

// =============================================================================
// NSW SELECTIVE EXAM TYPES
// =============================================================================
// FILE: src/types/nsw-selective.ts
// DOMAIN: NSW Selective Exam Prep
// PURPOSE: Types specific to NSW Selective exam preparation system
// DO NOT: Import curriculum types; these are independent
// RELATED: src/app/nsw-selective/*, src/components/nsw-selective/*

import { ArchetypeId, DistractorType, NswSelectiveMetadata } from './index';

// Re-export core types for convenience
export type { ArchetypeId, DistractorType, NswSelectiveMetadata };

// =============================================================================
// ARCHETYPE DEFINITIONS
// =============================================================================

/**
 * Full archetype definition with methodology details
 * Used for displaying archetype cards and methodology coaching
 */
export interface ArchetypeDefinition {
  id: ArchetypeId;
  name: string;                    // "Reverse Percentage (Find Original)"
  shortName: string;               // "Reverse Percentage"
  pattern: string;                 // Pattern description
  conceptsRequired: string[];      // Required math concepts
  solutionApproach: string;        // Brief methodology
  commonErrors: string[];          // Common mistakes students make
  visualRequired: boolean;         // Needs diagram/chart
  difficulty: 1 | 2 | 3 | 4;       // Base difficulty level
  category: ArchetypeCategory;
}

/**
 * Archetype categories for grouping in UI
 */
export type ArchetypeCategory =
  | 'arithmetic_algebra'    // qa1-qa5: Basic operations and equations
  | 'percentages_ratios'    // qa6-qa13: Percentages, ratios, proportions
  | 'geometry_spatial'      // qa3, qa14, qa19: 3D shapes, area, spatial
  | 'data_statistics'       // qa7, qa8: Data interpretation, mean
  | 'patterns_sequences'    // qa9: Pattern recognition
  | 'time_distance'         // qa4, qa16, qa20: Time, timetables, speed
  | 'problem_solving';      // qa10, qa17, qa18: Multi-step word problems

// =============================================================================
// PROGRESS TRACKING
// =============================================================================

/**
 * Progress for a single archetype
 * Stored in Firestore: archetypeProgress/{progressId}
 */
export interface ArchetypeProgress {
  userId: string;
  archetypeId: ArchetypeId;

  // Performance metrics
  questionsAttempted: number;
  questionsCorrect: number;
  averageTimeSeconds: number;
  fastestTimeSeconds?: number;

  // Mastery tracking (1-5 stars)
  masteryLevel: 1 | 2 | 3 | 4 | 5;

  // Error analysis
  commonErrors: DistractorType[];   // Types of errors made
  errorFrequency: Partial<Record<DistractorType, number>>; // Count per error type (partial - only errors encountered)

  // Methodology assessment
  methodologyScore: number;         // 0-100 based on working shown

  // Spaced repetition
  lastPracticed: Date;
  nextReviewDate: Date;             // When to practice again
  consecutiveCorrect: number;       // For spacing algorithm

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Overall exam readiness across all archetypes
 */
export interface ExamReadiness {
  userId: string;
  overallScore: number;            // 0-100 readiness percentage
  archetypeScores: Record<ArchetypeId, number>; // Per-archetype scores
  weakestArchetypes: ArchetypeId[]; // Bottom 5 for focus
  strongestArchetypes: ArchetypeId[]; // Top 5
  lastUpdated: Date;
}

// =============================================================================
// DIAGNOSTIC ASSESSMENT
// =============================================================================

/**
 * Result of diagnostic assessment (20 questions, 1 per archetype)
 * Stored in Firestore: diagnosticResults/{resultId}
 */
export interface DiagnosticResult {
  userId: string;
  completedAt: Date;
  totalTimeSeconds: number;

  // Per-archetype results
  archetypeResults: Record<ArchetypeId, {
    questionId: string;
    isCorrect: boolean;
    timeSeconds: number;
    selectedOption: string;         // "A", "B", "C", "D", "E"
    errorType?: DistractorType;     // If incorrect, what type of error
  }>;

  // Summary
  correctCount: number;             // Out of 20
  percentageScore: number;          // 0-100

  // Analysis
  identifiedWeaknesses: ArchetypeId[];  // Archetypes to focus on
  recommendedPath: ArchetypeId[];       // Suggested practice order
  overallReadiness: number;             // 0-100 exam readiness
}

// =============================================================================
// PRACTICE SESSION
// =============================================================================

/**
 * A practice session for a specific archetype
 */
export interface PracticeSession {
  sessionId: string;
  userId: string;
  archetypeId: ArchetypeId;

  // Configuration
  questionCount: number;
  difficultyRange: [number, number]; // [min, max] difficulty
  timeLimit?: number;               // Optional time limit in seconds

  // Progress
  questionsCompleted: number;
  questionsCorrect: number;
  currentQuestionIndex: number;

  // Timing
  startedAt: Date;
  completedAt?: Date;
  totalTimeSeconds: number;

  // Results
  answers: {
    questionId: string;
    selectedOption: string;
    isCorrect: boolean;
    timeSeconds: number;
    hintsUsed: number;
  }[];
}

// =============================================================================
// EXAM SIMULATION
// =============================================================================

/**
 * Full exam simulation (35 questions, 40 minutes)
 */
export interface ExamSimulation {
  simulationId: string;
  userId: string;

  // Configuration (matches real exam)
  questionCount: 35;
  timeLimitSeconds: 2400;           // 40 minutes
  optionCount: 5;                   // A-E

  // Question distribution
  questions: {
    questionId: string;
    archetypeId: ArchetypeId;
    difficulty: number;
    sequenceNumber: number;         // 1-35
  }[];

  // Session state
  status: 'not_started' | 'in_progress' | 'completed' | 'abandoned';
  currentQuestionIndex: number;
  startedAt?: Date;
  completedAt?: Date;

  // Results
  answers: {
    questionId: string;
    selectedOption: string;
    timeSeconds: number;
    flagged: boolean;               // Student marked for review
  }[];

  // Final score (only after completion)
  score?: {
    correct: number;
    total: number;
    percentage: number;
    byArchetype: Record<ArchetypeId, { correct: number; total: number }>;
    byDifficulty: Record<number, { correct: number; total: number }>;
    timeAnalysis: {
      averagePerQuestion: number;
      fastestQuestion: number;
      slowestQuestion: number;
    };
  };
}

// =============================================================================
// METHODOLOGY COACHING
// =============================================================================

/**
 * Methodology lesson for an archetype
 */
export interface MethodologyLesson {
  archetypeId: ArchetypeId;
  title: string;                    // "How to Solve Reverse Percentage Problems"

  // Content sections
  pattern: {
    description: string;            // What the pattern looks like
    examples: string[];             // Example problem stems
  };

  approach: {
    steps: string[];                // Step-by-step methodology
    explanation: string;            // Why this approach works
  };

  commonTraps: {
    trap: string;
    howToAvoid: string;
  }[];

  workedExample: {
    problem: string;
    solution: string;               // Markdown with steps
  };

  // Metadata
  estimatedMinutes: number;         // 3-5 minute lessons
}

// =============================================================================
// ARCHETYPE CATALOG (Static Data)
// =============================================================================

/**
 * All 20 archetypes with their definitions
 * This is static reference data
 */
export const ARCHETYPE_CATALOG: Record<ArchetypeId, Omit<ArchetypeDefinition, 'id'>> = {
  qa1: {
    name: 'Playlist/Sequence Duration',
    shortName: 'Sequence Duration',
    pattern: 'Multiple items with progressively changing values',
    conceptsRequired: ['arithmetic-sequences', 'time-calculations', 'summation'],
    solutionApproach: 'List all values, sum them systematically',
    commonErrors: ['Forgetting first item', 'Applying change in wrong direction'],
    visualRequired: false,
    difficulty: 2,
    category: 'arithmetic_algebra'
  },
  qa2: {
    name: 'Weight/Mass Equivalence',
    shortName: 'Weight Equivalence',
    pattern: 'Two types of objects with known ratio and one known weight',
    conceptsRequired: ['ratio-reasoning', 'unit-rates', 'division'],
    solutionApproach: 'Find total weight from known items → divide to find unit weight',
    commonErrors: ['Dividing by wrong number', 'Confusing which is heavier'],
    visualRequired: false,
    difficulty: 2,
    category: 'percentages_ratios'
  },
  qa3: {
    name: '3D Shape Properties',
    shortName: '3D Properties',
    pattern: 'Calculate sum of faces, edges, vertices for non-standard shape',
    conceptsRequired: ['3d-geometry', 'systematic-enumeration', 'addition'],
    solutionApproach: 'Systematically count faces, edges, vertices using formulas',
    commonErrors: ['Forgetting the apex', 'Double-counting shared edges'],
    visualRequired: true,
    difficulty: 2,
    category: 'geometry_spatial'
  },
  qa4: {
    name: 'Multi-Leg Journey with Time Zones',
    shortName: 'Time Zone Journey',
    pattern: 'Travel across multiple locations with different time zones and stopovers',
    conceptsRequired: ['time-addition', 'timezone-conversion', 'duration-tracking'],
    solutionApproach: 'Track elapsed time, convert only when asked for specific timezone',
    commonErrors: ['Adding time zones instead of tracking elapsed time', 'Converting at wrong step'],
    visualRequired: false,
    difficulty: 4,
    category: 'time_distance'
  },
  qa5: {
    name: 'Simultaneous Price Equations',
    shortName: 'Price Equations',
    pattern: 'Multiple menu items with combined prices, find individual or new combination',
    conceptsRequired: ['simultaneous-reasoning', 'subtraction', 'addition'],
    solutionApproach: 'Find one item by comparing equations; use to find others',
    commonErrors: ['Adding all equations', 'Finding wrong item'],
    visualRequired: false,
    difficulty: 3,
    category: 'arithmetic_algebra'
  },
  qa6: {
    name: 'Coin/Object Pairing',
    shortName: 'Object Pairing',
    pattern: 'Equal numbers of two different valued items with known total',
    conceptsRequired: ['pairing-strategy', 'division', 'two-step-multiplication'],
    solutionApproach: 'Pair items → find number of pairs → calculate separately',
    commonErrors: ['Dividing total by individual value', 'Forgetting both types'],
    visualRequired: false,
    difficulty: 2,
    category: 'percentages_ratios'
  },
  qa7: {
    name: 'Venn Diagram Area Problem',
    shortName: 'Venn Diagram',
    pattern: 'Overlapping regions with given totals for each category',
    conceptsRequired: ['venn-diagram-logic', 'set-theory-basics', 'subtraction'],
    solutionApproach: 'Use inclusion-exclusion: A∪B = A + B - A∩B',
    commonErrors: ['Adding areas without considering overlap', 'Subtracting wrong value'],
    visualRequired: true,
    difficulty: 3,
    category: 'data_statistics'
  },
  qa8: {
    name: 'Missing Value for Target Mean',
    shortName: 'Target Mean',
    pattern: 'Given mean and most values, find the missing one',
    conceptsRequired: ['mean-formula', 'inverse-operations', 'subtraction'],
    solutionApproach: 'Sum = Mean × Count; New value = New sum - Old sum',
    commonErrors: ['Confusing mean with sum', 'Using wrong count'],
    visualRequired: false,
    difficulty: 2,
    category: 'data_statistics'
  },
  qa9: {
    name: 'Pattern Sequence with Complex Rule',
    shortName: 'Complex Pattern',
    pattern: 'Number sequence with non-obvious multi-operation rule',
    conceptsRequired: ['pattern-analysis', 'hypothesis-testing', 'algebraic-reasoning'],
    solutionApproach: 'Test multiple rules (×n, +n, combination); verify on all terms',
    commonErrors: ['Assuming simple arithmetic sequence', 'Not testing rule on all terms'],
    visualRequired: false,
    difficulty: 4,
    category: 'patterns_sequences'
  },
  qa10: {
    name: 'Three-Way Relationship Vote/Score Problem',
    shortName: 'Three-Way Relationship',
    pattern: 'Three quantities with relative differences and total/average given',
    conceptsRequired: ['variable-relationships', 'mean-calculation', 'solving-equations'],
    solutionApproach: 'Express all in terms of one variable; use total to solve',
    commonErrors: ['Mixing up more/fewer relationships', 'Incorrect variable assignment'],
    visualRequired: false,
    difficulty: 3,
    category: 'problem_solving'
  },
  qa11: {
    name: 'Percentage Equivalence/Comparison',
    shortName: 'Percentage Equivalence',
    pattern: 'X% of A equals Y% of B, find relationship',
    conceptsRequired: ['percentage-relationships', 'ratio-formation', 'algebraic-manipulation'],
    solutionApproach: 'Set up equation: 0.10J = 0.25P; solve for ratio',
    commonErrors: ['Inverting the ratio', 'Forgetting to convert to percentage'],
    visualRequired: false,
    difficulty: 3,
    category: 'percentages_ratios'
  },
  qa12: {
    name: 'Multi-Ratio Recipe Problem',
    shortName: 'Multi-Ratio Recipe',
    pattern: 'Multiple ratios connecting three or more ingredients',
    conceptsRequired: ['chain-ratios', 'unit-conversion', 'proportional-reasoning'],
    solutionApproach: 'Express all in terms of one ingredient; find parts; calculate',
    commonErrors: ['Confusing ratio direction', 'Missing unit conversion'],
    visualRequired: false,
    difficulty: 3,
    category: 'percentages_ratios'
  },
  qa13: {
    name: 'Reverse Percentage (Find Original)',
    shortName: 'Reverse Percentage',
    pattern: 'Final value after percentage change, find original',
    conceptsRequired: ['reverse-percentages', 'fraction-reasoning', 'division'],
    solutionApproach: 'If result is X% of original, then Original = Result ÷ (X/100)',
    commonErrors: ['Adding percentage instead of dividing', 'Using wrong percentage base'],
    visualRequired: false,
    difficulty: 3,
    category: 'percentages_ratios'
  },
  qa14: {
    name: 'Cube Structure with Paint/Hidden Cubes',
    shortName: 'Painted Cubes',
    pattern: '3D structure painted, count cubes with specific face coverage',
    conceptsRequired: ['3d-visualization', 'systematic-counting', 'edge-corner-identification'],
    solutionApproach: 'Identify positions: corners=3 faces, edges=2 faces, faces=1, interior=0',
    commonErrors: ['Forgetting interior cubes', 'Miscounting edge positions'],
    visualRequired: true,
    difficulty: 4,
    category: 'geometry_spatial'
  },
  qa15: {
    name: 'Scale/Proportion Weight Problem',
    shortName: 'Scale Proportion',
    pattern: 'Similar objects with known dimensions, find weight of larger',
    conceptsRequired: ['scale-factors', 'volume-ratio', 'cubing-for-3d-scaling'],
    solutionApproach: 'Find linear scale factor; cube it for volume ratio; multiply weight',
    commonErrors: ['Using linear scale factor for weight', 'Squaring instead of cubing'],
    visualRequired: false,
    difficulty: 4,
    category: 'percentages_ratios'
  },
  qa16: {
    name: 'Timetable Navigation',
    shortName: 'Timetable',
    pattern: 'Use schedule/table to calculate total time or optimal route',
    conceptsRequired: ['table-reading', 'time-calculation', 'duration-addition'],
    solutionApproach: 'Extract relevant times; add travel + activity + return',
    commonErrors: ['Misreading table rows/columns', 'Missing wait time'],
    visualRequired: true,
    difficulty: 2,
    category: 'time_distance'
  },
  qa17: {
    name: 'Age Relationship Problem',
    shortName: 'Age Relationship',
    pattern: 'Ages at different points in time with relationships',
    conceptsRequired: ['time-progression', 'algebraic-reasoning', 'addition'],
    solutionApproach: 'Track time span; multiply by number of people',
    commonErrors: ['Only adding years once', 'Miscounting the time span'],
    visualRequired: false,
    difficulty: 3,
    category: 'problem_solving'
  },
  qa18: {
    name: 'Systematic Counting/Combinations',
    shortName: 'Counting Combinations',
    pattern: 'How many ways to arrange/select with constraints',
    conceptsRequired: ['systematic-listing', 'constraints-application', 'factorial-reasoning'],
    solutionApproach: 'Apply constraints first; count remaining arrangements',
    commonErrors: ['Forgetting constraints', 'Allowing repeated digits when not permitted'],
    visualRequired: false,
    difficulty: 3,
    category: 'problem_solving'
  },
  qa19: {
    name: 'Shaded Region Area',
    shortName: 'Shaded Area',
    pattern: 'Composite shape with region removed or highlighted',
    conceptsRequired: ['area-formulas', 'subtraction-method', 'pi-calculations'],
    solutionApproach: 'Calculate whole shape area; subtract removed shape area',
    commonErrors: ['Using diameter instead of radius', 'Forgetting quarter/half of circle'],
    visualRequired: true,
    difficulty: 3,
    category: 'geometry_spatial'
  },
  qa20: {
    name: 'Speed-Distance-Time Multi-Part',
    shortName: 'Speed-Distance-Time',
    pattern: 'Journey with different speeds/distances, find average or total',
    conceptsRequired: ['distance-formula', 'average-speed-not-average-of-speeds', 'division'],
    solutionApproach: 'Total distance ÷ Total time = Average speed (NOT average of speeds)',
    commonErrors: ['Averaging the two speeds (wrong!)', 'Using wrong units'],
    visualRequired: false,
    difficulty: 3,
    category: 'time_distance'
  },
  qa21: {
    name: 'Multi-Concept Integration',
    shortName: 'Integration',
    pattern: 'Problems requiring synthesis of 2-3 mathematical concepts from different archetypes',
    conceptsRequired: ['cross-archetype-synthesis', 'multi-step-reasoning', 'concept-selection'],
    solutionApproach: 'Identify component concepts → Solve sub-problems → Synthesize results → Verify consistency',
    commonErrors: ['Solving only one component', 'Not connecting sub-problems', 'Using wrong concept for context', 'Missing hidden constraints'],
    visualRequired: false,
    difficulty: 4,
    category: 'problem_solving'
  },
  qa22: {
    name: 'Probability Reasoning',
    shortName: 'Probability',
    pattern: 'Apply probability concepts to novel situations with changing sample spaces, expected outcomes, or fairness analysis',
    conceptsRequired: ['sample-space-reasoning', 'probability-calculation', 'expected-value', 'complementary-events'],
    solutionApproach: 'Identify sample space → Track changes after events → Apply appropriate probability rules → Verify total probability',
    commonErrors: ['Forgetting to update sample space after events', 'Adding instead of multiplying independent events', 'Wrong complement calculation', 'Assuming equal probability when not true'],
    visualRequired: false,
    difficulty: 3,
    category: 'data_statistics'
  },
  qa23: {
    name: 'Data Interpretation & Statistical Reasoning',
    shortName: 'Data Interpretation',
    pattern: 'Draw conclusions from data displays, compare measures of center, work backwards from statistics',
    conceptsRequired: ['median-mode-mean', 'data-analysis', 'graph-interpretation', 'two-way-tables'],
    solutionApproach: 'Identify what the data shows → Apply appropriate statistical measure → Draw valid conclusions → Check for misleading presentations',
    commonErrors: ['Confusing mean with median', 'Using wrong total from tables', 'Confusing rate with count', 'Drawing invalid conclusions from correlation'],
    visualRequired: false,
    difficulty: 3,
    category: 'data_statistics'
  }
};

/**
 * Get full archetype definition by ID
 */
export function getArchetypeDefinition(id: ArchetypeId): ArchetypeDefinition {
  return {
    id,
    ...ARCHETYPE_CATALOG[id]
  };
}

/**
 * Get all archetypes in a category
 */
export function getArchetypesByCategory(category: ArchetypeCategory): ArchetypeDefinition[] {
  return (Object.entries(ARCHETYPE_CATALOG) as [ArchetypeId, typeof ARCHETYPE_CATALOG[ArchetypeId]][])
    .filter(([, def]) => def.category === category)
    .map(([id, def]) => ({ id, ...def }));
}

/**
 * Get archetypes that don't require visual content (for Phase 1)
 */
export function getTextOnlyArchetypes(): ArchetypeDefinition[] {
  return (Object.entries(ARCHETYPE_CATALOG) as [ArchetypeId, typeof ARCHETYPE_CATALOG[ArchetypeId]][])
    .filter(([, def]) => !def.visualRequired)
    .map(([id, def]) => ({ id, ...def }));
}

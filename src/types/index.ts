// ============================================
// FIRESTORE TYPES (match actual database schema)
// ============================================

// Firestore MCQ Option structure
export interface FirestoreMCQOption {
  id: string;           // "A", "B", "C", "D"
  text: string;         // The answer text
  isCorrect: boolean;   // Whether this is correct
  feedback?: string;    // Feedback for this option
}

// Firestore Hint structure
export interface FirestoreHint {
  level: number;                // 1, 2, 3
  content: string;              // Hint text
  revealsCriticalInfo: boolean; // Whether it gives away answer
}

// Firestore Curriculum structure
export interface FirestoreCurriculum {
  system: string;       // "NSW Mathematics K-10 Syllabus"
  codes: string[];      // ["MA3-5NA"]
  year: number;         // 6
  subject: string;      // "mathematics"
  strand: string;       // "Number and Algebra"
  substrand?: string;
}

// Firestore Skills structure
export interface FirestoreSkills {
  primarySkill: string;
  secondarySkills: string[];
  competencyLevel: string;
  cognitiveLevel: string;
  prerequisites: string[];
}

// Firestore Searchable Tag
export interface FirestoreSearchableTag {
  category: string;     // "topic", "skill", "year", "assessment"
  value: string;        // "percentages", "nsw-selective"
  weight: number;       // 1.0
}

// Firestore AI Metadata
export interface FirestoreAIMetadata {
  generatedBy: string;
  generatedAt: string;
  validationStatus: string;
  validatedBy?: string;
  validatedAt?: string;
}

// =============================================================================
// NSW SELECTIVE EXAM TYPES
// =============================================================================
// DOMAIN: NSW Selective Exam Prep
// PURPOSE: Types for archetype-based exam preparation system
// DO NOT: Mix with curriculum/learning-arc types

/**
 * Distractor types for MCQ options - describes WHY a wrong answer is wrong
 * Used to provide targeted feedback and track error patterns
 */
export type DistractorType =
  | 'partial_solution'      // Stopped too early in multi-step problem
  | 'forward_calculation'   // Applied percentage forward instead of reverse
  | 'wrong_operation'       // Used wrong math operation (+ instead of -, etc.)
  | 'off_by_one'           // Counting error (fence-post problem)
  | 'unit_confusion'       // Mixed up units (kg vs g, etc.)
  | 'sign_error'           // Positive/negative mistake
  | 'misconception_answer' // Result of applying a known misconception
  | 'place_value_error'    // Off by factor of 10, 100, or 1000
  | 'inverted_ratio'       // Using the inverse of correct ratio
  | 'formula_confusion'    // Applied wrong formula (area vs perimeter)
  | 'middle_value_trap'    // Plausible-looking number between extremes
  | 'computation_error'    // Arithmetic/calculation mistake
  | 'conceptual_error'     // Fundamental misunderstanding of the concept
  | 'setup_error'          // Incorrect problem setup or equation
  | 'misread_question';    // Misunderstood what the question asks

/**
 * NSW Selective question archetype IDs
 * Maps to the 20 question patterns identified in research
 */
export type ArchetypeId =
  | 'qa1'   // Playlist/Sequence Duration
  | 'qa2'   // Weight/Mass Equivalence
  | 'qa3'   // 3D Shape Properties
  | 'qa4'   // Multi-Leg Journey with Time Zones
  | 'qa5'   // Simultaneous Price Equations
  | 'qa6'   // Coin/Object Pairing
  | 'qa7'   // Venn Diagram Area Problem
  | 'qa8'   // Missing Value for Target Mean
  | 'qa9'   // Pattern Sequence with Complex Rule
  | 'qa10'  // Three-Way Relationship Vote/Score
  | 'qa11'  // Percentage Equivalence/Comparison
  | 'qa12'  // Multi-Ratio Recipe Problem
  | 'qa13'  // Reverse Percentage (Find Original)
  | 'qa14'  // Cube Structure with Paint/Hidden
  | 'qa15'  // Scale/Proportion Weight Problem
  | 'qa16'  // Timetable Navigation
  | 'qa17'  // Age Relationship Problem
  | 'qa18'  // Systematic Counting/Combinations
  | 'qa19'  // Shaded Region Area
  | 'qa20'; // Speed-Distance-Time Multi-Part

/**
 * NSW Selective metadata for questions
 * Every NSW Selective question MUST include this for archetype-based learning
 */
export interface NswSelectiveMetadata {
  archetype: string;                              // Human-readable: "Reverse Percentage"
  archetypeId: ArchetypeId;                       // Machine ID: "qa13"
  conceptsRequired: string[];                     // ["percentages", "multiplicative-reasoning"]
  distractorTypes: Record<string, DistractorType>; // {"B": "forward_calculation", "C": "misconception_answer"}
  solutionApproach: string;                       // Brief methodology description
  methodologySteps: string[];                     // Step-by-step approach to solve
  timeTarget: number;                             // Target seconds for this difficulty (30-300)
  commonErrors?: string[];                        // Tracked error patterns for this archetype
}

// =============================================================================
// VISUAL CONTENT TYPES (for diagrams, graphs, images)
// =============================================================================
// DOMAIN: Shared infrastructure
// PURPOSE: Enable rendering of visual content in questions

/**
 * Chart configuration for data visualizations
 * Uses Recharts-compatible structure
 */
export interface ChartConfig {
  type: 'bar' | 'line' | 'scatter' | 'pie' | 'area';
  data: {
    labels?: string[];
    datasets: {
      label?: string;
      data: number[];
      backgroundColor?: string | string[];
      borderColor?: string;
    }[];
  };
  options?: {
    title?: string;
    xAxisLabel?: string;
    yAxisLabel?: string;
    showLegend?: boolean;
    showGrid?: boolean;
  };
}

/**
 * Geometry element types for programmatic diagram rendering
 */
export type GeometryElementType =
  | 'point'
  | 'line'
  | 'segment'
  | 'ray'
  | 'circle'
  | 'arc'
  | 'polygon'
  | 'angle'
  | 'label'
  | 'function';

/**
 * A single geometry element for diagram rendering
 */
export interface GeometryElement {
  type: GeometryElementType;
  id: string;
  coords?: [number, number];           // For points
  points?: string[];                   // IDs of connected points
  center?: [number, number];           // For circles/arcs
  radius?: number;                     // For circles
  label?: string;                      // Display label
  color?: string;
  dashed?: boolean;
  showLabel?: boolean;
  expression?: string;                 // For function type: "x^2"
}

/**
 * Configuration for programmatic geometry rendering
 * Supports Mafs (coordinate geometry) and JSXGraph (constructions)
 */
export interface GeometryConfig {
  library: 'mafs' | 'jsxgraph';
  elements: GeometryElement[];
  viewBox?: {
    xMin: number;
    xMax: number;
    yMin: number;
    yMax: number;
  };
  showGrid?: boolean;
  showAxes?: boolean;
}

// =============================================================================
// MATH QUESTION TYPES (NEW)
// =============================================================================

// Step for multi-step math questions
export interface FirestoreMathStep {
  stepNumber: number;              // 1, 2, 3, ...
  instruction: string;             // "Expand the brackets"
  inputType: 'text' | 'equation' | 'number' | 'expression';
  placeholder?: string;            // "e.g., 3x + 6"
  expectedPattern?: string;        // Pattern for validation (LaTeX format)
  hints?: FirestoreHint[];         // Step-specific hints
  rubricWeight: number;            // 0.0 - 1.0 (weights must sum to 1)
  rubricCriterion?: string;        // What this step assesses
}

// Math answer format (for storing student answers)
export interface MathAnswer {
  latex: string;                   // Raw LaTeX: "\\frac{3}{4}"
  plainText: string;               // Human readable: "3/4"
  numericValue?: number;           // Evaluated value: 0.75
  steps?: {
    stepNumber: number;
    latex: string;
    plainText: string;
    timeSpentMs?: number;
  }[];
}

// Math-specific rich content flags
export interface FirestoreMathContent {
  requiresMathInput: boolean;      // Needs equation editor
  requiresMultiStep: boolean;      // Multi-step problem
  hasNumericAnswer: boolean;       // Final answer is a number
  hasSymbolicAnswer: boolean;      // Final answer is an expression
  acceptableFormats?: string[];    // ["decimal", "fraction", "percent"]
  tolerancePercent?: number;       // For numeric answers (e.g., 0.01 for 1%)
}

// =============================================================================
// WORKED SOLUTION (Student-Centered "Show Your Work" Approach)
// =============================================================================
// This approach respects student autonomy - they choose their own solution path.
// AI evaluates the REASONING, not just pattern matching against expected answers.
// Multiple valid paths are celebrated, not penalized.

/**
 * Work line - a single step in student's working
 * Students can add as many lines as they need
 */
export interface WorkLine {
  lineNumber: number;              // 1, 2, 3, ... (auto-assigned)
  latex: string;                   // LaTeX content: "3x + 6 = 21"
  plainText: string;               // Human-readable: "3x + 6 = 21"
}

/**
 * Encouraging hint - designed to support learning, not penalize
 * Hints are FREE to use - they're learning tools, not assessment penalties
 */
export interface EncouragingHint {
  level: number;                   // 1 = gentle nudge, 2 = more guidance, 3 = strong scaffold
  content: string;                 // The hint text
  encouragement: string;           // Positive framing: "You're on the right track!"
  questionPrompt?: string;         // Socratic question: "What happens when you..."
}

/**
 * Student's answer for WORKED_SOLUTION questions
 * Captures both the journey (working) and destination (final answer)
 */
export interface WorkedSolutionAnswer {
  workLines: WorkLine[];           // Student's working (any number of lines)
  finalAnswer: string;             // The final answer (latex format)
  finalAnswerPlainText: string;    // Human-readable final answer
  hintsViewed: number[];           // Which hint levels were viewed (for analytics only, NOT scoring)
  timeSpentMs?: number;            // Total time (for analytics)
  confidenceRating?: number;       // Optional self-assessment 1-5
}

/**
 * Configuration for WORKED_SOLUTION questions
 * Focuses on flexibility and multiple valid approaches
 */
export interface WorkedSolutionConfig {
  startingExpression: string;      // Pre-filled first line: "3(x + 2) = 21"
  expectedAnswers: string[];       // Multiple valid forms: ["5", "x=5", "x = 5"]
  gradingGuidance: string;         // AI instructions for flexible evaluation
  sampleSolutions?: string[];      // Example valid paths (for AI reference)
  minimumWorkLines?: number;       // Encourage showing work (default: 1, 0 = any)
  encourageExplanation?: boolean;  // Prompt for verbal explanation
  topic?: string;                  // Topic for AI tutor context (e.g., "linear-equations")
  year?: number;                   // Year level for age-appropriate guidance
  keyConcepts?: string[];          // Key concepts for AI tutor to reference
}

// ACTUAL Firestore Question structure
export interface FirestoreQuestion {
  questionId: string;
  questionType: 'MCQ' | 'SHORT_ANSWER' | 'EXTENDED_RESPONSE' | 'EQUATION_ENTRY' | 'MULTI_STEP_MATH' | 'WORKED_SOLUTION';
  stem: string;
  mcqOptions?: FirestoreMCQOption[];
  solution?: string;
  hints?: FirestoreHint[];
  curriculum?: FirestoreCurriculum;
  skills?: FirestoreSkills;
  searchableTags?: FirestoreSearchableTag[];
  difficulty: number;   // 1-5
  estimatedTime?: number;
  qcs?: number;         // Question Complexity Score
  passageId?: string;   // For reading comprehension
  paperMetadata?: {
    paperId?: string;
    title?: string;
    section: string;    // "mathematics", "reading", "thinkingSkills", "writing"
    setId?: string;     // Grouping ID: "year8-states-of-matter-set1" or "nsw-sel-qa3-set1"
    sequenceInPaper?: number; // Position within set (1-based)
  };
  aiMetadata?: FirestoreAIMetadata;

  // =============================================================================
  // VISUAL CONTENT FIELDS (for diagrams, graphs, images)
  // =============================================================================
  imageUrl?: string;           // Firebase Storage URL for static diagrams
  imageAlt?: string;           // Accessibility description for image
  svgContent?: string;         // Inline SVG for simple shapes
  chartConfig?: ChartConfig;   // For data visualizations (bar, line, pie, etc.)
  geometryConfig?: GeometryConfig; // For programmatic geometry rendering

  // =============================================================================
  // NSW SELECTIVE FIELDS (archetype-based exam preparation)
  // =============================================================================
  nswSelective?: NswSelectiveMetadata;  // Required for NSW Selective questions
  version?: number;
  status: string;       // "published", "draft"
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string;

  // =============================================================================
  // MATH-SPECIFIC FIELDS (optional, used only for math question types)
  // =============================================================================
  steps?: FirestoreMathStep[];     // For MULTI_STEP_MATH questions (legacy)
  mathContent?: FirestoreMathContent; // Math-specific metadata

  // =============================================================================
  // WORKED SOLUTION FIELDS (student-centered "show your work" approach)
  // =============================================================================
  workedSolutionConfig?: WorkedSolutionConfig;  // For WORKED_SOLUTION questions
  encouragingHints?: EncouragingHint[];         // Student-friendly hints (no penalties)
}

// Firestore Passage structure (for reading comprehension)
export interface FirestorePassage {
  passageId: string;
  title: string;
  genre: string;
  wordCount: number;
  readingLevel: string;
  content: string;
  source?: string;
  tags?: string[];
  curriculum?: FirestoreCurriculum;
}

// ============================================
// APP TYPES (transformed for UI consumption)
// ============================================

// App-friendly Question (transformed from Firestore)
export interface Question {
  id: string;
  text: string;
  type: 'multiple_choice' | 'short_answer' | 'extended_response' | 'writing' | 'equation_entry' | 'multi_step_math' | 'worked_solution';
  options?: string[];
  optionIds?: string[];           // ["A", "B", "C", "D"]
  correctAnswer?: string;
  correctOptionId?: string;       // "A", "B", "C", "D"
  explanation?: string;
  hints?: string[];
  optionFeedback?: Record<string, string>;  // {A: "feedback", B: "feedback"}
  subject: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedTimeSeconds?: number;
  section?: string;               // For NSW Selective
  passageId?: string;             // For reading comprehension

  // Math-specific (optional)
  steps?: FirestoreMathStep[];    // For multi-step math
  mathContent?: FirestoreMathContent; // Math metadata
}

// =============================================================================
// TYPE GUARDS FOR QUESTION TYPES
// =============================================================================

/**
 * Check if a question requires math equation input
 * Includes all math question types: EQUATION_ENTRY, MULTI_STEP_MATH, WORKED_SOLUTION
 */
export function isMathQuestion(question: FirestoreQuestion | Question): boolean {
  if ('questionType' in question) {
    return question.questionType === 'EQUATION_ENTRY' ||
           question.questionType === 'MULTI_STEP_MATH' ||
           question.questionType === 'WORKED_SOLUTION';
  }
  return question.type === 'equation_entry' ||
         question.type === 'multi_step_math' ||
         question.type === 'worked_solution';
}

/**
 * Check if a question is the student-centered "show your work" type
 * This is the recommended approach for multi-step problems
 */
export function isWorkedSolutionQuestion(question: FirestoreQuestion | Question): boolean {
  if ('questionType' in question) {
    return question.questionType === 'WORKED_SOLUTION';
  }
  return question.type === 'worked_solution';
}

/**
 * Check if a question is multi-step math (legacy - prefer WORKED_SOLUTION)
 */
export function isMultiStepMathQuestion(question: FirestoreQuestion | Question): boolean {
  if ('questionType' in question) {
    return question.questionType === 'MULTI_STEP_MATH';
  }
  return question.type === 'multi_step_math';
}

/**
 * Check if a question is equation entry (single answer)
 */
export function isEquationEntryQuestion(question: FirestoreQuestion | Question): boolean {
  if ('questionType' in question) {
    return question.questionType === 'EQUATION_ENTRY';
  }
  return question.type === 'equation_entry';
}

/**
 * Check if a question is an NSW Selective exam question
 * NSW Selective questions have archetype-based metadata
 */
export function isNswSelectiveQuestion(question: FirestoreQuestion): boolean {
  return question.nswSelective !== undefined && question.nswSelective.archetypeId !== undefined;
}

/**
 * Check if a question has visual content that needs rendering
 */
export function hasVisualContent(question: FirestoreQuestion): boolean {
  return !!(question.imageUrl || question.svgContent || question.chartConfig || question.geometryConfig);
}

// App-friendly Passage
export interface Passage {
  id: string;
  title: string;
  content: string;
  genre: string;
  wordCount: number;
  readingLevel: string;
}

// User types
export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  role: 'student' | 'parent' | 'teacher' | 'admin';
  createdAt: Date;
}

// Attempt types
export interface Attempt {
  id: string;
  questionId: string;
  userId: string;
  answer: string;
  selectedOptionId?: string;      // "A", "B", "C", "D"
  isCorrect?: boolean;
  score?: number;
  feedback?: string;
  timeSpentSeconds?: number;
  hintsUsed?: number;
  createdAt: Date;
}

// AI Grading result
export interface GradingResult {
  score: number;
  feedback: string;
  suggestions?: string[];
  isCorrect: boolean;
}

// Question Set for organizing practice
export interface QuestionSet {
  id: string;
  title: string;
  description: string;
  section: string;
  questionCount: number;
  timeLimitSeconds?: number;
  difficulty: string;
}

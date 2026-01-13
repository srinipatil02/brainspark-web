/**
 * NSW Selective AI Tutoring - Types
 *
 * Shared types for the TRUE AI tutoring Cloud Functions
 * These functions use actual LLM reasoning, not template lookup
 */

// =============================================================================
// DISTRACTOR TYPES (match client-side definition)
// =============================================================================

export type DistractorType =
  | 'partial_solution'      // Stopped too early in multi-step problem
  | 'forward_calculation'   // Applied percentage forward instead of reverse
  | 'wrong_operation'       // Used wrong math operation (+ instead of -, etc.)
  | 'computation_error'     // Correct method but arithmetic mistake
  | 'sign_error'            // Positive/negative confusion
  | 'unit_confusion'        // Mixed up units (m vs cm, etc.)
  | 'off_by_one'            // Counting error (fence post problem)
  | 'misconception_answer'  // Common misconception about the concept
  | 'misread_question'      // Misinterpreted what was being asked
  | 'conceptual_error'      // Fundamental misunderstanding
  | 'setup_error'           // Problem setup incorrect
  | 'place_value_error'     // Decimal/place value mistake
  | 'inverted_ratio'        // Ratio upside down
  | 'formula_confusion'     // Used wrong formula
  | 'middle_value_trap';    // Picked plausible-looking wrong answer

// =============================================================================
// ARCHETYPE TYPES
// =============================================================================

export type ArchetypeId =
  | 'qa1' | 'qa2' | 'qa3' | 'qa4' | 'qa5'
  | 'qa6' | 'qa7' | 'qa8' | 'qa9' | 'qa10'
  | 'qa11' | 'qa12' | 'qa13' | 'qa14' | 'qa15'
  | 'qa16' | 'qa17' | 'qa18' | 'qa19' | 'qa20';

export interface ArchetypeInfo {
  id: ArchetypeId;
  name: string;
  shortName: string;
  methodology: string;
  commonErrors: string[];
  prerequisiteConcepts: string[];
}

// =============================================================================
// DIAGNOSTIC FEEDBACK TYPES
// =============================================================================

export interface DiagnosticFeedbackRequest {
  // Question context
  question: {
    questionId: string;
    stem: string;
    options: { id: string; text: string; isCorrect: boolean }[];
    methodologySteps: string[];
    solution: string;
    difficulty: number;
  };

  // Student's answer
  selectedOption: string;
  errorType: DistractorType;
  timeSpentSeconds: number;

  // Historical context (CRITICAL for personalization)
  studentContext: {
    errorHistory: Partial<Record<DistractorType, number>>;
    previousFeedbackThisSession: string[];  // What we've already told them
    masteryLevel: number;
    questionsAttemptedThisArchetype: number;
    recentCorrectStreak: number;
  };

  // Archetype context
  archetype: ArchetypeInfo;
}

export interface DiagnosticFeedbackResponse {
  success: boolean;
  diagnosis?: string;           // Internal, for logging
  explanationApproach?: 'visual' | 'algebraic' | 'analogy' | 'stepByStep' | 'contrast';
  feedback?: string;            // Main message to student
  guidingQuestion?: string;     // Socratic prompt
  encouragement?: string;       // Specific praise
  suggestedNextStep?: string;   // Action item
  confidenceLevel?: number;     // AI's confidence in diagnosis
  error?: string;
  processingTime?: number;
}

// =============================================================================
// SESSION ANALYSIS TYPES
// =============================================================================

export interface SessionAnalysisRequest {
  session: {
    archetypeId: ArchetypeId;
    startTime: number;
    endTime: number;
    questions: Array<{
      questionId: string;
      stem: string;
      correctAnswer: string;
      studentAnswer: string;
      isCorrect: boolean;
      timeSeconds: number;
      errorType?: DistractorType;
      hintsUsed: number;
    }>;
  };

  historicalContext: {
    previousSessionsThisArchetype: number;
    overallAccuracyTrend: number[];  // Last 5 sessions
    persistentErrorPatterns: Partial<Record<DistractorType, number>>;
    masteryLevelProgression: number[];
  };

  archetype: ArchetypeInfo;
}

export interface SessionAnalysisResponse {
  success: boolean;

  // Deep insight
  deepInsight?: string;

  // Strengths
  strengthsIdentified?: string[];

  // Root cause analysis
  rootCauseAnalysis?: {
    primaryGap: string;
    evidence: string;
    severity: 'minor' | 'moderate' | 'significant';
  };

  // Recommendations
  recommendations?: {
    immediate: string;
    nextSession: string;
    prerequisiteReview: string | null;
  };

  // Encouragement
  personalizedEncouragement?: string;

  // Progress indicator
  progressIndicator?: 'improving' | 'stable' | 'needsAttention';

  error?: string;
  processingTime?: number;
}

// =============================================================================
// SOCRATIC COACH TYPES
// =============================================================================

export interface SocraticCoachRequest {
  question: {
    questionId: string;
    stem: string;
    correctAnswer: string;    // AI needs to know to guide toward it
    methodology: string[];
  };

  conversation: {
    history: Array<{
      role: 'student' | 'tutor';
      message: string;
      timestamp: number;
    }>;
    studentCurrentThinking?: string;  // Optional: what they've typed/tried
  };

  studentContext: {
    wrongAnswersSelected: string[];   // Which wrong options they've tried
    hintsAlreadySeen: string[];
    timeOnQuestionSeconds: number;
    masteryLevel: number;
  };

  archetype: ArchetypeInfo;
}

export interface SocraticCoachResponse {
  success: boolean;
  thinkingProcess?: string;      // AI's reasoning (for logging)
  nextQuestion?: string;         // The Socratic question to ask
  targetInsight?: string;        // What we hope they'll realize
  fallbackHint?: string;         // Gentler nudge if still stuck
  error?: string;
  processingTime?: number;
}

// =============================================================================
// STUDY PLAN TYPES
// =============================================================================

export interface StudyPlanRequest {
  studentProfile: {
    userId: string;
    targetExamDate?: string;
    weeklyAvailableHours: number;
    preferredSessionLength: number;  // minutes
  };

  progressAcrossArchetypes: Array<{
    archetypeId: ArchetypeId;
    archetypeName: string;
    masteryLevel: number;
    questionsAttempted: number;
    accuracy: number;
    lastPracticed: string;
    commonErrors: DistractorType[];
  }>;

  diagnosticResults?: {
    overallReadiness: number;
    weakestArchetypes: ArchetypeId[];
    strongestArchetypes: ArchetypeId[];
  };
}

export interface StudyPlanResponse {
  success: boolean;

  overallStrategy?: string;

  priorityArchetypes?: Array<{
    archetypeId: ArchetypeId;
    reason: string;
    suggestedTimeMinutes: number;
    specificFocus: string;
    targetMilestone: string;
  }>;

  weeklySchedule?: Record<string, {
    archetype: ArchetypeId;
    duration: number;
    focus: string;
  }>;

  maintenanceArchetypes?: ArchetypeId[];

  weeklyGoals?: string[];

  motivationalMessage?: string;

  error?: string;
  processingTime?: number;
}

// =============================================================================
// CONCEPT EXPLAINER TYPES
// =============================================================================

export interface ConceptExplainerRequest {
  concept: {
    name: string;           // e.g., "Reverse Percentage"
    definition: string;
    methodology: string[];
    examples: string[];
  };

  studentContext: {
    previousExplanationsSeen: string[];  // Don't repeat
    preferredLearningStyle?: 'visual' | 'verbal' | 'example-based';
    relatedConceptsMastered: string[];   // What they already know
    gradeLevel: number;
  };

  specificConfusion?: string;  // If student described what confuses them
}

export interface ConceptExplainerResponse {
  success: boolean;

  visualExplanation?: {
    explanation: string;
    diagram: string;
    example: string;
  };

  analogyExplanation?: {
    explanation: string;
    analogy: string;
    example: string;
  };

  proceduralExplanation?: {
    explanation: string;
    steps: string[];
    example: string;
  };

  recommendedFirst?: 'visual' | 'analogy' | 'procedural';
  whyThisApproach?: string;

  error?: string;
  processingTime?: number;
}

// =============================================================================
// COMMON TYPES
// =============================================================================

export interface AITutoringMetadata {
  model: string;
  processingTime: number;
  tokensUsed?: number;
  requestId?: string;
}

export type ExplanationApproach =
  | 'visual'       // Diagrams, spatial reasoning
  | 'algebraic'    // Equations, formulas
  | 'analogy'      // Real-world comparisons
  | 'stepByStep'   // Procedural breakdown
  | 'contrast';    // Compare correct vs incorrect

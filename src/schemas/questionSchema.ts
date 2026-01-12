import { z } from 'zod';

// =============================================================================
// LEARNING ARC QUESTION SCHEMA
// Extends base FirestoreQuestion with progressive learning arc metadata
// =============================================================================

// Hint Schema
export const HintSchema = z.object({
  level: z.number().min(1).max(3),
  content: z.string().min(10).max(500),
  revealsCriticalInfo: z.boolean(),
});

// MCQ Option Schema
export const MCQOptionSchema = z.object({
  id: z.enum(['A', 'B', 'C', 'D']),
  text: z.string().min(1).max(500),
  isCorrect: z.boolean(),
  feedback: z.string().min(10).max(300).optional(),
});

// Curriculum Schema - Supports all NSW subjects
export const CurriculumSchema = z.object({
  system: z.string().min(1), // "NSW Science K-10 Syllabus", "NSW Mathematics K-10", "NSW English K-10"
  codes: z.array(z.string().regex(/^AC[A-Z]{3,4}\d{3,4}$/)), // ACSSU151, ACMNA188, ACELA1518, ACHHS144
  year: z.number().min(6).max(12),
  subject: z.enum(['science', 'mathematics', 'english', 'history', 'geography', 'pdhpe']),
  strand: z.string().min(1), // "Chemical Sciences", "Number and Algebra", "Language"
  substrand: z.string().optional(),
});

// Learning Arc Schema (NEW - for progressive learning)
export const LearningArcSchema = z.object({
  phase: z.number().min(1).max(4), // 1=Foundation, 2=Application, 3=Connection, 4=Mastery
  phasePosition: z.number().min(1).max(20), // Position within phase (1-20)
  conceptsUsed: z.array(z.string()), // Concept IDs from concept map
  buildsOn: z.array(z.string()), // Previous question IDs this builds on
  preparesFor: z.array(z.string()), // Future questions this prepares for
});

// Pedagogy Schema (NEW - for question type classification)
export const PedagogySchema = z.object({
  type: z.enum(['scaffolded', 'phenomenon', 'misconception', 'socratic']),
  targetFeeling: z.string().min(1), // "I can do this!", "Aha!", etc.
});

// Rich Content Schema (NEW - for formatting metadata)
export const RichContentSchema = z.object({
  hasEquations: z.boolean(),   // LaTeX/KaTeX math
  hasTables: z.boolean(),      // Markdown tables
  hasGraphs: z.boolean(),      // Data visualizations
  hasDiagrams: z.boolean(),    // Mermaid diagrams (flowcharts, sequences, etc.)
  hasCode: z.boolean(),        // Code blocks
});

// Paper Metadata Schema
export const PaperMetadataSchema = z.object({
  paperId: z.string().optional(),
  title: z.string().optional(),
  section: z.string().min(1), // "science"
  setId: z.string().min(1), // "year8-science-states-of-matter-medium"
  sequenceInPaper: z.number().optional(),
});

// AI Metadata Schema
export const AIMetadataSchema = z.object({
  generatedBy: z.string(), // "edu-generate-v1"
  generatedAt: z.string(), // ISO timestamp
  validationStatus: z.enum(['pending', 'validated', 'rejected']),
  validatedBy: z.string().optional(),
  validatedAt: z.string().optional(),
});

// Skills Schema (optional)
export const SkillsSchema = z.object({
  primarySkill: z.string(),
  secondarySkills: z.array(z.string()),
  competencyLevel: z.string(),
  cognitiveLevel: z.string(),
  prerequisites: z.array(z.string()),
}).optional();

// Searchable Tag Schema
export const SearchableTagSchema = z.object({
  category: z.enum(['topic', 'skill', 'year', 'assessment', 'pedagogy']),
  value: z.string(),
  weight: z.number().min(0).max(2),
});

// =============================================================================
// MAIN QUESTION SCHEMA
// =============================================================================

export const LearningArcQuestionSchema = z.object({
  // Identity
  questionId: z.string().regex(/^[a-z0-9-]+$/), // lowercase, numbers, hyphens

  // Question Content
  questionType: z.enum(['MCQ', 'SHORT_ANSWER', 'EXTENDED_RESPONSE']),
  stem: z.string().min(20).max(2000), // Supports markdown + LaTeX
  mcqOptions: z.array(MCQOptionSchema).length(4).optional(), // Required for MCQ

  // Answer
  solution: z.string().min(50).max(3000), // Supports markdown + LaTeX

  // Scaffolding
  hints: z.array(HintSchema).min(2).max(3),

  // Difficulty & Time
  difficulty: z.number().min(1).max(5), // 1=easy, 5=hard
  estimatedTime: z.number().min(30).max(600).optional(), // seconds
  qcs: z.number().min(0).max(100).optional(), // Question Complexity Score

  // Curriculum Alignment
  curriculum: CurriculumSchema,

  // Learning Arc (NEW)
  learningArc: LearningArcSchema,

  // Pedagogy (NEW)
  pedagogy: PedagogySchema,

  // Rich Content Flags (NEW)
  richContent: RichContentSchema.optional(),

  // Organization
  paperMetadata: PaperMetadataSchema,
  searchableTags: z.array(SearchableTagSchema).optional(),

  // Skills (optional)
  skills: SkillsSchema,

  // Reading Comprehension (optional)
  passageId: z.string().optional(),

  // Metadata
  aiMetadata: AIMetadataSchema.optional(),
  version: z.number().optional(),
  status: z.enum(['draft', 'published', 'archived']),
  createdAt: z.string().optional(), // ISO timestamp
  updatedAt: z.string().optional(), // ISO timestamp
  publishedAt: z.string().optional(), // ISO timestamp
});

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type LearningArcQuestion = z.infer<typeof LearningArcQuestionSchema>;
export type Hint = z.infer<typeof HintSchema>;
export type MCQOption = z.infer<typeof MCQOptionSchema>;
export type Curriculum = z.infer<typeof CurriculumSchema>;
export type LearningArc = z.infer<typeof LearningArcSchema>;
export type Pedagogy = z.infer<typeof PedagogySchema>;
export type RichContent = z.infer<typeof RichContentSchema>;
export type PaperMetadata = z.infer<typeof PaperMetadataSchema>;
export type AIMetadata = z.infer<typeof AIMetadataSchema>;
export type SearchableTag = z.infer<typeof SearchableTagSchema>;

// =============================================================================
// VALIDATION UTILITIES
// =============================================================================

/**
 * Validate a single question against the schema
 */
export function validateQuestion(question: unknown): {
  success: boolean;
  data?: LearningArcQuestion;
  errors?: z.ZodError;
} {
  const result = LearningArcQuestionSchema.safeParse(question);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error };
}

/**
 * Validate an array of questions
 */
export function validateQuestionSet(questions: unknown[]): {
  valid: LearningArcQuestion[];
  invalid: Array<{ index: number; errors: z.ZodError }>;
} {
  const valid: LearningArcQuestion[] = [];
  const invalid: Array<{ index: number; errors: z.ZodError }> = [];

  questions.forEach((q, index) => {
    const result = LearningArcQuestionSchema.safeParse(q);
    if (result.success) {
      valid.push(result.data);
    } else {
      invalid.push({ index, errors: result.error });
    }
  });

  return { valid, invalid };
}

/**
 * Validate MCQ has exactly one correct answer
 */
export function validateMCQCorrectness(options: MCQOption[]): boolean {
  const correctCount = options.filter(o => o.isCorrect).length;
  return correctCount === 1;
}

/**
 * Validate learning arc phase distribution
 */
export function validatePhaseDistribution(questions: LearningArcQuestion[]): {
  valid: boolean;
  distribution: Record<number, number>;
  expected: Record<number, number>;
} {
  const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
  const expected: Record<number, number> = { 1: 20, 2: 20, 3: 20, 4: 20 };

  questions.forEach(q => {
    distribution[q.learningArc.phase]++;
  });

  const valid = Object.keys(expected).every(
    phase => Math.abs(distribution[Number(phase)] - expected[Number(phase)]) <= 2
  );

  return { valid, distribution, expected };
}

/**
 * Validate pedagogy type distribution
 */
export function validatePedagogyDistribution(questions: LearningArcQuestion[]): {
  valid: boolean;
  distribution: Record<string, number>;
  expected: Record<string, number>;
} {
  const distribution: Record<string, number> = {
    scaffolded: 0,
    phenomenon: 0,
    misconception: 0,
    socratic: 0,
  };
  const expected: Record<string, number> = {
    scaffolded: 26,
    phenomenon: 20,
    misconception: 17,
    socratic: 17,
  };

  questions.forEach(q => {
    distribution[q.pedagogy.type]++;
  });

  const valid = Object.keys(expected).every(
    type => Math.abs(distribution[type] - expected[type]) <= 3
  );

  return { valid, distribution, expected };
}

/**
 * Validate question type distribution (MCQ vs Short Answer)
 */
export function validateQuestionTypeDistribution(questions: LearningArcQuestion[]): {
  valid: boolean;
  distribution: Record<string, number>;
  expected: Record<string, number>;
} {
  const distribution: Record<string, number> = {
    MCQ: 0,
    SHORT_ANSWER: 0,
    EXTENDED_RESPONSE: 0,
  };
  const expected: Record<string, number> = {
    MCQ: 40,
    SHORT_ANSWER: 40,
    EXTENDED_RESPONSE: 0,
  };

  questions.forEach(q => {
    distribution[q.questionType]++;
  });

  const valid =
    Math.abs(distribution.MCQ - expected.MCQ) <= 2 &&
    Math.abs(distribution.SHORT_ANSWER - expected.SHORT_ANSWER) <= 2;

  return { valid, distribution, expected };
}

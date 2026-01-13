import { z } from 'zod';

// =============================================================================
// NSW SELECTIVE QUESTION SCHEMA
// =============================================================================
// FILE: src/schemas/nsw-selective/archetypeSchema.ts
// DOMAIN: NSW Selective Exam Prep
// PURPOSE: Validation schemas for archetype-based exam questions
// DO NOT: Import curriculum/learning-arc schemas; these are independent

// =============================================================================
// DISTRACTOR TYPE ENUM
// =============================================================================

export const DistractorTypeSchema = z.enum([
  'partial_solution',
  'forward_calculation',
  'wrong_operation',
  'off_by_one',
  'unit_confusion',
  'sign_error',
  'misconception_answer',
  'place_value_error',
  'inverted_ratio',
  'formula_confusion',
  'middle_value_trap',
]);

// =============================================================================
// ARCHETYPE ID ENUM
// =============================================================================

export const ArchetypeIdSchema = z.enum([
  'qa1', 'qa2', 'qa3', 'qa4', 'qa5',
  'qa6', 'qa7', 'qa8', 'qa9', 'qa10',
  'qa11', 'qa12', 'qa13', 'qa14', 'qa15',
  'qa16', 'qa17', 'qa18', 'qa19', 'qa20',
]);

// =============================================================================
// NSW SELECTIVE METADATA SCHEMA
// =============================================================================

export const NswSelectiveMetadataSchema = z.object({
  // Required archetype identification
  archetype: z.string().min(5).max(100), // Human-readable name
  archetypeId: ArchetypeIdSchema,

  // Required concepts (3-8 items)
  conceptsRequired: z.array(z.string().min(3).max(50)).min(3).max(8),

  // Required distractor mapping for B, C, D, E (A is correct)
  distractorTypes: z.object({
    B: DistractorTypeSchema,
    C: DistractorTypeSchema,
    D: DistractorTypeSchema,
    E: DistractorTypeSchema,
  }),

  // Required methodology
  solutionApproach: z.string().min(20).max(300),
  methodologySteps: z.array(z.string().min(10).max(200)).min(3).max(6),

  // Required timing
  timeTarget: z.number().min(30).max(300), // 30 seconds to 5 minutes

  // Optional: tracked common errors
  commonErrors: z.array(z.string()).optional(),
});

// =============================================================================
// MCQ OPTION SCHEMA (5 options for NSW Selective)
// =============================================================================

export const NswSelectiveMCQOptionSchema = z.object({
  id: z.enum(['A', 'B', 'C', 'D', 'E']),
  text: z.string().min(1).max(500),
  isCorrect: z.boolean(),
  feedback: z.string().min(20).max(400), // Required and more detailed than curriculum
});

// =============================================================================
// HINT SCHEMA
// =============================================================================

export const NswSelectiveHintSchema = z.object({
  level: z.number().min(1).max(3),
  content: z.string().min(10).max(500),
  revealsCriticalInfo: z.boolean(),
});

// =============================================================================
// CURRICULUM SCHEMA (for NSW K-6)
// =============================================================================

export const NswSelectiveCurriculumSchema = z.object({
  system: z.string().min(1),
  codes: z.array(z.string().regex(/^[A-Z]{2}[0-9]-[A-Z0-9]+$/)), // MA3-5NA format
  year: z.literal(6), // NSW Selective targets Year 6
  subject: z.literal('Mathematics'),
  strand: z.string().min(1),
  substrand: z.string().optional(),
});

// =============================================================================
// PAPER METADATA SCHEMA
// =============================================================================

export const NswSelectivePaperMetadataSchema = z.object({
  section: z.literal('nsw-selective-mathematics'),
  setId: z.string().regex(/^nsw-sel-qa[0-9]+-set[0-9]+$/), // nsw-sel-qa13-set1
  sequenceInPaper: z.number().min(1).max(35),
});

// =============================================================================
// MAIN NSW SELECTIVE QUESTION SCHEMA
// =============================================================================

export const NswSelectiveQuestionSchema = z.object({
  // Identity
  questionId: z.string().regex(/^nsw-sel-qa[0-9]+-[0-9]+$/), // nsw-sel-qa13-001

  // Question Content
  questionType: z.literal('MCQ'),
  stem: z.string().min(20).max(2000),
  mcqOptions: z.array(NswSelectiveMCQOptionSchema).length(5), // Exactly 5 options

  // Answer
  solution: z.string().min(100).max(3000), // Detailed methodology

  // Scaffolding
  hints: z.array(NswSelectiveHintSchema).min(2).max(3),

  // NSW Selective specific (REQUIRED)
  nswSelective: NswSelectiveMetadataSchema,

  // Difficulty & Time
  difficulty: z.number().min(1).max(4), // 1-4 for NSW Selective
  estimatedTime: z.number().min(30).max(180), // 30 seconds to 3 minutes

  // Curriculum Alignment
  curriculum: NswSelectiveCurriculumSchema,

  // Organization
  paperMetadata: NswSelectivePaperMetadataSchema,

  // Status
  status: z.enum(['draft', 'published', 'archived']),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type NswSelectiveQuestion = z.infer<typeof NswSelectiveQuestionSchema>;
export type NswSelectiveMetadata = z.infer<typeof NswSelectiveMetadataSchema>;
export type NswSelectiveMCQOption = z.infer<typeof NswSelectiveMCQOptionSchema>;
export type NswSelectiveHint = z.infer<typeof NswSelectiveHintSchema>;
export type DistractorType = z.infer<typeof DistractorTypeSchema>;
export type ArchetypeId = z.infer<typeof ArchetypeIdSchema>;

// =============================================================================
// VALIDATION UTILITIES (Layer 5: Archetype Validation)
// =============================================================================

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Layer 5: Archetype-specific validation for NSW Selective questions
 * This is in addition to Layers 1-4 (schema, content, pedagogy, presentation)
 */
export function validateNswSelectiveQuestion(question: unknown): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // First, validate against schema
  const schemaResult = NswSelectiveQuestionSchema.safeParse(question);
  if (!schemaResult.success) {
    return {
      valid: false,
      errors: schemaResult.error.issues.map(i => `${i.path.join('.')}: ${i.message}`),
      warnings: [],
    };
  }

  const q = schemaResult.data;

  // ==========================================================================
  // Layer 5.1: MCQ Correctness Validation
  // ==========================================================================
  const correctCount = q.mcqOptions.filter(o => o.isCorrect).length;
  if (correctCount !== 1) {
    errors.push(`MCQ must have exactly 1 correct option, found ${correctCount}`);
  }

  // ==========================================================================
  // Layer 5.2: Distractor Quality Validation
  // ==========================================================================
  const distractorTypes = q.nswSelective.distractorTypes;
  const usedTypes = new Set([distractorTypes.B, distractorTypes.C, distractorTypes.D, distractorTypes.E]);

  if (usedTypes.size < 3) {
    warnings.push('Consider using more diverse distractor types (currently using fewer than 3 unique types)');
  }

  // Check feedback quality for incorrect options
  q.mcqOptions
    .filter(o => !o.isCorrect)
    .forEach(o => {
      if (o.feedback.length < 50) {
        warnings.push(`Option ${o.id} feedback may be too short (${o.feedback.length} chars). Consider adding more explanation.`);
      }
      if (!o.feedback.includes('instead') && !o.feedback.includes('should') && !o.feedback.includes('need')) {
        warnings.push(`Option ${o.id} feedback may not explain how to correct the error`);
      }
    });

  // ==========================================================================
  // Layer 5.3: Methodology Steps Validation
  // ==========================================================================
  const steps = q.nswSelective.methodologySteps;
  const hasRead = steps.some(s => s.toLowerCase().includes('read') || s.toLowerCase().includes('identify'));
  const hasCheck = steps.some(s => s.toLowerCase().includes('check') || s.toLowerCase().includes('verify'));
  const hasSolve = steps.some(s => s.toLowerCase().includes('solve') || s.toLowerCase().includes('calculate'));

  if (!hasRead) {
    warnings.push('Methodology steps should include a "Read/Identify" step');
  }
  if (!hasSolve) {
    warnings.push('Methodology steps should include a "Solve/Calculate" step');
  }
  if (!hasCheck) {
    warnings.push('Methodology steps should include a "Check/Verify" step');
  }

  // ==========================================================================
  // Layer 5.4: Time Target Validation
  // ==========================================================================
  const expectedTimeByDifficulty: Record<number, [number, number]> = {
    1: [30, 60],
    2: [45, 90],
    3: [60, 120],
    4: [90, 180],
  };

  const [minTime, maxTime] = expectedTimeByDifficulty[q.difficulty] || [30, 180];
  if (q.nswSelective.timeTarget < minTime || q.nswSelective.timeTarget > maxTime) {
    warnings.push(`Time target ${q.nswSelective.timeTarget}s may not match difficulty ${q.difficulty} (expected ${minTime}-${maxTime}s)`);
  }

  // ==========================================================================
  // Layer 5.5: SetId and QuestionId Consistency
  // ==========================================================================
  const archetypeFromId = q.questionId.match(/nsw-sel-(qa\d+)-/)?.[1];
  if (archetypeFromId !== q.nswSelective.archetypeId) {
    errors.push(`questionId archetype (${archetypeFromId}) doesn't match nswSelective.archetypeId (${q.nswSelective.archetypeId})`);
  }

  const archetypeFromSetId = q.paperMetadata.setId.match(/nsw-sel-(qa\d+)-/)?.[1];
  if (archetypeFromSetId !== q.nswSelective.archetypeId) {
    errors.push(`setId archetype (${archetypeFromSetId}) doesn't match nswSelective.archetypeId (${q.nswSelective.archetypeId})`);
  }

  // ==========================================================================
  // Layer 5.6: Hint Quality Validation
  // ==========================================================================
  const level3Hints = q.hints.filter(h => h.level === 3);
  if (level3Hints.length > 0 && !level3Hints.every(h => h.revealsCriticalInfo)) {
    warnings.push('Level 3 hints should typically have revealsCriticalInfo: true');
  }

  const level1Hints = q.hints.filter(h => h.level === 1);
  if (level1Hints.some(h => h.revealsCriticalInfo)) {
    errors.push('Level 1 hints should not reveal critical info');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate an array of NSW Selective questions
 */
export function validateNswSelectiveQuestionSet(questions: unknown[]): {
  valid: NswSelectiveQuestion[];
  invalid: Array<{ index: number; result: ValidationResult }>;
  summary: {
    total: number;
    valid: number;
    invalid: number;
    totalErrors: number;
    totalWarnings: number;
    archetypeDistribution: Record<string, number>;
    difficultyDistribution: Record<number, number>;
  };
} {
  const valid: NswSelectiveQuestion[] = [];
  const invalid: Array<{ index: number; result: ValidationResult }> = [];
  const archetypeDistribution: Record<string, number> = {};
  const difficultyDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
  let totalErrors = 0;
  let totalWarnings = 0;

  questions.forEach((q, index) => {
    const result = validateNswSelectiveQuestion(q);
    if (result.valid) {
      const parsed = NswSelectiveQuestionSchema.parse(q);
      valid.push(parsed);

      // Track distributions
      const archetype = parsed.nswSelective.archetypeId;
      archetypeDistribution[archetype] = (archetypeDistribution[archetype] || 0) + 1;
      difficultyDistribution[parsed.difficulty]++;
    } else {
      invalid.push({ index, result });
    }
    totalErrors += result.errors.length;
    totalWarnings += result.warnings.length;
  });

  return {
    valid,
    invalid,
    summary: {
      total: questions.length,
      valid: valid.length,
      invalid: invalid.length,
      totalErrors,
      totalWarnings,
      archetypeDistribution,
      difficultyDistribution,
    },
  };
}

/**
 * Validate distractor types are appropriate for the archetype
 */
export function validateDistractorsForArchetype(
  archetypeId: ArchetypeId,
  distractorTypes: Record<string, DistractorType>
): { valid: boolean; suggestions: string[] } {
  const suggestions: string[] = [];

  // Archetype-specific distractor recommendations
  const archetypeDistractorGuidance: Partial<Record<ArchetypeId, DistractorType[]>> = {
    qa13: ['forward_calculation', 'wrong_operation', 'misconception_answer'], // Reverse percentage
    qa4: ['off_by_one', 'sign_error', 'partial_solution'], // Time zones
    qa5: ['partial_solution', 'wrong_operation', 'formula_confusion'], // Simultaneous equations
    qa3: ['off_by_one', 'partial_solution', 'formula_confusion'], // 3D shapes
    qa20: ['misconception_answer', 'wrong_operation', 'partial_solution'], // Speed-distance-time
  };

  const recommended = archetypeDistractorGuidance[archetypeId];
  if (recommended) {
    const used = Object.values(distractorTypes);
    const missingRecommended = recommended.filter(r => !used.includes(r));
    if (missingRecommended.length > 0) {
      suggestions.push(`Consider using these distractor types for ${archetypeId}: ${missingRecommended.join(', ')}`);
    }
  }

  return {
    valid: true, // This is advisory, not blocking
    suggestions,
  };
}

/**
 * Validate difficulty distribution for a set of questions
 */
export function validateDifficultyProgression(questions: NswSelectiveQuestion[]): {
  valid: boolean;
  distribution: Record<number, number>;
  expected: Record<number, number>;
  message: string;
} {
  const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
  const expected: Record<number, number> = { 1: 5, 2: 10, 3: 5, 4: 5 }; // For 25 questions

  questions.forEach(q => {
    distribution[q.difficulty]++;
  });

  // Check if distribution roughly matches expected (within 2)
  let valid = true;
  const issues: string[] = [];

  Object.keys(expected).forEach(d => {
    const diff = Math.abs(distribution[Number(d)] - expected[Number(d)]);
    if (diff > 2) {
      valid = false;
      issues.push(`Difficulty ${d}: expected ~${expected[Number(d)]}, got ${distribution[Number(d)]}`);
    }
  });

  return {
    valid,
    distribution,
    expected,
    message: valid
      ? 'Difficulty distribution is appropriate'
      : `Difficulty imbalance: ${issues.join('; ')}`,
  };
}

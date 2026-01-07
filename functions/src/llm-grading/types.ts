// LLM Grading Types and Interfaces
// Based on COMBINED_LLM_GRADING_SPEC_v0_DEEPSEEK.md

import { Type, Static } from "@sinclair/typebox";

// Core request interface for grading
export interface GradeRequest {
  stem: string;
  referenceAnswer: string;
  studentAnswer: string;
  meta: {
    subject: "Science" | "English";
    topic?: string;
    year?: number;
    qcs?: number;
  };
}

// LLM Provider Adapter interface
export interface LlmAdapter {
  name(): string;
  grade(req: GradeRequest, opts?: { repair?: boolean; signal?: AbortSignal }): Promise<GradeJSON>;
}

// JSON Schema for LLM response validation (TypeBox)
export const GradeJsonSchema = Type.Object({
  overall: Type.Object({
    pct: Type.Number({ minimum: 0, maximum: 1 }),
    label: Type.String(),
    confidence: Type.Number({ minimum: 0, maximum: 1 })
  }),
  inferred_key_facts: Type.Array(Type.Object({
    id: Type.String(),
    text: Type.String()
  }), { minItems: 1, maxItems: 8 }),
  concepts: Type.Object({
    hit: Type.Array(Type.String()),
    partial: Type.Array(Type.Object({
      id: Type.String(),
      reason: Type.String()
    })),
    missing: Type.Array(Type.String())
  }),
  misconceptions: Type.Array(Type.String()),
  contradictions: Type.Array(Type.String()),
  explanations: Type.Object({
    student_friendly: Type.String(),
    parent_friendly: Type.String()
  })
});

// TypeScript type from schema
export type GradeJSON = Static<typeof GradeJsonSchema>;

// HTTP Request/Response types
export const GradeRequestSchema = Type.Object({
  attemptId: Type.String(),
  questionId: Type.String(),
  studentAnswer: Type.String({ minLength: 1, maxLength: 1200 }),
  options: Type.Optional(Type.Object({
    persistWeakRubric: Type.Optional(Type.Boolean()),
    escalation: Type.Optional(Type.Union([
      Type.Literal("auto"),
      Type.Literal("never"),
      Type.Literal("always")
    ])),
    maxLatencyMs: Type.Optional(Type.Number({ minimum: 1000, maximum: 10000 }))
  }))
});

export type GradeRequestBody = Static<typeof GradeRequestSchema>;

// Grading block structure for Firestore
export interface GradingBlock {
  engine: string;
  provider: string;
  cascade: {
    stage: "A" | "B" | "C"; // A=heuristic, B=chat, C=escalated
    escalatedTo?: string;
  };
  overall: {
    pct: number;
    label: "correct" | "mostly-correct" | "partial" | "incorrect";
    confidence: number;
  };
  inferred_key_facts: Array<{ id: string; text: string }>;
  concepts: {
    hit: string[];
    partial: Array<{ id: string; reason: string }>;
    missing: string[];
  };
  misconceptions: string[];
  contradictions: string[];
  feedback: {
    student: string;
    parent: string;
  };
  score: {
    basePct: number;
    penalties: {
      idk: number;
      hints: number;
    };
    finalPct: number;
  };
  pointsAwarded: number;
  refs: {
    questionId: string;
    setId?: string;
  };
  ts: any; // Firestore timestamp
}

// Weak rubric storage
export interface WeakRubricDoc {
  source: "llm_v0";
  inferred_key_facts: Array<{ id: string; text: string }>;
  misconceptions?: string[];
  contentHash: string;
  approved: boolean;
  usageCount: number;
  createdAt: any; // Firestore timestamp
}

// Error types
export class GradingError extends Error {
  constructor(public code: string, message: string, public statusCode: number = 400) {
    super(message);
    this.name = "GradingError";
  }
}

// Escalation reasons
export type EscalationReason = 
  | "low_confidence"
  | "boundary_score"
  | "invalid_json"
  | "manual_request";

// Provider configuration
export interface ProviderConfig {
  name: string;
  baseURL: string;
  apiKey: string;
  defaultModel: string;
  strongModel?: string;
  maxTokens: number;
  temperature: number;
}
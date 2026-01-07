// Type definitions for AI concept chat functionality
// Supports universal concept card structure for any subject/topic

import { Type, Static } from "@sinclair/typebox";

// Request types
export const ConceptContextSchema = Type.Object({
  keyQuestion: Type.String({ minLength: 1, maxLength: 500 }),
  conceptOverview: Type.String({ maxLength: 2000 }),
  coreExplanation: Type.String({ maxLength: 5000 }),
  vocabulary: Type.Record(Type.String(), Type.String()),
  misconceptions: Type.Array(Type.String(), { maxItems: 20 }),
  subject: Type.String({ minLength: 1, maxLength: 100 }),
  competencyLevel: Type.Union([
    Type.Literal('foundation'),
    Type.Literal('developing'),
    Type.Literal('consolidating'),
    Type.Literal('extending'),
    Type.Literal('proficient')
  ]),
  cognitiveLevel: Type.Union([
    Type.Literal('remember'),
    Type.Literal('understand'),
    Type.Literal('apply'),
    Type.Literal('analyze'),
    Type.Literal('evaluate'),
    Type.Literal('create')
  ]),
  learningObjectives: Type.Array(Type.String(), { maxItems: 10 }),
  keyConcepts: Type.Array(Type.String(), { maxItems: 20 }),
});

export const ConceptChatOptionsSchema = Type.Object({
  provider: Type.Optional(Type.Union([
    Type.Literal('auto'),
    Type.Literal('gemini'),
    Type.Literal('deepseek')
  ])),
  includeExamples: Type.Optional(Type.Boolean()),
  maxComplexity: Type.Optional(Type.Union([
    Type.Literal('auto'),
    Type.Literal('basic'),
    Type.Literal('intermediate'),
    Type.Literal('advanced')
  ])),
  includeFollowUps: Type.Optional(Type.Boolean()),
  maxResponseLength: Type.Optional(Type.Number({ minimum: 1, maximum: 10 })),
  // Behavioral science enhancements
  socraticMode: Type.Optional(Type.Boolean()), // Guide with questions instead of direct answers
});

export const ConceptChatRequestSchema = Type.Object({
  conceptCardId: Type.String({ minLength: 1, maxLength: 100 }),
  question: Type.String({ minLength: 1, maxLength: 500 }),
  conceptContext: ConceptContextSchema,
  options: Type.Optional(ConceptChatOptionsSchema),
});

// TypeScript types
export type ConceptContext = Static<typeof ConceptContextSchema>;
export type ConceptChatOptions = Static<typeof ConceptChatOptionsSchema>;
export type ConceptChatRequest = Static<typeof ConceptChatRequestSchema>;

// Processed context for AI understanding
export interface ProcessedContext {
  originalContext: ConceptContext;
  vocabularyMap: Record<string, string>;
  keyConcepts: string[];
  relevantTerms: Set<string>;
  subject: string;
  estimatedAgeRange: string;
  complexityLevel: 'basic' | 'intermediate' | 'advanced';
  educationalKeywords: string[];
  topicScope: string[];
}

// Response types
export interface ContentMetadata {
  topicRelevant: boolean;
  ageAppropriate: boolean;
  educationalValue: 'low' | 'medium' | 'high';
  complexity: 'basic' | 'intermediate' | 'advanced';
  confidenceScore: number; // 0.0 to 1.0
  wasFiltered: boolean;
}

export interface EducationalResource {
  title: string;
  description: string;
  type: 'widget' | 'concept' | 'example' | 'practice';
  url?: string;
  metadata?: Record<string, any>;
}

export interface ConceptChatResponse {
  ok: boolean;
  response?: string;
  provider: string;
  processingTime: number;
  contentMetadata?: ContentMetadata;
  suggestedFollowUps?: string[];
  educationalResources?: EducationalResource[];
  error?: string;
  conversationSessionId?: string; // For conversation continuity
}

// AI prompt structure
export interface EducationalPrompt {
  systemPrompt: string;
  userPrompt: string;
  maxTokens: number;
  includesExamples: boolean;
  maxComplexity: string;
}

// Provider selection
export interface ProviderSelection {
  name: 'gemini' | 'deepseek';
  reason: string;
  confidence: number;
}

// Validation results
export interface ValidationResult {
  isValid: boolean;
  reason?: string;
  confidenceScore?: number;
  topicRelevance?: number; // 0.0 to 1.0
  ageAppropriate?: boolean;
  educationalValue?: 'low' | 'medium' | 'high';
  wasFiltered?: boolean;
  filteredContent?: string;
  redirectMessage?: string;
}

export interface QuestionValidationResult {
  isValid: boolean;
  reason?: string;
  redirectMessage?: string;
  suggestedRephrase?: string;
}

// Formatted response
export interface FormattedResponse {
  content: string;
  suggestedFollowUps: string[];
  educationalResources: EducationalResource[];
}

// Request validation function
import Ajv from 'ajv';

const ajv = new Ajv({ 
  allErrors: true, 
  removeAdditional: true,
  useDefaults: true,
  coerceTypes: true,
});

const validateRequest = ajv.compile(ConceptChatRequestSchema);

export function validateConceptChatRequest(data: any): { isValid: boolean; errors: string[] } {
  const isValid = validateRequest(data);
  
  if (!isValid) {
    const errors = validateRequest.errors?.map(err => {
      const path = err.instancePath || err.schemaPath || 'root';
      return `${path}: ${err.message}`;
    }) || ['Unknown validation error'];
    
    return { isValid: false, errors };
  }

  // Additional business logic validation
  const additionalErrors: string[] = [];

  // Check question length and content
  if (typeof data.question === 'string' && data.question.trim().length < 3) {
    additionalErrors.push('Question is too short');
  }

  // Check for potentially inappropriate content (basic check)
  const inappropriatePatterns = [
    /personal\s+information/i,
    /private\s+data/i,
    /password/i,
    /address/i,
    /phone\s+number/i,
  ];

  const questionLower = (data?.question || '').toString().toLowerCase();
  for (const pattern of inappropriatePatterns) {
    if (pattern.test(questionLower)) {
      additionalErrors.push('Question contains potentially inappropriate requests');
      break;
    }
  }

  // Validate concept context has meaningful content
  const context = data?.conceptContext as any || {};
  if (!context?.keyQuestion && !context?.conceptOverview && 
      (!context?.vocabulary || Object.keys(context?.vocabulary || {}).length === 0)) {
    additionalErrors.push('Concept context lacks sufficient educational content');
  }

  return {
    isValid: additionalErrors.length === 0,
    errors: additionalErrors,
  };
}

// Error types
export class ConceptChatError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'ConceptChatError';
  }
}

export class ValidationError extends ConceptChatError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', 400);
  }
}

export class ContentSafetyError extends ConceptChatError {
  constructor(message: string) {
    super(message, 'CONTENT_SAFETY_ERROR', 400);
  }
}

export class ProviderError extends ConceptChatError {
  constructor(message: string, provider: string) {
    super(`${provider}: ${message}`, 'PROVIDER_ERROR', 502);
  }
}

export class TopicRelevanceError extends ConceptChatError {
  constructor(message: string) {
    super(message, 'TOPIC_RELEVANCE_ERROR', 400);
  }
}

// AI provider interface extensions
export interface EducationalResponseRequest {
  systemPrompt: string;
  userPrompt: string;
  maxTokens?: number;
}

// Extend existing AI adapter interfaces
declare module '../llm-grading/adapters/gemini' {
  interface BaseGeminiAdapter {
    generateEducationalResponse(request: EducationalResponseRequest): Promise<string>;
  }
}

declare module '../llm-grading/adapters/deepseek' {
  interface BaseDeepSeekAdapter {
    generateEducationalResponse(request: EducationalResponseRequest): Promise<string>;
  }
}
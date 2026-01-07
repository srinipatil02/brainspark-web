/**
 * Common types and interfaces for AI providers
 */

export interface AIProviderConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
  retryAttempts?: number;
}

export interface QuestionGenerationRequest {
  skillId: string;
  skillName: string;
  competencyLevel: string;
  questionType: 'MCQ' | 'SPECIFIC_INPUT' | 'SHORT_ANSWER';
  difficulty: number;
  subject: string;
  year: number;
  curriculumSystem: string;
  skillDetails?: any;
  // Advanced AI Configuration
  higherOrderThinking?: number;
  complexWordProblem?: number;
  customInstructions?: string;
  // Diversity Enhancement
  batchId?: string;
  sequenceNumber?: number;
  totalQuestions?: number;
}

export interface GeneratedQuestion {
  questionId: string;
  questionType: 'MCQ' | 'SPECIFIC_INPUT' | 'SHORT_ANSWER';
  stem: string;
  mcqOptions?: Array<{
    id: string;
    text: string;
    isCorrect: boolean;
    feedback?: string;
  }>;
  specificInput?: {
    expectedType: string;
    acceptableAnswers: Array<{
      value: string;
      tolerance?: number;
      format?: string;
    }>;
    units?: string;
    validationRules?: string[];
  };
  shortAnswer?: {
    maxWords: number;
    keyPoints: Array<{
      point: string;
      weight: number;
      required?: boolean;
    }>;
    rubricVersion?: string;
    sampleAnswers?: Array<{
      answer: string;
      score: number;
      feedback?: string;
    }>;
  };
  solution: string;
  hints: Array<{
    level: number;
    content: string;
    revealsCriticalInfo?: boolean;
  }>;
  widgets?: Array<{
    widgetType: string;
    config: any;
    placement: 'stem' | 'options' | 'solution' | 'hint';
  }>;
  curriculum: {
    system: string;
    codes: string[];
    year: number;
    subject: string;
    strand?: string;
    substrand?: string;
  };
  skills: {
    primarySkill: string;
    secondarySkills?: string[];
    competencyLevel: string;
    cognitiveLevel: string;
    prerequisites?: string[];
  };
  difficulty: number;
  estimatedTime: number;
  qcs: number;
  searchableTags: Array<{
    category: string;
    value: string;
    weight?: number;
  }>;
  aiMetadata: {
    generatedBy: string;
    generatedAt: string;
    promptVersion: string;
    seedPrompt: string;
    iterationCount?: number;
    validationStatus: 'generated' | 'reviewed' | 'approved' | 'rejected' | 'needs_revision';
    validatedBy?: string;
    validatedAt?: string;
    validationNotes?: string;
  };
  performanceMetrics?: {
    totalAttempts: number;
    correctAttempts: number;
    averageTimeSeconds: number;
    hintUsageRate: number;
    skipRate: number;
    lastUsed?: string;
    qualityScore?: number;
  };
  version: number;
  status: 'draft' | 'review' | 'approved' | 'published' | 'deprecated';
  createdAt: string;
  updatedAt?: string;
  publishedAt?: string;
}

export interface AIProviderResponse {
  success: boolean;
  question?: GeneratedQuestion;
  error?: string;
  metadata?: {
    model: string;
    tokensUsed?: number;
    processingTime?: number;
    requestId?: string;
  };
}

export interface AIProvider {
  readonly name: string;
  readonly modelId: string;
  generateQuestion(request: QuestionGenerationRequest): Promise<AIProviderResponse>;
  validateConfig(): boolean;
}

export type AIModelType = 
  | 'gemini-2-5-pro'
  | 'gemini-2-5-flash'
  | 'deepseek-chat'
  | 'deepseek-reasoner'
  | 'claude-sonnet-4';

export interface AIProviderError extends Error {
  code: 'AUTHENTICATION_ERROR' | 'RATE_LIMIT_ERROR' | 'VALIDATION_ERROR' | 'NETWORK_ERROR' | 'UNKNOWN_ERROR';
  details?: any;
  retryable?: boolean;
}
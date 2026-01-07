/**
 * Abstract base class for AI providers
 * Implements common functionality and enforces consistent interface
 */

import { logger } from 'firebase-functions';
import { 
  AIProvider, 
  AIProviderConfig, 
  QuestionGenerationRequest, 
  AIProviderResponse,
  AIProviderError,
  GeneratedQuestion
} from './types';
import { v4 as uuidv4 } from 'uuid';

export abstract class BaseAIProvider implements AIProvider {
  protected config: AIProviderConfig;
  public abstract readonly name: string;
  public abstract readonly modelId: string;

  constructor(config: AIProviderConfig) {
    this.config = {
      timeout: 30000, // 30 seconds default
      retryAttempts: 2,
      ...config
    };
  }

  /**
   * Generate a question using the specific provider implementation
   */
  public async generateQuestion(request: QuestionGenerationRequest): Promise<AIProviderResponse> {
    const startTime = Date.now();
    const requestId = uuidv4();
    
    try {
      logger.info(`🤖 [${this.name}] Starting question generation`, {
        requestId,
        model: this.modelId,
        skillId: request.skillId,
        questionType: request.questionType
      });

      // Validate configuration
      if (!this.validateConfig()) {
        throw this.createError('VALIDATION_ERROR', 'Invalid provider configuration');
      }

      // Validate request
      this.validateRequest(request);

      // Generate question using provider-specific implementation
      const question = await this.generateQuestionInternal(request, requestId);

      // Validate generated question
      this.validateGeneratedQuestion(question);

      const processingTime = Date.now() - startTime;

      logger.info(`✅ [${this.name}] Question generation completed`, {
        requestId,
        processingTime,
        questionId: question.questionId
      });

      return {
        success: true,
        question,
        metadata: {
          model: this.modelId,
          processingTime,
          requestId
        }
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      logger.error(`❌ [${this.name}] Question generation failed`, {
        requestId,
        processingTime,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        metadata: {
          model: this.modelId,
          processingTime,
          requestId
        }
      };
    }
  }

  /**
   * Provider-specific question generation logic
   */
  protected abstract generateQuestionInternal(
    request: QuestionGenerationRequest, 
    requestId: string
  ): Promise<GeneratedQuestion>;

  /**
   * Validate provider configuration
   */
  public validateConfig(): boolean {
    if (!this.config.apiKey || this.config.apiKey.trim() === '') {
      logger.error(`❌ [${this.name}] Missing API key`);
      return false;
    }
    return true;
  }

  /**
   * Validate generation request
   */
  protected validateRequest(request: QuestionGenerationRequest): void {
    const required = ['skillId', 'skillName', 'questionType', 'difficulty', 'subject', 'year'];
    
    for (const field of required) {
      if (!request[field as keyof QuestionGenerationRequest]) {
        throw this.createError('VALIDATION_ERROR', `Missing required field: ${field}`);
      }
    }

    if (request.difficulty < 1 || request.difficulty > 10) {
      throw this.createError('VALIDATION_ERROR', 'Difficulty must be between 1 and 10');
    }

    if (!['MCQ', 'SPECIFIC_INPUT', 'SHORT_ANSWER'].includes(request.questionType)) {
      throw this.createError('VALIDATION_ERROR', 'Invalid question type');
    }
  }

  /**
   * Validate generated question structure
   */
  protected validateGeneratedQuestion(question: GeneratedQuestion): void {
    if (!question.questionId || !question.stem || !question.solution) {
      throw this.createError('VALIDATION_ERROR', 'Generated question missing required fields');
    }

    if (question.questionType === 'MCQ') {
      if (!question.mcqOptions || question.mcqOptions.length < 2) {
        throw this.createError('VALIDATION_ERROR', 'MCQ questions must have at least 2 options');
      }
      
      const correctOptions = question.mcqOptions.filter(opt => opt.isCorrect).length;
      if (correctOptions !== 1) {
        throw this.createError('VALIDATION_ERROR', 'MCQ questions must have exactly one correct answer');
      }
    }

    if (question.stem.length < 10) {
      throw this.createError('VALIDATION_ERROR', 'Question stem too short');
    }
  }

  /**
   * Create standardized error
   */
  protected createError(
    code: AIProviderError['code'], 
    message: string, 
    details?: any,
    retryable = false
  ): AIProviderError {
    const error = new Error(message) as AIProviderError;
    error.code = code;
    error.details = details;
    error.retryable = retryable;
    return error;
  }

  /**
   * Generate unique question ID
   */
  protected generateQuestionId(): string {
    return `qb-${uuidv4()}`;
  }

  /**
   * Create default curriculum info
   */
  protected createCurriculumInfo(request: QuestionGenerationRequest) {
    return {
      system: request.curriculumSystem || 'NSW Mathematics K-10',
      codes: [`${request.subject.toUpperCase()}-${request.year}`],
      year: request.year,
      subject: request.subject,
      strand: 'Mathematics',
      substrand: request.skillName
    };
  }

  /**
   * Create default skills info
   */
  protected createSkillsInfo(request: QuestionGenerationRequest) {
    return {
      primarySkill: request.skillName,
      secondarySkills: [],
      competencyLevel: request.competencyLevel,
      cognitiveLevel: this.mapDifficultyToCognitiveLevel(request.difficulty),
      prerequisites: []
    };
  }

  /**
   * Map difficulty to cognitive level
   */
  protected mapDifficultyToCognitiveLevel(difficulty: number): string {
    if (difficulty <= 2) return 'remember';
    if (difficulty <= 4) return 'understand';
    if (difficulty <= 6) return 'apply';
    if (difficulty <= 8) return 'analyze';
    if (difficulty <= 9) return 'evaluate';
    return 'create';
  }

  /**
   * Create default searchable tags
   */
  protected createSearchableTags(request: QuestionGenerationRequest) {
    return [
      { category: 'subject', value: request.subject, weight: 1.0 },
      { category: 'year', value: request.year.toString(), weight: 0.9 },
      { category: 'skill', value: request.skillName, weight: 0.8 },
      { category: 'cognitive', value: this.mapDifficultyToCognitiveLevel(request.difficulty), weight: 0.7 }
    ];
  }
}
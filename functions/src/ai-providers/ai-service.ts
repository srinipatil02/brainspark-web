/**
 * AI Service
 * Main service for AI question generation with provider routing
 */

import { logger } from 'firebase-functions';
import { AIProviderFactory } from './provider-factory';
import { AIModelType, QuestionGenerationRequest, AIProviderResponse } from './types';

export class AIService {
  /**
   * Generate a question using the specified AI model
   */
  public static async generateQuestion(
    modelType: AIModelType,
    request: QuestionGenerationRequest
  ): Promise<AIProviderResponse> {
    const startTime = Date.now();
    
    logger.info(`🎯 Starting question generation`, {
      model: modelType,
      skillId: request.skillId,
      questionType: request.questionType,
      difficulty: request.difficulty
    });

    try {
      // Validate environment
      const envValidation = AIProviderFactory.validateEnvironment();
      if (!envValidation.valid) {
        logger.error(`❌ Missing API keys`, { missing: envValidation.missing });
        return {
          success: false,
          error: `Missing API keys: ${envValidation.missing.join(', ')}`
        };
      }

      // Get provider
      const provider = AIProviderFactory.createProvider(modelType);
      
      logger.info(`🔌 Using provider: ${provider.name} (${provider.modelId})`);

      // Generate question
      const result = await provider.generateQuestion(request);
      
      const totalTime = Date.now() - startTime;

      if (result.success) {
        logger.info(`✅ Question generation successful`, {
          model: modelType,
          totalTime,
          questionId: result.question?.questionId,
          questionType: result.question?.questionType
        });
      } else {
        logger.error(`❌ Question generation failed`, {
          model: modelType,
          totalTime,
          error: result.error
        });
      }

      // Add total processing time to metadata
      if (result.metadata) {
        result.metadata.processingTime = totalTime;
      }

      return result;

    } catch (error) {
      const totalTime = Date.now() - startTime;
      
      logger.error(`💥 AI Service error`, {
        model: modelType,
        totalTime,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        metadata: {
          model: modelType,
          processingTime: totalTime
        }
      };
    }
  }

  /**
   * Get available AI models with their capabilities
   */
  public static getAvailableModels() {
    return AIProviderFactory.getSupportedModels();
  }

  /**
   * Validate AI service configuration
   */
  public static validateConfiguration(): {
    valid: boolean;
    issues: string[];
    recommendations?: string[];
  } {
    const envValidation = AIProviderFactory.validateEnvironment();
    const issues: string[] = [];
    const recommendations: string[] = [];

    if (!envValidation.valid) {
      issues.push(`Missing API keys: ${envValidation.missing.join(', ')}`);
      
      envValidation.missing.forEach(key => {
        switch (key) {
          case 'GEMINI_API_KEY':
            recommendations.push('Get Gemini API key from https://aistudio.google.com/app/apikey');
            break;
          case 'ANTHROPIC_API_KEY':
            recommendations.push('Get Claude API key from https://console.anthropic.com/');
            break;
          case 'DEEPSEEK_API_KEY':
            recommendations.push('Get DeepSeek API key from https://platform.deepseek.com/');
            break;
        }
      });
    }

    return {
      valid: issues.length === 0,
      issues,
      recommendations: recommendations.length > 0 ? recommendations : undefined
    };
  }

  /**
   * Get service statistics
   */
  public static getServiceStats() {
    return {
      ...AIProviderFactory.getStats(),
      availableModels: this.getAvailableModels().length,
      configuration: this.validateConfiguration()
    };
  }

  /**
   * Test a specific AI provider
   */
  public static async testProvider(
    modelType: AIModelType,
    skillId = 'test-skill',
    skillName = 'Basic Addition'
  ): Promise<{
    success: boolean;
    responseTime?: number;
    error?: string;
    questionGenerated?: boolean;
  }> {
    const startTime = Date.now();

    try {
      const testRequest: QuestionGenerationRequest = {
        skillId,
        skillName,
        competencyLevel: 'foundation',
        questionType: 'MCQ',
        difficulty: 3,
        subject: 'mathematics',
        year: 3,
        curriculumSystem: 'Test Curriculum'
      };

      const result = await this.generateQuestion(modelType, testRequest);
      const responseTime = Date.now() - startTime;

      return {
        success: result.success,
        responseTime,
        error: result.error,
        questionGenerated: !!result.question
      };

    } catch (error) {
      return {
        success: false,
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error),
        questionGenerated: false
      };
    }
  }

  /**
   * Batch test all providers
   */
  public static async testAllProviders(): Promise<Record<string, {
    success: boolean;
    responseTime?: number;
    error?: string;
    questionGenerated?: boolean;
  }>> {
    const models = this.getAvailableModels();
    const results: Record<string, any> = {};

    logger.info(`🧪 Testing ${models.length} AI providers`);

    for (const model of models) {
      try {
        logger.info(`Testing ${model.name}...`);
        results[model.id] = await this.testProvider(model.id);
        
        if (results[model.id].success) {
          logger.info(`✅ ${model.name} test passed`);
        } else {
          logger.warn(`⚠️ ${model.name} test failed: ${results[model.id].error}`);
        }
        
      } catch (error) {
        logger.error(`❌ ${model.name} test error: ${error}`);
        results[model.id] = {
          success: false,
          error: error instanceof Error ? error.message : String(error),
          questionGenerated: false
        };
      }
    }

    return results;
  }
}
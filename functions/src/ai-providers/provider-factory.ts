/**
 * AI Provider Factory
 * Creates and configures AI provider instances based on model type
 */

import { logger } from 'firebase-functions';
import { AIProvider, AIModelType, AIProviderConfig } from './types';
import { GeminiProvider } from './gemini-provider';
import { ClaudeProvider } from './claude-provider';
import { DeepSeekProvider } from './deepseek-provider';

/**
 * Factory class for creating AI providers
 */
export class AIProviderFactory {
  private static providers = new Map<string, AIProvider>();

  /**
   * Create an AI provider instance
   */
  public static createProvider(modelType: AIModelType): AIProvider {
    const cacheKey = modelType;
    
    // Return cached provider if available
    if (this.providers.has(cacheKey)) {
      const provider = this.providers.get(cacheKey)!;
      logger.info(`🔄 Using cached provider for ${modelType}`);
      return provider;
    }

    logger.info(`🏭 Creating new provider for ${modelType}`);

    const config = this.getProviderConfig(modelType);
    let provider: AIProvider;

    try {
      switch (modelType) {
        case 'gemini-2-5-pro':
          provider = new GeminiProvider(config, 'gemini-2-5-pro');
          break;

        case 'gemini-2-5-flash':
          provider = new GeminiProvider(config, 'gemini-2-5-flash');
          break;

        case 'claude-sonnet-4':
          provider = new ClaudeProvider(config);
          break;

        case 'deepseek-chat':
          provider = new DeepSeekProvider(config, 'deepseek-chat');
          break;

        case 'deepseek-reasoner':
          provider = new DeepSeekProvider(config, 'deepseek-reasoner');
          break;

        default:
          throw new Error(`Unsupported AI model type: ${modelType}`);
      }

      // Validate configuration
      if (!provider.validateConfig()) {
        throw new Error(`Invalid configuration for ${modelType}`);
      }

      // Cache the provider
      this.providers.set(cacheKey, provider);
      
      logger.info(`✅ Provider created successfully for ${modelType}`);
      return provider;

    } catch (error) {
      logger.error(`❌ Failed to create provider for ${modelType}`, {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Get configuration for a specific provider
   */
  private static getProviderConfig(modelType: AIModelType): AIProviderConfig {
    const envVarName = this.getEnvVarName(modelType);
    const apiKey = process.env[envVarName];

    if (!apiKey) {
      throw new Error(`Missing API key for ${modelType}. Set ${envVarName} environment variable.`);
    }

    return {
      apiKey,
      timeout: 60000, // 60 seconds
      retryAttempts: 2
    };
  }

  /**
   * Map model type to environment variable name
   */
  private static getEnvVarName(modelType: AIModelType): string {
    switch (modelType) {
      case 'gemini-2-5-pro':
      case 'gemini-2-5-flash':
        return 'GEMINI_API_KEY';

      case 'claude-sonnet-4':
        return 'ANTHROPIC_API_KEY';

      case 'deepseek-chat':
      case 'deepseek-reasoner':
        return 'DEEPSEEK_API_KEY';

      default:
        throw new Error(`No environment variable mapping for ${modelType}`);
    }
  }

  /**
   * Get list of supported models with metadata
   */
  public static getSupportedModels(): Array<{
    id: AIModelType;
    name: string;
    description: string;
    capabilities: string[];
    provider: string;
  }> {
    return [
      {
        id: 'gemini-2-5-pro',
        name: 'Gemini 2.5 Pro',
        description: 'Google\'s most capable model for complex reasoning and analysis',
        capabilities: ['Advanced reasoning', 'Complex mathematics', 'Multi-step problems'],
        provider: 'Google'
      },
      {
        id: 'gemini-2-5-flash',
        name: 'Gemini 2.5 Flash',
        description: 'Fast and efficient model for quick question generation',
        capabilities: ['Fast generation', 'Standard mathematics', 'Quick responses'],
        provider: 'Google'
      },
      {
        id: 'claude-sonnet-4',
        name: 'Claude Sonnet 4',
        description: 'Anthropic\'s latest model with excellent reasoning and safety',
        capabilities: ['Excellent reasoning', 'Educational content', 'High quality output'],
        provider: 'Anthropic'
      },
      {
        id: 'deepseek-chat',
        name: 'DeepSeek Chat',
        description: 'Specialized model for conversational and educational content',
        capabilities: ['Educational focus', 'Clear explanations', 'Student-friendly'],
        provider: 'DeepSeek'
      },
      {
        id: 'deepseek-reasoner',
        name: 'DeepSeek Reasoner',
        description: 'Advanced reasoning model for complex problem solving',
        capabilities: ['Deep reasoning', 'Step-by-step solutions', 'Mathematical proofs'],
        provider: 'DeepSeek'
      }
    ];
  }

  /**
   * Validate that required API keys are available
   */
  public static validateEnvironment(): { valid: boolean; missing: string[] } {
    const requiredKeys = [
      'GEMINI_API_KEY',
      'ANTHROPIC_API_KEY',
      'DEEPSEEK_API_KEY'
    ];

    const missing = requiredKeys.filter(key => !process.env[key]);

    return {
      valid: missing.length === 0,
      missing
    };
  }

  /**
   * Clear provider cache (useful for testing)
   */
  public static clearCache(): void {
    this.providers.clear();
    logger.info('🗑️ AI provider cache cleared');
  }

  /**
   * Get provider statistics
   */
  public static getStats(): {
    cachedProviders: number;
    supportedModels: number;
    activeProviders: string[];
  } {
    return {
      cachedProviders: this.providers.size,
      supportedModels: this.getSupportedModels().length,
      activeProviders: Array.from(this.providers.keys())
    };
  }
}
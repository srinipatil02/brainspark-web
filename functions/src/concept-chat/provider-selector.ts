// Provider selection logic for AI concept chat
// Intelligently selects between Gemini and DeepSeek based on various factors

import { ProviderSelection } from './types';

/**
 * Manages AI provider selection with fallback mechanisms
 * Considers performance, availability, and task-specific requirements
 */
export class ProviderSelector {
  private readonly providerHealthCache = new Map<string, {
    isHealthy: boolean;
    lastChecked: number;
    responseTime: number;
  }>();

  private readonly healthCacheTimeout = 5 * 60 * 1000; // 5 minutes

  /**
   * Select optimal AI provider based on request characteristics
   */
  async selectProvider(
    requestedProvider: string,
    complexityLevel: string,
    questionLength?: number
  ): Promise<ProviderSelection> {
    console.log('🤖 Selecting AI provider:', {
      requested: requestedProvider,
      complexity: complexityLevel,
      questionLength,
    });

    // If specific provider requested and available, use it
    if (requestedProvider !== 'auto') {
      const providerAvailable = await this.checkProviderAvailability(requestedProvider as 'gemini' | 'deepseek');
      if (providerAvailable.isAvailable) {
        return {
          name: requestedProvider as 'gemini' | 'deepseek',
          reason: `User requested ${requestedProvider}`,
          confidence: 0.9,
        };
      } else {
        console.log(`⚠️ Requested provider ${requestedProvider} not available: ${providerAvailable.reason}`);
        // Fall through to auto-selection
      }
    }

    // Auto-select based on various factors
    return await this.autoSelectProvider(complexityLevel, questionLength);
  }

  /**
   * Auto-select provider based on task characteristics
   */
  private async autoSelectProvider(
    complexityLevel: string,
    questionLength?: number
  ): Promise<ProviderSelection> {
    const geminiHealth = await this.getProviderHealth('gemini');
    const deepseekHealth = await this.getProviderHealth('deepseek');

    console.log('📊 Provider health status:', {
      gemini: geminiHealth,
      deepseek: deepseekHealth,
    });

    // If only one provider is healthy, use it
    if (geminiHealth.isHealthy && !deepseekHealth.isHealthy) {
      return {
        name: 'gemini',
        reason: 'Gemini healthy, DeepSeek unavailable',
        confidence: 0.8,
      };
    }

    if (deepseekHealth.isHealthy && !geminiHealth.isHealthy) {
      return {
        name: 'deepseek',
        reason: 'DeepSeek healthy, Gemini unavailable',
        confidence: 0.8,
      };
    }

    // If neither provider is healthy, try the least recently failed
    if (!geminiHealth.isHealthy && !deepseekHealth.isHealthy) {
      const geminiLastCheck = this.providerHealthCache.get('gemini')?.lastChecked || 0;
      const deepseekLastCheck = this.providerHealthCache.get('deepseek')?.lastChecked || 0;
      
      const selectedProvider = geminiLastCheck < deepseekLastCheck ? 'gemini' : 'deepseek';
      return {
        name: selectedProvider,
        reason: 'Both providers unhealthy, trying least recently failed',
        confidence: 0.3,
      };
    }

    // Both providers are healthy - select based on task characteristics
    return this.selectBasedOnTaskCharacteristics(
      complexityLevel,
      questionLength,
      geminiHealth,
      deepseekHealth
    );
  }

  /**
   * Select provider based on task characteristics when both are available
   */
  private selectBasedOnTaskCharacteristics(
    complexityLevel: string,
    questionLength: number = 100,
    geminiHealth: { isHealthy: boolean; responseTime: number },
    deepseekHealth: { isHealthy: boolean; responseTime: number }
  ): ProviderSelection {
    let geminiScore = 0;
    let deepseekScore = 0;
    const reasons: string[] = [];

    // Factor 1: Complexity preference
    // Gemini 2.0 Flash tends to be better for educational explanations
    // DeepSeek Reasoner is better for complex logical reasoning
    if (complexityLevel === 'basic' || complexityLevel === 'intermediate') {
      geminiScore += 2;
      reasons.push('Gemini preferred for educational explanations');
    } else if (complexityLevel === 'advanced') {
      deepseekScore += 1;
      reasons.push('DeepSeek capable for advanced topics');
    }

    // Factor 2: Response time preference
    // Prefer faster provider for better user experience
    if (geminiHealth.responseTime < deepseekHealth.responseTime) {
      geminiScore += 1;
      reasons.push('Gemini responding faster');
    } else if (deepseekHealth.responseTime < geminiHealth.responseTime) {
      deepseekScore += 1;
      reasons.push('DeepSeek responding faster');
    }

    // Factor 3: Question length
    // Longer questions might benefit from different providers
    if (questionLength > 200) {
      deepseekScore += 1;
      reasons.push('DeepSeek good for complex questions');
    } else {
      geminiScore += 1;
      reasons.push('Gemini good for concise responses');
    }

    // Factor 4: Load balancing
    // Simple round-robin based on time
    const timeBasedSelection = Math.floor(Date.now() / 60000) % 2; // Switch every minute
    if (timeBasedSelection === 0) {
      geminiScore += 0.5;
      reasons.push('Load balancing favors Gemini');
    } else {
      deepseekScore += 0.5;
      reasons.push('Load balancing favors DeepSeek');
    }

    // Select winner
    const selectedProvider = geminiScore >= deepseekScore ? 'gemini' : 'deepseek';
    const confidence = Math.max(geminiScore, deepseekScore) / (geminiScore + deepseekScore + 1);

    console.log('🏆 Provider selection decision:', {
      geminiScore,
      deepseekScore,
      selected: selectedProvider,
      confidence,
      reasons,
    });

    return {
      name: selectedProvider,
      reason: reasons.join(', '),
      confidence,
    };
  }

  /**
   * Get fallback provider if primary fails
   */
  async getFallbackProvider(failedProvider: string): Promise<ProviderSelection | null> {
    const alternativeProvider = failedProvider === 'gemini' ? 'deepseek' : 'gemini';
    
    console.log(`🔄 Getting fallback for failed provider ${failedProvider}`);
    
    const availability = await this.checkProviderAvailability(alternativeProvider as 'gemini' | 'deepseek');
    
    if (availability.isAvailable) {
      return {
        name: alternativeProvider as 'gemini' | 'deepseek',
        reason: `Fallback from failed ${failedProvider}`,
        confidence: 0.6,
      };
    }

    console.log('❌ No fallback provider available');
    return null;
  }

  /**
   * Check if specific provider is available
   */
  private async checkProviderAvailability(provider: 'gemini' | 'deepseek'): Promise<{
    isAvailable: boolean;
    reason?: string;
  }> {
    // Check environment variables first
    const apiKeyEnvVar = provider === 'gemini' ? 'GEMINI_API_KEY' : 'DEEPSEEK_API_KEY';
    const hasApiKey = !!process.env[apiKeyEnvVar];

    if (!hasApiKey) {
      return {
        isAvailable: false,
        reason: `Missing ${apiKeyEnvVar} environment variable`,
      };
    }

    // Check cached health status
    const health = await this.getProviderHealth(provider);
    
    return {
      isAvailable: health.isHealthy,
      reason: health.isHealthy ? undefined : 'Provider reported unhealthy',
    };
  }

  /**
   * Get or check provider health status
   */
  private async getProviderHealth(provider: string): Promise<{
    isHealthy: boolean;
    responseTime: number;
  }> {
    const cached = this.providerHealthCache.get(provider);
    const now = Date.now();

    // Use cached result if recent
    if (cached && (now - cached.lastChecked) < this.healthCacheTimeout) {
      return {
        isHealthy: cached.isHealthy,
        responseTime: cached.responseTime,
      };
    }

    // Perform health check
    const healthResult = await this.performHealthCheck(provider);
    
    // Cache result
    this.providerHealthCache.set(provider, {
      isHealthy: healthResult.isHealthy,
      lastChecked: now,
      responseTime: healthResult.responseTime,
    });

    return healthResult;
  }

  /**
   * Perform actual health check for provider
   */
  private async performHealthCheck(provider: string): Promise<{
    isHealthy: boolean;
    responseTime: number;
  }> {
    console.log(`🔍 Health checking provider: ${provider}`);
    
    const startTime = Date.now();
    
    try {
      // Simple health check - verify API key and basic connectivity
      const apiKeyEnvVar = provider === 'gemini' ? 'GEMINI_API_KEY' : 'DEEPSEEK_API_KEY';
      const apiKey = process.env[apiKeyEnvVar];

      if (!apiKey) {
        return { isHealthy: false, responseTime: 0 };
      }

      // For basic health check, just verify the API key format
      // In production, you might want to make a simple API call
      const isValidApiKey = this.validateApiKeyFormat(apiKey, provider);
      
      const responseTime = Date.now() - startTime;
      
      console.log(`✅ Health check completed for ${provider}:`, {
        isHealthy: isValidApiKey,
        responseTime,
      });

      return {
        isHealthy: isValidApiKey,
        responseTime,
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      console.log(`❌ Health check failed for ${provider}:`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime,
      });

      return {
        isHealthy: false,
        responseTime,
      };
    }
  }

  /**
   * Validate API key format without making API calls
   */
  private validateApiKeyFormat(apiKey: string, provider: string): boolean {
    if (!apiKey || typeof apiKey !== 'string') {
      return false;
    }

    // Basic format validation
    switch (provider) {
      case 'gemini':
        // Gemini API keys typically start with 'AI' and are around 39 characters
        return apiKey.length > 30 && apiKey.length < 50;
        
      case 'deepseek':
        // DeepSeek API keys typically start with 'sk-' and are longer
        return apiKey.startsWith('sk-') && apiKey.length > 40;
        
      default:
        return false;
    }
  }

  /**
   * Record provider performance metrics for future selection
   */
  recordProviderPerformance(provider: string, metrics: {
    responseTime: number;
    success: boolean;
    errorType?: string;
  }): void {
    console.log(`📊 Recording performance for ${provider}:`, metrics);
    
    // Update health cache based on performance
    const cached = this.providerHealthCache.get(provider);
    if (cached) {
      this.providerHealthCache.set(provider, {
        ...cached,
        isHealthy: metrics.success,
        responseTime: metrics.responseTime,
        lastChecked: Date.now(),
      });
    }

    // In production, you might want to store these metrics in a database
    // for more sophisticated provider selection algorithms
  }

  /**
   * Get provider statistics for monitoring
   */
  getProviderStatistics(): Record<string, {
    isHealthy: boolean;
    responseTime: number;
    lastChecked: number;
  }> {
    const stats: Record<string, any> = {};
    
    for (const [provider, health] of this.providerHealthCache.entries()) {
      stats[provider] = {
        isHealthy: health.isHealthy,
        responseTime: health.responseTime,
        lastChecked: health.lastChecked,
        lastCheckedAgo: Date.now() - health.lastChecked,
      };
    }
    
    return stats;
  }

  /**
   * Force refresh provider health status
   */
  async refreshProviderHealth(provider?: string): Promise<void> {
    if (provider) {
      console.log(`🔄 Force refreshing health for ${provider}`);
      this.providerHealthCache.delete(provider);
      await this.getProviderHealth(provider);
    } else {
      console.log('🔄 Force refreshing health for all providers');
      this.providerHealthCache.clear();
      await Promise.all([
        this.getProviderHealth('gemini'),
        this.getProviderHealth('deepseek'),
      ]);
    }
  }
}
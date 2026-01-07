// functions/src/ai-insights/learning-insights-analyzer.ts

import * as functions from 'firebase-functions';
import { AIProviderFactory } from '../ai-providers/provider-factory';
import { AIModelType } from '../ai-providers/types';

interface LearningData {
  userId: string;
  timeframe: string;
  userProfile?: any;
  learningReport: any;
  progressData: any;
  historicalProgress: any[];
  recentActivity: any;
  attemptPatterns: any;
  conceptInteractions: any;
  timestamp: string;
}

interface InsightOptions {
  includeWeeklyProgress?: boolean;
  includeWeakAreaAnalysis?: boolean;
  includeNextStepsRecommendations?: boolean;
  includeLearningStyleAnalysis?: boolean;
  provider?: AIModelType;
  analysisDepth?: 'basic' | 'comprehensive';
}

/**
 * 🧠 AI Learning Insights Analyzer
 * Processes student learning data to generate personalized insights using LLMs
 */
export class LearningInsightsAnalyzer {
  constructor() {
    // Using existing AI provider infrastructure
  }

  /**
   * 🎯 Generate Comprehensive Learning Insights
   */
  async generateLearningInsights(
    learningData: LearningData,
    options: InsightOptions = {}
  ): Promise<any> {
    console.log('🧠 Generating AI learning insights for user:', learningData.userId);

    try {
      // Prepare comprehensive analysis prompt
      const analysisPrompt = this.buildAnalysisPrompt(learningData, options);
      
      // Choose LLM provider based on options
      const provider = options.provider || 'deepseek-chat';
      let insights: any;

      insights = await this.generateInsightsWithProvider(analysisPrompt, provider, learningData);

      // Enrich insights with additional analysis
      const enrichedInsights = await this.enrichInsights(insights, learningData);

      console.log('✅ Successfully generated learning insights');
      return {
        ok: true,
        insights: enrichedInsights,
        provider: provider,
        timestamp: new Date().toISOString(),
      };

    } catch (error) {
      console.error('❌ Error generating learning insights:', error);
      throw new functions.https.HttpsError('internal', 
        'Failed to generate learning insights', error);
    }
  }

  /**
   * 📝 Build Comprehensive Analysis Prompt
   */
  private buildAnalysisPrompt(learningData: LearningData, options: InsightOptions): string {
    const { userProfile, learningReport, progressData, attemptPatterns, conceptInteractions } = learningData;
    
    return `
As an expert educational AI analyst for the world's best learning platform, analyze this student's comprehensive learning data and provide deep, actionable insights.

STUDENT PROFILE:
- Age: ${userProfile?.age || 'Not specified'}
- Grade Level: ${userProfile?.gradeLevel || 'Not specified'}
- Learning Preferences: ${JSON.stringify(userProfile?.learningPreferences || {})}
- Streak Days: ${progressData?.streakDays || 0}
- Total Points: ${progressData?.weeklyProgress || 0} this week

PERFORMANCE DATA (${learningData.timeframe}):
${JSON.stringify(learningReport, null, 2)}

ATTEMPT PATTERNS:
${JSON.stringify(attemptPatterns, null, 2)}

CONCEPT CARD INTERACTIONS:
${JSON.stringify(conceptInteractions, null, 2)}

ANALYSIS REQUIREMENTS:
${options.includeWeeklyProgress ? '✅ Weekly Progress Summary' : '❌ Weekly Progress Summary'}
${options.includeWeakAreaAnalysis ? '✅ Weak Area Identification' : '❌ Weak Area Identification'}
${options.includeNextStepsRecommendations ? '✅ Next Steps Recommendations' : '❌ Next Steps Recommendations'}
${options.includeLearningStyleAnalysis ? '✅ Learning Style Analysis' : '❌ Learning Style Analysis'}

Please provide a comprehensive analysis in the following JSON format:

{
  "weeklyProgressSummary": "A warm, encouraging 2-3 sentence summary of their progress this week",
  "keyStrengths": ["List 3-4 specific strengths observed from their learning patterns"],
  "weakAreas": [
    {
      "subject": "Subject name",
      "skillArea": "Specific skill area",
      "description": "Clear description of the challenge",
      "severityScore": 0.0-1.0,
      "improvementStrategies": ["Specific actionable strategies"],
      "recommendedResource": "Specific resource or activity to help"
    }
  ],
  "nextSteps": [
    {
      "title": "Clear action title",
      "description": "Specific description of what to do",
      "priority": "high|medium|low",
      "estimatedTime": "Time estimate",
      "actionType": "practice|review|explore|challenge"
    }
  ],
  "learningStyleAnalysis": "Insights about how they learn best based on their interaction patterns",
  "motivationalMessage": "Personalized encouraging message that acknowledges their efforts and progress",
  "overallProgress": 0.0-1.0,
  "confidenceScore": 0-100
}

Focus on:
1. Identifying specific learning patterns from their attempts and interactions
2. Providing actionable, achievable recommendations
3. Being encouraging while honest about areas for growth
4. Personalizing insights to their demonstrated learning style
5. Connecting recommendations to available platform resources
`;
  }

  /**
   * 🤖 Generate Insights using AI Provider
   */
  private async generateInsightsWithProvider(
    prompt: string, 
    modelType: AIModelType,
    learningData: LearningData
  ): Promise<any> {
    console.log('🧠 Using AI provider for learning insights analysis...', modelType);
    
    try {
      // Create AI provider
      const provider = AIProviderFactory.createProvider(modelType);
      
      // Create a simple completion request using the existing infrastructure
      // For learning insights, we'll adapt it to work with our prompt
      const response = await this.callAIProviderForCompletion(provider, prompt);
      
      return this.parseAIResponse(response);
      
    } catch (error) {
      console.error('❌ AI Provider error:', error);
      // Fallback to static insights if AI fails
      return this.getFallbackInsights();
    }
  }

  /**
   * 🔧 Call AI Provider for Text Completion
   */
  private async callAIProviderForCompletion(provider: any, prompt: string): Promise<string> {
    // Since the existing AI providers are designed for question generation,
    // we'll need to make a direct API call for text completion
    // This is a simplified approach that works with the learning insights format
    
    const providerName = provider.name.toLowerCase();
    
    if (providerName.includes('gemini')) {
      return await this.callGeminiCompletion(prompt);
    } else if (providerName.includes('claude')) {
      return await this.callClaudeCompletion(prompt);
    } else if (providerName.includes('deepseek')) {
      return await this.callDeepSeekCompletion(prompt);
    } else {
      throw new Error(`Unsupported provider: ${providerName}`);
    }
  }

  private async callGeminiCompletion(prompt: string): Promise<string> {
    // Direct Gemini API call for text completion
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2000,
          responseMimeType: 'application/json'
        }
      })
    });
    
    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  }

  private async callClaudeCompletion(prompt: string): Promise<string> {
    // Direct Claude API call for text completion
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 2000,
        temperature: 0.7,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    });
    
    const data = await response.json();
    return data.content[0].text;
  }

  private async callDeepSeekCompletion(prompt: string): Promise<string> {
    // Direct DeepSeek API call for text completion
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{
          role: 'user',
          content: prompt
        }],
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: 'json_object' }
      })
    });
    
    const data = await response.json();
    return data.choices[0].message.content;
  }

  /**
   * 🎯 Parse AI Response and Validate Structure
   */
  private parseAIResponse(content: string): any {
    try {
      const parsed = JSON.parse(content);
      
      // Validate required fields
      const requiredFields = [
        'weeklyProgressSummary',
        'keyStrengths', 
        'weakAreas',
        'nextSteps',
        'learningStyleAnalysis',
        'motivationalMessage',
        'overallProgress',
        'confidenceScore'
      ];
      
      for (const field of requiredFields) {
        if (!(field in parsed)) {
          console.warn(`Missing required field: ${field}`);
          parsed[field] = this.getDefaultValue(field);
        }
      }
      
      return parsed;
      
    } catch (error) {
      console.error('❌ Failed to parse AI response, using fallback:', error);
      return this.getFallbackInsights();
    }
  }

  /**
   * 🔧 Get Default Values for Missing Fields
   */
  private getDefaultValue(field: string): any {
    const defaults: Record<string, any> = {
      weeklyProgressSummary: "Great work this week! You're building excellent learning momentum.",
      keyStrengths: ["Problem-solving", "Persistence", "Growth mindset"],
      weakAreas: [],
      nextSteps: [{
        title: "Continue Exploring",
        description: "Keep up your excellent learning pace!",
        priority: "medium",
        estimatedTime: "15 minutes",
        actionType: "explore"
      }],
      learningStyleAnalysis: "You learn best through hands-on practice and visual examples.",
      motivationalMessage: "You're doing amazingly well! Keep up the fantastic work! 🌟",
      overallProgress: 0.75,
      confidenceScore: 85,
    };
    
    return defaults[field];
  }

  /**
   * 📊 Enrich Insights with Additional Analysis
   */
  private async enrichInsights(insights: any, learningData: LearningData): Promise<any> {
    // Add timestamp and metadata
    insights.generatedAt = new Date().toISOString();
    insights.analysisVersion = '1.0';
    
    // Add performance metrics
    insights.performanceMetrics = this.calculatePerformanceMetrics(learningData);
    
    // Add learning trajectory
    insights.learningTrajectory = this.analyzeLearningTrajectory(learningData);
    
    // Add engagement insights
    insights.engagementInsights = this.analyzeEngagement(learningData);
    
    return insights;
  }

  /**
   * 📈 Calculate Performance Metrics
   */
  private calculatePerformanceMetrics(learningData: LearningData): any {
    const { attemptPatterns, conceptInteractions } = learningData;
    
    return {
      overallAccuracy: this.calculateOverallAccuracy(attemptPatterns),
      subjectStrengths: this.identifySubjectStrengths(attemptPatterns),
      consistencyScore: this.calculateConsistencyScore(learningData.historicalProgress),
      engagementLevel: this.calculateEngagementLevel(conceptInteractions),
    };
  }

  /**
   * 📊 Analyze Learning Trajectory
   */
  private analyzeLearningTrajectory(learningData: LearningData): any {
    const { historicalProgress } = learningData;
    
    if (!historicalProgress || historicalProgress.length < 2) {
      return { trend: 'stable', confidence: 'low' };
    }
    
    // Calculate trend from historical progress
    const progressValues = historicalProgress.map(p => p.points || 0);
    const trend = this.calculateTrend(progressValues);
    
    return {
      trend: trend > 0.1 ? 'improving' : trend < -0.1 ? 'declining' : 'stable',
      rate: Math.abs(trend),
      confidence: progressValues.length >= 5 ? 'high' : 'medium',
    };
  }

  /**
   * 🎯 Analyze Engagement Patterns
   */
  private analyzeEngagement(learningData: LearningData): any {
    const { conceptInteractions, attemptPatterns } = learningData;
    
    return {
      sessionFrequency: attemptPatterns.activityDays || 0,
      avgSessionLength: this.calculateAvgSessionLength(conceptInteractions),
      explorationDepth: this.calculateExplorationDepth(conceptInteractions),
      persistenceLevel: this.calculatePersistenceLevel(attemptPatterns),
    };
  }

  // Helper calculation methods
  private calculateOverallAccuracy(attemptPatterns: any): number {
    const subjectPerformance = attemptPatterns.subjectPerformance || {};
    const accuracies = Object.values(subjectPerformance).map((perf: any) => perf.accuracy || 0);
    return accuracies.length > 0 ? accuracies.reduce((a, b) => a + b, 0) / accuracies.length : 0;
  }

  private identifySubjectStrengths(attemptPatterns: any): string[] {
    const subjectPerformance = attemptPatterns.subjectPerformance || {};
    return Object.entries(subjectPerformance)
      .filter(([_, perf]: [string, any]) => perf.accuracy > 0.7)
      .map(([subject, _]) => subject);
  }

  private calculateConsistencyScore(historicalProgress: any[]): number {
    if (!historicalProgress || historicalProgress.length < 3) return 0.5;
    
    const points = historicalProgress.map(p => p.points || 0);
    const mean = points.reduce((a, b) => a + b, 0) / points.length;
    const variance = points.reduce((sum, point) => sum + Math.pow(point - mean, 2), 0) / points.length;
    const stdDev = Math.sqrt(variance);
    
    // Lower standard deviation = higher consistency
    return Math.max(0, 1 - (stdDev / mean));
  }

  private calculateEngagementLevel(conceptInteractions: any): number {
    const totalInteractions = conceptInteractions.totalInteractions || 0;
    const completionRate = this.calculateAverageCompletionRate(conceptInteractions);
    
    // Normalize engagement based on interactions and completion
    return Math.min(1, (totalInteractions * 0.1) * completionRate);
  }

  private calculateAverageCompletionRate(conceptInteractions: any): number {
    const completionRates = Object.values(conceptInteractions.completionRatesBySubject || {}) as number[];
    return completionRates.length > 0 
      ? completionRates.reduce((a: number, b: number) => a + b, 0) / completionRates.length
      : 0;
  }

  private calculateAvgSessionLength(conceptInteractions: any): number {
    const avgTimes = Object.values(conceptInteractions.avgTimePerSubject || {}) as number[];
    return avgTimes.length > 0
      ? avgTimes.reduce((a: number, b: number) => a + b, 0) / avgTimes.length
      : 0;
  }

  private calculateExplorationDepth(conceptInteractions: any): number {
    const uniqueCards = conceptInteractions.uniqueCards || 0;
    const totalInteractions = conceptInteractions.totalInteractions || 1;
    
    // Higher ratio means more exploration of different content
    return Math.min(1, uniqueCards / totalInteractions);
  }

  private calculatePersistenceLevel(attemptPatterns: any): number {
    const totalAttempts = attemptPatterns.totalAttempts || 0;
    const overallAccuracy = this.calculateOverallAccuracy(attemptPatterns);
    
    // High attempts with reasonable accuracy shows persistence
    return Math.min(1, (totalAttempts * 0.05) * (overallAccuracy + 0.3));
  }

  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;
    
    const n = values.length;
    const sumX = (n * (n + 1)) / 2;
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = values.reduce((sum, y, i) => sum + (i + 1) * y, 0);
    const sumXX = (n * (n + 1) * (2 * n + 1)) / 6;
    
    return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  }

  /**
   * 🛡️ Fallback Insights for Error Cases
   */
  private getFallbackInsights(): any {
    return {
      weeklyProgressSummary: "Great work this week! You're building excellent learning momentum.",
      keyStrengths: ["Problem-solving", "Persistence", "Growth mindset"],
      weakAreas: [],
      nextSteps: [{
        title: "Continue Exploring",
        description: "Keep up your excellent learning pace!",
        priority: "medium",
        estimatedTime: "15 minutes",
        actionType: "explore"
      }],
      learningStyleAnalysis: "You learn best through hands-on practice and visual examples.",
      motivationalMessage: "You're doing amazingly well! Keep up the fantastic work! 🌟",
      overallProgress: 0.75,
      confidenceScore: 85,
    };
  }
}
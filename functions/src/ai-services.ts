import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';
import * as admin from 'firebase-admin';
import { AIService, AIModelType, QuestionGenerationRequest } from './ai-providers';

/**
 * Enhanced AI question generation function with multiple AI provider support
 */
export const generateEnhancedQuestion = onCall(
  {
    region: 'us-central1',
    timeoutSeconds: 60,
    memory: '512MiB',
  },
  async (request) => {
    try {
      // Validate authentication
      if (!request.auth) {
        throw new HttpsError('unauthenticated', 'Authentication required');
      }

      // Extract parameters with detailed logging
      const { skillId, skillName, competencyLevel, questionType, difficulty, subject, year, aiModel } = request.data;
      
      logger.info('🚀 AI Question Generation Request Started', {
        userId: request.auth.uid,
        timestamp: new Date().toISOString(),
        model: aiModel
      });
      
      logger.info('📋 RECEIVED PARAMETERS:', {
        skillId,
        skillName,
        competencyLevel,
        questionType,
        difficulty,
        subject,
        year,
        aiModel,
        userId: request.auth.uid
      });

      // Validate required parameters
      if (!skillId || !skillName || !questionType || !difficulty) {
        throw new HttpsError('invalid-argument', 'Missing required parameters');
      }

      // Validate AI model
      const validModels: AIModelType[] = ['gemini-2-5-pro', 'gemini-2-5-flash', 'claude-sonnet-4', 'deepseek-chat', 'deepseek-reasoner'];
      const selectedModel = aiModel as AIModelType;
      
      if (!selectedModel || !validModels.includes(selectedModel)) {
        throw new HttpsError('invalid-argument', `Invalid AI model. Must be one of: ${validModels.join(', ')}`);
      }

      // Fetch detailed skill information from Firestore
      logger.info('📚 Fetching skill details from Firestore:', { skillId });
      let skillData: any = null;
      
      try {
        const skillDoc = await admin.firestore()
          .collection('universalSkills')
          .doc(skillId)
          .get();
          
        if (skillDoc.exists) {
          skillData = skillDoc.data();
          logger.info('✅ Skill data retrieved successfully:', {
            hasLearningObjectives: !!skillData?.learningObjectives,
            hasAssessmentCriteria: !!skillData?.assessmentCriteria,
            hasCommonMisconceptions: !!skillData?.commonMisconceptions,
            hasRealWorldApplications: !!skillData?.realWorldApplications
          });
        } else {
          logger.warn('⚠️ Skill document not found in Firestore:', { skillId });
        }
      } catch (error) {
        logger.error('❌ Failed to fetch skill data:', error);
        // Continue with basic prompt if skill data fetch fails
      }

      // Create question generation request
      const generationRequest: QuestionGenerationRequest = {
        skillId,
        skillName,
        competencyLevel,
        questionType: questionType as 'MCQ' | 'SPECIFIC_INPUT' | 'SHORT_ANSWER',
        difficulty,
        subject,
        year,
        curriculumSystem: 'NSW Mathematics K-10',
        skillDetails: skillData
      };

      // Generate question using the new AI service
      logger.info('🤖 Calling AI service for question generation', {
        model: selectedModel,
        request: {
          skillId: generationRequest.skillId,
          questionType: generationRequest.questionType,
          difficulty: generationRequest.difficulty
        }
      });

      const result = await AIService.generateQuestion(selectedModel, generationRequest);

      if (result.success && result.question) {
        logger.info('🎉 Question generation completed successfully:', {
          questionId: result.question.questionId,
          modelUsed: selectedModel,
          skillTested: skillName,
          questionType: result.question.questionType,
          processingTime: result.metadata?.processingTime
        });

        return {
          success: true,
          data: {
            question: result.question,
            metadata: {
              modelUsed: selectedModel,
              processingTime: result.metadata?.processingTime || 0,
              skillContext: !!skillData,
              requestId: result.metadata?.requestId
            }
          }
        };
      } else {
        logger.error('❌ Question generation failed:', {
          error: result.error,
          modelUsed: selectedModel,
          metadata: result.metadata
        });

        throw new HttpsError('internal', result.error || 'Question generation failed');
      }
      
    } catch (error: any) {
      logger.error('💥 Question generation failed completely:', {
        error: error?.message || 'Unknown error',
        code: error?.code,
        stack: error?.stack,
        userId: request.auth?.uid,
        model: request.data?.aiModel,
        skillId: request.data?.skillId
      });
      
      // If it's already an HttpsError, re-throw it
      if (error?.code && error?.message) {
        throw error;
      }
      
      throw new HttpsError('internal', `Question generation failed: ${error?.message || 'Unknown error'}`);
    }
  }
);

/**
 * Health check for AI services
 */
export const aiServicesHealth = onCall(
  {
    region: 'us-central1',
    timeoutSeconds: 30,
  },
  async (request) => {
    try {
      logger.info('🏥 AI Services Health Check Started');

      // Check AI service configuration
      const serviceConfig = AIService.validateConfiguration();
      
      if (!serviceConfig.valid) {
        logger.warn('⚠️ AI service configuration issues:', {
          issues: serviceConfig.issues,
          recommendations: serviceConfig.recommendations
        });
      }

      // Get service statistics
      const serviceStats = AIService.getServiceStats();
      
      logger.info('📊 AI Services Health Check Results:', {
        configuration: serviceConfig,
        stats: serviceStats
      });

      return {
        success: true,
        data: {
          status: serviceConfig.valid ? 'healthy' : 'degraded',
          configuration: serviceConfig,
          stats: serviceStats,
          services: {
            'enhanced-question-generator': serviceConfig.valid ? 'operational' : 'degraded',
            'hint-system': 'operational',
            'solution-generator': 'operational',
            'ai-providers': serviceStats.availableModels > 0 ? 'operational' : 'unavailable'
          },
          timestamp: new Date().toISOString()
        }
      };
      
    } catch (error: any) {
      logger.error('❌ AI services health check failed:', error);
      throw new HttpsError('internal', `Health check failed: ${error?.message || 'Unknown error'}`);
    }
  }
);

/**
 * Test AI providers endpoint for development and monitoring
 */
export const testAIProviders = onCall(
  {
    region: 'us-central1',
    timeoutSeconds: 120,
  },
  async (request) => {
    try {
      // Validate authentication (admin only)
      if (!request.auth) {
        throw new HttpsError('unauthenticated', 'Authentication required');
      }

      // TODO: Add admin role check here
      logger.info('🧪 AI Providers Test Started', {
        userId: request.auth.uid,
        timestamp: new Date().toISOString()
      });

      // Run tests on all providers
      const testResults = await AIService.testAllProviders();
      
      logger.info('📋 AI Provider Test Results:', testResults);

      return {
        success: true,
        data: {
          testResults,
          summary: {
            totalProviders: Object.keys(testResults).length,
            passedTests: Object.values(testResults).filter(result => result.success).length,
            failedTests: Object.values(testResults).filter(result => !result.success).length,
            averageResponseTime: Object.values(testResults)
              .filter(result => result.responseTime)
              .reduce((sum, result) => sum + (result.responseTime || 0), 0) /
              Object.values(testResults).filter(result => result.responseTime).length
          },
          timestamp: new Date().toISOString()
        }
      };

    } catch (error: any) {
      logger.error('❌ AI provider testing failed:', error);
      throw new HttpsError('internal', `Provider testing failed: ${error?.message || 'Unknown error'}`);
    }
  }
);
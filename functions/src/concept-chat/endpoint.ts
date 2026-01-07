// AI Concept Chat Cloud Function
// Provides educational chat support for any concept card topic/subject
// Uses existing AI adapter infrastructure (Gemini/DeepSeek)

import {onCall, HttpsError} from "firebase-functions/v2/https";
import { 
  generateGeminiEducationalResponse,
  generateDeepSeekEducationalResponse 
} from './ai-wrappers';
import { 
  validateConceptChatRequest, 
  ConceptChatRequest,
  ConceptChatResponse 
} from './types';
import { ConceptContextProcessor } from './context-processor';
import { ContentValidator } from './content-validator';
import { ProviderSelector } from './provider-selector';
import { ResponseFormatter } from './response-formatter';
import { EducationalPromptBuilder } from './prompt-builder';
import { conversationMemory, ConversationSession } from './conversation-memory';

/**
 * Main concept chat endpoint
 * Handles AI-powered educational conversations about concept card content
 */
export const conceptChat = onCall({
  invoker: 'public'
}, async (request) => {
  const startTime = Date.now();
  
  console.log('🚀 Concept Chat request started:', {
    timestamp: new Date().toISOString(),
    userId: request.auth?.uid,
    hasData: !!request.data,
  });

  try {
    // 1. Authentication check
    if (!request.auth) {
      console.error('❌ Unauthenticated request');
      throw new HttpsError('unauthenticated', 'Authentication required for concept chat');
    }

    // 2. Request validation
    const validation = validateConceptChatRequest(request.data);
    if (!validation.isValid) {
      console.error('❌ Request validation failed:', validation.errors);
      throw new HttpsError('invalid-argument', `Request validation failed: ${validation.errors.join(', ')}`);
    }

    const conceptRequest = request.data as ConceptChatRequest;
    console.log('✅ Request validated:', {
      conceptCardId: conceptRequest.conceptCardId,
      questionLength: conceptRequest.question.length,
      subject: conceptRequest.conceptContext.subject,
      cognitiveLevel: conceptRequest.conceptContext.cognitiveLevel,
      provider: conceptRequest.options?.provider || 'auto',
    });

    // Use shared processing logic with user ID from auth
    const response = await processConceptChatRequest(conceptRequest, startTime, request.auth?.uid);
    return response;

  } catch (error: any) {
    const totalDuration = Date.now() - startTime;
    console.error('❌ Concept chat failed:', {
      duration: totalDuration,
      error: error.message,
      code: error.code,
      stack: error.stack,
    });

    // Return user-friendly error
    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError('internal', 'Concept chat service temporarily unavailable');
  }
});

// HTTP endpoint removed - using only callable function like all other functions

/**
 * Shared processing logic for both callable and HTTP endpoints
 */
async function processConceptChatRequest(request: ConceptChatRequest, startTime: number, userId?: string): Promise<ConceptChatResponse> {
  // Use provided user ID or fallback to anonymous
  const authenticatedUserId = userId || 'anonymous';

  // 3. Process concept context for AI understanding
  const contextProcessor = new ConceptContextProcessor();
  const processedContext = await contextProcessor.process(request.conceptContext);
  
  console.log('📋 Context processed:', {
    vocabularyTerms: Object.keys(processedContext.vocabularyMap).length,
    keyConcepts: processedContext.keyConcepts.length,
    complexity: processedContext.complexityLevel,
  });

  // 4. Pre-validate question for topic relevance and safety
  const validator = new ContentValidator(processedContext);
  const questionValidation = await validator.validateQuestion(request.question);
  
  if (!questionValidation.isValid) {
    console.log('⚠️ Question validation failed:', questionValidation.reason);
    return {
      ok: false,
      error: questionValidation.redirectMessage || 'Question is not suitable for this educational context',
      provider: 'validator',
      processingTime: Date.now() - startTime,
    };
  }

  // 5. Select AI provider
  const providerSelector = new ProviderSelector();
  const selectedProvider = await providerSelector.selectProvider(
    request.options?.provider || 'auto',
    processedContext.complexityLevel
  );

  console.log('🤖 Provider selected:', selectedProvider.name);

  // 6. Get or create conversation session for context continuity
  let conversationSession: ConversationSession | null = null;
  let conversationContext = '';
  
  try {
    conversationSession = await conversationMemory.getOrCreateSession(
      authenticatedUserId,
      request.conceptCardId,
      {
        subject: processedContext.subject,
        competencyLevel: processedContext.originalContext.competencyLevel,
        cognitiveLevel: processedContext.originalContext.cognitiveLevel,
        totalMessages: 0,
      }
    );
    
    // Get conversation context for AI prompt
    conversationContext = conversationMemory.getConversationContext(conversationSession);
    
    console.log('💬 Conversation session loaded:', {
      sessionId: conversationSession.sessionId,
      existingMessages: conversationSession.messages.length,
      hasContext: conversationContext.length > 0,
    });
  } catch (error) {
    console.error('⚠️ Error with conversation memory, proceeding without context:', error);
  }

  // 7. Build educational prompt with conversation context
  const promptBuilder = new EducationalPromptBuilder(processedContext);
  const prompt = promptBuilder.buildPrompt(request.question, request.options, conversationContext);

  // 7. Get AI response
  let aiResponse: string;

  try {
    if (selectedProvider.name === 'gemini') {
      aiResponse = await generateGeminiEducationalResponse({
        systemPrompt: prompt.systemPrompt,
        userPrompt: prompt.userPrompt,
        maxTokens: prompt.maxTokens,
      });
    } else {
      aiResponse = await generateDeepSeekEducationalResponse({
        systemPrompt: prompt.systemPrompt,
        userPrompt: prompt.userPrompt,
        maxTokens: prompt.maxTokens,
      });
    }

    console.log('🧠 AI response received from:', selectedProvider.name);

  } catch (aiError: any) {
    console.error('❌ AI provider error:', aiError.message);
    throw new Error('AI providers unavailable');
  }

  // 8. Validate and filter AI response
  const responseValidation = await validator.validateResponse(aiResponse, request.question);
  
  if (!responseValidation.isValid) {
    aiResponse = responseValidation.filteredContent || 'I apologize, but I need to think more carefully about that question.';
  }

  // 9. Format response
  const formatter = new ResponseFormatter(processedContext);
  const formattedResponse = await formatter.formatResponse({
    content: aiResponse,
    originalQuestion: request.question,
    includeFollowUps: request.options?.includeFollowUps !== false,
    includeResources: true,
  });

  // 10. Save conversation to memory for future context
  if (conversationSession) {
    try {
      // Add user's question to conversation
      await conversationMemory.addMessage(
        conversationSession.sessionId,
        'human',
        request.question,
        request.conceptCardId
      );
      
      // Add AI's response to conversation  
      await conversationMemory.addMessage(
        conversationSession.sessionId,
        'assistant',
        formattedResponse.content,
        request.conceptCardId
      );
      
      console.log('💾 Conversation saved to memory');
    } catch (error) {
      console.error('⚠️ Error saving conversation to memory:', error);
      // Continue without failing - conversation memory is not critical
    }
  }

  // 11. Build final response
  const totalDuration = Date.now() - startTime;
  return {
    ok: true,
    response: formattedResponse.content,
    provider: selectedProvider.name,
    processingTime: totalDuration,
    contentMetadata: {
      topicRelevant: (responseValidation.topicRelevance || 0) >= 0.7,
      ageAppropriate: responseValidation.ageAppropriate || false,
      educationalValue: responseValidation.educationalValue || 'medium',
      complexity: processedContext.complexityLevel,
      confidenceScore: responseValidation.confidenceScore || 0,
      wasFiltered: responseValidation.wasFiltered || false,
    },
    suggestedFollowUps: formattedResponse.suggestedFollowUps,
    educationalResources: formattedResponse.educationalResources,
    conversationSessionId: conversationSession?.sessionId, // Return session ID for client
  };
}

/**
 * Clear conversation session (called when chat window is closed)
 */
export const clearConceptChatSession = onCall({
  invoker: 'public'
}, async (request) => {
  try {
    // Authentication required
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Authentication required');
    }

    const { sessionId } = request.data;
    
    if (!sessionId || typeof sessionId !== 'string') {
      throw new HttpsError('invalid-argument', 'Session ID is required');
    }

    console.log('🧹 Clearing conversation session:', {
      sessionId,
      userId: request.auth.uid,
    });

    await conversationMemory.clearSession(sessionId);

    return {
      ok: true,
      message: 'Session cleared successfully',
    };
  } catch (error: any) {
    console.error('❌ Error clearing session:', error);
    
    if (error instanceof HttpsError) {
      throw error;
    }
    
    throw new HttpsError('internal', 'Failed to clear session');
  }
});

/**
 * Health check endpoint for concept chat service
 */
export const conceptChatHealth = onCall({
  cors: true,
  invoker: 'public'
}, async (request) => {
  try {
    const geminiAvailable = !!process.env.GEMINI_API_KEY;
    const deepseekAvailable = !!process.env.DEEPSEEK_API_KEY;

    return {
      ok: true,
      status: 'healthy',
      providers: {
        gemini: geminiAvailable,
        deepseek: deepseekAvailable,
      },
      timestamp: new Date().toISOString(),
    };
  } catch (error: any) {
    return {
      ok: false,
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
});
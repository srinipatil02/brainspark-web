/**
 * NSW Selective Session Analysis
 *
 * Cloud Function that provides TRUE AI-powered session analysis
 * when a practice session ends. Unlike template-based summaries, this:
 * - Identifies underlying conceptual gaps (not just error counts)
 * - Finds patterns across multiple questions
 * - Generates actionable insights for improvement
 * - Creates personalized recommendations
 *
 * Trigger Conditions:
 * - Session ends with 5+ questions attempted
 * - Student clicks "Analyze my session"
 * - Automatic after diagnostic assessment
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { SessionAnalysisRequest, SessionAnalysisResponse } from './types';
import { buildSessionAnalysisPrompt, validateJsonResponse } from './prompts';

// =============================================================================
// AI PROVIDER WRAPPER
// =============================================================================

async function generateWithGemini(
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Gemini API key not configured');
  }

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(apiKey);

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash-exp',
    generationConfig: {
      temperature: 0.3,  // Lower for more consistent analysis
      maxOutputTokens: 1200,
      topP: 0.85,
    },
  });

  const combinedPrompt = `${systemPrompt}\n\n---\n\n${userPrompt}`;
  const result = await model.generateContent(combinedPrompt);
  return result.response.text();
}

async function generateWithDeepSeek(
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error('DeepSeek API key not configured');
  }

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const OpenAI = require('openai');
  const client = new OpenAI({
    baseURL: 'https://api.deepseek.com',
    apiKey: apiKey,
  });

  const response = await client.chat.completions.create({
    model: 'deepseek-chat',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.3,
    max_tokens: 1200,
    top_p: 0.85,
  });

  return response.choices[0]?.message?.content?.trim() || '';
}

// =============================================================================
// FALLBACK TEMPLATE (when AI fails)
// =============================================================================

function getTemplateFallback(
  accuracy: number,
  questionCount: number,
  archetypeName: string
): SessionAnalysisResponse {
  // Basic template-based analysis as fallback
  const progressIndicator = accuracy >= 70 ? 'improving' : accuracy >= 50 ? 'stable' : 'needsAttention';

  let deepInsight: string;
  let recommendations: SessionAnalysisResponse['recommendations'];

  if (accuracy >= 80) {
    deepInsight = `Strong performance on ${archetypeName}! You're demonstrating solid understanding of the methodology.`;
    recommendations = {
      immediate: 'Review any questions you got wrong to understand the specific traps.',
      nextSession: 'Try increasing the difficulty or explore a related archetype.',
      prerequisiteReview: null
    };
  } else if (accuracy >= 60) {
    deepInsight = `Good progress on ${archetypeName}. You understand the core concepts but may need more practice with edge cases.`;
    recommendations = {
      immediate: 'Review the methodology and practice a few more questions.',
      nextSession: 'Focus on the specific error patterns that tripped you up.',
      prerequisiteReview: null
    };
  } else {
    deepInsight = `You're building understanding of ${archetypeName}. Focus on mastering the step-by-step methodology before tackling more questions.`;
    recommendations = {
      immediate: 'Take a break, then carefully review the methodology lesson.',
      nextSession: 'Start with easier difficulty levels to build confidence.',
      prerequisiteReview: 'Consider reviewing prerequisite concepts for this archetype.'
    };
  }

  return {
    success: true,
    deepInsight,
    strengthsIdentified: [
      `Completed ${questionCount} practice questions`,
      accuracy >= 50 ? 'Demonstrated persistence through challenging problems' : 'Showed willingness to learn from mistakes'
    ],
    rootCauseAnalysis: {
      primaryGap: 'Analysis requires more detailed AI processing',
      evidence: `Session accuracy: ${accuracy}%`,
      severity: accuracy >= 70 ? 'minor' : accuracy >= 50 ? 'moderate' : 'significant'
    },
    recommendations,
    personalizedEncouragement: accuracy >= 70
      ? "Excellent work! You're making great progress toward mastery."
      : "Every practice session is making you stronger. Keep it up!",
    progressIndicator
  };
}

// =============================================================================
// REQUEST VALIDATION
// =============================================================================

function validateRequest(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data) {
    errors.push('Request data is required');
    return { valid: false, errors };
  }

  if (!data.session?.archetypeId) {
    errors.push('Archetype ID is required');
  }
  if (!data.session?.questions || !Array.isArray(data.session.questions)) {
    errors.push('Questions array is required');
  } else if (data.session.questions.length < 3) {
    errors.push('At least 3 questions required for analysis');
  }
  if (!data.archetype?.id) {
    errors.push('Archetype info is required');
  }

  return { valid: errors.length === 0, errors };
}

// =============================================================================
// MAIN CLOUD FUNCTION
// =============================================================================

export const nswSelectiveSessionAnalysis = onCall({
  memory: '512MiB',
  timeoutSeconds: 45,  // Session analysis may take longer
  invoker: 'public',
}, async (request): Promise<SessionAnalysisResponse> => {
  const startTime = Date.now();

  console.log('📊 NSW Selective Session Analysis request:', {
    timestamp: new Date().toISOString(),
    userId: request.auth?.uid,
    hasData: !!request.data,
  });

  try {
    // 1. Authentication (optional but logged)
    const userId = request.auth?.uid || 'anonymous';

    // 2. Validate request
    const validation = validateRequest(request.data);
    if (!validation.valid) {
      console.error('❌ Request validation failed:', validation.errors);
      throw new HttpsError('invalid-argument', `Validation failed: ${validation.errors.join(', ')}`);
    }

    const analysisRequest = request.data as SessionAnalysisRequest;

    // Calculate basic metrics for logging
    const questionCount = analysisRequest.session.questions.length;
    const correctCount = analysisRequest.session.questions.filter(q => q.isCorrect).length;
    const accuracy = Math.round((correctCount / questionCount) * 100);

    console.log('📈 Processing session analysis:', {
      userId,
      archetypeId: analysisRequest.archetype.id,
      questionCount,
      accuracy: `${accuracy}%`,
      previousSessions: analysisRequest.historicalContext.previousSessionsThisArchetype,
    });

    // 3. Build prompt
    const { systemPrompt, userPrompt } = buildSessionAnalysisPrompt(analysisRequest);

    // 4. Call AI provider (try Gemini first, fallback to DeepSeek)
    let aiResponse: string;
    let usedProvider = 'gemini';

    try {
      aiResponse = await generateWithGemini(systemPrompt, userPrompt);
    } catch (geminiError: any) {
      console.warn('⚠️ Gemini failed, trying DeepSeek:', geminiError.message);
      usedProvider = 'deepseek';

      try {
        aiResponse = await generateWithDeepSeek(systemPrompt, userPrompt);
      } catch (deepseekError: any) {
        console.error('❌ Both AI providers failed:', {
          gemini: geminiError.message,
          deepseek: deepseekError.message,
        });

        // Return template fallback
        const fallback = getTemplateFallback(
          accuracy,
          questionCount,
          analysisRequest.archetype.name
        );
        fallback.processingTime = Date.now() - startTime;
        return fallback;
      }
    }

    console.log('🤖 AI response received from:', usedProvider);

    // 5. Parse and validate response
    const parseResult = validateJsonResponse(aiResponse);

    if (!parseResult.valid) {
      console.error('❌ Failed to parse AI response:', {
        error: parseResult.error,
        responsePreview: aiResponse.substring(0, 200),
      });

      // Return template fallback
      const fallback = getTemplateFallback(
        accuracy,
        questionCount,
        analysisRequest.archetype.name
      );
      fallback.processingTime = Date.now() - startTime;
      return fallback;
    }

    const parsed = parseResult.parsed;

    // 6. Validate required fields
    if (!parsed.deepInsight || !parsed.recommendations) {
      console.error('❌ AI response missing required fields:', parsed);
      const fallback = getTemplateFallback(
        accuracy,
        questionCount,
        analysisRequest.archetype.name
      );
      fallback.processingTime = Date.now() - startTime;
      return fallback;
    }

    // 7. Build response
    const processingTime = Date.now() - startTime;

    console.log('✅ Session analysis generated:', {
      userId,
      archetypeId: analysisRequest.archetype.id,
      processingTime,
      provider: usedProvider,
      progressIndicator: parsed.progressIndicator,
      strengthsCount: parsed.strengthsIdentified?.length || 0,
    });

    return {
      success: true,
      deepInsight: parsed.deepInsight,
      strengthsIdentified: parsed.strengthsIdentified,
      rootCauseAnalysis: parsed.rootCauseAnalysis,
      recommendations: parsed.recommendations,
      personalizedEncouragement: parsed.personalizedEncouragement,
      progressIndicator: parsed.progressIndicator || 'stable',
      processingTime,
    };

  } catch (error: any) {
    const processingTime = Date.now() - startTime;

    console.error('❌ Session analysis error:', {
      error: error.message,
      stack: error.stack,
      processingTime,
    });

    if (error instanceof HttpsError) {
      throw error;
    }

    // For unexpected errors, return template fallback
    return {
      success: false,
      error: 'Session analysis temporarily unavailable',
      processingTime,
    };
  }
});

// =============================================================================
// HEALTH CHECK
// =============================================================================

export const nswSelectiveSessionAnalysisHealth = onCall({
  invoker: 'public',
}, async () => {
  const geminiAvailable = !!process.env.GEMINI_API_KEY;
  const deepseekAvailable = !!process.env.DEEPSEEK_API_KEY;

  return {
    ok: geminiAvailable || deepseekAvailable,
    status: (geminiAvailable || deepseekAvailable) ? 'healthy' : 'degraded',
    providers: {
      gemini: geminiAvailable,
      deepseek: deepseekAvailable,
    },
    timestamp: new Date().toISOString(),
  };
});

/**
 * NSW Selective Diagnostic Feedback
 *
 * Cloud Function that provides TRUE AI-powered personalized feedback
 * when a student makes errors. Unlike template-based feedback, this:
 * - Diagnoses the specific root cause for THIS student
 * - Tries different explanation approaches
 * - Never repeats previous feedback
 * - Guides without revealing the answer
 *
 * Trigger Conditions:
 * - Same error type occurs 2+ times in session
 * - 3+ wrong attempts on single question
 * - Student explicitly asks "Why am I getting this wrong?"
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { DiagnosticFeedbackRequest, DiagnosticFeedbackResponse } from './types';
import { buildDiagnosticFeedbackPrompt, validateJsonResponse } from './prompts';

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
      temperature: 0.4,  // Slightly higher for more varied explanations
      maxOutputTokens: 800,
      topP: 0.9,
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
    temperature: 0.4,
    max_tokens: 800,
    top_p: 0.9,
  });

  return response.choices[0]?.message?.content?.trim() || '';
}

// =============================================================================
// FALLBACK TEMPLATE (when AI fails)
// =============================================================================

function getTemplateFallback(
  errorType: string,
  previousFeedbackCount: number
): DiagnosticFeedbackResponse {
  // Enhanced templates as fallback
  const templates: Record<string, { feedback: string; guidingQuestion: string }> = {
    forward_calculation: {
      feedback: "You applied the calculation in the forward direction, but this problem requires working backwards. Think about it: Is the value given the START or the RESULT?",
      guidingQuestion: "If the final price is what's given, what operation undoes the change to find the original?"
    },
    partial_solution: {
      feedback: "You're on the right track, but stopped one step too early! Re-read the question: what exactly is it asking for?",
      guidingQuestion: "You found an intermediate value - what's the final step to answer what the question actually asks?"
    },
    wrong_operation: {
      feedback: "The operation you used isn't quite right for this situation. Think about the relationship between the quantities.",
      guidingQuestion: "Should your answer be bigger or smaller than the number you started with?"
    },
    computation_error: {
      feedback: "Your approach was correct, but there's a calculation slip somewhere. Try going through your arithmetic step by step.",
      guidingQuestion: "Can you trace through each calculation and verify each step?"
    },
    misconception_answer: {
      feedback: "This answer comes from a common misunderstanding. Let's revisit the core concept.",
      guidingQuestion: "Can you explain in your own words what's really happening in this problem?"
    },
    default: {
      feedback: "Let's think about this differently. Review the methodology and try approaching it step by step.",
      guidingQuestion: "What information does the question give you, and what is it asking you to find?"
    }
  };

  const template = templates[errorType] || templates.default;

  return {
    success: true,
    diagnosis: 'Template fallback due to AI unavailability',
    explanationApproach: 'stepByStep',
    feedback: template.feedback,
    guidingQuestion: template.guidingQuestion,
    encouragement: previousFeedbackCount > 0
      ? "You're working hard on this - persistence pays off!"
      : "Good effort! Every mistake is a learning opportunity.",
    suggestedNextStep: "Try re-reading the question and applying the methodology step by step.",
    confidenceLevel: 0.5
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

  if (!data.question?.questionId) {
    errors.push('Question ID is required');
  }
  if (!data.question?.stem) {
    errors.push('Question stem is required');
  }
  if (!data.selectedOption) {
    errors.push('Selected option is required');
  }
  if (!data.errorType) {
    errors.push('Error type is required');
  }
  if (!data.archetype?.id) {
    errors.push('Archetype ID is required');
  }

  return { valid: errors.length === 0, errors };
}

// =============================================================================
// MAIN CLOUD FUNCTION
// =============================================================================

export const nswSelectiveDiagnosticFeedback = onCall({
  memory: '512MiB',
  timeoutSeconds: 30,
  invoker: 'public',
}, async (request): Promise<DiagnosticFeedbackResponse> => {
  const startTime = Date.now();

  console.log('🎯 NSW Selective Diagnostic Feedback request:', {
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

    const feedbackRequest = request.data as DiagnosticFeedbackRequest;

    console.log('📊 Processing feedback for:', {
      userId,
      questionId: feedbackRequest.question.questionId,
      archetypeId: feedbackRequest.archetype.id,
      errorType: feedbackRequest.errorType,
      previousFeedbackCount: feedbackRequest.studentContext.previousFeedbackThisSession.length,
      masteryLevel: feedbackRequest.studentContext.masteryLevel,
    });

    // 3. Build prompt
    const { systemPrompt, userPrompt } = buildDiagnosticFeedbackPrompt(feedbackRequest);

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
          feedbackRequest.errorType,
          feedbackRequest.studentContext.previousFeedbackThisSession.length
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
        feedbackRequest.errorType,
        feedbackRequest.studentContext.previousFeedbackThisSession.length
      );
      fallback.processingTime = Date.now() - startTime;
      return fallback;
    }

    const parsed = parseResult.parsed;

    // 6. Validate required fields
    if (!parsed.feedback || !parsed.guidingQuestion) {
      console.error('❌ AI response missing required fields:', parsed);
      const fallback = getTemplateFallback(
        feedbackRequest.errorType,
        feedbackRequest.studentContext.previousFeedbackThisSession.length
      );
      fallback.processingTime = Date.now() - startTime;
      return fallback;
    }

    // 7. Build response
    const processingTime = Date.now() - startTime;

    console.log('✅ Diagnostic feedback generated:', {
      userId,
      questionId: feedbackRequest.question.questionId,
      processingTime,
      provider: usedProvider,
      explanationApproach: parsed.explanationApproach,
      confidenceLevel: parsed.confidenceLevel,
    });

    return {
      success: true,
      diagnosis: parsed.diagnosis,
      explanationApproach: parsed.explanationApproach,
      feedback: parsed.feedback,
      guidingQuestion: parsed.guidingQuestion,
      encouragement: parsed.encouragement,
      suggestedNextStep: parsed.suggestedNextStep,
      confidenceLevel: parsed.confidenceLevel || 0.7,
      processingTime,
    };

  } catch (error: any) {
    const processingTime = Date.now() - startTime;

    console.error('❌ Diagnostic feedback error:', {
      error: error.message,
      stack: error.stack,
      processingTime,
    });

    if (error instanceof HttpsError) {
      throw error;
    }

    // For unexpected errors, return template fallback instead of failing
    const fallback = getTemplateFallback('default', 0);
    fallback.processingTime = processingTime;
    fallback.error = 'AI service temporarily unavailable';
    return fallback;
  }
});

// =============================================================================
// HEALTH CHECK
// =============================================================================

export const nswSelectiveDiagnosticFeedbackHealth = onCall({
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

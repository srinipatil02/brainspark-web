/**
 * NSW Selective Socratic Coach
 *
 * Cloud Function that provides TRUE Socratic dialogue with students.
 * Unlike static hints, this engages in real-time guided discovery:
 * - Asks questions that lead to insight
 * - Responds to student's actual thinking
 * - NEVER reveals the answer directly
 * - Adapts based on conversation history
 *
 * Trigger Conditions:
 * - Student clicks "Help me think through this"
 * - Student is stuck > 2 minutes without action
 * - Student has made 2+ wrong attempts
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { SocraticCoachRequest, SocraticCoachResponse } from './types';
import { buildSocraticCoachPrompt, validateJsonResponse } from './prompts';

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
      temperature: 0.5,  // Slightly higher for more natural dialogue
      maxOutputTokens: 500,  // Keep Socratic questions concise
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
    temperature: 0.5,
    max_tokens: 500,
    top_p: 0.9,
  });

  return response.choices[0]?.message?.content?.trim() || '';
}

// =============================================================================
// FALLBACK TEMPLATE (when AI fails)
// =============================================================================

function getTemplateFallback(
  conversationLength: number,
  wrongAttempts: number
): SocraticCoachResponse {
  // Progressive Socratic questions based on context
  const questions = [
    // First interaction
    {
      nextQuestion: "Before we dive into calculations, can you tell me in your own words what the question is asking you to find?",
      targetInsight: "Ensure they understand what's being asked",
      fallbackHint: "What information does the question give you? What do you need to figure out?"
    },
    // Second interaction
    {
      nextQuestion: "What strategy or method do you think might work for this type of problem?",
      targetInsight: "Check if they recognize the problem type",
      fallbackHint: "Have you seen problems like this before? What approach worked then?"
    },
    // Third interaction
    {
      nextQuestion: "If you were to break this problem into smaller steps, what would be the first step?",
      targetInsight: "Guide them to decompose the problem",
      fallbackHint: "What's the very first calculation or decision you need to make?"
    },
    // Later interactions
    {
      nextQuestion: "What do you notice about the numbers in this problem? Is there a pattern or relationship?",
      targetInsight: "Look for key relationships",
      fallbackHint: "How do the different quantities in the problem relate to each other?"
    }
  ];

  const index = Math.min(conversationLength, questions.length - 1);
  const selected = questions[index];

  // Adjust if they've made multiple wrong attempts
  if (wrongAttempts >= 2 && conversationLength === 0) {
    return {
      success: true,
      thinkingProcess: 'Template fallback - student has struggled',
      nextQuestion: "Let's take a step back. Can you identify what type of math problem this is? (Is it about percentages, ratios, speed, or something else?)",
      targetInsight: "Help them categorize the problem first",
      fallbackHint: "What mathematical concept does this problem seem to be testing?"
    };
  }

  return {
    success: true,
    thinkingProcess: 'Template fallback due to AI unavailability',
    nextQuestion: selected.nextQuestion,
    targetInsight: selected.targetInsight,
    fallbackHint: selected.fallbackHint
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
  if (!data.archetype?.id) {
    errors.push('Archetype ID is required');
  }

  return { valid: errors.length === 0, errors };
}

// =============================================================================
// MAIN CLOUD FUNCTION
// =============================================================================

export const nswSelectiveSocraticCoach = onCall({
  memory: '512MiB',
  timeoutSeconds: 30,
  invoker: 'public',
}, async (request): Promise<SocraticCoachResponse> => {
  const startTime = Date.now();

  console.log('🎓 NSW Selective Socratic Coach request:', {
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

    const coachRequest = request.data as SocraticCoachRequest;

    console.log('📊 Processing Socratic dialogue for:', {
      userId,
      questionId: coachRequest.question.questionId,
      archetypeId: coachRequest.archetype.id,
      conversationLength: coachRequest.conversation.history.length,
      wrongAttempts: coachRequest.studentContext.wrongAnswersSelected.length,
      timeOnQuestion: coachRequest.studentContext.timeOnQuestionSeconds,
    });

    // 3. Build prompt
    const { systemPrompt, userPrompt } = buildSocraticCoachPrompt(coachRequest);

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
          coachRequest.conversation.history.length,
          coachRequest.studentContext.wrongAnswersSelected.length
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
        coachRequest.conversation.history.length,
        coachRequest.studentContext.wrongAnswersSelected.length
      );
      fallback.processingTime = Date.now() - startTime;
      return fallback;
    }

    const parsed = parseResult.parsed;

    // 6. Validate required fields
    if (!parsed.nextQuestion) {
      console.error('❌ AI response missing required field: nextQuestion', parsed);
      const fallback = getTemplateFallback(
        coachRequest.conversation.history.length,
        coachRequest.studentContext.wrongAnswersSelected.length
      );
      fallback.processingTime = Date.now() - startTime;
      return fallback;
    }

    // 7. CRITICAL: Verify the response doesn't reveal the answer
    const answerRevealed = checkForAnswerReveal(
      parsed.nextQuestion,
      coachRequest.question.correctAnswer
    );
    if (answerRevealed) {
      console.warn('⚠️ AI attempted to reveal answer, using fallback');
      const fallback = getTemplateFallback(
        coachRequest.conversation.history.length,
        coachRequest.studentContext.wrongAnswersSelected.length
      );
      fallback.processingTime = Date.now() - startTime;
      return fallback;
    }

    // 8. Build response
    const processingTime = Date.now() - startTime;

    console.log('✅ Socratic question generated:', {
      userId,
      questionId: coachRequest.question.questionId,
      processingTime,
      provider: usedProvider,
      questionPreview: parsed.nextQuestion.substring(0, 50) + '...',
    });

    return {
      success: true,
      thinkingProcess: parsed.thinkingProcess,
      nextQuestion: parsed.nextQuestion,
      targetInsight: parsed.targetInsight,
      fallbackHint: parsed.fallbackHint,
      processingTime,
    };

  } catch (error: any) {
    const processingTime = Date.now() - startTime;

    console.error('❌ Socratic coach error:', {
      error: error.message,
      stack: error.stack,
      processingTime,
    });

    if (error instanceof HttpsError) {
      throw error;
    }

    // For unexpected errors, return template fallback instead of failing
    const fallback = getTemplateFallback(0, 0);
    fallback.processingTime = processingTime;
    fallback.error = 'AI service temporarily unavailable';
    return fallback;
  }
});

// =============================================================================
// ANSWER PROTECTION
// =============================================================================

function checkForAnswerReveal(response: string, correctAnswer: string): boolean {
  const responseLower = response.toLowerCase();
  const answerLower = correctAnswer.toLowerCase().trim();

  // Direct patterns that reveal the answer
  const revealPatterns = [
    `the answer is ${answerLower}`,
    `answer: ${answerLower}`,
    `correct answer is ${answerLower}`,
    `it should be ${answerLower}`,
    `it's ${answerLower}`,
    `equals ${answerLower}`,
    `= ${answerLower}`,
  ];

  for (const pattern of revealPatterns) {
    if (responseLower.includes(pattern)) {
      return true;
    }
  }

  // Check if the exact answer appears as a standalone number/value
  // Be careful with common numbers like 1, 2, 10 that might appear in context
  if (answerLower.length > 2) {
    const answerRegex = new RegExp(`\\b${answerLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (answerRegex.test(responseLower)) {
      // Only flag if it's in a revealing context
      const context = responseLower.match(new RegExp(`.{0,20}${answerLower}.{0,20}`, 'i'));
      if (context) {
        const contextStr = context[0];
        const revealingWords = ['answer', 'correct', 'result', 'equals', 'should be', 'is actually'];
        for (const word of revealingWords) {
          if (contextStr.includes(word)) {
            return true;
          }
        }
      }
    }
  }

  return false;
}

// =============================================================================
// HEALTH CHECK
// =============================================================================

export const nswSelectiveSocraticCoachHealth = onCall({
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

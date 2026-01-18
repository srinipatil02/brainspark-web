/**
 * NSW Selective "Teach Me" - Direct Teaching Mode
 *
 * Cloud Function that provides DIRECT TEACHING when students need more than Socratic questioning.
 * Unlike the Socratic coach (which asks guiding questions), this:
 * - Explains the KEY INSIGHT that unlocks understanding
 * - Uses relatable analogies (games, money, sports, food)
 * - Shows a worked example with DIFFERENT numbers
 * - Points out the trap they might be falling into
 * - Still never reveals the answer to THEIR specific question
 *
 * Trigger Conditions:
 * - Student explicitly clicks "Teach Me"
 * - Student has been through 3+ Socratic exchanges without progress
 * - Student has made 3+ wrong attempts
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { TeachMeRequest, TeachMeResponse } from './types';
import { buildTeachMePrompt, validateJsonResponse } from './prompts';

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
      temperature: 0.7,  // Higher for more engaging, creative explanations
      maxOutputTokens: 1500,  // Teaching needs more space than questions
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
    temperature: 0.7,
    max_tokens: 1500,
    top_p: 0.9,
  });

  return response.choices[0]?.message?.content?.trim() || '';
}

// =============================================================================
// FALLBACK TEMPLATE (when AI fails)
// =============================================================================

function getTemplateFallback(archetypeName: string): TeachMeResponse {
  return {
    success: true,
    keyInsight: `This is a "${archetypeName}" problem. The key is to identify exactly what you're given and what you need to find.`,
    relatable: {
      setup: "Think of it like solving a puzzle - each piece of information in the question is a clue.",
      connection: "Just like in a puzzle, you need to use each clue in the right order.",
      whyItMatters: "When you see the problem as a puzzle, it becomes a challenge to solve rather than something scary."
    },
    workedExample: {
      problemStatement: "Let me show you a similar problem...",
      stepByStep: [
        {
          stepNumber: 1,
          action: "First, identify all the information given",
          result: "Write down each piece of data from the question",
          insight: "💡 This helps you see exactly what you're working with"
        },
        {
          stepNumber: 2,
          action: "Figure out what you need to find",
          result: "Identify the unknown - what the question is asking for",
          insight: "⚠️ Make sure you're solving for the right thing!"
        },
        {
          stepNumber: 3,
          action: "Connect the given information to what you need",
          result: "Set up the relationship/equation",
          insight: "💡 This is where the method for this problem type comes in"
        }
      ],
      finalAnswer: "Then calculate to get your answer",
      keyTakeaway: "Always check your answer makes sense in context!"
    },
    trapToAvoid: {
      trap: "Jumping to calculations before understanding what the question asks",
      whyTempting: "It feels faster to just start calculating",
      howToAvoid: "Spend 10 seconds re-reading the question before you start"
    },
    tryYourProblem: "Now go back to your problem. What information does it give you? What does it ask you to find?",
    encouragement: "You've got this! Taking time to understand the problem properly is what good mathematicians do."
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
  if (!data.question?.methodologySteps || data.question.methodologySteps.length === 0) {
    errors.push('Methodology steps are required');
  }

  return { valid: errors.length === 0, errors };
}

// =============================================================================
// MAIN CLOUD FUNCTION
// =============================================================================

export const nswSelectiveTeachMe = onCall({
  memory: '512MiB',
  timeoutSeconds: 45,  // Slightly longer for more comprehensive teaching
  invoker: 'public',
}, async (request): Promise<TeachMeResponse> => {
  const startTime = Date.now();

  console.log('📚 NSW Selective Teach Me request:', {
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

    const teachRequest = request.data as TeachMeRequest;

    console.log('📊 Processing Teach Me request:', {
      userId,
      questionId: teachRequest.question.questionId,
      archetypeId: teachRequest.archetype.id,
      archetypeName: teachRequest.archetype.name,
      wrongAttempts: teachRequest.studentContext.wrongAnswersSelected.length,
      socraticExchanges: teachRequest.studentContext.socraticExchanges,
      timeOnQuestion: teachRequest.studentContext.timeOnQuestionSeconds,
    });

    // 3. Build prompt
    const { systemPrompt, userPrompt } = buildTeachMePrompt(teachRequest);

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
        const fallback = getTemplateFallback(teachRequest.archetype.name);
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
        responsePreview: aiResponse.substring(0, 300),
      });

      // Return template fallback
      const fallback = getTemplateFallback(teachRequest.archetype.name);
      fallback.processingTime = Date.now() - startTime;
      return fallback;
    }

    const parsed = parseResult.parsed;

    // 6. Validate required fields
    if (!parsed.keyInsight || !parsed.workedExample) {
      console.error('❌ AI response missing required fields:', Object.keys(parsed));
      const fallback = getTemplateFallback(teachRequest.archetype.name);
      fallback.processingTime = Date.now() - startTime;
      return fallback;
    }

    // 7. CRITICAL: Verify the response doesn't reveal the answer
    const correctOption = teachRequest.question.options.find(o => o.isCorrect);
    if (correctOption) {
      const answerRevealed = checkForAnswerReveal(
        JSON.stringify(parsed),
        correctOption.text,
        correctOption.id
      );
      if (answerRevealed) {
        console.warn('⚠️ AI attempted to reveal answer, using fallback');
        const fallback = getTemplateFallback(teachRequest.archetype.name);
        fallback.processingTime = Date.now() - startTime;
        return fallback;
      }
    }

    // 8. Build response
    const processingTime = Date.now() - startTime;

    console.log('✅ Teaching response generated:', {
      userId,
      questionId: teachRequest.question.questionId,
      processingTime,
      provider: usedProvider,
      hasWorkedExample: !!parsed.workedExample,
      hasRelatable: !!parsed.relatable,
      hasTrapToAvoid: !!parsed.trapToAvoid,
    });

    return {
      success: true,
      keyInsight: parsed.keyInsight,
      relatable: parsed.relatable,
      workedExample: parsed.workedExample,
      trapToAvoid: parsed.trapToAvoid,
      tryYourProblem: parsed.tryYourProblem,
      encouragement: parsed.encouragement,
      processingTime,
    };

  } catch (error: any) {
    const processingTime = Date.now() - startTime;

    console.error('❌ Teach Me error:', {
      error: error.message,
      stack: error.stack,
      processingTime,
    });

    if (error instanceof HttpsError) {
      throw error;
    }

    // For unexpected errors, return template fallback instead of failing
    const fallback = getTemplateFallback('Mathematics');
    fallback.processingTime = processingTime;
    fallback.error = 'AI service temporarily unavailable';
    return fallback;
  }
});

// =============================================================================
// ANSWER PROTECTION
// =============================================================================

function checkForAnswerReveal(
  response: string,
  correctAnswerText: string,
  correctOptionId: string
): boolean {
  const responseLower = response.toLowerCase();
  const answerLower = correctAnswerText.toLowerCase().trim();

  // Check if response mentions the correct option letter directly
  const optionPatterns = [
    `the answer is ${correctOptionId.toLowerCase()}`,
    `option ${correctOptionId.toLowerCase()} is correct`,
    `choose ${correctOptionId.toLowerCase()}`,
    `select ${correctOptionId.toLowerCase()}`,
    `"${correctOptionId.toLowerCase()}"`,
    `(${correctOptionId.toLowerCase()})`,
  ];

  for (const pattern of optionPatterns) {
    if (responseLower.includes(pattern)) {
      return true;
    }
  }

  // Check for exact answer text in revealing context
  // Only flag if it's surrounded by answer-revealing words
  if (answerLower.length > 3) {  // Avoid false positives on short values
    const revealingPatterns = [
      `answer is ${answerLower}`,
      `answer: ${answerLower}`,
      `correct answer is ${answerLower}`,
      `your answer should be ${answerLower}`,
      `the result is ${answerLower}`,
      `you should get ${answerLower}`,
    ];

    for (const pattern of revealingPatterns) {
      if (responseLower.includes(pattern)) {
        return true;
      }
    }
  }

  return false;
}

// =============================================================================
// HEALTH CHECK
// =============================================================================

export const nswSelectiveTeachMeHealth = onCall({
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

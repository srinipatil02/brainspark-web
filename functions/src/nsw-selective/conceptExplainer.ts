/**
 * NSW Selective Concept Explainer
 *
 * Cloud Function that provides MULTIPLE explanation approaches
 * for mathematical concepts. When one explanation doesn't click,
 * we try different angles:
 * - Visual/Spatial explanation with diagrams
 * - Real-world analogy explanation
 * - Step-by-step procedural explanation
 *
 * Trigger Conditions:
 * - Student clicks "I don't understand this concept"
 * - Student fails same concept 5+ times
 * - Student explicitly asks for concept explanation
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { ConceptExplainerRequest, ConceptExplainerResponse } from './types';
import { buildConceptExplainerPrompt, validateJsonResponse } from './prompts';

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
      temperature: 0.6,  // Higher for creative explanations
      maxOutputTokens: 1200,  // Longer for multiple explanations
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
    temperature: 0.6,
    max_tokens: 1200,
    top_p: 0.9,
  });

  return response.choices[0]?.message?.content?.trim() || '';
}

// =============================================================================
// FALLBACK TEMPLATES (when AI fails)
// =============================================================================

interface ConceptTemplate {
  visualExplanation: {
    explanation: string;
    diagram: string;
    example: string;
  };
  analogyExplanation: {
    explanation: string;
    analogy: string;
    example: string;
  };
  proceduralExplanation: {
    explanation: string;
    steps: string[];
    example: string;
  };
  recommendedFirst: 'visual' | 'analogy' | 'procedural';
}

const CONCEPT_TEMPLATES: Record<string, ConceptTemplate> = {
  'Reverse Percentage': {
    visualExplanation: {
      explanation: "Think of the original price as a full box. When there's a discount, you only see part of the box. Your job is to figure out how big the whole box was!",
      diagram: "[?????] = Original price (100%)\n[###  ] = Sale price (what you see, e.g., 80%)\n\nThe visible part IS the percentage given. Work backwards to find the whole.",
      example: "If 80% of the original = $64, imagine the bar: [###  ] = $64. Each [#] = $64 ÷ 4 = $16. Full bar [#####] = $16 × 5 = $80"
    },
    analogyExplanation: {
      explanation: "Imagine you only see part of a hidden treasure through a window. If you can see 80% of it and count $64, you need to figure out the whole treasure!",
      analogy: "It's like a pizza where some slices are hidden. If 4 visible slices (80%) weigh 64 grams, each slice is 16 grams. The whole pizza (5 slices) weighs 80 grams.",
      example: "Sale price $64 is '80% of original'. If 4 slices = $64, each slice = $16. Original (5 slices) = $80"
    },
    proceduralExplanation: {
      explanation: "Follow these exact steps every time you see 'X is Y% of the original':",
      steps: [
        "Write the equation: Sale Price = (Percentage ÷ 100) × Original",
        "Rearrange to find Original: Original = Sale Price ÷ (Percentage ÷ 100)",
        "Convert percentage to decimal (80% → 0.80)",
        "Divide: $64 ÷ 0.80 = $80"
      ],
      example: "$64 is 80% of original. Original = $64 ÷ 0.80 = $80"
    },
    recommendedFirst: 'visual'
  },
  'default': {
    visualExplanation: {
      explanation: "Let's draw this out to see what's happening. Visual representations help you understand relationships between quantities.",
      diagram: "Draw the quantities as boxes or bars. Label what you know. Look for relationships.",
      example: "Use boxes to represent known and unknown values. See how they connect!"
    },
    analogyExplanation: {
      explanation: "Let's connect this to something from everyday life that works the same way.",
      analogy: "Math concepts often mirror real situations - like shopping, cooking, or traveling. Find the pattern!",
      example: "Think about a familiar situation where the same logic applies."
    },
    proceduralExplanation: {
      explanation: "Let's break this down into clear, numbered steps you can follow every time:",
      steps: [
        "Read the problem and identify what you're finding",
        "Write down what you know",
        "Choose the right formula or method",
        "Solve step by step",
        "Check: does your answer make sense?"
      ],
      example: "Follow these steps for any problem of this type."
    },
    recommendedFirst: 'procedural'
  }
};

function getTemplateFallback(
  conceptName: string,
  learningStyle?: string
): ConceptExplainerResponse {
  const template = CONCEPT_TEMPLATES[conceptName] || CONCEPT_TEMPLATES['default'];

  // Adjust recommendation based on learning style
  let recommended = template.recommendedFirst;
  if (learningStyle === 'visual') recommended = 'visual';
  else if (learningStyle === 'verbal') recommended = 'analogy';
  else if (learningStyle === 'example-based') recommended = 'procedural';

  return {
    success: true,
    visualExplanation: template.visualExplanation,
    analogyExplanation: template.analogyExplanation,
    proceduralExplanation: template.proceduralExplanation,
    recommendedFirst: recommended,
    whyThisApproach: `Based on ${learningStyle || 'general'} learning preferences, starting with ${recommended} explanation.`
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

  if (!data.concept?.name) {
    errors.push('Concept name is required');
  }
  if (!data.studentContext?.gradeLevel) {
    errors.push('Student grade level is required');
  }

  return { valid: errors.length === 0, errors };
}

// =============================================================================
// MAIN CLOUD FUNCTION
// =============================================================================

export const nswSelectiveConceptExplainer = onCall({
  memory: '512MiB',
  timeoutSeconds: 45,  // Longer timeout for multiple explanations
  invoker: 'public',
}, async (request): Promise<ConceptExplainerResponse> => {
  const startTime = Date.now();

  console.log('📚 NSW Selective Concept Explainer request:', {
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

    const explainerRequest = request.data as ConceptExplainerRequest;

    console.log('📊 Processing concept explanation for:', {
      userId,
      conceptName: explainerRequest.concept.name,
      gradeLevel: explainerRequest.studentContext.gradeLevel,
      learningStyle: explainerRequest.studentContext.preferredLearningStyle,
      previousExplanations: explainerRequest.studentContext.previousExplanationsSeen.length,
      hasSpecificConfusion: !!explainerRequest.specificConfusion,
    });

    // 3. Build prompt
    const { systemPrompt, userPrompt } = buildConceptExplainerPrompt(explainerRequest);

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
          explainerRequest.concept.name,
          explainerRequest.studentContext.preferredLearningStyle
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
        explainerRequest.concept.name,
        explainerRequest.studentContext.preferredLearningStyle
      );
      fallback.processingTime = Date.now() - startTime;
      return fallback;
    }

    const parsed = parseResult.parsed;

    // 6. Validate required fields
    if (!parsed.visualExplanation || !parsed.analogyExplanation || !parsed.proceduralExplanation) {
      console.error('❌ AI response missing required explanations:', {
        hasVisual: !!parsed.visualExplanation,
        hasAnalogy: !!parsed.analogyExplanation,
        hasProcedural: !!parsed.proceduralExplanation,
      });
      const fallback = getTemplateFallback(
        explainerRequest.concept.name,
        explainerRequest.studentContext.preferredLearningStyle
      );
      fallback.processingTime = Date.now() - startTime;
      return fallback;
    }

    // 7. Build response
    const processingTime = Date.now() - startTime;

    console.log('✅ Concept explanations generated:', {
      userId,
      conceptName: explainerRequest.concept.name,
      processingTime,
      provider: usedProvider,
      recommendedFirst: parsed.recommendedFirst,
    });

    return {
      success: true,
      visualExplanation: parsed.visualExplanation,
      analogyExplanation: parsed.analogyExplanation,
      proceduralExplanation: parsed.proceduralExplanation,
      recommendedFirst: parsed.recommendedFirst || 'procedural',
      whyThisApproach: parsed.whyThisApproach,
      processingTime,
    };

  } catch (error: any) {
    const processingTime = Date.now() - startTime;

    console.error('❌ Concept explainer error:', {
      error: error.message,
      stack: error.stack,
      processingTime,
    });

    if (error instanceof HttpsError) {
      throw error;
    }

    // For unexpected errors, return template fallback instead of failing
    const fallback = getTemplateFallback('default', undefined);
    fallback.processingTime = processingTime;
    fallback.error = 'AI service temporarily unavailable';
    return fallback;
  }
});

// =============================================================================
// HEALTH CHECK
// =============================================================================

export const nswSelectiveConceptExplainerHealth = onCall({
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
    conceptTemplates: Object.keys(CONCEPT_TEMPLATES),
    timestamp: new Date().toISOString(),
  };
});

/**
 * NSW Selective Study Plan Generator
 *
 * Cloud Function that generates PERSONALIZED study plans using AI.
 * Unlike static recommendations, this:
 * - Analyzes progress across ALL archetypes
 * - Considers prerequisite relationships
 * - Creates realistic weekly schedules
 * - Adapts to student's available time
 *
 * Trigger Conditions:
 * - Weekly automatic generation
 * - After diagnostic assessment
 * - Student requests "What should I study?"
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { StudyPlanRequest, StudyPlanResponse, ArchetypeId } from './types';
import { buildStudyPlanPrompt, validateJsonResponse } from './prompts';

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
      temperature: 0.4,  // Lower for more consistent planning
      maxOutputTokens: 1500,  // Longer for detailed schedule
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
    max_tokens: 1500,
    top_p: 0.9,
  });

  return response.choices[0]?.message?.content?.trim() || '';
}

// =============================================================================
// ARCHETYPE RELATIONSHIPS (for intelligent fallback)
// =============================================================================

const ARCHETYPE_PREREQUISITES: Partial<Record<ArchetypeId, ArchetypeId[]>> = {
  'qa13': ['qa11'],      // Reverse Percentage needs Percentage Equivalence
  'qa17': ['qa5'],       // Age Relationship needs Simultaneous Equations
  'qa20': ['qa4'],       // Speed/Distance/Time builds on Multi-leg Journey
  'qa14': ['qa11', 'qa13'], // Compound Percentage needs both percentage types
  'qa18': ['qa7'],       // Complex Work Rate needs basic Work Rate
};

const ARCHETYPE_NAMES: Record<ArchetypeId, string> = {
  'qa1': 'Basic Arithmetic',
  'qa2': 'Fraction Operations',
  'qa3': 'Decimal Operations',
  'qa4': 'Multi-leg Journey',
  'qa5': 'Simultaneous Equations',
  'qa6': 'Pattern Recognition',
  'qa7': 'Work Rate Problems',
  'qa8': 'Ratio Problems',
  'qa9': 'Proportion Problems',
  'qa10': 'Area & Perimeter',
  'qa11': 'Percentage Equivalence',
  'qa12': 'Percentage Change',
  'qa13': 'Reverse Percentage',
  'qa14': 'Compound Percentage',
  'qa15': 'Probability',
  'qa16': 'Statistics & Averages',
  'qa17': 'Age Relationship',
  'qa18': 'Complex Work Rate',
  'qa19': 'Measurement Conversion',
  'qa20': 'Speed/Distance/Time',
};

// =============================================================================
// FALLBACK TEMPLATE (when AI fails)
// =============================================================================

function getTemplateFallback(
  request: StudyPlanRequest
): StudyPlanResponse {
  const { progressAcrossArchetypes, studentProfile } = request;

  // Sort archetypes by priority: low mastery, not practiced recently
  const prioritized = [...progressAcrossArchetypes]
    .sort((a, b) => {
      // Primary: lower mastery = higher priority
      const masteryDiff = a.masteryLevel - b.masteryLevel;
      if (masteryDiff !== 0) return masteryDiff;

      // Secondary: not practiced recently = higher priority
      const aDays = (Date.now() - new Date(a.lastPracticed).getTime()) / (24 * 60 * 60 * 1000);
      const bDays = (Date.now() - new Date(b.lastPracticed).getTime()) / (24 * 60 * 60 * 1000);
      return bDays - aDays; // More days = higher priority
    });

  // Take top 3 for priority focus
  const priorityArchetypes = prioritized.slice(0, 3).map(arch => ({
    archetypeId: arch.archetypeId,
    reason: `Mastery level ${arch.masteryLevel}/5 with ${arch.accuracy}% accuracy`,
    suggestedTimeMinutes: Math.round(studentProfile.weeklyAvailableHours * 60 / 3 / 5),
    specificFocus: arch.commonErrors.length > 0
      ? `Focus on reducing ${arch.commonErrors[0]} errors`
      : 'Practice for consistency',
    targetMilestone: arch.masteryLevel < 3
      ? `Reach mastery level ${arch.masteryLevel + 1}`
      : `Achieve 80%+ accuracy`
  }));

  // Create weekly schedule
  const dailyMinutes = Math.round((studentProfile.weeklyAvailableHours * 60) / 5);
  const weeklySchedule: Record<string, { archetype: ArchetypeId; duration: number; focus: string }> = {};

  for (let i = 0; i < 5; i++) {
    const archIndex = i % priorityArchetypes.length;
    const arch = priorityArchetypes[archIndex];
    weeklySchedule[`day${i + 1}`] = {
      archetype: arch.archetypeId,
      duration: dailyMinutes,
      focus: arch.specificFocus
    };
  }

  // Identify maintenance archetypes (already strong)
  const maintenanceArchetypes = progressAcrossArchetypes
    .filter(a => a.masteryLevel >= 4)
    .slice(0, 2)
    .map(a => a.archetypeId);

  return {
    success: true,
    overallStrategy: `Focus on ${priorityArchetypes.length} priority areas while maintaining strength in mastered topics.`,
    priorityArchetypes,
    weeklySchedule,
    maintenanceArchetypes,
    weeklyGoals: [
      `Complete at least ${Math.round(studentProfile.weeklyAvailableHours * 3)} questions across priority archetypes`,
      `Reduce repeat errors by practicing methodology before each session`,
      `Review one mastered archetype per week to maintain skills`
    ],
    motivationalMessage: `You're making progress! With consistent practice on your priority areas, you'll see improvement. Remember: every question is a learning opportunity, whether you get it right or wrong.`
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

  if (!data.studentProfile?.weeklyAvailableHours) {
    errors.push('Weekly available hours is required');
  }
  if (!data.progressAcrossArchetypes || !Array.isArray(data.progressAcrossArchetypes)) {
    errors.push('Progress across archetypes is required');
  }
  if (data.progressAcrossArchetypes && data.progressAcrossArchetypes.length === 0) {
    errors.push('At least one archetype progress entry is required');
  }

  return { valid: errors.length === 0, errors };
}

// =============================================================================
// MAIN CLOUD FUNCTION
// =============================================================================

export const nswSelectiveStudyPlan = onCall({
  memory: '512MiB',
  timeoutSeconds: 45,  // Longer timeout for comprehensive analysis
  invoker: 'public',
}, async (request): Promise<StudyPlanResponse> => {
  const startTime = Date.now();

  console.log('📅 NSW Selective Study Plan request:', {
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

    const planRequest = request.data as StudyPlanRequest;

    console.log('📊 Generating study plan for:', {
      userId,
      archetypesTracked: planRequest.progressAcrossArchetypes.length,
      weeklyHours: planRequest.studentProfile.weeklyAvailableHours,
      hasExamDate: !!planRequest.studentProfile.targetExamDate,
      hasDiagnosticResults: !!planRequest.diagnosticResults,
    });

    // 3. Build prompt
    const { systemPrompt, userPrompt } = buildStudyPlanPrompt(planRequest);

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
        const fallback = getTemplateFallback(planRequest);
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
      const fallback = getTemplateFallback(planRequest);
      fallback.processingTime = Date.now() - startTime;
      return fallback;
    }

    const parsed = parseResult.parsed;

    // 6. Validate required fields
    if (!parsed.priorityArchetypes || !parsed.weeklySchedule) {
      console.error('❌ AI response missing required fields:', {
        hasPriority: !!parsed.priorityArchetypes,
        hasSchedule: !!parsed.weeklySchedule,
      });
      const fallback = getTemplateFallback(planRequest);
      fallback.processingTime = Date.now() - startTime;
      return fallback;
    }

    // 7. Validate archetype IDs are valid
    const validArchetypeIds = Object.keys(ARCHETYPE_NAMES);
    const invalidPriority = parsed.priorityArchetypes.filter(
      (p: any) => !validArchetypeIds.includes(p.archetypeId)
    );
    if (invalidPriority.length > 0) {
      console.warn('⚠️ AI returned invalid archetype IDs, fixing:', invalidPriority);
      // Filter out invalid ones
      parsed.priorityArchetypes = parsed.priorityArchetypes.filter(
        (p: any) => validArchetypeIds.includes(p.archetypeId)
      );
    }

    // 8. Build response
    const processingTime = Date.now() - startTime;

    console.log('✅ Study plan generated:', {
      userId,
      processingTime,
      provider: usedProvider,
      priorityCount: parsed.priorityArchetypes.length,
      scheduleDays: Object.keys(parsed.weeklySchedule).length,
    });

    return {
      success: true,
      overallStrategy: parsed.overallStrategy,
      priorityArchetypes: parsed.priorityArchetypes,
      weeklySchedule: parsed.weeklySchedule,
      maintenanceArchetypes: parsed.maintenanceArchetypes,
      weeklyGoals: parsed.weeklyGoals,
      motivationalMessage: parsed.motivationalMessage,
      processingTime,
    };

  } catch (error: any) {
    const processingTime = Date.now() - startTime;

    console.error('❌ Study plan error:', {
      error: error.message,
      stack: error.stack,
      processingTime,
    });

    if (error instanceof HttpsError) {
      throw error;
    }

    // For unexpected errors, return a minimal fallback
    return {
      success: false,
      error: 'AI service temporarily unavailable. Please try again later.',
      processingTime,
    };
  }
});

// =============================================================================
// HEALTH CHECK
// =============================================================================

export const nswSelectiveStudyPlanHealth = onCall({
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
    archetypesSupported: Object.keys(ARCHETYPE_NAMES).length,
    prerequisitesConfigured: Object.keys(ARCHETYPE_PREREQUISITES).length,
    timestamp: new Date().toISOString(),
  };
});

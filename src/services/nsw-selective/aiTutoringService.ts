/**
 * NSW Selective AI Tutoring Service
 *
 * Client-side service for calling TRUE AI tutoring Cloud Functions.
 * These functions use LLM reasoning (not templates) to provide
 * personalized feedback, analysis, and guidance.
 *
 * Features:
 * - Smart triggering (only call AI when truly needed)
 * - Fallback to template-based services when AI unavailable
 * - Cost optimization through batching and caching
 */

import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import { FirestoreQuestion, ArchetypeId } from '@/types';
import { DistractorType, ArchetypeProgress, ARCHETYPE_CATALOG } from '@/types/nsw-selective';
import { generateErrorFeedback, ErrorFeedback } from './errorFeedbackService';

// =============================================================================
// TYPES (match Cloud Function types)
// =============================================================================

interface ArchetypeInfo {
  id: ArchetypeId;
  name: string;
  shortName: string;
  methodology: string;
  commonErrors: string[];
  prerequisiteConcepts: string[];
}

interface DiagnosticFeedbackRequest {
  question: {
    questionId: string;
    stem: string;
    options: { id: string; text: string; isCorrect: boolean }[];
    methodologySteps: string[];
    solution: string;
    difficulty: number;
  };
  selectedOption: string;
  errorType: DistractorType;
  timeSpentSeconds: number;
  studentContext: {
    errorHistory: Partial<Record<DistractorType, number>>;
    previousFeedbackThisSession: string[];
    masteryLevel: number;
    questionsAttemptedThisArchetype: number;
    recentCorrectStreak: number;
  };
  archetype: ArchetypeInfo;
}

interface DiagnosticFeedbackResponse {
  success: boolean;
  diagnosis?: string;
  explanationApproach?: 'visual' | 'algebraic' | 'analogy' | 'stepByStep' | 'contrast';
  feedback?: string;
  guidingQuestion?: string;
  encouragement?: string;
  suggestedNextStep?: string;
  confidenceLevel?: number;
  error?: string;
  processingTime?: number;
}

interface SessionAnalysisRequest {
  session: {
    archetypeId: ArchetypeId;
    startTime: number;
    endTime: number;
    questions: Array<{
      questionId: string;
      stem: string;
      correctAnswer: string;
      studentAnswer: string;
      isCorrect: boolean;
      timeSeconds: number;
      errorType?: DistractorType;
      hintsUsed: number;
    }>;
  };
  historicalContext: {
    previousSessionsThisArchetype: number;
    overallAccuracyTrend: number[];
    persistentErrorPatterns: Partial<Record<DistractorType, number>>;
    masteryLevelProgression: number[];
  };
  archetype: ArchetypeInfo;
}

interface SessionAnalysisResponse {
  success: boolean;
  deepInsight?: string;
  strengthsIdentified?: string[];
  rootCauseAnalysis?: {
    primaryGap: string;
    evidence: string;
    severity: 'minor' | 'moderate' | 'significant';
  };
  recommendations?: {
    immediate: string;
    nextSession: string;
    prerequisiteReview: string | null;
  };
  personalizedEncouragement?: string;
  progressIndicator?: 'improving' | 'stable' | 'needsAttention';
  error?: string;
  processingTime?: number;
}

// =============================================================================
// SOCRATIC COACH TYPES
// =============================================================================

interface SocraticCoachRequest {
  question: {
    questionId: string;
    stem: string;
    correctAnswer: string;
    methodology: string[];
  };
  conversation: {
    history: Array<{
      role: 'student' | 'tutor';
      message: string;
      timestamp: number;
    }>;
    studentCurrentThinking?: string;
  };
  studentContext: {
    wrongAnswersSelected: string[];
    hintsAlreadySeen: string[];
    timeOnQuestionSeconds: number;
    masteryLevel: number;
  };
  archetype: ArchetypeInfo;
}

interface SocraticCoachResponse {
  success: boolean;
  thinkingProcess?: string;
  nextQuestion?: string;
  targetInsight?: string;
  fallbackHint?: string;
  error?: string;
  processingTime?: number;
}

// =============================================================================
// CONCEPT EXPLAINER TYPES
// =============================================================================

interface ConceptExplainerRequest {
  concept: {
    name: string;
    definition: string;
    methodology: string[];
    examples: string[];
  };
  studentContext: {
    previousExplanationsSeen: string[];
    preferredLearningStyle?: 'visual' | 'verbal' | 'example-based';
    relatedConceptsMastered: string[];
    gradeLevel: number;
  };
  specificConfusion?: string;
}

interface ConceptExplanation {
  explanation: string;
  diagram?: string;
  analogy?: string;
  steps?: string[];
  example: string;
}

interface ConceptExplainerResponse {
  success: boolean;
  visualExplanation?: ConceptExplanation;
  analogyExplanation?: ConceptExplanation;
  proceduralExplanation?: ConceptExplanation;
  recommendedFirst?: 'visual' | 'analogy' | 'procedural';
  whyThisApproach?: string;
  error?: string;
  processingTime?: number;
}

// =============================================================================
// STUDY PLAN TYPES
// =============================================================================

interface StudyPlanRequest {
  studentProfile: {
    userId: string;
    targetExamDate?: string;
    weeklyAvailableHours: number;
    preferredSessionLength: number;
  };
  progressAcrossArchetypes: Array<{
    archetypeId: ArchetypeId;
    archetypeName: string;
    masteryLevel: number;
    questionsAttempted: number;
    accuracy: number;
    lastPracticed: string;
    commonErrors: DistractorType[];
  }>;
  diagnosticResults?: {
    overallReadiness: number;
    weakestArchetypes: ArchetypeId[];
    strongestArchetypes: ArchetypeId[];
  };
}

// =============================================================================
// TEACH ME TYPES (Direct Teaching Mode)
// =============================================================================

interface TeachMeRequest {
  question: {
    questionId: string;
    stem: string;
    options: { id: string; text: string; isCorrect: boolean }[];
    methodologySteps: string[];
    solution: string;
    difficulty: number;
  };
  archetype: {
    id: ArchetypeId;
    name: string;
    shortName: string;
    methodology: string;
    commonErrors: string[];
  };
  studentContext: {
    wrongAnswersSelected: string[];
    hintsAlreadySeen: number;
    timeOnQuestionSeconds: number;
    socraticExchanges: number;
    masteryLevel: number;
    previousTeachingApproaches?: string[];
  };
  specificConfusion?: string;
}

interface TeachMeResponse {
  success: boolean;
  keyInsight?: string;
  relatable?: {
    setup: string;
    connection: string;
    whyItMatters: string;
  };
  workedExample?: {
    problemStatement: string;
    stepByStep: Array<{
      stepNumber: number;
      action: string;
      result: string;
      insight: string;
    }>;
    finalAnswer: string;
    keyTakeaway: string;
  };
  trapToAvoid?: {
    trap: string;
    whyTempting: string;
    howToAvoid: string;
  };
  tryYourProblem?: string;
  encouragement?: string;
  error?: string;
  processingTime?: number;
}

interface PriorityArchetype {
  archetypeId: ArchetypeId;
  reason: string;
  suggestedTimeMinutes: number;
  specificFocus: string;
  targetMilestone: string;
}

interface StudyPlanResponse {
  success: boolean;
  overallStrategy?: string;
  priorityArchetypes?: PriorityArchetype[];
  weeklySchedule?: Record<string, {
    archetype: ArchetypeId;
    duration: number;
    focus: string;
  }>;
  maintenanceArchetypes?: ArchetypeId[];
  weeklyGoals?: string[];
  motivationalMessage?: string;
  error?: string;
  processingTime?: number;
}

// =============================================================================
// AI FEEDBACK TRIGGERING
// =============================================================================

/**
 * Determines if AI feedback should be triggered for a wrong answer.
 * We use AI strategically to optimize cost while maximizing learning impact.
 */
export function shouldTriggerAIFeedback(context: {
  errorHistory: Partial<Record<DistractorType, number>>;
  currentErrorType: DistractorType;
  attemptsOnCurrentQuestion: number;
  sessionErrorCount: number;
  sessionQuestionCount: number;
}): { shouldTrigger: boolean; reason: string } {
  const {
    errorHistory,
    currentErrorType,
    attemptsOnCurrentQuestion,
    sessionErrorCount,
    sessionQuestionCount
  } = context;

  // Trigger 1: Same error type 2+ times in session
  const previousErrorCount = errorHistory[currentErrorType] || 0;
  if (previousErrorCount >= 1) {
    return {
      shouldTrigger: true,
      reason: `repeat_error: ${currentErrorType} occurred ${previousErrorCount + 1} times`
    };
  }

  // Trigger 2: 3+ wrong attempts on current question
  if (attemptsOnCurrentQuestion >= 3) {
    return {
      shouldTrigger: true,
      reason: `multiple_attempts: ${attemptsOnCurrentQuestion} wrong attempts`
    };
  }

  // Trigger 3: High error rate (>60% after 5+ questions)
  if (sessionQuestionCount >= 5) {
    const errorRate = sessionErrorCount / sessionQuestionCount;
    if (errorRate > 0.6) {
      return {
        shouldTrigger: true,
        reason: `high_error_rate: ${Math.round(errorRate * 100)}% errors`
      };
    }
  }

  // Don't trigger AI for first occurrence of an error type
  return {
    shouldTrigger: false,
    reason: 'first_occurrence'
  };
}

// =============================================================================
// HELPER: Build archetype info from catalog
// =============================================================================

function getArchetypeInfo(archetypeId: ArchetypeId): ArchetypeInfo {
  const catalog = ARCHETYPE_CATALOG[archetypeId];
  return {
    id: archetypeId,
    name: catalog.name,
    shortName: catalog.shortName,
    methodology: catalog.solutionApproach,
    commonErrors: catalog.commonErrors,
    prerequisiteConcepts: catalog.conceptsRequired,
  };
}

// =============================================================================
// AI DIAGNOSTIC FEEDBACK
// =============================================================================

/**
 * Get AI-powered diagnostic feedback for a wrong answer.
 * Falls back to template-based feedback if AI is unavailable.
 */
export async function getAIDiagnosticFeedback(params: {
  question: FirestoreQuestion;
  selectedOption: string;
  errorType: DistractorType;
  timeSpentSeconds: number;
  errorHistory: Partial<Record<DistractorType, number>>;
  previousFeedbackThisSession: string[];
  masteryLevel: number;
  questionsAttemptedThisArchetype: number;
  recentCorrectStreak: number;
}): Promise<{
  feedback: string;
  guidingQuestion: string;
  encouragement: string;
  suggestedNextStep: string;
  isAIGenerated: boolean;
  explanationApproach?: string;
  processingTime?: number;
}> {
  const {
    question,
    selectedOption,
    errorType,
    timeSpentSeconds,
    errorHistory,
    previousFeedbackThisSession,
    masteryLevel,
    questionsAttemptedThisArchetype,
    recentCorrectStreak,
  } = params;

  const archetypeId = question.nswSelective?.archetypeId;
  if (!archetypeId) {
    // Fall back to template if no archetype
    const templateFeedback = generateErrorFeedback({
      question,
      selectedOption,
      errorHistory,
      currentStreak: recentCorrectStreak,
      masteryLevel,
    });
    return convertTemplateToResponse(templateFeedback);
  }

  try {
    // Prepare request for Cloud Function
    const request: DiagnosticFeedbackRequest = {
      question: {
        questionId: question.questionId,
        stem: question.stem,
        options: (question.mcqOptions || []).map(opt => ({
          id: opt.id,
          text: opt.text,
          isCorrect: opt.isCorrect,
        })),
        methodologySteps: question.nswSelective?.methodologySteps || [],
        solution: question.solution || '',
        difficulty: question.difficulty,
      },
      selectedOption,
      errorType,
      timeSpentSeconds,
      studentContext: {
        errorHistory,
        previousFeedbackThisSession,
        masteryLevel,
        questionsAttemptedThisArchetype,
        recentCorrectStreak,
      },
      archetype: getArchetypeInfo(archetypeId),
    };

    // Call Cloud Function
    const callFunction = httpsCallable<DiagnosticFeedbackRequest, DiagnosticFeedbackResponse>(
      functions,
      'nswSelectiveDiagnosticFeedback'
    );

    const result = await callFunction(request);
    const response = result.data;

    if (response.success && response.feedback) {
      return {
        feedback: response.feedback,
        guidingQuestion: response.guidingQuestion || 'What approach might work better here?',
        encouragement: response.encouragement || 'Keep going - every mistake is a learning opportunity!',
        suggestedNextStep: response.suggestedNextStep || 'Try the question again with the methodology in mind.',
        isAIGenerated: true,
        explanationApproach: response.explanationApproach,
        processingTime: response.processingTime,
      };
    } else {
      // AI call succeeded but returned error - use fallback
      console.warn('AI feedback returned error:', response.error);
      const templateFeedback = generateErrorFeedback({
        question,
        selectedOption,
        errorHistory,
        currentStreak: recentCorrectStreak,
        masteryLevel,
      });
      return convertTemplateToResponse(templateFeedback);
    }

  } catch (error) {
    // AI call failed - use template fallback
    console.error('AI feedback call failed:', error);
    const templateFeedback = generateErrorFeedback({
      question,
      selectedOption,
      errorHistory,
      currentStreak: recentCorrectStreak,
      masteryLevel,
    });
    return convertTemplateToResponse(templateFeedback);
  }
}

function convertTemplateToResponse(templateFeedback: ErrorFeedback) {
  return {
    feedback: templateFeedback.message,
    guidingQuestion: templateFeedback.guidingQuestion || 'What approach might work better here?',
    encouragement: templateFeedback.encouragement,
    suggestedNextStep: templateFeedback.methodologyReminder || 'Review the methodology and try again.',
    isAIGenerated: false,
  };
}

// =============================================================================
// AI SESSION ANALYSIS
// =============================================================================

/**
 * Get AI-powered session analysis after completing a practice session.
 */
export async function getAISessionAnalysis(params: {
  archetypeId: ArchetypeId;
  sessionStartTime: number;
  sessionEndTime: number;
  answers: Array<{
    questionId: string;
    stem: string;
    correctAnswer: string;
    studentAnswer: string;
    isCorrect: boolean;
    timeSeconds: number;
    errorType?: DistractorType;
    hintsUsed: number;
  }>;
  previousProgress?: ArchetypeProgress | null;
}): Promise<SessionAnalysisResponse> {
  const {
    archetypeId,
    sessionStartTime,
    sessionEndTime,
    answers,
    previousProgress,
  } = params;

  // Require at least 3 questions for meaningful analysis
  if (answers.length < 3) {
    return {
      success: false,
      error: 'At least 3 questions required for AI analysis',
    };
  }

  try {
    // Build historical context
    const historicalContext = {
      previousSessionsThisArchetype: previousProgress ? 1 : 0, // Simplified
      overallAccuracyTrend: previousProgress
        ? [Math.round((previousProgress.questionsCorrect / previousProgress.questionsAttempted) * 100)]
        : [],
      persistentErrorPatterns: previousProgress?.errorFrequency || {},
      masteryLevelProgression: previousProgress ? [previousProgress.masteryLevel] : [],
    };

    const request: SessionAnalysisRequest = {
      session: {
        archetypeId,
        startTime: sessionStartTime,
        endTime: sessionEndTime,
        questions: answers,
      },
      historicalContext,
      archetype: getArchetypeInfo(archetypeId),
    };

    // Call Cloud Function
    const callFunction = httpsCallable<SessionAnalysisRequest, SessionAnalysisResponse>(
      functions,
      'nswSelectiveSessionAnalysis'
    );

    const result = await callFunction(request);
    return result.data;

  } catch (error) {
    console.error('AI session analysis failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Session analysis unavailable',
    };
  }
}

// =============================================================================
// AI SOCRATIC COACH
// =============================================================================

/**
 * Get AI-powered Socratic coaching when a student is stuck.
 * The AI will ask guiding questions, never revealing the answer.
 */
export async function getAISocraticCoaching(params: {
  question: FirestoreQuestion;
  correctAnswer: string;
  conversation: Array<{
    role: 'student' | 'tutor';
    message: string;
    timestamp: number;
  }>;
  studentCurrentThinking?: string;
  wrongAnswersSelected: string[];
  hintsAlreadySeen: string[];
  timeOnQuestionSeconds: number;
  masteryLevel: number;
}): Promise<SocraticCoachResponse> {
  const {
    question,
    correctAnswer,
    conversation,
    studentCurrentThinking,
    wrongAnswersSelected,
    hintsAlreadySeen,
    timeOnQuestionSeconds,
    masteryLevel,
  } = params;

  const archetypeId = question.nswSelective?.archetypeId;
  if (!archetypeId) {
    return {
      success: false,
      error: 'No archetype ID found for question',
    };
  }

  try {
    const request: SocraticCoachRequest = {
      question: {
        questionId: question.questionId,
        stem: question.stem,
        correctAnswer,
        methodology: question.nswSelective?.methodologySteps || [],
      },
      conversation: {
        history: conversation,
        studentCurrentThinking,
      },
      studentContext: {
        wrongAnswersSelected,
        hintsAlreadySeen,
        timeOnQuestionSeconds,
        masteryLevel,
      },
      archetype: getArchetypeInfo(archetypeId),
    };

    const callFunction = httpsCallable<SocraticCoachRequest, SocraticCoachResponse>(
      functions,
      'nswSelectiveSocraticCoach'
    );

    const result = await callFunction(request);
    return result.data;

  } catch (error) {
    console.error('AI Socratic coaching failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Socratic coaching unavailable',
    };
  }
}

// =============================================================================
// AI CONCEPT EXPLAINER
// =============================================================================

/**
 * Get AI-powered concept explanation with multiple approaches.
 */
export async function getAIConceptExplanation(params: {
  conceptName: string;
  conceptDefinition: string;
  methodology: string[];
  examples: string[];
  previousExplanationsSeen: string[];
  preferredLearningStyle?: 'visual' | 'verbal' | 'example-based';
  relatedConceptsMastered: string[];
  gradeLevel?: number;
  specificConfusion?: string;
}): Promise<ConceptExplainerResponse> {
  const {
    conceptName,
    conceptDefinition,
    methodology,
    examples,
    previousExplanationsSeen,
    preferredLearningStyle,
    relatedConceptsMastered,
    gradeLevel = 6,
    specificConfusion,
  } = params;

  try {
    const request: ConceptExplainerRequest = {
      concept: {
        name: conceptName,
        definition: conceptDefinition,
        methodology,
        examples,
      },
      studentContext: {
        previousExplanationsSeen,
        preferredLearningStyle,
        relatedConceptsMastered,
        gradeLevel,
      },
      specificConfusion,
    };

    const callFunction = httpsCallable<ConceptExplainerRequest, ConceptExplainerResponse>(
      functions,
      'nswSelectiveConceptExplainer'
    );

    const result = await callFunction(request);
    return result.data;

  } catch (error) {
    console.error('AI concept explanation failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Concept explanation unavailable',
    };
  }
}

// =============================================================================
// AI STUDY PLAN
// =============================================================================

/**
 * Get AI-generated personalized study plan.
 */
export async function getAIStudyPlan(params: {
  userId: string;
  targetExamDate?: string;
  weeklyAvailableHours: number;
  preferredSessionLength?: number;
  progressAcrossArchetypes: Array<{
    archetypeId: ArchetypeId;
    archetypeName: string;
    masteryLevel: number;
    questionsAttempted: number;
    accuracy: number;
    lastPracticed: string;
    commonErrors: DistractorType[];
  }>;
  diagnosticResults?: {
    overallReadiness: number;
    weakestArchetypes: ArchetypeId[];
    strongestArchetypes: ArchetypeId[];
  };
}): Promise<StudyPlanResponse> {
  const {
    userId,
    targetExamDate,
    weeklyAvailableHours,
    preferredSessionLength = 20,
    progressAcrossArchetypes,
    diagnosticResults,
  } = params;

  if (progressAcrossArchetypes.length === 0) {
    return {
      success: false,
      error: 'No archetype progress data available for study plan',
    };
  }

  try {
    const request: StudyPlanRequest = {
      studentProfile: {
        userId,
        targetExamDate,
        weeklyAvailableHours,
        preferredSessionLength,
      },
      progressAcrossArchetypes,
      diagnosticResults,
    };

    const callFunction = httpsCallable<StudyPlanRequest, StudyPlanResponse>(
      functions,
      'nswSelectiveStudyPlan'
    );

    const result = await callFunction(request);
    return result.data;

  } catch (error) {
    console.error('AI study plan failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Study plan generation unavailable',
    };
  }
}

// =============================================================================
// AI TEACH ME (Direct Teaching Mode)
// =============================================================================

/**
 * Get AI-powered direct teaching when a student is stuck and needs more than Socratic questioning.
 * Unlike Socratic coaching, this TEACHES the concept with:
 * - A key insight that unlocks understanding
 * - A relatable analogy using Year 6 appropriate examples
 * - A worked example with DIFFERENT numbers (so they still solve their own problem)
 * - A specific trap to avoid based on their wrong answers
 *
 * Still NEVER reveals the answer to their specific question.
 */
export async function getAITeachMe(params: {
  question: FirestoreQuestion;
  wrongAnswersSelected: string[];
  hintsAlreadySeen: number;
  timeOnQuestionSeconds: number;
  socraticExchanges: number;
  masteryLevel: number;
  previousTeachingApproaches?: string[];
  specificConfusion?: string;
}): Promise<TeachMeResponse> {
  const {
    question,
    wrongAnswersSelected,
    hintsAlreadySeen,
    timeOnQuestionSeconds,
    socraticExchanges,
    masteryLevel,
    previousTeachingApproaches,
    specificConfusion,
  } = params;

  const archetypeId = question.nswSelective?.archetypeId;
  if (!archetypeId) {
    return {
      success: false,
      error: 'No archetype ID found for question',
    };
  }

  try {
    const archetypeInfo = getArchetypeInfo(archetypeId);

    const request: TeachMeRequest = {
      question: {
        questionId: question.questionId,
        stem: question.stem,
        options: (question.mcqOptions || []).map(opt => ({
          id: opt.id,
          text: opt.text,
          isCorrect: opt.isCorrect,
        })),
        methodologySteps: question.nswSelective?.methodologySteps || [],
        solution: question.solution || '',
        difficulty: question.difficulty,
      },
      archetype: {
        id: archetypeId,
        name: archetypeInfo.name,
        shortName: archetypeInfo.shortName,
        methodology: archetypeInfo.methodology,
        commonErrors: archetypeInfo.commonErrors,
      },
      studentContext: {
        wrongAnswersSelected,
        hintsAlreadySeen,
        timeOnQuestionSeconds,
        socraticExchanges,
        masteryLevel,
        previousTeachingApproaches,
      },
      specificConfusion,
    };

    const callFunction = httpsCallable<TeachMeRequest, TeachMeResponse>(
      functions,
      'nswSelectiveTeachMe'
    );

    const result = await callFunction(request);
    return result.data;

  } catch (error) {
    console.error('AI Teach Me failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Teaching service unavailable',
    };
  }
}

// =============================================================================
// HEALTH CHECK
// =============================================================================

/**
 * Check if AI tutoring services are available
 */
export async function checkAITutoringHealth(): Promise<{
  available: boolean;
  diagnosticFeedback: boolean;
  sessionAnalysis: boolean;
  socraticCoach: boolean;
  conceptExplainer: boolean;
  studyPlan: boolean;
}> {
  try {
    const healthCheck = httpsCallable<void, { ok: boolean }>(
      functions,
      'nswSelectiveDiagnosticFeedbackHealth'
    );
    const result = await healthCheck();
    const isOk = result.data.ok;
    return {
      available: isOk,
      diagnosticFeedback: isOk,
      sessionAnalysis: isOk,
      socraticCoach: isOk,
      conceptExplainer: isOk,
      studyPlan: isOk,
    };
  } catch {
    return {
      available: false,
      diagnosticFeedback: false,
      sessionAnalysis: false,
      socraticCoach: false,
      conceptExplainer: false,
      studyPlan: false,
    };
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

// Export types for UI components
export type {
  SocraticCoachResponse,
  ConceptExplainerResponse,
  ConceptExplanation,
  StudyPlanResponse,
  PriorityArchetype,
  TeachMeResponse,
};

export default {
  shouldTriggerAIFeedback,
  getAIDiagnosticFeedback,
  getAISessionAnalysis,
  getAISocraticCoaching,
  getAIConceptExplanation,
  getAIStudyPlan,
  getAITeachMe,
  checkAITutoringHealth,
};

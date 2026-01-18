/**
 * NSW Selective AI Tutoring - Module Exports
 *
 * TRUE AI-powered tutoring for NSW Selective exam preparation.
 * These functions use LLM reasoning (not templates) to provide
 * personalized feedback, analysis, and guidance.
 *
 * All Phase 8 Functions:
 * - nswSelectiveDiagnosticFeedback: Personalized error feedback
 * - nswSelectiveSessionAnalysis: Deep session pattern analysis
 * - nswSelectiveSocraticCoach: Real Socratic dialogue (never reveals answers)
 * - nswSelectiveStudyPlan: AI-generated personalized learning paths
 * - nswSelectiveConceptExplainer: Multi-modal concept explanations
 */

// Phase 8.1: Core AI Functions
export {
  nswSelectiveDiagnosticFeedback,
  nswSelectiveDiagnosticFeedbackHealth
} from './diagnosticFeedback';

export {
  nswSelectiveSessionAnalysis,
  nswSelectiveSessionAnalysisHealth
} from './sessionAnalysis';

// Phase 8.2: Socratic Dialogue
export {
  nswSelectiveSocraticCoach,
  nswSelectiveSocraticCoachHealth
} from './socraticCoach';

// Phase 8.3: Personalized Planning
export {
  nswSelectiveStudyPlan,
  nswSelectiveStudyPlanHealth
} from './studyPlan';

// Phase 8.4: Concept Explanation
export {
  nswSelectiveConceptExplainer,
  nswSelectiveConceptExplainerHealth
} from './conceptExplainer';

// Phase 8.5: Teach Me (Direct Teaching Mode)
export {
  nswSelectiveTeachMe,
  nswSelectiveTeachMeHealth
} from './teachMe';

// Types (for client-side usage)
export type {
  DiagnosticFeedbackRequest,
  DiagnosticFeedbackResponse,
  SessionAnalysisRequest,
  SessionAnalysisResponse,
  SocraticCoachRequest,
  SocraticCoachResponse,
  StudyPlanRequest,
  StudyPlanResponse,
  ConceptExplainerRequest,
  ConceptExplainerResponse,
  TeachMeRequest,
  TeachMeResponse,
  DistractorType,
  ArchetypeId,
  ArchetypeInfo,
} from './types';

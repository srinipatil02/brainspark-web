// Scoring and Confidence Engine for LLM Grading
// Based on COMBINED_LLM_GRADING_SPEC_v0_DEEPSEEK.md

import { GradeJSON, GradingBlock, EscalationReason } from "./types";

/**
 * Penalty configuration
 */
interface PenaltyConfig {
  hints: number; // 0.1 for hint usage
  idk: number;   // 0.2 for "I Don't Know"
}

const DEFAULT_PENALTIES: PenaltyConfig = {
  hints: 0.1,
  idk: 0.2
};

/**
 * Input data for score calculation
 */
interface ScoreInput {
  gradeJson: GradeJSON;
  hintUses?: number;
  usedIdk?: boolean;
  qcs: number;
  studentAnswerLength: number;
}

/**
 * Score calculation result
 */
interface ScoreResult {
  basePct: number;
  adjustedConfidence: number;
  penalties: {
    hints: number;
    idk: number;
  };
  finalPct: number;
  pointsAwarded: number;
  label: "correct" | "mostly-correct" | "partial" | "incorrect";
}

/**
 * Calculates final score with penalties and confidence adjustments
 */
export function calculateScore(input: ScoreInput): ScoreResult {
  // Base percentage from LLM (clamped)
  const basePct = clamp(input.gradeJson.overall.pct, 0, 1);
  
  // Base confidence from LLM
  let confidence = clamp(input.gradeJson.overall.confidence, 0, 1);
  
  // Confidence adjustments based on spec
  confidence = adjustConfidence(confidence, input);
  
  // Calculate penalties
  const penalties = calculatePenalties(input);
  
  // Apply penalties to get final percentage
  const finalPct = clamp(basePct - penalties.hints - penalties.idk, 0, 1);
  
  // Calculate points awarded
  const pointsAwarded = Math.round(input.qcs * finalPct);
  
  // Determine label based on base percentage (spec requirement)
  const label = getLabelForPercentage(basePct);
  
  return {
    basePct,
    adjustedConfidence: confidence,
    penalties,
    finalPct,
    pointsAwarded,
    label
  };
}

/**
 * Adjusts confidence based on answer characteristics
 */
function adjustConfidence(baseConfidence: number, input: ScoreInput): number {
  let adjusted = baseConfidence;
  
  // Short answers have reduced confidence (spec requirement)
  if (input.studentAnswerLength < 12) {
    adjusted = Math.min(adjusted, 0.5);
  }
  
  // Contradictions present reduce confidence (spec requirement)
  if (input.gradeJson.contradictions && input.gradeJson.contradictions.length > 0) {
    adjusted = Math.min(adjusted, 0.6);
  }
  
  // Very long answers might be less reliable
  if (input.studentAnswerLength > 300) {
    adjusted = Math.min(adjusted, 0.8);
  }
  
  // If there are misconceptions, reduce confidence slightly
  if (input.gradeJson.misconceptions && input.gradeJson.misconceptions.length > 0) {
    adjusted = Math.min(adjusted, 0.85);
  }
  
  return clamp(adjusted, 0, 1);
}

/**
 * Calculates penalties based on attempt data
 */
function calculatePenalties(input: ScoreInput): { hints: number; idk: number } {
  const hintPenalty = (input.hintUses && input.hintUses > 0) 
    ? DEFAULT_PENALTIES.hints 
    : 0;
    
  const idkPenalty = input.usedIdk 
    ? DEFAULT_PENALTIES.idk 
    : 0;
  
  return {
    hints: hintPenalty,
    idk: idkPenalty
  };
}

/**
 * Determines if escalation to stronger model is needed
 */
export function shouldEscalate(
  confidence: number, 
  basePct: number, 
  hasValidJson: boolean
): { shouldEscalate: boolean; reason?: EscalationReason } {
  
  // Escalate if JSON was invalid after repair
  if (!hasValidJson) {
    return { shouldEscalate: true, reason: "invalid_json" };
  }
  
  // Escalate if confidence is low (spec requirement)
  if (confidence < 0.60) {
    return { shouldEscalate: true, reason: "low_confidence" };
  }
  
  // Escalate if score is in boundary zone (spec requirement)
  if (basePct > 0.45 && basePct < 0.65) {
    return { shouldEscalate: true, reason: "boundary_score" };
  }
  
  return { shouldEscalate: false };
}

/**
 * Merges results from two models (chat + reasoner)
 */
export function mergeEscalationResults(
  primary: GradeJSON, 
  secondary: GradeJSON,
  primaryScore: ScoreResult,
  secondaryScore: ScoreResult
): { mergedJson: GradeJSON; mergedScore: ScoreResult } {
  
  // Use median of percentages (spec requirement)
  const mergedPct = median([primaryScore.basePct, secondaryScore.basePct]);
  
  // Use max confidence (spec requirement)
  const mergedConfidence = Math.max(
    primaryScore.adjustedConfidence, 
    secondaryScore.adjustedConfidence
  );
  
  // Union concepts, prefer reasoner's partial reasons
  const mergedConcepts = {
    hit: Array.from(new Set([...primary.concepts.hit, ...secondary.concepts.hit])),
    partial: secondary.concepts.partial.length > 0 
      ? secondary.concepts.partial 
      : primary.concepts.partial,
    missing: Array.from(new Set([...primary.concepts.missing, ...secondary.concepts.missing]))
  };
  
  // Union misconceptions and contradictions
  const mergedMisconceptions = Array.from(new Set([
    ...primary.misconceptions, 
    ...secondary.misconceptions
  ]));
  
  const mergedContradictions = Array.from(new Set([
    ...primary.contradictions, 
    ...secondary.contradictions
  ]));
  
  // Prefer secondary (reasoner) explanations if available
  const mergedExplanations = {
    student_friendly: secondary.explanations.student_friendly || primary.explanations.student_friendly,
    parent_friendly: secondary.explanations.parent_friendly || primary.explanations.parent_friendly
  };
  
  // Use secondary key facts if more detailed
  const mergedKeyFacts = secondary.inferred_key_facts.length > primary.inferred_key_facts.length
    ? secondary.inferred_key_facts
    : primary.inferred_key_facts;
  
  const mergedJson: GradeJSON = {
    overall: {
      pct: mergedPct,
      label: getLabelForPercentage(mergedPct),
      confidence: mergedConfidence
    },
    inferred_key_facts: mergedKeyFacts,
    concepts: mergedConcepts,
    misconceptions: mergedMisconceptions,
    contradictions: mergedContradictions,
    explanations: mergedExplanations
  };
  
  // Recalculate score with merged data
  const mergedScore: ScoreResult = {
    basePct: mergedPct,
    adjustedConfidence: mergedConfidence,
    penalties: primaryScore.penalties, // Keep original penalties
    finalPct: clamp(mergedPct - primaryScore.penalties.hints - primaryScore.penalties.idk, 0, 1),
    pointsAwarded: Math.round(primaryScore.pointsAwarded * (mergedPct / primaryScore.basePct)),
    label: getLabelForPercentage(mergedPct)
  };
  
  return { mergedJson, mergedScore };
}

/**
 * Utility functions
 */
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 
    ? (sorted[mid - 1] + sorted[mid]) / 2 
    : sorted[mid];
}

export function getLabelForPercentage(pct: number): "correct" | "mostly-correct" | "partial" | "incorrect" {
  if (pct >= 0.85) return "correct";
  if (pct >= 0.70) return "mostly-correct";
  if (pct >= 0.40) return "partial";
  return "incorrect";
}

/**
 * Creates the complete grading block for Firestore storage
 */
export function buildGradingBlock(
  gradeJson: GradeJSON,
  scoreResult: ScoreResult,
  metadata: {
    engine: string;
    provider: string;
    questionId: string;
    setId?: string;
    escalated?: boolean;
    escalatedTo?: string;
    isHeuristic?: boolean;
  }
): GradingBlock {
  // Determine cascade stage according to spec
  let stage: "A" | "B" | "C";
  if (metadata.isHeuristic) {
    stage = "A"; // Heuristic fallback
  } else if (metadata.escalated) {
    stage = "C"; // Escalated to reasoner
  } else {
    stage = "B"; // Normal LLM grading
  }

  return {
    engine: metadata.engine,
    provider: metadata.provider,
    cascade: {
      stage,
      ...(metadata.escalatedTo && { escalatedTo: metadata.escalatedTo })
    },
    overall: {
      pct: scoreResult.basePct,  // Base percentage BEFORE penalties (spec requirement)
      label: scoreResult.label,
      confidence: scoreResult.adjustedConfidence
    },
    inferred_key_facts: gradeJson.inferred_key_facts,
    concepts: gradeJson.concepts,
    misconceptions: gradeJson.misconceptions,
    contradictions: gradeJson.contradictions,
    feedback: {
      student: gradeJson.explanations.student_friendly,
      parent: gradeJson.explanations.parent_friendly
    },
    score: {
      basePct: scoreResult.basePct,
      penalties: scoreResult.penalties,
      finalPct: scoreResult.finalPct
    },
    pointsAwarded: scoreResult.pointsAwarded,
    refs: {
      questionId: metadata.questionId,
      ...(metadata.setId && { setId: metadata.setId })
    },
    ts: null // Will be set to serverTimestamp in Firestore
  };
}
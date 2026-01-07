// Prompt Engineering for LLM Grading
// Based on COMBINED_LLM_GRADING_SPEC_v0_DEEPSEEK.md

import { GradeRequest } from "./types";

/**
 * Builds the user prompt for LLM grading
 * Implements security measures and structured prompting
 */
export function buildPrompt(req: GradeRequest, isRepair: boolean = false): string {
  const repairInstructions = isRepair ? `
IMPORTANT: The previous response was invalid JSON. Please fix the JSON structure and ensure it exactly matches the schema.
` : "";

  return `TASK:
1) From REFERENCE_ANSWER, infer 3–6 key facts (short phrases) that determine correctness.
2) Compare STUDENT_ANSWER to REFERENCE_ANSWER:
   - Mark each key fact as hit/partial/missing
   - For "hit": list only the fact IDs as strings (e.g., ["f1", "f2"])
   - For "partial": provide objects with id and reason (e.g., [{"id":"f3","reason":"implied but not explicit"}])
   - For "missing": list only the fact IDs as strings (e.g., ["f4"])
3) List any misconceptions and contradictions as strings.
4) Produce a percent score in [0..1] for overall correctness.
5) Output student_friendly and parent_friendly feedback.
6) Return valid JSON output ONLY matching the schema exactly. Your response must be a well-formed JSON object.
${repairInstructions}
CONTEXT:
SUBJECT: ${req.meta.subject}   TOPIC: ${req.meta.topic || "General"}   YEAR: ${req.meta.year || "Unknown"}

SCHEMA (follow exactly):
{
  "overall": {"pct": 0.0, "label": "correct|mostly-correct|partial|incorrect", "confidence": 0.0},
  "inferred_key_facts": [{"id":"f1","text":"key fact description"}],
  "concepts": {
    "hit": ["f1", "f3"], 
    "partial": [{"id":"f2","reason":"why partial"}], 
    "missing": ["f4"]
  },
  "misconceptions": ["misconception text"], 
  "contradictions": ["contradiction text"],
  "explanations": {"student_friendly": "feedback for student", "parent_friendly": "feedback for parent"}
}

LABEL RULES (use exact lowercase):
- "correct": pct >= 0.85
- "mostly-correct": pct >= 0.70 and < 0.85  
- "partial": pct >= 0.40 and < 0.70
- "incorrect": pct < 0.40

STEM (read-only):
\`\`\`${escapeBackticks(req.stem)}\`\`\`

REFERENCE_ANSWER (authoritative, concise; read-only):
\`\`\`${escapeBackticks(req.referenceAnswer)}\`\`\`

STUDENT_ANSWER (grade this only):
\`\`\`${escapeBackticks(req.studentAnswer)}\`\`\``;
}

/**
 * Escapes backticks to prevent markdown injection
 */
function escapeBackticks(text: string): string {
  return text.replace(/`/g, "\\`");
}

/**
 * Builds the repair prompt for JSON fixing attempts
 */
export function buildRepairPrompt(originalResponse: string, validationErrors: string): string {
  return `The previous JSON response was invalid. Here's what went wrong:

VALIDATION ERRORS:
${validationErrors}

ORIGINAL RESPONSE:
${originalResponse}

Please fix the JSON to match the exact schema:
{
  "overall": {"pct": 0.0, "label": "correct|mostly-correct|partial|incorrect", "confidence": 0.0},
  "inferred_key_facts": [{"id":"f1","text":"key fact description"}],
  "concepts": {
    "hit": ["f1", "f3"], 
    "partial": [{"id":"f2","reason":"why partial"}], 
    "missing": ["f4"]
  },
  "misconceptions": ["misconception text"], 
  "contradictions": ["contradiction text"],
  "explanations": {"student_friendly": "feedback for student", "parent_friendly": "feedback for parent"}
}

LABEL RULES (use exact lowercase):
- "correct": pct >= 0.85
- "mostly-correct": pct >= 0.70 and < 0.85  
- "partial": pct >= 0.40 and < 0.70
- "incorrect": pct < 0.40

Return ONLY the corrected JSON, no other text.`;
}

/**
 * Template for subject-specific grading instructions
 */
export function getSubjectSpecificInstructions(subject: "Science" | "English"): string {
  switch (subject) {
    case "Science":
      return `Focus on scientific accuracy, key concepts, and proper terminology. 
Look for misconceptions about natural phenomena, incorrect use of scientific terms, 
or contradictions to established scientific principles.`;
      
    case "English":
      return `Focus on comprehension, analysis, and expression quality.
Look for understanding of literary devices, themes, character development, 
or language use. Consider both content and communication clarity.`;
      
    default:
      return "Focus on accuracy and understanding of the key concepts.";
  }
}

/**
 * Confidence calibration instructions for different scenarios
 */
export function getConfidenceInstructions(): string {
  return `Set confidence based on:
- 0.9-1.0: Answer clearly matches/doesn't match reference with obvious reasoning
- 0.7-0.9: Good match with minor ambiguities
- 0.5-0.7: Moderate match but some uncertainty in interpretation
- 0.3-0.5: Significant ambiguity or edge case
- 0.0-0.3: Very unclear or contradictory information`;
}

/**
 * Label generation rules
 */
export function getLabelInstructions(): string {
  return `Label rules:
- "correct": pct >= 0.85
- "mostly-correct": pct >= 0.70 and < 0.85  
- "partial": pct >= 0.40 and < 0.70
- "incorrect": pct < 0.40`;
}
// Heuristic Fallback Grader
// Based on COMBINED_LLM_GRADING_SPEC_v0_DEEPSEEK.md Section 10

import { GradeRequest, GradeJSON } from "./types";
import { getLabelForPercentage } from "./scoring";

/**
 * Simple embedding simulation using character n-grams
 * This is a lightweight alternative to full embeddings
 */
function createSimpleEmbedding(text: string, ngramSize: number = 3): Map<string, number> {
  const embedding = new Map<string, number>();
  const normalized = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  
  // Character n-grams
  for (let i = 0; i <= normalized.length - ngramSize; i++) {
    const ngram = normalized.substring(i, i + ngramSize);
    embedding.set(ngram, (embedding.get(ngram) || 0) + 1);
  }
  
  // Word unigrams (more important)
  const words = normalized.split(' ').filter(w => w.length > 2);
  for (const word of words) {
    embedding.set(`WORD_${word}`, (embedding.get(`WORD_${word}`) || 0) + 2); // Higher weight
  }
  
  return embedding;
}

/**
 * Calculates cosine similarity between two text embeddings
 */
function cosineSimilarity(text1: string, text2: string): number {
  const embed1 = createSimpleEmbedding(text1);
  const embed2 = createSimpleEmbedding(text2);
  
  // Get all unique features
  const allFeatures = new Set([...embed1.keys(), ...embed2.keys()]);
  
  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;
  
  for (const feature of allFeatures) {
    const val1 = embed1.get(feature) || 0;
    const val2 = embed2.get(feature) || 0;
    
    dotProduct += val1 * val2;
    norm1 += val1 * val1;
    norm2 += val2 * val2;
  }
  
  if (norm1 === 0 || norm2 === 0) {
    return 0;
  }
  
  return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
}

/**
 * Detects common misconceptions based on keywords and patterns
 */
function detectMisconceptions(studentAnswer: string, subject: "Science" | "English"): string[] {
  const misconceptions: string[] = [];
  const lower = studentAnswer.toLowerCase();
  
  if (subject === "Science") {
    // Common science misconceptions
    const scienceMisconceptions = [
      {
        patterns: ["heat is a substance", "heat flows", "heat transfers"],
        misconception: "heat as substance"
      },
      {
        patterns: ["particles expand", "atoms expand", "molecules expand"],
        misconception: "particle expansion"
      },
      {
        patterns: ["heavier objects fall faster", "heavy things fall quicker"],
        misconception: "weight affects fall rate"
      },
      {
        patterns: ["force is needed to keep moving", "force maintains motion"],
        misconception: "force needed for motion"
      },
      {
        patterns: ["plants get food from soil", "plants eat from roots"],
        misconception: "plants consume soil nutrients as food"
      },
      {
        patterns: ["dinosaurs and humans lived together", "cavemen rode dinosaurs"],
        misconception: "human-dinosaur coexistence"
      }
    ];
    
    for (const item of scienceMisconceptions) {
      if (item.patterns.some(pattern => lower.includes(pattern))) {
        misconceptions.push(item.misconception);
      }
    }
  } else if (subject === "English") {
    // Common English misconceptions
    const englishMisconceptions = [
      {
        patterns: ["author always means", "author is saying", "author thinks"],
        misconception: "confusing narrator with author"
      },
      {
        patterns: ["theme is the main character", "theme is what happens"],
        misconception: "theme confusion with plot/character"
      },
      {
        patterns: ["all poems rhyme", "poetry must rhyme"],
        misconception: "rhyme requirement in poetry"
      }
    ];
    
    for (const item of englishMisconceptions) {
      if (item.patterns.some(pattern => lower.includes(pattern))) {
        misconceptions.push(item.misconception);
      }
    }
  }
  
  return misconceptions;
}

/**
 * Detects negation patterns that might indicate incorrect understanding
 */
function detectNegations(text: string): boolean {
  const negationPatterns = [
    /\bnot\s+\w+/gi,
    /\bn't\s+\w+/gi,
    /\bno\s+\w+/gi,
    /\bnever\s+\w+/gi,
    /\bwrong\b/gi,
    /\bincorrect\b/gi,
    /\bfalse\b/gi
  ];
  
  return negationPatterns.some(pattern => pattern.test(text));
}

/**
 * Normalizes text for comparison
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Heuristic grader implementation
 * Used when LLM is unavailable or returns invalid JSON
 */
export function heuristicGrade(req: GradeRequest): GradeJSON {
  const refNormalized = normalizeText(req.referenceAnswer);
  const stuNormalized = normalizeText(req.studentAnswer);
  
  // Basic similarity score
  const similarity = cosineSimilarity(refNormalized, stuNormalized);
  
  // Detect issues
  const veryShort = req.studentAnswer.length < 12;
  const hasNegations = detectNegations(req.studentAnswer);
  const misconceptions = detectMisconceptions(req.studentAnswer, req.meta.subject);
  
  // Adjust score based on issues
  let adjustedScore = similarity;
  
  // Penalties
  if (misconceptions.length > 0) {
    adjustedScore -= 0.1; // Misconception penalty
  }
  
  if (veryShort) {
    adjustedScore -= 0.1; // Very short penalty
  }
  
  if (hasNegations) {
    adjustedScore -= 0.05; // Negation penalty (might indicate confusion)
  }
  
  // Clamp score
  const finalScore = Math.max(0, Math.min(1, adjustedScore));
  
  // Generate basic feedback
  const studentFeedback = generateHeuristicFeedback(finalScore, veryShort, misconceptions);
  const parentFeedback = `Heuristic grading result (confidence: low). Score based on text similarity to reference answer. ${misconceptions.length > 0 ? 'Potential misconceptions detected.' : ''}`;
  
  // Create minimal key facts (since we can't infer them properly)
  const keyFacts = [
    { id: "f1", text: "Key concepts from reference answer" }
  ];
  
  // Basic concept mapping
  const concepts = {
    hit: finalScore > 0.7 ? ["f1"] : [],
    partial: finalScore > 0.4 && finalScore <= 0.7 ? [{ id: "f1", reason: "partially addressed" }] : [],
    missing: finalScore <= 0.4 ? ["f1"] : []
  };
  
  return {
    overall: {
      pct: finalScore,
      label: getLabelForPercentage(finalScore),
      confidence: 0.35 // Always low confidence for heuristic
    },
    inferred_key_facts: keyFacts,
    concepts,
    misconceptions,
    contradictions: [], // Difficult to detect heuristically
    explanations: {
      student_friendly: studentFeedback,
      parent_friendly: parentFeedback
    }
  };
}

/**
 * Generates appropriate feedback based on heuristic analysis
 */
function generateHeuristicFeedback(score: number, veryShort: boolean, misconceptions: string[]): string {
  if (score >= 0.85) {
    return "Your answer shows good understanding of the key concepts.";
  } else if (score >= 0.70) {
    return "Good start! Try to include more specific details in your answer.";
  } else if (score >= 0.40) {
    if (veryShort) {
      return "Your answer is on the right track, but please provide more detail and explanation.";
    } else {
      return "You have some understanding, but please review the key concepts and try again.";
    }
  } else {
    if (misconceptions.length > 0) {
      return "There may be some misconceptions in your answer. Please review the material and focus on the main concepts.";
    } else if (veryShort) {
      return "Please provide a more detailed answer that explains the main concepts.";
    } else {
      return "Your answer doesn't closely match the expected concepts. Please review the material and try again.";
    }
  }
}

/**
 * Quick check if heuristic grading should be used
 */
export function shouldUseHeuristic(
  llmUnavailable: boolean,
  invalidJsonAfterRepair: boolean,
  emergencyMode: boolean = false
): boolean {
  return llmUnavailable || invalidJsonAfterRepair || emergencyMode;
}
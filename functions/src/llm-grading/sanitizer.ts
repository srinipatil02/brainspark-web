// Input Sanitization for LLM Grading
// Implements security measures from COMBINED_LLM_GRADING_SPEC_v0_DEEPSEEK.md

import DOMPurify from "isomorphic-dompurify";

/**
 * Sanitizes input text according to spec requirements:
 * - Strip HTML/JS (DOMPurify)
 * - Normalize Unicode (NFKC)
 * - Collapse whitespace
 * - Replace URLs/emails with tokens
 * - Length constraints: 1..1200 chars
 */
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== "string") {
    throw new Error("Input must be a non-empty string");
  }

  // Step 1: Strip HTML/JS using DOMPurify
  let sanitized = DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [], // No HTML tags allowed
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true, // Keep text content
  }) as string;

  // Step 2: Normalize Unicode (NFKC)
  sanitized = sanitized.normalize("NFKC");

  // Step 3: Replace URLs and emails with tokens
  sanitized = sanitized
    .replace(/https?:\/\/[^\s]+/gi, "<URL>")
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "<EMAIL>");

  // Step 4: Collapse whitespace
  sanitized = sanitized
    .replace(/\s+/g, " ") // Multiple spaces to single space
    .replace(/\n\s*\n/g, "\n") // Multiple newlines to single newline
    .trim();

  // Step 5: Length validation
  if (sanitized.length < 1) {
    throw new Error("Input is empty after sanitization");
  }
  if (sanitized.length > 1200) {
    throw new Error(`Input too long: ${sanitized.length} chars (max 1200)`);
  }

  return sanitized;
}

/**
 * Sanitizes markdown content by removing scripts but preserving basic formatting
 */
export function sanitizeMarkdown(input: string): string {
  if (!input || typeof input !== "string") {
    return "";
  }

  // Allow basic markdown but strip dangerous content
  const sanitized = DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ["strong", "em", "code", "pre", "p", "br"],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  }) as string;

  return sanitized.normalize("NFKC").trim();
}

/**
 * Creates a concise reference answer from solution markdown
 * Removes excessive formatting and focuses on key content
 */
export function extractConciseAnswer(solutionMarkdown: string): string {
  if (!solutionMarkdown) {
    throw new Error("Solution markdown is required");
  }

  // Remove markdown formatting for LLM processing
  let concise = solutionMarkdown
    .replace(/\*\*(.*?)\*\*/g, "$1") // Remove bold
    .replace(/\*(.*?)\*/g, "$1") // Remove italic
    .replace(/`(.*?)`/g, "$1") // Remove code marks
    .replace(/#{1,6}\s+/g, "") // Remove headers
    .replace(/>\s+/g, "") // Remove blockquotes
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // Remove links, keep text
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1") // Remove images, keep alt text
    .replace(/\n\s*\n/g, "\n") // Collapse multiple newlines
    .trim();

  // Sanitize the result
  concise = sanitizeInput(concise);

  // Ensure it's not too long for LLM context
  if (concise.length > 500) {
    // Take first 500 chars but try to end at sentence boundary
    const truncated = concise.substring(0, 500);
    const lastSentence = truncated.lastIndexOf(". ");
    if (lastSentence > 300) {
      concise = truncated.substring(0, lastSentence + 1);
    } else {
      concise = truncated + "...";
    }
  }

  return concise;
}

/**
 * Validates that input doesn't contain prompt injection attempts
 */
export function detectPromptInjection(input: string): boolean {
  const injectionPatterns = [
    /ignore\s+previous\s+instructions/i,
    /forget\s+everything/i,
    /system\s*:/i,
    /assistant\s*:/i,
    /```json/i,
    /\{.*"overall".*\}/i, // JSON-like structures
    /new\s+task/i,
    /you\s+are\s+now/i,
    /instead\s+of\s+grading/i,
  ];

  return injectionPatterns.some(pattern => pattern.test(input));
}

/**
 * Comprehensive input validation for grading requests
 */
export function validateGradingInputs(studentAnswer: string, stem: string, solution: string): {
  studentAnswer: string;
  stem: string;
  referenceAnswer: string;
} {
  // Check for prompt injection attempts
  if (detectPromptInjection(studentAnswer)) {
    throw new Error("Input contains potential prompt injection patterns");
  }

  if (detectPromptInjection(stem)) {
    throw new Error("Question stem contains invalid content");
  }

  // Sanitize all inputs
  const sanitizedStudent = sanitizeInput(studentAnswer);
  const sanitizedStem = sanitizeMarkdown(stem);
  const sanitizedReference = extractConciseAnswer(solution);

  // Additional validations
  if (sanitizedStudent.length < 3) {
    throw new Error("Student answer too short (minimum 3 characters)");
  }

  if (sanitizedReference.length < 5) {
    throw new Error("Reference answer too short after processing");
  }

  return {
    studentAnswer: sanitizedStudent,
    stem: sanitizedStem,
    referenceAnswer: sanitizedReference,
  };
}
// =============================================================================
// CURRICULUM GRADING SERVICE
// AI-powered grading for SHORT_ANSWER and EXTENDED_RESPONSE questions
// Uses Gemini for rich pedagogical feedback
// =============================================================================

import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Firestore
const db = admin.firestore();

// -----------------------------------------------------------------------------
// Types (matching frontend src/types/grading.ts)
// -----------------------------------------------------------------------------

type Correctness = "correct" | "partial" | "incorrect";
type GraderType = "auto" | "ai" | "human";

interface GradingFeedback {
  summary: string;
  whatWasRight: string[];
  whatWasMissing: string[];
  misconceptions: string[];
  suggestions: string[];
}

interface RubricScore {
  criterion: string;
  score: number;
  maxScore: number;
  feedback?: string;
}

interface GradingResult {
  score: number;
  maxScore: number;
  percentage: number;
  correctness: Correctness;
  feedback: GradingFeedback;
  rubricScores?: RubricScore[];
  conceptsAssessed?: string[];
  conceptsMastered?: string[];
  conceptsToReview?: string[];
  gradedAt: string;
  gradedBy: GraderType;
  confidence: number;
}

interface GradingRequest {
  questionId: string;
  questionType: "MCQ" | "SHORT_ANSWER" | "EXTENDED_RESPONSE";
  questionStem: string;
  modelSolution: string;
  studentAnswer: string;
  curriculum?: {
    subject: string;
    year: number;
    topic?: string;
    strand?: string;
    concepts?: string[];
  };
  difficulty: number;
}

// -----------------------------------------------------------------------------
// Points Matrix
// -----------------------------------------------------------------------------

function calculateMaxPoints(
  questionType: "MCQ" | "SHORT_ANSWER" | "EXTENDED_RESPONSE",
  difficulty: number | undefined
): number {
  const pointsMatrix: Record<string, number[]> = {
    MCQ: [1, 1, 2, 2, 3],
    SHORT_ANSWER: [2, 3, 4, 5, 6],
    EXTENDED_RESPONSE: [4, 6, 8, 10, 12],
  };

  // Default to difficulty 3 (medium) if not provided or invalid
  const safeDifficulty = typeof difficulty === "number" && !isNaN(difficulty) ? difficulty : 3;
  const difficultyIndex = Math.max(0, Math.min(4, safeDifficulty - 1));
  return pointsMatrix[questionType]?.[difficultyIndex] ?? 4;  // Default to 4 points for SHORT_ANSWER medium
}

// -----------------------------------------------------------------------------
// Correctness from Percentage
// -----------------------------------------------------------------------------

function getCorrectnessFromPercentage(percentage: number): Correctness {
  if (percentage >= 80) return "correct";
  if (percentage >= 40) return "partial";
  return "incorrect";
}

// -----------------------------------------------------------------------------
// Build Grading Prompt - The heart of pedagogical feedback
// -----------------------------------------------------------------------------

function buildGradingPrompt(request: GradingRequest): string {
  const { questionType, questionStem, modelSolution, studentAnswer, curriculum, difficulty } = request;

  const questionTypeGuidelines = questionType === "SHORT_ANSWER"
    ? `
For SHORT_ANSWER questions:
- Evaluate conceptual understanding (2 marks max)
- Check factual accuracy (1 mark)
- Assess use of scientific/subject terminology (1 mark)
- Total: 4 marks scaled to question difficulty`
    : `
For EXTENDED_RESPONSE questions:
- Content Knowledge: Comprehensive understanding with examples (0-4 marks)
- Scientific Reasoning: Logical connections, cause-effect explanations (0-3 marks)
- Communication: Clear organization, correct terminology (0-3 marks)
- Total: 10 marks scaled to question difficulty`;

  const subjectContext = curriculum
    ? `
CURRICULUM CONTEXT:
- Subject: ${curriculum.subject}
- Year Level: Year ${curriculum.year}
- Topic: ${curriculum.topic || "General"}
- Strand: ${curriculum.strand || "Not specified"}
- Key Concepts: ${curriculum.concepts?.join(", ") || "See model solution"}`
    : "";

  return `You are an expert educational assessor specializing in providing detailed, constructive feedback to students aged 12-14.

QUESTION TYPE: ${questionType}
DIFFICULTY: ${difficulty}/5
${subjectContext}

${questionTypeGuidelines}

QUESTION:
"""
${questionStem}
"""

MODEL SOLUTION (Reference Answer):
"""
${modelSolution}
"""

STUDENT'S ANSWER:
"""
${studentAnswer}
"""

GRADING INSTRUCTIONS:
1. Compare the student's answer against the model solution
2. Identify what key concepts/facts the student demonstrated correctly
3. Note any misconceptions or errors that need correction
4. Provide specific, actionable suggestions for improvement
5. Be encouraging but honest - students learn best from specific feedback

Respond ONLY with a valid JSON object in this exact format (no markdown, no explanation):
{
  "percentage": <number 0-100>,
  "feedback": {
    "summary": "<2-3 sentence overall assessment that acknowledges effort and explains the score>",
    "whatWasRight": ["<specific correct point 1>", "<specific correct point 2>"],
    "whatWasMissing": ["<missing concept 1>", "<missing detail 2>"],
    "misconceptions": ["<misconception with gentle correction>"],
    "suggestions": ["<actionable improvement tip 1>", "<study suggestion 2>"]
  },
  "rubricScores": [
    {"criterion": "Understanding", "score": <0-2>, "maxScore": 2, "feedback": "<brief criterion feedback>"},
    {"criterion": "Accuracy", "score": <0-1>, "maxScore": 1, "feedback": "<brief criterion feedback>"},
    {"criterion": "Terminology", "score": <0-1>, "maxScore": 1, "feedback": "<brief criterion feedback>"}
  ],
  "conceptsAssessed": ["<concept 1>", "<concept 2>"],
  "conceptsMastered": ["<concepts student demonstrated understanding of>"],
  "conceptsToReview": ["<concepts needing more practice>"],
  "confidence": <0.0-1.0 indicating grading confidence>
}

SCORING RULES:
- 80-100%: Answer demonstrates clear understanding of key concepts
- 40-79%: Partial understanding with some gaps or minor errors
- 0-39%: Significant misunderstanding or missing key concepts

FEEDBACK GUIDELINES:
- "whatWasRight": Even for incorrect answers, find something to acknowledge (effort, partial understanding)
- "whatWasMissing": Be specific about what concepts were missing, not just "needs more detail"
- "misconceptions": Gently correct errors without being discouraging
- "suggestions": Give actionable tips like "Review the difference between X and Y" not just "study more"`;
}

// -----------------------------------------------------------------------------
// Parse and Validate Response
// -----------------------------------------------------------------------------

interface AIGradingResponse {
  percentage: number;
  feedback: {
    summary: string;
    whatWasRight: string[];
    whatWasMissing: string[];
    misconceptions: string[];
    suggestions: string[];
  };
  rubricScores?: RubricScore[];
  conceptsAssessed?: string[];
  conceptsMastered?: string[];
  conceptsToReview?: string[];
  confidence: number;
}

function parseGradingResponse(response: string): AIGradingResponse {
  let jsonStr = response.trim();

  // Remove markdown code blocks if present
  if (jsonStr.startsWith("```json")) {
    jsonStr = jsonStr.slice(7);
  } else if (jsonStr.startsWith("```")) {
    jsonStr = jsonStr.slice(3);
  }
  if (jsonStr.endsWith("```")) {
    jsonStr = jsonStr.slice(0, -3);
  }
  jsonStr = jsonStr.trim();

  try {
    const parsed = JSON.parse(jsonStr);

    // Validate structure
    if (
      typeof parsed.percentage !== "number" ||
      !parsed.feedback?.summary
    ) {
      throw new Error("Invalid grading response structure");
    }

    return {
      percentage: Math.min(100, Math.max(0, parsed.percentage)),
      feedback: {
        summary: parsed.feedback.summary || "Your answer has been graded.",
        whatWasRight: parsed.feedback.whatWasRight || [],
        whatWasMissing: parsed.feedback.whatWasMissing || [],
        misconceptions: parsed.feedback.misconceptions || [],
        suggestions: parsed.feedback.suggestions || ["Review the model solution to understand the complete answer."],
      },
      rubricScores: parsed.rubricScores,
      conceptsAssessed: parsed.conceptsAssessed,
      conceptsMastered: parsed.conceptsMastered,
      conceptsToReview: parsed.conceptsToReview,
      confidence: Math.min(1, Math.max(0, parsed.confidence || 0.8)),
    };
  } catch (error) {
    console.error("Failed to parse grading response:", error);
    console.error("Raw response:", response);
    throw new HttpsError(
      "internal",
      "Failed to parse AI grading response"
    );
  }
}

// -----------------------------------------------------------------------------
// Main Cloud Function: gradeAnswer
// -----------------------------------------------------------------------------

export const gradeAnswer = onCall({
  invoker: "public",
  timeoutSeconds: 60,
  memory: "256MiB",
}, async (callRequest) => {
  const startTime = Date.now();

  console.log("🎓 Curriculum grading request started:", {
    timestamp: new Date().toISOString(),
    userId: callRequest.auth?.uid,
    hasData: !!callRequest.data,
  });

  // Note: Authentication optional for now to support guest users
  const userId = callRequest.auth?.uid || "guest";
  const request = callRequest.data as GradingRequest;

  // Validate input
  if (!request.questionStem || !request.studentAnswer || !request.modelSolution) {
    throw new HttpsError(
      "invalid-argument",
      "Missing required fields: questionStem, studentAnswer, modelSolution"
    );
  }

  // Minimum answer length check
  if (request.studentAnswer.trim().length < 5) {
    throw new HttpsError(
      "invalid-argument",
      "Answer is too short. Please provide a more complete response."
    );
  }

  // MCQ should not call this endpoint
  if (request.questionType === "MCQ") {
    throw new HttpsError(
      "invalid-argument",
      "MCQ questions should be graded client-side"
    );
  }

  console.log(`📝 Grading ${request.questionType} for question ${request.questionId}`);

  try {
    // Get Gemini API key
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.error("Missing Gemini API key");
      throw new HttpsError(
        "failed-precondition",
        "AI grading service not configured"
      );
    }

    // Initialize Gemini 3 Flash
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-3-flash-preview",  // Gemini 3 Flash - latest and most capable
      generationConfig: {
        temperature: 0.2, // Low temperature for consistent grading
        maxOutputTokens: 2048,
        responseMimeType: "application/json",
      },
    });

    // Build prompt
    const prompt = buildGradingPrompt(request);

    // Call Gemini
    console.log("🤖 Calling Gemini for grading...");
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    console.log("✅ Received grading response, parsing...");

    // Parse response
    const aiResult = parseGradingResponse(responseText);

    // Calculate score based on difficulty
    const maxScore = calculateMaxPoints(request.questionType, request.difficulty);
    const score = Math.round((aiResult.percentage / 100) * maxScore);
    const correctness = getCorrectnessFromPercentage(aiResult.percentage);

    // Build final result
    const gradingResult: GradingResult = {
      score,
      maxScore,
      percentage: aiResult.percentage,
      correctness,
      feedback: aiResult.feedback,
      rubricScores: aiResult.rubricScores,
      conceptsAssessed: aiResult.conceptsAssessed,
      conceptsMastered: aiResult.conceptsMastered,
      conceptsToReview: aiResult.conceptsToReview,
      gradedAt: new Date().toISOString(),
      gradedBy: "ai",
      confidence: aiResult.confidence,
    };

    // Optionally save grading record for analytics (if user is authenticated)
    if (callRequest.auth?.uid) {
      try {
        await db
          .collection("users")
          .doc(userId)
          .collection("gradingHistory")
          .add({
            questionId: request.questionId,
            questionType: request.questionType,
            studentAnswer: request.studentAnswer,
            result: gradingResult,
            curriculum: request.curriculum,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          });
      } catch (saveError) {
        console.warn("Failed to save grading history:", saveError);
        // Don't fail the request for this
      }
    }

    const totalDuration = Date.now() - startTime;
    console.log(`✅ Grading completed in ${totalDuration}ms: ${correctness} (${aiResult.percentage}%)`);

    return gradingResult;

  } catch (error) {
    const totalDuration = Date.now() - startTime;
    console.error(`❌ Grading failed after ${totalDuration}ms:`, error);

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError(
      "internal",
      "Failed to grade answer. Please try again."
    );
  }
});

// -----------------------------------------------------------------------------
// Health Check
// -----------------------------------------------------------------------------

export const gradeAnswerHealth = onRequest(async (_req, res) => {
  const hasApiKey = !!process.env.GEMINI_API_KEY;

  res.json({
    status: hasApiKey ? "healthy" : "degraded",
    service: "curriculum-grading",
    provider: "gemini-3-flash-preview",
    timestamp: new Date().toISOString(),
    config: {
      hasGeminiKey: hasApiKey,
    },
  });
});

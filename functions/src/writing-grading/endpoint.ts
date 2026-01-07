// Writing Grading Service
// Grades essay/creative writing submissions using AI

import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Firestore if needed
const db = admin.firestore();

/**
 * Writing submission for grading
 */
interface WritingSubmission {
  promptId: string;
  promptText: string;
  promptType: "narrative" | "persuasive";
  response: string;
  wordCount: number;
  timeSpentSeconds?: number;
}

/**
 * Writing grading result
 */
interface WritingGradingResult {
  overallScore: number; // 0-100
  criteria: {
    content: { score: number; feedback: string };
    structure: { score: number; feedback: string };
    language: { score: number; feedback: string };
    creativity: { score: number; feedback: string };
  };
  strengths: string[];
  improvements: string[];
  overallFeedback: string;
  gradedAt: admin.firestore.FieldValue | string;
}

/**
 * Build the grading prompt based on writing type
 */
function buildGradingPrompt(submission: WritingSubmission): string {
  const typeGuidelines = submission.promptType === "narrative"
    ? `
For NARRATIVE writing, evaluate:
- Story structure (beginning, middle, end)
- Character development
- Use of descriptive language and sensory details
- Narrative voice and perspective
- Plot progression and tension
- Creative use of language and imagery`
    : `
For PERSUASIVE writing, evaluate:
- Clarity of argument/thesis
- Evidence and supporting points
- Logical structure and flow
- Addressing counter-arguments
- Persuasive techniques used
- Conclusion strength`;

  return `You are an expert writing assessor for Year 6-7 students preparing for NSW Selective High School exams.

WRITING PROMPT:
"${submission.promptText}"

WRITING TYPE: ${submission.promptType.toUpperCase()}
${typeGuidelines}

STUDENT'S RESPONSE (${submission.wordCount} words):
"""
${submission.response}
"""

Grade this response on a scale of 0-100 for each criterion and provide specific, constructive feedback.

Respond ONLY with a valid JSON object in this exact format (no markdown, no explanation):
{
  "overallScore": <number 0-100>,
  "criteria": {
    "content": {
      "score": <number 0-100>,
      "feedback": "<specific feedback about content/ideas>"
    },
    "structure": {
      "score": <number 0-100>,
      "feedback": "<specific feedback about organization/structure>"
    },
    "language": {
      "score": <number 0-100>,
      "feedback": "<specific feedback about language use/vocabulary>"
    },
    "creativity": {
      "score": <number 0-100>,
      "feedback": "<specific feedback about creativity/originality>"
    }
  },
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "improvements": ["<area for improvement 1>", "<area for improvement 2>"],
  "overallFeedback": "<2-3 sentence overall assessment that is encouraging but honest>"
}`;
}

/**
 * Parse and validate grading response
 */
function parseGradingResponse(response: string): Omit<WritingGradingResult, "gradedAt"> {
  // Try to extract JSON from the response
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
    if (typeof parsed.overallScore !== "number" ||
        !parsed.criteria?.content?.score ||
        !parsed.criteria?.structure?.score ||
        !parsed.criteria?.language?.score ||
        !parsed.criteria?.creativity?.score) {
      throw new Error("Invalid grading response structure");
    }

    return {
      overallScore: Math.min(100, Math.max(0, parsed.overallScore)),
      criteria: {
        content: {
          score: Math.min(100, Math.max(0, parsed.criteria.content.score)),
          feedback: parsed.criteria.content.feedback || "Good effort.",
        },
        structure: {
          score: Math.min(100, Math.max(0, parsed.criteria.structure.score)),
          feedback: parsed.criteria.structure.feedback || "Good organization.",
        },
        language: {
          score: Math.min(100, Math.max(0, parsed.criteria.language.score)),
          feedback: parsed.criteria.language.feedback || "Good language use.",
        },
        creativity: {
          score: Math.min(100, Math.max(0, parsed.criteria.creativity.score)),
          feedback: parsed.criteria.creativity.feedback || "Good creativity.",
        },
      },
      strengths: parsed.strengths || ["Good effort on this writing task."],
      improvements: parsed.improvements || ["Continue practicing writing regularly."],
      overallFeedback: parsed.overallFeedback || "Good work on this writing submission.",
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

/**
 * Grade a writing submission
 */
export const gradeWriting = onCall({
  invoker: "public",
}, async (request) => {
  const startTime = Date.now();

  console.log("🚀 Writing grading request started:", {
    timestamp: new Date().toISOString(),
    userId: request.auth?.uid,
    hasData: !!request.data,
  });

  // Check authentication
  if (!request.auth) {
    console.error("❌ Unauthenticated request");
    throw new HttpsError(
      "unauthenticated",
      "User must be authenticated to submit writing"
    );
  }

  const userId = request.auth.uid;
  const submission = request.data as WritingSubmission;

  // Validate input
  if (!submission.promptText || !submission.response) {
    throw new HttpsError(
      "invalid-argument",
      "Missing required fields: promptText, response"
    );
  }

  if (submission.wordCount < 50) {
    throw new HttpsError(
      "invalid-argument",
      "Writing must be at least 50 words"
    );
  }

  console.log(`Grading writing submission for user ${userId}`);

  try {
    // Get Gemini API key from environment
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.error("Missing Gemini API key");
      throw new HttpsError(
        "failed-precondition",
        "AI service not configured"
      );
    }

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: {
        temperature: 0.3, // Lower temperature for more consistent grading
        maxOutputTokens: 2048,
      },
    });

    // Build grading prompt
    const prompt = buildGradingPrompt(submission);

    // Call AI for grading
    console.log("Calling Gemini for grading...");
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    console.log("Received grading response, parsing...");

    // Parse response
    const gradingResult = parseGradingResponse(text);

    // Build full result with timestamp
    const fullResult: WritingGradingResult = {
      ...gradingResult,
      gradedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // Save to Firestore
    const submissionDoc = {
      userId,
      promptId: submission.promptId || "unknown",
      promptText: submission.promptText,
      promptType: submission.promptType,
      response: submission.response,
      wordCount: submission.wordCount,
      timeSpentSeconds: submission.timeSpentSeconds || null,
      grading: fullResult,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await db
      .collection("users")
      .doc(userId)
      .collection("nswSelectiveWriting")
      .add(submissionDoc);

    const totalDuration = Date.now() - startTime;
    console.log(`✅ Writing submission saved: ${docRef.id} in ${totalDuration}ms`);

    return {
      success: true,
      submissionId: docRef.id,
      grading: {
        ...gradingResult,
        gradedAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error("Writing grading error:", error);

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError(
      "internal",
      "Failed to grade writing submission"
    );
  }
});

/**
 * Health check for writing grading service
 */
export const writingGradingHealth = onRequest(async (_req, res) => {
  res.json({
    status: "healthy",
    service: "writing-grading",
    timestamp: new Date().toISOString(),
  });
});

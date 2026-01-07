// HTTP Endpoint for LLM Grading
// Implements /grade endpoint from COMBINED_LLM_GRADING_SPEC_v0_DEEPSEEK.md

import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
import { Request, Response } from "express";
import { 
  GradeRequestBody, 
  GradeRequestSchema, 
  GradingError 
} from "./types";
import { createGradingService } from "./service";
import Ajv from "ajv";

// Initialize Ajv for request validation
const ajv = new Ajv();
const validateRequestBody = ajv.compile(GradeRequestSchema);

/**
 * Validates Firebase ID token and extracts UID
 */
async function authenticateRequest(req: Request): Promise<string> {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new GradingError("UNAUTHORIZED", "Authorization header missing or invalid", 401);
  }
  
  const idToken = authHeader.slice(7); // Remove "Bearer " prefix
  
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return decodedToken.uid;
  } catch (error) {
    throw new GradingError("UNAUTHORIZED", "Invalid or expired token", 401);
  }
}

/**
 * Validates request body against schema
 */
function validateRequest(body: any): GradeRequestBody {
  if (!validateRequestBody(body)) {
    const errors = validateRequestBody.errors?.map(err => 
      `${err.instancePath} ${err.message}`
    ).join("; ") || "Invalid request format";
    
    throw new GradingError("INVALID_REQUEST", `Request validation failed: ${errors}`, 400);
  }
  
  return body as GradeRequestBody;
}

/**
 * Rate limiting check (simple implementation)
 */
class RateLimiter {
  private requests = new Map<string, { count: number; resetTime: number }>();
  private readonly maxRequests = 6; // per minute
  private readonly windowMs = 60 * 1000; // 1 minute
  
  checkRate(uid: string): boolean {
    const now = Date.now();
    const userRequests = this.requests.get(uid);
    
    if (!userRequests || now > userRequests.resetTime) {
      // Reset window
      this.requests.set(uid, { count: 1, resetTime: now + this.windowMs });
      return true;
    }
    
    if (userRequests.count >= this.maxRequests) {
      return false;
    }
    
    userRequests.count++;
    return true;
  }
}

const rateLimiter = new RateLimiter();

/**
 * Main grade endpoint handler
 */
async function gradeHandler(req: Request, res: Response): Promise<void> {
  // Set CORS headers
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  
  // Handle preflight
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }
  
  // Only allow POST
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: { code: "METHOD_NOT_ALLOWED", message: "Only POST is allowed" } });
    return;
  }
  
  try {
    // Authenticate request
    const uid = await authenticateRequest(req);
    
    // Rate limiting
    if (!rateLimiter.checkRate(uid)) {
      res.status(429).json({ 
        ok: false, 
        error: { code: "RATE_LIMIT", message: "Too many requests" } 
      });
      return;
    }
    
    // Validate request body
    const requestBody = validateRequest(req.body);
    
    // Create grading service with provider configuration
    const provider = (requestBody.options as any)?.provider || "gemini"; // Default to Gemini for speed
    const gradingService = createGradingService({
      provider: provider,
      deepseekApiKey: process.env.DEEPSEEK_API_KEY,
      geminiApiKey: process.env.GEMINI_API_KEY,
      maxLatencyMs: requestBody.options?.maxLatencyMs || 4000,
      enableEscalation: true,
      persistWeakRubrics: requestBody.options?.persistWeakRubric ?? true,
      enableHeuristic: true
    });
    
    // Perform grading
    const result = await gradingService.grade(
      requestBody.attemptId,
      requestBody.questionId,
      requestBody.studentAnswer,
      requestBody.options
    );
    
    // Success response
    res.status(200).json({
      ok: true,
      grading_v0: result.gradingBlock,
      ui: result.ui
    });
    
  } catch (error) {
    console.error("Grade endpoint error:", error);
    
    if (error instanceof GradingError) {
      res.status(error.statusCode).json({
        ok: false,
        error: {
          code: error.code,
          message: error.message
        }
      });
    } else {
      // Unexpected error - don't expose details
      res.status(500).json({
        ok: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An internal error occurred"
        }
      });
    }
  }
}

/**
 * Health check endpoint
 */
async function healthHandler(req: Request, res: Response): Promise<void> {
  res.set("Access-Control-Allow-Origin", "*");
  
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }
  
  try {
    // Basic health checks
    const checks = {
      timestamp: new Date().toISOString(),
      firebase: "ok",
      deepseek: "unknown"
    };
    
    // Test Firestore connection
    try {
      await admin.firestore().collection("_health").limit(1).get();
      checks.firebase = "ok";
    } catch (error) {
      checks.firebase = "error";
    }
    
    // Test LLM connections (optional, might be expensive)
    const testLLMs = req.query.test_llms === "true";
    if (testLLMs) {
      // Test DeepSeek
      try {
        const { testDeepSeekConnection } = await import("./adapters/deepseek.js");
        const deepseekApiKey = process.env.DEEPSEEK_API_KEY;
        
        if (deepseekApiKey) {
          const isConnected = await testDeepSeekConnection(deepseekApiKey);
          checks.deepseek = isConnected ? "ok" : "error";
        } else {
          checks.deepseek = "no_api_key";
        }
      } catch (error) {
        checks.deepseek = "error";
      }

      // Test Gemini
      try {
        const { testGeminiConnection } = await import("./adapters/gemini.js");
        const geminiApiKey = process.env.GEMINI_API_KEY;
        
        if (geminiApiKey) {
          const isConnected = await testGeminiConnection(geminiApiKey);
          (checks as any).gemini = isConnected ? "ok" : "error";
        } else {
          (checks as any).gemini = "no_api_key";
        }
      } catch (error) {
        (checks as any).gemini = "error";
      }
    }
    
    const allOk = checks.firebase === "ok" && 
                  (checks.deepseek === "ok" || checks.deepseek === "unknown");
    
    res.status(allOk ? 200 : 503).json({
      ok: allOk,
      checks
    });
    
  } catch (error) {
    res.status(503).json({
      ok: false,
      error: "Health check failed"
    });
  }
}

// Export Cloud Functions using v1 API 
export const grade = functions.https.onRequest(gradeHandler);

export const gradeHealth = functions.https.onRequest(healthHandler);

// Export for testing
export { gradeHandler, healthHandler };
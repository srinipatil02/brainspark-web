// Main LLM Grading Service
// Orchestrates the complete grading pipeline from COMBINED_LLM_GRADING_SPEC_v0_DEEPSEEK.md

import * as admin from "firebase-admin";
import { 
  GradeRequest, 
  GradeJSON, 
  GradingBlock, 
  LlmAdapter, 
  GradingError,
  WeakRubricDoc 
} from "./types";
import { validateGradingInputs } from "./sanitizer";
import { validateGradeJson } from "./validator";
import { 
  calculateScore, 
  shouldEscalate, 
  mergeEscalationResults, 
  buildGradingBlock 
} from "./scoring";
import { heuristicGrade } from "./heuristic";
import { createDeepSeekAdapters } from "./adapters/deepseek";
import { createGeminiAdapters } from "./adapters/gemini";
import { createHash } from "crypto";

/**
 * Configuration for the grading service
 */
interface GradingServiceConfig {
  provider: "deepseek" | "gemini";
  deepseekApiKey?: string;
  geminiApiKey?: string;
  maxLatencyMs: number;
  enableEscalation: boolean;
  persistWeakRubrics: boolean;
  enableHeuristic: boolean;
}

/**
 * Main grading service class
 */
export class GradingService {
  private adapters: {
    chat: LlmAdapter;
    reasoner?: LlmAdapter;
  };
  private db: admin.firestore.Firestore;
  private config: GradingServiceConfig;

  constructor(config: GradingServiceConfig) {
    this.config = config;
    this.db = admin.firestore();
    
    // Initialize LLM adapters based on provider
    if (config.provider === "deepseek") {
      if (!config.deepseekApiKey) {
        throw new Error("DeepSeek API key is required when using deepseek provider");
      }
      const deepseekAdapters = createDeepSeekAdapters(config.deepseekApiKey);
      this.adapters = {
        chat: deepseekAdapters.chat,
        reasoner: deepseekAdapters.reasoner
      };
    } else if (config.provider === "gemini") {
      if (!config.geminiApiKey) {
        throw new Error("Gemini API key is required when using gemini provider");
      }
      const geminiAdapters = createGeminiAdapters(config.geminiApiKey);
      this.adapters = {
        chat: geminiAdapters.flash,
        // Gemini doesn't have a separate reasoner model, use the same
        reasoner: geminiAdapters.flash
      };
    } else {
      throw new Error(`Unsupported provider: ${config.provider}`);
    }
  }

  /**
   * Main grading method - implements the complete pipeline
   */
  async grade(
    attemptId: string,
    questionId: string,
    studentAnswer: string,
    options?: {
      persistWeakRubric?: boolean;
      escalation?: "auto" | "never" | "always";
      maxLatencyMs?: number;
    }
  ): Promise<{
    gradingBlock: GradingBlock;
    ui: {
      showSolution: boolean;
      solution_md: string;
      student_feedback: string;
      parent_feedback: string;
    };
  }> {
    
    console.log(`🎯 LLM Grading Service started for question ${questionId}`);
    console.log(`📝 Student answer: "${studentAnswer}"`);
    console.log(`⚙️ Options:`, options);
    
    try {
      // Step 1: Fetch and validate question
      console.log(`📋 Step 1: Fetching question ${questionId}...`);
      const question = await this.fetchQuestion(questionId);
      console.log(`✅ Step 1: Question fetched successfully`);
      
      // Step 2: Validate inputs and sanitize
      const sanitized = validateGradingInputs(
        studentAnswer,
        question.stem_md,
        question.solution_md
      );
      
      // Step 3: Build grading request
      const gradeRequest: GradeRequest = {
        stem: sanitized.stem,
        referenceAnswer: sanitized.referenceAnswer,
        studentAnswer: sanitized.studentAnswer,
        meta: {
          subject: question.subject,
          topic: question.tags?.topics?.[0],
          year: question.tags?.years?.[0],
          qcs: question.QCS
        }
      };
      
      // Step 4: Get attempt data for penalties
      const attemptData = await this.fetchAttemptData(attemptId, questionId);
      
      // Step 5: Perform grading with escalation logic
      const gradingResult = await this.performGrading(gradeRequest, options);
      
      // Step 6: Calculate final score with penalties
      const scoreResult = calculateScore({
        gradeJson: gradingResult.gradeJson,
        hintUses: attemptData.hintUses,
        usedIdk: attemptData.idk,
        qcs: question.QCS,
        studentAnswerLength: studentAnswer.length
      });
      
      // Step 7: Build grading block
      const gradingBlock = buildGradingBlock(
        gradingResult.gradeJson,
        scoreResult,
        {
          engine: gradingResult.engine,
          provider: gradingResult.provider,
          questionId,
          setId: attemptData.setId,
          escalated: gradingResult.escalated,
          ...(gradingResult.escalatedTo && { escalatedTo: gradingResult.escalatedTo }),
          isHeuristic: gradingResult.isHeuristic
        }
      );
      
      // Step 8: Persist to Firestore
      await this.persistGrading(attemptId, questionId, gradingBlock);
      
      // Step 9: Optionally persist weak rubric
      if (options?.persistWeakRubric && gradingResult.gradeJson.inferred_key_facts.length > 0) {
        await this.persistWeakRubric(questionId, gradingResult.gradeJson, sanitized.referenceAnswer);
      }
      
      // Step 10: Build UI response
      const uiResponse = {
        showSolution: true,
        solution_md: question.solution_md,
        student_feedback: gradingBlock.feedback.student,
        parent_feedback: gradingBlock.feedback.parent
      };
      
      return {
        gradingBlock,
        ui: uiResponse
      };
      
    } catch (error) {
      if (error instanceof GradingError) {
        throw error;
      }
      
      // Log unexpected errors but don't expose details
      console.error("Grading service error:", error);
      throw new GradingError("INTERNAL_ERROR", "An internal error occurred during grading", 500);
    }
  }

  /**
   * Fetches question data and validates it's suitable for grading
   */
  private async fetchQuestion(questionId: string): Promise<any> {
    const questionRef = this.db.collection("questions").doc(questionId);
    const questionSnap = await questionRef.get();
    
    if (!questionSnap.exists) {
      throw new GradingError("QUESTION_NOT_FOUND", "Question not found", 404);
    }
    
    const question = questionSnap.data()!;
    
    // Validate question type
    if (question.type !== "SHORT_ANSWER") {
      throw new GradingError("NOT_SHORT_ANSWER", "Only SHORT_ANSWER questions are supported", 400);
    }
    
    // Validate subject - check tags.subjects array
    const subjects = question.tags?.subjects || [];
    const hasValidSubject = subjects.some((subject: string) => 
      ["science", "english"].includes(subject.toLowerCase())
    );
    if (!hasValidSubject) {
      throw new GradingError("NOT_SUPPORTED_SUBJECT", "Only Science and English subjects are supported", 400);
    }
    
    // Ensure required fields exist
    if (!question.stem_md || !question.solution_md) {
      throw new GradingError("INVALID_QUESTION", "Question missing required fields", 400);
    }
    
    return question;
  }

  /**
   * Fetches attempt data for penalty calculation
   */
  private async fetchAttemptData(attemptId: string, questionId: string): Promise<{
    hintUses?: number;
    idk?: boolean;
    setId?: string;
  }> {
    try {
      const answerRef = this.db
        .collection("attempts")
        .doc(attemptId)
        .collection("answers")
        .doc(questionId);
        
      const answerSnap = await answerRef.get();
      
      if (!answerSnap.exists) {
        return {};
      }
      
      const data = answerSnap.data()!;
      return {
        hintUses: data.hintUses || 0,
        idk: data.idk || false,
        setId: data.setId
      };
    } catch (error) {
      console.warn("Failed to fetch attempt data:", error);
      return {};
    }
  }

  /**
   * Performs the main grading with escalation logic
   */
  private async performGrading(
    request: GradeRequest,
    options?: { escalation?: "auto" | "never" | "always"; maxLatencyMs?: number }
  ): Promise<{
    gradeJson: GradeJSON;
    engine: string;
    provider: string;
    escalated: boolean;
    escalatedTo?: string;
    isHeuristic?: boolean;
  }> {
    
    const escalationPolicy = options?.escalation || "auto";
    const timeout = options?.maxLatencyMs || this.config.maxLatencyMs;
    
    // Create abort controller for timeout
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), timeout);
    
    try {
      // Primary grading attempt with chat model
      let primaryResult: GradeJSON | null = null;
      let primaryError: Error | null = null;
      
      try {
        primaryResult = await this.adapters.chat.grade(request, { signal: abortController.signal });
        
        // Validate JSON
        const validation = validateGradeJson(primaryResult);
        if (!validation.isValid) {
          // Attempt repair
          primaryResult = await this.adapters.chat.grade(request, { 
            repair: true, 
            signal: abortController.signal 
          });
          
          const repairValidation = validateGradeJson(primaryResult);
          if (!repairValidation.isValid) {
            primaryResult = null;
            primaryError = new Error(`Invalid JSON after repair: ${repairValidation.errors}`);
          }
        }
      } catch (error) {
        primaryError = error as Error;
        primaryResult = null;
      }
      
      // Check if escalation is needed
      let shouldEscalateToReasoner = false;
      
      if (escalationPolicy === "always") {
        shouldEscalateToReasoner = true;
      } else if (escalationPolicy === "auto" && primaryResult) {
        const escalationCheck = shouldEscalate(
          primaryResult.overall.confidence,
          primaryResult.overall.pct,
          true
        );
        shouldEscalateToReasoner = escalationCheck.shouldEscalate;
      } else if (escalationPolicy === "auto" && !primaryResult) {
        shouldEscalateToReasoner = true;
      }
      
      // Perform escalation if needed and reasoner is available
      if (shouldEscalateToReasoner && this.config.enableEscalation && this.adapters.reasoner) {
        try {
          const secondaryResult = await this.adapters.reasoner.grade(request, { 
            signal: abortController.signal 
          });
          
          const secondaryValidation = validateGradeJson(secondaryResult);
          if (secondaryValidation.isValid) {
            if (primaryResult) {
              // Merge results
              const primaryScore = calculateScore({
                gradeJson: primaryResult,
                hintUses: 0,
                usedIdk: false,
                qcs: request.meta.qcs || 1,
                studentAnswerLength: request.studentAnswer.length
              });
              
              const secondaryScore = calculateScore({
                gradeJson: secondaryResult,
                hintUses: 0,
                usedIdk: false,
                qcs: request.meta.qcs || 1,
                studentAnswerLength: request.studentAnswer.length
              });
              
              const merged = mergeEscalationResults(
                primaryResult,
                secondaryResult,
                primaryScore,
                secondaryScore
              );
              
              return {
                gradeJson: merged.mergedJson,
                engine: this.adapters.reasoner!.name(),
                provider: this.config.provider,
                escalated: true,
                escalatedTo: this.adapters.reasoner!.name()
              };
            } else {
              // Use secondary result only
              return {
                gradeJson: secondaryResult,
                engine: this.adapters.reasoner!.name(),
                provider: this.config.provider,
                escalated: true,
                escalatedTo: this.adapters.reasoner!.name()
              };
            }
          }
        } catch (escalationError) {
          console.warn("Escalation failed:", escalationError);
        }
      }
      
      // Use primary result if available
      if (primaryResult) {
        return {
          gradeJson: primaryResult,
          engine: this.adapters.chat.name(),
          provider: this.config.provider,
          escalated: false
        };
      }
      
      // Fallback to heuristic grading
      if (this.config.enableHeuristic) {
        const heuristicResult = heuristicGrade(request);
        return {
          gradeJson: heuristicResult,
          engine: "heuristic",
          provider: "internal",
          escalated: false,
          isHeuristic: true
        };
      }
      
      // If all else fails, throw the original error
      throw primaryError || new Error("All grading methods failed");
      
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Persists grading result to Firestore
   */
  private async persistGrading(
    attemptId: string,
    questionId: string,
    gradingBlock: GradingBlock
  ): Promise<void> {
    const answerRef = this.db
      .collection("attempts")
      .doc(attemptId)
      .collection("answers")
      .doc(questionId);
    
    // Set server timestamp
    gradingBlock.ts = admin.firestore.FieldValue.serverTimestamp();
    
    await answerRef.set({
      grading_v0: gradingBlock
    }, { merge: true });
  }

  /**
   * Persists weak rubric if new
   */
  private async persistWeakRubric(
    questionId: string,
    gradeJson: GradeJSON,
    referenceAnswer: string
  ): Promise<void> {
    try {
      // Create content hash
      const content = `${referenceAnswer}:deepseek-chat:v1`;
      const contentHash = createHash("sha256").update(content).digest("hex");
      
      const rubricRef = this.db
        .collection("weakRubrics")
        .doc(questionId)
        .collection("versions")
        .doc(contentHash);
      
      const existingRubric = await rubricRef.get();
      
      if (existingRubric.exists) {
        // Increment usage count
        await rubricRef.update({
          usageCount: admin.firestore.FieldValue.increment(1)
        });
      } else {
        // Create new rubric
        const weakRubric: WeakRubricDoc = {
          source: "llm_v0",
          inferred_key_facts: gradeJson.inferred_key_facts,
          misconceptions: gradeJson.misconceptions.length > 0 ? gradeJson.misconceptions : undefined,
          contentHash,
          approved: false,
          usageCount: 1,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        };
        
        await rubricRef.set(weakRubric);
      }
    } catch (error) {
      console.warn("Failed to persist weak rubric:", error);
      // Don't throw - this is optional
    }
  }
}

/**
 * Factory function to create grading service
 */
export function createGradingService(config: Partial<GradingServiceConfig>): GradingService {
  const fullConfig: GradingServiceConfig = {
    provider: config.provider || "deepseek",
    deepseekApiKey: config.deepseekApiKey || process.env.DEEPSEEK_API_KEY,
    geminiApiKey: config.geminiApiKey || process.env.GEMINI_API_KEY,
    maxLatencyMs: config.maxLatencyMs || 4000,
    enableEscalation: config.enableEscalation ?? true,
    persistWeakRubrics: config.persistWeakRubrics ?? true,
    enableHeuristic: config.enableHeuristic ?? true
  };
  
  // Validate required API keys based on provider
  if (fullConfig.provider === "deepseek" && !fullConfig.deepseekApiKey) {
    throw new Error("DeepSeek API key is required when using deepseek provider");
  }
  if (fullConfig.provider === "gemini" && !fullConfig.geminiApiKey) {
    throw new Error("Gemini API key is required when using gemini provider");
  }
  
  return new GradingService(fullConfig);
}
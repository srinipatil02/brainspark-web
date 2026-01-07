// functions/src/analytics.ts
import {onDocumentWritten} from "firebase-functions/v2/firestore";
import {logger} from "firebase-functions";
import {db, now} from "./utils";
import {FieldValue, Timestamp} from "firebase-admin/firestore";
import {DateTime} from "luxon";

// Analytics aggregation for BrainSpark - Real-time daily analytics and topic mastery
// Based on ANALYTICS_SPEC.md requirements

interface AnswerDoc {
  userId: string;
  setId: string;
  questionId: string;
  subject: string;
  topics: string[];
  year: number;
  difficulty: number;
  qcs: number;
  response?: any;
  isFinal: boolean;
  isCorrect: boolean;
  hintUses: number;
  idk: boolean;
  isRemedial: boolean;
  timeTakenMs: number;
  startedAt: Timestamp;
  finalizedAt?: Timestamp;
}

interface DailyDeltas {
  pointsDelta: number;
  attemptedDelta: number;
  finalizedDelta: number;
  correctDelta: number;
  incorrectDelta: number;
  idkDelta: number;
  hintDelta: number;
  timeTotalDelta: number;
  firstTryCorrectDelta: number;
  remedialsStartedDelta: number;
  remedialsCorrectDelta: number;
  subjectsDelta: { [subject: string]: { attempted: number; correct: number; timeTotalMs: number } };
  topicsDelta: { [topic: string]: { attempted: number; correct: number; idk: number; hintUses: number; timeTotalMs: number } };
  qcsBin: string;
  diffBin: string;
  idkAdd?: string;
  idkRemove?: string;
}

/**
 * Convert timestamp to YYYY-MM-DD in Asia/Singapore timezone
 */
function toLocalDayKey(timestamp: Timestamp | Date, timezone = "Asia/Singapore"): string {
  const dt = DateTime.fromJSDate(timestamp instanceof Timestamp ? timestamp.toDate() : timestamp)
    .setZone(timezone);
  return dt.toFormat("yyyy-MM-dd");
}

/**
 * Get QCS bin for histogram
 */
function getQcsBin(qcs: number): string {
  if (qcs >= 1 && qcs <= 4) return "1-4";
  if (qcs >= 5 && qcs <= 8) return "5-8";
  if (qcs >= 9 && qcs <= 12) return "9-12";
  if (qcs >= 13 && qcs <= 16) return "13-16";
  if (qcs >= 17 && qcs <= 20) return "17-20";
  return "1-4"; // fallback
}

/**
 * Get difficulty bin for histogram
 */
function getDiffBin(difficulty: number): string {
  return String(Math.max(1, Math.min(5, Math.floor(difficulty))));
}

/**
 * Compute deltas between before/after answer docs
 */
function computeDeltas(before: AnswerDoc | null, after: AnswerDoc): DailyDeltas {
  const deltas: DailyDeltas = {
    pointsDelta: 0,
    attemptedDelta: 0,
    finalizedDelta: 0,
    correctDelta: 0,
    incorrectDelta: 0,
    idkDelta: 0,
    hintDelta: 0,
    timeTotalDelta: 0,
    firstTryCorrectDelta: 0,
    remedialsStartedDelta: 0,
    remedialsCorrectDelta: 0,
    subjectsDelta: {},
    topicsDelta: {},
    qcsBin: getQcsBin(after.qcs),
    diffBin: getDiffBin(after.difficulty),
  };

  // Points delta
  const afterPoints = after.isCorrect ? after.qcs : 0;
  const beforePoints = before?.isCorrect ? before.qcs : 0;
  deltas.pointsDelta = afterPoints - beforePoints;

  // First creation counts as attempted
  if (!before) {
    deltas.attemptedDelta = 1;
  }

  // Finalized delta
  const becameFinal = (!before || !before.isFinal) && after.isFinal;
  if (becameFinal) {
    deltas.finalizedDelta = 1;
  }

  // Correct/incorrect deltas
  if (after.isCorrect && !before?.isCorrect) deltas.correctDelta = 1;
  if (!after.isCorrect && before?.isCorrect) deltas.correctDelta = -1;
  if (!after.isCorrect && after.isFinal && (!before || before.isCorrect)) deltas.incorrectDelta = 1;
  if (after.isCorrect && before && !before.isCorrect && before.isFinal) deltas.incorrectDelta = -1;

  // IDK delta
  if (after.idk && !before?.idk) deltas.idkDelta = 1;
  if (!after.idk && before?.idk) deltas.idkDelta = -1;

  // Hint delta (count questions with any hints)
  const afterHasHints = after.hintUses > 0 ? 1 : 0;
  const beforeHasHints = (before?.hintUses || 0) > 0 ? 1 : 0;
  deltas.hintDelta = afterHasHints - beforeHasHints;

  // Time delta
  deltas.timeTotalDelta = (after.timeTakenMs || 0) - (before?.timeTakenMs || 0);

  // First try correct (correct with no hints, no IDK, not remedial)
  const afterFirstTry = after.isCorrect && after.hintUses === 0 && !after.idk && !after.isRemedial ? 1 : 0;
  const beforeFirstTry = before?.isCorrect && before.hintUses === 0 && !before.idk && !before.isRemedial ? 1 : 0;
  deltas.firstTryCorrectDelta = afterFirstTry - beforeFirstTry;

  // Remedial tracking
  if (after.isRemedial && !before?.isRemedial) deltas.remedialsStartedDelta = 1;
  if (after.isRemedial && after.isCorrect && (!before || !before.isCorrect)) {
    deltas.remedialsCorrectDelta = 1;
  }

  // Subject deltas
  logger.info(`🔍 DEBUG: Answer subject field: "${after.subject}", topics: ${JSON.stringify(after.topics)}`);
  
  if (after.subject) {
    logger.info(`✅ Processing subject: ${after.subject}`);
    if (!deltas.subjectsDelta[after.subject]) {
      deltas.subjectsDelta[after.subject] = {attempted: 0, correct: 0, timeTotalMs: 0};
    }
    const subjectDelta = deltas.subjectsDelta[after.subject];

    if (!before) subjectDelta.attempted = 1;
    if (after.isCorrect && !before?.isCorrect) subjectDelta.correct = 1;
    if (!after.isCorrect && before?.isCorrect) subjectDelta.correct = -1;
    subjectDelta.timeTotalMs = deltas.timeTotalDelta;
    
    logger.info(`📊 Subject delta for ${after.subject}: ${JSON.stringify(subjectDelta)}`);
  } else {
    logger.warn(`⚠️ Missing subject field in answer document! Full answer: ${JSON.stringify(after)}`);
  }

  // Topic deltas
  for (const topic of after.topics || []) {
    if (!deltas.topicsDelta[topic]) {
      deltas.topicsDelta[topic] = {attempted: 0, correct: 0, idk: 0, hintUses: 0, timeTotalMs: 0};
    }
    const topicDelta = deltas.topicsDelta[topic];

    if (!before) topicDelta.attempted = 1;
    if (after.isCorrect && !before?.isCorrect) topicDelta.correct = 1;
    if (!after.isCorrect && before?.isCorrect) topicDelta.correct = -1;
    if (after.idk && !before?.idk) topicDelta.idk = 1;
    if (!after.idk && before?.idk) topicDelta.idk = -1;

    const afterTopicHints = after.hintUses > 0 ? after.hintUses : 0;
    const beforeTopicHints = (before?.hintUses || 0) > 0 ? (before?.hintUses || 0) : 0;
    topicDelta.hintUses = afterTopicHints - beforeTopicHints;

    topicDelta.timeTotalMs = deltas.timeTotalDelta;
  }

  // IDK list management
  if (after.idk && !before?.idk) {
    deltas.idkAdd = after.questionId;
  }
  if (!after.idk && before?.idk) {
    deltas.idkRemove = after.questionId;
  }

  return deltas;
}

/**
 * Apply daily deltas to user daily aggregates
 */
async function applyDailyDelta(userId: string, dayKey: string, deltas: DailyDeltas) {
  const dayDocRef = db.doc(`userDaily/${userId}/days/${dayKey}`);

  const updateData: any = {
    points: FieldValue.increment(deltas.pointsDelta),
    attempted: FieldValue.increment(deltas.attemptedDelta),
    finalized: FieldValue.increment(deltas.finalizedDelta),
    correct: FieldValue.increment(deltas.correctDelta),
    incorrect: FieldValue.increment(deltas.incorrectDelta),
    idkCount: FieldValue.increment(deltas.idkDelta),
    hintCount: FieldValue.increment(deltas.hintDelta),
    timeTotalMs: FieldValue.increment(deltas.timeTotalDelta),
    firstTryCorrect: FieldValue.increment(deltas.firstTryCorrectDelta),
    remedialsStarted: FieldValue.increment(deltas.remedialsStartedDelta),
    remedialsCorrect: FieldValue.increment(deltas.remedialsCorrectDelta),
    updatedAt: FieldValue.serverTimestamp(),
  };

  // Subject aggregates
  logger.info(`📝 Applying subject deltas: ${JSON.stringify(deltas.subjectsDelta)}`);
  for (const [subject, delta] of Object.entries(deltas.subjectsDelta)) {
    updateData[`subjects.${subject}.attempted`] = FieldValue.increment(delta.attempted);
    updateData[`subjects.${subject}.correct`] = FieldValue.increment(delta.correct);
    updateData[`subjects.${subject}.timeTotalMs`] = FieldValue.increment(delta.timeTotalMs);
    logger.info(`🎯 Setting subjects.${subject}: attempted +${delta.attempted}, correct +${delta.correct}`);
  }

  // Topic aggregates
  for (const [topic, delta] of Object.entries(deltas.topicsDelta)) {
    const safeTopic = topic.replace(/[.#$/[\]]/g, "_"); // Firestore field name safety
    updateData[`topics.${safeTopic}.attempted`] = FieldValue.increment(delta.attempted);
    updateData[`topics.${safeTopic}.correct`] = FieldValue.increment(delta.correct);
    updateData[`topics.${safeTopic}.idk`] = FieldValue.increment(delta.idk);
    updateData[`topics.${safeTopic}.hintUses`] = FieldValue.increment(delta.hintUses);
    updateData[`topics.${safeTopic}.timeTotalMs`] = FieldValue.increment(delta.timeTotalMs);
  }

  // QCS and difficulty histograms
  updateData[`qcsHist.${deltas.qcsBin}`] = FieldValue.increment(1);
  updateData[`diffHist.${deltas.diffBin}`] = FieldValue.increment(1);

  await dayDocRef.set(updateData, {merge: true});

  // Handle IDK list updates separately (arrays need special handling)
  if (deltas.idkAdd || deltas.idkRemove) {
    await db.runTransaction(async (transaction) => {
      const dayDoc = await transaction.get(dayDocRef);
      const dayData = dayDoc.data() || {};
      let idkList = dayData.idkList || [];

      if (deltas.idkAdd && !idkList.includes(deltas.idkAdd)) {
        idkList.push(deltas.idkAdd);
        // Cap at 100 items
        if (idkList.length > 100) {
          idkList = idkList.slice(-100);
        }
      }

      if (deltas.idkRemove) {
        idkList = idkList.filter((qId: string) => qId !== deltas.idkRemove);
      }

      transaction.set(dayDocRef, {idkList}, {merge: true});
    });
  }
}

/**
 * Update topic mastery using EWMA (Exponentially Weighted Moving Average)
 */
async function updateTopicMastery(userId: string, topics: string[], answer: AnswerDoc) {
  if (!topics || topics.length === 0) return;

  const alpha = 0.2; // Learning rate for EWMA

  for (const topic of topics) {
    const safeTopic = topic.replace(/[.#$/[\]]/g, "_");
    const topicRef = db.doc(`userTopic/${userId}/topics/${safeTopic}`);

    await db.runTransaction(async (transaction) => {
      const topicDoc = await transaction.get(topicRef);
      const topicData = topicDoc.data() || {
        mastery: 50, // Start at 50%
        attempts: 0,
        correct: 0,
        lastActivity: now(),
        trend7d: 0,
        recommendedNext: [],
      };

      // Calculate score based on performance
      let score = 0;
      if (answer.isCorrect && answer.hintUses === 0 && !answer.idk) {
        score = 1.0; // Perfect
      } else if (answer.isCorrect && answer.hintUses > 0) {
        score = 0.7; // Good with help
      } else {
        score = 0.0; // Incorrect or IDK
      }

      // Weight by question complexity (normalized QCS)
      const weight = answer.qcs / 20;
      const weightedScore = score * (0.5 + 0.5 * weight);

      // Apply EWMA
      const oldMastery = topicData.mastery / 100; // Convert to 0-1
      const newMastery = Math.max(0, Math.min(1, (1 - alpha) * oldMastery + alpha * weightedScore));

      // Update counts
      const newAttempts = topicData.attempts + 1;
      const newCorrect = topicData.correct + (answer.isCorrect ? 1 : 0);

      // Calculate 7-day trend (simplified - just track improvement)
      const trend7d = (newMastery * 100) - topicData.mastery;

      transaction.set(topicRef, {
        mastery: Math.round(newMastery * 100), // Convert back to 0-100
        attempts: newAttempts,
        correct: newCorrect,
        lastActivity: answer.finalizedAt || now(),
        trend7d: Math.round(trend7d * 10) / 10, // Round to 1 decimal
        recommendedNext: topicData.recommendedNext || [],
      });
    });
  }
}

/**
 * Sync subject time data from old format to new format
 * Called periodically to ensure subject time data is properly formatted
 */
async function syncSubjectTimeData(userId: string, dayKey: string) {
  try {
    // Check for old format data (yyyyMMdd)
    const oldFormatKey = dayKey.replace(/-/g, ""); // Convert 2025-08-17 to 20250817
    const oldDocRef = db.doc(`userDaily/${userId}/days/${oldFormatKey}`);
    const newDocRef = db.doc(`userDaily/${userId}/days/${dayKey}`);

    const oldDoc = await oldDocRef.get();
    if (oldDoc.exists) {
      const oldData = oldDoc.data();
      if (oldData?.subjectTime) {
        logger.info(`Syncing subject time from ${oldFormatKey} to ${dayKey}`);
        
        // Copy subject time data to new format
        await newDocRef.set({
          subjectTime: oldData.subjectTime,
          updatedAt: FieldValue.serverTimestamp(),
        }, {merge: true});
        
        // Optionally delete old format data
        // await oldDocRef.delete();
      }
    }
  } catch (error) {
    logger.warn(`Error syncing subject time data: ${error}`);
  }
}

/**
 * Main analytics trigger - processes answer document changes
 */
export const onAnswerWrite = onDocumentWritten(
  "attempts/{attemptId}/answers/{questionId}",
  async (event) => {
    const before = event.data?.before?.exists ? event.data.before.data() as AnswerDoc : null;
    const after = event.data?.after?.exists ? event.data.after.data() as AnswerDoc : null;

    if (!after) {
      logger.info("Answer document deleted, skipping analytics");
      return;
    }

    // Only process on finalization or changes to finalized answers
    const becameFinal = (!before || !before.isFinal) && after.isFinal;
    const updatedFinal = before?.isFinal && after.isFinal && (
      before.isCorrect !== after.isCorrect ||
      before.hintUses !== after.hintUses ||
      before.idk !== after.idk ||
      before.timeTakenMs !== after.timeTakenMs
    );

    if (!becameFinal && !updatedFinal) {
      logger.info("Answer not finalized or no relevant changes, skipping analytics");
      return;
    }

    try {
      const userId = after.userId;
      const finalizedDate = after.finalizedAt ? after.finalizedAt.toDate() : new Date();
      const dayKey = toLocalDayKey(finalizedDate);

      logger.info(`Processing analytics for user ${userId}, day ${dayKey}`);

      // Compute deltas
      const deltas = computeDeltas(before, after);

      // Apply to daily aggregates
      await applyDailyDelta(userId, dayKey, deltas);

      // Update topic mastery
      await updateTopicMastery(userId, after.topics || [], after);

      // Sync subject time data to ensure proper format
      await syncSubjectTimeData(userId, dayKey);

      logger.info(`Analytics updated successfully for user ${userId}`);
    } catch (error) {
      logger.error("Error updating analytics:", error);
      throw error;
    }
  }
);

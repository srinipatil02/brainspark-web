// =============================================================================
// NSW SELECTIVE PROGRESS SERVICE
// =============================================================================
// FILE: src/services/nsw-selective/progressService.ts
// DOMAIN: NSW Selective Exam Prep
// PURPOSE: Firestore-synced progress tracking with localStorage fallback
// DO NOT: Mix with curriculum progress or use learningArc fields

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ArchetypeId, ArchetypeProgress, ARCHETYPE_CATALOG } from '@/types/nsw-selective';

// =============================================================================
// CONSTANTS
// =============================================================================

const PROGRESS_COLLECTION = 'archetypeProgress';
const LOCAL_PROGRESS_KEY = 'nsw-selective-archetype-progress';
const LOCAL_SYNC_STATUS_KEY = 'nsw-selective-sync-status';

// =============================================================================
// LOCAL STORAGE HELPERS
// =============================================================================

function getLocalProgress(): Record<string, ArchetypeProgress> {
  if (typeof window === 'undefined') return {};
  try {
    const stored = localStorage.getItem(LOCAL_PROGRESS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function setLocalProgress(progress: Record<string, ArchetypeProgress>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_PROGRESS_KEY, JSON.stringify(progress));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
}

function getLocalSyncStatus(): { lastSynced: string | null; userId: string | null } {
  if (typeof window === 'undefined') return { lastSynced: null, userId: null };
  try {
    const stored = localStorage.getItem(LOCAL_SYNC_STATUS_KEY);
    return stored ? JSON.parse(stored) : { lastSynced: null, userId: null };
  } catch {
    return { lastSynced: null, userId: null };
  }
}

function setLocalSyncStatus(userId: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_SYNC_STATUS_KEY, JSON.stringify({
      lastSynced: new Date().toISOString(),
      userId,
    }));
  } catch (error) {
    console.error('Error saving sync status:', error);
  }
}

// =============================================================================
// FIRESTORE HELPERS
// =============================================================================

function progressToFirestore(progress: ArchetypeProgress): Record<string, unknown> {
  return {
    ...progress,
    lastPracticed: progress.lastPracticed instanceof Date
      ? Timestamp.fromDate(progress.lastPracticed)
      : Timestamp.fromDate(new Date(progress.lastPracticed)),
    nextReviewDate: progress.nextReviewDate instanceof Date
      ? Timestamp.fromDate(progress.nextReviewDate)
      : Timestamp.fromDate(new Date(progress.nextReviewDate)),
    createdAt: progress.createdAt instanceof Date
      ? Timestamp.fromDate(progress.createdAt)
      : Timestamp.fromDate(new Date(progress.createdAt)),
    updatedAt: Timestamp.now(),
  };
}

function firestoreToProgress(data: Record<string, unknown>): ArchetypeProgress {
  return {
    ...data,
    lastPracticed: data.lastPracticed instanceof Timestamp
      ? data.lastPracticed.toDate()
      : new Date(data.lastPracticed as string),
    nextReviewDate: data.nextReviewDate instanceof Timestamp
      ? data.nextReviewDate.toDate()
      : new Date(data.nextReviewDate as string),
    createdAt: data.createdAt instanceof Timestamp
      ? data.createdAt.toDate()
      : new Date(data.createdAt as string),
    updatedAt: data.updatedAt instanceof Timestamp
      ? data.updatedAt.toDate()
      : new Date(data.updatedAt as string),
  } as ArchetypeProgress;
}

// =============================================================================
// MAIN PROGRESS FUNCTIONS
// =============================================================================

/**
 * Get progress for a specific archetype
 * @param userId - Firebase user ID (null for localStorage-only)
 * @param archetypeId - The archetype ID (qa1-qa20)
 */
export async function getArchetypeProgress(
  userId: string | null,
  archetypeId: ArchetypeId
): Promise<ArchetypeProgress | null> {
  // Always check localStorage first for fast access
  const localProgress = getLocalProgress();
  const localData = localProgress[archetypeId] || null;

  // If no user, return localStorage data
  if (!userId) {
    return localData;
  }

  // Try Firestore
  try {
    const docRef = doc(db, PROGRESS_COLLECTION, `${userId}_${archetypeId}`);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const firestoreData = firestoreToProgress(docSnap.data());

      // Update localStorage cache
      localProgress[archetypeId] = firestoreData;
      setLocalProgress(localProgress);

      return firestoreData;
    }

    // No Firestore data, return localStorage
    return localData;
  } catch (error) {
    console.error('Error fetching progress from Firestore:', error);
    // Fallback to localStorage
    return localData;
  }
}

/**
 * Get progress for all archetypes
 * @param userId - Firebase user ID (null for localStorage-only)
 */
export async function getAllArchetypeProgress(
  userId: string | null
): Promise<Record<ArchetypeId, ArchetypeProgress>> {
  const localProgress = getLocalProgress() as Record<ArchetypeId, ArchetypeProgress>;

  // If no user, return localStorage data
  if (!userId) {
    return localProgress;
  }

  // Try Firestore
  try {
    const q = query(
      collection(db, PROGRESS_COLLECTION),
      where('userId', '==', userId)
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return localProgress;
    }

    const firestoreProgress: Record<string, ArchetypeProgress> = {};
    snapshot.docs.forEach(doc => {
      const data = firestoreToProgress(doc.data());
      firestoreProgress[data.archetypeId] = data;
    });

    // Merge with localStorage (Firestore takes priority)
    const mergedProgress = { ...localProgress, ...firestoreProgress };

    // Update localStorage cache
    setLocalProgress(mergedProgress);

    return mergedProgress as Record<ArchetypeId, ArchetypeProgress>;
  } catch (error) {
    console.error('Error fetching all progress from Firestore:', error);
    return localProgress;
  }
}

/**
 * Save progress for an archetype
 * @param userId - Firebase user ID (null for localStorage-only)
 * @param archetypeId - The archetype ID
 * @param progress - Partial progress data to update
 */
export async function saveArchetypeProgress(
  userId: string | null,
  archetypeId: ArchetypeId,
  progress: Partial<ArchetypeProgress>
): Promise<void> {
  const localProgress = getLocalProgress();

  // Build the complete progress object
  const existing = localProgress[archetypeId] || {
    userId: userId || 'local-user',
    archetypeId,
    questionsAttempted: 0,
    questionsCorrect: 0,
    averageTimeSeconds: 0,
    masteryLevel: 1 as const,
    commonErrors: [],
    errorFrequency: {},
    methodologyScore: 0,
    lastPracticed: new Date(),
    nextReviewDate: new Date(),
    consecutiveCorrect: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const updatedProgress: ArchetypeProgress = {
    ...existing,
    ...progress,
    userId: userId || 'local-user',
    archetypeId,
    updatedAt: new Date(),
  };

  // Always save to localStorage
  localProgress[archetypeId] = updatedProgress;
  setLocalProgress(localProgress);

  // If user is authenticated, also save to Firestore
  if (userId) {
    try {
      const docRef = doc(db, PROGRESS_COLLECTION, `${userId}_${archetypeId}`);
      await setDoc(docRef, progressToFirestore(updatedProgress), { merge: true });
    } catch (error) {
      console.error('Error saving progress to Firestore:', error);
      // Progress is still saved in localStorage, so don't throw
    }
  }
}

/**
 * Update progress after answering a question
 * @param userId - Firebase user ID (null for localStorage-only)
 * @param archetypeId - The archetype ID
 * @param isCorrect - Whether the answer was correct
 * @param timeSeconds - Time taken to answer
 * @param errorType - Type of error if incorrect
 */
export async function updateProgressAfterQuestion(
  userId: string | null,
  archetypeId: ArchetypeId,
  isCorrect: boolean,
  timeSeconds: number,
  errorType?: string
): Promise<void> {
  const existing = await getArchetypeProgress(userId, archetypeId);

  const questionsAttempted = (existing?.questionsAttempted || 0) + 1;
  const questionsCorrect = (existing?.questionsCorrect || 0) + (isCorrect ? 1 : 0);
  const consecutiveCorrect = isCorrect ? (existing?.consecutiveCorrect || 0) + 1 : 0;

  // Calculate new average time
  const previousTotal = (existing?.averageTimeSeconds || 0) * (existing?.questionsAttempted || 0);
  const averageTimeSeconds = (previousTotal + timeSeconds) / questionsAttempted;

  // Update error frequency if incorrect
  const errorFrequency: Record<string, number> = { ...(existing?.errorFrequency || {}) };
  if (!isCorrect && errorType) {
    errorFrequency[errorType] = (errorFrequency[errorType] || 0) + 1;
  }

  // Calculate mastery level (1-5 based on accuracy and volume)
  const accuracy = questionsCorrect / questionsAttempted;
  let masteryLevel: 1 | 2 | 3 | 4 | 5 = 1;
  if (questionsAttempted >= 5 && accuracy >= 0.9) masteryLevel = 5;
  else if (questionsAttempted >= 4 && accuracy >= 0.8) masteryLevel = 4;
  else if (questionsAttempted >= 3 && accuracy >= 0.7) masteryLevel = 3;
  else if (questionsAttempted >= 2 && accuracy >= 0.5) masteryLevel = 2;

  // Calculate next review date using spaced repetition
  const nextReviewDate = calculateNextReviewDate(masteryLevel, consecutiveCorrect);

  await saveArchetypeProgress(userId, archetypeId, {
    questionsAttempted,
    questionsCorrect,
    averageTimeSeconds,
    consecutiveCorrect,
    errorFrequency,
    masteryLevel,
    lastPracticed: new Date(),
    nextReviewDate,
  });
}

/**
 * Calculate exam readiness (0-100)
 * @param userId - Firebase user ID (null for localStorage-only)
 */
export async function calculateExamReadiness(userId: string | null): Promise<number> {
  const allProgress = await getAllArchetypeProgress(userId);
  const archetypeCount = Object.keys(ARCHETYPE_CATALOG).length;

  if (Object.keys(allProgress).length === 0) return 0;

  let totalScore = 0;
  Object.values(allProgress).forEach(progress => {
    totalScore += progress.masteryLevel;
  });

  return Math.round((totalScore / (archetypeCount * 5)) * 100);
}

// =============================================================================
// SYNC FUNCTIONS
// =============================================================================

/**
 * Sync localStorage progress to Firestore when user logs in
 * Merges data, keeping the most recent for each archetype
 * @param userId - Firebase user ID
 */
export async function syncLocalProgressToFirestore(userId: string): Promise<{
  synced: number;
  errors: number;
}> {
  const localProgress = getLocalProgress();
  const localEntries = Object.entries(localProgress);

  if (localEntries.length === 0) {
    setLocalSyncStatus(userId);
    return { synced: 0, errors: 0 };
  }

  let synced = 0;
  let errors = 0;

  try {
    // Fetch existing Firestore progress
    const q = query(
      collection(db, PROGRESS_COLLECTION),
      where('userId', '==', userId)
    );
    const snapshot = await getDocs(q);

    const firestoreProgress: Record<string, ArchetypeProgress> = {};
    snapshot.docs.forEach(doc => {
      const data = firestoreToProgress(doc.data());
      firestoreProgress[data.archetypeId] = data;
    });

    // Use batch write for efficiency
    const batch = writeBatch(db);

    for (const [archetypeId, localData] of localEntries) {
      const firestoreData = firestoreProgress[archetypeId];

      // Merge strategy: keep the one with more questions attempted
      // or more recent if equal
      let shouldSync = true;
      if (firestoreData) {
        if (firestoreData.questionsAttempted > localData.questionsAttempted) {
          shouldSync = false;
        } else if (firestoreData.questionsAttempted === localData.questionsAttempted) {
          const localUpdated = localData.updatedAt instanceof Date
            ? localData.updatedAt
            : new Date(localData.updatedAt);
          const firestoreUpdated = firestoreData.updatedAt instanceof Date
            ? firestoreData.updatedAt
            : new Date(firestoreData.updatedAt);
          shouldSync = localUpdated > firestoreUpdated;
        }
      }

      if (shouldSync) {
        try {
          const docRef = doc(db, PROGRESS_COLLECTION, `${userId}_${archetypeId}`);
          const progressWithUser = { ...localData, userId };
          batch.set(docRef, progressToFirestore(progressWithUser), { merge: true });
          synced++;
        } catch {
          errors++;
        }
      }
    }

    await batch.commit();

    // Update local storage with user ID
    const updatedProgress: Record<string, ArchetypeProgress> = {};
    for (const [archetypeId, data] of Object.entries(localProgress)) {
      updatedProgress[archetypeId] = { ...data, userId };
    }
    setLocalProgress(updatedProgress);
    setLocalSyncStatus(userId);

    console.log(`Progress sync complete: ${synced} synced, ${errors} errors`);
    return { synced, errors };
  } catch (error) {
    console.error('Error syncing progress to Firestore:', error);
    return { synced: 0, errors: localEntries.length };
  }
}

/**
 * Clear local progress (for logout or reset)
 */
export function clearLocalProgress(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(LOCAL_PROGRESS_KEY);
    localStorage.removeItem(LOCAL_SYNC_STATUS_KEY);
  } catch (error) {
    console.error('Error clearing local progress:', error);
  }
}

// =============================================================================
// SPACED REPETITION HELPER
// =============================================================================

/**
 * Calculate next review date based on mastery level and streak
 * Uses a simplified spaced repetition algorithm
 */
function calculateNextReviewDate(masteryLevel: number, consecutiveCorrect: number): Date {
  const now = new Date();

  // Base intervals in days
  const intervals: Record<number, number> = {
    1: 1,   // Level 1: review tomorrow
    2: 3,   // Level 2: review in 3 days
    3: 7,   // Level 3: review in 1 week
    4: 14,  // Level 4: review in 2 weeks
    5: 30,  // Level 5: review in 1 month
  };

  let daysUntilReview = intervals[masteryLevel] || 1;

  // Bonus for consecutive correct answers
  if (consecutiveCorrect >= 3) {
    daysUntilReview = Math.round(daysUntilReview * 1.5);
  }

  const nextReview = new Date(now);
  nextReview.setDate(nextReview.getDate() + daysUntilReview);

  return nextReview;
}

// =============================================================================
// EXPORTS
// =============================================================================

export default {
  getArchetypeProgress,
  getAllArchetypeProgress,
  saveArchetypeProgress,
  updateProgressAfterQuestion,
  calculateExamReadiness,
  syncLocalProgressToFirestore,
  clearLocalProgress,
};

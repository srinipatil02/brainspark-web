'use client';

import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './useAuth';
import {
  GradingResult,
  QuestionResult,
  Correctness,
  getMasteryLevel,
  MasteryLevel,
  SetAttempt,
  QuestionResultSnapshot,
} from '@/types/grading';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface SetProgress {
  completedQuestions: number[];  // indices of completed questions (0-9)
  answers: Record<number, string>;  // question index -> user answer
  results: Record<number, QuestionResult>;  // question index -> grading result
  totalScore: number;  // cumulative score
  totalMaxScore: number;  // cumulative max possible score
  lastAccessed: number;  // timestamp
  totalQuestions: number;
  // NEW: Attempt tracking
  currentAttemptStarted?: string;  // ISO timestamp when current attempt started
  attemptHistory?: SetAttempt[];   // All completed attempts
  bestScore?: number;              // Best score achieved
  bestPercentage?: number;         // Best percentage achieved
}

export interface AllSetsProgress {
  [setId: string]: SetProgress;
}

const STORAGE_KEY = 'brainspark-set-progress';

// ============ localStorage helpers ============
function getStoredProgress(): AllSetsProgress {
  if (typeof window === 'undefined') return {};
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function saveProgressToStorage(progress: AllSetsProgress) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (e) {
    console.error('Failed to save progress to localStorage:', e);
  }
}

function getSetProgressFromStorage(setId: string): SetProgress | null {
  const allProgress = getStoredProgress();
  return allProgress[setId] || null;
}

function saveSetProgressToStorage(setId: string, progress: SetProgress) {
  const allProgress = getStoredProgress();
  allProgress[setId] = progress;
  saveProgressToStorage(allProgress);
}

// Normalize a single QuestionResult to ensure all fields exist
function normalizeQuestionResult(result: Partial<QuestionResult> | null | undefined): QuestionResult | null {
  if (!result) return null;

  return {
    answer: result.answer || '',
    score: typeof result.score === 'number' ? result.score : 0,
    maxScore: typeof result.maxScore === 'number' ? result.maxScore : 1,
    percentage: typeof result.percentage === 'number' ? result.percentage : 0,
    correctness: result.correctness || 'incorrect',
    gradedAt: result.gradedAt || new Date().toISOString(),
    gradedBy: result.gradedBy || 'auto',
    attemptNumber: typeof result.attemptNumber === 'number' ? result.attemptNumber : 1,
    feedback: result.feedback ? {
      summary: result.feedback.summary || 'Your answer has been graded.',
      whatWasRight: Array.isArray(result.feedback.whatWasRight) ? result.feedback.whatWasRight : [],
      whatWasMissing: Array.isArray(result.feedback.whatWasMissing) ? result.feedback.whatWasMissing : [],
      misconceptions: Array.isArray(result.feedback.misconceptions) ? result.feedback.misconceptions : [],
      suggestions: Array.isArray(result.feedback.suggestions) ? result.feedback.suggestions : [],
    } : undefined,
  };
}

// Normalize all results in a record
function normalizeResults(results: Record<number, Partial<QuestionResult>> | undefined): Record<number, QuestionResult> {
  if (!results || typeof results !== 'object') return {};

  const normalized: Record<number, QuestionResult> = {};
  for (const [key, value] of Object.entries(results)) {
    const normalizedResult = normalizeQuestionResult(value);
    if (normalizedResult) {
      normalized[Number(key)] = normalizedResult;
    }
  }
  return normalized;
}

// Normalize progress data to ensure all fields exist with correct types
function normalizeProgress(data: Partial<SetProgress> | null | undefined, totalQuestions: number): SetProgress {
  if (!data) {
    return {
      completedQuestions: [],
      answers: {},
      results: {},
      totalScore: 0,
      totalMaxScore: 0,
      lastAccessed: Date.now(),
      totalQuestions,
      currentAttemptStarted: undefined,
      attemptHistory: [],
      bestScore: 0,
      bestPercentage: 0,
    };
  }

  return {
    completedQuestions: Array.isArray(data.completedQuestions) ? data.completedQuestions : [],
    answers: data.answers && typeof data.answers === 'object' ? data.answers : {},
    results: normalizeResults(data.results as Record<number, Partial<QuestionResult>> | undefined),
    totalScore: typeof data.totalScore === 'number' ? data.totalScore : 0,
    totalMaxScore: typeof data.totalMaxScore === 'number' ? data.totalMaxScore : 0,
    lastAccessed: typeof data.lastAccessed === 'number' ? data.lastAccessed : Date.now(),
    totalQuestions: typeof data.totalQuestions === 'number' ? data.totalQuestions : totalQuestions,
    currentAttemptStarted: data.currentAttemptStarted,
    attemptHistory: Array.isArray(data.attemptHistory) ? data.attemptHistory : [],
    bestScore: typeof data.bestScore === 'number' ? data.bestScore : 0,
    bestPercentage: typeof data.bestPercentage === 'number' ? data.bestPercentage : 0,
  };
}

// Generate a unique attempt ID
function generateAttemptId(): string {
  return `attempt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Build SetAttempt from current progress
function buildSetAttempt(
  setId: string,
  progress: SetProgress,
  startedAt: string
): SetAttempt {
  const results = progress.results || {};
  const resultEntries = Object.entries(results);

  // Count by correctness
  let questionsCorrect = 0;
  let questionsPartial = 0;
  let questionsIncorrect = 0;

  // Collect concepts
  const allConceptsAssessed: string[] = [];
  const allConceptsMastered: string[] = [];
  const allConceptsToReview: string[] = [];
  const allMisconceptions: string[] = [];

  // Build question snapshots
  const questionResults: QuestionResultSnapshot[] = [];

  for (const [indexStr, result] of resultEntries) {
    const questionIndex = parseInt(indexStr, 10);

    // Count correctness
    if (result.correctness === 'correct') questionsCorrect++;
    else if (result.correctness === 'partial') questionsPartial++;
    else questionsIncorrect++;

    // Collect concepts from this question
    if (result.conceptsAssessed) allConceptsAssessed.push(...result.conceptsAssessed);
    if (result.conceptsMastered) allConceptsMastered.push(...result.conceptsMastered);
    if (result.conceptsToReview) allConceptsToReview.push(...result.conceptsToReview);
    if (result.feedback?.misconceptions) allMisconceptions.push(...result.feedback.misconceptions);

    // Snapshot
    questionResults.push({
      questionIndex,
      answer: result.answer,
      score: result.score,
      maxScore: result.maxScore,
      percentage: result.percentage,
      correctness: result.correctness,
      conceptsToReview: result.conceptsToReview,
    });
  }

  // Calculate percentage
  const percentage = progress.totalMaxScore > 0
    ? Math.round((progress.totalScore / progress.totalMaxScore) * 100)
    : 0;

  return {
    attemptId: generateAttemptId(),
    setId,
    startedAt,
    completedAt: new Date().toISOString(),
    questionsAttempted: resultEntries.length,
    questionsCorrect,
    questionsPartial,
    questionsIncorrect,
    totalScore: progress.totalScore,
    totalMaxScore: progress.totalMaxScore,
    percentage,
    masteryLevel: getMasteryLevel(percentage),
    conceptsAssessed: [...new Set(allConceptsAssessed)],
    conceptsMastered: [...new Set(allConceptsMastered)],
    conceptsToReview: [...new Set(allConceptsToReview)],
    misconceptions: [...new Set(allMisconceptions)],
    questionResults,
  };
}

// ============ Firestore helpers ============
async function getSetProgressFromFirestore(userId: string, setId: string): Promise<SetProgress | null> {
  try {
    const docRef = doc(db, 'users', userId, 'progress', setId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as SetProgress;
    }
    return null;
  } catch (e) {
    console.error('Failed to get progress from Firestore:', e);
    return null;
  }
}

// Recursively remove undefined values from object (Firestore doesn't accept undefined)
function removeUndefinedDeep(value: unknown): unknown {
  if (value === undefined) {
    return null; // Convert undefined to null for Firestore
  }
  if (value === null || typeof value !== 'object') {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(item => removeUndefinedDeep(item));
  }
  const cleaned: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value)) {
    if (val !== undefined) {
      cleaned[key] = removeUndefinedDeep(val);
    }
  }
  return cleaned;
}

function removeUndefined(obj: SetProgress): Record<string, unknown> {
  return removeUndefinedDeep(obj) as Record<string, unknown>;
}

async function saveSetProgressToFirestore(userId: string, setId: string, progress: SetProgress) {
  try {
    const docRef = doc(db, 'users', userId, 'progress', setId);
    // Clean undefined values before saving to Firestore
    const cleanedProgress = removeUndefined(progress);
    await setDoc(docRef, cleanedProgress, { merge: true });
  } catch (e) {
    console.error('Failed to save progress to Firestore:', e);
  }
}

// Merge localStorage progress into Firestore (used on login)
async function syncLocalProgressToFirestore(userId: string) {
  const localProgress = getStoredProgress();

  for (const [setId, progress] of Object.entries(localProgress)) {
    const firestoreProgress = await getSetProgressFromFirestore(userId, setId);

    if (!firestoreProgress) {
      // No Firestore data, upload local progress (ensure all fields exist)
      const normalizedProgress: SetProgress = {
        ...progress,
        completedQuestions: progress.completedQuestions || [],
        answers: progress.answers || {},
        results: progress.results || {},
        totalScore: progress.totalScore || 0,
        totalMaxScore: progress.totalMaxScore || 0,
      };
      await saveSetProgressToFirestore(userId, setId, normalizedProgress);
    } else {
      // Merge: combine completed questions from both sources
      const mergedCompleted = [...new Set([
        ...(firestoreProgress.completedQuestions || []),
        ...(progress.completedQuestions || []),
      ])];

      const mergedAnswers = {
        ...progress.answers,
        ...firestoreProgress.answers, // Firestore takes priority for conflicts
      };

      // Merge results, Firestore takes priority
      const mergedResults = {
        ...(progress.results || {}),
        ...(firestoreProgress.results || {}),
      };

      // Recalculate totals from merged results
      const totalScore = Object.values(mergedResults).reduce((sum, r) => sum + r.score, 0);
      const totalMaxScore = Object.values(mergedResults).reduce((sum, r) => sum + r.maxScore, 0);

      const merged: SetProgress = {
        completedQuestions: mergedCompleted,
        answers: mergedAnswers,
        results: mergedResults,
        totalScore,
        totalMaxScore,
        lastAccessed: Math.max(firestoreProgress.lastAccessed, progress.lastAccessed),
        totalQuestions: progress.totalQuestions,
      };

      await saveSetProgressToFirestore(userId, setId, merged);
    }
  }

  // Clear localStorage after sync
  localStorage.removeItem(STORAGE_KEY);
}

// ============ Main Hook ============
export function useSetProgress(setId: string, totalQuestions: number = 10) {
  const { user, loading: authLoading } = useAuth();
  const [progress, setProgress] = useState<SetProgress>({
    completedQuestions: [],
    answers: {},
    results: {},
    totalScore: 0,
    totalMaxScore: 0,
    lastAccessed: Date.now(),
    totalQuestions,
  });
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasSynced, setHasSynced] = useState(false);

  // Load progress on mount or when auth changes
  useEffect(() => {
    if (authLoading) return;

    async function loadProgress() {
      if (user) {
        // Sync localStorage to Firestore on first login
        if (!hasSynced) {
          await syncLocalProgressToFirestore(user.uid);
          setHasSynced(true);
        }

        // Load from Firestore
        const firestoreProgress = await getSetProgressFromFirestore(user.uid, setId);
        if (firestoreProgress) {
          setProgress(normalizeProgress(firestoreProgress, totalQuestions));
        }
      } else {
        // Load from localStorage for guests
        const localProgress = getSetProgressFromStorage(setId);
        if (localProgress) {
          setProgress(normalizeProgress(localProgress, totalQuestions));
        }
      }
      setIsLoaded(true);
    }

    loadProgress();
  }, [setId, user, authLoading, hasSynced, totalQuestions]);

  // Real-time updates for authenticated users
  useEffect(() => {
    if (!user || authLoading) return;

    const docRef = doc(db, 'users', user.uid, 'progress', setId);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setProgress(normalizeProgress(docSnap.data() as Partial<SetProgress>, totalQuestions));
      }
    });

    return () => unsubscribe();
  }, [user, authLoading, setId, totalQuestions]);

  // Save progress helper
  const saveProgress = useCallback(async (newProgress: SetProgress) => {
    setProgress(newProgress);

    if (user) {
      await saveSetProgressToFirestore(user.uid, setId, newProgress);
    } else {
      saveSetProgressToStorage(setId, newProgress);
    }
  }, [user, setId]);

  // Mark a question as completed with optional grading result
  const markCompleted = useCallback((
    questionIndex: number,
    answer: string,
    gradingResult?: GradingResult
  ) => {
    setProgress(prev => {
      const existingCompleted = prev.completedQuestions || [];
      const newCompleted = existingCompleted.includes(questionIndex)
        ? existingCompleted
        : [...existingCompleted, questionIndex];

      // Build question result if grading provided
      const questionResult: QuestionResult | undefined = gradingResult ? {
        answer,
        score: gradingResult.score,
        maxScore: gradingResult.maxScore,
        percentage: gradingResult.percentage,
        correctness: gradingResult.correctness,
        gradedAt: gradingResult.gradedAt,
        gradedBy: gradingResult.gradedBy,
        attemptNumber: (prev.results[questionIndex]?.attemptNumber || 0) + 1,
        feedback: gradingResult.feedback,  // Store the detailed AI feedback
        // Concept tracking for weakness analysis
        conceptsAssessed: gradingResult.conceptsAssessed,
        conceptsMastered: gradingResult.conceptsMastered,
        conceptsToReview: gradingResult.conceptsToReview,
      } : undefined;

      // Calculate new scores
      const newResults = questionResult
        ? { ...prev.results, [questionIndex]: questionResult }
        : prev.results;

      const { totalScore, totalMaxScore } = calculateTotals(newResults);

      const newProgress: SetProgress = {
        ...prev,
        completedQuestions: newCompleted,
        answers: { ...prev.answers, [questionIndex]: answer },
        results: newResults,
        totalScore,
        totalMaxScore,
        lastAccessed: Date.now(),
      };

      // Save asynchronously
      if (user) {
        saveSetProgressToFirestore(user.uid, setId, newProgress);
      } else {
        saveSetProgressToStorage(setId, newProgress);
      }

      return newProgress;
    });
  }, [user, setId]);

  // Calculate totals from results
  function calculateTotals(results: Record<number, QuestionResult> | undefined): {
    totalScore: number;
    totalMaxScore: number;
  } {
    if (!results) return { totalScore: 0, totalMaxScore: 0 };
    const entries = Object.values(results);
    return {
      totalScore: entries.reduce((sum, r) => sum + r.score, 0),
      totalMaxScore: entries.reduce((sum, r) => sum + r.maxScore, 0),
    };
  }

  // Save answer without marking complete
  const saveAnswer = useCallback((questionIndex: number, answer: string) => {
    setProgress(prev => {
      const newProgress: SetProgress = {
        ...prev,
        answers: { ...prev.answers, [questionIndex]: answer },
        lastAccessed: Date.now(),
      };

      // Save asynchronously
      if (user) {
        saveSetProgressToFirestore(user.uid, setId, newProgress);
      } else {
        saveSetProgressToStorage(setId, newProgress);
      }

      return newProgress;
    });
  }, [user, setId]);

  // Start a new attempt (reset current progress but keep history)
  const startNewAttempt = useCallback(async () => {
    const newProgress: SetProgress = {
      completedQuestions: [],
      answers: {},
      results: {},
      totalScore: 0,
      totalMaxScore: 0,
      lastAccessed: Date.now(),
      totalQuestions,
      currentAttemptStarted: new Date().toISOString(),
      attemptHistory: progress.attemptHistory || [],
      bestScore: progress.bestScore || 0,
      bestPercentage: progress.bestPercentage || 0,
    };

    await saveProgress(newProgress);
  }, [totalQuestions, saveProgress, progress.attemptHistory, progress.bestScore, progress.bestPercentage]);

  // Complete the current attempt and save to history
  const completeAttempt = useCallback(async (): Promise<SetAttempt | null> => {
    const startedAt = progress.currentAttemptStarted || new Date().toISOString();
    const attempt = buildSetAttempt(setId, progress, startedAt);

    // Update best scores
    const newBestScore = Math.max(progress.bestScore || 0, attempt.totalScore);
    const newBestPercentage = Math.max(progress.bestPercentage || 0, attempt.percentage);

    // Add to history (keep last 10 attempts)
    const newHistory = [...(progress.attemptHistory || []), attempt].slice(-10);

    const newProgress: SetProgress = {
      ...progress,
      attemptHistory: newHistory,
      bestScore: newBestScore,
      bestPercentage: newBestPercentage,
      lastAccessed: Date.now(),
    };

    await saveProgress(newProgress);
    return attempt;
  }, [setId, progress, saveProgress]);

  // Reset set progress (alias for startNewAttempt for backwards compatibility)
  const resetProgress = useCallback(async () => {
    await startNewAttempt();
  }, [startNewAttempt]);

  // Computed values
  const completedCount = (progress.completedQuestions || []).length;
  const isSetComplete = completedCount === totalQuestions;
  const progressPercent = Math.round((completedCount / totalQuestions) * 100);

  // Score-related computed values
  const scorePercent = progress.totalMaxScore > 0
    ? Math.round((progress.totalScore / progress.totalMaxScore) * 100)
    : 0;
  const correctCount = Object.values(progress.results || {}).filter(
    r => r.correctness === 'correct'
  ).length;
  const partialCount = Object.values(progress.results || {}).filter(
    r => r.correctness === 'partial'
  ).length;
  const incorrectCount = Object.values(progress.results || {}).filter(
    r => r.correctness === 'incorrect'
  ).length;
  const masteryLevel: MasteryLevel = getMasteryLevel(scorePercent);

  // Attempt history
  const attemptHistory = progress.attemptHistory || [];
  const attemptCount = attemptHistory.length;
  const currentAttemptNumber = attemptCount + 1;

  return {
    progress,
    isLoaded,
    completedCount,
    isSetComplete,
    progressPercent,
    // Score-related values
    totalScore: progress.totalScore,
    totalMaxScore: progress.totalMaxScore,
    scorePercent,
    correctCount,
    partialCount,
    incorrectCount,
    masteryLevel,
    // Attempt tracking
    attemptHistory,
    attemptCount,
    currentAttemptNumber,
    bestScore: progress.bestScore || 0,
    bestPercentage: progress.bestPercentage || 0,
    currentAttemptStarted: progress.currentAttemptStarted,
    // Functions
    markCompleted,
    saveAnswer,
    resetProgress,
    startNewAttempt,
    completeAttempt,
    isQuestionCompleted: (index: number) => (progress.completedQuestions || []).includes(index),
    getAnswer: (index: number) => progress.answers?.[index] || '',
    getResult: (index: number) => progress.results?.[index] || null,
    isAuthenticated: !!user,
  };
}

// ============ Hook for Overview Page ============
export function useAllSetsProgress() {
  const { user, loading: authLoading } = useAuth();
  const [allProgress, setAllProgress] = useState<AllSetsProgress>({});
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    async function loadAllProgress() {
      if (user) {
        // Load all progress documents from user's subcollection
        try {
          const { collection, getDocs } = await import('firebase/firestore');
          const progressRef = collection(db, 'users', user.uid, 'progress');
          const snapshot = await getDocs(progressRef);

          const progress: AllSetsProgress = {};
          snapshot.forEach((doc) => {
            progress[doc.id] = doc.data() as SetProgress;
          });
          setAllProgress(progress);
        } catch (e) {
          console.error('Failed to load progress from Firestore:', e);
          setAllProgress({});
        }
      } else {
        setAllProgress(getStoredProgress());
      }
      setIsLoaded(true);
    }

    loadAllProgress();
  }, [user, authLoading]);

  // Real-time updates for authenticated users
  useEffect(() => {
    if (!user || authLoading) return;

    let unsubscribe: (() => void) | undefined;
    const userId = user.uid; // Capture uid to avoid null check issues in async closure

    async function setupListener() {
      const { collection, onSnapshot: onSnapshotFn } = await import('firebase/firestore');
      const progressRef = collection(db, 'users', userId, 'progress');

      unsubscribe = onSnapshotFn(progressRef, (snapshot) => {
        const progress: AllSetsProgress = {};
        snapshot.forEach((doc) => {
          progress[doc.id] = doc.data() as SetProgress;
        });
        setAllProgress(progress);
      });
    }

    setupListener();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user, authLoading]);

  const getSetProgress = useCallback((setId: string): SetProgress | null => {
    return allProgress[setId] || null;
  }, [allProgress]);

  const getCompletedCount = useCallback((setId: string): number => {
    return allProgress[setId]?.completedQuestions?.length || 0;
  }, [allProgress]);

  // Refresh function to reload progress
  const refreshProgress = useCallback(async () => {
    if (user) {
      try {
        const { collection, getDocs } = await import('firebase/firestore');
        const progressRef = collection(db, 'users', user.uid, 'progress');
        const snapshot = await getDocs(progressRef);

        const progress: AllSetsProgress = {};
        snapshot.forEach((doc) => {
          progress[doc.id] = doc.data() as SetProgress;
        });
        setAllProgress(progress);
      } catch (e) {
        console.error('Failed to refresh progress:', e);
      }
    } else {
      setAllProgress(getStoredProgress());
    }
  }, [user]);

  return {
    allProgress,
    isLoaded,
    getSetProgress,
    getCompletedCount,
    refreshProgress,
    isAuthenticated: !!user,
  };
}

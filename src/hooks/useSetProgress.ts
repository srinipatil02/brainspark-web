'use client';

import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './useAuth';

export interface SetProgress {
  completedQuestions: number[];  // indices of completed questions (0-9)
  answers: Record<number, string>;  // question index -> user answer
  lastAccessed: number;  // timestamp
  totalQuestions: number;
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

async function saveSetProgressToFirestore(userId: string, setId: string, progress: SetProgress) {
  try {
    const docRef = doc(db, 'users', userId, 'progress', setId);
    await setDoc(docRef, progress, { merge: true });
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
      // No Firestore data, upload local progress
      await saveSetProgressToFirestore(userId, setId, progress);
    } else {
      // Merge: combine completed questions from both sources
      const mergedCompleted = [...new Set([
        ...firestoreProgress.completedQuestions,
        ...progress.completedQuestions,
      ])];

      const mergedAnswers = {
        ...progress.answers,
        ...firestoreProgress.answers, // Firestore takes priority for conflicts
      };

      const merged: SetProgress = {
        completedQuestions: mergedCompleted,
        answers: mergedAnswers,
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
          setProgress(firestoreProgress);
        }
      } else {
        // Load from localStorage for guests
        const localProgress = getSetProgressFromStorage(setId);
        if (localProgress) {
          setProgress(localProgress);
        }
      }
      setIsLoaded(true);
    }

    loadProgress();
  }, [setId, user, authLoading, hasSynced]);

  // Real-time updates for authenticated users
  useEffect(() => {
    if (!user || authLoading) return;

    const docRef = doc(db, 'users', user.uid, 'progress', setId);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setProgress(docSnap.data() as SetProgress);
      }
    });

    return () => unsubscribe();
  }, [user, authLoading, setId]);

  // Save progress helper
  const saveProgress = useCallback(async (newProgress: SetProgress) => {
    setProgress(newProgress);

    if (user) {
      await saveSetProgressToFirestore(user.uid, setId, newProgress);
    } else {
      saveSetProgressToStorage(setId, newProgress);
    }
  }, [user, setId]);

  // Mark a question as completed
  const markCompleted = useCallback((questionIndex: number, answer: string) => {
    setProgress(prev => {
      const newCompleted = prev.completedQuestions.includes(questionIndex)
        ? prev.completedQuestions
        : [...prev.completedQuestions, questionIndex];

      const newProgress: SetProgress = {
        ...prev,
        completedQuestions: newCompleted,
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

  // Reset set progress
  const resetProgress = useCallback(async () => {
    const newProgress: SetProgress = {
      completedQuestions: [],
      answers: {},
      lastAccessed: Date.now(),
      totalQuestions,
    };

    await saveProgress(newProgress);
  }, [totalQuestions, saveProgress]);

  // Computed values
  const completedCount = progress.completedQuestions.length;
  const isSetComplete = completedCount === totalQuestions;
  const progressPercent = Math.round((completedCount / totalQuestions) * 100);

  return {
    progress,
    isLoaded,
    completedCount,
    isSetComplete,
    progressPercent,
    markCompleted,
    saveAnswer,
    resetProgress,
    isQuestionCompleted: (index: number) => progress.completedQuestions.includes(index),
    getAnswer: (index: number) => progress.answers[index] || '',
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
    return allProgress[setId]?.completedQuestions.length || 0;
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

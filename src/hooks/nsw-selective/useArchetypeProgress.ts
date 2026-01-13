// =============================================================================
// USE ARCHETYPE PROGRESS HOOK
// =============================================================================
// FILE: src/hooks/nsw-selective/useArchetypeProgress.ts
// DOMAIN: NSW Selective Exam Prep
// PURPOSE: React hook for tracking and updating archetype progress
// DO NOT: Import curriculum hooks or use learningArc fields

'use client';

import { useState, useEffect, useCallback } from 'react';
import { ArchetypeId } from '@/types';
import { ArchetypeProgress, ARCHETYPE_CATALOG } from '@/types/nsw-selective';
import { useAuth } from '@/contexts/AuthContext';
import progressService from '@/services/nsw-selective/progressService';
import {
  getArchetypeProgress as getArchetypeProgressSync,
  getAllArchetypeProgress as getAllArchetypeProgressSync,
  saveArchetypeProgress as saveArchetypeProgressSync,
  updateProgressAfterQuestion as updateProgressAfterQuestionSync,
  calculateExamReadiness as calculateExamReadinessSync,
} from '@/services/nsw-selective/archetypeService';

// =============================================================================
// SINGLE ARCHETYPE PROGRESS HOOK
// =============================================================================

interface UseArchetypeProgressReturn {
  progress: ArchetypeProgress | null;
  isLoading: boolean;
  updateProgress: (isCorrect: boolean, timeSeconds: number, errorType?: string) => void;
  resetProgress: () => void;
  accuracy: number;
}

/**
 * Hook for tracking progress on a single archetype
 * Uses Firestore when authenticated, localStorage as fallback
 * @param archetypeId - The archetype ID (qa1-qa20)
 */
export function useArchetypeProgress(archetypeId: ArchetypeId): UseArchetypeProgressReturn {
  const { user } = useAuth();
  const userId = user?.uid || null;

  const [progress, setProgress] = useState<ArchetypeProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load progress on mount and when user changes
  useEffect(() => {
    let isMounted = true;

    const loadProgress = async () => {
      setIsLoading(true);
      try {
        const stored = await progressService.getArchetypeProgress(userId, archetypeId);
        if (isMounted) {
          setProgress(stored);
        }
      } catch (error) {
        console.error('Error loading progress:', error);
        // Fallback to sync localStorage
        if (isMounted) {
          setProgress(getArchetypeProgressSync(archetypeId));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadProgress();

    return () => {
      isMounted = false;
    };
  }, [archetypeId, userId]);

  // Update progress after answering a question
  const updateProgress = useCallback(async (
    isCorrect: boolean,
    timeSeconds: number,
    errorType?: string
  ) => {
    try {
      await progressService.updateProgressAfterQuestion(
        userId,
        archetypeId,
        isCorrect,
        timeSeconds,
        errorType
      );
      // Refresh state
      const updated = await progressService.getArchetypeProgress(userId, archetypeId);
      setProgress(updated);
    } catch (error) {
      console.error('Error updating progress:', error);
      // Fallback to sync update
      updateProgressAfterQuestionSync(archetypeId, isCorrect, timeSeconds, errorType);
      setProgress(getArchetypeProgressSync(archetypeId));
    }
  }, [archetypeId, userId]);

  // Reset progress for this archetype
  const resetProgress = useCallback(async () => {
    try {
      await progressService.saveArchetypeProgress(userId, archetypeId, {
        questionsAttempted: 0,
        questionsCorrect: 0,
        averageTimeSeconds: 0,
        masteryLevel: 1,
        consecutiveCorrect: 0,
        errorFrequency: {},
        commonErrors: [],
      });
      const updated = await progressService.getArchetypeProgress(userId, archetypeId);
      setProgress(updated);
    } catch (error) {
      console.error('Error resetting progress:', error);
      // Fallback to sync
      saveArchetypeProgressSync(archetypeId, {
        questionsAttempted: 0,
        questionsCorrect: 0,
        averageTimeSeconds: 0,
        masteryLevel: 1,
        consecutiveCorrect: 0,
        errorFrequency: {},
        commonErrors: [],
      });
      setProgress(getArchetypeProgressSync(archetypeId));
    }
  }, [archetypeId, userId]);

  // Calculate accuracy
  const accuracy = progress && progress.questionsAttempted > 0
    ? Math.round((progress.questionsCorrect / progress.questionsAttempted) * 100)
    : 0;

  return {
    progress,
    isLoading,
    updateProgress,
    resetProgress,
    accuracy,
  };
}

// =============================================================================
// ALL ARCHETYPES PROGRESS HOOK
// =============================================================================

interface UseAllArchetypeProgressReturn {
  allProgress: Record<ArchetypeId, ArchetypeProgress>;
  isLoading: boolean;
  examReadiness: number;
  weakArchetypes: ArchetypeId[];
  strongArchetypes: ArchetypeId[];
  notStartedArchetypes: ArchetypeId[];
  refreshProgress: () => void;
}

/**
 * Hook for tracking progress across all 20 archetypes
 * Uses Firestore when authenticated, localStorage as fallback
 * Used for dashboard and insights
 */
export function useAllArchetypeProgress(): UseAllArchetypeProgressReturn {
  const { user } = useAuth();
  const userId = user?.uid || null;

  const [allProgress, setAllProgress] = useState<Record<ArchetypeId, ArchetypeProgress>>(
    {} as Record<ArchetypeId, ArchetypeProgress>
  );
  const [examReadiness, setExamReadiness] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Load all progress on mount and when user changes
  const loadProgress = useCallback(async () => {
    setIsLoading(true);
    try {
      const stored = await progressService.getAllArchetypeProgress(userId);
      setAllProgress(stored);

      const readiness = await progressService.calculateExamReadiness(userId);
      setExamReadiness(readiness);
    } catch (error) {
      console.error('Error loading all progress:', error);
      // Fallback to sync
      setAllProgress(getAllArchetypeProgressSync());
      setExamReadiness(calculateExamReadinessSync());
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  // Categorize archetypes by mastery level
  const archetypeIds = Object.keys(ARCHETYPE_CATALOG) as ArchetypeId[];

  const weakArchetypes = archetypeIds.filter(id => {
    const progress = allProgress[id];
    return progress && progress.masteryLevel <= 2 && progress.questionsAttempted > 0;
  });

  const strongArchetypes = archetypeIds.filter(id => {
    const progress = allProgress[id];
    return progress && progress.masteryLevel >= 4;
  });

  const notStartedArchetypes = archetypeIds.filter(id => {
    const progress = allProgress[id];
    return !progress || progress.questionsAttempted === 0;
  });

  return {
    allProgress,
    isLoading,
    examReadiness,
    weakArchetypes,
    strongArchetypes,
    notStartedArchetypes,
    refreshProgress: loadProgress,
  };
}

// =============================================================================
// QUESTION SESSION HOOK
// =============================================================================

interface QuestionSessionState {
  currentQuestionIndex: number;
  totalQuestions: number;
  correctCount: number;
  incorrectCount: number;
  totalTimeSeconds: number;
  answers: Array<{
    questionId: string;
    isCorrect: boolean;
    timeSeconds: number;
    selectedOption?: string;
    errorType?: string;
  }>;
  isComplete: boolean;
}

interface UseQuestionSessionReturn {
  session: QuestionSessionState;
  recordAnswer: (
    questionId: string,
    isCorrect: boolean,
    timeSeconds: number,
    selectedOption?: string,
    errorType?: string
  ) => void;
  nextQuestion: () => void;
  resetSession: () => void;
  getSessionSummary: () => {
    accuracy: number;
    averageTime: number;
    totalTime: number;
  };
}

/**
 * Hook for managing a practice session (multiple questions)
 * Uses Firestore when authenticated, localStorage as fallback
 * @param totalQuestions - Number of questions in the session
 * @param archetypeId - The archetype being practiced
 */
export function useQuestionSession(
  totalQuestions: number,
  archetypeId: ArchetypeId
): UseQuestionSessionReturn {
  const { user } = useAuth();
  const userId = user?.uid || null;

  const [session, setSession] = useState<QuestionSessionState>({
    currentQuestionIndex: 0,
    totalQuestions,
    correctCount: 0,
    incorrectCount: 0,
    totalTimeSeconds: 0,
    answers: [],
    isComplete: false,
  });

  // Record an answer and update archetype progress
  const recordAnswer = useCallback((
    questionId: string,
    isCorrect: boolean,
    timeSeconds: number,
    selectedOption?: string,
    errorType?: string
  ) => {
    // Update session state
    setSession(prev => ({
      ...prev,
      correctCount: prev.correctCount + (isCorrect ? 1 : 0),
      incorrectCount: prev.incorrectCount + (isCorrect ? 0 : 1),
      totalTimeSeconds: prev.totalTimeSeconds + timeSeconds,
      answers: [...prev.answers, {
        questionId,
        isCorrect,
        timeSeconds,
        selectedOption,
        errorType,
      }],
    }));

    // Update persistent archetype progress (async, but we don't need to wait)
    progressService.updateProgressAfterQuestion(
      userId,
      archetypeId,
      isCorrect,
      timeSeconds,
      errorType
    ).catch(error => {
      console.error('Error updating progress:', error);
      // Fallback to sync
      updateProgressAfterQuestionSync(archetypeId, isCorrect, timeSeconds, errorType);
    });
  }, [archetypeId, userId]);

  // Move to next question
  const nextQuestion = useCallback(() => {
    setSession(prev => {
      const nextIndex = prev.currentQuestionIndex + 1;
      return {
        ...prev,
        currentQuestionIndex: nextIndex,
        isComplete: nextIndex >= prev.totalQuestions,
      };
    });
  }, []);

  // Reset session
  const resetSession = useCallback(() => {
    setSession({
      currentQuestionIndex: 0,
      totalQuestions,
      correctCount: 0,
      incorrectCount: 0,
      totalTimeSeconds: 0,
      answers: [],
      isComplete: false,
    });
  }, [totalQuestions]);

  // Get session summary
  const getSessionSummary = useCallback(() => {
    const answeredCount = session.answers.length;
    return {
      accuracy: answeredCount > 0
        ? Math.round((session.correctCount / answeredCount) * 100)
        : 0,
      averageTime: answeredCount > 0
        ? Math.round(session.totalTimeSeconds / answeredCount)
        : 0,
      totalTime: session.totalTimeSeconds,
    };
  }, [session]);

  return {
    session,
    recordAnswer,
    nextQuestion,
    resetSession,
    getSessionSummary,
  };
}

// =============================================================================
// TIMER HOOK
// =============================================================================

interface UseQuestionTimerReturn {
  elapsedSeconds: number;
  isRunning: boolean;
  start: () => void;
  pause: () => void;
  reset: () => void;
  getElapsed: () => number;
}

/**
 * Hook for timing individual questions
 */
export function useQuestionTimer(): UseQuestionTimerReturn {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning && startTime) {
      interval = setInterval(() => {
        setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, startTime]);

  const start = useCallback(() => {
    setStartTime(Date.now());
    setIsRunning(true);
  }, []);

  const pause = useCallback(() => {
    setIsRunning(false);
  }, []);

  const reset = useCallback(() => {
    setElapsedSeconds(0);
    setIsRunning(false);
    setStartTime(null);
  }, []);

  const getElapsed = useCallback(() => {
    if (!startTime) return 0;
    return Math.floor((Date.now() - startTime) / 1000);
  }, [startTime]);

  return {
    elapsedSeconds,
    isRunning,
    start,
    pause,
    reset,
    getElapsed,
  };
}

export default {
  useArchetypeProgress,
  useAllArchetypeProgress,
  useQuestionSession,
  useQuestionTimer,
};

// =============================================================================
// USE PROGRESS SYNC HOOK
// =============================================================================
// FILE: src/hooks/nsw-selective/useProgressSync.ts
// DOMAIN: NSW Selective Exam Prep
// PURPOSE: Auth-aware progress syncing between localStorage and Firestore
// DO NOT: Mix with curriculum progress hooks

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import progressService from '@/services/nsw-selective/progressService';
import { ArchetypeId, ArchetypeProgress, ARCHETYPE_CATALOG } from '@/types/nsw-selective';

// =============================================================================
// TYPES
// =============================================================================

interface UseProgressSyncReturn {
  // User state
  userId: string | null;
  isAuthenticated: boolean;
  isSyncing: boolean;
  lastSyncError: string | null;

  // Progress data
  progress: Record<ArchetypeId, ArchetypeProgress>;
  examReadiness: number;
  isLoading: boolean;

  // Actions
  refreshProgress: () => Promise<void>;
  updateProgress: (
    archetypeId: ArchetypeId,
    isCorrect: boolean,
    timeSeconds: number,
    errorType?: string
  ) => Promise<void>;
  syncNow: () => Promise<{ synced: number; errors: number }>;
  clearProgress: () => void;
}

// =============================================================================
// HOOK IMPLEMENTATION
// =============================================================================

export function useProgressSync(): UseProgressSyncReturn {
  const { user, isAuthenticated } = useAuth();
  const userId = user?.uid || null;

  // State
  const [progress, setProgress] = useState<Record<ArchetypeId, ArchetypeProgress>>(
    {} as Record<ArchetypeId, ArchetypeProgress>
  );
  const [examReadiness, setExamReadiness] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncError, setLastSyncError] = useState<string | null>(null);

  // Track previous user to detect login/logout
  const prevUserIdRef = useRef<string | null>(null);

  // ==========================================================================
  // LOAD PROGRESS
  // ==========================================================================

  const refreshProgress = useCallback(async () => {
    setIsLoading(true);
    try {
      const allProgress = await progressService.getAllArchetypeProgress(userId);
      setProgress(allProgress);

      const readiness = await progressService.calculateExamReadiness(userId);
      setExamReadiness(readiness);
    } catch (error) {
      console.error('Error loading progress:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // ==========================================================================
  // SYNC ON LOGIN
  // ==========================================================================

  useEffect(() => {
    const prevUserId = prevUserIdRef.current;

    // User just logged in (was null, now has ID)
    if (!prevUserId && userId) {
      console.log('User logged in, syncing progress to Firestore...');
      setIsSyncing(true);
      setLastSyncError(null);

      progressService
        .syncLocalProgressToFirestore(userId)
        .then(result => {
          console.log(`Sync complete: ${result.synced} synced, ${result.errors} errors`);
          if (result.errors > 0) {
            setLastSyncError(`${result.errors} items failed to sync`);
          }
        })
        .catch(error => {
          console.error('Sync error:', error);
          setLastSyncError(error.message || 'Sync failed');
        })
        .finally(() => {
          setIsSyncing(false);
          // Refresh progress after sync
          refreshProgress();
        });
    }

    // User logged out (had ID, now null)
    if (prevUserId && !userId) {
      console.log('User logged out');
      // Optionally clear or keep local progress
      // For now, keep local progress so it's not lost
      refreshProgress();
    }

    prevUserIdRef.current = userId;
  }, [userId, refreshProgress]);

  // ==========================================================================
  // INITIAL LOAD
  // ==========================================================================

  useEffect(() => {
    refreshProgress();
  }, [refreshProgress]);

  // ==========================================================================
  // UPDATE PROGRESS
  // ==========================================================================

  const updateProgress = useCallback(
    async (
      archetypeId: ArchetypeId,
      isCorrect: boolean,
      timeSeconds: number,
      errorType?: string
    ) => {
      await progressService.updateProgressAfterQuestion(
        userId,
        archetypeId,
        isCorrect,
        timeSeconds,
        errorType
      );

      // Refresh progress to get updated values
      await refreshProgress();
    },
    [userId, refreshProgress]
  );

  // ==========================================================================
  // MANUAL SYNC
  // ==========================================================================

  const syncNow = useCallback(async () => {
    if (!userId) {
      return { synced: 0, errors: 0 };
    }

    setIsSyncing(true);
    setLastSyncError(null);

    try {
      const result = await progressService.syncLocalProgressToFirestore(userId);
      if (result.errors > 0) {
        setLastSyncError(`${result.errors} items failed to sync`);
      }
      await refreshProgress();
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sync failed';
      setLastSyncError(message);
      return { synced: 0, errors: 1 };
    } finally {
      setIsSyncing(false);
    }
  }, [userId, refreshProgress]);

  // ==========================================================================
  // CLEAR PROGRESS
  // ==========================================================================

  const clearProgress = useCallback(() => {
    progressService.clearLocalProgress();
    setProgress({} as Record<ArchetypeId, ArchetypeProgress>);
    setExamReadiness(0);
  }, []);

  // ==========================================================================
  // RETURN
  // ==========================================================================

  return {
    userId,
    isAuthenticated,
    isSyncing,
    lastSyncError,
    progress,
    examReadiness,
    isLoading,
    refreshProgress,
    updateProgress,
    syncNow,
    clearProgress,
  };
}

// =============================================================================
// CONVENIENCE HOOK FOR SINGLE ARCHETYPE
// =============================================================================

export function useArchetypeProgressSync(archetypeId: ArchetypeId) {
  const { user } = useAuth();
  const userId = user?.uid || null;

  const [progress, setProgress] = useState<ArchetypeProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await progressService.getArchetypeProgress(userId, archetypeId);
      setProgress(data);
    } catch (error) {
      console.error('Error loading archetype progress:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId, archetypeId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const updateProgress = useCallback(
    async (isCorrect: boolean, timeSeconds: number, errorType?: string) => {
      await progressService.updateProgressAfterQuestion(
        userId,
        archetypeId,
        isCorrect,
        timeSeconds,
        errorType
      );
      await refresh();
    },
    [userId, archetypeId, refresh]
  );

  return {
    progress,
    isLoading,
    refresh,
    updateProgress,
    accuracy: progress
      ? Math.round((progress.questionsCorrect / progress.questionsAttempted) * 100)
      : 0,
    masteryLevel: progress?.masteryLevel || 1,
    questionsAttempted: progress?.questionsAttempted || 0,
  };
}

export default useProgressSync;

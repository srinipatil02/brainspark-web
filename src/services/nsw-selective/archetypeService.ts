// =============================================================================
// ARCHETYPE SERVICE
// =============================================================================
// FILE: src/services/nsw-selective/archetypeService.ts
// DOMAIN: NSW Selective Exam Prep
// PURPOSE: Firestore queries for NSW Selective questions by archetype
// DO NOT: Mix with curriculum queries or use learningArc fields

import { collection, query, where, getDocs, orderBy, limit, DocumentData } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { FirestoreQuestion, ArchetypeId } from '@/types';
import { ArchetypeProgress, DiagnosticResult, ARCHETYPE_CATALOG } from '@/types/nsw-selective';
import progressService from './progressService';

// =============================================================================
// QUESTION QUERIES
// =============================================================================

/**
 * Fetch all questions for a specific archetype
 * Uses simple query + client-side filtering to avoid complex indexes
 * @param archetypeId - The archetype ID (qa1-qa20)
 * @param maxQuestions - Maximum questions to fetch (default: 25)
 */
export async function getQuestionsByArchetype(
  archetypeId: ArchetypeId,
  maxQuestions: number = 25
): Promise<FirestoreQuestion[]> {
  try {
    // Simple query on just archetypeId - no complex indexes needed
    const q = query(
      collection(db, 'questions'),
      where('nswSelective.archetypeId', '==', archetypeId),
      limit(50) // Fetch more, filter client-side
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      console.log(`No questions found for archetype: ${archetypeId}`);
      return [];
    }

    // Filter for published and sort by difficulty client-side
    const questions = snapshot.docs
      .map(doc => ({
        ...doc.data(),
        questionId: doc.id,
      } as FirestoreQuestion))
      .filter(q => q.status === 'published')
      .sort((a, b) => (a.difficulty || 2) - (b.difficulty || 2))
      .slice(0, maxQuestions);

    return questions;
  } catch (error) {
    console.error(`Error fetching questions for archetype ${archetypeId}:`, error);
    return [];
  }
}

/**
 * Fetch questions for a specific archetype at a specific difficulty
 * Uses simple query + client-side filtering
 * @param archetypeId - The archetype ID (qa1-qa20)
 * @param difficulty - Difficulty level (1-4)
 * @param maxQuestions - Maximum questions to fetch
 */
export async function getQuestionsByArchetypeAndDifficulty(
  archetypeId: ArchetypeId,
  difficulty: number,
  maxQuestions: number = 10
): Promise<FirestoreQuestion[]> {
  try {
    // Simple query on just archetypeId
    const q = query(
      collection(db, 'questions'),
      where('nswSelective.archetypeId', '==', archetypeId),
      limit(50)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return [];
    }

    // Filter for published and specific difficulty client-side
    return snapshot.docs
      .map(doc => ({
        ...doc.data(),
        questionId: doc.id,
      } as FirestoreQuestion))
      .filter(q => q.status === 'published' && q.difficulty === difficulty)
      .slice(0, maxQuestions);
  } catch (error) {
    console.error(`Error fetching questions for archetype ${archetypeId} at difficulty ${difficulty}:`, error);
    return [];
  }
}

/**
 * Get question count for an archetype
 * Uses simple query + client-side filtering
 * @param archetypeId - The archetype ID
 */
export async function getArchetypeQuestionCount(archetypeId: ArchetypeId): Promise<number> {
  try {
    const q = query(
      collection(db, 'questions'),
      where('nswSelective.archetypeId', '==', archetypeId),
      limit(100)
    );

    const snapshot = await getDocs(q);
    // Count published questions client-side
    return snapshot.docs.filter(doc => doc.data().status === 'published').length;
  } catch (error) {
    console.error(`Error getting question count for archetype ${archetypeId}:`, error);
    return 0;
  }
}

/**
 * Get question counts for all archetypes
 * Uses simple query + client-side grouping
 * Returns a map of archetypeId -> count
 */
export async function getAllArchetypeQuestionCounts(): Promise<Record<ArchetypeId, number>> {
  const counts: Record<string, number> = {};

  // Initialize all archetypes with 0
  for (const id of Object.keys(ARCHETYPE_CATALOG)) {
    counts[id] = 0;
  }

  try {
    // Fetch all NSW Selective questions - simple query on section only
    const q = query(
      collection(db, 'questions'),
      where('paperMetadata.section', '==', 'nsw-selective-mathematics'),
      limit(600) // Should be enough for 500 questions
    );

    const snapshot = await getDocs(q);

    // Count by archetype, filtering for published client-side
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.status !== 'published') return;
      const archetypeId = data.nswSelective?.archetypeId;
      if (archetypeId && archetypeId in counts) {
        counts[archetypeId]++;
      }
    });

    return counts as Record<ArchetypeId, number>;
  } catch (error) {
    console.error('Error getting all archetype question counts:', error);
    return counts as Record<ArchetypeId, number>;
  }
}

// =============================================================================
// DIAGNOSTIC QUESTIONS
// =============================================================================

/**
 * Get one question per archetype for diagnostic assessment
 * Uses batch query + client-side selection for medium difficulty
 */
export async function getDiagnosticQuestions(): Promise<FirestoreQuestion[]> {
  const diagnosticQuestions: FirestoreQuestion[] = [];
  const archetypeIds = Object.keys(ARCHETYPE_CATALOG) as ArchetypeId[];

  // Fetch ALL NSW Selective questions in one query
  try {
    const q = query(
      collection(db, 'questions'),
      where('paperMetadata.section', '==', 'nsw-selective-mathematics'),
      limit(600)
    );

    const snapshot = await getDocs(q);

    // Group by archetype
    const byArchetype: Record<string, FirestoreQuestion[]> = {};
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.status !== 'published') return;
      const archetypeId = data.nswSelective?.archetypeId;
      if (archetypeId) {
        if (!byArchetype[archetypeId]) byArchetype[archetypeId] = [];
        byArchetype[archetypeId].push({
          ...data,
          questionId: doc.id,
        } as FirestoreQuestion);
      }
    });

    // Select one medium difficulty question per archetype
    for (const archetypeId of archetypeIds) {
      const questions = byArchetype[archetypeId] || [];
      if (questions.length === 0) continue;

      // Prefer difficulty 2-3, otherwise take any
      const mediumDifficulty = questions.filter(q => q.difficulty >= 2 && q.difficulty <= 3);
      const selected = mediumDifficulty.length > 0
        ? mediumDifficulty[Math.floor(Math.random() * mediumDifficulty.length)]
        : questions[Math.floor(Math.random() * questions.length)];

      diagnosticQuestions.push(selected);
    }

    return diagnosticQuestions;
  } catch (error) {
    console.error('Error fetching diagnostic questions:', error);
    return [];
  }
}

// =============================================================================
// EXAM SIMULATION
// =============================================================================

/**
 * Get questions for a full exam simulation (35 questions)
 * Uses batch query + client-side distribution by difficulty
 */
export async function getSimulationQuestions(): Promise<FirestoreQuestion[]> {
  const targetCount = 35;

  // Difficulty distribution for 35 questions:
  // - 5 easy (difficulty 1)
  // - 15 medium (difficulty 2)
  // - 10 challenging (difficulty 3)
  // - 5 hard (difficulty 4)
  const difficultyDistribution: Record<number, number> = {
    1: 5,
    2: 15,
    3: 10,
    4: 5,
  };

  try {
    // Fetch ALL NSW Selective questions in one query
    const q = query(
      collection(db, 'questions'),
      where('paperMetadata.section', '==', 'nsw-selective-mathematics'),
      limit(600)
    );

    const snapshot = await getDocs(q);

    // Group by difficulty, filtering for published
    const byDifficulty: Record<number, FirestoreQuestion[]> = { 1: [], 2: [], 3: [], 4: [] };
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.status !== 'published') return;
      const d = data.difficulty || 2;
      if (byDifficulty[d]) {
        byDifficulty[d].push({
          ...data,
          questionId: doc.id,
        } as FirestoreQuestion);
      }
    });

    // Shuffle each difficulty group
    Object.values(byDifficulty).forEach(group => {
      for (let i = group.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [group[i], group[j]] = [group[j], group[i]];
      }
    });

    // Select according to distribution
    const simulationQuestions: FirestoreQuestion[] = [];
    for (const [diffStr, count] of Object.entries(difficultyDistribution)) {
      const diff = parseInt(diffStr);
      const available = byDifficulty[diff] || [];
      simulationQuestions.push(...available.slice(0, count));
    }

    // Shuffle to mix archetypes while keeping general difficulty progression
    return shuffleWithDifficultyProgression(simulationQuestions);
  } catch (error) {
    console.error('Error fetching simulation questions:', error);
    return [];
  }
}

/**
 * Shuffle questions while maintaining difficulty progression
 * Groups questions by difficulty, shuffles within groups, then concatenates
 */
function shuffleWithDifficultyProgression(questions: FirestoreQuestion[]): FirestoreQuestion[] {
  const byDifficulty: Record<number, FirestoreQuestion[]> = { 1: [], 2: [], 3: [], 4: [] };

  questions.forEach(q => {
    const d = q.difficulty || 2;
    if (byDifficulty[d]) {
      byDifficulty[d].push(q);
    }
  });

  // Shuffle within each difficulty group
  Object.values(byDifficulty).forEach(group => {
    for (let i = group.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [group[i], group[j]] = [group[j], group[i]];
    }
  });

  // Concatenate in order
  return [
    ...byDifficulty[1],
    ...byDifficulty[2],
    ...byDifficulty[3],
    ...byDifficulty[4],
  ];
}

// =============================================================================
// PROGRESS TRACKING - Re-exported from progressService
// =============================================================================
// Progress tracking has been moved to progressService.ts for Firestore sync.
// These re-exports maintain backward compatibility for components using
// synchronous localStorage-only progress functions.
// For new code, import directly from progressService.ts and pass userId.

// Synchronous localStorage-only wrappers for backward compatibility
// These are used by components that don't have access to userId yet

const LOCAL_PROGRESS_KEY = 'nsw-selective-archetype-progress';

function getLocalProgress(): Record<string, ArchetypeProgress> {
  if (typeof window === 'undefined') return {};
  try {
    const stored = localStorage.getItem(LOCAL_PROGRESS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

/**
 * Get progress for a specific archetype (localStorage only - synchronous)
 * @deprecated Use progressService.getArchetypeProgress(userId, archetypeId) for Firestore sync
 */
export function getArchetypeProgress(archetypeId: ArchetypeId): ArchetypeProgress | null {
  const localProgress = getLocalProgress();
  return localProgress[archetypeId] || null;
}

/**
 * Get progress for all archetypes (localStorage only - synchronous)
 * @deprecated Use progressService.getAllArchetypeProgress(userId) for Firestore sync
 */
export function getAllArchetypeProgress(): Record<ArchetypeId, ArchetypeProgress> {
  return getLocalProgress() as Record<ArchetypeId, ArchetypeProgress>;
}

/**
 * Save progress for an archetype (localStorage only - synchronous)
 * @deprecated Use progressService.saveArchetypeProgress(userId, archetypeId, progress) for Firestore sync
 */
export function saveArchetypeProgress(archetypeId: ArchetypeId, progress: Partial<ArchetypeProgress>): void {
  // Delegate to progressService with null userId (localStorage only)
  progressService.saveArchetypeProgress(null, archetypeId, progress).catch(console.error);
}

/**
 * Update progress after answering a question (localStorage only - synchronous)
 * @deprecated Use progressService.updateProgressAfterQuestion(...) for Firestore sync
 */
export function updateProgressAfterQuestion(
  archetypeId: ArchetypeId,
  isCorrect: boolean,
  timeSeconds: number,
  errorType?: string
): void {
  // Delegate to progressService with null userId (localStorage only)
  progressService.updateProgressAfterQuestion(null, archetypeId, isCorrect, timeSeconds, errorType).catch(console.error);
}

/**
 * Calculate overall exam readiness (0-100) - localStorage only
 * @deprecated Use progressService.calculateExamReadiness(userId) for Firestore sync
 */
export function calculateExamReadiness(): number {
  const allProgress = getAllArchetypeProgress();
  const archetypeCount = Object.keys(ARCHETYPE_CATALOG).length;

  if (Object.keys(allProgress).length === 0) return 0;

  let totalScore = 0;
  Object.values(allProgress).forEach(progress => {
    totalScore += progress.masteryLevel;
  });

  return Math.round((totalScore / (archetypeCount * 5)) * 100);
}

// Re-export async Firestore-enabled functions
export {
  progressService,
  getArchetypeProgress as getArchetypeProgressSync,
  getAllArchetypeProgress as getAllArchetypeProgressSync,
};

export default {
  getQuestionsByArchetype,
  getQuestionsByArchetypeAndDifficulty,
  getArchetypeQuestionCount,
  getAllArchetypeQuestionCounts,
  getDiagnosticQuestions,
  getSimulationQuestions,
  getArchetypeProgress,
  getAllArchetypeProgress,
  saveArchetypeProgress,
  updateProgressAfterQuestion,
  calculateExamReadiness,
  // Firestore-enabled service
  progressService,
};

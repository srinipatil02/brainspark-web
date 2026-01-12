// =============================================================================
// MASTERY SERVICE (Phase 4)
// Implements skill-based mastery tracking with spaced repetition
// =============================================================================

import {
  SkillMastery,
  SkillMasteryLevel,
  TopicMastery,
  MasteryProgress,
  SKILL_MASTERY_CONFIG,
  SPACED_REPETITION_INTERVALS,
  MASTERY_DECAY_DAYS,
} from '@/types/grading';

// -----------------------------------------------------------------------------
// Storage Keys
// -----------------------------------------------------------------------------

const MASTERY_STORAGE_KEY = 'brainspark_skill_mastery';
const TOPIC_MASTERY_STORAGE_KEY = 'brainspark_topic_mastery';

// -----------------------------------------------------------------------------
// Core Mastery Functions
// -----------------------------------------------------------------------------

/**
 * Get skill mastery data for a specific skill
 */
export function getSkillMastery(skillId: string): SkillMastery | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(MASTERY_STORAGE_KEY);
    if (!stored) return null;

    const allMastery: Record<string, SkillMastery> = JSON.parse(stored);
    return allMastery[skillId] || null;
  } catch (error) {
    console.error('Error reading skill mastery:', error);
    return null;
  }
}

/**
 * Get all skill mastery data
 */
export function getAllSkillMastery(): Record<string, SkillMastery> {
  if (typeof window === 'undefined') return {};

  try {
    const stored = localStorage.getItem(MASTERY_STORAGE_KEY);
    if (!stored) return {};
    return JSON.parse(stored);
  } catch (error) {
    console.error('Error reading all skill mastery:', error);
    return {};
  }
}

/**
 * Initialize or update skill mastery after answering a question
 * @param skillId - Unique identifier for the skill
 * @param skillName - Human-readable skill name
 * @param topic - Topic this skill belongs to
 * @param subject - Subject area
 * @param year - Year level
 * @param isCorrect - Whether the answer was correct
 * @param score - Score achieved (0-1)
 */
export function updateSkillMastery(
  skillId: string,
  skillName: string,
  topic: string,
  subject: string,
  year: number,
  isCorrect: boolean,
  score: number
): SkillMastery {
  const existing = getSkillMastery(skillId);
  const now = new Date().toISOString();

  // Initialize or update mastery
  const mastery: SkillMastery = existing ? {
    ...existing,
    totalAttempts: existing.totalAttempts + 1,
    consecutiveCorrect: isCorrect ? existing.consecutiveCorrect + 1 : 0,
    lastPracticedAt: now,
    averageScore: (existing.averageScore * existing.totalAttempts + score) / (existing.totalAttempts + 1),
    bestScore: Math.max(existing.bestScore, score),
    recentResults: [
      { date: now, correct: isCorrect, score },
      ...existing.recentResults.slice(0, 9) // Keep last 10 results
    ],
  } : {
    skillId,
    skillName,
    topic,
    subject,
    year,
    level: 'not_started',
    consecutiveCorrect: isCorrect ? 1 : 0,
    totalAttempts: 1,
    totalCorrect: isCorrect ? 1 : 0,
    lastPracticedAt: now,
    nextReviewAt: null,
    decayWarning: false,
    averageScore: score,
    bestScore: score,
    recentResults: [{ date: now, correct: isCorrect, score }],
  };

  // Calculate new mastery level
  mastery.level = calculateMasteryLevel(mastery);

  // Calculate next review date based on new level
  mastery.nextReviewAt = calculateNextReviewDate(mastery.level, now);

  // Clear decay warning since they just practiced
  mastery.decayWarning = false;

  // Save to storage
  saveSkillMastery(mastery);

  return mastery;
}

/**
 * Calculate mastery level based on consecutive correct answers
 */
function calculateMasteryLevel(mastery: SkillMastery): SkillMasteryLevel {
  const { consecutiveCorrect, totalAttempts } = mastery;

  // Check thresholds from config
  if (consecutiveCorrect >= SKILL_MASTERY_CONFIG.mastered.consecutiveRequired) {
    return 'mastered';
  } else if (consecutiveCorrect >= SKILL_MASTERY_CONFIG.proficient.consecutiveRequired) {
    return 'proficient';
  } else if (consecutiveCorrect >= SKILL_MASTERY_CONFIG.familiar.consecutiveRequired) {
    return 'familiar';
  } else if (totalAttempts > 0) {
    return 'attempted';
  }
  return 'not_started';
}

/**
 * Calculate next review date based on mastery level
 */
function calculateNextReviewDate(level: SkillMasteryLevel, fromDate: string): string | null {
  const intervalDays = SPACED_REPETITION_INTERVALS[level];
  if (intervalDays === 0) return null; // No review needed for not_started

  const date = new Date(fromDate);
  date.setDate(date.getDate() + intervalDays);
  return date.toISOString();
}

/**
 * Save skill mastery to localStorage
 */
function saveSkillMastery(mastery: SkillMastery): void {
  if (typeof window === 'undefined') return;

  try {
    const stored = localStorage.getItem(MASTERY_STORAGE_KEY);
    const allMastery: Record<string, SkillMastery> = stored ? JSON.parse(stored) : {};
    allMastery[mastery.skillId] = mastery;
    localStorage.setItem(MASTERY_STORAGE_KEY, JSON.stringify(allMastery));
  } catch (error) {
    console.error('Error saving skill mastery:', error);
  }
}

// -----------------------------------------------------------------------------
// Decay Logic
// -----------------------------------------------------------------------------

/**
 * Check for skill decay and apply if needed
 * Skills decay one level if not practiced within the decay window
 */
export function checkAndApplyDecay(): SkillMastery[] {
  const allMastery = getAllSkillMastery();
  const now = new Date();
  const decayedSkills: SkillMastery[] = [];

  Object.values(allMastery).forEach(mastery => {
    if (mastery.level === 'not_started') return; // Can't decay from not_started

    const lastPracticed = new Date(mastery.lastPracticedAt);
    const daysSincePractice = Math.floor(
      (now.getTime() - lastPracticed.getTime()) / (1000 * 60 * 60 * 24)
    );

    const decayThreshold = MASTERY_DECAY_DAYS[mastery.level];

    if (daysSincePractice >= decayThreshold) {
      // Apply decay - drop one level
      const newLevel = getDecayedLevel(mastery.level);
      mastery.level = newLevel;
      mastery.consecutiveCorrect = Math.max(0, mastery.consecutiveCorrect - 2); // Reduce streak
      mastery.decayWarning = true;
      mastery.nextReviewAt = calculateNextReviewDate(newLevel, now.toISOString());

      saveSkillMastery(mastery);
      decayedSkills.push(mastery);
    } else if (daysSincePractice >= decayThreshold - 3) {
      // Warning: approaching decay
      mastery.decayWarning = true;
      saveSkillMastery(mastery);
    }
  });

  return decayedSkills;
}

/**
 * Get the level after decay (one level down)
 */
function getDecayedLevel(currentLevel: SkillMasteryLevel): SkillMasteryLevel {
  const levelOrder: SkillMasteryLevel[] = ['not_started', 'attempted', 'familiar', 'proficient', 'mastered'];
  const currentIndex = levelOrder.indexOf(currentLevel);
  return currentIndex > 0 ? levelOrder[currentIndex - 1] : 'not_started';
}

// -----------------------------------------------------------------------------
// Topic Mastery Aggregation
// -----------------------------------------------------------------------------

/**
 * Calculate aggregated mastery for a topic
 */
export function getTopicMastery(topicName: string, subject: string, year: number): TopicMastery {
  const allMastery = getAllSkillMastery();
  const topicSkills = Object.values(allMastery).filter(
    m => m.topic === topicName && m.subject === subject && m.year === year
  );

  // Count skills at each level
  const levelCounts: Record<SkillMasteryLevel, number> = {
    not_started: 0,
    attempted: 0,
    familiar: 0,
    proficient: 0,
    mastered: 0,
  };

  topicSkills.forEach(skill => {
    levelCounts[skill.level]++;
  });

  // Calculate overall level (weighted average)
  const masteredCount = levelCounts.mastered;
  const proficientCount = levelCounts.proficient;
  const familiarCount = levelCounts.familiar;

  let overallLevel: SkillMasteryLevel;
  if (masteredCount === topicSkills.length && topicSkills.length > 0) {
    overallLevel = 'mastered';
  } else if (masteredCount + proficientCount >= topicSkills.length * 0.75 && topicSkills.length > 0) {
    overallLevel = 'proficient';
  } else if (masteredCount + proficientCount + familiarCount >= topicSkills.length * 0.5 && topicSkills.length > 0) {
    overallLevel = 'familiar';
  } else if (levelCounts.not_started < topicSkills.length) {
    overallLevel = 'attempted';
  } else {
    overallLevel = 'not_started';
  }

  // Find skills needing review
  const now = new Date();
  const skillsToReview = topicSkills
    .filter(skill => {
      if (!skill.nextReviewAt) return false;
      return new Date(skill.nextReviewAt) <= now;
    })
    .map(skill => skill.skillId);

  // Find skills approaching decay
  const skillsDecaying = topicSkills
    .filter(skill => skill.decayWarning)
    .map(skill => skill.skillId);

  // Find next recommended skill (lowest level that's not mastered)
  const nextRecommendedSkill = topicSkills
    .filter(s => s.level !== 'mastered')
    .sort((a, b) => {
      const levelOrder: SkillMasteryLevel[] = ['not_started', 'attempted', 'familiar', 'proficient', 'mastered'];
      return levelOrder.indexOf(a.level) - levelOrder.indexOf(b.level);
    })[0]?.skillId || '';

  const topicId = `${subject}-${year}-${topicName}`.toLowerCase().replace(/\s+/g, '-');

  return {
    topicId,
    topicName,
    subject,
    year,
    skills: topicSkills,
    overallLevel,
    masteredCount,
    proficientCount,
    familiarCount,
    attemptedCount: levelCounts.attempted,
    notStartedCount: levelCounts.not_started,
    skillsToReview,
    skillsDecaying,
    nextRecommendedSkill,
  };
}

// -----------------------------------------------------------------------------
// Progress Dashboard Data
// -----------------------------------------------------------------------------

/**
 * Get overall mastery progress for dashboard display
 */
export function getMasteryProgress(): MasteryProgress {
  const allMastery = getAllSkillMastery();
  const skills = Object.values(allMastery);

  // Group by topic
  const topicGroups: Record<string, SkillMastery[]> = {};
  skills.forEach(skill => {
    const key = `${skill.subject}-${skill.year}-${skill.topic}`;
    if (!topicGroups[key]) topicGroups[key] = [];
    topicGroups[key].push(skill);
  });

  // Calculate topic mastery for each
  const topics: TopicMastery[] = Object.entries(topicGroups).map(([_, topicSkills]) => {
    const first = topicSkills[0];
    return getTopicMastery(first.topic, first.subject, first.year);
  });

  // Find skills due for review
  const now = new Date();
  const skillsDueForReview = skills.filter(skill => {
    if (!skill.nextReviewAt) return false;
    return new Date(skill.nextReviewAt) <= now;
  });

  // Find skills approaching decay
  const skillsApproachingDecay = skills.filter(skill => skill.decayWarning);

  // Calculate overall stats
  const totalMastered = skills.filter(s => s.level === 'mastered').length;
  const totalSkills = skills.length;

  // Suggested next action
  let suggestedAction: MasteryProgress['suggestedAction'];
  if (skillsDueForReview.length > 0) {
    const skill = skillsDueForReview[0];
    suggestedAction = {
      type: 'review',
      skillId: skill.skillId,
      skillName: skill.skillName,
      reason: `Due for review (${skill.level} level)`,
    };
  } else if (skillsApproachingDecay.length > 0) {
    const skill = skillsApproachingDecay[0];
    suggestedAction = {
      type: 'prevent_decay',
      skillId: skill.skillId,
      skillName: skill.skillName,
      reason: `Practice soon to prevent losing your ${skill.level} status`,
    };
  } else {
    // Find a skill to level up
    const levelUpCandidate = skills.find(s =>
      s.level !== 'mastered' && s.consecutiveCorrect > 0
    );
    if (levelUpCandidate) {
      const needed = getCorrectNeededForNextLevel(levelUpCandidate);
      suggestedAction = {
        type: 'level_up',
        skillId: levelUpCandidate.skillId,
        skillName: levelUpCandidate.skillName,
        reason: `${needed} more correct to reach ${getNextLevel(levelUpCandidate.level)}`,
      };
    }
  }

  return {
    topics,
    skillsDueForReview: skillsDueForReview.map(s => s.skillId),
    skillsApproachingDecay: skillsApproachingDecay.map(s => s.skillId),
    totalMastered,
    totalSkills,
    streakDays: calculateStreakDays(skills),
    lastPracticedAt: skills.length > 0
      ? skills.map(s => s.lastPracticedAt).sort().pop()!
      : null,
    suggestedAction,
  };
}

/**
 * Calculate how many more correct answers needed for next level
 */
function getCorrectNeededForNextLevel(mastery: SkillMastery): number {
  const nextLevel = getNextLevel(mastery.level);
  if (!nextLevel) return 0;

  const required = SKILL_MASTERY_CONFIG[nextLevel].consecutiveRequired;
  return Math.max(0, required - mastery.consecutiveCorrect);
}

/**
 * Get the next mastery level
 */
function getNextLevel(currentLevel: SkillMasteryLevel): SkillMasteryLevel | null {
  const levelOrder: SkillMasteryLevel[] = ['not_started', 'attempted', 'familiar', 'proficient', 'mastered'];
  const currentIndex = levelOrder.indexOf(currentLevel);
  return currentIndex < levelOrder.length - 1 ? levelOrder[currentIndex + 1] : null;
}

/**
 * Calculate practice streak (consecutive days)
 */
function calculateStreakDays(skills: SkillMastery[]): number {
  if (skills.length === 0) return 0;

  // Get all practice dates
  const dates = new Set<string>();
  skills.forEach(skill => {
    skill.recentResults.forEach(result => {
      dates.add(result.date.split('T')[0]); // Just the date part
    });
  });

  if (dates.size === 0) return 0;

  // Sort dates descending
  const sortedDates = Array.from(dates).sort().reverse();

  // Count consecutive days from today
  const today = new Date().toISOString().split('T')[0];
  let streak = 0;
  let expectedDate = today;

  for (const date of sortedDates) {
    if (date === expectedDate) {
      streak++;
      // Calculate previous day
      const prevDate = new Date(expectedDate);
      prevDate.setDate(prevDate.getDate() - 1);
      expectedDate = prevDate.toISOString().split('T')[0];
    } else if (date < expectedDate) {
      break; // Gap in streak
    }
  }

  return streak;
}

// -----------------------------------------------------------------------------
// Utility Functions
// -----------------------------------------------------------------------------

/**
 * Get mastery level display info (color, icon, label)
 */
export function getMasteryLevelDisplay(level: SkillMasteryLevel): {
  color: string;
  bgColor: string;
  icon: string;
  label: string;
  description: string;
} {
  switch (level) {
    case 'mastered':
      return {
        color: 'text-purple-700',
        bgColor: 'bg-purple-100',
        icon: '👑',
        label: 'Mastered',
        description: 'Expert level - excellent retention!',
      };
    case 'proficient':
      return {
        color: 'text-green-700',
        bgColor: 'bg-green-100',
        icon: '⭐',
        label: 'Proficient',
        description: 'Strong understanding - keep it up!',
      };
    case 'familiar':
      return {
        color: 'text-blue-700',
        bgColor: 'bg-blue-100',
        icon: '📚',
        label: 'Familiar',
        description: 'Good progress - practice more to level up!',
      };
    case 'attempted':
      return {
        color: 'text-amber-700',
        bgColor: 'bg-amber-100',
        icon: '🌱',
        label: 'Attempted',
        description: 'Just starting - you\'ve got this!',
      };
    case 'not_started':
    default:
      return {
        color: 'text-gray-500',
        bgColor: 'bg-gray-100',
        icon: '○',
        label: 'Not Started',
        description: 'Ready when you are!',
      };
  }
}

/**
 * Get skills that should be included in a review session
 * Uses spaced repetition principles to select optimal review set
 */
export function getReviewSet(
  topic: string,
  subject: string,
  year: number,
  maxQuestions: number = 10
): string[] {
  const allMastery = getAllSkillMastery();
  const topicSkills = Object.values(allMastery).filter(
    m => m.topic === topic && m.subject === subject && m.year === year
  );

  const now = new Date();

  // Priority 1: Skills due for review (past their review date)
  const dueForReview = topicSkills.filter(skill => {
    if (!skill.nextReviewAt) return false;
    return new Date(skill.nextReviewAt) <= now;
  });

  // Priority 2: Skills approaching decay
  const approachingDecay = topicSkills.filter(skill =>
    skill.decayWarning && !dueForReview.includes(skill)
  );

  // Priority 3: Skills at lower levels (need more practice)
  const needsPractice = topicSkills
    .filter(skill =>
      skill.level !== 'mastered' &&
      !dueForReview.includes(skill) &&
      !approachingDecay.includes(skill)
    )
    .sort((a, b) => {
      // Sort by level (lower levels first)
      const levelOrder = ['not_started', 'attempted', 'familiar', 'proficient'];
      return levelOrder.indexOf(a.level) - levelOrder.indexOf(b.level);
    });

  // Combine and limit
  const reviewSet = [
    ...dueForReview,
    ...approachingDecay,
    ...needsPractice,
  ].slice(0, maxQuestions);

  return reviewSet.map(skill => skill.skillId);
}

/**
 * Clear all mastery data (for testing/reset)
 */
export function clearAllMasteryData(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(MASTERY_STORAGE_KEY);
  localStorage.removeItem(TOPIC_MASTERY_STORAGE_KEY);
}

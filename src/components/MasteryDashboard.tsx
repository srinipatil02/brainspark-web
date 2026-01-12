'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  getMasteryProgress,
  getTopicMastery,
  getMasteryLevelDisplay,
  checkAndApplyDecay,
  getAllSkillMastery,
} from '@/services/masteryService';
import type { MasteryProgress, TopicMastery, SkillMastery, SkillMasteryLevel } from '@/types/grading';

// =============================================================================
// MASTERY DASHBOARD (Phase 4)
// Displays skill mastery progress with spaced repetition recommendations
// =============================================================================

interface MasteryDashboardProps {
  /** Optional filter to show only specific subject */
  subject?: string;
  /** Optional filter to show only specific year */
  year?: number;
  /** Whether to show compact view */
  compact?: boolean;
  /** Color theme */
  colorTheme?: string;
}

/**
 * MasteryDashboard - Visual display of skill mastery progress
 *
 * Features:
 * - 5-level mastery visualization (not_started → mastered)
 * - Skills due for review highlighting
 * - Decay warnings
 * - Suggested next actions
 * - Topic-level aggregation
 */
export function MasteryDashboard({
  subject,
  year,
  compact = false,
  colorTheme = 'blue',
}: MasteryDashboardProps) {
  const [progress, setProgress] = useState<MasteryProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [decayedSkills, setDecayedSkills] = useState<SkillMastery[]>([]);

  // Load mastery data and check for decay on mount
  useEffect(() => {
    // Check for skill decay first
    const decayed = checkAndApplyDecay();
    if (decayed.length > 0) {
      setDecayedSkills(decayed);
    }

    // Load progress
    const masteryProgress = getMasteryProgress();
    setProgress(masteryProgress);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        <div className="h-32 bg-gray-200 rounded"></div>
        <div className="h-24 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (!progress || progress.totalSkills === 0) {
    return (
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-6 text-center">
        <span className="text-4xl mb-4 block">📚</span>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">
          No Progress Yet
        </h3>
        <p className="text-gray-500">
          Start practicing to track your mastery progress!
        </p>
      </div>
    );
  }

  // Filter topics if subject/year specified
  const filteredTopics = progress.topics.filter((topic: TopicMastery) => {
    if (subject && topic.subject !== subject) return false;
    if (year && topic.year !== year) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Decay Warning Banner */}
      {decayedSkills.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <h4 className="font-semibold text-amber-800">Skills Decayed</h4>
              <p className="text-sm text-amber-700 mt-1">
                {decayedSkills.length} skill{decayedSkills.length !== 1 ? 's' : ''} dropped a level due to inactivity.
                Practice regularly to maintain your progress!
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {decayedSkills.slice(0, 3).map(skill => (
                  <span
                    key={skill.skillId}
                    className="px-2 py-1 bg-amber-100 text-amber-800 rounded text-xs"
                  >
                    {skill.skillName}
                  </span>
                ))}
                {decayedSkills.length > 3 && (
                  <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded text-xs">
                    +{decayedSkills.length - 3} more
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Overall Stats */}
      {!compact && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon="👑"
            label="Skills Mastered"
            value={progress.totalMastered}
            subtext={`of ${progress.totalSkills} total`}
            color="purple"
          />
          <StatCard
            icon="🔥"
            label="Practice Streak"
            value={progress.streakDays}
            subtext="days"
            color="orange"
          />
          <StatCard
            icon="📅"
            label="Due for Review"
            value={progress.skillsDueForReview.length}
            subtext="skills"
            color={progress.skillsDueForReview.length > 0 ? 'red' : 'green'}
          />
          <StatCard
            icon="⏰"
            label="Approaching Decay"
            value={progress.skillsApproachingDecay.length}
            subtext="skills"
            color={progress.skillsApproachingDecay.length > 0 ? 'amber' : 'green'}
          />
        </div>
      )}

      {/* Suggested Action */}
      {progress.suggestedAction && (
        <div className={`rounded-xl border-2 p-4 ${
          progress.suggestedAction.type === 'review'
            ? 'bg-blue-50 border-blue-200'
            : progress.suggestedAction.type === 'prevent_decay'
            ? 'bg-amber-50 border-amber-200'
            : 'bg-green-50 border-green-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">
                {progress.suggestedAction.type === 'review' ? '📖' :
                 progress.suggestedAction.type === 'prevent_decay' ? '⚡' : '🚀'}
              </span>
              <div>
                <h4 className="font-semibold text-gray-800">
                  {progress.suggestedAction.type === 'review' ? 'Time to Review' :
                   progress.suggestedAction.type === 'prevent_decay' ? 'Practice Soon' : 'Level Up'}
                </h4>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">{progress.suggestedAction.skillName}</span>
                  {' - '}
                  {progress.suggestedAction.reason}
                </p>
              </div>
            </div>
            <button className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              progress.suggestedAction.type === 'review'
                ? 'bg-blue-500 hover:bg-blue-600 text-white'
                : progress.suggestedAction.type === 'prevent_decay'
                ? 'bg-amber-500 hover:bg-amber-600 text-white'
                : 'bg-green-500 hover:bg-green-600 text-white'
            }`}>
              Practice Now
            </button>
          </div>
        </div>
      )}

      {/* Topic Progress */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">Topic Progress</h3>
        {filteredTopics.length === 0 ? (
          <p className="text-gray-500 text-center py-4">
            No topics match the selected filters.
          </p>
        ) : (
          <div className="space-y-3">
            {filteredTopics.map((topic: TopicMastery) => (
              <TopicProgressCard key={topic.topicId} topic={topic} />
            ))}
          </div>
        )}
      </div>

      {/* Mastery Level Legend */}
      {!compact && (
        <div className="bg-gray-50 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-gray-600 mb-3">Mastery Levels</h4>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {(['not_started', 'attempted', 'familiar', 'proficient', 'mastered'] as SkillMasteryLevel[]).map(level => {
              const display = getMasteryLevelDisplay(level);
              return (
                <div key={level} className="flex items-center gap-2">
                  <span className={`w-8 h-8 ${display.bgColor} rounded-full flex items-center justify-center text-sm`}>
                    {display.icon}
                  </span>
                  <div>
                    <p className={`text-xs font-medium ${display.color}`}>{display.label}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Sub-components
// -----------------------------------------------------------------------------

interface StatCardProps {
  icon: string;
  label: string;
  value: number;
  subtext: string;
  color: string;
}

function StatCard({ icon, label, value, subtext, color }: StatCardProps) {
  const colorClasses: Record<string, string> = {
    purple: 'bg-purple-50 border-purple-200',
    orange: 'bg-orange-50 border-orange-200',
    red: 'bg-red-50 border-red-200',
    amber: 'bg-amber-50 border-amber-200',
    green: 'bg-green-50 border-green-200',
    blue: 'bg-blue-50 border-blue-200',
  };

  return (
    <div className={`rounded-xl border p-4 ${colorClasses[color] || colorClasses.blue}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">{icon}</span>
        <span className="text-sm text-gray-600">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold text-gray-800">{value}</span>
        <span className="text-sm text-gray-500">{subtext}</span>
      </div>
    </div>
  );
}

interface TopicProgressCardProps {
  topic: TopicMastery;
}

function TopicProgressCard({ topic }: TopicProgressCardProps) {
  const display = getMasteryLevelDisplay(topic.overallLevel);
  const totalSkills = topic.skills.length;
  const progressPercent = totalSkills > 0
    ? Math.round((topic.masteredCount / totalSkills) * 100)
    : 0;

  // Calculate average score from skills
  const averageScore = topic.skills.length > 0
    ? topic.skills.reduce((sum, s) => sum + s.averageScore, 0) / topic.skills.length
    : 0;

  // Get last practiced date from skills
  const lastPracticedAt = topic.skills.length > 0
    ? topic.skills.map(s => s.lastPracticedAt).sort().pop()
    : null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className={`w-10 h-10 ${display.bgColor} rounded-full flex items-center justify-center text-lg`}>
            {display.icon}
          </span>
          <div>
            <h4 className="font-semibold text-gray-800">{topic.topicName}</h4>
            <p className="text-xs text-gray-500">
              {topic.subject} - Year {topic.year}
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className={`px-2 py-1 rounded text-xs font-medium ${display.bgColor} ${display.color}`}>
            {display.label}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-2">
        <div className="flex justify-between text-xs text-gray-600 mb-1">
          <span>{topic.masteredCount} of {totalSkills} skills mastered</span>
          <span>{progressPercent}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              progressPercent === 100 ? 'bg-purple-500' :
              progressPercent >= 75 ? 'bg-green-500' :
              progressPercent >= 50 ? 'bg-blue-500' :
              progressPercent >= 25 ? 'bg-amber-500' :
              'bg-gray-300'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Stats Row */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-4">
          <span>Avg: {Math.round(averageScore * 100)}%</span>
          {topic.skillsToReview.length > 0 && (
            <span className="text-amber-600">
              {topic.skillsToReview.length} due for review
            </span>
          )}
        </div>
        {lastPracticedAt && (
          <span>
            Last: {formatRelativeTime(lastPracticedAt)}
          </span>
        )}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Utility Functions
// -----------------------------------------------------------------------------

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
}

// -----------------------------------------------------------------------------
// Compact Skill Progress Component (for inline use)
// -----------------------------------------------------------------------------

interface SkillProgressBadgeProps {
  skillId: string;
  skillName: string;
  className?: string;
}

export function SkillProgressBadge({ skillId, skillName, className = '' }: SkillProgressBadgeProps) {
  const [mastery, setMastery] = useState<SkillMastery | null>(null);

  useEffect(() => {
    const allMastery = getAllSkillMastery();
    setMastery(allMastery[skillId] || null);
  }, [skillId]);

  const level: SkillMasteryLevel = mastery?.level || 'not_started';
  const display = getMasteryLevelDisplay(level);

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <span className={`w-5 h-5 ${display.bgColor} rounded-full flex items-center justify-center text-xs`}>
        {display.icon}
      </span>
      <span className={`text-xs font-medium ${display.color}`}>
        {display.label}
      </span>
      {mastery?.decayWarning && (
        <span className="text-amber-500 text-xs" title="Practice soon to prevent decay">⚠️</span>
      )}
    </div>
  );
}

export default MasteryDashboard;

// functions/src/new-architecture/analytics-processing.ts
import {onDocumentCreated} from "firebase-functions/v2/firestore";
import {onSchedule} from "firebase-functions/v2/scheduler";
import {logger} from "firebase-functions";
import * as admin from "firebase-admin";

const db = admin.firestore();

export const processNewLearningEvent = onDocumentCreated(
  "newLearningEvents/{eventId}",
  async (event) => {
    try {
      const eventData = event.data?.data();
      if (!eventData) return;
      
      const userId = eventData.userId;
      const eventType = eventData.eventType;
      
      logger.info(`📊 Processing learning event: ${eventType} for user: ${userId}`);
      
      // Update user analytics in parallel
      await Promise.all([
        updateDailyStats(userId, eventData),
        updateCumulativeStats(userId, eventData),
        updateSkillProgress(userId, eventData),
        updateQuestProgress(userId, eventData),
      ]);
      
      logger.info(`✅ Processed learning event: ${eventType}`);
      
    } catch (error) {
      logger.error('❌ Failed to process learning event:', error);
    }
  });

async function updateDailyStats(userId: string, eventData: any) {
  try {
    const today = new Date().toISOString().split('T')[0];
    const analyticsRef = db.collection('newLearningAnalytics').doc(userId);
    
    const updateData: any = {};
    
    // Initialize daily stats if needed
    updateData[`dailyStats.${today}.events`] = admin.firestore.FieldValue.increment(1);
    updateData[`dailyStats.${today}.lastEventAt`] = admin.firestore.FieldValue.serverTimestamp();
    
    // Track specific event types
    switch (eventData.eventType) {
      case 'question_attempt':
        updateData[`dailyStats.${today}.questionsAttempted`] = admin.firestore.FieldValue.increment(1);
        if (eventData.eventData?.isCorrect) {
          updateData[`dailyStats.${today}.questionsCorrect`] = admin.firestore.FieldValue.increment(1);
        }
        break;
        
      case 'concept_card_complete':
        updateData[`dailyStats.${today}.conceptCardsStudied`] = admin.firestore.FieldValue.increment(1);
        if (eventData.eventData?.timeSpentSeconds) {
          updateData[`dailyStats.${today}.studyTimeSeconds`] = admin.firestore.FieldValue.increment(
            eventData.eventData.timeSpentSeconds
          );
        }
        break;
        
      case 'quest_start':
        updateData[`dailyStats.${today}.questsStarted`] = admin.firestore.FieldValue.increment(1);
        break;
        
      case 'quest_complete':
        updateData[`dailyStats.${today}.questsCompleted`] = admin.firestore.FieldValue.increment(1);
        break;
        
      case 'learn_retry_start':
        updateData[`dailyStats.${today}.learnRetryUsed`] = admin.firestore.FieldValue.increment(1);
        break;
    }
    
    updateData.lastUpdated = admin.firestore.FieldValue.serverTimestamp();
    
    await analyticsRef.update(updateData);
    
  } catch (error) {
    logger.error('Failed to update daily stats:', error);
  }
}

async function updateCumulativeStats(userId: string, eventData: any) {
  try {
    const analyticsRef = db.collection('newLearningAnalytics').doc(userId);
    const userProfileRef = db.collection('newUserProfiles').doc(userId);
    
    const updates: any = {};
    const profileUpdates: any = {};
    
    switch (eventData.eventType) {
      case 'question_attempt':
        updates['cumulativeStats.totalSessions'] = admin.firestore.FieldValue.increment(1);
        profileUpdates['progressStats.totalQuestionsAttempted'] = admin.firestore.FieldValue.increment(1);
        
        if (eventData.eventData?.isCorrect) {
          profileUpdates['progressStats.totalQuestionsCorrect'] = admin.firestore.FieldValue.increment(1);
        }
        
        if (eventData.eventData?.timeSpentSeconds) {
          updates['cumulativeStats.totalTimeSpent'] = admin.firestore.FieldValue.increment(
            eventData.eventData.timeSpentSeconds
          );
        }
        break;
        
      case 'concept_card_complete':
        profileUpdates['progressStats.totalConceptCardsStudied'] = admin.firestore.FieldValue.increment(1);
        
        if (eventData.eventData?.timeSpentSeconds) {
          profileUpdates['progressStats.totalLearningTimeMinutes'] = admin.firestore.FieldValue.increment(
            Math.round(eventData.eventData.timeSpentSeconds / 60)
          );
        }
        break;
        
      case 'quest_complete':
        updates['cumulativeStats.questsCompleted'] = admin.firestore.FieldValue.increment(1);
        profileUpdates['progressStats.totalQuestsCompleted'] = admin.firestore.FieldValue.increment(1);
        break;
        
      case 'skill_mastered':
        updates['cumulativeStats.conceptsMastered'] = admin.firestore.FieldValue.increment(1);
        break;
    }
    
    // Update both collections in parallel
    await Promise.all([
      Object.keys(updates).length > 0 ? analyticsRef.update({
        ...updates,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      }) : Promise.resolve(),
      
      Object.keys(profileUpdates).length > 0 ? userProfileRef.update(profileUpdates) : Promise.resolve(),
    ]);
    
  } catch (error) {
    logger.error('Failed to update cumulative stats:', error);
  }
}

async function updateSkillProgress(userId: string, eventData: any) {
  try {
    if (!eventData.eventData?.skillId) return;
    
    const skillId = eventData.eventData.skillId;
    const skillProgressRef = db.collection('newSkillProgress').doc(userId);
    
    let updateData: any = {};
    
    switch (eventData.eventType) {
      case 'question_attempt':
        updateData[`skills.${skillId}.practiceCount`] = admin.firestore.FieldValue.increment(1);
        updateData[`skills.${skillId}.lastPracticed`] = admin.firestore.FieldValue.serverTimestamp();
        
        if (eventData.eventData?.isCorrect) {
          updateData[`skills.${skillId}.correctCount`] = admin.firestore.FieldValue.increment(1);
        }
        break;
        
      case 'concept_card_complete':
        updateData[`skills.${skillId}.studyCount`] = admin.firestore.FieldValue.increment(1);
        updateData[`skills.${skillId}.lastStudied`] = admin.firestore.FieldValue.serverTimestamp();
        
        if (eventData.eventData?.confidence) {
          updateData[`skills.${skillId}.confidenceLevel`] = eventData.eventData.confidence;
        }
        break;
    }
    
    updateData.lastUpdated = admin.firestore.FieldValue.serverTimestamp();
    
    await skillProgressRef.set(updateData, { merge: true });
    
    // Check if skill should be marked as mastered
    await checkSkillMastery(userId, skillId);
    
  } catch (error) {
    logger.error('Failed to update skill progress:', error);
  }
}

async function checkSkillMastery(userId: string, skillId: string) {
  try {
    const skillProgressDoc = await db.collection('newSkillProgress').doc(userId).get();
    
    if (!skillProgressDoc.exists) return;
    
    const skillData = skillProgressDoc.data()?.skills?.[skillId];
    if (!skillData) return;
    
    const practiceCount = skillData.practiceCount || 0;
    const correctCount = skillData.correctCount || 0;
    const studyCount = skillData.studyCount || 0;
    
    // Mastery criteria: 
    // - At least 5 practice attempts
    // - At least 80% accuracy
    // - At least 2 study sessions
    const accuracy = practiceCount > 0 ? correctCount / practiceCount : 0;
    const isMastered = practiceCount >= 5 && accuracy >= 0.8 && studyCount >= 2;
    
    if (isMastered && skillData.status !== 'mastered') {
      // Mark skill as mastered
      await db.collection('newSkillProgress').doc(userId).update({
        [`skills.${skillId}.status`]: 'mastered',
        [`skills.${skillId}.masteredAt`]: admin.firestore.FieldValue.serverTimestamp(),
        [`skills.${skillId}.masteryLevel`]: 1.0,
      });
      
      // Log mastery event
      await db.collection('newLearningEvents').add({
        userId,
        eventType: 'skill_mastered',
        eventData: {
          skillId,
          accuracy,
          practiceCount,
          studyCount,
        },
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
      
      logger.info(`🎉 User ${userId} mastered skill: ${skillId}`);
    }
    
  } catch (error) {
    logger.error('Failed to check skill mastery:', error);
  }
}

async function updateQuestProgress(userId: string, eventData: any) {
  try {
    if (!eventData.eventData?.questId) return;
    
    const questId = eventData.eventData.questId;
    
    switch (eventData.eventType) {
      case 'quest_activity_complete':
        await updateQuestActivityProgress(userId, questId, eventData.eventData);
        break;
        
      case 'quest_phase_complete':
        await updateQuestPhaseProgress(userId, questId, eventData.eventData);
        break;
        
      case 'quest_complete':
        await finalizeQuestCompletion(userId, questId, eventData.eventData);
        break;
    }
    
  } catch (error) {
    logger.error('Failed to update quest progress:', error);
  }
}

async function updateQuestActivityProgress(userId: string, questId: string, eventData: any) {
  try {
    const progressQuery = await db.collection('newQuestProgress')
      .where('userId', '==', userId)
      .where('questId', '==', questId)
      .limit(1)
      .get();
    
    if (progressQuery.empty) return;
    
    // const progressDoc = progressQuery.docs[0];
    // const progressData = progressDoc.data();
    
    // Update activity completion and recalculate progress
    // This is handled by the client-side quest service
    
  } catch (error) {
    logger.error('Failed to update quest activity progress:', error);
  }
}

async function updateQuestPhaseProgress(userId: string, questId: string, eventData: any) {
  // Similar implementation for phase progress
}

async function finalizeQuestCompletion(userId: string, questId: string, eventData: any) {
  try {
    // Award quest completion rewards
    const rewardsData = eventData.rewards || {};
    
    if (rewardsData.experiencePoints) {
      await db.collection('newUserProfiles').doc(userId).update({
        'progressStats.totalExperiencePoints': admin.firestore.FieldValue.increment(
          rewardsData.experiencePoints
        ),
      });
    }
    
    if (rewardsData.skillBadges?.length > 0) {
      await db.collection('newUserProfiles').doc(userId).update({
        'achievements.skillBadges': admin.firestore.FieldValue.arrayUnion(...rewardsData.skillBadges),
      });
    }
    
    logger.info(`🏆 User ${userId} completed quest: ${questId}`);
    
  } catch (error) {
    logger.error('Failed to finalize quest completion:', error);
  }
}

export const generateWeeklyReports = onSchedule({
  schedule: "every monday 09:00",
  timeZone: "America/New_York"
}, async (event) => {
    try {
      logger.info('📊 Generating weekly reports');
      
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      // Get all active users
      const activeUsersQuery = await db.collection('newUserProfiles')
        .where('lastActiveAt', '>=', admin.firestore.Timestamp.fromDate(oneWeekAgo))
        .get();
      
      const batch = db.batch();
      let processedCount = 0;
      
      for (const userDoc of activeUsersQuery.docs) {
        const userId = userDoc.id;
        
        try {
          const weeklyReport = await generateUserWeeklyReport(userId);
          
          const reportRef = db.collection('newWeeklyReports').doc(`${userId}_${getWeekIdentifier()}`);
          batch.set(reportRef, {
            userId,
            weekIdentifier: getWeekIdentifier(),
            report: weeklyReport,
            generatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          
          processedCount++;
          
          if (processedCount % 500 === 0) {
            await batch.commit();
          }
          
        } catch (error) {
          logger.error(`Failed to generate weekly report for ${userId}:`, error);
        }
      }
      
      if (processedCount % 500 !== 0) {
        await batch.commit();
      }
      
      logger.info(`✅ Generated weekly reports for ${processedCount} users`);
      
    } catch (error) {
      logger.error('❌ Failed to generate weekly reports:', error);
    }
  });

async function generateUserWeeklyReport(userId: string): Promise<any> {
  try {
    // Get user's analytics for the past week
    const analyticsDoc = await db.collection('newLearningAnalytics').doc(userId).get();
    const analyticsData = analyticsDoc.exists ? analyticsDoc.data() : {};
    
    const today = new Date();
    const weeklyStats = {
      totalSessions: 0,
      totalTimeMinutes: 0,
      questionsAttempted: 0,
      questionsCorrect: 0,
      conceptCardsStudied: 0,
      questsCompleted: 0,
      activeDays: 0,
    };
    
    // Aggregate stats from last 7 days
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayStats = analyticsData?.dailyStats?.[dateStr];
      if (dayStats) {
        weeklyStats.totalSessions += dayStats.events || 0;
        weeklyStats.totalTimeMinutes += Math.round((dayStats.studyTimeSeconds || 0) / 60);
        weeklyStats.questionsAttempted += dayStats.questionsAttempted || 0;
        weeklyStats.questionsCorrect += dayStats.questionsCorrect || 0;
        weeklyStats.conceptCardsStudied += dayStats.conceptCardsStudied || 0;
        weeklyStats.questsCompleted += dayStats.questsCompleted || 0;
        
        if (dayStats.events > 0) {
          weeklyStats.activeDays++;
        }
      }
    }
    
    // Calculate insights
    const accuracy = weeklyStats.questionsAttempted > 0 
      ? weeklyStats.questionsCorrect / weeklyStats.questionsAttempted 
      : 0;
    
    const insights = {
      accuracy: Math.round(accuracy * 100),
      averageSessionTime: weeklyStats.totalSessions > 0 
        ? Math.round(weeklyStats.totalTimeMinutes / weeklyStats.totalSessions) 
        : 0,
      consistency: Math.round((weeklyStats.activeDays / 7) * 100),
      learningVelocity: weeklyStats.conceptCardsStudied + weeklyStats.questsCompleted,
    };
    
    // Generate recommendations
    const recommendations = [];
    
    if (weeklyStats.activeDays < 3) {
      recommendations.push({
        type: 'consistency',
        message: 'Try to practice a little each day for better retention',
        actionText: 'Set daily reminder',
      });
    }
    
    if (accuracy < 0.7) {
      recommendations.push({
        type: 'accuracy',
        message: 'Focus on understanding concepts before attempting questions',
        actionText: 'Review concept cards',
      });
    }
    
    if (weeklyStats.totalTimeMinutes < 60) {
      recommendations.push({
        type: 'engagement',
        message: 'Aim for at least 10-15 minutes of learning per day',
        actionText: 'Start a quest',
      });
    }
    
    return {
      weeklyStats,
      insights,
      recommendations,
      generatedAt: new Date().toISOString(),
    };
    
  } catch (error) {
    logger.error('Failed to generate user weekly report:', error);
    return null;
  }
}

function getWeekIdentifier(): string {
  const now = new Date();
  const year = now.getFullYear();
  const week = getWeekNumber(now);
  return `${year}-W${week.toString().padStart(2, '0')}`;
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}
// functions/src/new-architecture/user-initialization.ts
import {onCall} from "firebase-functions/v2/https";
import {onDocumentCreated} from "firebase-functions/v2/firestore";
import {onSchedule} from "firebase-functions/v2/scheduler";
import {logger} from "firebase-functions";
import * as admin from "firebase-admin";
import {DocumentData} from "firebase-admin/firestore";

// Removed unused type definitions to fix compilation errors

// Removed unused interfaces to fix compilation errors

const db = admin.firestore();
const auth = admin.auth();

// Note: Auth triggers in v2 are still using the v1 pattern - this is correct
export const initializeNewUserProfile = onCall(async (request) => {
  // This would typically be triggered by client-side code after user creation
  const {uid} = request.data as {uid: string};
  
  try {
    const user = await auth.getUser(uid);
    logger.info(`🚀 Initializing new user profile for: ${user.uid}`);
    
    // Create user profile in new architecture
    const userProfileData = {
      userId: user.uid,
      email: user.email,
      displayName: user.displayName || null,
      photoURL: user.photoURL || null,
      role: 'student', // Default role
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastActiveAt: admin.firestore.FieldValue.serverTimestamp(),
      
      // Learning profile initialization
      learningProfile: {
        preferredSubject: null,
        learningStyle: 'balanced',
        confidenceLevel: 'moderate',
        strugglingConcepts: [],
        strongAreas: [],
        weeklyGoalMinutes: 120, // 2 hours per week
        adaptivityLevel: 'moderate',
      },
      
      // Progress tracking
      progressStats: {
        totalQuestionsAttempted: 0,
        totalQuestionsCorrect: 0,
        totalConceptCardsStudied: 0,
        totalQuestsCompleted: 0,
        totalLearningTimeMinutes: 0,
        currentStreak: 0,
        longestStreak: 0,
        lastActivityDate: null,
      },
      
      // Feature flags for this user
      featureFlags: {
        newUIEnabled: true,
        learnRetryEnabled: true,
        questsEnabled: true,
        parentDashboardEnabled: true,
      },
      
      // Settings
      settings: {
        notifications: {
          dailyReminders: true,
          progressUpdates: true,
          parentReports: true,
        },
        privacy: {
          shareProgressWithParents: true,
          allowDataAnalytics: true,
        },
        accessibility: {
          fontSize: 'medium',
          highContrast: false,
          reducedMotion: false,
        },
      },
    };

    // Create user profile
    await db.collection('newUserProfiles').doc(user.uid).set(userProfileData);
    
    // Initialize empty skill progress
    await db.collection('newSkillProgress').doc(user.uid).set({
      userId: user.uid,
      skills: {},
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    // Initialize learning analytics
    await db.collection('newLearningAnalytics').doc(user.uid).set({
      userId: user.uid,
      dailyStats: {},
      weeklyStats: {},
      monthlyStats: {},
      cumulativeStats: {
        totalSessions: 0,
        totalTimeSpent: 0,
        conceptsMastered: 0,
        questsCompleted: 0,
        averageAccuracy: 0,
        improvementRate: 0,
      },
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
    });

    logger.info(`✅ New user profile initialized for: ${user.uid}`);
    
    return {success: true, userId: user.uid};
    
  } catch (error) {
    logger.error(`❌ Failed to initialize user profile for ${uid}:`, error);
    throw new Error(`Failed to initialize user profile: ${error}`);
  }
});

export const updateUserActivity = onDocumentCreated(
  "newLearningEvents/{eventId}",
  async (event) => {
    try {
      const eventData = event.data?.data();
      if (!eventData) return;
      
      const userId = eventData.userId;
      if (!userId) return;
      
      logger.info(`📊 Updating user activity for: ${userId}`);
      
      // Update last active time
      await db.collection('newUserProfiles').doc(userId).update({
        lastActiveAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      
      // Update daily streak if applicable
      const today = new Date().toISOString().split('T')[0];
      const userDoc = await db.collection('newUserProfiles').doc(userId).get();
      
      if (userDoc.exists) {
        const userData = userDoc.data();
        const lastActivityDate = userData?.progressStats?.lastActivityDate;
        
        if (lastActivityDate !== today) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split('T')[0];
          
          let newStreak = 1;
          if (lastActivityDate === yesterdayStr) {
            newStreak = (userData?.progressStats?.currentStreak || 0) + 1;
          }
          
          await db.collection('newUserProfiles').doc(userId).update({
            'progressStats.lastActivityDate': today,
            'progressStats.currentStreak': newStreak,
            'progressStats.longestStreak': Math.max(
              newStreak,
              userData?.progressStats?.longestStreak || 0
            ),
          });
        }
      }
      
    } catch (error) {
      logger.error('❌ Failed to update user activity:', error);
    }
  });

export const generatePersonalizedRecommendations = onSchedule(
  "every 24 hours",
  async (event) => {
    try {
      logger.info('🎯 Generating personalized recommendations');
      
      // Get all active users (active in last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const activeUsersQuery = await db.collection('newUserProfiles')
        .where('lastActiveAt', '>=', admin.firestore.Timestamp.fromDate(sevenDaysAgo))
        .get();
      
      const batch = db.batch();
      let processedCount = 0;
      
      for (const userDoc of activeUsersQuery.docs) {
        const userId = userDoc.id;
        const userData = userDoc.data();
        
        try {
          // Generate recommendations based on user data
          const recommendations = await generateUserRecommendations(userId, userData);
          
          // Store recommendations
          const recommendationRef = db.collection('newPersonalizedContent').doc(userId);
          batch.set(recommendationRef, {
            userId,
            recommendations,
            generatedAt: admin.firestore.FieldValue.serverTimestamp(),
            expiresAt: admin.firestore.Timestamp.fromDate(
              new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
            ),
          }, { merge: true });
          
          processedCount++;
          
          // Commit in batches of 500 (Firestore limit)
          if (processedCount % 500 === 0) {
            await batch.commit();
          }
          
        } catch (error) {
          logger.error(`❌ Failed to generate recommendations for user ${userId}:`, error);
        }
      }
      
      // Commit remaining operations
      if (processedCount % 500 !== 0) {
        await batch.commit();
      }
      
      logger.info(`✅ Generated recommendations for ${processedCount} users`);
      
    } catch (error) {
      logger.error('❌ Failed to generate personalized recommendations:', error);
    }
  });

async function generateUserRecommendations(
  userId: string, 
  userData: DocumentData
): Promise<{
  nextQuests: Array<{
    type: string;
    priority: string;
    title: string;
    description: string;
    targetSkills?: any[];
  }>;
  reviewCards: Array<{
    type: string;
    priority: string;
    title: string;
    description: string;
    estimatedMinutes?: number;
  }>;
  practiceSkills: Array<{
    type: string;
    priority: string;
    title: string;
    description: string;
    targetSkills?: any[];
  }>;
  motivationalMessages: Array<{
    type: string;
    message: string;
    actionText: string;
  }>;
}> {
  try {
    // Get user's learning analytics - currently not used but available for future recommendations
    // const analyticsDoc = await db.collection('newLearningAnalytics').doc(userId).get();
    // const analyticsData = analyticsDoc.exists ? analyticsDoc.data() : {};
    
    // Get user's skill progress - currently not used but available for future recommendations
    // const skillProgressDoc = await db.collection('newSkillProgress').doc(userId).get();
    // const skillProgressData = skillProgressDoc.exists ? skillProgressDoc.data() : {};
    
    const learningProfile = userData.learningProfile || {};
    const progressStats = userData.progressStats || {};
    
    const recommendations = {
      nextQuests: [] as Array<{
        type: string;
        priority: string;
        title: string;
        description: string;
        targetSkills?: any[];
      }>,
      reviewCards: [] as Array<{
        type: string;
        priority: string;
        title: string;
        description: string;
        estimatedMinutes?: number;
      }>,
      practiceSkills: [] as Array<{
        type: string;
        priority: string;
        title: string;
        description: string;
        targetSkills?: any[];
      }>,
      motivationalMessages: [] as Array<{
        type: string;
        message: string;
        actionText: string;
      }>,
    };
    
    // Recommend quests based on skill gaps
    const strugglingConcepts = learningProfile.strugglingConcepts || [];
    if (strugglingConcepts.length > 0) {
      recommendations.nextQuests.push({
        type: 'skill_building',
        priority: 'high',
        title: 'Strengthen Your Foundation',
        description: `Focus on ${strugglingConcepts[0]} to build confidence`,
        targetSkills: strugglingConcepts.slice(0, 3),
      });
    }
    
    // Recommend review if user hasn't been active
    const lastActivity = progressStats.lastActivityDate;
    if (!lastActivity || isOlderThan(lastActivity, 3)) {
      recommendations.reviewCards.push({
        type: 'retention_review',
        priority: 'medium',
        title: 'Quick Review Session',
        description: 'Refresh your memory with some concept cards',
        estimatedMinutes: 10,
      });
    }
    
    // Recommend practice for strong areas
    const strongAreas = learningProfile.strongAreas || [];
    if (strongAreas.length > 0) {
      recommendations.practiceSkills.push({
        type: 'advancement',
        priority: 'low',
        title: 'Challenge Yourself',
        description: `Try advanced ${strongAreas[0]} problems`,
        targetSkills: strongAreas.slice(0, 2),
      });
    }
    
    // Add motivational message based on streak
    const currentStreak = progressStats.currentStreak || 0;
    if (currentStreak > 0) {
      recommendations.motivationalMessages.push({
        type: 'streak_encouragement',
        message: `Amazing! You're on a ${currentStreak}-day learning streak! 🔥`,
        actionText: 'Keep it going!',
      });
    } else {
      recommendations.motivationalMessages.push({
        type: 'fresh_start',
        message: 'Ready for a new learning adventure? 🚀',
        actionText: 'Start learning',
      });
    }
    
    return recommendations;
    
  } catch (error) {
    logger.error('Failed to generate recommendations:', error);
    return {
      nextQuests: [],
      reviewCards: [],
      practiceSkills: [],
      motivationalMessages: [{
        type: 'default',
        message: 'Ready to learn something new today?',
        actionText: 'Start learning',
      }],
    };
  }
}

function isOlderThan(dateString: string, days: number): boolean {
  const date = new Date(dateString);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return date < cutoff;
}
// functions/src/ai-insights/endpoint.ts

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { LearningInsightsAnalyzer } from './learning-insights-analyzer';
import { AIModelType } from '../ai-providers/types';
import { Request, Response } from 'express';

const cors = require('cors')({origin: true});

/**
 * 🧠 AI Learning Insights Cloud Function Endpoint
 * Generates comprehensive learning insights for students using LLM analysis
 */
export const generateAILearningInsights = functions
  .https
  .onRequest(async (req: Request, res: Response) => {
    return cors(req, res, async () => {
      // Only allow POST requests
      if (req.method !== 'POST') {
        return res.status(405).json({
          ok: false,
          error: 'Method not allowed. Use POST.',
        });
      }

      try {
        // Verify Firebase Auth token
        const authToken = req.headers.authorization?.split('Bearer ')[1];
        if (!authToken) {
          return res.status(401).json({
            ok: false,
            error: 'No authorization token provided',
          });
        }

        const decodedToken = await admin.auth().verifyIdToken(authToken);
        const userId = decodedToken.uid;

        console.log('🧠 AI Insights request for user:', userId);

        // Parse request parameters
        const { 
          timeframe = 'week',
          includeWeeklyProgress = true,
          includeWeakAreaAnalysis = true,
          includeNextStepsRecommendations = true,
          includeLearningStyleAnalysis = true,
          provider = 'deepseek-chat',
          analysisDepth = 'comprehensive'
        } = req.body;

        // Initialize the analyzer
        const analyzer = new LearningInsightsAnalyzer();
        
        // Gather comprehensive learning data
        const learningData = await gatherUserLearningData(userId, timeframe);
        
        // Generate AI insights
        const insights = await analyzer.generateLearningInsights(learningData, {
          includeWeeklyProgress,
          includeWeakAreaAnalysis,
          includeNextStepsRecommendations,
          includeLearningStyleAnalysis,
          provider: provider as AIModelType,
          analysisDepth: analysisDepth as 'basic' | 'comprehensive'
        });

        console.log('✅ Successfully generated AI learning insights for user:', userId);

        return res.status(200).json(insights);

      } catch (error) {
        console.error('❌ Error in generateAILearningInsights:', error);
        return res.status(500).json({
          ok: false,
          error: 'Failed to generate learning insights',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });
  });

/**
 * 📊 Gather Comprehensive User Learning Data
 */
async function gatherUserLearningData(userId: string, timeframe: string) {
  console.log('📊 Gathering learning data for user:', userId, 'timeframe:', timeframe);

  const db = admin.firestore();
  
  // Calculate date range based on timeframe
  const endDate = new Date();
  const startDate = new Date();
  
  switch (timeframe) {
    case 'day':
      startDate.setDate(endDate.getDate() - 1);
      break;
    case 'week':
      startDate.setDate(endDate.getDate() - 7);
      break;
    case 'month':
      startDate.setMonth(endDate.getMonth() - 1);
      break;
    default:
      startDate.setDate(endDate.getDate() - 7); // Default to week
  }

  try {
    // 1. Get user profile
    const userProfile = await getUserProfile(db, userId);
    
    // 2. Get learning performance data
    const learningReport = await getLearningReport(db, userId, startDate, endDate);
    
    // 3. Get progress data
    const progressData = await getProgressData(db, userId, startDate, endDate);
    
    // 4. Get historical progress for trends
    const historicalProgress = await getHistoricalProgress(db, userId);
    
    // 5. Get recent activity patterns
    const recentActivity = await getRecentActivity(db, userId, startDate, endDate);
    
    // 6. Get attempt patterns
    const attemptPatterns = await getAttemptPatterns(db, userId, startDate, endDate);
    
    // 7. Get concept card interactions
    const conceptInteractions = await getConceptInteractions(db, userId, startDate, endDate);

    return {
      userId,
      timeframe,
      userProfile,
      learningReport,
      progressData,
      historicalProgress,
      recentActivity,
      attemptPatterns,
      conceptInteractions,
      timestamp: new Date().toISOString(),
    };

  } catch (error) {
    console.error('❌ Error gathering learning data:', error);
    throw new functions.https.HttpsError('internal', 'Failed to gather learning data');
  }
}

async function getUserProfile(db: FirebaseFirestore.Firestore, userId: string) {
  const profileDoc = await db.collection('users').doc(userId).get();
  return profileDoc.exists ? profileDoc.data() : {};
}

async function getLearningReport(
  db: FirebaseFirestore.Firestore, 
  userId: string, 
  startDate: Date, 
  endDate: Date
) {
  const answersQuery = await db.collection('answers')
    .where('userId', '==', userId)
    .where('timestamp', '>=', startDate)
    .where('timestamp', '<=', endDate)
    .orderBy('timestamp', 'desc')
    .limit(100)
    .get();

  const answers = answersQuery.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  
  // Analyze answers for performance metrics
  const totalAnswers = answers.length;
  const correctAnswers = answers.filter((answer: any) => answer.isCorrect).length;
  const accuracy = totalAnswers > 0 ? correctAnswers / totalAnswers : 0;
  
  // Group by subject for detailed analysis
  const subjectPerformance: Record<string, any> = {};
  answers.forEach((answer: any) => {
    const subject = answer.subject || 'general';
    if (!subjectPerformance[subject]) {
      subjectPerformance[subject] = { total: 0, correct: 0, accuracy: 0 };
    }
    subjectPerformance[subject].total++;
    if (answer.isCorrect) subjectPerformance[subject].correct++;
  });
  
  // Calculate accuracy for each subject
  Object.keys(subjectPerformance).forEach(subject => {
    const perf = subjectPerformance[subject];
    perf.accuracy = perf.total > 0 ? perf.correct / perf.total : 0;
  });

  return {
    totalAnswers,
    correctAnswers,
    accuracy,
    subjectPerformance,
    recentAnswers: answers.slice(0, 10), // Last 10 answers for context
  };
}

async function getProgressData(
  db: FirebaseFirestore.Firestore,
  userId: string,
  startDate: Date,
  endDate: Date
) {
  // Get points and streak data
  const userDoc = await db.collection('users').doc(userId).get();
  const userData = userDoc.exists ? userDoc.data() : {};
  
  // Calculate weekly progress
  const weeklyAnswers = await db.collection('answers')
    .where('userId', '==', userId)
    .where('timestamp', '>=', startDate)
    .where('timestamp', '<=', endDate)
    .get();

  const weeklyProgress = weeklyAnswers.docs.reduce((total: number, doc: any) => {
    const data = doc.data();
    return total + (data.pointsEarned || 0);
  }, 0);

  return {
    totalPoints: userData?.points || 0,
    weeklyProgress,
    streakDays: userData?.streakDays || 0,
    level: userData?.level || 1,
  };
}

async function getHistoricalProgress(db: FirebaseFirestore.Firestore, userId: string) {
  // Get historical points data for the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const historicalQuery = await db.collection('answers')
    .where('userId', '==', userId)
    .where('timestamp', '>=', thirtyDaysAgo)
    .orderBy('timestamp', 'desc')
    .get();

  // Group by day and calculate daily points
  const dailyProgress: Record<string, number> = {};
  
  historicalQuery.docs.forEach(doc => {
    const data = doc.data();
    const date = data.timestamp.toDate().toDateString();
    dailyProgress[date] = (dailyProgress[date] || 0) + (data.pointsEarned || 0);
  });

  // Convert to array format for trend analysis
  return Object.entries(dailyProgress).map(([date, points]) => ({
    date,
    points,
  })).slice(0, 14); // Last 14 days
}

async function getRecentActivity(
  db: FirebaseFirestore.Firestore,
  userId: string,
  startDate: Date,
  endDate: Date
) {
  const activityQuery = await db.collection('answers')
    .where('userId', '==', userId)
    .where('timestamp', '>=', startDate)
    .where('timestamp', '<=', endDate)
    .orderBy('timestamp', 'desc')
    .limit(50)
    .get();

  const activities = activityQuery.docs.map(doc => doc.data());
  
  // Calculate activity patterns
  const uniqueDays = new Set(activities.map((activity: any) => 
    activity.timestamp.toDate().toDateString()
  )).size;

  return {
    totalActivities: activities.length,
    uniqueActiveDays: uniqueDays,
    avgActivitiesPerDay: uniqueDays > 0 ? activities.length / uniqueDays : 0,
    lastActivityDate: activities.length > 0 ? activities[0].timestamp : null,
  };
}

async function getAttemptPatterns(
  db: FirebaseFirestore.Firestore,
  userId: string,
  startDate: Date,
  endDate: Date
) {
  const attemptsQuery = await db.collection('answers')
    .where('userId', '==', userId)
    .where('timestamp', '>=', startDate)
    .where('timestamp', '<=', endDate)
    .get();

  const attempts = attemptsQuery.docs.map(doc => doc.data());
  
  // Analyze attempt patterns
  const subjectPerformance: Record<string, any> = {};
  let totalAttempts = 0;
  
  attempts.forEach((attempt: any) => {
    totalAttempts++;
    const subject = attempt.subject || 'general';
    
    if (!subjectPerformance[subject]) {
      subjectPerformance[subject] = {
        attempts: 0,
        correct: 0,
        accuracy: 0,
        avgTime: 0,
        totalTime: 0
      };
    }
    
    subjectPerformance[subject].attempts++;
    if (attempt.isCorrect) subjectPerformance[subject].correct++;
    if (attempt.timeSpent) {
      subjectPerformance[subject].totalTime += attempt.timeSpent;
    }
  });

  // Calculate final metrics
  Object.keys(subjectPerformance).forEach(subject => {
    const perf = subjectPerformance[subject];
    perf.accuracy = perf.attempts > 0 ? perf.correct / perf.attempts : 0;
    perf.avgTime = perf.attempts > 0 ? perf.totalTime / perf.attempts : 0;
  });

  // Calculate activity days
  const activityDays = new Set(attempts.map((attempt: any) => 
    attempt.timestamp.toDate().toDateString()
  )).size;

  return {
    totalAttempts,
    subjectPerformance,
    activityDays,
    avgAttemptsPerDay: activityDays > 0 ? totalAttempts / activityDays : 0,
  };
}

async function getConceptInteractions(
  db: FirebaseFirestore.Firestore,
  userId: string,
  startDate: Date,
  endDate: Date
) {
  // Get concept card interactions
  const interactionsQuery = await db.collection('concept_card_interactions')
    .where('userId', '==', userId)
    .where('timestamp', '>=', startDate)
    .where('timestamp', '<=', endDate)
    .get();

  const interactions = interactionsQuery.docs.map(doc => doc.data());
  
  // Analyze interactions
  const subjectInteractions: Record<string, any> = {};
  let totalInteractions = 0;
  const uniqueCards = new Set();
  
  interactions.forEach((interaction: any) => {
    totalInteractions++;
    uniqueCards.add(interaction.cardId);
    
    const subject = interaction.subject || 'general';
    if (!subjectInteractions[subject]) {
      subjectInteractions[subject] = {
        count: 0,
        totalTime: 0,
        avgTime: 0,
        completions: 0,
        completionRate: 0
      };
    }
    
    subjectInteractions[subject].count++;
    if (interaction.timeSpent) {
      subjectInteractions[subject].totalTime += interaction.timeSpent;
    }
    if (interaction.completed) {
      subjectInteractions[subject].completions++;
    }
  });

  // Calculate final metrics
  const avgTimePerSubject: Record<string, number> = {};
  const completionRatesBySubject: Record<string, number> = {};
  
  Object.keys(subjectInteractions).forEach(subject => {
    const data = subjectInteractions[subject];
    avgTimePerSubject[subject] = data.count > 0 ? data.totalTime / data.count : 0;
    completionRatesBySubject[subject] = data.count > 0 ? data.completions / data.count : 0;
  });

  return {
    totalInteractions,
    uniqueCards: uniqueCards.size,
    avgTimePerSubject,
    completionRatesBySubject,
    explorationDepth: totalInteractions > 0 ? uniqueCards.size / totalInteractions : 0,
  };
}

/**
 * 🏥 Health Check for AI Insights Service
 */
export const aiInsightsHealth = functions
  .https
  .onRequest(async (req: Request, res: Response) => {
    return cors(req, res, async () => {
      try {
        return res.status(200).json({
          ok: true,
          service: 'AI Learning Insights',
          status: 'healthy',
          version: '1.0',
          timestamp: new Date().toISOString(),
          providers: ['deepseek', 'claude', 'gemini']
        });
      } catch (error) {
        return res.status(500).json({
          ok: false,
          error: 'Service unhealthy',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });
  });
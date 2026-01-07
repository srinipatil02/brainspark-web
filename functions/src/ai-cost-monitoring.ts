/**
 * AI Cost Monitoring Dashboard
 *
 * Provides comprehensive cost tracking and monitoring for AI operations
 * across the BrainSpark platform.
 *
 * Features:
 * - Real-time cost tracking per user
 * - Budget enforcement and alerts
 * - Cost aggregation and reporting
 * - Admin dashboard API endpoints
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { logger } from 'firebase-functions';
import * as admin from 'firebase-admin';

// Cost tracking constants (matching Dart AIConfig)
const GEMINI_INPUT_COST_PER_1M = 0.075;   // $0.075 per 1M input tokens
const GEMINI_OUTPUT_COST_PER_1M = 0.30;   // $0.30 per 1M output tokens
const GPT4_INPUT_COST_PER_1M = 10.0;      // $10.00 per 1M input tokens
const GPT4_OUTPUT_COST_PER_1M = 30.0;     // $30.00 per 1M output tokens

// Budget limits (matching Dart AIConfig)
const MAX_COST_PER_STUDENT_PER_MONTH = 0.50;
const WARNING_THRESHOLD = 0.40;
const HARD_LIMIT = 0.60;

interface CostRecord {
  userId: string;
  model: string;
  serviceType: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  timestamp: admin.firestore.Timestamp;
  metadata?: any;
}

interface MonthlyCostSummary {
  userId: string;
  month: string;  // YYYY-MM format
  totalCost: number;
  totalRequests: number;
  breakdown: {
    [serviceType: string]: {
      cost: number;
      requests: number;
    };
  };
  lastUpdated: admin.firestore.Timestamp;
}

interface UserCostStatus {
  userId: string;
  monthlyCost: number;
  budgetRemaining: number;
  budgetUtilization: number;  // 0-1
  isWarning: boolean;
  isOverBudget: boolean;
  requestsThisMonth: number;
}

/**
 * Track AI usage cost for a user
 * Called by VertexAIService after each AI operation
 */
export const trackAICost = onCall(
  {
    region: 'us-central1',
    timeoutSeconds: 10,
    memory: '256MiB',
  },
  async (request) => {
    try {
      if (!request.auth) {
        throw new HttpsError('unauthenticated', 'Authentication required');
      }

      const { model, serviceType, inputTokens, outputTokens, metadata } = request.data;

      // Validate parameters
      if (!model || !serviceType || inputTokens === undefined || outputTokens === undefined) {
        throw new HttpsError('invalid-argument', 'Missing required cost tracking parameters');
      }

      // Calculate cost
      const cost = calculateCost(model, inputTokens, outputTokens);

      // Get current month key
      const now = new Date();
      const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

      const userId = request.auth.uid;

      // Store detailed cost record
      const costRecord: CostRecord = {
        userId,
        model,
        serviceType,
        inputTokens,
        outputTokens,
        cost,
        timestamp: admin.firestore.Timestamp.now(),
        metadata,
      };

      // Batch write to reduce latency
      const batch = admin.firestore().batch();

      // 1. Add detailed cost record
      const recordRef = admin.firestore()
        .collection('aiCostRecords')
        .doc(`${userId}_${now.getTime()}`);
      batch.set(recordRef, costRecord);

      // 2. Update monthly summary
      const summaryRef = admin.firestore()
        .collection('aiUsage')
        .doc(userId)
        .collection('monthly')
        .doc(monthKey);

      batch.set(summaryRef, {
        totalCost: admin.firestore.FieldValue.increment(cost),
        totalRequests: admin.firestore.FieldValue.increment(1),
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
        [`breakdown.${serviceType}.cost`]: admin.firestore.FieldValue.increment(cost),
        [`breakdown.${serviceType}.requests`]: admin.firestore.FieldValue.increment(1),
      }, { merge: true });

      await batch.commit();

      // Check if user is approaching or exceeding budget
      const userStatus = await getUserCostStatus(userId);

      // Log warnings or alerts
      if (userStatus.isOverBudget) {
        logger.warn('❌ User exceeded AI budget', {
          userId,
          monthlyCost: userStatus.monthlyCost,
          budgetLimit: MAX_COST_PER_STUDENT_PER_MONTH,
        });
      } else if (userStatus.isWarning) {
        logger.warn('⚠️  User approaching AI budget limit', {
          userId,
          monthlyCost: userStatus.monthlyCost,
          budgetUtilization: userStatus.budgetUtilization,
        });
      }

      return {
        success: true,
        cost,
        userStatus,
      };

    } catch (error) {
      logger.error('Failed to track AI cost', error);
      throw new HttpsError('internal', 'Failed to track AI cost');
    }
  }
);

/**
 * Get current cost status for a user
 * Used for budget enforcement on client side
 */
export const getUserAICostStatus = onCall(
  {
    region: 'us-central1',
    timeoutSeconds: 5,
    memory: '256MiB',
  },
  async (request) => {
    try {
      if (!request.auth) {
        throw new HttpsError('unauthenticated', 'Authentication required');
      }

      const userId = request.auth.uid;
      const userStatus = await getUserCostStatus(userId);

      return userStatus;

    } catch (error) {
      logger.error('Failed to get user cost status', error);
      throw new HttpsError('internal', 'Failed to get cost status');
    }
  }
);

/**
 * Admin endpoint: Get cost dashboard data
 * Returns aggregated cost metrics for all users
 */
export const getAICostDashboard = onCall(
  {
    region: 'us-central1',
    timeoutSeconds: 30,
    memory: '512MiB',
  },
  async (request) => {
    try {
      if (!request.auth) {
        throw new HttpsError('unauthenticated', 'Authentication required');
      }

      // Check if user is admin
      const userDoc = await admin.firestore()
        .collection('userProfiles')
        .doc(request.auth.uid)
        .get();

      if (!userDoc.exists || userDoc.data()?.role !== 'admin') {
        throw new HttpsError('permission-denied', 'Admin access required');
      }

      const { startDate: _startDate, endDate: _endDate, limit = 100 } = request.data;
      // Note: startDate and endDate are available for future date range filtering
      void _startDate;
      void _endDate;

      // Get current month data
      const now = new Date();
      const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

      // Fetch monthly summaries
      const summariesSnapshot = await admin.firestore()
        .collectionGroup('monthly')
        .where(admin.firestore.FieldPath.documentId(), '==', monthKey)
        .limit(limit)
        .get();

      const userSummaries: MonthlyCostSummary[] = summariesSnapshot.docs.map(doc => ({
        userId: doc.ref.parent.parent!.id,
        month: doc.id,
        ...(doc.data() as any),
      }));

      // Calculate aggregate metrics
      const totalCost = userSummaries.reduce((sum, s) => sum + (s.totalCost || 0), 0);
      const totalRequests = userSummaries.reduce((sum, s) => sum + (s.totalRequests || 0), 0);
      const activeUsers = userSummaries.length;
      const avgCostPerUser = activeUsers > 0 ? totalCost / activeUsers : 0;

      // Find users over budget
      const usersOverBudget = userSummaries.filter(s => s.totalCost >= HARD_LIMIT);
      const usersNearBudget = userSummaries.filter(s =>
        s.totalCost >= WARNING_THRESHOLD && s.totalCost < HARD_LIMIT
      );

      // Service type breakdown
      const serviceBreakdown: { [key: string]: { cost: number; requests: number } } = {};
      userSummaries.forEach(summary => {
        if (summary.breakdown) {
          Object.entries(summary.breakdown).forEach(([service, data]: [string, any]) => {
            if (!serviceBreakdown[service]) {
              serviceBreakdown[service] = { cost: 0, requests: 0 };
            }
            serviceBreakdown[service].cost += data.cost || 0;
            serviceBreakdown[service].requests += data.requests || 0;
          });
        }
      });

      // Top 10 most expensive users
      const topUsers = userSummaries
        .sort((a, b) => (b.totalCost || 0) - (a.totalCost || 0))
        .slice(0, 10)
        .map(s => ({
          userId: s.userId,
          cost: s.totalCost,
          requests: s.totalRequests,
        }));

      return {
        month: monthKey,
        aggregates: {
          totalCost,
          totalRequests,
          activeUsers,
          avgCostPerUser,
          projectedMonthlyCost: totalCost * (30 / now.getDate()),  // Simple projection
        },
        budgetStatus: {
          usersOverBudget: usersOverBudget.length,
          usersNearBudget: usersNearBudget.length,
          usersWithinBudget: activeUsers - usersOverBudget.length - usersNearBudget.length,
        },
        serviceBreakdown,
        topUsers,
        timestamp: admin.firestore.Timestamp.now(),
      };

    } catch (error) {
      logger.error('Failed to get cost dashboard', error);
      throw new HttpsError('internal', 'Failed to get cost dashboard');
    }
  }
);

/**
 * Scheduled function: Daily cost report and cleanup
 * Runs daily at 1 AM UTC
 */
export const dailyAICostReport = onSchedule(
  {
    schedule: '0 1 * * *',  // Daily at 1 AM UTC
    timeZone: 'UTC',
    region: 'us-central1',
    memory: '512MiB',
  },
  async (event) => {
    try {
      logger.info('🔄 Starting daily AI cost report...');

      const now = new Date();
      const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

      // Get all monthly summaries for current month
      const summariesSnapshot = await admin.firestore()
        .collectionGroup('monthly')
        .where(admin.firestore.FieldPath.documentId(), '==', monthKey)
        .get();

      const totalCost = summariesSnapshot.docs.reduce((sum, doc) =>
        sum + (doc.data().totalCost || 0), 0
      );
      const totalRequests = summariesSnapshot.docs.reduce((sum, doc) =>
        sum + (doc.data().totalRequests || 0), 0
      );

      // Count users by budget status
      let usersOverBudget = 0;
      let usersNearBudget = 0;

      summariesSnapshot.docs.forEach(doc => {
        const cost = doc.data().totalCost || 0;
        if (cost >= HARD_LIMIT) usersOverBudget++;
        else if (cost >= WARNING_THRESHOLD) usersNearBudget++;
      });

      // Log daily summary
      logger.info('📊 Daily AI Cost Report', {
        date: now.toISOString().split('T')[0],
        month: monthKey,
        activeUsers: summariesSnapshot.size,
        totalCost: totalCost.toFixed(4),
        totalRequests,
        avgCostPerUser: (totalCost / Math.max(summariesSnapshot.size, 1)).toFixed(4),
        usersOverBudget,
        usersNearBudget,
      });

      // Store daily snapshot for historical tracking
      await admin.firestore()
        .collection('aiCostReports')
        .doc(`daily_${now.toISOString().split('T')[0]}`)
        .set({
          date: admin.firestore.Timestamp.fromDate(now),
          month: monthKey,
          metrics: {
            activeUsers: summariesSnapshot.size,
            totalCost,
            totalRequests,
            avgCostPerUser: totalCost / Math.max(summariesSnapshot.size, 1),
            usersOverBudget,
            usersNearBudget,
          },
        });

      logger.info('✅ Daily AI cost report completed');

    } catch (error) {
      logger.error('❌ Failed to generate daily cost report', error);
    }
  }
);

// Helper functions

function calculateCost(model: string, inputTokens: number, outputTokens: number): number {
  if (model.toLowerCase().includes('gemini')) {
    return (inputTokens / 1000000 * GEMINI_INPUT_COST_PER_1M) +
           (outputTokens / 1000000 * GEMINI_OUTPUT_COST_PER_1M);
  } else if (model.toLowerCase().includes('gpt')) {
    return (inputTokens / 1000000 * GPT4_INPUT_COST_PER_1M) +
           (outputTokens / 1000000 * GPT4_OUTPUT_COST_PER_1M);
  }

  // Default to Gemini pricing
  return (inputTokens / 1000000 * GEMINI_INPUT_COST_PER_1M) +
         (outputTokens / 1000000 * GEMINI_OUTPUT_COST_PER_1M);
}

async function getUserCostStatus(userId: string): Promise<UserCostStatus> {
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const summaryDoc = await admin.firestore()
    .collection('aiUsage')
    .doc(userId)
    .collection('monthly')
    .doc(monthKey)
    .get();

  const monthlyCost = summaryDoc.exists ? (summaryDoc.data()?.totalCost || 0) : 0;
  const requestsThisMonth = summaryDoc.exists ? (summaryDoc.data()?.totalRequests || 0) : 0;

  const budgetRemaining = Math.max(0, MAX_COST_PER_STUDENT_PER_MONTH - monthlyCost);
  const budgetUtilization = monthlyCost / MAX_COST_PER_STUDENT_PER_MONTH;

  return {
    userId,
    monthlyCost,
    budgetRemaining,
    budgetUtilization,
    isWarning: monthlyCost >= WARNING_THRESHOLD && monthlyCost < HARD_LIMIT,
    isOverBudget: monthlyCost >= HARD_LIMIT,
    requestsThisMonth,
  };
}

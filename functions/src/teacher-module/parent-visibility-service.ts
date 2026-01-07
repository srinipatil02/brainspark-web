import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore } from 'firebase-admin/firestore';

const db = getFirestore();

/**
 * Get assignments for a parent's child
 */
export const getChildAssignments = onCall({
  invoker: 'public'
}, async (request) => {
  try {
    // Authentication required
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Authentication required');
    }

    const { parentId, childId, status } = request.data;
    
    // Verify the authenticated user is the parent
    if (request.auth.uid !== parentId) {
      throw new HttpsError('permission-denied', 'Access denied');
    }

    console.log('👨‍👩‍👧‍👦 Getting child assignments for parent:', { parentId, childId, status });

    // Verify parent-child relationship
    const parentChildQuery = await db
      .collection('parentChildLinks')
      .where('parentId', '==', parentId)
      .where('childId', '==', childId)
      .where('status', '==', 'active')
      .limit(1)
      .get();

    if (parentChildQuery.empty) {
      throw new HttpsError('permission-denied', 'Child not linked to parent');
    }

    // Get child's assignments
    let query = db
      .collection('teacherAssessments')
      .where('assignedStudentIds', 'array-contains', childId);

    if (status) {
      query = query.where('status', '==', status);
    }

    query = query.orderBy('scheduledFor', 'desc');

    const assignmentsQuery = await query.get();

    const assignments = [];
    for (const doc of assignmentsQuery.docs) {
      const data = doc.data();
      
      // Get teacher information
      let teacherName = 'Teacher';
      let teacherEmail = '';
      try {
        const teacherDoc = await db.collection('teacherProfiles').doc(data.teacherId).get();
        if (teacherDoc.exists) {
          const teacherData = teacherDoc.data();
          teacherName = `${teacherData?.firstName || ''} ${teacherData?.lastName || ''}`.trim() || 'Teacher';
          teacherEmail = teacherData?.email || '';
        }
      } catch (error) {
        console.warn('Could not fetch teacher information:', error);
      }

      // Get child's submission status
      const submissionQuery = await db
        .collection('assessmentSubmissions')
        .where('assignmentId', '==', doc.id)
        .where('studentId', '==', childId)
        .limit(1)
        .get();

      const submission = submissionQuery.empty ? null : {
        id: submissionQuery.docs[0].id,
        ...submissionQuery.docs[0].data(),
        submittedAt: submissionQuery.docs[0].data().submittedAt?.toDate?.()?.toISOString(),
        gradedAt: submissionQuery.docs[0].data().gradedAt?.toDate?.()?.toISOString(),
      };

      const submissionData = submission as any;

      assignments.push({
        id: doc.id,
        title: data.title,
        description: data.description,
        subject: data.subject,
        yearLevel: data.yearLevel,
        assessmentType: data.assessmentType,
        questionCount: data.questionIds?.length || 0,
        isTimedAssessment: data.isTimedAssessment || false,
        timeLimitMinutes: data.timeLimitMinutes,
        scheduledFor: data.scheduledFor?.toDate?.()?.toISOString() || data.scheduledFor,
        status: data.status,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        teacher: {
          id: data.teacherId,
          name: teacherName,
          email: teacherEmail,
        },
        submission: submission,
        childProgress: {
          submitted: !!submission,
          score: submissionData?.score || null,
          submittedAt: submissionData?.submittedAt || null,
          isGraded: submissionData?.status === 'graded',
          feedback: submissionData?.feedback || null,
        },
      });
    }

    console.log('✅ Child assignments retrieved for parent:', {
      parentId,
      childId,
      assignmentCount: assignments.length,
    });

    return {
      success: true,
      assignments,
      childInfo: {
        id: childId,
        totalAssignments: assignments.length,
        submittedAssignments: assignments.filter(a => a.submission).length,
        gradedAssignments: assignments.filter(a => (a.submission as any)?.status === 'graded').length,
        averageScore: _calculateAverageScore(assignments),
      },
    };

  } catch (error) {
    console.error('❌ Error getting child assignments:', error);
    
    if (error instanceof HttpsError) {
      throw error;
    }
    
    throw new HttpsError('internal', 'Failed to get child assignments');
  }
});

/**
 * Get detailed progress report for a parent's child
 */
export const getChildProgressReport = onCall({
  invoker: 'public'
}, async (request) => {
  try {
    // Authentication required
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Authentication required');
    }

    const { parentId, childId, timeframe } = request.data;
    
    // Verify the authenticated user is the parent
    if (request.auth.uid !== parentId) {
      throw new HttpsError('permission-denied', 'Access denied');
    }

    console.log('📊 Getting child progress report for parent:', { parentId, childId, timeframe });

    // Verify parent-child relationship
    const parentChildQuery = await db
      .collection('parentChildLinks')
      .where('parentId', '==', parentId)
      .where('childId', '==', childId)
      .where('status', '==', 'active')
      .limit(1)
      .get();

    if (parentChildQuery.empty) {
      throw new HttpsError('permission-denied', 'Child not linked to parent');
    }

    // Get date range for timeframe
    const endDate = new Date();
    const startDate = _getStartDateForTimeframe(timeframe || '30_days');

    // Get child's submissions in timeframe
    const submissionsQuery = await db
      .collection('assessmentSubmissions')
      .where('studentId', '==', childId)
      .where('submittedAt', '>=', startDate)
      .where('submittedAt', '<=', endDate)
      .orderBy('submittedAt', 'desc')
      .get();

    // Get child's help flags in timeframe
    const helpFlagsQuery = await db
      .collection('helpFlags')
      .where('studentId', '==', childId)
      .where('openedAt', '>=', startDate)
      .where('openedAt', '<=', endDate)
      .get();

    // Get child's learning events in timeframe
    const learningEventsQuery = await db
      .collection('newLearningEvents')
      .where('userId', '==', childId)
      .where('timestamp', '>=', startDate)
      .where('timestamp', '<=', endDate)
      .orderBy('timestamp', 'desc')
      .limit(50)
      .get();

    // Process data
    const submissions = submissionsQuery.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      submittedAt: doc.data().submittedAt?.toDate?.()?.toISOString(),
      gradedAt: doc.data().gradedAt?.toDate?.()?.toISOString(),
    }));

    const helpFlags = helpFlagsQuery.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      openedAt: doc.data().openedAt?.toDate?.()?.toISOString(),
      resolvedAt: doc.data().resolvedAt?.toDate?.()?.toISOString(),
    }));

    const learningEvents = learningEventsQuery.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate?.()?.toISOString(),
    }));

    // Get teacher information for assignments
    const teacherIds = [...new Set(submissions.map((s: any) => s.teacherId))];
    const teachers: { [key: string]: any } = {};
    
    for (const teacherId of teacherIds) {
      try {
        const teacherDoc = await db.collection('teacherProfiles').doc(teacherId).get();
        if (teacherDoc.exists) {
          const teacherData = teacherDoc.data();
          teachers[teacherId] = {
            id: teacherId,
            name: `${teacherData?.firstName || ''} ${teacherData?.lastName || ''}`.trim(),
            email: teacherData?.email || '',
          };
        }
      } catch (error) {
        console.warn('Could not fetch teacher:', teacherId);
      }
    }

    const progressReport = {
      timeframe: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
      academicPerformance: {
        totalAssignments: submissions.length,
        gradedAssignments: submissions.filter((s: any) => s.status === 'graded').length,
        averageScore: submissions.length > 0 ? 
          submissions.filter((s: any) => s.score !== null)
            .reduce((sum: number, s: any) => sum + (s.score || 0), 0) / 
            Math.max(submissions.filter((s: any) => s.score !== null).length, 1) : 0,
        improvementTrend: _calculateImprovementTrend(submissions),
        subjectBreakdown: _getSubjectBreakdown(submissions, learningEvents),
      },
      engagementMetrics: {
        learningSessionsCount: learningEvents.length,
        averageSessionDuration: _calculateAverageSessionDuration(learningEvents),
        streakDays: _calculateLearningStreak(learningEvents),
        mostActiveSubjects: _getMostActiveSubjects(learningEvents),
      },
      helpSeekingBehavior: {
        totalHelpRequests: helpFlags.length,
        resolvedHelpRequests: helpFlags.filter((h: any) => h.status === 'resolved').length,
        averageResolutionTime: _calculateAverageResolutionTime(helpFlags),
        commonHelpTopics: _getCommonHelpTopics(helpFlags),
      },
      teacherInteractions: Object.values(teachers).map(teacher => ({
        teacher,
        assignmentCount: submissions.filter((s: any) => s.teacherId === teacher.id).length,
        averageScore: _getAverageScoreForTeacher(submissions, teacher.id),
        helpRequestCount: helpFlags.filter((h: any) => h.teacherId === teacher.id).length,
      })),
      recentActivity: _getRecentActivity(submissions, helpFlags, learningEvents),
      recommendations: _generateParentRecommendations(submissions, helpFlags, learningEvents),
    };

    console.log('✅ Child progress report generated for parent:', {
      parentId,
      childId,
      timeframe,
      assignmentCount: submissions.length,
    });

    return {
      success: true,
      report: progressReport,
    };

  } catch (error) {
    console.error('❌ Error getting child progress report:', error);
    
    if (error instanceof HttpsError) {
      throw error;
    }
    
    throw new HttpsError('internal', 'Failed to get child progress report');
  }
});

/**
 * Get parent notifications about their child's school activities
 */
export const getParentNotifications = onCall({
  invoker: 'public'
}, async (request) => {
  try {
    // Authentication required
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Authentication required');
    }

    const { parentId, childId, limit } = request.data;
    
    // Verify the authenticated user is the parent
    if (request.auth.uid !== parentId) {
      throw new HttpsError('permission-denied', 'Access denied');
    }

    console.log('🔔 Getting parent notifications:', { parentId, childId, limit });

    // Verify parent-child relationship
    const parentChildQuery = await db
      .collection('parentChildLinks')
      .where('parentId', '==', parentId)
      .where('childId', '==', childId)
      .where('status', '==', 'active')
      .limit(1)
      .get();

    if (parentChildQuery.empty) {
      throw new HttpsError('permission-denied', 'Child not linked to parent');
    }

    // Get parent notifications
    const notificationsQuery = await db
      .collection('parentNotifications')
      .where('parentId', '==', parentId)
      .where('childId', '==', childId)
      .where('expiresAt', '>', new Date())
      .orderBy('createdAt', 'desc')
      .limit(limit || 20)
      .get();

    const notifications = notificationsQuery.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString(),
      expiresAt: doc.data().expiresAt?.toDate?.()?.toISOString(),
    }));

    console.log('✅ Parent notifications retrieved:', {
      parentId,
      childId,
      notificationCount: notifications.length,
    });

    return {
      success: true,
      notifications,
      unreadCount: notifications.filter((n: any) => !n.read).length,
    };

  } catch (error) {
    console.error('❌ Error getting parent notifications:', error);
    
    if (error instanceof HttpsError) {
      throw error;
    }
    
    throw new HttpsError('internal', 'Failed to get parent notifications');
  }
});

// Helper functions
function _calculateAverageScore(assignments: any[]): number {
  const gradedAssignments = assignments.filter(a => a.submission?.score !== null);
  if (gradedAssignments.length === 0) return 0;
  
  const totalScore = gradedAssignments.reduce((sum, a) => sum + (a.submission?.score || 0), 0);
  return Math.round((totalScore / gradedAssignments.length) * 100) / 100;
}

function _getStartDateForTimeframe(timeframe: string): Date {
  const now = new Date();
  switch (timeframe) {
    case '7_days':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case '30_days':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case '90_days':
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    default:
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
}

function _calculateImprovementTrend(submissions: any[]): string {
  if (submissions.length < 2) return 'insufficient_data';
  
  const gradedSubmissions = submissions
    .filter((s: any) => s.score !== null)
    .sort((a: any, b: any) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime());
  
  if (gradedSubmissions.length < 2) return 'insufficient_data';
  
  const firstHalf = gradedSubmissions.slice(0, Math.ceil(gradedSubmissions.length / 2));
  const secondHalf = gradedSubmissions.slice(Math.ceil(gradedSubmissions.length / 2));
  
  const firstAvg = firstHalf.reduce((sum: number, s: any) => sum + s.score, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum: number, s: any) => sum + s.score, 0) / secondHalf.length;
  
  if (secondAvg > firstAvg + 5) return 'improving';
  if (firstAvg > secondAvg + 5) return 'declining';
  return 'stable';
}

function _getSubjectBreakdown(submissions: any[], learningEvents: any[]): any[] {
  const subjects: { [key: string]: { submissions: number, averageScore: number, totalSessions: number } } = {};
  
  // Process submissions
  submissions.forEach((s: any) => {
    const subject = s.subject || 'general';
    if (!subjects[subject]) {
      subjects[subject] = { submissions: 0, averageScore: 0, totalSessions: 0 };
    }
    subjects[subject].submissions++;
  });
  
  // Process learning events
  learningEvents.forEach((e: any) => {
    const subject = e.subject || 'general';
    if (!subjects[subject]) {
      subjects[subject] = { submissions: 0, averageScore: 0, totalSessions: 0 };
    }
    subjects[subject].totalSessions++;
  });
  
  return Object.entries(subjects).map(([subject, data]) => ({
    subject,
    submissions: data.submissions,
    sessions: data.totalSessions,
    averageScore: data.averageScore,
  }));
}

function _calculateAverageSessionDuration(events: any[]): number {
  // This would need more sophisticated tracking
  // For now, return estimated duration
  return 25; // minutes
}

function _calculateLearningStreak(events: any[]): number {
  if (events.length === 0) return 0;
  
  const dates = [...new Set(events.map((e: any) => 
    new Date(e.timestamp).toDateString()
  ))].sort();
  
  return dates.length;
}

function _getMostActiveSubjects(events: any[]): any[] {
  const subjects: { [key: string]: number } = {};
  
  events.forEach((e: any) => {
    const subject = e.subject || 'general';
    subjects[subject] = (subjects[subject] || 0) + 1;
  });
  
  return Object.entries(subjects)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([subject, count]) => ({ subject, sessionCount: count }));
}

function _calculateAverageResolutionTime(helpFlags: any[]): number {
  const resolvedFlags = helpFlags.filter((h: any) => h.status === 'resolved' && h.resolvedAt);
  if (resolvedFlags.length === 0) return 0;
  
  const totalTime = resolvedFlags.reduce((sum: number, h: any) => {
    const opened = new Date(h.openedAt);
    const resolved = new Date(h.resolvedAt);
    return sum + (resolved.getTime() - opened.getTime());
  }, 0);
  
  return totalTime / resolvedFlags.length / (1000 * 60 * 60); // Convert to hours
}

function _getCommonHelpTopics(helpFlags: any[]): any[] {
  const topics: { [key: string]: number } = {};
  
  helpFlags.forEach((h: any) => {
    const topic = h.sourceType || 'general';
    topics[topic] = (topics[topic] || 0) + 1;
  });
  
  return Object.entries(topics)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([topic, count]) => ({ topic, count }));
}

function _getAverageScoreForTeacher(submissions: any[], teacherId: string): number {
  const teacherSubmissions = submissions.filter((s: any) => s.teacherId === teacherId && s.score !== null);
  if (teacherSubmissions.length === 0) return 0;
  
  return teacherSubmissions.reduce((sum: number, s: any) => sum + s.score, 0) / teacherSubmissions.length;
}

function _getRecentActivity(submissions: any[], helpFlags: any[], learningEvents: any[]): any[] {
  const activities: any[] = [];
  
  // Add recent submissions
  submissions.slice(0, 3).forEach((s: any) => {
    activities.push({
      type: 'submission',
      title: 'Assignment Submitted',
      description: s.assignmentTitle || 'Assignment',
      timestamp: s.submittedAt,
      score: s.score,
    });
  });
  
  // Add recent help flags
  helpFlags.slice(0, 2).forEach((h: any) => {
    activities.push({
      type: 'help_flag',
      title: h.status === 'resolved' ? 'Help Request Resolved' : 'Help Request Created',
      description: h.description || 'Help needed',
      timestamp: h.status === 'resolved' ? h.resolvedAt : h.openedAt,
    });
  });
  
  return activities
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5);
}

function _generateParentRecommendations(submissions: any[], helpFlags: any[], learningEvents: any[]): any[] {
  const recommendations = [];
  
  // Check for declining performance
  const trend = _calculateImprovementTrend(submissions);
  if (trend === 'declining') {
    recommendations.push({
      type: 'performance',
      title: 'Academic Performance',
      message: 'Your child\'s recent performance shows a declining trend. Consider discussing study strategies or reaching out to their teacher.',
      priority: 'medium',
    });
  }
  
  // Check for excessive help seeking
  if (helpFlags.length > 5) {
    recommendations.push({
      type: 'help_seeking',
      title: 'Support Needed',
      message: 'Your child has been requesting help frequently. This shows engagement, but they might benefit from additional support at home.',
      priority: 'low',
    });
  }
  
  // Check for low engagement
  if (learningEvents.length < 5) {
    recommendations.push({
      type: 'engagement',
      title: 'Learning Engagement',
      message: 'Your child\'s learning activity seems low. Consider encouraging more regular study sessions.',
      priority: 'medium',
    });
  }
  
  return recommendations;
}
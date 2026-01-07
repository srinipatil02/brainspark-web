import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore } from 'firebase-admin/firestore';

const db = getFirestore();

/**
 * Get comprehensive analytics for a teacher's students
 */
export const getTeacherAnalytics = onCall({
  invoker: 'public'
}, async (request) => {
  try {
    // Authentication required
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Authentication required');
    }

    const { teacherId, dateRange } = request.data;
    
    // Verify the authenticated user is the teacher
    if (request.auth.uid !== teacherId) {
      throw new HttpsError('permission-denied', 'Access denied');
    }

    console.log('📊 Getting teacher analytics:', { teacherId, dateRange });

    const analytics = await generateTeacherAnalytics(teacherId, dateRange);

    console.log('✅ Teacher analytics generated:', {
      teacherId,
      totalStudents: analytics.studentStats.totalStudents,
      totalAssignments: analytics.assignmentStats.totalAssignments,
      totalHelpFlags: analytics.helpFlagStats.totalHelpFlags,
    });

    return {
      success: true,
      analytics,
    };

  } catch (error) {
    console.error('❌ Error getting teacher analytics:', error);
    
    if (error instanceof HttpsError) {
      throw error;
    }
    
    throw new HttpsError('internal', 'Failed to get teacher analytics');
  }
});

/**
 * Get detailed student progress report
 */
export const getStudentProgressReport = onCall({
  invoker: 'public'
}, async (request) => {
  try {
    // Authentication required
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Authentication required');
    }

    const { teacherId, studentId, timeframe } = request.data;
    
    // Verify the authenticated user is the teacher
    if (request.auth.uid !== teacherId) {
      throw new HttpsError('permission-denied', 'Access denied');
    }

    console.log('📈 Getting student progress report:', { teacherId, studentId, timeframe });

    // Verify the student is assigned to this teacher
    const assignmentQuery = await db
      .collection('studentTeacherAssignments')
      .where('teacherId', '==', teacherId)
      .where('studentId', '==', studentId)
      .where('status', '==', 'active')
      .limit(1)
      .get();

    if (assignmentQuery.empty) {
      throw new HttpsError('permission-denied', 'Student not assigned to this teacher');
    }

    const progressReport = await generateStudentProgressReport(studentId, timeframe);

    console.log('✅ Student progress report generated:', {
      studentId,
      timeframe,
      completedAssignments: progressReport.assignmentProgress.completed,
    });

    return {
      success: true,
      report: progressReport,
    };

  } catch (error) {
    console.error('❌ Error getting student progress report:', error);
    
    if (error instanceof HttpsError) {
      throw error;
    }
    
    throw new HttpsError('internal', 'Failed to get student progress report');
  }
});

/**
 * Get assessment performance analytics
 */
export const getAssessmentAnalytics = onCall({
  invoker: 'public'
}, async (request) => {
  try {
    // Authentication required
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Authentication required');
    }

    const { teacherId, assessmentId } = request.data;
    
    // Verify the authenticated user is the teacher
    if (request.auth.uid !== teacherId) {
      throw new HttpsError('permission-denied', 'Access denied');
    }

    console.log('📋 Getting assessment analytics:', { teacherId, assessmentId });

    // Verify the assessment belongs to this teacher
    const assessmentDoc = await db.collection('teacherAssessments').doc(assessmentId).get();

    if (!assessmentDoc.exists) {
      throw new HttpsError('not-found', 'Assessment not found');
    }

    const assessmentData = assessmentDoc.data()!;
    if (assessmentData.teacherId !== teacherId) {
      throw new HttpsError('permission-denied', 'Assessment not owned by teacher');
    }

    const analytics = await generateAssessmentAnalytics(assessmentId, assessmentData);

    console.log('✅ Assessment analytics generated:', {
      assessmentId,
      totalSubmissions: analytics.submissionStats.total,
      averageScore: analytics.performanceStats.averageScore,
    });

    return {
      success: true,
      analytics,
    };

  } catch (error) {
    console.error('❌ Error getting assessment analytics:', error);
    
    if (error instanceof HttpsError) {
      throw error;
    }
    
    throw new HttpsError('internal', 'Failed to get assessment analytics');
  }
});

/**
 * Generate comprehensive teacher analytics
 */
async function generateTeacherAnalytics(teacherId: string, dateRange?: { start: string, end: string }) {
  const endDate = dateRange?.end ? new Date(dateRange.end) : new Date();
  const startDate = dateRange?.start ? new Date(dateRange.start) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

  // Get assigned students
  const studentsQuery = await db
    .collection('studentTeacherAssignments')
    .where('teacherId', '==', teacherId)
    .where('status', '==', 'active')
    .get();

  const studentIds = studentsQuery.docs.map(doc => doc.data().studentId);

  // Get teacher's assessments
  const assessmentsQuery = await db
    .collection('teacherAssessments')
    .where('teacherId', '==', teacherId)
    .where('createdAt', '>=', startDate)
    .where('createdAt', '<=', endDate)
    .get();

  // Get help flags
  const helpFlagsQuery = await db
    .collection('helpFlags')
    .where('teacherId', '==', teacherId)
    .where('openedAt', '>=', startDate)
    .where('openedAt', '<=', endDate)
    .get();

  // Get assessment submissions
  const submissionsQuery = await db
    .collection('assessmentSubmissions')
    .where('teacherId', '==', teacherId)
    .where('submittedAt', '>=', startDate)
    .where('submittedAt', '<=', endDate)
    .get();

  // Calculate student engagement
  const studentEngagement = await calculateStudentEngagement(studentIds, startDate, endDate);

  return {
    dateRange: { start: startDate.toISOString(), end: endDate.toISOString() },
    studentStats: {
      totalStudents: studentIds.length,
      activeStudents: studentEngagement.activeStudents,
      studentsNeedingHelp: helpFlagsQuery.docs.filter(doc => doc.data().status === 'open').length,
      engagementRate: studentIds.length > 0 ? (studentEngagement.activeStudents / studentIds.length) * 100 : 0,
    },
    assignmentStats: {
      totalAssignments: assessmentsQuery.docs.length,
      activeAssignments: assessmentsQuery.docs.filter(doc => doc.data().status === 'active').length,
      completedAssignments: assessmentsQuery.docs.filter(doc => doc.data().status === 'completed').length,
      averageQuestionsPerAssignment: assessmentsQuery.docs.reduce((sum, doc) => sum + (doc.data().questionIds?.length || 0), 0) / Math.max(assessmentsQuery.docs.length, 1),
    },
    performanceStats: {
      totalSubmissions: submissionsQuery.docs.length,
      averageScore: submissionsQuery.docs.reduce((sum, doc) => sum + (doc.data().score || 0), 0) / Math.max(submissionsQuery.docs.length, 1),
      completionRate: calculateCompletionRate(assessmentsQuery.docs, submissionsQuery.docs),
      topPerformers: await getTopPerformers(submissionsQuery.docs),
    },
    helpFlagStats: {
      totalHelpFlags: helpFlagsQuery.docs.length,
      openHelpFlags: helpFlagsQuery.docs.filter(doc => doc.data().status === 'open').length,
      resolvedHelpFlags: helpFlagsQuery.docs.filter(doc => doc.data().status === 'resolved').length,
      averageResolutionTime: calculateAverageResolutionTime(helpFlagsQuery.docs.filter(doc => doc.data().status === 'resolved')),
      helpFlagsByPriority: categorizeHelpFlagsByPriority(helpFlagsQuery.docs),
    },
    recentActivity: await getRecentTeacherActivity(teacherId, startDate, endDate),
    recommendations: generateTeacherRecommendations(studentEngagement, helpFlagsQuery.docs, submissionsQuery.docs),
  };
}

/**
 * Generate student progress report
 */
async function generateStudentProgressReport(studentId: string, timeframe: string) {
  const endDate = new Date();
  const startDate = getStartDateForTimeframe(timeframe);

  // Get student's assignment submissions
  const submissionsQuery = await db
    .collection('assessmentSubmissions')
    .where('studentId', '==', studentId)
    .where('submittedAt', '>=', startDate)
    .where('submittedAt', '<=', endDate)
    .get();

  // Get student's help flags
  const helpFlagsQuery = await db
    .collection('helpFlags')
    .where('studentId', '==', studentId)
    .where('openedAt', '>=', startDate)
    .where('openedAt', '<=', endDate)
    .get();

  // Get student's learning events
  const learningEventsQuery = await db
    .collection('newLearningEvents')
    .where('userId', '==', studentId)
    .where('timestamp', '>=', startDate)
    .where('timestamp', '<=', endDate)
    .orderBy('timestamp', 'desc')
    .limit(50)
    .get();

  const submissions = submissionsQuery.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  const helpFlags = helpFlagsQuery.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  const learningEvents = learningEventsQuery.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  return {
    timeframe: { start: startDate.toISOString(), end: endDate.toISOString() },
    assignmentProgress: {
      completed: submissions.length,
      averageScore: submissions.reduce((sum, sub: any) => sum + (sub.score || 0), 0) / Math.max(submissions.length, 1),
      bestScore: Math.max(...submissions.map((sub: any) => sub.score || 0), 0),
      improvementTrend: calculateImprovementTrend(submissions),
    },
    helpSeekingBehavior: {
      totalHelpRequests: helpFlags.length,
      openRequests: helpFlags.filter((flag: any) => flag.status === 'open').length,
      averageResolutionTime: calculateAverageResolutionTime(helpFlags.filter((flag: any) => flag.status === 'resolved')),
      mostCommonHelpTopics: getMostCommonHelpTopics(helpFlags),
    },
    engagementMetrics: {
      totalSessions: learningEvents.length,
      averageSessionDuration: calculateAverageSessionDuration(learningEvents),
      learningStreak: calculateLearningStreak(learningEvents),
      subjectFocus: getSubjectFocus(learningEvents),
    },
    recommendations: generateStudentRecommendations(submissions, helpFlags, learningEvents),
  };
}

/**
 * Generate assessment-specific analytics
 */
async function generateAssessmentAnalytics(assessmentId: string, assessmentData: any) {
  // Get all submissions for this assessment
  const submissionsQuery = await db
    .collection('assessmentSubmissions')
    .where('assignmentId', '==', assessmentId)
    .get();

  const submissions = submissionsQuery.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  // Get help flags related to this assessment
  const helpFlagsQuery = await db
    .collection('helpFlags')
    .where('sourceRefId', '==', assessmentId)
    .get();

  const helpFlags = helpFlagsQuery.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  return {
    assessmentInfo: {
      id: assessmentId,
      title: assessmentData.title,
      subject: assessmentData.subject,
      yearLevel: assessmentData.yearLevel,
      totalQuestions: assessmentData.questionIds?.length || 0,
      assignedStudents: assessmentData.assignedStudentIds?.length || 0,
    },
    submissionStats: {
      total: submissions.length,
      completionRate: (submissions.length / Math.max(assessmentData.assignedStudentIds?.length || 1, 1)) * 100,
      onTimeSubmissions: submissions.filter((sub: any) => isSubmissionOnTime(sub, assessmentData)).length,
      lateSubmissions: submissions.filter((sub: any) => !isSubmissionOnTime(sub, assessmentData)).length,
    },
    performanceStats: {
      averageScore: submissions.reduce((sum, sub: any) => sum + (sub.score || 0), 0) / Math.max(submissions.length, 1),
      highestScore: Math.max(...submissions.map((sub: any) => sub.score || 0), 0),
      lowestScore: Math.min(...submissions.map((sub: any) => sub.score || 100), 100),
      scoreDistribution: calculateScoreDistribution(submissions),
    },
    helpFlagAnalytics: {
      totalHelpRequests: helpFlags.length,
      studentsRequestingHelp: [...new Set(helpFlags.map((flag: any) => flag.studentId))].length,
      mostCommonIssues: getMostCommonHelpTopics(helpFlags),
    },
    questionAnalytics: await getQuestionLevelAnalytics(assessmentData.questionIds, submissions),
    recommendations: generateAssessmentRecommendations(submissions, helpFlags, assessmentData),
  };
}

// Helper functions
async function calculateStudentEngagement(studentIds: string[], startDate: Date, endDate: Date) {
  const activeStudents = new Set();

  // Check learning events for activity
  const learningEventsQuery = await db
    .collection('newLearningEvents')
    .where('userId', 'in', studentIds.slice(0, 10)) // Firestore 'in' limit
    .where('timestamp', '>=', startDate)
    .where('timestamp', '<=', endDate)
    .get();

  learningEventsQuery.docs.forEach(doc => {
    activeStudents.add(doc.data().userId);
  });

  return { activeStudents: activeStudents.size };
}

function calculateCompletionRate(assessments: any[], submissions: any[]) {
  if (assessments.length === 0) return 0;
  
  const totalAssignments = assessments.reduce((sum, assessment) => 
    sum + (assessment.data().assignedStudentIds?.length || 0), 0);
  
  return totalAssignments > 0 ? (submissions.length / totalAssignments) * 100 : 0;
}

async function getTopPerformers(submissions: any[]) {
  const studentScores: { [key: string]: number[] } = {};
  
  submissions.forEach((sub: any) => {
    if (sub.data().score && sub.data().studentId) {
      if (!studentScores[sub.data().studentId]) {
        studentScores[sub.data().studentId] = [];
      }
      studentScores[sub.data().studentId].push(sub.data().score);
    }
  });

  const averages = Object.entries(studentScores).map(([studentId, scores]) => ({
    studentId,
    averageScore: scores.reduce((sum, score) => sum + score, 0) / scores.length,
  }));

  return averages
    .sort((a, b) => b.averageScore - a.averageScore)
    .slice(0, 5);
}

function calculateAverageResolutionTime(resolvedFlags: any[]): number {
  if (resolvedFlags.length === 0) return 0;
  
  const totalTime = resolvedFlags.reduce((sum, flag) => {
    const opened = flag.data().openedAt?.toDate?.() || new Date(flag.data().openedAt);
    const resolved = flag.data().resolvedAt?.toDate?.() || new Date(flag.data().resolvedAt);
    return sum + (resolved.getTime() - opened.getTime());
  }, 0);
  
  return totalTime / resolvedFlags.length / (1000 * 60 * 60); // Convert to hours
}

function categorizeHelpFlagsByPriority(helpFlags: any[]) {
  return helpFlags.reduce((acc, flag) => {
    const priority = flag.data().priority || 'medium';
    acc[priority] = (acc[priority] || 0) + 1;
    return acc;
  }, {});
}

function getStartDateForTimeframe(timeframe: string): Date {
  const now = new Date();
  switch (timeframe) {
    case 'week':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case 'month':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case 'quarter':
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    default:
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
}

async function getRecentTeacherActivity(teacherId: string, startDate: Date, endDate: Date) {
  // Get recent activity across all teacher actions
  const activities: any[] = [];

  // Recent assessments created
  const recentAssessments = await db
    .collection('teacherAssessments')
    .where('teacherId', '==', teacherId)
    .where('createdAt', '>=', startDate)
    .orderBy('createdAt', 'desc')
    .limit(5)
    .get();

  recentAssessments.docs.forEach(doc => {
    activities.push({
      type: 'assessment_created',
      title: doc.data().title,
      timestamp: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
    });
  });

  // Recent help flags resolved
  const recentResolutions = await db
    .collection('helpFlags')
    .where('teacherId', '==', teacherId)
    .where('resolvedAt', '>=', startDate)
    .orderBy('resolvedAt', 'desc')
    .limit(5)
    .get();

  recentResolutions.docs.forEach(doc => {
    activities.push({
      type: 'help_flag_resolved',
      description: 'Resolved student help request',
      timestamp: doc.data().resolvedAt?.toDate?.()?.toISOString() || doc.data().resolvedAt,
    });
  });

  return activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 10);
}

function generateTeacherRecommendations(engagement: any, helpFlags: any[], submissions: any[]) {
  const recommendations = [];

  if (engagement.activeStudents === 0) {
    recommendations.push({
      type: 'engagement',
      title: 'Low Student Engagement',
      description: 'Consider reaching out to students who haven\'t been active recently.',
      priority: 'high',
    });
  }

  if (helpFlags.filter(flag => flag.data().status === 'open').length > 3) {
    recommendations.push({
      type: 'help_flags',
      title: 'Pending Help Requests',
      description: 'You have multiple unresolved help requests from students.',
      priority: 'high',
    });
  }

  return recommendations;
}

function calculateImprovementTrend(submissions: any[]) {
  if (submissions.length < 2) return 'insufficient_data';
  
  const sortedSubmissions = submissions.sort((a, b) => 
    new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime());
  
  const firstHalf = sortedSubmissions.slice(0, Math.ceil(submissions.length / 2));
  const secondHalf = sortedSubmissions.slice(Math.ceil(submissions.length / 2));
  
  const firstAvg = firstHalf.reduce((sum, sub) => sum + (sub.score || 0), 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, sub) => sum + (sub.score || 0), 0) / secondHalf.length;
  
  if (secondAvg > firstAvg + 5) return 'improving';
  if (firstAvg > secondAvg + 5) return 'declining';
  return 'stable';
}

function getMostCommonHelpTopics(helpFlags: any[]) {
  const topics: { [key: string]: number } = {};
  
  helpFlags.forEach(flag => {
    const sourceType = flag.sourceType || 'general';
    topics[sourceType] = (topics[sourceType] || 0) + 1;
  });
  
  return Object.entries(topics)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([topic, count]) => ({ topic, count }));
}

function calculateAverageSessionDuration(events: any[]) {
  // This would need more sophisticated session tracking
  // For now, return a placeholder
  return 25; // minutes
}

function calculateLearningStreak(events: any[]) {
  // Calculate consecutive days of learning activity
  const days = [...new Set(events.map(event => 
    new Date(event.timestamp?.toDate?.() || event.timestamp).toDateString()))];
  return days.length;
}

function getSubjectFocus(events: any[]) {
  const subjects: { [key: string]: number } = {};
  
  events.forEach(event => {
    const subject = event.subject || 'general';
    subjects[subject] = (subjects[subject] || 0) + 1;
  });
  
  return Object.entries(subjects)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([subject, count]) => ({ subject, sessionCount: count }));
}

function generateStudentRecommendations(submissions: any[], helpFlags: any[], events: any[]) {
  const recommendations = [];

  if (submissions.length > 0) {
    const avgScore = submissions.reduce((sum, sub) => sum + (sub.score || 0), 0) / submissions.length;
    if (avgScore < 70) {
      recommendations.push({
        type: 'performance',
        message: 'Student may benefit from additional practice or one-on-one support',
      });
    }
  }

  if (helpFlags.length > events.length * 0.3) {
    recommendations.push({
      type: 'help_seeking',
      message: 'Student frequently requests help - consider reviewing foundational concepts',
    });
  }

  return recommendations;
}

function isSubmissionOnTime(submission: any, assessment: any) {
  if (!assessment.scheduledFor || !submission.submittedAt) return true;
  
  const dueDate = assessment.scheduledFor?.toDate?.() || new Date(assessment.scheduledFor);
  const submittedDate = submission.submittedAt?.toDate?.() || new Date(submission.submittedAt);
  
  return submittedDate <= dueDate;
}

function calculateScoreDistribution(submissions: any[]) {
  const ranges = { '0-59': 0, '60-69': 0, '70-79': 0, '80-89': 0, '90-100': 0 };
  
  submissions.forEach(sub => {
    const score = sub.score || 0;
    if (score < 60) ranges['0-59']++;
    else if (score < 70) ranges['60-69']++;
    else if (score < 80) ranges['70-79']++;
    else if (score < 90) ranges['80-89']++;
    else ranges['90-100']++;
  });
  
  return ranges;
}

async function getQuestionLevelAnalytics(questionIds: string[], submissions: any[]) {
  // This would analyze performance on individual questions
  // For now, return basic structure
  return {
    totalQuestions: questionIds?.length || 0,
    averageCorrectRate: 75, // placeholder
    difficultQuestions: [], // questions with low success rates
  };
}

function generateAssessmentRecommendations(submissions: any[], helpFlags: any[], assessmentData: any) {
  const recommendations = [];

  const completionRate = (submissions.length / Math.max(assessmentData.assignedStudentIds?.length || 1, 1)) * 100;
  if (completionRate < 50) {
    recommendations.push({
      type: 'completion',
      message: 'Low completion rate - consider following up with students',
    });
  }

  if (helpFlags.length > submissions.length * 0.2) {
    recommendations.push({
      type: 'difficulty',
      message: 'High help request rate suggests assessment may be challenging',
    });
  }

  return recommendations;
}
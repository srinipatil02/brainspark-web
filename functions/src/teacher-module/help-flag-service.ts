// functions/src/teacher-module/help-flag-service.ts

import { CallableRequest, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore, FieldValue, Query } from 'firebase-admin/firestore';

const db = getFirestore();

// Types
interface CreateHelpFlagRequest {
  studentId: string;
  teacherId: string;
  sourceType: 'concept_card' | 'question';
  sourceRefId: string;
  sourceSubref?: string;
  description?: string;
  contextJson: {
    conceptCardTitle?: string;
    sectionTitle?: string;
    currentProgress?: any;
    questionText?: string;
    studentAnswer?: any;
    assessmentContext?: {
      assessmentId: string;
      assignmentId?: string;
      assessmentTitle?: string;
      questionIndex?: number;
      isTimedAssessment?: boolean;
    };
    additionalData?: any;
  };
}

interface ResolveHelpFlagRequest {
  helpFlagId: string;
  teacherId: string;
  resolutionNotes?: string;
}

/**
 * Create a new help flag (called by students)
 */
export const createHelpFlag = async (request: CallableRequest<CreateHelpFlagRequest>) => {
  const { auth: authContext, data } = request;
  
  if (!authContext?.uid) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  // Verify the request is for the authenticated user
  if (data.studentId !== authContext.uid) {
    throw new HttpsError('permission-denied', 'You can only create help flags for yourself');
  }

  try {
    console.log('Creating help flag for student:', data.studentId);

    // Verify teacher assignment exists
    const teacherAssignmentQuery = await db
      .collection('studentTeacherAssignments')
      .where('studentId', '==', data.studentId)
      .where('teacherId', '==', data.teacherId)
      .where('active', '==', true)
      .get();

    if (teacherAssignmentQuery.empty) {
      throw new HttpsError('permission-denied', 'You are not assigned to this teacher');
    }

    // Check for existing open help flag for same source
    const existingFlagQuery = await db
      .collection('helpFlags')
      .where('studentId', '==', data.studentId)
      .where('teacherId', '==', data.teacherId)
      .where('sourceRefId', '==', data.sourceRefId)
      .where('status', '==', 'open')
      .get();

    if (!existingFlagQuery.empty) {
      throw new HttpsError('already-exists', 'You already have an open help request for this content');
    }

    // Calculate priority based on context
    const priority = calculateHelpFlagPriority(data);

    // Create help flag
    const helpFlagRef = db.collection('helpFlags').doc();
    const helpFlag = {
      studentId: data.studentId,
      teacherId: data.teacherId,
      sourceType: data.sourceType,
      sourceRefId: data.sourceRefId,
      sourceSubref: data.sourceSubref,
      description: data.description,
      contextJson: data.contextJson,
      status: 'open',
      priority,
      openedAt: FieldValue.serverTimestamp(),
    };

    await helpFlagRef.set(helpFlag);

    console.log('Help flag created:', helpFlagRef.id);

    // TODO: Send notification to teacher (implement with Firebase messaging or in-app notifications)
    
    return {
      success: true,
      helpFlagId: helpFlagRef.id,
      message: 'Help request sent to your teacher',
    };

  } catch (error: any) {
    console.error('Error creating help flag:', error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError('internal', 'Failed to create help request');
  }
};

/**
 * Get help flags for teacher with filters and pagination
 */
export const getTeacherHelpFlags = async (request: CallableRequest<{
  status?: 'open' | 'resolved';
  studentId?: string;
  sourceType?: 'concept_card' | 'question';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  limit?: number;
  startAfter?: string;
}>) => {
  const { auth: authContext, data } = request;
  
  if (!authContext?.uid) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  // Verify user is a teacher
  if (authContext.token?.role !== 'teacher') {
    throw new HttpsError('permission-denied', 'Only teachers can view help flags');
  }

  try {
    const limit = data.limit || 20;
    
    // Build base query
    let query: Query = db
      .collection('helpFlags')
      .where('teacherId', '==', authContext.uid)
      .orderBy('priority', 'desc')
      .orderBy('openedAt', 'desc')
      .limit(limit);

    // Add filters
    if (data.status) {
      query = query.where('status', '==', data.status);
    }
    
    if (data.studentId) {
      query = query.where('studentId', '==', data.studentId);
    }
    
    if (data.sourceType) {
      query = query.where('sourceType', '==', data.sourceType);
    }
    
    if (data.priority) {
      query = query.where('priority', '==', data.priority);
    }

    // Add pagination
    if (data.startAfter) {
      const startAfterDoc = await db.collection('helpFlags').doc(data.startAfter).get();
      if (startAfterDoc.exists) {
        query = query.startAfter(startAfterDoc);
      }
    }

    const helpFlagsSnapshot = await query.get();
    const helpFlags = helpFlagsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as any[];

    // Get student profiles for help flags
    const studentIds = [...new Set(helpFlags.map(f => f.studentId))];
    const studentProfiles = await Promise.all(
      studentIds.map(async (studentId) => {
        const studentDoc = await db.collection('newUserProfiles').doc(studentId).get();
        return {
          id: studentId,
          profile: studentDoc.exists ? studentDoc.data() : null,
        };
      })
    );

    // Enrich help flags with student data
    const enrichedHelpFlags = helpFlags.map(flag => ({
      ...flag,
      student: studentProfiles.find(p => p.id === flag.studentId)?.profile,
    }));

    return {
      success: true,
      helpFlags: enrichedHelpFlags,
      hasMore: helpFlagsSnapshot.docs.length === limit,
      lastDocument: helpFlagsSnapshot.docs[helpFlagsSnapshot.docs.length - 1]?.id,
    };

  } catch (error: any) {
    console.error('Error getting teacher help flags:', error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError('internal', 'Failed to get help flags');
  }
};

/**
 * Get help flag with full context for resolution
 */
export const getHelpFlagWithContext = async (request: CallableRequest<{
  helpFlagId: string;
}>) => {
  const { auth: authContext, data } = request;
  
  if (!authContext?.uid) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  try {
    // Get help flag
    const helpFlagDoc = await db.collection('helpFlags').doc(data.helpFlagId).get();
    if (!helpFlagDoc.exists) {
      throw new HttpsError('not-found', 'Help flag not found');
    }

    const helpFlag = helpFlagDoc.data();
    
    // Verify teacher has access to this help flag
    if (helpFlag?.teacherId !== authContext.uid) {
      throw new HttpsError('permission-denied', 'You do not have access to this help flag');
    }

    // Get student profile
    const studentDoc = await db.collection('newUserProfiles').doc(helpFlag.studentId).get();
    const studentProfile = studentDoc.exists ? studentDoc.data() : null;

    // Get source content based on type
    let sourceContent = null;
    if (helpFlag.sourceType === 'concept_card') {
      const conceptCardDoc = await db.collection('newConceptCards').doc(helpFlag.sourceRefId).get();
      sourceContent = conceptCardDoc.exists ? conceptCardDoc.data() : null;
    } else if (helpFlag.sourceType === 'question') {
      const questionDoc = await db.collection('questions').doc(helpFlag.sourceRefId).get();
      sourceContent = questionDoc.exists ? questionDoc.data() : null;
    }

    // Get assessment context if applicable
    let assessmentContext = null;
    if (helpFlag.contextJson?.assessmentContext) {
      const assessmentId = helpFlag.contextJson.assessmentContext.assessmentId;
      const assessmentDoc = await db.collection('teacherAssessments').doc(assessmentId).get();
      assessmentContext = assessmentDoc.exists ? assessmentDoc.data() : null;
    }

    return {
      success: true,
      helpFlag: {
        id: helpFlagDoc.id,
        ...helpFlag,
      },
      student: studentProfile,
      sourceContent,
      assessmentContext,
    };

  } catch (error: any) {
    console.error('Error getting help flag with context:', error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError('internal', 'Failed to get help flag context');
  }
};

/**
 * Resolve help flag (mark as completed)
 */
export const resolveHelpFlag = async (request: CallableRequest<ResolveHelpFlagRequest>) => {
  const { auth: authContext, data } = request;
  
  if (!authContext?.uid) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  // Verify user is a teacher
  if (authContext.token?.role !== 'teacher') {
    throw new HttpsError('permission-denied', 'Only teachers can resolve help flags');
  }

  // Verify teacher ID matches authenticated user
  if (data.teacherId !== authContext.uid) {
    throw new HttpsError('permission-denied', 'You can only resolve your own help flags');
  }

  try {
    console.log('Resolving help flag:', data.helpFlagId);

    // Get help flag
    const helpFlagDoc = await db.collection('helpFlags').doc(data.helpFlagId).get();
    if (!helpFlagDoc.exists) {
      throw new HttpsError('not-found', 'Help flag not found');
    }

    const helpFlag = helpFlagDoc.data();
    
    // Verify teacher ownership
    if (helpFlag?.teacherId !== authContext.uid) {
      throw new HttpsError('permission-denied', 'You can only resolve your own help flags');
    }

    // Check if already resolved
    if (helpFlag?.status === 'resolved') {
      throw new HttpsError('failed-precondition', 'Help flag is already resolved');
    }

    // Update help flag
    await helpFlagDoc.ref.update({
      status: 'resolved',
      resolvedAt: FieldValue.serverTimestamp(),
      resolvedBy: authContext.uid,
      resolutionNotes: data.resolutionNotes,
    });

    console.log('Help flag resolved successfully');

    // TODO: Send notification to student that their help request was resolved

    return {
      success: true,
      message: 'Help request resolved successfully',
    };

  } catch (error: any) {
    console.error('Error resolving help flag:', error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError('internal', 'Failed to resolve help flag');
  }
};

/**
 * Get help flag statistics for teacher dashboard
 */
export const getHelpFlagStatistics = async (request: CallableRequest<{
  timeRange?: 'week' | 'month' | 'quarter';
}>) => {
  const { auth: authContext, data } = request;
  
  if (!authContext?.uid) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  // Verify user is a teacher
  if (authContext.token?.role !== 'teacher') {
    throw new HttpsError('permission-denied', 'Only teachers can view help flag statistics');
  }

  try {
    const timeRange = data.timeRange || 'week';
    const now = new Date();
    let startDate: Date;

    switch (timeRange) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'quarter':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // Get all help flags for teacher in time range
    const helpFlagsQuery = await db
      .collection('helpFlags')
      .where('teacherId', '==', authContext.uid)
      .where('openedAt', '>=', startDate)
      .get();

    const helpFlags = helpFlagsQuery.docs.map(doc => doc.data());

    // Calculate statistics
    const totalFlags = helpFlags.length;
    const openFlags = helpFlags.filter(f => f.status === 'open').length;
    const resolvedFlags = helpFlags.filter(f => f.status === 'resolved').length;
    
    const flagsByPriority = {
      urgent: helpFlags.filter(f => f.priority === 'urgent').length,
      high: helpFlags.filter(f => f.priority === 'high').length,
      medium: helpFlags.filter(f => f.priority === 'medium').length,
      low: helpFlags.filter(f => f.priority === 'low').length,
    };

    const flagsBySourceType = {
      concept_card: helpFlags.filter(f => f.sourceType === 'concept_card').length,
      question: helpFlags.filter(f => f.sourceType === 'question').length,
    };

    // Calculate average resolution time for resolved flags
    const resolvedFlagsWithTimes = helpFlags.filter(f => 
      f.status === 'resolved' && f.openedAt && f.resolvedAt
    );
    
    let averageResolutionHours = 0;
    if (resolvedFlagsWithTimes.length > 0) {
      const totalResolutionTime = resolvedFlagsWithTimes.reduce((total, flag) => {
        const resolutionTime = flag.resolvedAt.toDate().getTime() - flag.openedAt.toDate().getTime();
        return total + resolutionTime;
      }, 0);
      
      averageResolutionHours = totalResolutionTime / resolvedFlagsWithTimes.length / (1000 * 60 * 60);
    }

    return {
      success: true,
      statistics: {
        totalFlags,
        openFlags,
        resolvedFlags,
        resolutionRate: totalFlags > 0 ? resolvedFlags / totalFlags : 0,
        averageResolutionHours: Math.round(averageResolutionHours * 10) / 10,
        flagsByPriority,
        flagsBySourceType,
        timeRange,
      },
    };

  } catch (error: any) {
    console.error('Error getting help flag statistics:', error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError('internal', 'Failed to get help flag statistics');
  }
};

/**
 * Get student's help flags (for student view)
 */
export const getStudentHelpFlags = async (request: CallableRequest<{
  status?: 'open' | 'resolved';
  limit?: number;
}>) => {
  const { auth: authContext, data } = request;
  
  if (!authContext?.uid) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  try {
    const limit = data.limit || 10;
    
    // Build query
    let query: Query = db
      .collection('helpFlags')
      .where('studentId', '==', authContext.uid)
      .orderBy('openedAt', 'desc')
      .limit(limit);

    if (data.status) {
      query = query.where('status', '==', data.status);
    }

    const helpFlagsSnapshot = await query.get();
    const helpFlags = helpFlagsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as any[];

    return {
      success: true,
      helpFlags,
    };

  } catch (error: any) {
    console.error('Error getting student help flags:', error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError('internal', 'Failed to get help flags');
  }
};

/**
 * Helper function to calculate help flag priority
 */
function calculateHelpFlagPriority(data: CreateHelpFlagRequest): 'low' | 'medium' | 'high' | 'urgent' {
  // Assessment-related help flags get higher priority
  if (data.contextJson.assessmentContext) {
    if (data.contextJson.assessmentContext.isTimedAssessment) {
      return 'urgent';
    }
    return 'high';
  }

  // Question help flags get medium priority
  if (data.sourceType === 'question') {
    return 'medium';
  }

  // Concept card help flags get low to medium priority
  return 'low';
}
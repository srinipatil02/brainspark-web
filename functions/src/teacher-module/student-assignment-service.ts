import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore } from 'firebase-admin/firestore';

const db = getFirestore();

/**
 * Get active assignments for a student
 */
export const getStudentActiveAssignments = onCall({
  cors: true,
  invoker: 'public'
}, async (request) => {
  try {
    // Authentication required
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Authentication required');
    }

    const { studentId } = request.data;
    
    // Verify the authenticated user matches the requested student
    if (request.auth.uid !== studentId) {
      throw new HttpsError('permission-denied', 'Access denied');
    }

    console.log('📚 Getting active assignments for student:', studentId);

    // Get all active assignments from assessmentAssignments collection
    const assignmentsQuery = await db
      .collection('assessmentAssignments')
      .where('studentId', '==', studentId)
      .where('status', '==', 'assigned')
      .orderBy('dueAt', 'asc')
      .limit(10)
      .get();

    const assignments = [];
    for (const doc of assignmentsQuery.docs) {
      const assignmentData = doc.data();
      
      // Get the assessment details
      let assessmentData = null;
      try {
        const assessmentDoc = await db.collection('teacherAssessments').doc(assignmentData.assessmentId).get();
        if (assessmentDoc.exists) {
          assessmentData = assessmentDoc.data();
        }
      } catch (error) {
        console.warn('Could not fetch assessment data:', error);
        continue; // Skip this assignment if we can't get the assessment
      }
      
      if (!assessmentData) continue;
      
      // Get teacher name for display
      let teacherName = 'Teacher';
      try {
        const teacherDoc = await db.collection('newUserProfiles').doc(assignmentData.teacherId).get();
        if (teacherDoc.exists) {
          const teacherData = teacherDoc.data();
          teacherName = `${teacherData?.firstName || ''} ${teacherData?.lastName || ''}`.trim() || 'Teacher';
        }
      } catch (error) {
        console.warn('Could not fetch teacher name:', error);
      }

      assignments.push({
        // Assignment fields
        assignmentId: doc.id,
        dueAt: assignmentData.dueAt?.toDate?.()?.toISOString() || assignmentData.dueAt,
        assignedAt: assignmentData.assignedAt?.toDate?.()?.toISOString() || assignmentData.assignedAt,
        options: assignmentData.options || {},
        status: assignmentData.status,
        
        // Assessment fields
        id: assignmentData.assessmentId,
        teacherId: assignmentData.teacherId,
        teacherName,
        title: assessmentData.title,
        instructionsMd: assessmentData.instructionsMd,
        questionIds: assessmentData.questionIds || [],
        configuration: assessmentData.configuration || {},
        defaultOptions: assessmentData.defaultOptions || {},
        createdAt: assessmentData.createdAt?.toDate?.()?.toISOString() || assessmentData.createdAt,
        updatedAt: assessmentData.updatedAt?.toDate?.()?.toISOString() || assessmentData.updatedAt,
      });
    }

    console.log('✅ Found assignments for student:', {
      studentId,
      assignmentCount: assignments.length,
    });

    return {
      success: true,
      assignments,
      totalCount: assignments.length,
    };

  } catch (error) {
    console.error('❌ Error getting student assignments:', error);
    
    if (error instanceof HttpsError) {
      throw error;
    }
    
    throw new HttpsError('internal', 'Failed to get student assignments');
  }
});

/**
 * Get a specific assignment by ID for a student
 */
export const getStudentAssignmentById = onCall({
  invoker: 'public'
}, async (request) => {
  try {
    // Authentication required
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Authentication required');
    }

    const { studentId, assignmentId } = request.data;
    
    // Verify the authenticated user matches the requested student
    if (request.auth.uid !== studentId) {
      throw new HttpsError('permission-denied', 'Access denied');
    }

    if (!assignmentId) {
      throw new HttpsError('invalid-argument', 'Assignment ID is required');
    }

    console.log('📋 Getting assignment for student:', { studentId, assignmentId });

    // Get the specific assignment
    const assignmentDoc = await db.collection('teacherAssessments').doc(assignmentId).get();

    if (!assignmentDoc.exists) {
      throw new HttpsError('not-found', 'Assignment not found');
    }

    const data = assignmentDoc.data()!;

    // Verify student is assigned to this assessment
    if (!data.assignedStudentIds?.includes(studentId)) {
      throw new HttpsError('permission-denied', 'Student not assigned to this assessment');
    }

    // Get teacher name for display
    let teacherName = 'Teacher';
    try {
      const teacherDoc = await db.collection('teacherProfiles').doc(data.teacherId).get();
      if (teacherDoc.exists) {
        const teacherData = teacherDoc.data();
        teacherName = `${teacherData?.firstName || ''} ${teacherData?.lastName || ''}`.trim() || 'Teacher';
      }
    } catch (error) {
      console.warn('Could not fetch teacher name:', error);
    }

    // Get questions for this assignment
    const questions = [];
    if (data.questionIds && data.questionIds.length > 0) {
      try {
        const questionDocs = await Promise.all(
          data.questionIds.map((id: string) => db.collection('questions').doc(id).get())
        );
        
        for (const questionDoc of questionDocs) {
          if (questionDoc.exists) {
            questions.push({
              id: questionDoc.id,
              ...questionDoc.data(),
            });
          }
        }
      } catch (error) {
        console.warn('Could not fetch questions:', error);
      }
    }

    const assignment = {
      id: assignmentDoc.id,
      teacherId: data.teacherId,
      teacherName,
      title: data.title,
      description: data.description,
      subject: data.subject,
      yearLevel: data.yearLevel,
      questionIds: data.questionIds || [],
      questions, // Include actual question data
      assessmentType: data.assessmentType,
      isTimedAssessment: data.isTimedAssessment || false,
      timeLimitMinutes: data.timeLimitMinutes,
      scheduledFor: data.scheduledFor?.toDate?.()?.toISOString() || data.scheduledFor,
      assignedStudentIds: data.assignedStudentIds || [],
      status: data.status,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
      updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
    };

    console.log('✅ Assignment retrieved for student:', {
      studentId,
      assignmentId,
      title: assignment.title,
      questionCount: assignment.questionIds.length,
    });

    return {
      success: true,
      assignment,
    };

  } catch (error) {
    console.error('❌ Error getting student assignment:', error);
    
    if (error instanceof HttpsError) {
      throw error;
    }
    
    throw new HttpsError('internal', 'Failed to get student assignment');
  }
});

/**
 * Submit assessment answers for a student
 */
export const submitStudentAssessment = onCall({
  invoker: 'public'
}, async (request) => {
  try {
    // Authentication required
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Authentication required');
    }

    const { studentId, assignmentId, answers, timeSpent, completedAt } = request.data;
    
    // Verify the authenticated user matches the requested student
    if (request.auth.uid !== studentId) {
      throw new HttpsError('permission-denied', 'Access denied');
    }

    if (!assignmentId || !answers) {
      throw new HttpsError('invalid-argument', 'Assignment ID and answers are required');
    }

    console.log('📝 Submitting assessment for student:', { 
      studentId, 
      assignmentId,
      answerCount: Object.keys(answers).length,
      timeSpent,
    });

    // Get the assignment to verify access
    const assignmentDoc = await db.collection('teacherAssessments').doc(assignmentId).get();

    if (!assignmentDoc.exists) {
      throw new HttpsError('not-found', 'Assignment not found');
    }

    const assignmentData = assignmentDoc.data()!;

    // Verify student is assigned to this assessment
    if (!assignmentData.assignedStudentIds?.includes(studentId)) {
      throw new HttpsError('permission-denied', 'Student not assigned to this assessment');
    }

    // Create submission record
    const submissionId = `${assignmentId}_${studentId}`;
    const submissionData = {
      id: submissionId,
      studentId,
      assignmentId,
      teacherId: assignmentData.teacherId,
      answers: answers,
      timeSpentMinutes: timeSpent || 0,
      submittedAt: completedAt ? new Date(completedAt) : new Date(),
      createdAt: new Date(),
      status: 'submitted',
      // Will be populated by grading service
      score: null,
      feedback: null,
      gradedAt: null,
      gradedBy: null,
    };

    // Save submission
    await db.collection('assessmentSubmissions').doc(submissionId).set(submissionData);

    console.log('✅ Assessment submission saved:', {
      submissionId,
      studentId,
      assignmentId,
    });

    return {
      success: true,
      submissionId,
      message: 'Assessment submitted successfully',
    };

  } catch (error) {
    console.error('❌ Error submitting student assessment:', error);
    
    if (error instanceof HttpsError) {
      throw error;
    }
    
    throw new HttpsError('internal', 'Failed to submit assessment');
  }
});
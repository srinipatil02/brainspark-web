// functions/src/teacher-module/teacher-assessment-service.ts

import { CallableRequest, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore, FieldValue, Query } from 'firebase-admin/firestore';

const db = getFirestore();

// Types
interface CreateAssessmentRequest {
  title: string;
  instructionsMd: string;
  questionIds: string[];
  configuration: {
    estimatedDuration: number;
    difficulty: string;
    skillsTargeted: string[];
    totalQuestions: number;
  };
  defaultOptions: {
    allowHints: boolean;
    shuffleQuestions: boolean;
    defaultTimeLimit?: number;
    showResultsImmediately: boolean;
  };
}

interface AssignAssessmentRequest {
  assessmentId: string;
  studentIds: string[];
  dueAt: string; // ISO string
  options?: {
    allowHints?: boolean;
    shuffleQuestions?: boolean;
    timeLimit?: number;
    showResultsImmediately?: boolean;
    customInstructions?: string;
  };
}

interface QuestionSearchRequest {
  query?: string;
  skills?: string[];
  proficiency?: string[];
  difficulty?: number[];
  tags?: string[];
  curriculumCodes?: string[];
  limit?: number;
  startAfter?: string;
}

/**
 * Create new teacher assessment
 */
export const createTeacherAssessment = async (request: CallableRequest<CreateAssessmentRequest>) => {
  const { auth: authContext, data } = request;
  
  if (!authContext?.uid) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  // Verify user is a teacher
  if (authContext.token?.role !== 'teacher') {
    throw new HttpsError('permission-denied', 'Only teachers can create assessments');
  }

  try {
    console.log('Creating teacher assessment for:', authContext.uid);

    // Validate required fields
    if (!data.title || !data.questionIds.length) {
      throw new HttpsError('invalid-argument', 'Title and questions are required');
    }

    // Verify questions exist
    const questionChecks = await Promise.all(
      data.questionIds.map(async (questionId) => {
        const questionDoc = await db.collection('questions').doc(questionId).get();
        return { id: questionId, exists: questionDoc.exists };
      })
    );

    const missingQuestions = questionChecks.filter(check => !check.exists);
    if (missingQuestions.length > 0) {
      throw new HttpsError('invalid-argument', 
        `Questions not found: ${missingQuestions.map(q => q.id).join(', ')}`);
    }

    // Create assessment document
    const assessmentRef = db.collection('teacherAssessments').doc();
    const assessment = {
      teacherId: authContext.uid,
      title: data.title,
      instructionsMd: data.instructionsMd || '',
      questionIds: data.questionIds,
      configuration: {
        estimatedDuration: data.configuration.estimatedDuration || 15,
        difficulty: data.configuration.difficulty || 'adaptive',
        skillsTargeted: data.configuration.skillsTargeted || [],
        totalQuestions: data.questionIds.length,
      },
      defaultOptions: {
        allowHints: data.defaultOptions.allowHints ?? true,
        shuffleQuestions: data.defaultOptions.shuffleQuestions ?? false,
        defaultTimeLimit: data.defaultOptions.defaultTimeLimit,
        showResultsImmediately: data.defaultOptions.showResultsImmediately ?? true,
      },
      status: 'draft',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      version: 1,
    };

    await assessmentRef.set(assessment);

    console.log('Teacher assessment created:', assessmentRef.id);

    return {
      success: true,
      assessmentId: assessmentRef.id,
      message: 'Assessment created successfully',
    };

  } catch (error: any) {
    console.error('Error creating teacher assessment:', error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError('internal', 'Failed to create assessment');
  }
};

/**
 * Update existing teacher assessment
 */
export const updateTeacherAssessment = async (request: CallableRequest<{
  assessmentId: string;
  updates: Partial<CreateAssessmentRequest>;
}>) => {
  const { auth: authContext, data } = request;
  
  if (!authContext?.uid) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  // Verify user is a teacher
  if (authContext.token?.role !== 'teacher') {
    throw new HttpsError('permission-denied', 'Only teachers can update assessments');
  }

  try {
    console.log('Updating teacher assessment:', data.assessmentId);

    // Get existing assessment
    const assessmentDoc = await db.collection('teacherAssessments').doc(data.assessmentId).get();
    if (!assessmentDoc.exists) {
      throw new HttpsError('not-found', 'Assessment not found');
    }

    const assessment = assessmentDoc.data();
    if (assessment?.teacherId !== authContext.uid) {
      throw new HttpsError('permission-denied', 'You can only update your own assessments');
    }

    // Prevent updates to published assessments that have assignments
    if (assessment?.status === 'published') {
      const assignmentsQuery = await db
        .collection('assessmentAssignments')
        .where('assessmentId', '==', data.assessmentId)
        .limit(1)
        .get();

      if (!assignmentsQuery.empty) {
        throw new HttpsError('failed-precondition', 
          'Cannot modify published assessment with active assignments');
      }
    }

    // Prepare updates
    const updates: any = {
      ...data.updates,
      updatedAt: FieldValue.serverTimestamp(),
      version: FieldValue.increment(1),
    };

    // Validate questions if updated
    if (data.updates.questionIds) {
      const questionChecks = await Promise.all(
        data.updates.questionIds.map(async (questionId) => {
          const questionDoc = await db.collection('questions').doc(questionId).get();
          return { id: questionId, exists: questionDoc.exists };
        })
      );

      const missingQuestions = questionChecks.filter(check => !check.exists);
      if (missingQuestions.length > 0) {
        throw new HttpsError('invalid-argument', 
          `Questions not found: ${missingQuestions.map(q => q.id).join(', ')}`);
      }

      // Update total questions count
      if (updates.configuration) {
        updates.configuration.totalQuestions = data.updates.questionIds.length;
      }
    }

    await assessmentDoc.ref.update(updates);

    console.log('Teacher assessment updated successfully');

    return {
      success: true,
      message: 'Assessment updated successfully',
    };

  } catch (error: any) {
    console.error('Error updating teacher assessment:', error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError('internal', 'Failed to update assessment');
  }
};

/**
 * Get teacher assessments with pagination
 */
export const getTeacherAssessments = async (request: CallableRequest<{
  status?: string;
  limit?: number;
  startAfter?: string;
}>) => {
  const { auth: authContext, data } = request;
  
  if (!authContext?.uid) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  // Verify user is a teacher
  if (authContext.token?.role !== 'teacher') {
    throw new HttpsError('permission-denied', 'Only teachers can view assessments');
  }

  try {
    const limit = data.limit || 20;
    
    // Build query
    let query: Query = db
      .collection('teacherAssessments')
      .where('teacherId', '==', authContext.uid)
      .orderBy('updatedAt', 'desc')
      .limit(limit);

    // Add status filter
    if (data.status) {
      query = query.where('status', '==', data.status);
    }

    // Add pagination
    if (data.startAfter) {
      const startAfterDoc = await db.collection('teacherAssessments').doc(data.startAfter).get();
      if (startAfterDoc.exists) {
        query = query.startAfter(startAfterDoc);
      }
    }

    const assessmentsSnapshot = await query.get();
    const assessments = assessmentsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return {
      success: true,
      assessments,
      hasMore: assessmentsSnapshot.docs.length === limit,
      lastDocument: assessmentsSnapshot.docs[assessmentsSnapshot.docs.length - 1]?.id,
    };

  } catch (error: any) {
    console.error('Error getting teacher assessments:', error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError('internal', 'Failed to get assessments');
  }
};

/**
 * Search questions for assessment builder
 */
export const searchQuestionsForAssessment = async (request: CallableRequest<QuestionSearchRequest>) => {
  const { auth: authContext, data } = request;
  
  if (!authContext?.uid) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  // Verify user is a teacher
  if (authContext.token?.role !== 'teacher') {
    throw new HttpsError('permission-denied', 'Only teachers can search questions');
  }

  try {
    const limit = data.limit || 50;
    
    // Build base query
    let query: Query = db.collection('questions').limit(limit);

    // Add filters
    if (data.skills && data.skills.length > 0) {
      query = query.where('skills.primarySkill', 'in', data.skills);
    }

    if (data.proficiency && data.proficiency.length > 0) {
      query = query.where('competency.level', 'in', data.proficiency);
    }

    if (data.difficulty && data.difficulty.length > 0) {
      // Difficulty is typically a number, filter in application layer
    }

    // Add pagination
    if (data.startAfter) {
      const startAfterDoc = await db.collection('questions').doc(data.startAfter).get();
      if (startAfterDoc.exists) {
        query = query.startAfter(startAfterDoc);
      }
    }

    const questionsSnapshot = await query.get();
    let questions = questionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as any[];

    // Apply additional filters in memory (for fields that don't support array queries)
    if (data.difficulty && data.difficulty.length > 0) {
      questions = questions.filter(q => 
        data.difficulty!.includes(q.difficulty)
      );
    }

    if (data.tags && data.tags.length > 0) {
      questions = questions.filter(q => 
        q.tags?.some((tag: string) => data.tags!.includes(tag))
      );
    }

    if (data.curriculumCodes && data.curriculumCodes.length > 0) {
      questions = questions.filter(q => 
        q.curriculumCodes?.some((code: string) => data.curriculumCodes!.includes(code))
      );
    }

    // Text search (simple contains match)
    if (data.query) {
      const searchTerm = data.query.toLowerCase();
      questions = questions.filter(q => 
        q.stem?.toLowerCase().includes(searchTerm) ||
        q.skills?.primarySkill?.toLowerCase().includes(searchTerm)
      );
    }

    return {
      success: true,
      questions,
      hasMore: questionsSnapshot.docs.length === limit,
      totalResults: questions.length,
    };

  } catch (error: any) {
    console.error('Error searching questions:', error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError('internal', 'Failed to search questions');
  }
};

/**
 * Assign assessment to students
 */
export const assignAssessmentToStudents = async (request: CallableRequest<AssignAssessmentRequest>) => {
  const { auth: authContext, data } = request;
  
  if (!authContext?.uid) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  // Verify user is a teacher
  if (authContext.token?.role !== 'teacher') {
    throw new HttpsError('permission-denied', 'Only teachers can assign assessments');
  }

  try {
    console.log('Assigning assessment:', data.assessmentId, 'to', data.studentIds.length, 'students');

    // Verify assessment exists and belongs to teacher
    const assessmentDoc = await db.collection('teacherAssessments').doc(data.assessmentId).get();
    if (!assessmentDoc.exists) {
      throw new HttpsError('not-found', 'Assessment not found');
    }

    const assessment = assessmentDoc.data();
    if (assessment?.teacherId !== authContext.uid) {
      throw new HttpsError('permission-denied', 'You can only assign your own assessments');
    }

    // Verify students are assigned to this teacher
    const studentAssignments = await Promise.all(
      data.studentIds.map(async (studentId) => {
        const assignmentQuery = await db
          .collection('studentTeacherAssignments')
          .where('studentId', '==', studentId)
          .where('teacherId', '==', authContext.uid)
          .where('active', '==', true)
          .get();
        
        return { studentId, isAssigned: !assignmentQuery.empty };
      })
    );

    const unassignedStudents = studentAssignments.filter(s => !s.isAssigned);
    if (unassignedStudents.length > 0) {
      throw new HttpsError('permission-denied', 
        `Students not assigned to you: ${unassignedStudents.map(s => s.studentId).join(', ')}`);
    }

    // Parse due date
    const dueAt = new Date(data.dueAt);
    if (dueAt <= new Date()) {
      throw new HttpsError('invalid-argument', 'Due date must be in the future');
    }

    // Create assignments
    const batch = db.batch();
    const assignments: any[] = [];

    for (const studentId of data.studentIds) {
      const assignmentRef = db.collection('assessmentAssignments').doc();
      const assignment = {
        assessmentId: data.assessmentId,
        studentId,
        teacherId: authContext.uid,
        dueAt,
        assignedAt: FieldValue.serverTimestamp(),
        options: {
          allowHints: data.options?.allowHints ?? assessment.defaultOptions.allowHints,
          shuffleQuestions: data.options?.shuffleQuestions ?? assessment.defaultOptions.shuffleQuestions,
          timeLimit: data.options?.timeLimit ?? assessment.defaultOptions.defaultTimeLimit,
          showResultsImmediately: data.options?.showResultsImmediately ?? assessment.defaultOptions.showResultsImmediately,
          ...(data.options?.customInstructions && { customInstructions: data.options.customInstructions }),
        },
        status: 'assigned',
      };

      batch.set(assignmentRef, assignment);
      assignments.push({ id: assignmentRef.id, ...assignment });
    }

    // Update assessment status to published if it's a draft
    if (assessment.status === 'draft') {
      batch.update(assessmentDoc.ref, { 
        status: 'published',
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    await batch.commit();

    console.log(`Successfully created ${assignments.length} assessment assignments`);

    return {
      success: true,
      assignmentsCreated: assignments.length,
      message: `Assessment assigned to ${assignments.length} students`,
    };

  } catch (error: any) {
    console.error('Error assigning assessment:', error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError('internal', 'Failed to assign assessment');
  }
};

/**
 * Get assignment details with progress
 */
export const getAssignmentProgress = async (request: CallableRequest<{
  assessmentId?: string;
  studentId?: string;
  status?: string;
  limit?: number;
}>) => {
  const { auth: authContext, data } = request;
  
  if (!authContext?.uid) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  // Verify user is a teacher
  if (authContext.token?.role !== 'teacher') {
    throw new HttpsError('permission-denied', 'Only teachers can view assignment progress');
  }

  try {
    const limit = data.limit || 50;
    
    // Build query for assignments
    let query: Query = db
      .collection('assessmentAssignments')
      .where('teacherId', '==', authContext.uid)
      .orderBy('dueAt', 'asc')
      .limit(limit);

    // Add filters
    if (data.assessmentId) {
      query = query.where('assessmentId', '==', data.assessmentId);
    }
    
    if (data.studentId) {
      query = query.where('studentId', '==', data.studentId);
    }
    
    if (data.status) {
      query = query.where('status', '==', data.status);
    }

    const assignmentsSnapshot = await query.get();
    const assignments = assignmentsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as any[];

    // Get student profiles for assignments
    const studentIds = [...new Set(assignments.map(a => a.studentId))];
    const studentProfiles = await Promise.all(
      studentIds.map(async (studentId) => {
        const studentDoc = await db.collection('newUserProfiles').doc(studentId).get();
        return {
          id: studentId,
          profile: studentDoc.exists ? studentDoc.data() : null,
        };
      })
    );

    // Get assessment details
    const assessmentIds = [...new Set(assignments.map(a => a.assessmentId))];
    const assessments = await Promise.all(
      assessmentIds.map(async (assessmentId) => {
        const assessmentDoc = await db.collection('teacherAssessments').doc(assessmentId).get();
        return {
          id: assessmentId,
          assessment: assessmentDoc.exists ? assessmentDoc.data() : null,
        };
      })
    );

    // Combine data
    const enrichedAssignments = assignments.map(assignment => ({
      ...assignment,
      student: studentProfiles.find(p => p.id === assignment.studentId)?.profile,
      assessment: assessments.find(a => a.id === assignment.assessmentId)?.assessment,
    }));

    return {
      success: true,
      assignments: enrichedAssignments,
      totalCount: assignments.length,
    };

  } catch (error: any) {
    console.error('Error getting assignment progress:', error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError('internal', 'Failed to get assignment progress');
  }
};
// functions/src/teacher-module/teacher-profile-service.ts

import { CallableRequest, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore, FieldValue, Query } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

const db = getFirestore();
const auth = getAuth();

// Types
interface TeacherProfile {
  displayName: string;
  email: string;
  schoolOrganization?: string;
  subjects: string[];
  gradeLevels: string[];
  certifications?: string[];
  timezone: string;
  preferences: {
    defaultAssessmentOptions: {
      allowHints: boolean;
      shuffleQuestions: boolean;
      defaultTimeLimit?: number;
    };
    notifications: {
      helpFlags: boolean;
      assignmentDeadlines: boolean;
      studentProgress: boolean;
    };
  };
}

interface CreateTeacherProfileRequest {
  teacherProfile: TeacherProfile;
}

interface UpdateTeacherProfileRequest {
  teacherProfile: Partial<TeacherProfile>;
}

interface AssignStudentsRequest {
  studentIds: string[];
  subjects?: string[];
  gradeLevel?: string;
  classId?: string;
  notes?: string;
}

/**
 * Create or update teacher profile
 */
export const createTeacherProfile = async (request: CallableRequest<CreateTeacherProfileRequest>) => {
  const { auth: authContext, data } = request;
  
  if (!authContext?.uid) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  try {
    console.log('Creating teacher profile for user:', authContext.uid);

    // Validate required fields
    const { teacherProfile } = data;
    if (!teacherProfile.displayName || !teacherProfile.email || !teacherProfile.subjects.length) {
      throw new HttpsError('invalid-argument', 'Missing required teacher profile fields');
    }

    // Get current user profile
    const userDoc = await db.collection('newUserProfiles').doc(authContext.uid).get();
    if (!userDoc.exists) {
      throw new HttpsError('not-found', 'User profile not found');
    }

    const currentProfile = userDoc.data();

    // Update user role to teacher and add teacher profile
    const updatedProfile = {
      ...currentProfile,
      role: 'teacher',
      teacherProfile,
      lastUpdatedAt: FieldValue.serverTimestamp(),
    };

    // Update Firestore document
    await db.collection('newUserProfiles').doc(authContext.uid).update(updatedProfile);

    // Update Firebase Auth custom claims
    await auth.setCustomUserClaims(authContext.uid, { 
      role: 'teacher',
      teacherSubjects: teacherProfile.subjects,
    });

    console.log('Teacher profile created successfully for:', authContext.uid);

    return {
      success: true,
      teacherId: authContext.uid,
      message: 'Teacher profile created successfully',
    };

  } catch (error: any) {
    console.error('Error creating teacher profile:', error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError('internal', 'Failed to create teacher profile');
  }
};

/**
 * Update existing teacher profile
 */
export const updateTeacherProfile = async (request: CallableRequest<UpdateTeacherProfileRequest>) => {
  const { auth: authContext, data } = request;
  
  if (!authContext?.uid) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  // Verify user is a teacher
  if (authContext.token?.role !== 'teacher') {
    throw new HttpsError('permission-denied', 'Only teachers can update teacher profiles');
  }

  try {
    console.log('Updating teacher profile for user:', authContext.uid);

    const userDoc = await db.collection('newUserProfiles').doc(authContext.uid).get();
    if (!userDoc.exists) {
      throw new HttpsError('not-found', 'Teacher profile not found');
    }

    const currentProfile = userDoc.data();
    const currentTeacherProfile = currentProfile?.teacherProfile || {};

    // Merge updates with existing teacher profile
    const updatedTeacherProfile = {
      ...currentTeacherProfile,
      ...data.teacherProfile,
    };

    // Update document
    await db.collection('newUserProfiles').doc(authContext.uid).update({
      teacherProfile: updatedTeacherProfile,
      lastUpdatedAt: FieldValue.serverTimestamp(),
    });

    // Update Auth claims if subjects changed
    if (data.teacherProfile.subjects) {
      await auth.setCustomUserClaims(authContext.uid, { 
        role: 'teacher',
        teacherSubjects: data.teacherProfile.subjects,
      });
    }

    console.log('Teacher profile updated successfully');

    return {
      success: true,
      message: 'Teacher profile updated successfully',
    };

  } catch (error: any) {
    console.error('Error updating teacher profile:', error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError('internal', 'Failed to update teacher profile');
  }
};

/**
 * Get teacher profile
 */
export const getTeacherProfile = async (request: CallableRequest<{}>) => {
  const { auth: authContext } = request;
  
  if (!authContext?.uid) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  // Verify user is a teacher via token claims (consistent with other functions)
  if (authContext.token?.role !== 'teacher') {
    throw new HttpsError('permission-denied', 'Only teachers can access teacher profiles');
  }

  try {
    const userDoc = await db.collection('newUserProfiles').doc(authContext.uid).get();
    if (!userDoc.exists) {
      throw new HttpsError('not-found', 'User profile not found');
    }

    const profile = userDoc.data();
    if (profile?.role !== 'teacher') {
      throw new HttpsError('permission-denied', 'User is not a teacher');
    }

    return {
      success: true,
      teacherProfile: profile.teacherProfile,
      userId: authContext.uid,
    };

  } catch (error: any) {
    console.error('Error getting teacher profile:', error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError('internal', 'Failed to get teacher profile');
  }
};

/**
 * Assign students to teacher
 */
export const assignStudentsToTeacher = async (request: CallableRequest<AssignStudentsRequest>) => {
  const { auth: authContext, data } = request;
  
  if (!authContext?.uid) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  // Verify user is a teacher
  if (authContext.token?.role !== 'teacher') {
    throw new HttpsError('permission-denied', 'Only teachers can assign students');
  }

  try {
    console.log(`Assigning ${data.studentIds.length} students to teacher:`, authContext.uid);

    // Validate student IDs exist and are students
    const studentChecks = await Promise.all(
      data.studentIds.map(async (studentId) => {
        const studentDoc = await db.collection('newUserProfiles').doc(studentId).get();
        if (!studentDoc.exists || studentDoc.data()?.role !== 'student') {
          return { id: studentId, valid: false };
        }
        return { id: studentId, valid: true };
      })
    );

    const invalidStudents = studentChecks.filter(check => !check.valid);
    if (invalidStudents.length > 0) {
      throw new HttpsError('invalid-argument', 
        `Invalid student IDs: ${invalidStudents.map(s => s.id).join(', ')}`);
    }

    // Create batch for assignments
    const batch = db.batch();
    const assignments: any[] = [];

    for (const studentId of data.studentIds) {
      // Check if assignment already exists
      const existingAssignment = await db
        .collection('studentTeacherAssignments')
        .where('studentId', '==', studentId)
        .where('teacherId', '==', authContext.uid)
        .where('active', '==', true)
        .get();

      if (existingAssignment.empty) {
        const assignmentRef = db.collection('studentTeacherAssignments').doc();
        const assignment = {
          studentId,
          teacherId: authContext.uid,
          assignedBy: authContext.uid,
          assignedAt: FieldValue.serverTimestamp(),
          active: true,
          metadata: {
            subjects: data.subjects || [],
            ...(data.gradeLevel && { gradeLevel: data.gradeLevel }),
            ...(data.classId && { classId: data.classId }),
            ...(data.notes && { notes: data.notes }),
          },
        };

        batch.set(assignmentRef, assignment);
        assignments.push({ id: assignmentRef.id, ...assignment });
      }
    }

    // Commit batch
    await batch.commit();

    console.log(`Successfully assigned ${assignments.length} new students to teacher`);

    return {
      success: true,
      assignmentsCreated: assignments.length,
      message: `Assigned ${assignments.length} students successfully`,
    };

  } catch (error: any) {
    console.error('Error assigning students to teacher:', error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError('internal', 'Failed to assign students to teacher');
  }
};

/**
 * Get students assigned to teacher with pagination
 */
export const getAssignedStudents = async (request: CallableRequest<{
  limit?: number;
  startAfter?: string;
  subjects?: string[];
}>) => {
  const { auth: authContext, data } = request;
  
  if (!authContext?.uid) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  // Verify user is a teacher
  if (authContext.token?.role !== 'teacher') {
    throw new HttpsError('permission-denied', 'Only teachers can view assigned students');
  }

  try {
    const limit = data.limit || 20;
    
    // Build query
    let query: Query = db
      .collection('studentTeacherAssignments')
      .where('teacherId', '==', authContext.uid)
      .where('active', '==', true)
      .orderBy('assignedAt', 'desc')
      .limit(limit);

    // Add pagination
    if (data.startAfter) {
      const startAfterDoc = await db
        .collection('studentTeacherAssignments')
        .doc(data.startAfter)
        .get();
      if (startAfterDoc.exists) {
        query = query.startAfter(startAfterDoc);
      }
    }

    const assignmentsSnapshot = await query.get();
    const assignments = assignmentsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as any[];

    // Get student profiles
    const studentIds = assignments.map(a => a.studentId);
    const studentProfiles = await Promise.all(
      studentIds.map(async (studentId) => {
        const studentDoc = await db.collection('newUserProfiles').doc(studentId).get();
        return {
          id: studentId,
          profile: studentDoc.exists ? studentDoc.data() : null,
        };
      })
    );

    // Combine assignment and profile data
    const studentsWithAssignments = assignments.map(assignment => {
      const studentProfile = studentProfiles.find(p => p.id === assignment.studentId);
      return {
        assignment,
        student: studentProfile?.profile,
      };
    });

    // Apply subject filter if provided
    let filteredStudents = studentsWithAssignments;
    if (data.subjects && data.subjects.length > 0) {
      filteredStudents = studentsWithAssignments.filter(item => 
        data.subjects!.some(subject => 
          item.assignment.metadata?.subjects?.includes(subject)
        )
      );
    }

    return {
      success: true,
      students: filteredStudents,
      hasMore: assignmentsSnapshot.docs.length === limit,
      lastDocument: assignmentsSnapshot.docs[assignmentsSnapshot.docs.length - 1]?.id,
    };

  } catch (error: any) {
    console.error('Error getting assigned students:', error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError('internal', 'Failed to get assigned students');
  }
};

/**
 * Remove student assignment from teacher
 */
export const removeStudentAssignment = async (request: CallableRequest<{
  studentId: string;
}>) => {
  const { auth: authContext, data } = request;
  
  if (!authContext?.uid) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  // Verify user is a teacher
  if (authContext.token?.role !== 'teacher') {
    throw new HttpsError('permission-denied', 'Only teachers can remove student assignments');
  }

  try {
    console.log('Removing student assignment:', data.studentId, 'from teacher:', authContext.uid);

    // Find and deactivate assignment
    const assignmentQuery = await db
      .collection('studentTeacherAssignments')
      .where('studentId', '==', data.studentId)
      .where('teacherId', '==', authContext.uid)
      .where('active', '==', true)
      .get();

    if (assignmentQuery.empty) {
      throw new HttpsError('not-found', 'Student assignment not found');
    }

    const batch = db.batch();
    assignmentQuery.docs.forEach(doc => {
      batch.update(doc.ref, { active: false });
    });

    await batch.commit();

    console.log('Student assignment removed successfully');

    return {
      success: true,
      message: 'Student assignment removed successfully',
    };

  } catch (error: any) {
    console.error('Error removing student assignment:', error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError('internal', 'Failed to remove student assignment');
  }
};
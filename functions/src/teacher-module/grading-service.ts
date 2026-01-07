import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore } from 'firebase-admin/firestore';

const db = getFirestore();

/**
 * Grade a student's assessment submission
 */
export const gradeAssessmentSubmission = onCall({
  invoker: 'public'
}, async (request) => {
  try {
    // Authentication required
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Authentication required');
    }

    const { teacherId, submissionId, scores, feedback, overallFeedback } = request.data;
    
    // Verify the authenticated user is the teacher
    if (request.auth.uid !== teacherId) {
      throw new HttpsError('permission-denied', 'Access denied');
    }

    console.log('📝 Grading assessment submission:', {
      teacherId,
      submissionId,
      questionCount: Object.keys(scores || {}).length,
    });

    // Get the submission
    const submissionDoc = await db.collection('assessmentSubmissions').doc(submissionId).get();

    if (!submissionDoc.exists) {
      throw new HttpsError('not-found', 'Submission not found');
    }

    const submissionData = submissionDoc.data()!;

    // Verify this submission belongs to this teacher
    if (submissionData.teacherId !== teacherId) {
      throw new HttpsError('permission-denied', 'Submission not owned by teacher');
    }

    // Calculate overall score
    const totalScore = Object.values(scores || {}).reduce((sum: number, score: any) => sum + (score || 0), 0);
    const maxScore = Object.keys(scores || {}).length * 100; // Assuming 100 points per question
    const percentageScore = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;

    // Create grading record
    const gradingData = {
      submissionId,
      teacherId,
      studentId: submissionData.studentId,
      assignmentId: submissionData.assignmentId,
      scores: scores || {},
      feedback: feedback || {},
      overallFeedback: overallFeedback || '',
      totalScore,
      percentageScore: Math.round(percentageScore * 100) / 100,
      maxScore,
      gradedAt: new Date(),
      gradedBy: teacherId,
      status: 'graded',
    };

    // Save grading record
    const gradingRef = await db.collection('assessmentGradings').add(gradingData);

    // Update submission with grading information
    await db.collection('assessmentSubmissions').doc(submissionId).update({
      score: percentageScore,
      feedback: overallFeedback,
      gradedAt: new Date(),
      gradedBy: teacherId,
      gradingId: gradingRef.id,
      status: 'graded',
    });

    // Create notification for student
    await _createGradingNotification(submissionData.studentId, submissionData.assignmentId, percentageScore, overallFeedback);

    // Update student's learning analytics
    await _updateStudentAnalytics(submissionData.studentId, submissionData.assignmentId, percentageScore, scores);

    console.log('✅ Assessment graded successfully:', {
      submissionId,
      gradingId: gradingRef.id,
      percentageScore,
    });

    return {
      success: true,
      gradingId: gradingRef.id,
      percentageScore,
      message: 'Assessment graded successfully',
    };

  } catch (error) {
    console.error('❌ Error grading assessment submission:', error);
    
    if (error instanceof HttpsError) {
      throw error;
    }
    
    throw new HttpsError('internal', 'Failed to grade assessment submission');
  }
});

/**
 * Get grading details for a submission
 */
export const getSubmissionGrading = onCall({
  invoker: 'public'
}, async (request) => {
  try {
    // Authentication required
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Authentication required');
    }

    const { submissionId, requesterId } = request.data;

    console.log('📋 Getting submission grading:', { submissionId, requesterId });

    // Get the submission first
    const submissionDoc = await db.collection('assessmentSubmissions').doc(submissionId).get();

    if (!submissionDoc.exists) {
      throw new HttpsError('not-found', 'Submission not found');
    }

    const submissionData = submissionDoc.data()!;

    // Verify access (teacher who owns it or student who submitted it)
    if (request.auth.uid !== submissionData.teacherId && request.auth.uid !== submissionData.studentId) {
      throw new HttpsError('permission-denied', 'Access denied');
    }

    // Get grading information
    let gradingData = null;
    if (submissionData.gradingId) {
      const gradingDoc = await db.collection('assessmentGradings').doc(submissionData.gradingId).get();
      if (gradingDoc.exists) {
        gradingData = { id: gradingDoc.id, ...gradingDoc.data() };
      }
    }

    // Get assignment information
    const assignmentDoc = await db.collection('teacherAssessments').doc(submissionData.assignmentId).get();
    const assignmentData = assignmentDoc.exists ? assignmentDoc.data() : null;

    // Get question details for context
    const questions = [];
    if (assignmentData?.questionIds) {
      const questionDocs = await Promise.all(
        assignmentData.questionIds.map((id: string) => db.collection('questions').doc(id).get())
      );
      
      for (const questionDoc of questionDocs) {
        if (questionDoc.exists) {
          questions.push({
            id: questionDoc.id,
            ...questionDoc.data(),
          });
        }
      }
    }

    console.log('✅ Submission grading retrieved:', {
      submissionId,
      hasGrading: !!gradingData,
      isGraded: submissionData.status === 'graded',
    });

    return {
      success: true,
      submission: {
        id: submissionId,
        ...submissionData,
        submittedAt: submissionData.submittedAt?.toDate?.()?.toISOString() || submissionData.submittedAt,
        gradedAt: submissionData.gradedAt?.toDate?.()?.toISOString() || submissionData.gradedAt,
      },
      grading: gradingData ? {
        ...gradingData,
        gradedAt: (gradingData as any).gradedAt?.toDate?.()?.toISOString() || (gradingData as any).gradedAt,
      } : null,
      assignment: assignmentData,
      questions,
    };

  } catch (error) {
    console.error('❌ Error getting submission grading:', error);
    
    if (error instanceof HttpsError) {
      throw error;
    }
    
    throw new HttpsError('internal', 'Failed to get submission grading');
  }
});

/**
 * Get all submissions for grading by a teacher
 */
export const getSubmissionsForGrading = onCall({
  invoker: 'public'
}, async (request) => {
  try {
    // Authentication required
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Authentication required');
    }

    const { teacherId, status, limit } = request.data;
    
    // Verify the authenticated user is the teacher
    if (request.auth.uid !== teacherId) {
      throw new HttpsError('permission-denied', 'Access denied');
    }

    console.log('📚 Getting submissions for grading:', { teacherId, status, limit });

    // Build query
    let query = db
      .collection('assessmentSubmissions')
      .where('teacherId', '==', teacherId);

    if (status) {
      query = query.where('status', '==', status);
    }

    query = query
      .orderBy('submittedAt', 'desc')
      .limit(limit || 20);

    const submissionsQuery = await query.get();

    const submissions = [];
    for (const doc of submissionsQuery.docs) {
      const data = doc.data();
      
      // Get student name
      let studentName = 'Unknown Student';
      try {
        const studentDoc = await db.collection('users').doc(data.studentId).get();
        if (studentDoc.exists) {
          studentName = studentDoc.data()?.displayName || studentName;
        }
      } catch (error) {
        console.warn('Could not fetch student name:', error);
      }

      // Get assignment title
      let assignmentTitle = 'Unknown Assignment';
      try {
        const assignmentDoc = await db.collection('teacherAssessments').doc(data.assignmentId).get();
        if (assignmentDoc.exists) {
          assignmentTitle = assignmentDoc.data()?.title || assignmentTitle;
        }
      } catch (error) {
        console.warn('Could not fetch assignment title:', error);
      }

      submissions.push({
        id: doc.id,
        studentId: data.studentId,
        studentName,
        assignmentId: data.assignmentId,
        assignmentTitle,
        submittedAt: data.submittedAt?.toDate?.()?.toISOString() || data.submittedAt,
        status: data.status,
        score: data.score,
        answerCount: Object.keys(data.answers || {}).length,
        timeSpentMinutes: data.timeSpentMinutes || 0,
        gradedAt: data.gradedAt?.toDate?.()?.toISOString() || data.gradedAt,
      });
    }

    console.log('✅ Submissions for grading retrieved:', {
      teacherId,
      count: submissions.length,
    });

    return {
      success: true,
      submissions,
      totalCount: submissions.length,
    };

  } catch (error) {
    console.error('❌ Error getting submissions for grading:', error);
    
    if (error instanceof HttpsError) {
      throw error;
    }
    
    throw new HttpsError('internal', 'Failed to get submissions for grading');
  }
});

/**
 * Bulk grade multiple submissions
 */
export const bulkGradeSubmissions = onCall({
  invoker: 'public'
}, async (request) => {
  try {
    // Authentication required
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Authentication required');
    }

    const { teacherId, gradings } = request.data;
    
    // Verify the authenticated user is the teacher
    if (request.auth.uid !== teacherId) {
      throw new HttpsError('permission-denied', 'Access denied');
    }

    if (!gradings || !Array.isArray(gradings) || gradings.length === 0) {
      throw new HttpsError('invalid-argument', 'Gradings array is required');
    }

    console.log('📝 Bulk grading submissions:', {
      teacherId,
      submissionCount: gradings.length,
    });

    const results = [];
    const batch = db.batch();

    for (const grading of gradings) {
      const { submissionId, scores, feedback, overallFeedback } = grading;

      try {
        // Get the submission
        const submissionDoc = await db.collection('assessmentSubmissions').doc(submissionId).get();

        if (!submissionDoc.exists) {
          results.push({ submissionId, success: false, error: 'Submission not found' });
          continue;
        }

        const submissionData = submissionDoc.data()!;

        // Verify this submission belongs to this teacher
        if (submissionData.teacherId !== teacherId) {
          results.push({ submissionId, success: false, error: 'Access denied' });
          continue;
        }

        // Calculate overall score
        const totalScore = Object.values(scores || {}).reduce((sum: number, score: any) => sum + (score || 0), 0);
        const maxScore = Object.keys(scores || {}).length * 100;
        const percentageScore = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;

        // Create grading record
        const gradingRef = db.collection('assessmentGradings').doc();
        const gradingData = {
          submissionId,
          teacherId,
          studentId: submissionData.studentId,
          assignmentId: submissionData.assignmentId,
          scores: scores || {},
          feedback: feedback || {},
          overallFeedback: overallFeedback || '',
          totalScore,
          percentageScore: Math.round(percentageScore * 100) / 100,
          maxScore,
          gradedAt: new Date(),
          gradedBy: teacherId,
          status: 'graded',
        };

        batch.set(gradingRef, gradingData);

        // Update submission
        const submissionRef = db.collection('assessmentSubmissions').doc(submissionId);
        batch.update(submissionRef, {
          score: percentageScore,
          feedback: overallFeedback,
          gradedAt: new Date(),
          gradedBy: teacherId,
          gradingId: gradingRef.id,
          status: 'graded',
        });

        results.push({
          submissionId,
          success: true,
          gradingId: gradingRef.id,
          percentageScore,
        });

        // Create notifications (done outside batch for performance)
        _createGradingNotification(submissionData.studentId, submissionData.assignmentId, percentageScore, overallFeedback);
        _updateStudentAnalytics(submissionData.studentId, submissionData.assignmentId, percentageScore, scores);

      } catch (error) {
        console.error(`Error processing submission ${submissionId}:`, error);
        results.push({
          submissionId,
          success: false,
          error: (error as Error).message || 'Processing error',
        });
      }
    }

    // Commit all changes
    await batch.commit();

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;

    console.log('✅ Bulk grading completed:', {
      totalSubmissions: results.length,
      successful: successCount,
      failed: failureCount,
    });

    return {
      success: true,
      results,
      summary: {
        total: results.length,
        successful: successCount,
        failed: failureCount,
      },
    };

  } catch (error) {
    console.error('❌ Error bulk grading submissions:', error);
    
    if (error instanceof HttpsError) {
      throw error;
    }
    
    throw new HttpsError('internal', 'Failed to bulk grade submissions');
  }
});

// Helper functions
async function _createGradingNotification(studentId: string, assignmentId: string, score: number, feedback: string) {
  try {
    // Get assignment title
    const assignmentDoc = await db.collection('teacherAssessments').doc(assignmentId).get();
    const assignmentTitle = assignmentDoc.exists ? assignmentDoc.data()?.title : 'Your assignment';

    // Create notification
    await db.collection('studentNotifications').add({
      studentId,
      type: 'assessment_graded',
      title: '📊 Assignment Graded',
      body: `${assignmentTitle} has been graded. Score: ${score.toFixed(1)}%`,
      data: {
        type: 'assessment_graded',
        assignmentId,
        score,
        feedback: feedback || '',
        timestamp: new Date().toISOString(),
      },
      read: false,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    });

    console.log('📧 Grading notification created for student:', studentId);
  } catch (error) {
    console.error('Error creating grading notification:', error);
  }
}

async function _updateStudentAnalytics(studentId: string, assignmentId: string, score: number, questionScores: any) {
  try {
    // Get assignment details
    const assignmentDoc = await db.collection('teacherAssessments').doc(assignmentId).get();
    if (!assignmentDoc.exists) return;

    const assignmentData = assignmentDoc.data()!;

    // Create learning event for analytics
    await db.collection('newLearningEvents').add({
      userId: studentId,
      eventType: 'assessment_completed',
      subject: assignmentData.subject || 'general',
      yearLevel: assignmentData.yearLevel || 1,
      timestamp: new Date(),
      eventData: {
        assignmentId,
        assessmentType: assignmentData.assessmentType,
        score,
        maxScore: 100,
        questionCount: Object.keys(questionScores || {}).length,
        timeSpent: 0, // Would come from submission if tracked
        completed: true,
        performance: score >= 80 ? 'excellent' : score >= 60 ? 'good' : 'needs_improvement',
      },
      sessionContext: {
        sessionType: 'assessment',
        source: 'teacher_assignment',
        metadata: {
          teacherId: assignmentData.teacherId,
          isGraded: true,
        },
      },
    });

    console.log('📈 Student analytics updated for graded assessment');
  } catch (error) {
    console.error('Error updating student analytics:', error);
  }
}
// functions/src/teacher-module/index.ts

import { onCall } from 'firebase-functions/v2/https';

// Import service functions
import {
  createTeacherProfile,
  updateTeacherProfile,
  getTeacherProfile,
  assignStudentsToTeacher,
  getAssignedStudents,
  removeStudentAssignment,
} from './teacher-profile-service';

import {
  createTeacherAssessment,
  updateTeacherAssessment,
  getTeacherAssessments,
  searchQuestionsForAssessment,
  assignAssessmentToStudents,
  getAssignmentProgress,
} from './teacher-assessment-service';

import {
  createHelpFlag,
  getTeacherHelpFlags,
  getHelpFlagWithContext,
  resolveHelpFlag,
  getHelpFlagStatistics,
  getStudentHelpFlags,
} from './help-flag-service';

import {
  getStudentActiveAssignments,
  getStudentAssignmentById,
  submitStudentAssessment,
} from './student-assignment-service';

import {
  getTeacherAnalytics,
  getStudentProgressReport,
  getAssessmentAnalytics,
} from './teacher-analytics-service';

import {
  gradeAssessmentSubmission,
  getSubmissionGrading,
  getSubmissionsForGrading,
  bulkGradeSubmissions,
} from './grading-service';

import {
  getChildAssignments,
  getChildProgressReport,
  getParentNotifications,
} from './parent-visibility-service';

// Teacher Profile Management
export const teacherCreateProfile = onCall({ cors: true, invoker: 'public' }, createTeacherProfile);
export const teacherUpdateProfile = onCall({ cors: true, invoker: 'public' }, updateTeacherProfile);
export const teacherGetProfile = onCall({ cors: true, invoker: 'public' }, getTeacherProfile);

// Student Assignment Management  
export const teacherAssignStudents = onCall({ cors: true, invoker: 'public' }, assignStudentsToTeacher);
export const teacherGetAssignedStudents = onCall({ cors: true, invoker: 'public' }, getAssignedStudents);
export const teacherRemoveStudentAssignment = onCall({ cors: true, invoker: 'public' }, removeStudentAssignment);

// Assessment Management
export const teacherCreateAssessment = onCall({ cors: true, invoker: 'public' }, createTeacherAssessment);
export const teacherUpdateAssessment = onCall({ cors: true, invoker: 'public' }, updateTeacherAssessment);
export const teacherGetAssessments = onCall({ cors: true, invoker: 'public' }, getTeacherAssessments);
export const teacherSearchQuestions = onCall({ cors: true, invoker: 'public' }, searchQuestionsForAssessment);
export const teacherAssignAssessment = onCall({ cors: true, invoker: 'public' }, assignAssessmentToStudents);
export const teacherGetAssignmentProgress = onCall({ cors: true, invoker: 'public' }, getAssignmentProgress);

// Help Flag Management
export const studentCreateHelpFlag = onCall({ cors: true, invoker: 'public' }, createHelpFlag);
export const teacherGetHelpFlags = onCall({ cors: true, invoker: 'public' }, getTeacherHelpFlags);
export const teacherGetHelpFlagContext = onCall({ cors: true, invoker: 'public' }, getHelpFlagWithContext);
export const teacherResolveHelpFlag = onCall({ cors: true, invoker: 'public' }, resolveHelpFlag);
export const teacherGetHelpFlagStats = onCall({ cors: true, invoker: 'public' }, getHelpFlagStatistics);
export const studentGetHelpFlags = onCall({ cors: true, invoker: 'public' }, getStudentHelpFlags);

// Student Assignment Access
export { getStudentActiveAssignments, getStudentAssignmentById, submitStudentAssessment };

// Teacher Analytics
export { getTeacherAnalytics, getStudentProgressReport, getAssessmentAnalytics };

// Grading System
export { gradeAssessmentSubmission, getSubmissionGrading, getSubmissionsForGrading, bulkGradeSubmissions };

// Parent Visibility
export { getChildAssignments, getChildProgressReport, getParentNotifications };

// Notification Triggers (exported separately)
export { onHelpFlagCreated, onHelpFlagResolved, onAssignmentDueSoon } from './notification-service';
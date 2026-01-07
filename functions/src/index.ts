// functions/src/index.ts
import * as admin from "firebase-admin";
admin.initializeApp();

// Legacy functions
export {createParentProfile, createStudentProfile, generateChildInvite, linkChildWithCode} from "./signup";
export {onAnswerWrite} from "./analytics";
export {grade, gradeHealth} from "./llm-grading/endpoint";
export {conceptChat, conceptChatHealth, clearConceptChatSession} from "./concept-chat/endpoint";

// New architecture functions
export {
  initializeNewUserProfile,
  updateUserActivity,
  generatePersonalizedRecommendations
} from "./new-architecture/user-initialization";

export {
  processNewLearningEvent,
  generateWeeklyReports
} from "./new-architecture/analytics-processing";

// Quest Management - REMOVED (4 functions)
// generateDailyQuests, cleanupExpiredQuests, adaptQuestDifficulty, questRecommendationsApi

// AI Services (Enhanced Question Generation)
export {
  generateEnhancedQuestion,
  aiServicesHealth,
  testAIProviders
} from "./ai-services";

// AI Learning Insights
export {
  generateAILearningInsights,
  aiInsightsHealth
} from "./ai-insights/endpoint";

// AI Cost Monitoring
export {
  trackAICost,
  getUserAICostStatus,
  getAICostDashboard,
  dailyAICostReport
} from "./ai-cost-monitoring";

// Writing Grading
export {
  gradeWriting,
  writingGradingHealth
} from "./writing-grading/endpoint";

// Teacher Module - REMOVED (35 functions)
// These functions were removed to reduce deployment size and maintenance burden.
// If needed, they can be restored from git history.

// export {
//   onConceptCardUpdate,
//   generateContentRecommendations,
//   cleanupExpiredRecommendations
// } from "./new-architecture/content-management";

// export {
//   updateSkillTreeOnQuestCompletion,
//   generateDailyMission,
//   updateConfidenceOnCardInteraction,
//   logDetailedLearningEvent,
//   generateDailyReports,
//   generateWeeklyAnalytics,
//   updateParentDashboardDaily
// } from "./new-architecture/learning-triggers";

// export {
//   generateComprehensiveReport,
//   generateParentInsights,
//   generateLearningInsights
// } from "./new-architecture/reporting-functions";

// export {
//   enhancedLLMGrading,
//   generateLearningHints,
//   assessLearningProgress
// } from "./new-architecture/enhanced-llm-grading";

// =============================================================================
// NSW SELECTIVE STUDY PLAN PAGE
// =============================================================================
// FILE: src/app/nsw-selective/study-plan/page.tsx
// DOMAIN: NSW Selective Exam Prep
// PURPOSE: Server component wrapper for AI-powered study plan dashboard

import { StudyPlanDashboard } from '@/components/nsw-selective/StudyPlanDashboard';

export const metadata = {
  title: 'Study Plan | NSW Selective Exam Prep',
  description: 'Your personalized AI-generated study plan',
};

export default function StudyPlanPage() {
  return <StudyPlanDashboard />;
}

// =============================================================================
// NSW SELECTIVE INSIGHTS PAGE
// =============================================================================
// FILE: src/app/nsw-selective/insights/page.tsx
// DOMAIN: NSW Selective Exam Prep
// PURPOSE: Server component wrapper for insights dashboard
// DO NOT: Import curriculum components or use learningArc fields

import { InsightsClient } from '@/components/nsw-selective/InsightsClient';

export const metadata = {
  title: 'Insights | NSW Selective Exam Prep',
  description: 'View your performance analytics and exam readiness',
};

export default function InsightsPage() {
  return <InsightsClient />;
}

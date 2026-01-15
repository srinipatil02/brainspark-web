// =============================================================================
// ARCHETYPE PRACTICE PAGE (Server Component)
// =============================================================================
// FILE: src/app/nsw-selective/practice/[archetypeId]/page.tsx
// DOMAIN: NSW Selective Exam Prep
// PURPOSE: Server-side wrapper with generateStaticParams for static export
// DO NOT: Import curriculum components or use learningArc fields

import { ArchetypePracticeClient } from '@/components/nsw-selective/ArchetypePracticeClient';

// Generate static params for all 23 archetypes (required for static export)
export function generateStaticParams() {
  return [
    { archetypeId: 'qa1' },
    { archetypeId: 'qa2' },
    { archetypeId: 'qa3' },
    { archetypeId: 'qa4' },
    { archetypeId: 'qa5' },
    { archetypeId: 'qa6' },
    { archetypeId: 'qa7' },
    { archetypeId: 'qa8' },
    { archetypeId: 'qa9' },
    { archetypeId: 'qa10' },
    { archetypeId: 'qa11' },
    { archetypeId: 'qa12' },
    { archetypeId: 'qa13' },
    { archetypeId: 'qa14' },
    { archetypeId: 'qa15' },
    { archetypeId: 'qa16' },
    { archetypeId: 'qa17' },
    { archetypeId: 'qa18' },
    { archetypeId: 'qa19' },
    { archetypeId: 'qa20' },
    { archetypeId: 'qa21' },
    { archetypeId: 'qa22' },
    { archetypeId: 'qa23' },
  ];
}

interface PageProps {
  params: Promise<{ archetypeId: string }>;
}

export default async function ArchetypePracticePage({ params }: PageProps) {
  const { archetypeId } = await params;
  return <ArchetypePracticeClient archetypeId={archetypeId} />;
}

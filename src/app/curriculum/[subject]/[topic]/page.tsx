import { TopicPracticeClient } from '@/components/TopicPracticeClient';

// Generate static params for supported subject/topic combinations
export function generateStaticParams() {
  return [
    { subject: 'science', topic: 'physics' },
    { subject: 'science', topic: 'chemistry' },
  ];
}

export default async function TopicPracticePage({
  params,
}: {
  params: Promise<{ subject: string; topic: string }>;
}) {
  const { subject, topic } = await params;

  return <TopicPracticeClient subject={subject} topic={topic} />;
}

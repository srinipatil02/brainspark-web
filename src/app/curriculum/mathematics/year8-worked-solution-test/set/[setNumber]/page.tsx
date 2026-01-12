import { SetPlayerClient } from '@/components/SetPlayerClient';

export function generateStaticParams() {
  return [{ setNumber: '1' }];
}

export default async function WorkedSolutionTestSetPage({
  params,
}: {
  params: Promise<{ setNumber: string }>;
}) {
  const { setNumber } = await params;
  const setNum = parseInt(setNumber, 10);

  const setMeta = {
    id: `year8-math-worked-solution-test-set${setNum}`,
    title: 'Show Your Work Test',
    subtitle: 'Student-centered math problem solving',
    icon: '✏️',
    color: 'blue',
    firestoreSetId: 'year8-math-worked-solution-test',
    topics: ['Linear Equations', 'Perimeter', 'Area', 'Simplifying', 'Word Problems'],
    backLink: '/curriculum/mathematics/year8-worked-solution-test',
    backText: 'Back to Test Page',
    misconceptions: [
      'Forgetting to apply operations to both sides',
      'Incorrect order of operations',
      'Confusing perimeter and area formulas',
    ],
  };

  return <SetPlayerClient setNumber={setNum} setMeta={setMeta} />;
}

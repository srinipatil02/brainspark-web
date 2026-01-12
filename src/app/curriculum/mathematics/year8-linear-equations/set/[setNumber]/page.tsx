import { SetPlayerClient } from '@/components/SetPlayerClient';

// Generate static params for set numbers
export function generateStaticParams() {
  return Array.from({ length: 12 }, (_, i) => ({ setNumber: String(i + 1) }));
}

// Set metadata for all 12 sets
const setMetadata: Record<number, {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  firestoreSetId: string;
  topics: string[];
}> = {
  1: {
    id: 'year8-linear-equations-set1',
    title: 'One-Step Equations (+/-)',
    subtitle: 'Addition and subtraction equations',
    icon: '➕',
    color: 'indigo',
    firestoreSetId: 'year8-linear-equations-set1',
    topics: ['x + a = b', 'x - a = b', 'Inverse operations'],
  },
  2: {
    id: 'year8-linear-equations-set2',
    title: 'One-Step Equations (×/÷)',
    subtitle: 'Multiplication and division equations',
    icon: '✖️',
    color: 'indigo',
    firestoreSetId: 'year8-linear-equations-set2',
    topics: ['ax = b', 'x/a = b', 'Inverse operations'],
  },
  3: {
    id: 'year8-linear-equations-set3',
    title: 'Mixed One-Step',
    subtitle: 'All four operations combined',
    icon: '🔄',
    color: 'indigo',
    firestoreSetId: 'year8-linear-equations-set3',
    topics: ['Mixed operations', 'Different variables', 'Intro two-step'],
  },
  4: {
    id: 'year8-linear-equations-set4',
    title: 'Two-Step Equations',
    subtitle: 'Varied coefficients and constants',
    icon: '2️⃣',
    color: 'blue',
    firestoreSetId: 'year8-linear-equations-set4',
    topics: ['ax + b = c', 'ax - b = c', 'Order of operations'],
  },
  5: {
    id: 'year8-linear-equations-set5',
    title: 'Negative Constants',
    subtitle: 'Two-step with negative numbers',
    icon: '➖',
    color: 'blue',
    firestoreSetId: 'year8-linear-equations-set5',
    topics: ['Negative constants', 'Sign errors', 'Checking solutions'],
  },
  6: {
    id: 'year8-linear-equations-set6',
    title: 'Real-World Context',
    subtitle: 'Word problems and applications',
    icon: '🌍',
    color: 'blue',
    firestoreSetId: 'year8-linear-equations-set6',
    topics: ['Cost problems', 'Distance/rate', 'Setting up equations'],
  },
  7: {
    id: 'year8-linear-equations-set7',
    title: 'Equations with Brackets',
    subtitle: 'Distributive law and expansion',
    icon: '📦',
    color: 'purple',
    firestoreSetId: 'year8-linear-equations-set7',
    topics: ['a(x + b) = c', 'Expanding brackets', 'Distributive law'],
  },
  8: {
    id: 'year8-linear-equations-set8',
    title: 'Equations with Fractions',
    subtitle: 'Fractional coefficients',
    icon: '🔢',
    color: 'purple',
    firestoreSetId: 'year8-linear-equations-set8',
    topics: ['x/a + b = c', 'Clearing fractions', 'Common denominators'],
  },
  9: {
    id: 'year8-linear-equations-set9',
    title: 'Combined Techniques',
    subtitle: 'Brackets and fractions together',
    icon: '🎯',
    color: 'purple',
    firestoreSetId: 'year8-linear-equations-set9',
    topics: ['Mixed techniques', 'Multiple steps', 'Strategy choice'],
  },
  10: {
    id: 'year8-linear-equations-set10',
    title: 'Variables Both Sides',
    subtitle: 'Collecting like terms',
    icon: '⚖️',
    color: 'amber',
    firestoreSetId: 'year8-linear-equations-set10',
    topics: ['ax + b = cx + d', 'Collecting terms', 'Rearranging'],
  },
  11: {
    id: 'year8-linear-equations-set11',
    title: 'Complex Multi-Step',
    subtitle: 'Advanced equation solving',
    icon: '🧩',
    color: 'amber',
    firestoreSetId: 'year8-linear-equations-set11',
    topics: ['Nested brackets', 'Multiple fractions', 'Strategic solving'],
  },
  12: {
    id: 'year8-linear-equations-set12',
    title: 'Word Problems',
    subtitle: 'Real-world mastery challenges',
    icon: '📝',
    color: 'amber',
    firestoreSetId: 'year8-linear-equations-set12',
    topics: ['Age problems', 'Geometry', 'Number puzzles'],
  },
};

export default async function LinearEquationsSetPage({
  params,
}: {
  params: Promise<{ setNumber: string }>;
}) {
  const { setNumber: setNumberStr } = await params;
  const setNumber = parseInt(setNumberStr);
  const setMeta = setMetadata[setNumber];

  if (!setMeta) {
    return <div>Set not found</div>;
  }

  return (
    <SetPlayerClient
      setNumber={setNumber}
      setMeta={{
        ...setMeta,
        backLink: '/curriculum/mathematics/year8-linear-equations',
        backText: 'Back to Linear Equations',
        misconceptions: [
          'Forgetting to perform operation on both sides',
          'Incorrect order of operations when solving',
          'Sign errors when moving terms across equals sign',
        ],
      }}
    />
  );
}

import { SetPlayerClient } from '@/components/SetPlayerClient';

// Generate static params for all set numbers (1-5)
export function generateStaticParams() {
  return [
    { setNumber: '1' },
    { setNumber: '2' },
    { setNumber: '3' },
    { setNumber: '4' },
    { setNumber: '5' },
  ];
}

// Set metadata for medium questions
const mediumSetMetadata: Record<number, {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  firestoreSetId: string;
  topics: string[];
}> = {
  1: {
    id: 'year8-science-elements-compounds-set1',
    title: 'Atoms & Elements',
    subtitle: 'Understanding atomic structure and the periodic table',
    icon: '⚛️',
    color: 'blue',
    firestoreSetId: 'year8-science-elements-compounds-medium',
    topics: ['Atomic structure', 'Protons, neutrons, electrons', 'Elements', 'Periodic table'],
  },
  2: {
    id: 'year8-science-elements-compounds-set2',
    title: 'Compounds & Mixtures',
    subtitle: 'Chemical bonding and substance types',
    icon: '🧪',
    color: 'purple',
    firestoreSetId: 'year8-science-elements-compounds-medium',
    topics: ['Compounds', 'Mixtures', 'Chemical bonds', 'Pure substances'],
  },
  3: {
    id: 'year8-science-elements-compounds-set3',
    title: 'Chemical Formulas',
    subtitle: 'Representing substances with symbols',
    icon: '📝',
    color: 'green',
    firestoreSetId: 'year8-science-elements-compounds-medium',
    topics: ['Chemical symbols', 'Formulas', 'Equations', 'Molecular representation'],
  },
  4: {
    id: 'year8-science-elements-compounds-set4',
    title: 'Separation Techniques',
    subtitle: 'Methods for separating mixtures',
    icon: '🔬',
    color: 'teal',
    firestoreSetId: 'year8-science-elements-compounds-medium',
    topics: ['Filtration', 'Evaporation', 'Distillation', 'Chromatography'],
  },
  5: {
    id: 'year8-science-elements-compounds-set5',
    title: 'Metals & Non-metals',
    subtitle: 'Properties and uses of different elements',
    icon: '🔨',
    color: 'slate',
    firestoreSetId: 'year8-science-elements-compounds-medium',
    topics: ['Metal properties', 'Non-metal properties', 'Metallic bonding', 'Material uses'],
  },
};

export default async function ElementsCompoundsSetPage({
  params,
}: {
  params: Promise<{ setNumber: string }>;
}) {
  const { setNumber: setNumberStr } = await params;
  const setNumber = parseInt(setNumberStr);
  const setMeta = mediumSetMetadata[setNumber];

  if (!setMeta) {
    return <div>Set not found</div>;
  }

  return (
    <SetPlayerClient
      setNumber={setNumber}
      setMeta={{
        ...setMeta,
        backLink: '/curriculum/science/year8-elements-compounds',
        backText: 'Back to Elements & Compounds',
        misconceptions: [
          'Atoms can be divided infinitely',
          'All compounds are mixtures',
          'Chemical formulas are just abbreviations',
        ],
      }}
    />
  );
}

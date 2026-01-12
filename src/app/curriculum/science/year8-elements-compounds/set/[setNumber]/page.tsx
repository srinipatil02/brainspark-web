import { SetPlayerClient } from '@/components/SetPlayerClient';

// Generate static params for all set numbers (1-13)
export function generateStaticParams() {
  return [
    { setNumber: '1' },
    { setNumber: '2' },
    { setNumber: '3' },
    { setNumber: '4' },
    { setNumber: '5' },
    { setNumber: '6' },
    { setNumber: '7' },
    { setNumber: '8' },
    { setNumber: '9' },
    { setNumber: '10' },
    { setNumber: '11' },
    { setNumber: '12' },
    { setNumber: '13' },
  ];
}

// Set metadata for Learning Arc questions (80 questions across 8 sets)
const mediumSetMetadata: Record<number, {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  firestoreSetId: string;
  topics: string[];
  phase: string;
}> = {
  // Phase 1: Foundation (Sets 1-2)
  1: {
    id: 'year8-elements-compounds-mixtures-set1',
    title: 'Pure Substances & Mixtures',
    subtitle: 'Building vocabulary and core understanding',
    icon: '🔬',
    color: 'indigo',
    firestoreSetId: 'year8-elements-compounds-mixtures-set1',
    topics: ['Matter classification', 'Pure substances', 'Mixtures', 'Particle basics'],
    phase: 'Foundation',
  },
  2: {
    id: 'year8-elements-compounds-mixtures-set2',
    title: 'Elements & Compounds Intro',
    subtitle: 'Understanding basic classifications',
    icon: '⚛️',
    color: 'indigo',
    firestoreSetId: 'year8-elements-compounds-mixtures-set2',
    topics: ['Elements', 'Compounds', 'Atoms', 'Molecules'],
    phase: 'Foundation',
  },
  // Phase 2: Application (Sets 3-4)
  3: {
    id: 'year8-elements-compounds-mixtures-set3',
    title: 'Symbols & Formulas',
    subtitle: 'Reading and writing chemical notation',
    icon: '📊',
    color: 'violet',
    firestoreSetId: 'year8-elements-compounds-mixtures-set3',
    topics: ['Chemical symbols', 'Periodic table', 'Molecular formulas', 'Subscripts'],
    phase: 'Application',
  },
  4: {
    id: 'year8-elements-compounds-mixtures-set4',
    title: 'Real-World Applications',
    subtitle: 'Chemistry in everyday life',
    icon: '🌍',
    color: 'violet',
    firestoreSetId: 'year8-elements-compounds-mixtures-set4',
    topics: ['Gold karats', 'Steel vs iron', 'Air as mixture', 'Compound properties'],
    phase: 'Application',
  },
  // Phase 3: Connection (Sets 5-6)
  5: {
    id: 'year8-elements-compounds-mixtures-set5',
    title: 'Misconception Challenges',
    subtitle: 'Testing deeper understanding',
    icon: '🧪',
    color: 'purple',
    firestoreSetId: 'year8-elements-compounds-mixtures-set5',
    topics: ['Diatomic elements', 'O₂ confusion', 'Solutions vs compounds', 'Particle diagrams'],
    phase: 'Connection',
  },
  6: {
    id: 'year8-elements-compounds-mixtures-set6',
    title: 'Deep Connections',
    subtitle: 'Linking concepts together',
    icon: '🔗',
    color: 'purple',
    firestoreSetId: 'year8-elements-compounds-mixtures-set6',
    topics: ['Homogeneous mixtures', 'Property changes', 'Alloys', 'Chemical bonding'],
    phase: 'Connection',
  },
  // Phase 4: Mastery (Sets 7-8)
  7: {
    id: 'year8-elements-compounds-mixtures-set7',
    title: 'Synthesis & Prediction',
    subtitle: 'Applying knowledge to new scenarios',
    icon: '🎯',
    color: 'fuchsia',
    firestoreSetId: 'year8-elements-compounds-mixtures-set7',
    topics: ['Separation methods', 'Compound vs mixture', 'Multi-step reasoning', 'Evidence analysis'],
    phase: 'Mastery',
  },
  8: {
    id: 'year8-elements-compounds-mixtures-set8',
    title: 'Mastery Challenge',
    subtitle: 'Expert-level problem solving',
    icon: '🏆',
    color: 'fuchsia',
    firestoreSetId: 'year8-elements-compounds-mixtures-set8',
    topics: ['Complex scenarios', 'Diamond vs graphite', 'Real-world synthesis', 'Advanced problems'],
    phase: 'Mastery',
  },
  // Classic Sets (9-13) - Original migrated questions
  9: {
    id: 'year8-elements-compounds-mixtures-set9',
    title: 'Classic: Atomic Structure',
    subtitle: 'Original questions on atoms and particles',
    icon: '📚',
    color: 'slate',
    firestoreSetId: 'year8-elements-compounds-mixtures-set9',
    topics: ['Atoms', 'Subatomic particles', 'Electron shells', 'Bohr model'],
    phase: 'Classic',
  },
  10: {
    id: 'year8-elements-compounds-mixtures-set10',
    title: 'Classic: Periodic Table',
    subtitle: 'Original questions on element organization',
    icon: '📚',
    color: 'slate',
    firestoreSetId: 'year8-elements-compounds-mixtures-set10',
    topics: ['Groups', 'Periods', 'Metals', 'Non-metals'],
    phase: 'Classic',
  },
  11: {
    id: 'year8-elements-compounds-mixtures-set11',
    title: 'Classic: Compounds & Bonding',
    subtitle: 'Original questions on chemical combinations',
    icon: '📚',
    color: 'slate',
    firestoreSetId: 'year8-elements-compounds-mixtures-set11',
    topics: ['Chemical bonds', 'Ionic compounds', 'Covalent bonds', 'Formulas'],
    phase: 'Classic',
  },
  12: {
    id: 'year8-elements-compounds-mixtures-set12',
    title: 'Classic: Mixtures & Separation',
    subtitle: 'Original questions on separating substances',
    icon: '📚',
    color: 'slate',
    firestoreSetId: 'year8-elements-compounds-mixtures-set12',
    topics: ['Solutions', 'Suspensions', 'Filtration', 'Distillation'],
    phase: 'Classic',
  },
  13: {
    id: 'year8-elements-compounds-mixtures-set13',
    title: 'Classic: Applied Chemistry',
    subtitle: 'Original questions on real-world chemistry',
    icon: '📚',
    color: 'slate',
    firestoreSetId: 'year8-elements-compounds-mixtures-set13',
    topics: ['Everyday compounds', 'Chemical reactions', 'Conservation of mass', 'Applications'],
    phase: 'Classic',
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

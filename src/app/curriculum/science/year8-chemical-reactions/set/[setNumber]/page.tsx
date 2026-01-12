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

// Set metadata with per-set firestoreSetIds
const setMetadata: Record<number, {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  firestoreSetId: string;
  topics: string[];
}> = {
  // Phase 1: Foundation (Sets 1-2)
  1: {
    id: 'year8-chemical-reactions-set1',
    title: 'Physical vs Chemical Changes',
    subtitle: 'Understanding the difference between physical and chemical changes',
    icon: '🔬',
    color: 'rose',
    firestoreSetId: 'year8-chemical-reactions-set1',
    topics: ['Physical changes', 'Chemical changes', 'Reversibility', 'Evidence of reactions'],
  },
  2: {
    id: 'year8-chemical-reactions-set2',
    title: 'Signs of Chemical Reactions',
    subtitle: 'Recognizing when a chemical reaction has occurred',
    icon: '✨',
    color: 'pink',
    firestoreSetId: 'year8-chemical-reactions-set2',
    topics: ['Colour change', 'Gas production', 'Precipitate', 'Temperature change'],
  },
  // Phase 2: Application (Sets 3-4)
  3: {
    id: 'year8-chemical-reactions-set3',
    title: 'Reactants and Products',
    subtitle: 'Understanding word equations and reaction basics',
    icon: '⚗️',
    color: 'orange',
    firestoreSetId: 'year8-chemical-reactions-set3',
    topics: ['Word equations', 'Reactants', 'Products', 'Combustion basics'],
  },
  4: {
    id: 'year8-chemical-reactions-set4',
    title: 'Combustion Reactions',
    subtitle: 'Exploring burning and oxidation in everyday life',
    icon: '🔥',
    color: 'amber',
    firestoreSetId: 'year8-chemical-reactions-set4',
    topics: ['Burning fuels', 'Oxygen role', 'Carbon dioxide', 'Water vapour'],
  },
  // Phase 3: Connection (Sets 5-6)
  5: {
    id: 'year8-chemical-reactions-set5',
    title: 'Conservation of Mass',
    subtitle: 'Atoms rearrange but are never created or destroyed',
    icon: '⚖️',
    color: 'yellow',
    firestoreSetId: 'year8-chemical-reactions-set5',
    topics: ['Law of conservation', 'Atom rearrangement', 'Mass in reactions', 'Balanced equations'],
  },
  6: {
    id: 'year8-chemical-reactions-set6',
    title: 'Oxidation and Corrosion',
    subtitle: 'Understanding rusting and slow oxidation',
    icon: '🔩',
    color: 'lime',
    firestoreSetId: 'year8-chemical-reactions-set6',
    topics: ['Rusting', 'Oxidation', 'Corrosion prevention', 'Types of reactions'],
  },
  // Phase 4: Mastery (Sets 7-8)
  7: {
    id: 'year8-chemical-reactions-set7',
    title: 'Energy in Reactions',
    subtitle: 'Exothermic and endothermic reactions',
    icon: '⚡',
    color: 'emerald',
    firestoreSetId: 'year8-chemical-reactions-set7',
    topics: ['Exothermic reactions', 'Endothermic reactions', 'Energy release', 'Energy absorption'],
  },
  8: {
    id: 'year8-chemical-reactions-set8',
    title: 'Reaction Rates',
    subtitle: 'Factors that affect how fast reactions occur',
    icon: '🚀',
    color: 'teal',
    firestoreSetId: 'year8-chemical-reactions-set8',
    topics: ['Temperature effects', 'Surface area', 'Concentration', 'Catalysts'],
  },
  // Classic Sets (Sets 9-13) - Migrated from original questions
  9: {
    id: 'year8-chemical-reactions-set9',
    title: 'Classic: Reaction Basics',
    subtitle: 'Additional practice on chemical reaction fundamentals',
    icon: '📚',
    color: 'slate',
    firestoreSetId: 'year8-chemical-reactions-set9',
    topics: ['Reaction evidence', 'Physical vs chemical', 'Observable changes'],
  },
  10: {
    id: 'year8-chemical-reactions-set10',
    title: 'Classic: Reaction Types',
    subtitle: 'More practice on different types of reactions',
    icon: '📖',
    color: 'gray',
    firestoreSetId: 'year8-chemical-reactions-set10',
    topics: ['Combustion', 'Synthesis', 'Decomposition', 'Displacement'],
  },
  11: {
    id: 'year8-chemical-reactions-set11',
    title: 'Classic: Word Equations',
    subtitle: 'Practice writing and interpreting word equations',
    icon: '📝',
    color: 'zinc',
    firestoreSetId: 'year8-chemical-reactions-set11',
    topics: ['Word equations', 'Reactants', 'Products', 'Balancing'],
  },
  12: {
    id: 'year8-chemical-reactions-set12',
    title: 'Classic: Mass & Energy',
    subtitle: 'Conservation of mass and energy in reactions',
    icon: '📊',
    color: 'neutral',
    firestoreSetId: 'year8-chemical-reactions-set12',
    topics: ['Mass conservation', 'Energy changes', 'Exothermic', 'Endothermic'],
  },
  13: {
    id: 'year8-chemical-reactions-set13',
    title: 'Classic: Applied Chemistry',
    subtitle: 'Real-world applications of chemical reactions',
    icon: '🔬',
    color: 'stone',
    firestoreSetId: 'year8-chemical-reactions-set13',
    topics: ['Everyday reactions', 'Industrial chemistry', 'Environmental impact'],
  },
};

export default async function ChemicalReactionsSetPage({
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
        backLink: '/curriculum/science/year8-chemical-reactions',
        backText: 'Back to Chemical Reactions',
        misconceptions: [
          'Atoms are destroyed in chemical reactions',
          'Mass is lost when things burn',
          'Dissolving is a chemical change',
        ],
      }}
    />
  );
}

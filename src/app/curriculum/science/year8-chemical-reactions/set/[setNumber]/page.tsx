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

// Medium difficulty set metadata
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
    id: 'year8-science-chemical-reactions-set1',
    title: 'Physical vs Chemical Changes',
    subtitle: 'Understanding the evidence and nature of chemical reactions',
    icon: '🔬',
    color: 'rose',
    firestoreSetId: 'year8-science-chemical-reactions-medium',
    topics: ['Evidence of reactions', 'Reversible changes', 'Signs of chemical reactions', 'Energy changes'],
  },
  2: {
    id: 'year8-science-chemical-reactions-set2',
    title: 'Types of Reactions',
    subtitle: 'Exploring combustion, oxidation, and acid-base reactions',
    icon: '🔥',
    color: 'orange',
    firestoreSetId: 'year8-science-chemical-reactions-medium',
    topics: ['Combustion', 'Oxidation', 'Acid-base reactions', 'Neutralization'],
  },
  3: {
    id: 'year8-science-chemical-reactions-set3',
    title: 'Conservation of Mass',
    subtitle: 'Understanding mass in chemical reactions',
    icon: '⚖️',
    color: 'amber',
    firestoreSetId: 'year8-science-chemical-reactions-medium',
    topics: ['Law of conservation', 'Mass in reactions', 'Closed vs open systems', 'Balanced equations'],
  },
  4: {
    id: 'year8-science-chemical-reactions-set4',
    title: 'Reaction Rates',
    subtitle: 'Factors that affect the speed of chemical reactions',
    icon: '⚡',
    color: 'yellow',
    firestoreSetId: 'year8-science-chemical-reactions-medium',
    topics: ['Factors affecting speed', 'Temperature effects', 'Surface area', 'Catalysts'],
  },
  5: {
    id: 'year8-science-chemical-reactions-set5',
    title: 'Everyday Reactions',
    subtitle: 'Chemical reactions in daily life and nature',
    icon: '🌱',
    color: 'lime',
    firestoreSetId: 'year8-science-chemical-reactions-medium',
    topics: ['Cooking chemistry', 'Rusting', 'Photosynthesis', 'Cellular respiration'],
  },
};

export default async function ChemicalReactionsSetPage({
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
        backLink: '/curriculum/science/year8-chemical-reactions',
        backText: 'Back to Chemical Reactions',
        misconceptions: [
          'Chemical changes can be easily reversed',
          'Mass is lost in chemical reactions',
          'All reactions happen quickly',
        ],
      }}
    />
  );
}

import { SetPlayerClient } from '@/components/SetPlayerClient';

// Generate static params for all set numbers (medium 1-5, hard 1-2)
export function generateStaticParams() {
  return [
    { setNumber: '1' },
    { setNumber: '2' },
    { setNumber: '3' },
    { setNumber: '4' },
    { setNumber: '5' },
    { setNumber: 'hard-1' },
    { setNumber: 'hard-2' },
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
    id: 'year8-science-cells-set1',
    title: 'Cell Foundations',
    subtitle: 'Cell structure, organelles & energy',
    icon: '🔬',
    color: 'emerald',
    firestoreSetId: 'year8-science-cells-medium',
    topics: ['Cell structure', 'Organelles', 'Plant vs animal cells', 'Cell energy'],
  },
  2: {
    id: 'year8-science-cells-set2',
    title: 'Fuel Systems',
    subtitle: 'Digestive system & nutrients',
    icon: '🍎',
    color: 'amber',
    firestoreSetId: 'year8-science-cells-medium',
    topics: ['Digestive system', 'Nutrients', 'Enzymes', 'Absorption'],
  },
  3: {
    id: 'year8-science-cells-set3',
    title: 'Transport Networks',
    subtitle: 'Circulatory & respiratory systems',
    icon: '❤️',
    color: 'red',
    firestoreSetId: 'year8-science-cells-medium',
    topics: ['Heart', 'Blood vessels', 'Lungs', 'Gas exchange'],
  },
  4: {
    id: 'year8-science-cells-set4',
    title: 'Control & Movement',
    subtitle: 'Nervous, skeletal & muscular',
    icon: '🧠',
    color: 'purple',
    firestoreSetId: 'year8-science-cells-medium',
    topics: ['Nervous system', 'Skeletal system', 'Muscles', 'Movement'],
  },
  5: {
    id: 'year8-science-cells-set5',
    title: 'Body Integration',
    subtitle: 'Excretion, homeostasis & connections',
    icon: '⚖️',
    color: 'blue',
    firestoreSetId: 'year8-science-cells-medium',
    topics: ['Excretory system', 'Homeostasis', 'Body systems integration', 'Regulation'],
  },
};

// Set metadata for hard questions
const hardSetMetadata: Record<number, {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  firestoreSetId: string;
  topics: string[];
}> = {
  1: {
    id: 'year8-science-cells-hard-set1',
    title: 'Cell Deep Dive',
    subtitle: 'Advanced cell biology concepts',
    icon: '🧬',
    color: 'rose',
    firestoreSetId: 'year8-science-cells-body-systems',
    topics: ['Advanced cell biology', 'Cellular processes', 'Cell specialization', 'Microscopy'],
  },
  2: {
    id: 'year8-science-cells-hard-set2',
    title: 'Systems Mastery',
    subtitle: 'Complex body system interactions',
    icon: '🫀',
    color: 'rose',
    firestoreSetId: 'year8-science-cells-body-systems',
    topics: ['System interactions', 'Advanced physiology', 'Feedback mechanisms', 'Disease'],
  },
};

export default async function CellsSetPage({
  params,
}: {
  params: Promise<{ setNumber: string }>;
}) {
  const { setNumber: setNumberStr } = await params;

  // Parse setNumber - could be "1", "2", etc. or "hard-1", "hard-2"
  const isHard = setNumberStr.startsWith('hard-');
  const setNumber = isHard
    ? parseInt(setNumberStr.replace('hard-', ''), 10)
    : parseInt(setNumberStr, 10);

  const setMeta = isHard ? hardSetMetadata[setNumber] : mediumSetMetadata[setNumber];

  if (!setMeta) {
    return <div>Set not found</div>;
  }

  return (
    <SetPlayerClient
      setNumber={setNumber}
      setMeta={{
        ...setMeta,
        backLink: '/curriculum/science/year8-cells',
        backText: 'Back to Cells',
        misconceptions: [
          'All cells are the same',
          'Cells can function independently of systems',
          'Bigger organisms have bigger cells',
        ],
      }}
    />
  );
}

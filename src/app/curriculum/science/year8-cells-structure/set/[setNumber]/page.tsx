import { SetPlayerClient } from '@/components/SetPlayerClient';

// Generate static params for all set numbers (1-8)
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
  ];
}

// Set metadata - each set has a unique firestoreSetId for direct querying
const setMetadata: Record<number, {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  firestoreSetId: string;
  topics: string[];
}> = {
  // Phase 1: Foundation (Q1-20)
  1: {
    id: 'year8-cells-cell-structure-set1',
    title: 'Cell Basics',
    subtitle: 'Introduction to cells and cell theory',
    icon: '🔬',
    color: 'emerald',
    firestoreSetId: 'year8-cells-cell-structure-set1',
    topics: ['Cell theory', 'Basic structures', 'Plant vs animal', 'Microscopy'],
  },
  2: {
    id: 'year8-cells-cell-structure-set2',
    title: 'Cell Structures',
    subtitle: 'Organelles and their functions',
    icon: '🧬',
    color: 'teal',
    firestoreSetId: 'year8-cells-cell-structure-set2',
    topics: ['Nucleus', 'Membrane', 'Cytoplasm', 'Organelles'],
  },
  // Phase 2: Application (Q21-40)
  3: {
    id: 'year8-cells-cell-structure-set3',
    title: 'Energy in Cells',
    subtitle: 'Mitochondria and cellular respiration',
    icon: '⚡',
    color: 'orange',
    firestoreSetId: 'year8-cells-cell-structure-set3',
    topics: ['Mitochondria', 'ATP', 'Respiration', 'Energy release'],
  },
  4: {
    id: 'year8-cells-cell-structure-set4',
    title: 'Plant Cell Processes',
    subtitle: 'Chloroplasts and photosynthesis',
    icon: '🌿',
    color: 'green',
    firestoreSetId: 'year8-cells-cell-structure-set4',
    topics: ['Chloroplasts', 'Photosynthesis', 'Glucose', 'Cell wall'],
  },
  // Phase 3: Connection (Q41-60)
  5: {
    id: 'year8-cells-cell-structure-set5',
    title: 'Cell Misconceptions',
    subtitle: 'Challenging common misunderstandings',
    icon: '💡',
    color: 'amber',
    firestoreSetId: 'year8-cells-cell-structure-set5',
    topics: ['Energy myths', 'Cell analogies', 'Osmosis', 'Specialization'],
  },
  6: {
    id: 'year8-cells-cell-structure-set6',
    title: 'Connecting Systems',
    subtitle: 'How organelles work together',
    icon: '🔗',
    color: 'blue',
    firestoreSetId: 'year8-cells-cell-structure-set6',
    topics: ['Ribosomes', 'Protein synthesis', 'Cell cooperation', 'Transport'],
  },
  // Phase 4: Mastery (Q61-80)
  7: {
    id: 'year8-cells-cell-structure-set7',
    title: 'Complex Scenarios',
    subtitle: 'Applying cell biology to new situations',
    icon: '🧪',
    color: 'purple',
    firestoreSetId: 'year8-cells-cell-structure-set7',
    topics: ['Medical applications', 'Extremophiles', 'Cancer', 'Biotechnology'],
  },
  8: {
    id: 'year8-cells-cell-structure-set8',
    title: 'Mastery Challenge',
    subtitle: 'Demonstrating deep understanding',
    icon: '🏆',
    color: 'indigo',
    firestoreSetId: 'year8-cells-cell-structure-set8',
    topics: ['Evolution', 'Stem cells', 'Artificial cells', 'Synthesis'],
  },
};

export default async function CellsStructureSetPage({
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
        backLink: '/curriculum/science/year8-cells-structure',
        backText: 'Back to Cells & Cell Structure',
        misconceptions: [
          'All cells are the same size and shape',
          'The nucleus is the brain of the cell that thinks',
          'Mitochondria create energy from nothing',
          'All plant cells have chloroplasts',
        ],
      }}
    />
  );
}

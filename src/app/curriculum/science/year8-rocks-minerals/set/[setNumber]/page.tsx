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

// All set metadata (13 sets: 8 Learning Arc + 5 Classic)
const setMetadata: Record<number, {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  firestoreSetId: string;
  topics: string[];
  phase: string;
}> = {
  // Phase 1 - Foundation (Learning Arc)
  1: {
    id: 'year8-rocks-minerals-set1',
    title: 'Rock Types & Formation',
    subtitle: 'Introduction to the three rock types and how they form',
    icon: '🪨',
    color: 'amber',
    firestoreSetId: 'year8-rocks-minerals-set1',
    topics: ['Igneous rocks', 'Sedimentary rocks', 'Metamorphic rocks', 'Formation processes'],
    phase: 'Foundation',
  },
  2: {
    id: 'year8-rocks-minerals-set2',
    title: 'Mineral Properties',
    subtitle: 'Testing and identifying minerals by their properties',
    icon: '💎',
    color: 'yellow',
    firestoreSetId: 'year8-rocks-minerals-set2',
    topics: ['Hardness', 'Lustre', 'Streak', 'Cleavage & fracture'],
    phase: 'Foundation',
  },
  // Phase 2 - Application (Learning Arc)
  3: {
    id: 'year8-rocks-minerals-set3',
    title: 'Rock Cycle & Processes',
    subtitle: 'How rocks transform through the rock cycle',
    icon: '🔄',
    color: 'orange',
    firestoreSetId: 'year8-rocks-minerals-set3',
    topics: ['Rock cycle', 'Weathering', 'Erosion', 'Deposition'],
    phase: 'Application',
  },
  4: {
    id: 'year8-rocks-minerals-set4',
    title: 'Real-World Applications',
    subtitle: 'Geological resources and their uses',
    icon: '⛏️',
    color: 'stone',
    firestoreSetId: 'year8-rocks-minerals-set4',
    topics: ['Mining', 'Building materials', 'Fossil fuels', 'Sustainability'],
    phase: 'Application',
  },
  // Phase 3 - Connection (Learning Arc)
  5: {
    id: 'year8-rocks-minerals-set5',
    title: 'Cross-Concept Connections',
    subtitle: 'Linking rock types, minerals, and processes',
    icon: '🔗',
    color: 'teal',
    firestoreSetId: 'year8-rocks-minerals-set5',
    topics: ['Mineral-rock relationships', 'Process interactions', 'Cause and effect'],
    phase: 'Connection',
  },
  6: {
    id: 'year8-rocks-minerals-set6',
    title: 'Geological Time & Scale',
    subtitle: 'Understanding Earth history through rocks',
    icon: '🦴',
    color: 'cyan',
    firestoreSetId: 'year8-rocks-minerals-set6',
    topics: ['Fossils', 'Rock layers', 'Dating methods', 'Earth history'],
    phase: 'Connection',
  },
  // Phase 4 - Mastery (Learning Arc)
  7: {
    id: 'year8-rocks-minerals-set7',
    title: 'Complex Analysis',
    subtitle: 'Multi-step geological problem solving',
    icon: '🔬',
    color: 'indigo',
    firestoreSetId: 'year8-rocks-minerals-set7',
    topics: ['Rock identification', 'Process analysis', 'Evidence interpretation'],
    phase: 'Mastery',
  },
  8: {
    id: 'year8-rocks-minerals-set8',
    title: 'Mastery Challenge',
    subtitle: 'Advanced geological reasoning and synthesis',
    icon: '🏆',
    color: 'purple',
    firestoreSetId: 'year8-rocks-minerals-set8',
    topics: ['Synthesis', 'Critical analysis', 'Real-world scenarios', 'Scientific reasoning'],
    phase: 'Mastery',
  },
  // Classic Sets (9-13)
  9: {
    id: 'year8-rocks-minerals-set9',
    title: 'Classic: Rock Foundations',
    subtitle: 'Core rock type concepts and identification',
    icon: '📚',
    color: 'slate',
    firestoreSetId: 'year8-rocks-minerals-set9',
    topics: ['Rock types', 'Formation', 'Identification'],
    phase: 'Classic',
  },
  10: {
    id: 'year8-rocks-minerals-set10',
    title: 'Classic: Mineral Basics',
    subtitle: 'Essential mineral testing and classification',
    icon: '📖',
    color: 'gray',
    firestoreSetId: 'year8-rocks-minerals-set10',
    topics: ['Mineral properties', 'Testing', 'Classification'],
    phase: 'Classic',
  },
  11: {
    id: 'year8-rocks-minerals-set11',
    title: 'Classic: Earth Processes',
    subtitle: 'Weathering, erosion, and the rock cycle',
    icon: '🌏',
    color: 'zinc',
    firestoreSetId: 'year8-rocks-minerals-set11',
    topics: ['Weathering', 'Erosion', 'Rock cycle'],
    phase: 'Classic',
  },
  12: {
    id: 'year8-rocks-minerals-set12',
    title: 'Classic: Resources',
    subtitle: 'Mining, sustainability, and geological uses',
    icon: '💰',
    color: 'neutral',
    firestoreSetId: 'year8-rocks-minerals-set12',
    topics: ['Mining', 'Sustainability', 'Uses'],
    phase: 'Classic',
  },
  13: {
    id: 'year8-rocks-minerals-set13',
    title: 'Classic: Geology Mastery',
    subtitle: 'Advanced concepts and comprehensive review',
    icon: '🎓',
    color: 'stone',
    firestoreSetId: 'year8-rocks-minerals-set13',
    topics: ['Fossils', 'Time', 'Advanced concepts'],
    phase: 'Classic',
  },
};

export default async function RocksMineralsSetPage({
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
        backLink: '/curriculum/science/year8-rocks-minerals',
        backText: 'Back to Rocks & Minerals',
        misconceptions: [
          'All rocks are the same',
          'Minerals and rocks are the same thing',
          'The rock cycle is a one-way process',
          'Fossils are only found in certain rocks',
          'Weathering and erosion are the same thing',
        ],
      }}
    />
  );
}

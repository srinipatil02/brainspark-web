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
    id: 'year8-science-rocks-minerals-set1',
    title: 'Rock Types & Formation',
    subtitle: 'Understanding igneous, sedimentary, and metamorphic rocks',
    icon: '🪨',
    color: 'amber',
    firestoreSetId: 'year8-science-rocks-minerals-medium',
    topics: ['Igneous rocks', 'Sedimentary rocks', 'Metamorphic rocks', 'Rock cycle'],
  },
  2: {
    id: 'year8-science-rocks-minerals-set2',
    title: 'Mineral Properties',
    subtitle: 'Testing and identifying minerals',
    icon: '💎',
    color: 'yellow',
    firestoreSetId: 'year8-science-rocks-minerals-medium',
    topics: ['Hardness', 'Lustre', 'Streak', 'Cleavage & fracture'],
  },
  3: {
    id: 'year8-science-rocks-minerals-set3',
    title: 'Earth Processes',
    subtitle: 'Weathering, erosion, and tectonic forces',
    icon: '🌍',
    color: 'orange',
    firestoreSetId: 'year8-science-rocks-minerals-medium',
    topics: ['Weathering', 'Erosion', 'Deposition', 'Tectonic forces'],
  },
  4: {
    id: 'year8-science-rocks-minerals-set4',
    title: 'Geological Resources',
    subtitle: 'Mining, fossil fuels, and sustainability',
    icon: '⛏️',
    color: 'stone',
    firestoreSetId: 'year8-science-rocks-minerals-medium',
    topics: ['Mining', 'Fossil fuels', 'Renewable resources', 'Sustainability'],
  },
  5: {
    id: 'year8-science-rocks-minerals-set5',
    title: 'Geological Time',
    subtitle: 'Fossils, rock layers, and Earth history',
    icon: '🦴',
    color: 'zinc',
    firestoreSetId: 'year8-science-rocks-minerals-medium',
    topics: ['Fossils', 'Rock layers', 'Dating methods', 'Earth history'],
  },
};

export default async function RocksMineralsSetPage({
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
        backLink: '/curriculum/science/year8-rocks-minerals',
        backText: 'Back to Rocks & Minerals',
        misconceptions: [
          'All rocks are the same',
          'Minerals and rocks are the same thing',
          'The rock cycle is a one-way process',
        ],
      }}
    />
  );
}

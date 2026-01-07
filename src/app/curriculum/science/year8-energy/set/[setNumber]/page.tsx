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
    id: 'year8-science-energy-set1',
    title: 'Energy Forms & Transformation',
    subtitle: 'Types of energy & conversions',
    icon: '🔄',
    color: 'orange',
    firestoreSetId: 'year8-science-energy-medium',
    topics: ['Kinetic energy', 'Potential energy', 'Energy transformation', 'Energy types'],
  },
  2: {
    id: 'year8-science-energy-set2',
    title: 'Heat & Temperature',
    subtitle: 'Thermal energy & heat transfer',
    icon: '🌡️',
    color: 'amber',
    firestoreSetId: 'year8-science-energy-medium',
    topics: ['Heat transfer', 'Conduction', 'Convection', 'Radiation'],
  },
  3: {
    id: 'year8-science-energy-set3',
    title: 'Energy Transfer',
    subtitle: 'Power, efficiency & energy systems',
    icon: '⚙️',
    color: 'red',
    firestoreSetId: 'year8-science-energy-medium',
    topics: ['Power', 'Efficiency', 'Energy systems', 'Work'],
  },
  4: {
    id: 'year8-science-energy-set4',
    title: 'Conservation of Energy',
    subtitle: 'Energy laws & transformations',
    icon: '♻️',
    color: 'purple',
    firestoreSetId: 'year8-science-energy-medium',
    topics: ['Law of conservation', 'Energy diagrams', 'Energy dissipation', 'Closed systems'],
  },
  5: {
    id: 'year8-science-energy-set5',
    title: 'Energy Resources',
    subtitle: 'Renewable & non-renewable sources',
    icon: '🌍',
    color: 'blue',
    firestoreSetId: 'year8-science-energy-medium',
    topics: ['Renewable energy', 'Fossil fuels', 'Solar power', 'Sustainability'],
  },
};

export default async function EnergySetPage({
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
        backLink: '/curriculum/science/year8-energy',
        backText: 'Back to Energy',
        misconceptions: [
          'Energy can be created or destroyed',
          'Heat and temperature are the same thing',
          'Energy always stays in the same form',
        ],
      }}
    />
  );
}

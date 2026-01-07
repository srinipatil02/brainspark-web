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
    id: 'year8-science-states-of-matter-set1',
    title: 'Particle Model',
    subtitle: 'Understanding how particles behave in different states',
    icon: '🔵',
    color: 'blue',
    firestoreSetId: 'year8-science-states-of-matter-medium',
    topics: ['Particle arrangement', 'Particle movement', 'Kinetic energy', 'State properties'],
  },
  2: {
    id: 'year8-science-states-of-matter-set2',
    title: 'Changes of State',
    subtitle: 'Melting, freezing, evaporation, and condensation',
    icon: '🌡️',
    color: 'red',
    firestoreSetId: 'year8-science-states-of-matter-medium',
    topics: ['Melting', 'Freezing', 'Evaporation', 'Condensation'],
  },
  3: {
    id: 'year8-science-states-of-matter-set3',
    title: 'Temperature & Energy',
    subtitle: 'Heat energy and particle motion',
    icon: '🔥',
    color: 'orange',
    firestoreSetId: 'year8-science-states-of-matter-medium',
    topics: ['Temperature effects', 'Energy transfer', 'Heating curves', 'Thermal energy'],
  },
  4: {
    id: 'year8-science-states-of-matter-set4',
    title: 'Gas Properties',
    subtitle: 'Pressure, volume, and gas laws',
    icon: '💨',
    color: 'sky',
    firestoreSetId: 'year8-science-states-of-matter-medium',
    topics: ['Gas pressure', 'Volume', 'Temperature', 'Gas laws'],
  },
  5: {
    id: 'year8-science-states-of-matter-set5',
    title: 'Diffusion & Density',
    subtitle: 'Particle movement and matter properties',
    icon: '🌊',
    color: 'cyan',
    firestoreSetId: 'year8-science-states-of-matter-medium',
    topics: ['Diffusion', 'Density', 'Buoyancy', 'Particle spacing'],
  },
};

export default async function StatesOfMatterSetPage({
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
        backLink: '/curriculum/science/year8-states-of-matter',
        backText: 'Back to States of Matter',
        misconceptions: [
          'Particles stop moving in solids',
          'Evaporation only happens at boiling point',
          'Gas particles have no mass',
        ],
      }}
    />
  );
}

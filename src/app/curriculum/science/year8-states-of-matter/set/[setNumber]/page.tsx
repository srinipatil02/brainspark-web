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

// Set metadata - each set has a unique firestoreSetId for direct querying
const mediumSetMetadata: Record<number, {
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
    id: 'year8-science-states-of-matter-set1',
    title: 'States & Particles',
    subtitle: 'Introduction to the three states and particle model',
    icon: '⚛️',
    color: 'blue',
    firestoreSetId: 'year8-states-of-matter-set1',
    topics: ['Three states', 'Particle model', 'Arrangement', 'Movement'],
  },
  2: {
    id: 'year8-science-states-of-matter-set2',
    title: 'Particle Properties',
    subtitle: 'How particles behave in solids, liquids, and gases',
    icon: '🔬',
    color: 'indigo',
    firestoreSetId: 'year8-states-of-matter-set2',
    topics: ['Spacing', 'Energy', 'Forces', 'Comparing states'],
  },
  // Phase 2: Application (Q21-40)
  3: {
    id: 'year8-science-states-of-matter-set3',
    title: 'Real-World States',
    subtitle: 'Applying particle theory to everyday phenomena',
    icon: '🌡️',
    color: 'orange',
    firestoreSetId: 'year8-states-of-matter-set3',
    topics: ['Melting ice cream', 'Steam', 'Diffusion', 'Compression'],
  },
  4: {
    id: 'year8-science-states-of-matter-set4',
    title: 'Energy & Change',
    subtitle: 'Temperature, energy transfer, and state changes',
    icon: '🔥',
    color: 'red',
    firestoreSetId: 'year8-states-of-matter-set4',
    topics: ['Temperature', 'Kinetic energy', 'Heating', 'Boiling'],
  },
  // Phase 3: Connection (Q41-60)
  5: {
    id: 'year8-science-states-of-matter-set5',
    title: 'Challenging Ideas',
    subtitle: 'Addressing misconceptions about matter',
    icon: '💡',
    color: 'amber',
    firestoreSetId: 'year8-states-of-matter-set5',
    topics: ['Common mistakes', 'Dissolving vs melting', 'Gas mass', 'Particle size'],
  },
  6: {
    id: 'year8-science-states-of-matter-set6',
    title: 'Connecting Concepts',
    subtitle: 'Linking particle theory across states',
    icon: '🔗',
    color: 'teal',
    firestoreSetId: 'year8-states-of-matter-set6',
    topics: ['State transitions', 'Energy flow', 'Particle diagrams', 'Predictions'],
  },
  // Phase 4: Mastery (Q61-80)
  7: {
    id: 'year8-science-states-of-matter-set7',
    title: 'Complex Scenarios',
    subtitle: 'Applying knowledge to new situations',
    icon: '🧪',
    color: 'purple',
    firestoreSetId: 'year8-states-of-matter-set7',
    topics: ['Multi-step problems', 'Explanations', 'Analysis', 'Synthesis'],
  },
  8: {
    id: 'year8-science-states-of-matter-set8',
    title: 'Mastery Challenge',
    subtitle: 'Demonstrating deep understanding',
    icon: '🏆',
    color: 'emerald',
    firestoreSetId: 'year8-states-of-matter-set8',
    topics: ['Expert reasoning', 'Novel contexts', 'Critical thinking', 'Integration'],
  },
  // Classic Sets (9-13) - Original question bank
  9: {
    id: 'year8-science-states-of-matter-set9',
    title: 'Classic: Particle Model',
    subtitle: 'Foundation questions on particle theory',
    icon: '📚',
    color: 'slate',
    firestoreSetId: 'year8-states-of-matter-set9',
    topics: ['Particle arrangement', 'Movement', 'Spacing', 'States'],
  },
  10: {
    id: 'year8-science-states-of-matter-set10',
    title: 'Classic: State Properties',
    subtitle: 'Properties of solids, liquids, and gases',
    icon: '📖',
    color: 'stone',
    firestoreSetId: 'year8-states-of-matter-set10',
    topics: ['Solid properties', 'Liquid properties', 'Gas properties', 'Comparisons'],
  },
  11: {
    id: 'year8-science-states-of-matter-set11',
    title: 'Classic: Changes',
    subtitle: 'State changes and energy',
    icon: '📝',
    color: 'zinc',
    firestoreSetId: 'year8-states-of-matter-set11',
    topics: ['Melting', 'Freezing', 'Evaporation', 'Condensation'],
  },
  12: {
    id: 'year8-science-states-of-matter-set12',
    title: 'Classic: Applications',
    subtitle: 'Real-world applications',
    icon: '📋',
    color: 'gray',
    firestoreSetId: 'year8-states-of-matter-set12',
    topics: ['Everyday examples', 'Problem solving', 'Explanations', 'Predictions'],
  },
  13: {
    id: 'year8-science-states-of-matter-set13',
    title: 'Classic: Mastery',
    subtitle: 'Advanced particle theory',
    icon: '🎓',
    color: 'neutral',
    firestoreSetId: 'year8-states-of-matter-set13',
    topics: ['Complex scenarios', 'Deep understanding', 'Synthesis', 'Analysis'],
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

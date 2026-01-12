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
    id: 'year8-science-energy-forms-transformations-set1',
    title: 'Energy Forms',
    subtitle: 'Introduction to different types of energy',
    icon: '⚡',
    color: 'amber',
    firestoreSetId: 'year8-energy-forms-transformations-set1',
    topics: ['Kinetic energy', 'Potential energy', 'Thermal energy', 'Energy definition'],
  },
  2: {
    id: 'year8-science-energy-forms-transformations-set2',
    title: 'Kinetic & Potential',
    subtitle: 'Understanding motion and stored energy',
    icon: '🏃',
    color: 'orange',
    firestoreSetId: 'year8-energy-forms-transformations-set2',
    topics: ['KE formula', 'GPE formula', 'Mass & velocity', 'Height & energy'],
  },
  // Phase 2: Application (Q21-40)
  3: {
    id: 'year8-science-energy-forms-transformations-set3',
    title: 'Real-World Energy',
    subtitle: 'Energy in everyday phenomena',
    icon: '🎢',
    color: 'red',
    firestoreSetId: 'year8-energy-forms-transformations-set3',
    topics: ['Roller coasters', 'Bouncing balls', 'Phone batteries', 'Food energy'],
  },
  4: {
    id: 'year8-science-energy-forms-transformations-set4',
    title: 'Transformations',
    subtitle: 'How energy changes from one form to another',
    icon: '🔄',
    color: 'purple',
    firestoreSetId: 'year8-energy-forms-transformations-set4',
    topics: ['Energy chains', 'Conversions', 'Multiple transfers', 'Energy flow'],
  },
  // Phase 3: Connection (Q41-60)
  5: {
    id: 'year8-science-energy-forms-transformations-set5',
    title: 'Challenging Ideas',
    subtitle: 'Addressing misconceptions about energy',
    icon: '💡',
    color: 'indigo',
    firestoreSetId: 'year8-energy-forms-transformations-set5',
    topics: ['Energy vs force', 'Heat vs temperature', 'Energy "used up"', 'Speed & KE'],
  },
  6: {
    id: 'year8-science-energy-forms-transformations-set6',
    title: 'Conservation',
    subtitle: 'Energy cannot be created or destroyed',
    icon: '⚖️',
    color: 'blue',
    firestoreSetId: 'year8-energy-forms-transformations-set6',
    topics: ['Conservation law', 'Closed systems', 'Energy accounting', 'Total energy'],
  },
  // Phase 4: Mastery (Q61-80)
  7: {
    id: 'year8-science-energy-forms-transformations-set7',
    title: 'Efficiency',
    subtitle: 'Useful energy and energy losses',
    icon: '📊',
    color: 'teal',
    firestoreSetId: 'year8-energy-forms-transformations-set7',
    topics: ['Efficiency calculations', 'Wasted energy', 'Friction losses', 'Heat dissipation'],
  },
  8: {
    id: 'year8-science-energy-forms-transformations-set8',
    title: 'Mastery Challenge',
    subtitle: 'Complex energy scenarios and synthesis',
    icon: '🏆',
    color: 'emerald',
    firestoreSetId: 'year8-energy-forms-transformations-set8',
    topics: ['Multi-step problems', 'Energy degradation', 'Sustainability', 'Critical thinking'],
  },
};

export default async function EnergyFormsTransformationsSetPage({
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
        backLink: '/curriculum/science/year8-energy-forms-transformations',
        backText: 'Back to Energy Forms & Transformations',
        misconceptions: [
          'Energy is used up or consumed',
          'Doubling speed doubles kinetic energy',
          'Objects at rest have no energy',
          'Heat and temperature are the same thing',
          'Energy and force are the same concept',
        ],
      }}
    />
  );
}

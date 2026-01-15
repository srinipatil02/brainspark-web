// =============================================================================
// ARCHETYPE CONNECTION SERVICE
// =============================================================================
// FILE: src/services/nsw-selective/archetypeConnectionService.ts
// DOMAIN: NSW Selective Exam Prep - AI Tutoring
// PURPOSE: Provide cross-archetype intelligence for learning path optimization
// DO NOT: Recommend archetypes without considering prerequisites

import { ArchetypeId } from '@/types';
import {
  ArchetypeCategory,
  getArchetypeDefinition,
  ARCHETYPE_CATALOG
} from '@/types/nsw-selective';

// =============================================================================
// TYPES
// =============================================================================

export interface ArchetypeConnection {
  archetypeId: ArchetypeId;
  relationshipType: 'shares_concepts' | 'shares_error_patterns' | 'prerequisite_for' | 'builds_on';
  strength: 'strong' | 'moderate' | 'weak';
  explanation: string;
}

export interface TransferOpportunity {
  fromArchetype: ArchetypeId;
  toArchetype: ArchetypeId;
  skillsTransferred: string[];
  difficultyIncrease: 'same' | 'slight' | 'significant';
  recommendation: string;
}

export interface LearningPathRecommendation {
  nextArchetypes: ArchetypeId[];
  reasoning: string[];
  warningsForNewArchetypes: Partial<Record<ArchetypeId, string>>;
}

export interface ArchetypeRelationships {
  sharesConcepts: ArchetypeId[];
  sharesErrorPatterns: ArchetypeId[];
  prerequisiteFor: ArchetypeId[];
  buildsOn: ArchetypeId[];
}

// =============================================================================
// ARCHETYPE CONNECTION MAP
// =============================================================================

/**
 * Maps relationships between archetypes
 * - sharesConcepts: Uses similar mathematical thinking
 * - sharesErrorPatterns: Students make similar mistakes
 * - prerequisiteFor: Skills from this archetype help with others
 * - buildsOn: This archetype needs skills from others
 */
const ARCHETYPE_CONNECTIONS: Record<ArchetypeId, ArchetypeRelationships> = {
  qa1: {  // Sequence Duration
    sharesConcepts: ['qa9'],        // Pattern sequences use similar thinking
    sharesErrorPatterns: ['qa8'],   // Both involve summation errors
    prerequisiteFor: ['qa9'],       // Understanding sequences helps with complex patterns
    buildsOn: []                    // Foundation archetype
  },
  qa2: {  // Weight Equivalence
    sharesConcepts: ['qa6', 'qa12'], // All use ratio reasoning
    sharesErrorPatterns: ['qa15'],   // Scale/proportion uses similar division
    prerequisiteFor: ['qa15'],       // Weight equivalence helps with scale problems
    buildsOn: []                     // Foundation archetype
  },
  qa3: {  // 3D Properties
    sharesConcepts: ['qa14', 'qa19'], // All involve spatial reasoning
    sharesErrorPatterns: ['qa14'],    // Both involve counting 3D elements
    prerequisiteFor: ['qa14'],        // 3D basics needed for painted cubes
    buildsOn: []                      // Foundation archetype
  },
  qa4: {  // Time Zone Journey
    sharesConcepts: ['qa16', 'qa20'], // All involve time calculations
    sharesErrorPatterns: ['qa20'],    // Both involve multi-part journeys
    prerequisiteFor: [],              // Advanced archetype
    buildsOn: ['qa16', 'qa20']        // Needs basic time/distance skills
  },
  qa5: {  // Price Equations
    sharesConcepts: ['qa10'],         // Both use simultaneous reasoning
    sharesErrorPatterns: ['qa10'],    // Both involve variable relationships
    prerequisiteFor: ['qa10'],        // Equation solving helps with relationships
    buildsOn: []                      // Foundation archetype
  },
  qa6: {  // Object Pairing
    sharesConcepts: ['qa2', 'qa12'],  // All use ratio/pairing logic
    sharesErrorPatterns: ['qa2'],     // Similar division errors
    prerequisiteFor: ['qa12'],        // Pairing concepts help with multi-ratio
    buildsOn: []                      // Foundation archetype
  },
  qa7: {  // Venn Diagram
    sharesConcepts: ['qa18'],         // Both involve set/counting logic
    sharesErrorPatterns: ['qa18'],    // Both have overlap counting issues
    prerequisiteFor: ['qa10'],        // Set thinking helps with relationships
    buildsOn: []                      // Foundation archetype
  },
  qa8: {  // Target Mean
    sharesConcepts: ['qa1'],          // Both involve summation
    sharesErrorPatterns: ['qa1'],     // Both have counting/summing errors
    prerequisiteFor: [],              // Fairly standalone
    buildsOn: []                      // Foundation archetype
  },
  qa9: {  // Complex Pattern
    sharesConcepts: ['qa1'],          // Both involve sequences
    sharesErrorPatterns: [],          // Unique error patterns
    prerequisiteFor: [],              // Advanced, doesn't lead to others
    buildsOn: ['qa1']                 // Needs sequence understanding
  },
  qa10: { // Three-Way Relationship
    sharesConcepts: ['qa5', 'qa17'],  // All use variable relationships
    sharesErrorPatterns: ['qa17'],    // Both have relationship confusion
    prerequisiteFor: [],              // Advanced archetype
    buildsOn: ['qa5', 'qa7']          // Needs equation and set thinking
  },
  qa11: { // Percentage Equivalence
    sharesConcepts: ['qa13'],         // Both use percentage reasoning
    sharesErrorPatterns: ['qa13'],    // Both have "forward vs reverse" confusion
    prerequisiteFor: ['qa13'],        // Equivalence concepts help with reverse
    buildsOn: []                      // Foundation archetype
  },
  qa12: { // Multi-Ratio Recipe
    sharesConcepts: ['qa2', 'qa6'],   // All use ratio reasoning
    sharesErrorPatterns: ['qa15'],    // Both have scale/ratio confusion
    prerequisiteFor: ['qa15'],        // Multi-ratio helps with scaling
    buildsOn: ['qa6']                 // Needs basic pairing/ratio
  },
  qa13: { // Reverse Percentage
    sharesConcepts: ['qa11', 'qa20'], // All use "reverse" thinking
    sharesErrorPatterns: ['qa20'],    // Both have forward/reverse confusion
    prerequisiteFor: [],              // Application archetype
    buildsOn: ['qa11']                // Needs percentage equivalence basics
  },
  qa14: { // Painted Cubes
    sharesConcepts: ['qa3', 'qa19'],  // All involve spatial reasoning
    sharesErrorPatterns: ['qa3'],     // Both have counting 3D elements issues
    prerequisiteFor: [],              // Advanced, standalone
    buildsOn: ['qa3']                 // Needs 3D shape basics
  },
  qa15: { // Scale Proportion
    sharesConcepts: ['qa2', 'qa12'],  // All use ratio/scaling
    sharesErrorPatterns: ['qa12'],    // Both have ratio direction errors
    prerequisiteFor: [],              // Advanced archetype
    buildsOn: ['qa2', 'qa12']         // Needs ratio and multi-ratio skills
  },
  qa16: { // Timetable
    sharesConcepts: ['qa4', 'qa20'],  // All involve time calculations
    sharesErrorPatterns: ['qa4'],     // Both have time tracking issues
    prerequisiteFor: ['qa4', 'qa20'], // Basic time skills needed for complex
    buildsOn: []                      // Foundation archetype
  },
  qa17: { // Age Relationship
    sharesConcepts: ['qa10'],         // Both use variable relationships
    sharesErrorPatterns: ['qa10'],    // Both have relationship direction errors
    prerequisiteFor: [],              // Standalone application
    buildsOn: ['qa5']                 // Needs basic equation thinking
  },
  qa18: { // Counting Combinations
    sharesConcepts: ['qa7'],          // Both use set/counting logic
    sharesErrorPatterns: ['qa7'],     // Both have overlap/constraint errors
    prerequisiteFor: [],              // Standalone archetype
    buildsOn: ['qa7']                 // Set thinking helps
  },
  qa19: { // Shaded Area
    sharesConcepts: ['qa3', 'qa14'],  // All involve spatial/area
    sharesErrorPatterns: [],          // Unique error patterns (pi, radius)
    prerequisiteFor: [],              // Standalone application
    buildsOn: ['qa3']                 // Needs basic shape understanding
  },
  qa20: { // Speed-Distance-Time
    sharesConcepts: ['qa4', 'qa13'],  // All use "reverse" or multi-part logic
    sharesErrorPatterns: ['qa13'],    // Both have forward/reverse confusion
    prerequisiteFor: ['qa4'],         // Basic SDT needed for complex journeys
    buildsOn: ['qa16']                // Needs basic time calculations
  },
  qa21: { // Multi-Concept Integration
    sharesConcepts: ['qa10', 'qa17'],  // All involve combining multiple concepts
    sharesErrorPatterns: ['qa10'],     // Both have relationship confusion
    prerequisiteFor: [],               // Advanced synthesis archetype
    buildsOn: ['qa5', 'qa11', 'qa13']  // Builds on equation, percentage, and ratio skills
  },
  qa22: { // Probability Reasoning
    sharesConcepts: ['qa18', 'qa23'],  // Counting/combinations and statistics
    sharesErrorPatterns: ['qa18'],     // Both involve systematic counting errors
    prerequisiteFor: ['qa23'],         // Probability concepts help with data interpretation
    buildsOn: ['qa18']                 // Builds on systematic counting skills
  },
  qa23: { // Data Interpretation
    sharesConcepts: ['qa8', 'qa22'],   // Both involve statistical measures
    sharesErrorPatterns: ['qa8'],      // Both have mean/median confusion
    prerequisiteFor: [],               // Application archetype
    buildsOn: ['qa8', 'qa22']          // Builds on mean calculations and probability
  }
};

// =============================================================================
// CONCEPT OVERLAP DESCRIPTIONS
// =============================================================================

const CONCEPT_OVERLAP_EXPLANATIONS: Partial<Record<string, string>> = {
  'qa1-qa9': 'Both involve recognizing and working with number sequences',
  'qa2-qa6': 'Both require ratio reasoning to find unknown quantities',
  'qa2-qa12': 'Both use ratio relationships between multiple items',
  'qa3-qa14': 'Both require visualizing and counting 3D structure elements',
  'qa3-qa19': 'Both involve calculating properties of geometric shapes',
  'qa4-qa16': 'Both involve time calculations and tracking durations',
  'qa4-qa20': 'Both involve multi-part journeys with different conditions',
  'qa5-qa10': 'Both use variable relationships to solve for unknowns',
  'qa6-qa12': 'Both use pairing/grouping strategies for ratio problems',
  'qa7-qa18': 'Both require systematic counting with constraints',
  'qa8-qa1': 'Both involve sum calculations and arithmetic',
  'qa10-qa17': 'Both involve expressing relationships between variables',
  'qa11-qa13': 'Both require understanding percentage relationships',
  'qa13-qa20': 'Both use "reverse" thinking - finding input from output',
  'qa14-qa19': 'Both require spatial reasoning about shapes',
  'qa16-qa20': 'Both involve time-distance-speed relationships'
};

// =============================================================================
// ERROR PATTERN WARNINGS
// =============================================================================

const ERROR_PATTERN_WARNINGS: Partial<Record<string, string>> = {
  'qa1-qa8': 'Watch for counting errors - both involve adding up multiple values',
  'qa2-qa15': 'Watch for dividing by the wrong quantity - ratio direction matters!',
  'qa3-qa14': 'Watch for miscounting edges/vertices - use systematic approach',
  'qa4-qa20': 'Watch for averaging speeds instead of using total distance/total time',
  'qa5-qa10': 'Watch for mixing up more/less relationships between variables',
  'qa7-qa18': 'Watch for forgetting constraints or double-counting overlaps',
  'qa10-qa17': 'Watch for assigning "more than" vs "less than" incorrectly',
  'qa11-qa13': 'Watch for applying percentage forward instead of reverse',
  'qa12-qa15': 'Watch for using linear scale instead of cubic for volume/weight',
  'qa13-qa20': 'Watch for finding speed instead of finding starting value'
};

// =============================================================================
// MAIN FUNCTIONS
// =============================================================================

/**
 * Get all connections for an archetype
 */
export function getArchetypeConnections(archetypeId: ArchetypeId): ArchetypeConnection[] {
  const connections = ARCHETYPE_CONNECTIONS[archetypeId];
  const result: ArchetypeConnection[] = [];

  // Add concept-sharing connections
  for (const relatedId of connections.sharesConcepts) {
    const key = [archetypeId, relatedId].sort().join('-');
    result.push({
      archetypeId: relatedId,
      relationshipType: 'shares_concepts',
      strength: 'strong',
      explanation: CONCEPT_OVERLAP_EXPLANATIONS[key] ||
        `${getArchetypeDefinition(archetypeId).shortName} and ${getArchetypeDefinition(relatedId).shortName} use similar mathematical thinking`
    });
  }

  // Add error-pattern connections
  for (const relatedId of connections.sharesErrorPatterns) {
    const key = [archetypeId, relatedId].sort().join('-');
    result.push({
      archetypeId: relatedId,
      relationshipType: 'shares_error_patterns',
      strength: 'moderate',
      explanation: ERROR_PATTERN_WARNINGS[key] ||
        `Similar error patterns occur in both archetypes`
    });
  }

  // Add prerequisite connections
  for (const relatedId of connections.prerequisiteFor) {
    result.push({
      archetypeId: relatedId,
      relationshipType: 'prerequisite_for',
      strength: 'strong',
      explanation: `Skills from ${getArchetypeDefinition(archetypeId).shortName} help with ${getArchetypeDefinition(relatedId).shortName}`
    });
  }

  // Add builds-on connections
  for (const relatedId of connections.buildsOn) {
    result.push({
      archetypeId: relatedId,
      relationshipType: 'builds_on',
      strength: 'strong',
      explanation: `${getArchetypeDefinition(archetypeId).shortName} builds on skills from ${getArchetypeDefinition(relatedId).shortName}`
    });
  }

  return result;
}

/**
 * Get transfer opportunities after mastering an archetype
 */
export function getTransferOpportunities(masteredArchetypeId: ArchetypeId): TransferOpportunity[] {
  const connections = ARCHETYPE_CONNECTIONS[masteredArchetypeId];
  const opportunities: TransferOpportunity[] = [];
  const masteredDef = getArchetypeDefinition(masteredArchetypeId);

  // Archetypes this one is prerequisite for
  for (const targetId of connections.prerequisiteFor) {
    const targetDef = getArchetypeDefinition(targetId);
    const sharedConcepts = masteredDef.conceptsRequired.filter(
      c => targetDef.conceptsRequired.includes(c)
    );

    opportunities.push({
      fromArchetype: masteredArchetypeId,
      toArchetype: targetId,
      skillsTransferred: sharedConcepts.length > 0 ? sharedConcepts : [masteredDef.solutionApproach.split(';')[0]],
      difficultyIncrease: targetDef.difficulty > masteredDef.difficulty ?
        (targetDef.difficulty - masteredDef.difficulty > 1 ? 'significant' : 'slight') : 'same',
      recommendation: `Your mastery of ${masteredDef.shortName} directly applies to ${targetDef.shortName}!`
    });
  }

  // Archetypes sharing concepts (but not prerequisites)
  for (const targetId of connections.sharesConcepts) {
    if (!connections.prerequisiteFor.includes(targetId)) {
      const targetDef = getArchetypeDefinition(targetId);
      const sharedConcepts = masteredDef.conceptsRequired.filter(
        c => targetDef.conceptsRequired.includes(c)
      );

      opportunities.push({
        fromArchetype: masteredArchetypeId,
        toArchetype: targetId,
        skillsTransferred: sharedConcepts.length > 0 ? sharedConcepts : ['similar-reasoning'],
        difficultyIncrease: targetDef.difficulty > masteredDef.difficulty ?
          (targetDef.difficulty - masteredDef.difficulty > 1 ? 'significant' : 'slight') : 'same',
        recommendation: `The ${masteredDef.shortName} thinking style transfers well to ${targetDef.shortName}`
      });
    }
  }

  return opportunities;
}

/**
 * Get recommended learning path based on current progress
 */
export function getLearningPathRecommendation(
  masteredArchetypes: ArchetypeId[],
  strugglingArchetypes: ArchetypeId[],
  errorPatterns: Partial<Record<ArchetypeId, string[]>>
): LearningPathRecommendation {
  const nextArchetypes: ArchetypeId[] = [];
  const reasoning: string[] = [];
  const warnings: Partial<Record<ArchetypeId, string>> = {};

  // First priority: Archetypes that build on mastered ones
  for (const masteredId of masteredArchetypes) {
    const connections = ARCHETYPE_CONNECTIONS[masteredId];
    for (const nextId of connections.prerequisiteFor) {
      if (!masteredArchetypes.includes(nextId) && !nextArchetypes.includes(nextId)) {
        nextArchetypes.push(nextId);
        reasoning.push(`${getArchetypeDefinition(nextId).shortName} builds on your ${getArchetypeDefinition(masteredId).shortName} mastery`);
      }
    }
  }

  // Second priority: Address struggling archetypes by building prerequisites
  for (const strugglingId of strugglingArchetypes) {
    const connections = ARCHETYPE_CONNECTIONS[strugglingId];
    for (const prereqId of connections.buildsOn) {
      if (!masteredArchetypes.includes(prereqId) && !nextArchetypes.includes(prereqId)) {
        nextArchetypes.unshift(prereqId); // Add to front - higher priority
        reasoning.push(`Master ${getArchetypeDefinition(prereqId).shortName} first - it will help with ${getArchetypeDefinition(strugglingId).shortName}`);
      }
    }
  }

  // Add warnings for archetypes that share error patterns with struggling ones
  for (const nextId of nextArchetypes) {
    for (const strugglingId of strugglingArchetypes) {
      if (ARCHETYPE_CONNECTIONS[nextId].sharesErrorPatterns.includes(strugglingId)) {
        const key = [nextId, strugglingId].sort().join('-');
        warnings[nextId] = ERROR_PATTERN_WARNINGS[key] ||
          `Watch out: similar errors to ${getArchetypeDefinition(strugglingId).shortName}`;
      }
    }
  }

  // If no recommendations yet, suggest foundation archetypes
  if (nextArchetypes.length === 0) {
    const foundationArchetypes: ArchetypeId[] = ['qa1', 'qa2', 'qa3', 'qa5', 'qa6', 'qa7', 'qa8', 'qa11', 'qa16'];
    for (const foundationId of foundationArchetypes) {
      if (!masteredArchetypes.includes(foundationId) && !nextArchetypes.includes(foundationId)) {
        nextArchetypes.push(foundationId);
        if (nextArchetypes.length >= 5) break;
      }
    }
    if (nextArchetypes.length > 0) {
      reasoning.push('Start with these foundation archetypes to build a strong base');
    }
  }

  // Limit to top 5 recommendations
  return {
    nextArchetypes: nextArchetypes.slice(0, 5),
    reasoning,
    warningsForNewArchetypes: warnings
  };
}

/**
 * Generate mastery celebration message with transfer opportunities
 */
export function generateMasteryCelebration(
  archetypeId: ArchetypeId,
  masteryLevel: number
): {
  celebration: string;
  transferOpportunities: TransferOpportunity[];
  unlockMessage: string | null;
} {
  const archetype = getArchetypeDefinition(archetypeId);
  const opportunities = getTransferOpportunities(archetypeId);

  const celebration = masteryLevel >= 5
    ? `🏆 MASTERY ACHIEVED: ${archetype.shortName}! You've demonstrated expert-level understanding.`
    : `🌟 Great progress on ${archetype.shortName}! You're at mastery level ${masteryLevel}/5.`;

  let unlockMessage: string | null = null;
  if (opportunities.length > 0) {
    const nextArchetype = opportunities[0];
    unlockMessage = `✨ NEW OPPORTUNITY: Your ${archetype.shortName} skills unlock ${getArchetypeDefinition(nextArchetype.toArchetype).shortName}!`;
  }

  return {
    celebration,
    transferOpportunities: opportunities,
    unlockMessage
  };
}

/**
 * Get archetypes by category for UI grouping
 */
export function getArchetypesByRelationship(
  archetypeId: ArchetypeId
): {
  category: ArchetypeCategory;
  sameCategory: ArchetypeId[];
  relatedBySkill: ArchetypeId[];
  prerequisites: ArchetypeId[];
  unlockedBy: ArchetypeId[];
} {
  const archetype = getArchetypeDefinition(archetypeId);
  const connections = ARCHETYPE_CONNECTIONS[archetypeId];

  // Get archetypes in same category
  const sameCategory = (Object.keys(ARCHETYPE_CATALOG) as ArchetypeId[])
    .filter(id => id !== archetypeId && ARCHETYPE_CATALOG[id].category === archetype.category);

  // Get all related archetypes
  const relatedBySkill = [...new Set([
    ...connections.sharesConcepts,
    ...connections.sharesErrorPatterns
  ])].filter(id => !sameCategory.includes(id));

  return {
    category: archetype.category,
    sameCategory,
    relatedBySkill,
    prerequisites: connections.buildsOn,
    unlockedBy: connections.prerequisiteFor
  };
}

/**
 * Calculate concept overlap percentage between two archetypes
 */
export function calculateConceptOverlap(
  archetype1: ArchetypeId,
  archetype2: ArchetypeId
): number {
  const def1 = getArchetypeDefinition(archetype1);
  const def2 = getArchetypeDefinition(archetype2);

  const concepts1 = new Set(def1.conceptsRequired);
  const concepts2 = new Set(def2.conceptsRequired);

  const intersection = [...concepts1].filter(c => concepts2.has(c)).length;
  const union = new Set([...concepts1, ...concepts2]).size;

  return union > 0 ? Math.round((intersection / union) * 100) : 0;
}

export default {
  getArchetypeConnections,
  getTransferOpportunities,
  getLearningPathRecommendation,
  generateMasteryCelebration,
  getArchetypesByRelationship,
  calculateConceptOverlap
};

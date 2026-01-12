---
name: edu-research
description: Deep research into a specific curriculum topic with pedagogical insights. Identifies key concepts, common misconceptions, real-world phenomena, and behavioral science principles. Use after /edu:map to prepare for question generation.
allowed-tools: WebSearch, WebFetch, Read, Write, Glob
---

# Deep Topic Researcher

Performs comprehensive research on a curriculum topic to inform high-quality question generation.

## Quick Start

```
/edu:research topic="States of Matter" outcome_code=ACSSU151 year=8
```

## Input Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| topic | Yes | Topic name (e.g., "States of Matter") |
| outcome_code | Yes | ACARA outcome code (e.g., "ACSSU151") |
| year | Yes | Target year level (6-12) |

## Output Structure

Creates a research file at `.claude/knowledge/edu/research/{topic-slug}-year{year}.json`:

```json
{
  "topic": "States of Matter",
  "outcomeCode": "ACSSU151",
  "year": 8,
  "researchedAt": "2024-01-07",

  "curriculumAlignment": {
    "outcomeDescription": "Properties and behaviour of different states explained using particle model",
    "strand": "Chemical Sciences",
    "stage": "Stage 4",
    "prerequisiteOutcomes": ["ACSSU077"],
    "progressionOutcomes": ["ACSSU178"]
  },

  "keyConcepts": [
    {
      "id": "c1",
      "name": "Three states of matter",
      "description": "Solids, liquids, and gases as fundamental states",
      "vocabularyLevel": "foundational",
      "prerequisiteFor": ["c2", "c3"]
    },
    {
      "id": "c2",
      "name": "Particle model",
      "description": "Matter consists of tiny particles in constant motion",
      "vocabularyLevel": "foundational",
      "prerequisiteFor": ["c4", "c5", "c6"]
    }
  ],

  "commonMisconceptions": [
    {
      "id": "m1",
      "misconception": "Particles in a solid don't move at all",
      "correction": "Particles in solids vibrate in fixed positions",
      "prevalence": "high",
      "source": "Driver et al., 1994",
      "questionPhase": 3
    },
    {
      "id": "m2",
      "misconception": "Cold makes particles stop",
      "correction": "Particles always have some motion above absolute zero",
      "prevalence": "medium",
      "questionPhase": 3
    }
  ],

  "realWorldPhenomena": [
    {
      "id": "p1",
      "phenomenon": "Ice cream melting on a hot day",
      "concepts": ["c1", "c4", "c6"],
      "curiosityHook": "Why does ice cream melt faster outside than in the freezer?",
      "questionPhase": 2
    },
    {
      "id": "p2",
      "phenomenon": "Steam rising from hot soup",
      "concepts": ["c1", "c5", "c7"],
      "curiosityHook": "Where does the steam go when it disappears?",
      "questionPhase": 2
    }
  ],

  "scaffoldingSequence": [
    "States identification → Particle arrangement → Particle movement → Energy connection → Changes of state → Particle model application"
  ],

  "vocabularyProgression": {
    "phase1": ["solid", "liquid", "gas", "particle", "matter"],
    "phase2": ["vibrate", "arrangement", "spacing", "energy", "temperature"],
    "phase3": ["kinetic energy", "thermal energy", "compression", "expansion"],
    "phase4": ["phase transition", "latent heat", "equilibrium"]
  },

  "behavioralScience": {
    "cognitiveLoadNotes": "Introduce particle model visually before abstract descriptions",
    "engagementStrategies": [
      "Use everyday examples (ice, water, steam) before scientific terminology",
      "Allow predictions before explanations",
      "Use anomalies to create curiosity (why does ice float?)"
    ],
    "motivationFactors": [
      "Connect to cooking and food science",
      "Link to weather phenomena",
      "Relate to sports (why do balls deflate in cold?)"
    ],
    "spacedRepetitionPoints": ["c2", "c4", "c6"]
  }
}
```

## Research Process

### 1. Curriculum Deep Dive
- Verify outcome code and full description
- Identify prerequisite and progression outcomes
- Map to NSW Stage descriptors

### 2. Concept Analysis
- Break topic into atomic concepts
- Establish concept dependencies
- Create learning sequence

### 3. Misconception Research
- Search educational research databases
- Identify common student errors
- Note prevalence and correction strategies
- Cite sources (Driver, AAAS, etc.)

### 4. Phenomena Discovery
- Find real-world applications
- Create curiosity hooks
- Map phenomena to concepts

### 5. Behavioral Science Application
- Apply cognitive load theory
- Design engagement strategies
- Identify motivation factors

## Research Sources

### Misconception Databases
- **AAAS Project 2061**: http://assessment.aaas.org/topics
- **Driver et al.**: "Making Sense of Secondary Science"
- **PHET**: https://phet.colorado.edu/

### Pedagogical Research
- **Hattie**: Visible Learning research
- **Bjork**: Desirable difficulties
- **Roediger**: Testing effect research

## Related Skills

- `/edu:map` - Map curriculum before researching specific topics
- `/edu:concept-map` - Generate concept graph from research
- `/edu:generate` - Use research to generate questions

## Notes

- Research is cached and can be refreshed with `--refresh`
- Misconception sources should be academic where possible
- Phenomena should be culturally relevant to Australian students

# Short Answer Question Template

Standard format for short-answer questions following the Learning Arc framework.

## Structure

```json
{
  "questionId": "{topic-slug}-y{year}-{sequence:3}",
  "questionType": "SHORT_ANSWER",
  "stem": "Question text with **markdown** and $LaTeX$ support",
  "solution": "Model answer with key points clearly identified...",
  "hints": [
    {
      "level": 1,
      "content": "Activation hint",
      "revealsCriticalInfo": false
    },
    {
      "level": 2,
      "content": "Focus hint",
      "revealsCriticalInfo": true
    },
    {
      "level": 3,
      "content": "Guidance hint",
      "revealsCriticalInfo": true
    }
  ],
  "difficulty": 3,
  "curriculum": {...},
  "learningArc": {...},
  "pedagogy": {...}
}
```

## Stem Guidelines

### Question Types

| Type | Purpose | Example Stem |
|------|---------|--------------|
| Describe | Articulate understanding | "Describe how particles are arranged in a solid" |
| Explain | Show reasoning | "Explain why gases can be compressed" |
| Compare | Identify similarities/differences | "Compare particle movement in liquids and gases" |
| Predict | Apply knowledge to new scenario | "Predict what happens when you heat ice" |
| Justify | Support with evidence | "Justify why sweating cools you down" |

### Scaffolded Stems

**Heavily Scaffolded (Phase 1-2)**:
```
Describe the particle arrangement in a solid.

In your answer, include:
- How particles are positioned
- How particles move
- Why solids keep their shape
```

**Moderately Scaffolded (Phase 2-3)**:
```
Explain why liquids take the shape of their container.
Use the particle model in your explanation.
```

**Lightly Scaffolded (Phase 3-4)**:
```
Using the particle model, explain why ice floats in water.
```

**No Scaffold (Phase 4)**:
```
Explain how the particle model accounts for the properties of the three states of matter.
```

### Command Words

| Word | Expectation | Mark Allocation |
|------|-------------|-----------------|
| State/Name | One word/phrase | 1 mark |
| Describe | Key features | 2-3 marks |
| Explain | Reasoning with cause/effect | 3-4 marks |
| Compare | Similarities AND differences | 3-4 marks |
| Evaluate | Judgement with justification | 4-5 marks |

## Solution Guidelines

### Structure

```
Model answer:

[Clear, complete response that would receive full marks]

Key points (for AI evaluation):
- [Point 1]: [concept demonstrated]
- [Point 2]: [reasoning shown]
- [Point 3]: [vocabulary used correctly]

Accept also:
- Alternative phrasings
- Different correct approaches
- Acceptable simplifications for year level
```

### Example Solution

**Question**: Explain why you can smell perfume from across a room.

**Solution**:
```
Model answer:

Perfume contains liquid that evaporates easily. When it evaporates, the perfume
particles become a gas. Gas particles move randomly in all directions and
spread out to fill the available space. This process is called diffusion.
The perfume particles mix with air particles and eventually reach your nose,
where you smell them.

Key points:
- Evaporation: liquid to gas state change
- Gas particle movement: random, in all directions
- Diffusion: spreading from high to low concentration
- Reaches nose: explains detection of smell

Accept also:
- "The smell travels through the air" (partial credit)
- Reference to particle energy
- Explanation without using "diffusion" explicitly
```

## Short Answer Examples by Phase

### Phase 1: Foundation (Articulation)
```json
{
  "stem": "In your own words, describe how particles are arranged in a solid.",
  "solution": "Model answer:\n\nIn a solid, particles are arranged in a regular, organised pattern. They are very close together and held tightly in fixed positions. The particles vibrate (move back and forth) but stay in their positions.\n\nKey points:\n- Regular/organised arrangement\n- Close together/touching\n- Fixed positions\n- Vibrate in place\n\nAccept also:\n- 'Tightly packed'\n- 'Can't move around'\n- Diagrams showing regular arrangement"
}
```

### Phase 2: Application (Apply to Context)
```json
{
  "stem": "A drop of food colouring is added to cold water. Describe and explain what happens to the colour over the next 10 minutes.",
  "solution": "Model answer:\n\nThe colour will slowly spread through the water until it is evenly mixed. This happens because:\n1. The food colouring particles are moving randomly\n2. They bump into water particles and bounce off in different directions\n3. Over time, this random movement (diffusion) spreads the colour throughout the water\n4. The process is slow in cold water because particles move more slowly at lower temperatures\n\nKey points:\n- Colour spreads/diffuses\n- Random particle movement\n- Particles collide and change direction\n- Slow in cold water (less energy)\n\nAccept also:\n- 'The dye mixes by itself'\n- Reference to Brownian motion\n- Comparison to what would happen in warm water"
}
```

### Phase 3: Connection (Link Multiple Concepts)
```json
{
  "stem": "Using your knowledge of particles and energy, explain why wet clothes dry faster on a windy day than on a still day, even if the temperature is the same.",
  "solution": "Model answer:\n\nEvaporation happens when water particles at the surface gain enough energy to escape as gas. On a still day, water vapour builds up near the clothes, which slows down further evaporation because some particles return to the liquid.\n\nOn a windy day, the wind blows the water vapour away from the clothes. This means fewer particles return, so evaporation continues faster. The wind also increases the chance that high-energy surface particles will be removed.\n\nKey points:\n- Evaporation: surface particles escape\n- Water vapour accumulates near surface on still days\n- Wind removes water vapour\n- Creates space for more evaporation\n- Equilibrium concept (implicitly)\n\nAccept also:\n- 'Wind carries water away'\n- Reference to evaporation rate\n- Connection to drying machines"
}
```

### Phase 4: Mastery (Full Synthesis)
```json
{
  "stem": "A student says: 'Adding heat to ice makes the particles move faster, so the ice melts.' Is this explanation complete? Extend or correct it to give a full scientific explanation of what happens when ice melts.",
  "solution": "Model answer:\n\nThe student's explanation is partially correct but incomplete. Here is a more complete explanation:\n\nWhen heat is added to ice:\n1. Energy transfers to the ice particles, making them vibrate more\n2. At the melting point (0°C), particles have enough energy to break free from their fixed positions\n3. The energy breaks the bonds holding particles in the solid structure\n4. During melting, added heat breaks bonds rather than increasing temperature\n5. Once free, particles can move past each other - this is the liquid state\n\nThe student correctly identified that particles move faster, but didn't explain:\n- Why faster movement leads to state change\n- The role of breaking bonds between particles\n- That temperature stays constant during melting\n\nKey points:\n- Correct: heat increases particle movement\n- Missing: bond breaking explanation\n- Missing: energy used for state change, not temperature increase\n- Connection between movement and state change\n\nAccept also:\n- Reference to latent heat\n- Explanation of structure breakdown\n- Comparison to freezing (reverse process)"
}
```

## Hint Template for Short Answer

```json
{
  "hints": [
    {
      "level": 1,
      "content": "Think about what you already know about [concept]. What happens to particles when [condition]?",
      "revealsCriticalInfo": false
    },
    {
      "level": 2,
      "content": "Focus on [specific aspect]. Consider how [A] relates to [B]. Your answer should include [guidance without answer].",
      "revealsCriticalInfo": true
    },
    {
      "level": 3,
      "content": "The key points to include are: [partial structure]. Make sure to explain [specific requirement].",
      "revealsCriticalInfo": true
    }
  ]
}
```

## Answer Evaluation Guidelines

### For AI Evaluation
```json
{
  "evaluationCriteria": {
    "keyPoints": ["point1", "point2", "point3"],
    "requiredVocabulary": ["term1", "term2"],
    "conceptsRequired": ["concept1", "concept2"],
    "partialCreditConditions": [
      "Mentions particles but doesn't explain movement",
      "Correct process but wrong vocabulary"
    ]
  }
}
```

### Scoring Rubric (Suggested)

| Score | Description |
|-------|-------------|
| Full | All key points addressed, correct vocabulary |
| Substantial | Most key points, minor gaps |
| Partial | Some key points, significant gaps |
| Minimal | One key point or related concept |
| None | No relevant content |

## Quality Checklist

- [ ] Command word matches expected response depth
- [ ] Question is clear and unambiguous
- [ ] Model solution demonstrates full understanding
- [ ] Key points clearly identified
- [ ] Alternative correct answers noted
- [ ] Hints progress from activation to guidance
- [ ] Scaffolding appropriate for phase
- [ ] Rich content renders correctly
- [ ] Difficulty matches phase

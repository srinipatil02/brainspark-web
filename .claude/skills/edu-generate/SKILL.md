---
name: edu-generate
description: Generate 80-question learning arc sets with progressive concept building. Creates MCQ and short answer questions following pedagogical framework with rich content support (equations, tables, graphs). Use after /edu:research to produce curriculum-aligned question sets.
allowed-tools: Read, Write, Glob, Task
---

# Question Generator

Generates 80-question learning arc sets that methodically build student understanding through four phases: Foundation → Application → Connection → Mastery.

## Quick Start

```
/edu:generate topic="States of Matter" outcome_code=ACSSU151 year=8
```

## Input Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| topic | Yes | Topic name from curriculum map |
| outcome_code | Yes | ACARA outcome code |
| year | Yes | Target year level (6-12) |
| research_path | No | Path to research output (auto-detected if exists) |

## Output Structure

Creates questions file at `scripts/questions/{topic-slug}-year{year}-complete.json`:

**File Naming Convention:**
- `{topic-slug}-year{year}-complete.json` - New generated questions (sets 1-8)
- `{topic-slug}-year{year}-classic.json` - Migrated old questions (sets 9+)

```json
{
  "metadata": {
    "topic": "States of Matter",
    "outcomeCode": "ACSSU151",
    "year": 8,
    "questionCount": 80,
    "generatedAt": "2024-01-07",
    "version": "1.0"
  },
  "questions": [
    {
      "questionId": "states-matter-y8-001",
      "questionType": "MCQ",
      "stem": "What are the three common states of matter?",
      "mcqOptions": [
        {"id": "A", "text": "Solid, liquid, gas", "isCorrect": true, "feedback": "Correct! These are the three states we observe in everyday life."},
        {"id": "B", "text": "Hot, cold, warm", "isCorrect": false, "feedback": "These describe temperature, not states of matter."},
        {"id": "C", "text": "Heavy, light, medium", "isCorrect": false, "feedback": "These describe mass or weight, not states."},
        {"id": "D", "text": "Soft, hard, flexible", "isCorrect": false, "feedback": "These describe physical properties, not states."}
      ],
      "solution": "The three common states of matter are **solid**, **liquid**, and **gas**. Each state has different properties:\n- Solids have fixed shape and volume\n- Liquids have fixed volume but take container shape\n- Gases fill their entire container",
      "hints": [
        {"level": 1, "content": "Think about water - what forms can it take?", "revealsCriticalInfo": false},
        {"level": 2, "content": "Ice, water, and steam are examples of the three states.", "revealsCriticalInfo": true}
      ],
      "difficulty": 2,
      "estimatedTime": 60,
      "curriculum": {
        "system": "NSW Science K-10 Syllabus",
        "codes": ["ACSSU151"],
        "year": 8,
        "subject": "science",
        "strand": "Chemical Sciences"
      },
      "learningArc": {
        "phase": 1,
        "phasePosition": 1,
        "conceptsUsed": ["c1"],
        "buildsOn": [],
        "preparesFor": ["states-matter-y8-002", "states-matter-y8-003"]
      },
      "pedagogy": {
        "type": "scaffolded",
        "targetFeeling": "I can do this!"
      },
      "richContent": {
        "hasEquations": false,
        "hasTables": false,
        "hasGraphs": false,
        "hasDiagrams": false,
        "hasCode": false
      },
      "paperMetadata": {
        "section": "year8-science",
        "setId": "year8-states-of-matter-set1",
        "sequenceInPaper": 1
      },
      "status": "published"
    }
  ]
}
```

## CRITICAL: Per-Set SetId Convention

**Each set must have a unique `setId` for proper app integration.**

### SetId Format
```
{year}-{topic-slug}-set{number}
```

### Set Distribution (80 questions = 8 sets)
| Set | Questions | Phase | SetId |
|-----|-----------|-------|-------|
| 1 | Q1-10 | Foundation | `year8-states-of-matter-set1` |
| 2 | Q11-20 | Foundation | `year8-states-of-matter-set2` |
| 3 | Q21-30 | Application | `year8-states-of-matter-set3` |
| 4 | Q31-40 | Application | `year8-states-of-matter-set4` |
| 5 | Q41-50 | Connection | `year8-states-of-matter-set5` |
| 6 | Q51-60 | Connection | `year8-states-of-matter-set6` |
| 7 | Q61-70 | Mastery | `year8-states-of-matter-set7` |
| 8 | Q71-80 | Mastery | `year8-states-of-matter-set8` |

### Assignment Logic
```javascript
// Assign setId based on question index (0-79)
const setNumber = Math.floor(questionIndex / 10) + 1;
const setId = `year${year}-${topicSlug}-set${setNumber}`;
const sequenceInPaper = (questionIndex % 10) + 1;

question.paperMetadata = {
  section: `year${year}-science`,
  setId: setId,
  sequenceInPaper: sequenceInPaper
};
```

### Why Per-Set SetIds?
- **Scalability**: Can add more sets without breaking existing ones
- **Direct Query**: App queries exactly the questions it needs
- **Future-Proof**: Classic/migrated questions can use sets 9+

## Learning Arc Structure (80 Questions)

### Phase 1: FOUNDATION (Q1-20)
**Goal**: Build vocabulary, confidence, core understanding
- **Format**: 75% MCQ (15), 25% Short Answer (5)
- **Difficulty**: Level 2
- **Pedagogy**: Scaffolded (12), Socratic (5), Phenomenon (2), Misconception (1)
- **Target Feeling**: "I can do this!"

### Phase 2: APPLICATION (Q21-40)
**Goal**: Apply concepts, connect two ideas, real-world scenarios
- **Format**: 60% MCQ (12), 40% Short Answer (8)
- **Difficulty**: Level 2-3
- **Pedagogy**: Scaffolded (8), Phenomenon (8), Socratic (2), Misconception (2)
- **Target Feeling**: "This is how it works in real life!"

### Phase 3: CONNECTION (Q41-60)
**Goal**: Link concepts, challenge misconceptions, deepen understanding
- **Format**: 40% MCQ (8), 60% Short Answer (12)
- **Difficulty**: Level 3-4
- **Pedagogy**: Misconception (8), Socratic (2), Phenomenon (6), Scaffolded (4)
- **Target Feeling**: "Aha! Now I really understand!"

### Phase 4: MASTERY (Q61-80)
**Goal**: Synthesize, predict, explain complex scenarios
- **Format**: 25% MCQ (5), 75% Short Answer (15)
- **Difficulty**: Level 4
- **Pedagogy**: Socratic (8), Misconception (6), Phenomenon (4), Scaffolded (2)
- **Target Feeling**: "I can figure out new problems!"

## Generation Process

### 1. Load Research
Load topic research from `/edu:research` output for:
- Concept map with dependencies
- Misconceptions to address
- Phenomena to incorporate
- Vocabulary progression

### 2. Plan Question Distribution
Create generation plan:
```
Phase 1: Q1-20 (Foundation)
  - MCQ: 15 (concepts: c1, c2, c3)
  - Short: 5 (concepts: c1, c2)

Phase 2: Q21-40 (Application)
  - MCQ: 12 (phenomena: p1, p2, p3)
  - Short: 8 (concepts: c4, c5, c6)

Phase 3: Q41-60 (Connection)
  - MCQ: 8 (misconceptions: m1, m2)
  - Short: 12 (synthesis: c1+c4, c2+c5)

Phase 4: Q61-80 (Mastery)
  - MCQ: 5 (complex scenarios)
  - Short: 15 (prediction, explanation)
```

### 3. Parallel Generation
Spawn 4 question-generator agents (one per phase):
- Each generates 20 questions
- Pass concept threading requirements
- Ensure pedagogy distribution

### 4. Orchestration
Orchestrator ensures:
- Concept threading across phases
- Difficulty progression
- Format distribution
- No duplicate questions

### 5. Assembly
Combine all 80 questions:
- Sort by phase and position
- Verify threading integrity
- Add cross-references

## Rich Content Formatting

### Mathematical Equations (KaTeX)
```markdown
Calculate the kinetic energy using $KE = \frac{1}{2}mv^2$ where:
- Mass $m = 5$ kg
- Velocity $v = 10$ m/s

$$KE = \frac{1}{2} \times 5 \times 10^2 = 250 \text{ J}$$
```

### Tables
```markdown
| State | Arrangement | Movement | Volume |
|-------|-------------|----------|--------|
| Solid | Regular | Vibrate | Fixed |
| Liquid | Random | Slide | Fixed |
| Gas | Random | Free | Variable |
```

### Chemical Equations
```markdown
The balanced equation for water formation:
$$\ce{2H2 + O2 -> 2H2O}$$
```

## Pedagogy Types

### Scaffolded Questions
Build systematically from simple to complex:
```
Q1: What are the three states? [recall]
Q2: Which state has fixed positions? [apply Q1]
Q3: Describe particle arrangement in solids. [articulate Q2]
```

### Phenomenon Questions
Start with observation, explain with concepts:
```
"You leave ice cream on the counter. Within 10 minutes, it's liquid.
Using the particle model, explain what happened."
```

### Misconception Questions
Challenge common errors:
```
"A student says: 'When water evaporates, the particles disappear.'
Is this correct? Explain your answer using the particle model."
```

### Socratic Questions
Prompt deeper reasoning:
```
"Why can't you walk through a wall if both you and the wall
are made of mostly empty space?"
```

## Concept Threading

### Forward References
Early questions hint at later concepts:
```
Q5: "Particles have energy even in solids..."
→ Prepares for Q30 where energy is fully explained
```

### Backward References
Later questions explicitly build on earlier:
```
Q45: "Remember how particles are spaced in gases (Q8)?
Now apply that to explain why gases compress easily."
```

### Spaced Repetition
Key concepts revisited every 15-20 questions:
```
Particle spacing: Q3 → Q18 → Q35 → Q52 → Q70
```

## Quality Checks

Each question must pass:
- [ ] Schema validation (Zod)
- [ ] LaTeX syntax valid (if equations)
- [ ] Concept threading complete
- [ ] Difficulty matches phase
- [ ] Format matches distribution
- [ ] Hints progressive (don't reveal answer)
- [ ] Solution explains reasoning

## Related Skills

- `/edu:map` - Map curriculum before generation
- `/edu:research` - Research topic deeply first
- `/edu:concept-map` - Create concept dependencies
- `/edu:validate` - Validate generated questions
- `/edu:upload` - Upload to Firestore

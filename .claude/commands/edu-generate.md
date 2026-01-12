---
description: Generate 80-question learning arc sets with progressive concept building
argument-hint: topic="States of Matter" outcome_code=ACSSU151 year=8
allowed-tools: Read, Write, Glob, Task
---

# Question Generator

Generate 80 questions for topic "$1", outcome code $2, year $3.

## Arguments

- **topic** ($1): Topic name (in quotes if multi-word)
- **outcome_code** ($2): ACARA outcome code (e.g., ACSSU151)
- **year** ($3): Target year level (6-12)

## Learning Arc Structure (80 Questions)

### Phase 1: FOUNDATION (Q1-20)
- 75% MCQ (15), 25% Short Answer (5)
- Difficulty: Level 2
- Target feeling: "I can do this!"

### Phase 2: APPLICATION (Q21-40)
- 60% MCQ (12), 40% Short Answer (8)
- Difficulty: Level 2-3
- Target feeling: "This is how it works in real life!"

### Phase 3: CONNECTION (Q41-60)
- 40% MCQ (8), 60% Short Answer (12)
- Difficulty: Level 3-4
- Target feeling: "Aha! Now I really understand!"

### Phase 4: MASTERY (Q61-80)
- 25% MCQ (5), 75% Short Answer (15)
- Difficulty: Level 4
- Target feeling: "I can figure out new problems!"

## Output

Create questions file at `scripts/questions/{topic-slug}-year$3-questions.json`.

See `.claude/skills/edu-generate/SKILL.md` for detailed schema and pedagogy types.

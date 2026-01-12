---
description: Generate 120 WORKED_SOLUTION mathematics questions with step-by-step AI grading
argument-hint: topic="Linear Equations" outcome_code=ACMNA194 year=8
allowed-tools: Read, Write, Glob, Task
---

# Mathematics WORKED_SOLUTION Generator

Generate **120 WORKED_SOLUTION math questions** (12 sets of 10) for topic "$1", outcome code $2, year $3.

## Arguments

- **topic** ($1): Math topic in quotes (e.g., "Linear Equations")
- **outcome_code** ($2): ACARA code (e.g., ACMNA194)
- **year** ($3): Year level (7-12)

## Output: 120 Questions (12 Sets)

| Phase | Sets | Questions | Difficulty |
|-------|------|-----------|------------|
| Foundation | 1-3 | Q1-30 | Level 1-2 |
| Application | 4-6 | Q31-60 | Level 2-3 |
| Connection | 7-9 | Q61-90 | Level 3 |
| Mastery | 10-12 | Q91-120 | Level 3-4 |

## WORKED_SOLUTION Format

Each question includes:

- **workedSolutionConfig**: AI grading guidance
- **expectedAnswers**: Equivalent forms (e.g., ["5", "x=5", "x = 5"])
- **encouragingHints**: Socratic hints that guide without revealing
- **sampleSolutions**: Multiple valid approaches
- **gradingGuidance**: Common errors and partial credit rules

## Difficulty Progression

| Level | Type | Steps | Example |
|-------|------|-------|---------|
| 1 | One-step | 1 | `2x = 10` |
| 2 | Two-step | 2 | `3x + 5 = 14` |
| 3 | Brackets/Fractions | 2-3 | `3(x + 2) = 15` |
| 4 | Complex/Word Problems | 3-4 | `4(x - 2) = 2x + 6` |

## Output File

Creates: `scripts/questions/{topic-slug}-year$3-complete.json`

## Key Features

1. **120 questions** organized in 12 sets for comprehensive coverage
2. **AI Grading Guidance**: Each question tells AI how to evaluate working
3. **Equivalent Forms**: Accept "5", "x=5", "x = 5" as correct
4. **Socratic Hints**: Never give answers, guide thinking
5. **Step Validation**: Minimum work lines per difficulty
6. **Learning Arc**: buildsOn/preparesFor for concept threading

See `.claude/skills/math-generate/SKILL.md` for full schema and examples.

---
description: End-to-end educational content generation pipeline
argument-hint: year=8 subject=science topic="States of Matter"
allowed-tools: WebSearch, WebFetch, Read, Write, Glob, Task, Bash
---

# Full Generation Pipeline

Run complete pipeline for year $1, subject $2, topic "$3".

## Arguments

- **year** ($1): Target year level (6-12)
- **subject** ($2): Subject area (science, mathematics, english)
- **topic** ($3): Specific topic to generate (in quotes if multi-word)

## Pipeline Steps

Execute these steps in sequence:

### Step 1: Curriculum Mapping
Check if curriculum map exists at `.claude/knowledge/edu/curricula/$2-year$1.json`.
If not, run curriculum mapping for year $1, subject $2.

### Step 2: Topic Research
Research topic "$3" for year $1 to gather:
- Key concepts and dependencies
- Common misconceptions
- Real-world phenomena
- Vocabulary progression

### Step 3: Question Generation
Generate 80 questions following the learning arc:
- Phase 1: Foundation (Q1-20)
- Phase 2: Application (Q21-40)
- Phase 3: Connection (Q41-60)
- Phase 4: Mastery (Q61-80)

### Step 4: Validation
Validate all generated questions for:
- Schema compliance
- Content formatting
- Pedagogy requirements

### Step 5: Summary
Provide final summary with:
- Questions generated count
- Validation status
- Files created
- Next steps (upload instructions)

See `.claude/skills/edu-full/SKILL.md` for detailed workflow.

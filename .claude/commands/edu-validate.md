---
description: Validate generated question sets against schema and pedagogy requirements
argument-hint: path="scripts/questions/states-matter.json"
allowed-tools: Read, Glob, Grep
---

# Question Validator

Validate the question set at $1.

## Arguments

- **path** ($1): Path to questions JSON file

## Validation Layers

### 1. Schema Validation
- All required fields present
- Correct field types
- Valid enum values (questionType, difficulty, etc.)

### 2. Content Validation
- LaTeX/KaTeX syntax valid
- Markdown formatting correct
- No broken links or references

### 3. Pedagogy Validation
- Learning arc phases balanced (20 questions each)
- Concept threading complete
- Difficulty progression correct
- Hints don't reveal answers

### 4. Presentation Validation
- Solutions explain reasoning
- Feedback is helpful
- Questions are age-appropriate

## Output

Provide validation report with:
- Pass/fail status
- Issues found by category
- Recommendations for fixes
- Questions flagged for human review

See `.claude/skills/edu-validate/SKILL.md` for detailed criteria.

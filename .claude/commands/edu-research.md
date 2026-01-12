---
description: Deep research into a specific curriculum topic with pedagogical insights
argument-hint: topic="States of Matter" year=8
allowed-tools: WebSearch, WebFetch, Read, Write, Glob
---

# Topic Researcher

Research topic "$1" for year $2 with pedagogical insights.

## Arguments

- **topic** ($1): Topic name from curriculum map (in quotes if multi-word)
- **year** ($2): Target year level (6-12)

## Process

1. **Concept Identification**: Identify 6-10 key concepts that build sequentially
2. **Misconception Research**: Find common student misconceptions for this topic
3. **Phenomenon Collection**: Gather real-world phenomena that demonstrate concepts
4. **Vocabulary Mapping**: Create vocabulary progression from basic to technical
5. **Behavioral Science**: Apply learning science principles

## Output

Create research document at `.claude/knowledge/edu/research/{topic-slug}-year$2.json` with:
- Key concepts with dependencies
- Common misconceptions with correction strategies
- Real-world phenomena for phenomenon-based questions
- Vocabulary progression
- Pedagogical recommendations

See `.claude/skills/edu-research/SKILL.md` for detailed schema.

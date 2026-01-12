---
description: Map NSW curriculum structure for any year (6-12) and subject
argument-hint: year=8 subject=science
allowed-tools: WebSearch, WebFetch, Read, Write, Glob
---

# NSW Curriculum Mapper

Map the NSW curriculum structure for year $1, subject $2.

## Arguments

- **year** ($1): Target year level (6-12)
- **subject** ($2): Subject area (science, mathematics, english)

## Process

1. **Research Phase**: Search NSW NESA syllabus documents for year $1, subject $2
2. **Structure Extraction**: Identify strands, topics, and ACARA outcome codes
3. **Dependency Analysis**: Identify prerequisite topics and learning progressions
4. **Output Generation**: Create structured JSON at `.claude/knowledge/edu/curricula/$2-year$1.json`

## Research Sources

Use WebSearch and WebFetch to research the official curriculum from:
- https://educationstandards.nsw.edu.au/wps/portal/nesa/k-10/learning-areas
- https://www.australiancurriculum.edu.au/

## Output Structure

Create a JSON file with:
- year, subject, syllabus name
- strands array with topics
- Each topic: id, name, outcomeCode (ACSSU/ACMNA/ACELA format), description
- crossCurricularLinks

See `.claude/skills/edu-map/SKILL.md` for detailed schema.

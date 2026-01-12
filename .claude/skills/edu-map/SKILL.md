---
name: edu-map
description: Map NSW curriculum structure for any year (6-12) and subject. Creates curriculum tree with strands, topics, outcomes, and ACARA codes. Use when starting content generation for a new subject/year combination or exploring curriculum structure.
allowed-tools: WebSearch, WebFetch, Read, Write, Glob
---

# Curriculum Mapper

Maps the complete NSW curriculum structure for a given year and subject, producing a structured output that drives question generation.

## Quick Start

```
/edu:map year=8 subject=science
```

## Input Parameters

| Parameter | Required | Values | Description |
|-----------|----------|--------|-------------|
| year | Yes | 6-12 | Target year level |
| subject | Yes | science, mathematics, english | Subject area |
| syllabus | No | NSW (default) | Curriculum framework |

## Output Structure

Creates a curriculum map file at `.claude/knowledge/edu/curricula/{subject}-year{year}.json`:

```json
{
  "year": 8,
  "subject": "science",
  "syllabus": "NSW Science K-10 Syllabus",
  "strands": [
    {
      "name": "Chemical Sciences",
      "topics": [
        {
          "id": "states-of-matter",
          "name": "States of Matter",
          "outcomeCode": "ACSSU151",
          "description": "Properties and behaviour of different states of matter explained by particle model",
          "keyConceptCount": 8,
          "prerequisiteTopics": [],
          "suggestedDuration": "3 weeks"
        }
      ]
    }
  ],
  "crossCurricularLinks": [
    {
      "topic": "states-of-matter",
      "links": ["mathematics/measurement", "technology/materials"]
    }
  ]
}
```

## Process

1. **Research Phase**: Search NSW Education Standards Authority (NESA) syllabus documents
2. **Structure Extraction**: Identify strands, topics, and outcome codes
3. **Outcome Mapping**: Map each topic to ACARA outcome codes (ACSSU, ACMNA, ACELA)
4. **Dependency Analysis**: Identify prerequisite topics and learning progressions
5. **Output Generation**: Create structured JSON for downstream skills

## NSW Curriculum Sources

- **NESA Syllabus**: https://educationstandards.nsw.edu.au/wps/portal/nesa/k-10/learning-areas
- **ACARA**: https://www.australiancurriculum.edu.au/
- **Science K-10**: Version 9.0 curriculum framework

## Outcome Code Formats

| Subject | Code Format | Example |
|---------|-------------|---------|
| Science | ACSSU### | ACSSU151 (States of Matter) |
| Mathematics | ACMNA### | ACMNA183 (Ratios and rates) |
| English | ACELA### | ACELA1531 (Text structure) |

## Example: Year 8 Science

```json
{
  "year": 8,
  "subject": "science",
  "strands": [
    {
      "name": "Chemical Sciences",
      "topics": [
        {"id": "states-of-matter", "outcomeCode": "ACSSU151"},
        {"id": "elements-compounds", "outcomeCode": "ACSSU152"},
        {"id": "chemical-reactions", "outcomeCode": "ACSSU225"}
      ]
    },
    {
      "name": "Earth and Space Sciences",
      "topics": [
        {"id": "rocks-minerals", "outcomeCode": "ACSSU153"}
      ]
    },
    {
      "name": "Physical Sciences",
      "topics": [
        {"id": "energy", "outcomeCode": "ACSSU155"}
      ]
    },
    {
      "name": "Biological Sciences",
      "topics": [
        {"id": "cells", "outcomeCode": "ACSSU149"},
        {"id": "body-systems", "outcomeCode": "ACSSU150"}
      ]
    }
  ]
}
```

## Related Skills

- `/edu:research` - Deep dive into a specific topic from this map
- `/edu:concept-map` - Create concept dependencies for question threading
- `/edu:generate` - Generate questions for mapped topics

## Notes

- Curriculum structures are cached in `.claude/knowledge/edu/curricula/`
- Re-run with `--refresh` to update cached data
- Cross-curricular links help identify interdisciplinary question opportunities

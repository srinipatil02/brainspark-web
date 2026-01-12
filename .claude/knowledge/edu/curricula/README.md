# Curriculum Cache Directory

This directory stores mapped curriculum structures for quick reference during question generation.

## Supported Subjects

| Subject | ACARA Code Pattern | Example | Syllabus |
|---------|-------------------|---------|----------|
| Science | ACSSU### | ACSSU151 | NSW Science K-10 |
| Mathematics | ACMNA### | ACMNA188 | NSW Mathematics K-10 |
| English | ACELA#### | ACELA1518 | NSW English K-10 |
| History | ACHHS### | ACHHS144 | NSW History K-10 |
| Geography | ACHGK### | ACHGK051 | NSW Geography K-10 |
| PDHPE | ACPPS### | ACPPS073 | NSW PDHPE K-10 |

## File Naming Convention

```
{subject}-year{year}.json
```

Examples:
- `science-year8.json`
- `mathematics-year7.json`
- `english-year9.json`
- `history-year8.json`

## File Structure

Each curriculum file follows this structure:

```json
{
  "metadata": {
    "system": "NSW Science K-10 Syllabus",
    "version": "2018",
    "year": 8,
    "subject": "science",
    "stage": "Stage 4",
    "mappedAt": "2024-01-07T10:00:00Z"
  },
  "strands": [
    {
      "name": "Chemical Sciences",
      "topics": [
        {
          "name": "States of Matter",
          "outcomeCode": "ACSSU151",
          "description": "Properties and behaviour of matter...",
          "keyConcepts": ["particle model", "states", "changes of state"],
          "estimatedHours": 8
        }
      ]
    }
  ],
  "crossCurricularPriorities": [
    "Sustainability",
    "Aboriginal and Torres Strait Islander histories"
  ],
  "generalCapabilities": [
    "Literacy",
    "Numeracy",
    "Critical and Creative Thinking"
  ]
}
```

## Subject-Specific Strands

### Science (Years 6-10)
- Biological Sciences
- Chemical Sciences
- Earth and Space Sciences
- Physical Sciences

### Mathematics (Years 6-10)
- Number and Algebra
- Measurement and Geometry
- Statistics and Probability

### English (Years 6-10)
- Language
- Literature
- Literacy

### History (Years 7-10)
- Historical Knowledge and Understanding
- Historical Skills

### Geography (Years 7-10)
- Geographical Knowledge and Understanding
- Geographical Inquiry and Skills

## Usage

Files are created by `/edu:map` and read by:
- `/edu:research` (to find topic outcomes)
- `/edu:generate` (to align questions to curriculum)
- `/edu:validate` (to verify curriculum codes)

## Refreshing Curriculum

Curriculum structures are cached for efficiency. To refresh:
1. Delete the relevant file
2. Re-run `/edu:map` for that year/subject

## Example Commands

```bash
# Map Year 8 Science curriculum
/edu:map year=8 subject=science

# Map Year 7 Mathematics curriculum
/edu:map year=7 subject=mathematics

# Map Year 9 English curriculum
/edu:map year=9 subject=english

# Map Year 8 History curriculum
/edu:map year=8 subject=history
```

## Typical Topics by Subject and Year

### Year 8 Science
- Cells and Microscopy (ACSSU149)
- States of Matter (ACSSU151)
- Elements and Compounds (ACSSU152)
- Chemical Reactions (ACSSU225)
- Energy Transfer (ACSSU182)
- Rocks and Minerals (ACSSU153)

### Year 8 Mathematics
- Integers and Order of Operations (ACMNA183)
- Fractions, Decimals, Percentages (ACMNA187)
- Algebraic Expressions (ACMNA190)
- Linear Equations (ACMNA194)
- Geometry and Measurement (ACMMG196)
- Statistics and Probability (ACMSP206)

### Year 8 English
- Text Structure and Features (ACELA1543)
- Grammar and Punctuation (ACELA1545)
- Vocabulary Development (ACELA1546)
- Reading Comprehension (ACELY1729)
- Persuasive Writing (ACELY1734)
- Narrative Writing (ACELT1633)

### Year 8 History
- The Western and Islamic World (ACDSEH034)
- The Asia-Pacific World (ACDSEH068)
- Expanding Contacts (ACDSEH075)

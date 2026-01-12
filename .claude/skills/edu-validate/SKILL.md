---
name: edu-validate
description: Validate generated question sets against schema, content formatting, pedagogy requirements, and presentation quality. Runs 4-layer validation pipeline and flags questions for human review. Use after /edu:generate before uploading to Firestore.
allowed-tools: Read, Write, Glob, Bash
---

# Content Validator

Validates generated question sets through a 4-layer validation pipeline ensuring schema compliance, content quality, pedagogical alignment, and beautiful presentation.

## Quick Start

```
/edu:validate questions_file=scripts/questions/states-matter-year8-questions.json
```

## Input Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| questions_file | Yes | Path to generated questions JSON |
| curriculum_code | No | ACARA code for alignment check |
| render_test | No | Run presentation validation (slower) |
| fix_auto | No | Auto-fix simple issues |

## Validation Pipeline

```
┌────────────────────────────────────────────────────────────────┐
│                    VALIDATION PIPELINE                          │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Layer 1: SCHEMA VALIDATION                                    │
│  ├─ Required fields present                                    │
│  ├─ Field types correct                                        │
│  ├─ Enum values valid                                          │
│  └─ Array lengths within bounds                                │
│                         │                                       │
│                         ▼                                       │
│  Layer 2: CONTENT VALIDATION                                   │
│  ├─ LaTeX syntax valid (KaTeX parser)                          │
│  ├─ Markdown renders without errors                            │
│  ├─ Table structure correct                                    │
│  ├─ No broken image/diagram references                         │
│  └─ MCQ has exactly one correct answer                         │
│                         │                                       │
│                         ▼                                       │
│  Layer 3: PEDAGOGICAL VALIDATION                               │
│  ├─ Curriculum alignment (ACARA codes)                         │
│  ├─ Age-appropriate vocabulary                                 │
│  ├─ Hint progression quality                                   │
│  ├─ Solution completeness                                      │
│  ├─ Learning arc coherence                                     │
│  └─ Pedagogy distribution                                      │
│                         │                                       │
│                         ▼                                       │
│  Layer 4: PRESENTATION VALIDATION                              │
│  ├─ Renders at all breakpoints                                 │
│  ├─ Equations readable at standard font size                   │
│  ├─ Tables fit mobile screens                                  │
│  └─ No overflow or clipping                                    │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

## Layer 1: Schema Validation

Uses Zod schema from `src/schemas/questionSchema.ts`:

### Required Fields
- questionId (string, pattern: `^[a-z0-9-]+$`)
- questionType (enum: MCQ, SHORT_ANSWER, EXTENDED_RESPONSE)
- stem (string, 20-2000 chars)
- solution (string, 50-3000 chars)
- hints (array, 2-3 items)
- difficulty (number, 1-5)
- curriculum (object with required fields)
- learningArc (object with required fields)
- status (enum: draft, published)

### MCQ-Specific
- mcqOptions (array, exactly 4 items)
- Each option: id (A/B/C/D), text, isCorrect, feedback
- Exactly ONE option with isCorrect: true

### Error Examples
```
❌ ERROR [Q23]: Missing required field 'solution'
❌ ERROR [Q45]: mcqOptions has 3 items, expected 4
❌ ERROR [Q67]: difficulty value '6' exceeds maximum of 5
```

## Layer 2: Content Validation

### LaTeX Validation
Parses all equations using KaTeX:
```
✓ PASS: $E = mc^2$
✓ PASS: $$\frac{a}{b}$$
❌ FAIL: $\frac{a}{b$ (unclosed brace)
❌ FAIL: $$\unknowncommand$$ (unknown command)
```

### Markdown Validation
```
✓ PASS: **bold**, *italic*, `code`
✓ PASS: Tables with proper alignment
❌ FAIL: Unclosed bold **text
❌ FAIL: Broken link [text](
```

### MCQ Logic Validation
```
✓ PASS: Exactly 1 correct answer
❌ FAIL: 0 correct answers
❌ FAIL: 2+ correct answers
❌ FAIL: Duplicate option text
```

## Layer 3: Pedagogical Validation

### Curriculum Alignment
- Verify outcome codes exist and are current
- Check strand/subject alignment
- Validate year level appropriateness

### Vocabulary Check
Age-appropriate vocabulary for target year:
```
Year 8 Science:
✓ ALLOW: particle, energy, temperature, solid, liquid, gas
⚠ WARN: kinetic (define on first use)
❌ FLAG: entropy, enthalpy, intermolecular (too advanced)
```

### Hint Quality
```
✓ PASS: Level 1 doesn't reveal answer
✓ PASS: Level 2 narrows focus appropriately
✓ PASS: Level 3 guides to answer
❌ FAIL: Level 1 reveals the answer directly
❌ FAIL: Hints don't progress in helpfulness
```

### Solution Quality
```
✓ PASS: Explains reasoning, not just answer
✓ PASS: Uses appropriate vocabulary
✓ PASS: Connects to concepts
❌ FAIL: Just states "The answer is A"
❌ FAIL: Too brief (< 50 chars)
```

### Learning Arc Validation
```
✓ PASS: Phase distribution correct (20/20/20/20)
✓ PASS: Difficulty progression smooth
✓ PASS: Concept threading complete
❌ FAIL: Phase 4 has difficulty 2 (too easy)
❌ FAIL: Q45 has no buildsOn references
```

### Pedagogy Distribution
Target: Scaffolded 26, Phenomenon 20, Misconception 17, Socratic 17
```
✓ PASS: Within ±3 tolerance
⚠ WARN: Scaffolded at 30 (slightly high)
❌ FAIL: Misconception at 5 (far below target 17)
```

## Layer 4: Presentation Validation

### Equation Rendering
```
✓ PASS: Equation renders at 16px base font
✓ PASS: Block equations centered
❌ FAIL: Equation overflows container at 320px width
```

### Table Rendering
```
✓ PASS: Table scrolls horizontally on mobile
✓ PASS: Headers visible when scrolling
❌ FAIL: Table clips at 320px width
```

### General Layout
```
✓ PASS: No horizontal overflow
✓ PASS: Touch targets ≥ 44px
✓ PASS: Color contrast WCAG AA
❌ FAIL: Text too small on mobile (< 14px)
```

## Output: Validation Report

```json
{
  "validationReport": {
    "file": "scripts/questions/states-matter-year8-questions.json",
    "timestamp": "2024-01-07T10:30:00Z",
    "summary": {
      "totalQuestions": 80,
      "passed": 76,
      "warnings": 3,
      "errors": 1,
      "status": "NEEDS_REVIEW"
    },
    "layers": {
      "schema": {"passed": 80, "failed": 0},
      "content": {"passed": 79, "failed": 1},
      "pedagogy": {"passed": 77, "warnings": 3},
      "presentation": {"passed": 80, "failed": 0}
    },
    "issues": [
      {
        "questionId": "states-matter-y8-045",
        "layer": "content",
        "severity": "error",
        "message": "Invalid LaTeX: unclosed brace in equation",
        "location": "stem",
        "autoFixable": true,
        "suggestedFix": "Change '$\\frac{a}{b$' to '$\\frac{a}{b}$'"
      },
      {
        "questionId": "states-matter-y8-023",
        "layer": "pedagogy",
        "severity": "warning",
        "message": "Vocabulary 'intermolecular' may be too advanced for Year 8",
        "location": "stem",
        "autoFixable": false,
        "suggestedFix": "Consider 'forces between particles' instead"
      }
    ],
    "humanReviewFlags": [
      {
        "questionId": "states-matter-y8-067",
        "reason": "Complex scientific accuracy check needed",
        "priority": "high"
      }
    ],
    "distributions": {
      "mcq": 40,
      "shortAnswer": 40,
      "pedagogy": {
        "scaffolded": 26,
        "phenomenon": 20,
        "misconception": 17,
        "socratic": 17
      }
    }
  }
}
```

## Auto-Fix Capabilities

With `fix_auto=true`, can automatically fix:
- LaTeX syntax errors (missing braces, etc.)
- Markdown formatting issues
- Missing optional fields (add defaults)
- Question ID format issues

Cannot auto-fix:
- Vocabulary appropriateness
- Scientific accuracy
- Hint quality
- Solution completeness

## Human Review Flags

Questions flagged for human review when:
- Scientific accuracy uncertain
- Vocabulary appropriateness unclear
- Pedagogy assignment questionable
- Multiple borderline issues

## Related Skills

- `/edu:generate` - Generate questions (run validate after)
- `/edu:upload` - Upload validated questions to Firestore
- `/edu:full` - Full pipeline includes validation

## Exit Codes

- `0` - All validations passed
- `1` - Warnings only (can proceed)
- `2` - Errors found (must fix before upload)

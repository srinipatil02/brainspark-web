---
name: math-generate
description: Generate WORKED_SOLUTION mathematics questions with step-by-step AI grading. Creates progressive difficulty sets for algebra, geometry, and other math topics. Questions include encouraging Socratic hints, grading guidance for AI, and equivalent answer forms.
allowed-tools: Read, Write, Glob, Task
---

# Mathematics Question Generator

Generates WORKED_SOLUTION mathematics questions that evaluate student **process** not just final answers. Questions guide AI grading to assess step-by-step working, identify common errors, and provide constructive feedback.

## Quick Start

```
/math:generate topic="Linear Equations" outcome_code=ACMNA194 year=8
```

## Input Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| topic | Yes | Math topic (e.g., "Linear Equations", "Quadratic Functions") |
| outcome_code | Yes | ACARA/curriculum code |
| year | Yes | Target year level (7-12) |
| count | No | Number of questions (default: 120) |
| difficulty_range | No | e.g., "1-4" (default: progressive) |

## Total Output: 120 Questions (12 Sets)

Each topic generates **120 WORKED_SOLUTION questions** organized into **12 sets of 10**:

| Phase | Sets | Questions | Difficulty | Focus |
|-------|------|-----------|------------|-------|
| **Foundation** | 1-3 | Q1-30 | Level 1-2 | Build core technique, confidence |
| **Application** | 4-6 | Q31-60 | Level 2-3 | Varied examples, real-world |
| **Connection** | 7-9 | Q61-90 | Level 3 | Combine concepts, multiple methods |
| **Mastery** | 10-12 | Q91-120 | Level 3-4 | Complex equations, word problems |

## WORKED_SOLUTION Question Schema

Every math question MUST follow this structure:

```json
{
  "questionId": "linear-eq-y8-001",
  "questionType": "WORKED_SOLUTION",
  "stem": "Solve for x:\n\n$$2x = 10$$\n\nShow your working.",
  "solution": "**Solution:**\n\nDivide both sides by 2:\n$$\\frac{2x}{2} = \\frac{10}{2}$$\n$$x = 5$$\n\n**Answer: x = 5**\n\n**Check:** $2 \\times 5 = 10$ ✓",
  "hints": [
    {"level": 1, "content": "What operation is being done to x?", "revealsCriticalInfo": false},
    {"level": 2, "content": "To undo multiplication, use division.", "revealsCriticalInfo": false},
    {"level": 3, "content": "Divide both sides by 2", "revealsCriticalInfo": true}
  ],
  "encouragingHints": [
    {
      "level": 1,
      "content": "This is a one-step equation - just one operation to find x!",
      "encouragement": "You've got this - simpler than it looks!",
      "questionPrompt": "What's being done to x in this equation?"
    },
    {
      "level": 2,
      "content": "Whatever you do to one side, do to the other to keep balanced.",
      "encouragement": "Think of it like a balance scale!",
      "questionPrompt": "If 2x means '2 times x', what undoes multiplication?"
    },
    {
      "level": 3,
      "content": "Division undoes multiplication. Divide both sides by 2.",
      "encouragement": "You're learning inverse operations - a key skill!",
      "questionPrompt": "What is 10 divided by 2?"
    }
  ],
  "workedSolutionConfig": {
    "startingExpression": "2x = 10",
    "expectedAnswers": ["5", "x = 5", "x=5", "x= 5", "x =5", "5.0", "x = 5.0"],
    "gradingGuidance": "One-step equation. Accept answer with/without 'x ='. Student should show division by 2. Full credit for correct answer with minimal working. Partial credit if setup correct but arithmetic error.",
    "sampleSolutions": [
      "2x = 10\n2x ÷ 2 = 10 ÷ 2\nx = 5",
      "2x = 10\nx = 10/2\nx = 5"
    ],
    "minimumWorkLines": 1,
    "topic": "linear-equations",
    "year": 8,
    "keyConcepts": ["inverse operations", "division", "solving equations"]
  },
  "difficulty": 1,
  "estimatedTime": 60,
  "curriculum": {...},
  "learningArc": {...},
  "pedagogy": {...},
  "richContent": {...},
  "paperMetadata": {...},
  "status": "published"
}
```

## CRITICAL: workedSolutionConfig

This is the heart of math question grading. EVERY math question MUST include:

### 1. startingExpression
The equation/expression displayed as Step 1 in the UI:
```json
"startingExpression": "3x + 5 = 11"
```

### 2. expectedAnswers (Equivalent Forms)
**CRITICAL**: Include ALL valid representations of the answer:
```json
"expectedAnswers": [
  "4",           // Just the number
  "x = 4",       // With variable
  "x=4",         // No spaces
  "x= 4",        // Space after equals
  "x =4",        // Space before equals
  "4.0",         // Decimal form
  "x = 4.0",     // Decimal with variable
  "4/1",         // Fraction form (if applicable)
  "\\frac{4}{1}" // LaTeX fraction (if applicable)
]
```

### 3. gradingGuidance
Instructions for AI grader on how to evaluate working:
```json
"gradingGuidance": "Two-step equation. Student should: (1) Subtract 5 from both sides to get 2x = 8, (2) Divide by 2 to get x = 4. Award partial credit for correct first step even if second step has error. Common errors: wrong order of operations, sign errors."
```

### 4. sampleSolutions
Multiple valid approaches for AI to recognize:
```json
"sampleSolutions": [
  "Isolate x term first:\n2x + 3 = 11\n2x = 8\nx = 4",
  "Alternative notation:\n2x + 3 = 11\n2x + 3 - 3 = 11 - 3\n2x = 8\n2x/2 = 8/2\nx = 4"
]
```

### 5. minimumWorkLines
How many steps student must show:
```json
"minimumWorkLines": 2  // For two-step equations
```

### 6. keyConcepts
Tags for what the question tests:
```json
"keyConcepts": ["inverse operations", "two-step equations", "order of operations"]
```

## Encouraging Hints (Socratic Style)

Math hints should NEVER give the answer directly. They guide thinking:

### Level 1: Prompt Thinking
```json
{
  "level": 1,
  "content": "Two-step equations need two operations. What should you undo first?",
  "encouragement": "You've mastered one-step equations - this is just two of those!",
  "questionPrompt": "Looking at 2x + 3 = 11, which part should you deal with first?"
}
```

### Level 2: Guide Strategy
```json
{
  "level": 2,
  "content": "Work 'outside in' - deal with addition/subtraction before multiplication/division.",
  "encouragement": "This is like reverse order of operations!",
  "questionPrompt": "If you subtract 3 from both sides, what do you get?"
}
```

### Level 3: Almost There
```json
{
  "level": 3,
  "content": "After subtracting 3: 2x = 8. Now you have a one-step equation!",
  "encouragement": "You've turned a hard problem into an easy one!",
  "questionPrompt": "What is 8 divided by 2?"
}
```

## Difficulty Progression

### Level 1: One-Step Equations
- Operations: single addition, subtraction, multiplication, or division
- Examples: `x + 5 = 12`, `3x = 15`, `x/4 = 3`
- Time: ~60 seconds
- Steps: 1

### Level 2: Two-Step Equations
- Operations: combination of two operations
- Examples: `2x + 3 = 11`, `5x - 7 = 18`
- Time: ~90 seconds
- Steps: 2

### Level 3: Brackets or Fractions
- Operations: distributive law, clearing fractions
- Examples: `3(x + 2) = 15`, `x/3 + 2 = 5`
- Time: ~120 seconds
- Steps: 2-3

### Level 4: Variables Both Sides / Complex
- Operations: collecting like terms, multi-step
- Examples: `3x + 5 = x + 13`, `4(x - 2) = 2x + 6`
- Time: ~150-180 seconds
- Steps: 3-4

## Topic Templates

### Linear Equations (ACMNA194)
```
Progression:
1. One-step (×, ÷, +, -)
2. Two-step (combine operations)
3. Brackets (distributive law)
4. Variables both sides
5. Fractions
6. Word problems
```

### Quadratic Equations (ACMNA296)
```
Progression:
1. Factorising simple quadratics
2. Solving by factorisation
3. Using quadratic formula
4. Completing the square
5. Word problems
```

### Simultaneous Equations (ACMNA237)
```
Progression:
1. Substitution method (simple)
2. Substitution method (complex)
3. Elimination method
4. Mixed methods
5. Word problems
```

## Learning Arc Structure (120 Questions = 12 Sets)

### Phase Distribution
| Phase | Sets | Questions | Difficulty | Target Feeling |
|-------|------|-----------|------------|----------------|
| **Foundation** | 1-3 | Q1-30 | Level 1-2 | "I can do this!" |
| **Application** | 4-6 | Q31-60 | Level 2-3 | "This is how it works in real problems!" |
| **Connection** | 7-9 | Q61-90 | Level 3 | "I can use multiple methods!" |
| **Mastery** | 10-12 | Q91-120 | Level 3-4 | "I can solve anything!" |

### Per-Set Structure (10 Questions Each)
| Position | Difficulty | Type |
|----------|------------|------|
| 1-2 | Level 1-2 | Core technique |
| 3-5 | Level 2 | Varied examples |
| 6-8 | Level 2-3 | Combined concepts |
| 9-10 | Level 3-4 | Complex/word problems |

### SetId Assignment
```javascript
// Assign setId based on question index (0-119)
const setNumber = Math.floor(questionIndex / 10) + 1;
const setId = `year${year}-${topicSlug}-set${setNumber}`;
const sequenceInPaper = (questionIndex % 10) + 1;
```

## Output File Format

Save to: `scripts/questions/{topic-slug}-year{year}-complete.json`

```json
{
  "metadata": {
    "topic": "Linear Equations",
    "topicSlug": "linear-equations",
    "outcomeCode": "ACMNA194",
    "year": 8,
    "subject": "Mathematics",
    "strand": "Algebra",
    "questionCount": 120,
    "setCount": 12,
    "purpose": "WORKED_SOLUTION questions for step-by-step AI grading",
    "createdAt": "2026-01-12",
    "version": "1.0",
    "phases": {
      "foundation": {"sets": [1, 2, 3], "questions": "Q1-30"},
      "application": {"sets": [4, 5, 6], "questions": "Q31-60"},
      "connection": {"sets": [7, 8, 9], "questions": "Q61-90"},
      "mastery": {"sets": [10, 11, 12], "questions": "Q91-120"}
    }
  },
  "questions": [...]
}
```

## SetId Convention

```
year{year}-{topic-slug}-set{number}
```

Example: `year8-linear-equations-set1`

Each question's `paperMetadata`:
```json
"paperMetadata": {
  "section": "year8-mathematics",
  "setId": "year8-linear-equations-set1",
  "sequenceInPaper": 1
}
```

## LaTeX Formatting

### Equations in Stem
```markdown
Solve for x:

$$2x + 3 = 11$$
```

### Fractions
```markdown
$$\frac{x}{3} + 2 = 5$$
```

### Multiple Methods in Solution
```markdown
**Method 1: Expand first**
$$3x + 6 = 15$$
$$3x = 9$$
$$x = 3$$

**Method 2: Divide first**
$$x + 2 = 5$$
$$x = 3$$
```

## Common Error Guidance

Include common errors in gradingGuidance for AI to recognize:

| Equation Type | Common Errors |
|---------------|---------------|
| One-step | Wrong inverse operation |
| Two-step | Wrong order (multiply before subtract) |
| Brackets | Forgetting to multiply all terms: 3(x+2) = 3x+2 |
| Variables both sides | 3x - x = 3 instead of 2x |
| Fractions | Dividing instead of multiplying |
| Word problems | Setting up equation incorrectly |

## Quality Checklist

Before finalizing each question:

- [ ] `questionType` is `"WORKED_SOLUTION"`
- [ ] `workedSolutionConfig` includes ALL required fields
- [ ] `expectedAnswers` has 5+ equivalent forms
- [ ] `gradingGuidance` mentions common errors
- [ ] `sampleSolutions` shows multiple valid approaches
- [ ] `encouragingHints` are Socratic (never give answer)
- [ ] `minimumWorkLines` matches difficulty
- [ ] LaTeX renders correctly (use `$$` for display math)
- [ ] Difficulty matches learning arc position
- [ ] `buildsOn`/`preparesFor` link questions correctly

## Related Skills

- `/edu:map` - Map curriculum structure
- `/edu:research` - Research topic pedagogically
- `/edu:validate` - Validate question schema
- `/edu:upload` - Upload to Firestore

## Example Generation

Full example for a two-step equation:

```json
{
  "questionId": "linear-eq-y8-003",
  "questionType": "WORKED_SOLUTION",
  "stem": "Solve for x:\n\n$$2x + 3 = 11$$\n\nShow your working.",
  "solution": "**Solution:**\n\n**Step 1:** Subtract 3 from both sides\n$$2x + 3 - 3 = 11 - 3$$\n$$2x = 8$$\n\n**Step 2:** Divide both sides by 2\n$$\\frac{2x}{2} = \\frac{8}{2}$$\n$$x = 4$$\n\n**Answer: x = 4**\n\n**Check:** $2(4) + 3 = 8 + 3 = 11$ ✓",
  "hints": [
    {"level": 1, "content": "This is a two-step equation. Deal with the '+3' first.", "revealsCriticalInfo": false},
    {"level": 2, "content": "First subtract 3 from both sides to get 2x = ?", "revealsCriticalInfo": false},
    {"level": 3, "content": "2x = 8, now divide both sides by 2", "revealsCriticalInfo": true}
  ],
  "encouragingHints": [
    {
      "level": 1,
      "content": "Two-step equations need two operations. Think: what should you undo first?",
      "encouragement": "You've mastered one-step equations - this is just two of those!",
      "questionPrompt": "Looking at 2x + 3 = 11, which part should you deal with first?"
    },
    {
      "level": 2,
      "content": "Work 'outside in' - deal with addition/subtraction before multiplication/division.",
      "encouragement": "This is like reverse order of operations!",
      "questionPrompt": "If you subtract 3 from both sides, what do you get?"
    },
    {
      "level": 3,
      "content": "After subtracting 3: 2x = 8. Now you have a one-step equation!",
      "encouragement": "You've turned a hard problem into an easy one!",
      "questionPrompt": "What is 8 divided by 2?"
    }
  ],
  "workedSolutionConfig": {
    "startingExpression": "2x + 3 = 11",
    "expectedAnswers": ["4", "x = 4", "x=4", "x= 4", "x =4", "4.0", "x = 4.0"],
    "gradingGuidance": "Two-step equation. Student should: (1) Subtract 3 from both sides to get 2x = 8, (2) Divide by 2 to get x = 4. Award partial credit for correct first step even if second step has error. Common errors: wrong order of operations (dividing first), sign errors.",
    "sampleSolutions": [
      "2x + 3 = 11\n2x + 3 - 3 = 11 - 3\n2x = 8\n2x ÷ 2 = 8 ÷ 2\nx = 4",
      "2x + 3 = 11\n2x = 11 - 3\n2x = 8\nx = 8/2\nx = 4"
    ],
    "minimumWorkLines": 2,
    "topic": "linear-equations",
    "year": 8,
    "keyConcepts": ["two-step equations", "inverse operations", "order of operations"]
  },
  "difficulty": 2,
  "estimatedTime": 90,
  "curriculum": {
    "system": "ACARA",
    "codes": ["ACMNA194"],
    "year": 8,
    "subject": "Mathematics",
    "strand": "Algebra"
  },
  "learningArc": {
    "phase": 1,
    "phasePosition": 3,
    "conceptsUsed": ["two-step-equations", "inverse-operations"],
    "buildsOn": ["linear-eq-y8-001", "linear-eq-y8-002"],
    "preparesFor": ["linear-eq-y8-004", "linear-eq-y8-005"]
  },
  "pedagogy": {
    "type": "scaffolded",
    "targetFeeling": "I can solve two-step equations!"
  },
  "richContent": {
    "hasEquations": true,
    "hasTables": false,
    "hasDiagrams": false
  },
  "paperMetadata": {
    "section": "year8-mathematics",
    "setId": "year8-linear-equations-set1",
    "sequenceInPaper": 3
  },
  "status": "published"
}
```

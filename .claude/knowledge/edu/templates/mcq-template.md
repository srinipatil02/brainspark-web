# MCQ Question Template

Standard format for multiple-choice questions following the Learning Arc framework.

## Structure

```json
{
  "questionId": "{topic-slug}-y{year}-{sequence:3}",
  "questionType": "MCQ",
  "stem": "Question text with **markdown** and $LaTeX$ support",
  "mcqOptions": [
    {
      "id": "A",
      "text": "First option",
      "isCorrect": false,
      "feedback": "Why this option is incorrect and what it reveals"
    },
    {
      "id": "B",
      "text": "Second option (correct answer)",
      "isCorrect": true,
      "feedback": "Confirms understanding and reinforces key concept"
    },
    {
      "id": "C",
      "text": "Third option",
      "isCorrect": false,
      "feedback": "Common misconception addressed"
    },
    {
      "id": "D",
      "text": "Fourth option",
      "isCorrect": false,
      "feedback": "Another plausible but incorrect choice"
    }
  ],
  "solution": "Full explanation of why B is correct...",
  "hints": [...],
  "difficulty": 2,
  "curriculum": {...},
  "learningArc": {...},
  "pedagogy": {...}
}
```

## Stem Guidelines

### Length
- Minimum: 20 characters
- Recommended: 50-200 characters
- Maximum: 2000 characters

### Format
- Clear, direct question or statement to complete
- One idea per sentence
- Define technical terms on first use

### Rich Content Support
```markdown
# Inline equation
The formula $v = \frac{d}{t}$ relates velocity to distance and time.

# Block equation
$$E = mc^2$$

# Table
| State | Arrangement |
|-------|-------------|
| Solid | Regular |

# Bold/Italic
**Key term** should stand out.
```

## Option Guidelines

### Best Practices
- All options similar length
- No "all of the above" or "none of the above"
- Options in logical order (numerical, alphabetical, or complexity)
- Exactly one correct answer
- Each distractor based on common error or misconception

### Distractor Types

| Type | Description | Example |
|------|-------------|---------|
| Misconception | Common student error | "Particles stop in solids" |
| Partial understanding | Incomplete reasoning | "Liquids can be compressed a little" |
| Reversal | Opposite of correct | "Gas particles move slowest" |
| Confusion | Related but different concept | "Evaporation" vs "condensation" |

### Feedback Guidelines

**Correct Answer Feedback**:
```
"Correct! [Key concept reinforced]. [Optional connection to next concept]"
```

**Incorrect Answer Feedback**:
```
"[Why this is wrong]. [Common reason students choose this].
[Guide toward correct thinking]"
```

## MCQ Examples by Phase

### Phase 1: Foundation (Recognition)
```json
{
  "stem": "Which of the following is a property of gases?",
  "mcqOptions": [
    {
      "id": "A",
      "text": "Fixed shape and fixed volume",
      "isCorrect": false,
      "feedback": "This describes a solid. Gases don't have fixed shape or volume."
    },
    {
      "id": "B",
      "text": "No fixed shape and no fixed volume",
      "isCorrect": true,
      "feedback": "Correct! Gas particles move freely and spread out to fill their container."
    },
    {
      "id": "C",
      "text": "Fixed volume but takes shape of container",
      "isCorrect": false,
      "feedback": "This describes a liquid. Gases can be compressed, so volume is not fixed."
    },
    {
      "id": "D",
      "text": "Particles that don't move",
      "isCorrect": false,
      "feedback": "All particles move, even in solids. Gas particles move fastest and most freely."
    }
  ]
}
```

### Phase 2: Application (Apply Concept)
```json
{
  "stem": "A sealed syringe contains air. When you push the plunger, the air compresses. Which statement best explains why this happens?",
  "mcqOptions": [
    {
      "id": "A",
      "text": "The air particles get smaller",
      "isCorrect": false,
      "feedback": "Particles don't change size. The spacing between them changes."
    },
    {
      "id": "B",
      "text": "Some air escapes through the syringe walls",
      "isCorrect": false,
      "feedback": "The syringe is sealed, so no air can escape."
    },
    {
      "id": "C",
      "text": "The particles move closer together as there is empty space between them",
      "isCorrect": true,
      "feedback": "Correct! Gas particles have large spaces between them that can be reduced by compression."
    },
    {
      "id": "D",
      "text": "The air turns into a liquid",
      "isCorrect": false,
      "feedback": "Compression alone doesn't change state. Much more pressure would be needed."
    }
  ]
}
```

### Phase 3: Connection (Link Concepts)
```json
{
  "stem": "Water boils at 100°C at sea level, but at only 70°C at the top of Mount Everest. Using your knowledge of particles and pressure, which explanation is most accurate?",
  "mcqOptions": [
    {
      "id": "A",
      "text": "Water molecules are smaller at high altitude",
      "isCorrect": false,
      "feedback": "Molecules don't change size with altitude."
    },
    {
      "id": "B",
      "text": "Lower air pressure means particles need less energy to escape as gas",
      "isCorrect": true,
      "feedback": "Correct! With less air pressure pushing down, water particles can escape to the gas phase more easily."
    },
    {
      "id": "C",
      "text": "There is more oxygen at high altitude",
      "isCorrect": false,
      "feedback": "Actually there is less oxygen at high altitude, and this doesn't directly affect boiling."
    },
    {
      "id": "D",
      "text": "Heat rises, so it's actually hotter at the top of mountains",
      "isCorrect": false,
      "feedback": "Temperature decreases with altitude. The lower boiling point is due to pressure, not temperature."
    }
  ]
}
```

## Hint Template for MCQ

```json
{
  "hints": [
    {
      "level": 1,
      "content": "[Activate prior knowledge or direct attention] Think about what you know about [concept]...",
      "revealsCriticalInfo": false
    },
    {
      "level": 2,
      "content": "[Narrow focus] Consider the relationship between [A] and [B]. Which option reflects this?",
      "revealsCriticalInfo": true
    },
    {
      "level": 3,
      "content": "[Guide to answer] The key is understanding that [principle]. Look for the option that shows [specific criteria].",
      "revealsCriticalInfo": true
    }
  ]
}
```

## Quality Checklist

- [ ] Stem is clear and unambiguous
- [ ] Exactly one correct answer
- [ ] All distractors are plausible
- [ ] Options are parallel in structure
- [ ] No grammatical clues to correct answer
- [ ] Feedback explains reasoning for each option
- [ ] Hints progress without revealing answer prematurely
- [ ] Appropriate difficulty for phase
- [ ] Rich content renders correctly

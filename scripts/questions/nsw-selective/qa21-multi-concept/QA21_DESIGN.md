# QA21 Multi-Concept Integration - 100 Questions

## Concept Combination Matrix

Each combination gets 5 questions (20 combinations × 5 = 100 questions)

| # | Combination | Primary | Secondary | Example Problem Type |
|---|------------|---------|-----------|---------------------|
| 1 | Percentage + Age | QA11 | QA17 | "X is 25% older than Y. In N years..." |
| 2 | Percentage + Speed | QA11/13 | QA20 | "After 20% increase in speed, time reduces by..." |
| 3 | Ratio + Speed | QA12 | QA20 | "Speeds in ratio 3:4, same distance, time difference..." |
| 4 | Sequence + Percentage | QA1/9 | QA13 | "Grows 15% each period, after N periods..." |
| 5 | Venn + Percentage | QA7 | QA11 | "60% like A, 50% like B, 20% both, percentage neither..." |
| 6 | Mean + Ratio | QA8 | QA12 | "Average of 3 numbers, given ratio constraints..." |
| 7 | 3D + Scale | QA3 | QA15 | "Similar shapes, surface area ratio, volume/weight..." |
| 8 | Age + Simultaneous | QA17 | QA5 | "Sum of ages, product of ages, find each..." |
| 9 | Speed + Sequence | QA20 | QA1 | "Speed increases by 5km/h each hour, total distance..." |
| 10 | Percentage + Simultaneous | QA11/13 | QA5 | "Two items, different discounts, same final price..." |
| 11 | Counting + Percentage | QA18 | QA11 | "Arrangements where 30% satisfy condition..." |
| 12 | Timetable + Speed | QA16 | QA20 | "Using schedule, calculate if train arrives on time..." |
| 13 | Ratio + 3-Way | QA12 | QA10 | "Three quantities in ratio, with sum constraint..." |
| 14 | Area + Percentage | QA19 | QA11 | "Shaded region is X% of total, find dimensions..." |
| 15 | Weight + Ratio | QA2 | QA12 | "Objects in ratio, total weight constraint..." |
| 16 | Journey + Percentage | QA4 | QA13 | "Travel with delays, percentage of planned time..." |
| 17 | Pattern + Mean | QA9 | QA8 | "Sequence with rule, find value for target average..." |
| 18 | Coins + Percentage | QA6 | QA11 | "Coin mixture, percentage of total value..." |
| 19 | Venn + Counting | QA7 | QA18 | "From Venn, how many ways to select..." |
| 20 | Age + Percentage | QA17 | QA11 | "Age as percentage of another, future relationship..." |

## Difficulty Distribution (within each combination)

| Question | Difficulty | Characteristics |
|----------|------------|-----------------|
| Q1 | 3 | Standard integration, clean numbers |
| Q2 | 3 | Standard integration, messier numbers |
| Q3 | 4 | Add constraint or extra step |
| Q4 | 4 | Requires insight to see connection |
| Q5 | 5 | Maximum complexity, multiple constraints |

## Validation Requirements

### Each Question Must Have:
1. **Worked solution with numbered steps**
2. **Verification calculation** (plug answer back in)
3. **Alternative solution path** (where applicable)
4. **Distractor rationale** (specific error each catches)

### Automated Validation Checks:
- [ ] Correct answer matches worked solution
- [ ] All distractors are unique
- [ ] Numbers in distractors are plausible (not obviously wrong)
- [ ] Verification step confirms answer
- [ ] Time estimate is reasonable (60-120 seconds)

## Question Template

```json
{
  "questionId": "nsw-sel-qa21-XXX",
  "questionType": "MCQ",
  "stem": "...",
  "mcqOptions": [...],
  "solution": "**Step 1:** ...\n**Step 2:** ...\n**Verification:** ...",
  "validation": {
    "primaryConcept": "qa11",
    "secondaryConcept": "qa17",
    "workedAnswer": 42,
    "verificationCalc": "25% of 42 = 10.5, 42 - 10 = 32 ✓",
    "alternativePath": "Could also solve by..."
  },
  "hints": [...],
  "nswSelective": {
    "archetype": "Multi-Concept Integration",
    "archetypeId": "qa21",
    "conceptsRequired": ["percentages", "age-relationships", "algebraic-equations"],
    "combinedArchetypes": ["qa11", "qa17"],
    "distractorTypes": {...}
  }
}
```

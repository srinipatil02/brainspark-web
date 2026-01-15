# QA22: Probability Reasoning - Design Document

## Archetype Philosophy

The NSW Selective test identifies **gifted students** through their ability to apply concepts to **novel, unfamiliar situations**. This archetype does NOT test:
- ❌ "What is P(red) if there are 3 red and 5 blue?"
- ❌ Basic probability calculations

This archetype DOES test:
- ✅ Reasoning about changing sample spaces
- ✅ Applying probability to real-world decisions
- ✅ Multi-step probability reasoning
- ✅ Recognizing when situations are fair/unfair
- ✅ Expected value reasoning in context

## Sub-Types (5 questions each = 25 total)

### 1. Changing Sample Space (Q1-Q5)
**Core insight**: After events occur, the sample space changes

Example patterns:
- Marble bag without replacement: "After drawing 2 red, what's P(3rd is red)?"
- Conditional situations: "Given that the first spin was odd..."
- Information updates: "You're told one of the children is a girl..."

**Gifted thinking required**: Track how each event changes what's possible

### 2. Expected Outcomes & Scaling (Q6-Q10)
**Core insight**: Probability predicts behavior over many trials

Example patterns:
- "If 30% of students walk to school, in a school of 500..."
- "A spinner lands on blue 40% of the time. In 200 spins..."
- "The chance of rain is 25%. Over 80 days, expect rain on..."

**Gifted thinking required**: Connect theoretical probability to real predictions

### 3. Fairness Analysis (Q11-Q15)
**Core insight**: Detect when games/selections are biased

Example patterns:
- "Player A wins if sum > 7, Player B wins otherwise. Fair?"
- "Spinner has sections of 120°, 90°, 90°, 60°. Fair game?"
- "Pick a number 1-10. Odd wins $2, even wins $1. Fair?"

**Gifted thinking required**: Analyze structure to detect hidden advantages

### 4. Complementary & "At Least One" (Q16-Q20)
**Core insight**: Sometimes P(not X) is easier than P(X)

Example patterns:
- "P(at least one 6 in three dice rolls)"
- "P(at least one correct guess out of 5)"
- "P(at least 2 people share a birthday in a group)"

**Gifted thinking required**: Recognize when complement is simpler

### 5. Combined Events & Pathways (Q21-Q25)
**Core insight**: Multi-step processes require tracking all paths

Example patterns:
- "Spin twice. P(sum is prime)?"
- "Draw a card, flip a coin. P(red card AND heads)?"
- "Two bags, pick one at random, then draw. P(blue)?"

**Gifted thinking required**: Systematic enumeration, tree diagrams

## Difficulty Progression

| Questions | Difficulty | Characteristics |
|-----------|------------|-----------------|
| Q1-Q5 | 2-3 | Clean numbers, 1-2 step reasoning |
| Q6-Q10 | 2-3 | Scaling with friendly percentages |
| Q11-Q15 | 3 | Requires comparing probabilities |
| Q16-Q20 | 3-4 | Complement reasoning, multiple events |
| Q21-Q25 | 4 | Multi-step, requires systematic approach |

## Distractor Design Principles

Each wrong answer should catch a **specific misconception**:

| Distractor Type | Misconception |
|-----------------|---------------|
| `unchanged_sample` | Forgetting to update after events |
| `add_not_multiply` | Adding probabilities when should multiply |
| `multiply_not_add` | Multiplying when should add (OR situations) |
| `wrong_complement` | Using P(X) instead of 1-P(X) |
| `wrong_total` | Using wrong denominator |
| `gambler_fallacy` | Thinking past events affect future |
| `equal_assumption` | Assuming all outcomes equally likely when not |

## Validation Requirements

Each question must have:
1. **Sample space clearly defined** (stated or derivable)
2. **Exact fractional answer** (no approximations needed)
3. **Verification calculation** in solution
4. **Distractor rationale** explaining each wrong answer

## NSW Curriculum Alignment

| Outcome Code | Description | Questions |
|--------------|-------------|-----------|
| MA3-18SP | Conduct chance experiments | Q1-Q5 |
| MA3-19SP | Compare expected/observed frequencies | Q6-Q10 |
| MA3-18SP | Describe probability 0-1 scale | Q11-Q20 |
| MA3-19SP | Predict results of experiments | Q21-Q25 |

## Example Question (Changing Sample Space)

**Stem**: A bag contains 4 red and 6 blue marbles. Emma draws one marble, sees it is blue, and keeps it. She then draws another marble without looking. What is the probability the second marble is red?

**Key insight**: Sample space changed from 10 to 9 marbles, reds unchanged

**Answer**: 4/9

**Distractors**:
- A: 4/10 (unchanged_sample - forgot to remove the blue)
- B: 4/9 ✓
- C: 6/10 (wrong_event - probability of blue, not red)
- D: 2/5 (wrong_simplification)
- E: 5/9 (swapped - subtracted from wrong color)

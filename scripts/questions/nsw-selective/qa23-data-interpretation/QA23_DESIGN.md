# QA23: Data Interpretation & Statistical Reasoning - Design Document

## Archetype Philosophy

The NSW Selective test identifies **gifted students** through their ability to reason with data in **novel, unfamiliar situations**. This archetype does NOT test:
- ❌ "Read the height of the bar for Monday"
- ❌ Basic graph reading without reasoning

This archetype DOES test:
- ✅ Drawing conclusions from data displays
- ✅ Comparing data sets using measures of center/spread
- ✅ Reasoning about median, mode, range (not just mean)
- ✅ Identifying patterns, anomalies, and misleading presentations
- ✅ Working backwards from statistics to find missing values

## Sub-Types (5 questions each = 25 total)

### 1. Median & Mode Reasoning (Q1-Q5)
**Core insight**: Different measures of center tell different stories

Example patterns:
- "The median is 15, mean is 18. What does this tell you about the data?"
- "Which average would a store prefer to report if most sales are low but a few are high?"
- "Find the missing value if the median must be exactly 20."

**Gifted thinking required**: Understand what each measure reveals about the data shape

### 2. Data from Graphs (Q6-Q10)
**Core insight**: Extract and combine information from visual displays

Example patterns:
- "Based on this graph, in which two months was the total sales equal to July?"
- "The graph shows temperature changes. When was the rate of increase greatest?"
- "Compare the trends in Graph A and Graph B."

**Gifted thinking required**: Interpret beyond surface reading, combine information

### 3. Two-Way Tables & Cross-Classification (Q11-Q15)
**Core insight**: Navigate data organized by multiple categories

Example patterns:
- "Of students who play sports, what fraction also play an instrument?"
- "Complete the table given these constraints..."
- "Which group has the highest rate of..."

**Gifted thinking required**: Track row/column relationships, calculate rates

### 4. Working Backwards from Statistics (Q16-Q20)
**Core insight**: Use statistical properties to find unknowns

Example patterns:
- "The range is 12 and minimum is 7. What are possible maximums?"
- "Adding one more data point changes the median from 10 to 11. What could it be?"
- "If the mode is 5 and appears 3 times in 7 values, what's the maximum possible mean?"

**Gifted thinking required**: Reverse engineering from statistical constraints

### 5. Data Analysis & Conclusions (Q21-Q25)
**Core insight**: Draw valid conclusions and identify flaws in reasoning

Example patterns:
- "Which conclusion is NOT supported by this data?"
- "Why might this graph be misleading?"
- "Based on the data, which prediction is most reasonable?"

**Gifted thinking required**: Critical analysis, valid vs invalid inferences

## Difficulty Progression

| Questions | Difficulty | Characteristics |
|-----------|------------|-----------------|
| Q1-Q5 | 2-3 | Single statistical measure, clear data |
| Q6-Q10 | 2-3 | Graph interpretation with simple reasoning |
| Q11-Q15 | 3 | Two-way tables, rate calculations |
| Q16-Q20 | 3-4 | Working backwards, multiple constraints |
| Q21-Q25 | 4 | Complex reasoning, invalid conclusion detection |

## Distractor Design Principles

Each wrong answer should catch a **specific misconception**:

| Distractor Type | Misconception |
|-----------------|---------------|
| `mean_median_confusion` | Using wrong measure of center |
| `range_span_error` | Range = max - min, not max + min |
| `table_wrong_total` | Using wrong row/column total |
| `rate_count_confusion` | Confusing count with rate/percentage |
| `trend_vs_value` | Confusing rate of change with absolute value |
| `correlation_causation` | Assuming correlation implies causation |
| `partial_data` | Drawing conclusion from incomplete information |

## NSW Curriculum Alignment

| Outcome Code | Description | Questions |
|--------------|-------------|-----------|
| MA3-17SP | Interpret data displays | Q6-Q10 |
| MA3-17SP | Calculate mean (and median/mode informally) | Q1-Q5, Q16-Q20 |
| MA3-17SP | Draw conclusions from data | Q21-Q25 |
| MA3-17SP | Two-way tables | Q11-Q15 |

## Example Question (Working Backwards)

**Stem**: A data set has 5 values. The mode is 8 (appearing exactly twice), and the median is 9. The range is 7. What is the largest possible sum of all 5 values?

**Key insight**: Place mode (8, 8), median (9 in middle), range (max - min = 7)

**Reasoning**:
- Ordered: _, 8, 9, 8, _ won't work (median must be middle)
- Ordered: 8, 8, 9, _, _ - median is 9 ✓
- Range = 7, so if min = 8, max = 15
- To maximize sum: use largest values that maintain mode
- 8, 8, 9, 14, 15... but 15-8=7 works, 14 is valid
- Actually: min could be less than 8...
- 8, 8, 9, x, y where y - 8 = 7 (if 8 is min), so y = 15
- Max sum = 8 + 8 + 9 + 14 + 15 = 54

**Answer**: 54

**Distractors**:
- A: 45 (using minimum values)
- B: 50 (calculation error)
- C: 54 ✓
- D: 56 (forgetting mode constraint)
- E: 60 (ignoring all constraints)

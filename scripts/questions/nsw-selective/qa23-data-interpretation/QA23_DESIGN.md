# QA23: Data Interpretation & Statistical Reasoning - Design Document

## Version 2.0 - Terminology-Free Design

## Core Design Principle: Conceptual Understanding Without Terminology

**CRITICAL**: Year 6 students understand statistical CONCEPTS but may not know the TERMS.

| Concept | Students Know | Students May NOT Know |
|---------|--------------|----------------------|
| Average | ✅ "Add them up and divide" | ❌ "mean" |
| Middle value | ✅ "The one in the middle when sorted" | ❌ "median" |
| Most common | ✅ "The one that appears most often" | ❌ "mode" |
| Spread | ✅ "Difference between highest and lowest" | ❌ "range" |

**Our approach**: Test the CONCEPT, not the TERMINOLOGY. Students should demonstrate understanding of statistical reasoning without being blocked by unfamiliar terms.

## Archetype Philosophy

The NSW Selective test identifies **gifted students** through their ability to reason with data in **novel, unfamiliar situations**. This archetype does NOT test:
- ❌ "Read the height of the bar for Monday"
- ❌ Basic graph reading without reasoning
- ❌ **Vocabulary/terminology knowledge** (mean, median, mode, range)

This archetype DOES test:
- ✅ Drawing conclusions from data displays
- ✅ Comparing data sets using measures of center/spread **described conceptually**
- ✅ Reasoning about middle values, most common values, averages
- ✅ Identifying patterns, anomalies, and misleading presentations
- ✅ Working backwards from statistics to find missing values

## Terminology Transformation Guide

When writing questions, use these conceptual descriptions:

| AVOID (Terminology) | USE (Conceptual Description) |
|---------------------|------------------------------|
| mean | average |
| median | middle value when arranged in order |
| median (even count) | average of the two middle values |
| mode | most common value / value that appears most often |
| range | difference between the highest and lowest |

**Example Transformation**:
- ❌ BEFORE: "The mode of this data set is 12"
- ✅ AFTER: "The most common value in this data set is 12"

- ❌ BEFORE: "Find the median of the following numbers"
- ✅ AFTER: "When these numbers are arranged from smallest to largest, what is the middle value?"

## Sub-Types (5 questions each = 25 total)

### 1. Statistical Measure Reasoning (Q1-Q5)
**Core insight**: Different measures tell different stories about data

Example patterns (using conceptual language):
- "Emma calculated the average and got 85. Ben found the middle value is also 85. Chloe noticed one score appears more often than others. What is that most common score?"
- "Which would be more useful to know: the average salary or the middle salary when arranged in order?"
- "Find the missing value if the middle score must be exactly 20."

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

Example patterns (using conceptual language):
- "The difference between the highest and lowest is 12, and the smallest number is 7. What is the largest?"
- "Adding one more data point changes the middle value from 10 to 11. What could it be?"
- "If the most common value is 5 and appears 3 times in 7 values, what's the maximum possible average?"

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
| `measure_confusion` | Using wrong measure (average vs middle vs most common) |
| `calculation_error` | Arithmetic or process mistake |
| `table_wrong_total` | Using wrong row/column total |
| `rate_count_confusion` | Confusing count with rate/percentage |
| `trend_vs_value` | Confusing rate of change with absolute value |
| `correlation_causation` | Assuming correlation implies causation |
| `partial_data` | Drawing conclusion from incomplete information |

## NSW Curriculum Alignment

| Outcome Code | Description | Questions |
|--------------|-------------|-----------|
| MA3-17SP | Interpret data displays | Q6-Q10 |
| MA3-17SP | Calculate average (and middle/most common informally) | Q1-Q5, Q16-Q20 |
| MA3-17SP | Draw conclusions from data | Q21-Q25 |
| MA3-17SP | Two-way tables | Q11-Q15 |

## Example Question (Working Backwards - Conceptual Style)

**Stem**: A data set has 5 values. The most common value is 8 (appearing exactly twice), and when arranged in order, the middle value is 9. The difference between the highest and lowest number is 7. What is the largest possible sum of all 5 values?

**Key insight**: Place most common (8, 8), middle (9 in position 3), spread constraint (max - min = 7)

**Reasoning**:
- Ordered: _, 8, 9, 8, _ won't work (middle value must be in middle position)
- Ordered: 8, 8, 9, _, _ - middle value is 9 ✓
- Spread = 7, so if min = 8, max = 15
- To maximize sum: use largest values that maintain most common constraint
- 8, 8, 9, 14, 15... but 15-8=7 works, 14 is valid
- Max sum = 8 + 8 + 9 + 14 + 15 = 54

**Answer**: 54

**Distractors**:
- A: 45 (using minimum values)
- B: 50 (calculation error)
- C: 54 ✓
- D: 56 (forgetting most common value constraint)
- E: 60 (ignoring all constraints)

## Question Writing Checklist

Before finalizing any QA23 question, verify:

- [ ] No use of "mean" - use "average" instead
- [ ] No use of "median" - describe as "middle value when arranged in order"
- [ ] No use of "mode" - describe as "most common value" or "value that appears most often"
- [ ] No use of "range" - describe as "difference between highest and lowest"
- [ ] Hints use conceptual language, not terminology
- [ ] Solution explanation uses conceptual language
- [ ] Distractor explanations use conceptual language

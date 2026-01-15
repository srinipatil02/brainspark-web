const fs = require('fs');
const data = JSON.parse(fs.readFileSync('qa21-complete.json', 'utf8'));

// Fix Q27: Change to ratio 2:3 with 50 total, 25% red large, 20% blue large
// Red = 20, Blue = 30 (ratio 2:3 ✓)
// Large red = 25% of 20 = 5
// Large blue = 20% of 30 = 6
// Total large = 11 (whole number ✓)

data.questions[26] = {
  "questionId": "nsw-sel-qa21-027",
  "questionType": "MCQ",
  "stem": "A box contains red and blue marbles in ratio 2:3. If 25% of red marbles and 20% of blue marbles are large, and there are 50 marbles total, how many large marbles are there?",
  "mcqOptions": [
    {"id": "A", "text": "9", "isCorrect": false, "feedback": "Check: 25% of 20 + 20% of 30 = 5 + 6 = 11, not 9."},
    {"id": "B", "text": "10", "isCorrect": false, "feedback": "Close but not quite. 5 + 6 = 11."},
    {"id": "C", "text": "11", "isCorrect": true, "feedback": "Correct! Red=20 (5 large) + Blue=30 (6 large) = 11 large marbles."},
    {"id": "D", "text": "12", "isCorrect": false, "feedback": "Too high. Check your percentage calculations."},
    {"id": "E", "text": "8", "isCorrect": false, "feedback": "Too low. Did you calculate percentages of both colours?"}
  ],
  "solution": "**Methodology: Ratio + Percentage Integration**\n\n**Step 1: Find counts from ratio**\nRed : Blue = 2 : 3, total = 5 parts\n50 marbles total → each part = 10\nRed = 2 × 10 = 20\nBlue = 3 × 10 = 30\n\n**Step 2: Calculate large marbles**\nLarge red = 25% of 20 = 0.25 × 20 = 5\nLarge blue = 20% of 30 = 0.20 × 30 = 6\n\n**Step 3: Total**\nTotal large = 5 + 6 = 11\n\n**Verification:**\n- Ratio 20:30 = 2:3 ✓\n- 25% of 20 = 5 ✓\n- 20% of 30 = 6 ✓\n- Total = 11 ✓",
  "hints": [
    {"level": 1, "content": "First find how many red and blue marbles using the ratio 2:3.", "revealsCriticalInfo": false},
    {"level": 2, "content": "Red = 20, Blue = 30. Now find 25% of 20 and 20% of 30.", "revealsCriticalInfo": false},
    {"level": 3, "content": "Large = 5 + 6 = 11", "revealsCriticalInfo": true}
  ],
  "nswSelective": {
    "archetype": "Multi-Concept Integration",
    "archetypeId": "qa21",
    "conceptsRequired": ["ratios", "percentages", "counting"],
    "combinedArchetypes": ["qa12", "qa11"],
    "distractorTypes": {"A": "undercount", "B": "close_error", "D": "overcount", "E": "far_undercount"},
    "solutionApproach": "Ratio to counts → Percentage of each → Sum",
    "timeTarget": 90
  },
  "difficulty": 4,
  "estimatedTime": 90,
  "curriculum": {"system": "NSW K-6 Mathematics", "codes": ["MA3-5NA", "MA3-6NA"], "year": 6, "subject": "Mathematics", "strand": "Number and Algebra"},
  "paperMetadata": {"section": "nsw-selective-mathematics", "setId": "nsw-sel-qa21-set3", "sequenceInPaper": 27},
  "status": "published",
  "validation": {"workedAnswer": 11, "verified": true}
};

fs.writeFileSync('qa21-complete.json', JSON.stringify(data, null, 2));
console.log('Q27 fixed: Ratio 2:3 with 50 marbles, answer is 11 large marbles');

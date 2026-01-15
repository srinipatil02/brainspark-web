const fs = require('fs');
const data = JSON.parse(fs.readFileSync('qa21-complete.json', 'utf8'));

// Fix Q36: The answer is 50, not 25
// Boys = 3k, Girls = 2k, After: 3k-5 = 2k+5, k=10
// Total = 5k = 50
// Need to fix options so 50 is correct

data.questions[35] = {
  "questionId": "nsw-sel-qa21-036",
  "questionType": "MCQ",
  "stem": "A class has boys and girls in ratio 3:2. If 5 boys leave and 5 girls join, the ratio becomes 1:1. How many students were originally in the class?",
  "mcqOptions": [
    {"id": "A", "text": "25", "isCorrect": false, "feedback": "If 25 students with ratio 3:2, that's 15 boys, 10 girls. After: 10 boys, 15 girls ≠ 1:1."},
    {"id": "B", "text": "30", "isCorrect": false, "feedback": "If 30 students with ratio 3:2, that's 18 boys, 12 girls. After: 13, 17 ≠ 1:1."},
    {"id": "C", "text": "40", "isCorrect": false, "feedback": "If 40 students with ratio 3:2, that's 24 boys, 16 girls. After: 19, 21 ≠ 1:1."},
    {"id": "D", "text": "45", "isCorrect": false, "feedback": "If 45 students with ratio 3:2, that's 27 boys, 18 girls. After: 22, 23 ≠ 1:1."},
    {"id": "E", "text": "50", "isCorrect": true, "feedback": "Correct! Originally 30 boys, 20 girls = 50. After: 25 boys, 25 girls = 1:1 ✓"}
  ],
  "solution": "**Methodology: Ratio + Change**\n\n**Step 1: Set up original counts**\nBoys : Girls = 3 : 2\nLet boys = 3k, girls = 2k\n\n**Step 2: Set up after change**\nBoys after = 3k - 5\nGirls after = 2k + 5\nNew ratio = 1:1, so they're equal:\n3k - 5 = 2k + 5\nk = 10\n\n**Step 3: Find original total**\nBoys = 3 × 10 = 30\nGirls = 2 × 10 = 20\nTotal = 50\n\n**Verification:**\n- Original: 30:20 = 3:2 ✓\n- After: 25:25 = 1:1 ✓",
  "hints": [
    {"level": 1, "content": "Let boys = 3k, girls = 2k. After changes, they're equal.", "revealsCriticalInfo": false},
    {"level": 2, "content": "3k - 5 = 2k + 5, solve for k", "revealsCriticalInfo": false},
    {"level": 3, "content": "k = 10. Total = 5k = 50 students", "revealsCriticalInfo": true}
  ],
  "nswSelective": {
    "archetype": "Multi-Concept Integration",
    "archetypeId": "qa21",
    "conceptsRequired": ["ratios", "algebraic-equations", "change-problems"],
    "combinedArchetypes": ["qa12", "qa5"],
    "distractorTypes": {"A": "half_answer", "B": "wrong_k", "C": "wrong_total", "D": "calculation_error"},
    "solutionApproach": "Set up ratio → Apply changes → Equate new counts → Solve",
    "timeTarget": 90
  },
  "difficulty": 4,
  "estimatedTime": 90,
  "curriculum": {"system": "NSW K-6 Mathematics", "codes": ["MA3-5NA", "MA3-8NA"], "year": 6, "subject": "Mathematics", "strand": "Number and Algebra"},
  "paperMetadata": {"section": "nsw-selective-mathematics", "setId": "nsw-sel-qa21-set4", "sequenceInPaper": 36},
  "status": "published",
  "validation": {"workedAnswer": 50, "verified": true}
};

fs.writeFileSync('qa21-complete.json', JSON.stringify(data, null, 2));
console.log('Q36 fixed: Answer is 50 students (E is correct)');

const fs = require('fs');
const data = JSON.parse(fs.readFileSync('qa21-complete.json', 'utf8'));

// Fix Q26: Change total revenue to $80 so k=5, apples=10
// Revenue = 3(2k) + 2(5k) = 16k
// 16k = 80 → k = 5, apples = 2×5 = 10, oranges = 5×5 = 25
// Verification: 10×$3 + 25×$2 = $30 + $50 = $80 ✓

data.questions[25] = {
  "questionId": "nsw-sel-qa21-026",
  "questionType": "MCQ",
  "stem": "A shop sells apples at $3 each and oranges at $2 each. If the ratio of apples to oranges sold is 2:5 and total revenue is $80, how many apples were sold?",
  "mcqOptions": [
    {"id": "A", "text": "8", "isCorrect": false, "feedback": "Check: 8 apples = $24, 20 oranges = $40, total = $64, not $80."},
    {"id": "B", "text": "10", "isCorrect": true, "feedback": "Correct! 10 apples ($30) + 25 oranges ($50) = $80 ✓"},
    {"id": "C", "text": "12", "isCorrect": false, "feedback": "Check: 12 apples = $36, but then oranges = 30 (ratio 2:5), revenue = $36 + $60 = $96."},
    {"id": "D", "text": "6", "isCorrect": false, "feedback": "Check: 6 apples = $18, 15 oranges = $30, total = $48, not $80."},
    {"id": "E", "text": "14", "isCorrect": false, "feedback": "Check: 14 apples = $42, 35 oranges = $70, total = $112, not $80."}
  ],
  "solution": "**Methodology: Ratio + Revenue Integration**\n\n**Step 1: Set up using ratio**\nApples : Oranges = 2 : 5\nLet apples = 2k, oranges = 5k\n\n**Step 2: Set up revenue equation**\nRevenue = 3(2k) + 2(5k) = 6k + 10k = 16k\n16k = 80\nk = 5\n\n**Step 3: Find apples**\nApples = 2k = 2 × 5 = 10\n\n**Verification:**\n- Apples: 10, Oranges: 25 (ratio 10:25 = 2:5 ✓)\n- Revenue: 10 × $3 + 25 × $2 = $30 + $50 = $80 ✓",
  "hints": [
    {"level": 1, "content": "Let apples = 2k, oranges = 5k (keeping ratio 2:5).", "revealsCriticalInfo": false},
    {"level": 2, "content": "Revenue = 3(2k) + 2(5k) = 16k = $80", "revealsCriticalInfo": false},
    {"level": 3, "content": "k = 5, so apples = 2 × 5 = 10", "revealsCriticalInfo": true}
  ],
  "nswSelective": {
    "archetype": "Multi-Concept Integration",
    "archetypeId": "qa21",
    "conceptsRequired": ["ratios", "revenue-problems", "algebraic-equations"],
    "combinedArchetypes": ["qa12", "qa6"],
    "distractorTypes": {"A": "undercount", "C": "overcount", "D": "far_undercount", "E": "far_overcount"},
    "solutionApproach": "Set up ratio → Create revenue equation → Solve",
    "timeTarget": 75
  },
  "difficulty": 3,
  "estimatedTime": 75,
  "curriculum": {"system": "NSW K-6 Mathematics", "codes": ["MA3-5NA", "MA3-6NA"], "year": 6, "subject": "Mathematics", "strand": "Number and Algebra"},
  "paperMetadata": {"section": "nsw-selective-mathematics", "setId": "nsw-sel-qa21-set3", "sequenceInPaper": 26},
  "status": "published",
  "validation": {"workedAnswer": 10, "verified": true}
};

fs.writeFileSync('qa21-complete.json', JSON.stringify(data, null, 2));
console.log('Q26 fixed: Revenue changed to $80, answer is 10 apples');

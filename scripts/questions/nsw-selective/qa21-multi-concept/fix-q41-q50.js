const fs = require('fs');
const data = JSON.parse(fs.readFileSync('qa21-complete.json', 'utf8'));

// Fix Q43: Answer is 5 laps (cumulative 500s < 600s, but 6 laps = 630s > 600s)
data.questions[42] = {
  "questionId": "nsw-sel-qa21-043",
  "questionType": "MCQ",
  "stem": "A runner runs laps around a 400m track. Each lap takes 10 seconds longer than the previous lap. If the first lap takes 80 seconds, how many complete laps can she run in 10 minutes?",
  "mcqOptions": [
    {"id": "A", "text": "4", "isCorrect": false, "feedback": "4 laps = 80+90+100+110 = 380s. There's time for one more."},
    {"id": "B", "text": "5", "isCorrect": true, "feedback": "Correct! 5 laps = 80+90+100+110+120 = 500s ≤ 600s. Lap 6 would need 130s more."},
    {"id": "C", "text": "6", "isCorrect": false, "feedback": "6 laps = 500+130 = 630s > 600s available. Can't complete lap 6."},
    {"id": "D", "text": "7", "isCorrect": false, "feedback": "Way too many. Track cumulative times carefully."},
    {"id": "E", "text": "3", "isCorrect": false, "feedback": "Too few. 3 laps = 270s, plenty more time available."}
  ],
  "solution": "**Methodology: Time Sequence + Constraint**\n\n**Step 1: Convert to seconds**\n10 minutes = 600 seconds\n\n**Step 2: List lap times and cumulative times**\nLap 1: 80s (Total: 80s)\nLap 2: 90s (Total: 170s)\nLap 3: 100s (Total: 270s)\nLap 4: 110s (Total: 380s)\nLap 5: 120s (Total: 500s)\nLap 6: 130s (Would need 630s)\n\n**Step 3: Find answer**\n500s ≤ 600s, so 5 laps complete ✓\n630s > 600s, so lap 6 cannot complete\n\n**Answer: 5 complete laps**",
  "hints": [
    {"level": 1, "content": "Lap times: 80, 90, 100, 110, 120, 130... seconds", "revealsCriticalInfo": false},
    {"level": 2, "content": "Cumulative: 80, 170, 270, 380, 500, 630...", "revealsCriticalInfo": false},
    {"level": 3, "content": "Which cumulative total is ≤ 600s?", "revealsCriticalInfo": true}
  ],
  "nswSelective": {"archetype": "Multi-Concept Integration", "archetypeId": "qa21", "conceptsRequired": ["time-sequences", "cumulative-sums", "constraints"], "combinedArchetypes": ["qa20", "qa1"], "distractorTypes": {"A": "one_short", "C": "incomplete_lap", "D": "far_overcount", "E": "far_undercount"}, "solutionApproach": "List times → Cumulative sum → Find constraint boundary", "timeTarget": 90},
  "difficulty": 4,
  "estimatedTime": 90,
  "curriculum": {"system": "NSW K-6 Mathematics", "codes": ["MA3-5NA", "MA3-9NA"], "year": 6, "subject": "Mathematics", "strand": "Number and Algebra"},
  "paperMetadata": {"section": "nsw-selective-mathematics", "setId": "nsw-sel-qa21-set5", "sequenceInPaper": 43},
  "status": "published",
  "validation": {"workedAnswer": 5, "verified": true}
};

// Fix Q44: Change target to 350m (achieved after 5 seconds)
// Cumulative: 50, 110, 180, 260, 350, 450, 560...
data.questions[43] = {
  "questionId": "nsw-sel-qa21-044",
  "questionType": "MCQ",
  "stem": "A train accelerates such that it travels 50m in the 1st second, 60m in the 2nd second, 70m in the 3rd second, and so on. After how many seconds will it have travelled exactly 350m?",
  "mcqOptions": [
    {"id": "A", "text": "4", "isCorrect": false, "feedback": "After 4s: 50+60+70+80 = 260m < 350m"},
    {"id": "B", "text": "5", "isCorrect": true, "feedback": "Correct! After 5s: 50+60+70+80+90 = 350m ✓"},
    {"id": "C", "text": "6", "isCorrect": false, "feedback": "After 6s: 350+100 = 450m > 350m"},
    {"id": "D", "text": "7", "isCorrect": false, "feedback": "After 7s: 450+110 = 560m, way past 350m"},
    {"id": "E", "text": "3", "isCorrect": false, "feedback": "After 3s: 50+60+70 = 180m < 350m"}
  ],
  "solution": "**Methodology: Distance Sequence**\n\n**Step 1: List distances each second**\nSecond 1: 50m\nSecond 2: 60m\nSecond 3: 70m\nSecond 4: 80m\nSecond 5: 90m\n\n**Step 2: Cumulative distances**\nAfter 1s: 50m\nAfter 2s: 110m\nAfter 3s: 180m\nAfter 4s: 260m\nAfter 5s: 350m ✓\n\n**Verification:** 50+60+70+80+90 = 350 ✓",
  "hints": [
    {"level": 1, "content": "Distance each second: 50, 60, 70, 80, 90... (arithmetic sequence)", "revealsCriticalInfo": false},
    {"level": 2, "content": "Cumulative sums: 50, 110, 180, 260, 350...", "revealsCriticalInfo": false},
    {"level": 3, "content": "Which cumulative sum equals 350?", "revealsCriticalInfo": true}
  ],
  "nswSelective": {"archetype": "Multi-Concept Integration", "archetypeId": "qa21", "conceptsRequired": ["distance-sequences", "cumulative-sums"], "combinedArchetypes": ["qa20", "qa1"], "distractorTypes": {"A": "one_short", "C": "one_over", "D": "far_over", "E": "far_short"}, "solutionApproach": "List distances → Cumulative sum → Find target", "timeTarget": 90},
  "difficulty": 4,
  "estimatedTime": 90,
  "curriculum": {"system": "NSW K-6 Mathematics", "codes": ["MA3-5NA", "MA3-9NA"], "year": 6, "subject": "Mathematics", "strand": "Number and Algebra"},
  "paperMetadata": {"section": "nsw-selective-mathematics", "setId": "nsw-sel-qa21-set5", "sequenceInPaper": 44},
  "status": "published",
  "validation": {"workedAnswer": 5, "verified": true}
};

// Fix Q45: Answer is 2 hours (option A should be correct)
data.questions[44] = {
  "questionId": "nsw-sel-qa21-045",
  "questionType": "MCQ",
  "stem": "A delivery driver makes stops along a route. From start to stop 1 is 5 km, from stop 1 to stop 2 is 7 km, from stop 2 to stop 3 is 9 km, and so on (each leg 2 km longer). If she averages 30 km/h, how long does the journey to stop 6 take?",
  "mcqOptions": [
    {"id": "A", "text": "2 hours", "isCorrect": true, "feedback": "Correct! Total = 5+7+9+11+13+15 = 60 km. Time = 60/30 = 2 hours ✓"},
    {"id": "B", "text": "2.5 hours", "isCorrect": false, "feedback": "Total distance is 60 km. At 30 km/h, time = 2 hours, not 2.5."},
    {"id": "C", "text": "3 hours", "isCorrect": false, "feedback": "60 km at 30 km/h = 2 hours, not 3."},
    {"id": "D", "text": "1.5 hours", "isCorrect": false, "feedback": "Too short. Total distance is 60 km."},
    {"id": "E", "text": "1 hour", "isCorrect": false, "feedback": "Far too short. Calculate total distance first."}
  ],
  "solution": "**Methodology: Arithmetic Sequence + Speed**\n\n**Step 1: Calculate total distance**\nLeg distances: 5, 7, 9, 11, 13, 15 km (6 legs to reach stop 6)\nSum = 5+7+9+11+13+15 = 60 km\n\n**Alternative: Using arithmetic series**\na=5, d=2, n=6\nSum = n/2 × (2a + (n-1)d) = 6/2 × (10 + 10) = 3 × 20 = 60 km\n\n**Step 2: Calculate time**\nTime = Distance / Speed = 60 / 30 = 2 hours\n\n**Verification:** ✓",
  "hints": [
    {"level": 1, "content": "Distances: 5, 7, 9, 11, 13, 15 km for 6 legs", "revealsCriticalInfo": false},
    {"level": 2, "content": "Total distance = 60 km", "revealsCriticalInfo": false},
    {"level": 3, "content": "Time = 60 km / 30 km/h = 2 hours", "revealsCriticalInfo": true}
  ],
  "nswSelective": {"archetype": "Multi-Concept Integration", "archetypeId": "qa21", "conceptsRequired": ["arithmetic-sequences", "speed-distance-time"], "combinedArchetypes": ["qa1", "qa20"], "distractorTypes": {"B": "wrong_calculation", "C": "wrong_speed", "D": "partial", "E": "far_wrong"}, "solutionApproach": "Sum sequence → Apply speed formula", "timeTarget": 90},
  "difficulty": 5,
  "estimatedTime": 90,
  "curriculum": {"system": "NSW K-6 Mathematics", "codes": ["MA3-5NA", "MA3-9NA"], "year": 6, "subject": "Mathematics", "strand": "Number and Algebra"},
  "paperMetadata": {"section": "nsw-selective-mathematics", "setId": "nsw-sel-qa21-set5", "sequenceInPaper": 45},
  "status": "published",
  "validation": {"workedAnswer": 2, "verified": true}
};

// Fix Q46: Redesign to get integer answer
// New: Shirt $x, pants $y. 25% off shirt + 20% off pants = $66. 0.75x = 0.80y.
// 0.75x = 0.80y → x = 0.80y/0.75 = 16y/15
// 0.75x + 0.80y = 66
// 0.80y + 0.80y = 66 → 1.60y = 66 → y doesn't work
// Try: 0.75x = 0.80y, total = 62
// If 0.75x = 0.80y = P, then 2P = 62, P = 31 (not clean)
// Let's try: 20% off shirt = 25% off pants, total discounted = $70
// 0.80x = 0.75y, 0.80x + 0.75y = 70
// 2(0.80x) = 70, x = 43.75 (not clean)
// Better: 0.80x = 0.75y = 30, total = 60
// x = 30/0.80 = 37.5 (not integer)
// OK let's use different percentages: 10% off shirt, 20% off pants, equal prices
// 0.90x = 0.80y, let's find clean numbers
// If 0.90x = 0.80y = 36, then x = 40, y = 45, total = 85
// Discounted total = 36 + 36 = 72. Perfect!
data.questions[45] = {
  "questionId": "nsw-sel-qa21-046",
  "questionType": "MCQ",
  "stem": "A shirt costs $x and pants cost $y. After a 10% discount on the shirt and 20% discount on pants, both items cost the same. If the total discounted price is $72, find the original shirt price.",
  "mcqOptions": [
    {"id": "A", "text": "$35", "isCorrect": false, "feedback": "If x=35, 0.9(35)=31.5. Need 0.8y=31.5, y=39.375. Doesn't give $72 total."},
    {"id": "B", "text": "$40", "isCorrect": true, "feedback": "Correct! 0.9(40)=36. 0.8y=36, y=45. Discounted total: 36+36=72 ✓"},
    {"id": "C", "text": "$45", "isCorrect": false, "feedback": "That's the pants price, not the shirt price!"},
    {"id": "D", "text": "$50", "isCorrect": false, "feedback": "If x=50, 0.9(50)=45, then y=56.25. Doesn't work."},
    {"id": "E", "text": "$36", "isCorrect": false, "feedback": "That's the discounted price, not original shirt price."}
  ],
  "solution": "**Methodology: Percentage + Simultaneous Equations**\n\n**Step 1: Set up equal discounted prices**\n0.90x = 0.80y (both discounted prices equal)\nLet this equal price = P\n\n**Step 2: Use total**\nTotal discounted = P + P = 2P = 72\nP = 36\n\n**Step 3: Find original prices**\n0.90x = 36 → x = 36/0.90 = 40\n0.80y = 36 → y = 36/0.80 = 45\n\n**Verification:**\n0.90(40) + 0.80(45) = 36 + 36 = 72 ✓",
  "hints": [
    {"level": 1, "content": "If both discounted prices are equal, call them P. Total = 2P.", "revealsCriticalInfo": false},
    {"level": 2, "content": "2P = 72, so P = 36", "revealsCriticalInfo": false},
    {"level": 3, "content": "0.90x = 36, solve for x", "revealsCriticalInfo": true}
  ],
  "nswSelective": {"archetype": "Multi-Concept Integration", "archetypeId": "qa21", "conceptsRequired": ["percentages", "simultaneous-equations"], "combinedArchetypes": ["qa11", "qa5"], "distractorTypes": {"A": "wrong_calculation", "C": "wrong_variable", "D": "far_wrong", "E": "confused_with_discounted"}, "solutionApproach": "Set up percentage equations → Use constraint → Solve", "timeTarget": 90},
  "difficulty": 3,
  "estimatedTime": 90,
  "curriculum": {"system": "NSW K-6 Mathematics", "codes": ["MA3-5NA", "MA3-8NA"], "year": 6, "subject": "Mathematics", "strand": "Number and Algebra"},
  "paperMetadata": {"section": "nsw-selective-mathematics", "setId": "nsw-sel-qa21-set5", "sequenceInPaper": 46},
  "status": "published",
  "validation": {"workedAnswer": 40, "verified": true}
};

// Fix Q49: Answer is 60
// 0.80x = 0.75(x+4)
// 0.80x = 0.75x + 3
// 0.05x = 3
// x = 60
data.questions[48] = {
  "questionId": "nsw-sel-qa21-049",
  "questionType": "MCQ",
  "stem": "Tom scored 80% on a test with x questions. Emma scored 75% on a different test with y questions. If they answered the same number of questions correctly, and y = x + 4, find x.",
  "mcqOptions": [
    {"id": "A", "text": "40", "isCorrect": false, "feedback": "If x=40, y=44. 80% of 40=32, 75% of 44=33. Not equal."},
    {"id": "B", "text": "50", "isCorrect": false, "feedback": "If x=50, y=54. 80% of 50=40, 75% of 54=40.5. Not equal."},
    {"id": "C", "text": "60", "isCorrect": true, "feedback": "Correct! 80% of 60=48, 75% of 64=48. Equal! ✓"},
    {"id": "D", "text": "80", "isCorrect": false, "feedback": "If x=80, y=84. 80% of 80=64, 75% of 84=63. Not equal."},
    {"id": "E", "text": "100", "isCorrect": false, "feedback": "If x=100, y=104. 80% of 100=80, 75% of 104=78. Not equal."}
  ],
  "solution": "**Methodology: Percentage + Substitution**\n\n**Step 1: Set up equation**\nTom's correct = 0.80x\nEmma's correct = 0.75y = 0.75(x + 4)\n\n**Step 2: Equate**\n0.80x = 0.75(x + 4)\n0.80x = 0.75x + 3\n0.05x = 3\nx = 60\n\n**Verification:**\nTom: 80% of 60 = 48 correct\nEmma: y = 64, 75% of 64 = 48 correct ✓",
  "hints": [
    {"level": 1, "content": "Tom's correct = 0.80x, Emma's = 0.75(x+4)", "revealsCriticalInfo": false},
    {"level": 2, "content": "Set 0.80x = 0.75(x + 4)", "revealsCriticalInfo": false},
    {"level": 3, "content": "0.05x = 3, so x = 60", "revealsCriticalInfo": true}
  ],
  "nswSelective": {"archetype": "Multi-Concept Integration", "archetypeId": "qa21", "conceptsRequired": ["percentages", "simultaneous-equations"], "combinedArchetypes": ["qa11", "qa5"], "distractorTypes": {"A": "wrong_calculation", "B": "close_wrong", "D": "far_wrong", "E": "far_wrong"}, "solutionApproach": "Set up percentage equations → Substitute → Solve", "timeTarget": 90},
  "difficulty": 4,
  "estimatedTime": 90,
  "curriculum": {"system": "NSW K-6 Mathematics", "codes": ["MA3-5NA", "MA3-8NA"], "year": 6, "subject": "Mathematics", "strand": "Number and Algebra"},
  "paperMetadata": {"section": "nsw-selective-mathematics", "setId": "nsw-sel-qa21-set5", "sequenceInPaper": 49},
  "status": "published",
  "validation": {"workedAnswer": 60, "verified": true}
};

// Fix Q50: Answer is $100 (B should be correct)
// J + S = 200, 0.75J + 0.80S = 155
// S = 200 - J
// 0.75J + 0.80(200 - J) = 155
// 0.75J + 160 - 0.80J = 155
// -0.05J = -5
// J = 100
data.questions[49] = {
  "questionId": "nsw-sel-qa21-050",
  "questionType": "MCQ",
  "stem": "A jacket and shoes together cost $200. After 25% off the jacket and 20% off the shoes, the total is $155. What was the original jacket price?",
  "mcqOptions": [
    {"id": "A", "text": "$80", "isCorrect": false, "feedback": "If J=$80, S=$120. Discounted: $60+$96=$156≠$155"},
    {"id": "B", "text": "$100", "isCorrect": true, "feedback": "Correct! J=$100, S=$100. Discounted: $75+$80=$155 ✓"},
    {"id": "C", "text": "$120", "isCorrect": false, "feedback": "If J=$120, S=$80. Discounted: $90+$64=$154≠$155"},
    {"id": "D", "text": "$140", "isCorrect": false, "feedback": "If J=$140, S=$60. Discounted: $105+$48=$153≠$155"},
    {"id": "E", "text": "$60", "isCorrect": false, "feedback": "If J=$60, S=$140. Discounted: $45+$112=$157≠$155"}
  ],
  "solution": "**Methodology: Percentage + Simultaneous Equations**\n\n**Step 1: Set up equations**\nJ + S = 200\n0.75J + 0.80S = 155\n\n**Step 2: Substitute**\nS = 200 - J\n0.75J + 0.80(200 - J) = 155\n0.75J + 160 - 0.80J = 155\n-0.05J = -5\nJ = 100\n\n**Verification:**\nJ = $100, S = $100\n0.75(100) + 0.80(100) = 75 + 80 = $155 ✓",
  "hints": [
    {"level": 1, "content": "Let J = jacket, S = shoes. J + S = 200.", "revealsCriticalInfo": false},
    {"level": 2, "content": "After discounts: 0.75J + 0.80S = 155", "revealsCriticalInfo": false},
    {"level": 3, "content": "Substitute S = 200 - J and solve for J", "revealsCriticalInfo": true}
  ],
  "nswSelective": {"archetype": "Multi-Concept Integration", "archetypeId": "qa21", "conceptsRequired": ["percentages", "simultaneous-equations", "discounts"], "combinedArchetypes": ["qa11", "qa5"], "distractorTypes": {"A": "close_wrong", "C": "close_wrong", "D": "far_wrong", "E": "far_wrong"}, "solutionApproach": "Set up two equations → Substitute → Solve", "timeTarget": 90},
  "difficulty": 5,
  "estimatedTime": 90,
  "curriculum": {"system": "NSW K-6 Mathematics", "codes": ["MA3-5NA", "MA3-8NA"], "year": 6, "subject": "Mathematics", "strand": "Number and Algebra"},
  "paperMetadata": {"section": "nsw-selective-mathematics", "setId": "nsw-sel-qa21-set5", "sequenceInPaper": 50},
  "status": "published",
  "validation": {"workedAnswer": 100, "verified": true}
};

fs.writeFileSync('qa21-complete.json', JSON.stringify(data, null, 2));
console.log('Fixed Q43, Q44, Q45, Q46, Q49, Q50');

// Final check
const issues = data.questions.filter(q => q.status !== 'published');
console.log('Remaining issues:', issues.length > 0 ? issues.map(q => q.questionId).join(', ') : 'None');

const fs = require('fs');
const data = JSON.parse(fs.readFileSync('qa21-complete.json', 'utf8'));

// Q41-Q45: Speed + Sequence (combination 9)
// Q46-Q50: Percentage + Simultaneous (combination 10)

const newQuestions = [
  // Q41: Speed + Sequence - Difficulty 3
  {
    "questionId": "nsw-sel-qa21-041",
    "questionType": "MCQ",
    "stem": "A car starts at 40 km/h and increases speed by 10 km/h every hour. How far does it travel in 4 hours?",
    "mcqOptions": [
      {"id": "A", "text": "160", "isCorrect": false, "feedback": "You used constant 40 km/h. Speed increases each hour."},
      {"id": "B", "text": "200", "isCorrect": false, "feedback": "Did you add the speeds? You need to add distances (speed × 1 hour each)."},
      {"id": "C", "text": "220", "isCorrect": true, "feedback": "Correct! 40 + 50 + 60 + 70 = 220 km."},
      {"id": "D", "text": "240", "isCorrect": false, "feedback": "Check: Hours 1-4 have speeds 40, 50, 60, 70, not 40, 60, 80, 100."},
      {"id": "E", "text": "280", "isCorrect": false, "feedback": "You may have added wrong. Sum is 40+50+60+70 = 220."}
    ],
    "solution": "**Methodology: Speed + Arithmetic Sequence**\n\n**Step 1: List speeds each hour**\nHour 1: 40 km/h\nHour 2: 50 km/h\nHour 3: 60 km/h\nHour 4: 70 km/h\n\n**Step 2: Calculate distances**\nEach hour, distance = speed × 1 hour\nTotal = 40 + 50 + 60 + 70 = 220 km\n\n**Alternative: Using arithmetic series**\nFirst term a = 40, common difference d = 10, n = 4\nSum = n/2 × (2a + (n-1)d) = 4/2 × (80 + 30) = 2 × 110 = 220\n\n**Verification:** ✓",
    "hints": [
      {"level": 1, "content": "Speed each hour: 40, 50, 60, 70 km/h", "revealsCriticalInfo": false},
      {"level": 2, "content": "Distance = speed × time. Each hour is 1 hour.", "revealsCriticalInfo": false},
      {"level": 3, "content": "Total = 40 + 50 + 60 + 70 = 220 km", "revealsCriticalInfo": true}
    ],
    "nswSelective": {"archetype": "Multi-Concept Integration", "archetypeId": "qa21", "conceptsRequired": ["speed-distance-time", "arithmetic-sequences"], "combinedArchetypes": ["qa20", "qa1"], "distractorTypes": {"A": "constant_speed", "B": "sum_speeds", "D": "wrong_increment", "E": "calculation_error"}, "solutionApproach": "List speeds → Calculate each distance → Sum", "timeTarget": 75},
    "difficulty": 3,
    "estimatedTime": 75,
    "curriculum": {"system": "NSW K-6 Mathematics", "codes": ["MA3-5NA", "MA3-9NA"], "year": 6, "subject": "Mathematics", "strand": "Number and Algebra"},
    "paperMetadata": {"section": "nsw-selective-mathematics", "setId": "nsw-sel-qa21-set5", "sequenceInPaper": 41},
    "status": "published",
    "validation": {"workedAnswer": 220, "verified": true}
  },
  
  // Q42: Speed + Sequence - Difficulty 3
  {
    "questionId": "nsw-sel-qa21-042",
    "questionType": "MCQ",
    "stem": "A cyclist travels for 5 hours. In the first hour she covers 12 km, and each subsequent hour she covers 3 km more than the previous hour. What is her total distance?",
    "mcqOptions": [
      {"id": "A", "text": "60", "isCorrect": false, "feedback": "You used constant 12 km/h. Distance increases each hour."},
      {"id": "B", "text": "75", "isCorrect": false, "feedback": "Check: 12+15+18+21+24 = 90, not 75."},
      {"id": "C", "text": "90", "isCorrect": true, "feedback": "Correct! 12+15+18+21+24 = 90 km."},
      {"id": "D", "text": "96", "isCorrect": false, "feedback": "Too high. Sum the distances: 12+15+18+21+24."},
      {"id": "E", "text": "84", "isCorrect": false, "feedback": "Close but check: 12+15+18+21+24 = 90."}
    ],
    "solution": "**Methodology: Distance + Arithmetic Sequence**\n\n**Step 1: List distances each hour**\nHour 1: 12 km\nHour 2: 15 km\nHour 3: 18 km\nHour 4: 21 km\nHour 5: 24 km\n\n**Step 2: Sum**\nTotal = 12 + 15 + 18 + 21 + 24 = 90 km\n\n**Alternative: Arithmetic series formula**\na = 12, d = 3, n = 5\nSum = n/2 × (2a + (n-1)d) = 5/2 × (24 + 12) = 2.5 × 36 = 90\n\n**Verification:** ✓",
    "hints": [
      {"level": 1, "content": "Distances each hour: 12, 15, 18, 21, 24 km", "revealsCriticalInfo": false},
      {"level": 2, "content": "This is an arithmetic sequence with first term 12, difference 3", "revealsCriticalInfo": false},
      {"level": 3, "content": "Sum = 12+15+18+21+24 = 90 km", "revealsCriticalInfo": true}
    ],
    "nswSelective": {"archetype": "Multi-Concept Integration", "archetypeId": "qa21", "conceptsRequired": ["speed-distance-time", "arithmetic-sequences"], "combinedArchetypes": ["qa20", "qa1"], "distractorTypes": {"A": "constant_distance", "B": "calculation_error", "D": "overcount", "E": "close_error"}, "solutionApproach": "List distances → Sum sequence", "timeTarget": 75},
    "difficulty": 3,
    "estimatedTime": 75,
    "curriculum": {"system": "NSW K-6 Mathematics", "codes": ["MA3-5NA", "MA3-9NA"], "year": 6, "subject": "Mathematics", "strand": "Number and Algebra"},
    "paperMetadata": {"section": "nsw-selective-mathematics", "setId": "nsw-sel-qa21-set5", "sequenceInPaper": 42},
    "status": "published",
    "validation": {"workedAnswer": 90, "verified": true}
  },
  
  // Q43: Speed + Sequence - Difficulty 4
  {
    "questionId": "nsw-sel-qa21-043",
    "questionType": "MCQ",
    "stem": "A runner runs laps around a 400m track. Each lap takes 10 seconds longer than the previous lap. If the first lap takes 80 seconds, how many complete laps can she run in 10 minutes?",
    "mcqOptions": [
      {"id": "A", "text": "5", "isCorrect": false, "feedback": "Check: 80+90+100+110+120 = 500s. There's time for more."},
      {"id": "B", "text": "6", "isCorrect": true, "feedback": "Correct! Laps take 80+90+100+110+120+130 = 630s = 10.5 min. Only 6 complete in 600s."},
      {"id": "C", "text": "7", "isCorrect": false, "feedback": "7 laps = 80+90+100+110+120+130+140 = 770s > 600s. Too many."},
      {"id": "D", "text": "8", "isCorrect": false, "feedback": "Way too many. Track times carefully."},
      {"id": "E", "text": "4", "isCorrect": false, "feedback": "Too few. 4 laps = 80+90+100+110 = 380s. More time available."}
    ],
    "solution": "**Methodology: Time Sequence + Constraint**\n\n**Step 1: Convert to seconds**\n10 minutes = 600 seconds\n\n**Step 2: List lap times**\nLap 1: 80s\nLap 2: 90s\nLap 3: 100s\nLap 4: 110s\nLap 5: 120s\nLap 6: 130s\nLap 7: 140s\n\n**Step 3: Find cumulative time**\nAfter 5 laps: 80+90+100+110+120 = 500s\nAfter 6 laps: 500+130 = 630s > 600s\n\n**Wait, let me recalculate:**\nAfter 6 laps: 80+90+100+110+120+130 = 630s\n\nBut we only have 600s, so only 5 complete laps?\nActually: After 5 laps = 500s, time remaining = 100s\nLap 6 takes 130s, so can't complete.\n\n**Rechecking:** 5 laps = 500s. Need 130s for lap 6, only have 100s.\nAnswer should be 5 laps.\n\n**Fixing answer...**",
    "hints": [
      {"level": 1, "content": "Lap times: 80, 90, 100, 110, 120, 130... seconds", "revealsCriticalInfo": false},
      {"level": 2, "content": "Find cumulative time: 80, 170, 270, 380, 500, 630...", "revealsCriticalInfo": false},
      {"level": 3, "content": "Which cumulative total is ≤ 600s?", "revealsCriticalInfo": true}
    ],
    "nswSelective": {"archetype": "Multi-Concept Integration", "archetypeId": "qa21", "conceptsRequired": ["time-sequences", "cumulative-sums", "constraints"], "combinedArchetypes": ["qa20", "qa1"], "distractorTypes": {"A": "undercount", "C": "overcount", "D": "far_overcount", "E": "far_undercount"}, "solutionApproach": "List times → Cumulative sum → Find constraint boundary", "timeTarget": 90},
    "difficulty": 4,
    "estimatedTime": 90,
    "curriculum": {"system": "NSW K-6 Mathematics", "codes": ["MA3-5NA", "MA3-9NA"], "year": 6, "subject": "Mathematics", "strand": "Number and Algebra"},
    "paperMetadata": {"section": "nsw-selective-mathematics", "setId": "nsw-sel-qa21-set5", "sequenceInPaper": 43},
    "status": "needs_review",
    "validation": {"issue": "Need to verify: 5 laps or 6 laps?"}
  },
  
  // Q44: Speed + Sequence - Difficulty 4
  {
    "questionId": "nsw-sel-qa21-044",
    "questionType": "MCQ",
    "stem": "A train accelerates such that it travels 50m in the 1st second, 60m in the 2nd second, 70m in the 3rd second, and so on. After how many seconds will it have travelled exactly 550m?",
    "mcqOptions": [
      {"id": "A", "text": "8", "isCorrect": false, "feedback": "Sum after 8s: 50+60+70+80+90+100+110+120 = 680m > 550m"},
      {"id": "B", "text": "7", "isCorrect": false, "feedback": "Sum after 7s: 50+60+70+80+90+100+110 = 560m > 550m"},
      {"id": "C", "text": "6", "isCorrect": false, "feedback": "Sum after 6s: 50+60+70+80+90+100 = 450m < 550m"},
      {"id": "D", "text": "5", "isCorrect": true, "feedback": "Sum after 5s: 50+60+70+80+90 = 350m... Wait, that's not 550m either. Let me check."},
      {"id": "E", "text": "9", "isCorrect": false, "feedback": "Too many seconds."}
    ],
    "solution": "**Let me recalculate carefully:**\n\nSecond 1: 50m, Total: 50m\nSecond 2: 60m, Total: 110m\nSecond 3: 70m, Total: 180m\nSecond 4: 80m, Total: 260m\nSecond 5: 90m, Total: 350m\nSecond 6: 100m, Total: 450m\nSecond 7: 110m, Total: 560m\n\n550m is between 450m (6s) and 560m (7s). It never equals exactly 550m!\n\n**NEED TO FIX THIS QUESTION**",
    "hints": [
      {"level": 1, "content": "Distance each second: 50, 60, 70, 80... (arithmetic sequence)", "revealsCriticalInfo": false},
      {"level": 2, "content": "Find cumulative sums: 50, 110, 180, 260, 350, 450...", "revealsCriticalInfo": false},
      {"level": 3, "content": "Which cumulative sum equals 550?", "revealsCriticalInfo": true}
    ],
    "nswSelective": {"archetype": "Multi-Concept Integration", "archetypeId": "qa21", "conceptsRequired": ["distance-sequences", "cumulative-sums"], "combinedArchetypes": ["qa20", "qa1"], "distractorTypes": {"A": "overcount", "B": "close_high", "C": "close_low", "E": "far_overcount"}, "solutionApproach": "List distances → Cumulative sum → Find target", "timeTarget": 90},
    "difficulty": 4,
    "estimatedTime": 90,
    "curriculum": {"system": "NSW K-6 Mathematics", "codes": ["MA3-5NA", "MA3-9NA"], "year": 6, "subject": "Mathematics", "strand": "Number and Algebra"},
    "paperMetadata": {"section": "nsw-selective-mathematics", "setId": "nsw-sel-qa21-set5", "sequenceInPaper": 44},
    "status": "needs_correction",
    "validation": {"issue": "550m is never reached exactly - need to change target distance"}
  },
  
  // Q45: Speed + Sequence - Difficulty 5
  {
    "questionId": "nsw-sel-qa21-045",
    "questionType": "MCQ",
    "stem": "A delivery driver makes stops along a route. From start to stop 1 is 5 km, from stop 1 to stop 2 is 7 km, from stop 2 to stop 3 is 9 km, and so on (each leg 2 km longer). If she averages 30 km/h, how long does the journey to stop 6 take?",
    "mcqOptions": [
      {"id": "A", "text": "2 hours", "isCorrect": false, "feedback": "Check your distance calculation. Total is more than 60 km."},
      {"id": "B", "text": "2.5 hours", "isCorrect": false, "feedback": "Total distance = 5+7+9+11+13+15 = 60 km. Time = 60/30 = 2 hours. Wait, that's A!"},
      {"id": "C", "text": "3 hours", "isCorrect": false, "feedback": "Distance is 60 km at 30 km/h = 2 hours, not 3."},
      {"id": "D", "text": "1.5 hours", "isCorrect": false, "feedback": "Too short. Calculate total distance first."},
      {"id": "E", "text": "2.2 hours", "isCorrect": false, "feedback": "Not quite. 60 km at 30 km/h = 2 hours exactly."}
    ],
    "solution": "**Methodology: Arithmetic Sequence + Speed**\n\n**Step 1: Calculate total distance**\nLeg distances: 5, 7, 9, 11, 13, 15 km (6 legs to reach stop 6)\nSum = 5+7+9+11+13+15 = 60 km\n\nAlternatively: a=5, d=2, n=6\nSum = n/2 × (2a + (n-1)d) = 6/2 × (10 + 10) = 3 × 20 = 60 km\n\n**Step 2: Calculate time**\nTime = Distance / Speed = 60 / 30 = 2 hours\n\n**Verification:** 60 km at 30 km/h = 2 hours ✓",
    "hints": [
      {"level": 1, "content": "Distances: 5, 7, 9, 11, 13, 15 km for the 6 legs", "revealsCriticalInfo": false},
      {"level": 2, "content": "Total distance = sum of arithmetic sequence", "revealsCriticalInfo": false},
      {"level": 3, "content": "Time = Distance / Speed", "revealsCriticalInfo": true}
    ],
    "nswSelective": {"archetype": "Multi-Concept Integration", "archetypeId": "qa21", "conceptsRequired": ["arithmetic-sequences", "speed-distance-time"], "combinedArchetypes": ["qa1", "qa20"], "distractorTypes": {"B": "wrong_calculation", "C": "wrong_speed", "D": "wrong_distance", "E": "close_error"}, "solutionApproach": "Sum sequence → Apply speed formula", "timeTarget": 90},
    "difficulty": 5,
    "estimatedTime": 90,
    "curriculum": {"system": "NSW K-6 Mathematics", "codes": ["MA3-5NA", "MA3-9NA"], "year": 6, "subject": "Mathematics", "strand": "Number and Algebra"},
    "paperMetadata": {"section": "nsw-selective-mathematics", "setId": "nsw-sel-qa21-set5", "sequenceInPaper": 45},
    "status": "needs_review",
    "validation": {"issue": "A is correct (2 hours), need to fix options"}
  },
  
  // Q46: Percentage + Simultaneous - Difficulty 3
  {
    "questionId": "nsw-sel-qa21-046",
    "questionType": "MCQ",
    "stem": "A shirt costs $x and pants cost $y. After a 20% discount on the shirt and 10% discount on pants, the total is $54. If 0.8x = 0.9y (both discounted prices equal), find x.",
    "mcqOptions": [
      {"id": "A", "text": "30", "isCorrect": false, "feedback": "If x=30, 0.8(30)=24. Then y where 0.9y=24, so y=26.67. Total 0.8(30)+0.9(26.67)=24+24=48≠54."},
      {"id": "B", "text": "35", "isCorrect": false, "feedback": "If x=35, 0.8(35)=28, need 0.9y=28, y=31.11. Total=56≠54."},
      {"id": "C", "text": "27", "isCorrect": false, "feedback": "Check the calculation. If x=27, 0.8(27)=21.6. y=24. Total=45.6≠54."},
      {"id": "D", "text": "45", "isCorrect": true, "feedback": "Correct! If 0.8x=0.9y, and 0.8x+0.9y=54, then 2(0.8x)=54, so 0.8x=27, x=33.75... Wait, that's not 45."},
      {"id": "E", "text": "40", "isCorrect": false, "feedback": "Let me recalculate this problem."}
    ],
    "solution": "**Let me recalculate:**\n\nGiven: 0.8x = 0.9y (equal discounted prices)\nAnd: 0.8x + 0.9y = 54\n\nFrom first equation, both discounted prices are equal, call it P.\nSo P + P = 54\n2P = 54\nP = 27\n\nSo 0.8x = 27\nx = 27/0.8 = 33.75\n\n**This gives a non-integer! Need to fix the problem.**",
    "hints": [
      {"level": 1, "content": "If the discounted prices are equal, call them both P.", "revealsCriticalInfo": false},
      {"level": 2, "content": "P + P = 54, so P = 27", "revealsCriticalInfo": false},
      {"level": 3, "content": "0.8x = 27, solve for x", "revealsCriticalInfo": true}
    ],
    "nswSelective": {"archetype": "Multi-Concept Integration", "archetypeId": "qa21", "conceptsRequired": ["percentages", "simultaneous-equations"], "combinedArchetypes": ["qa11", "qa5"], "distractorTypes": {"A": "wrong_equation", "B": "close_error", "C": "wrong_discount", "E": "calculation_error"}, "solutionApproach": "Set up percentage equations → Solve simultaneously", "timeTarget": 90},
    "difficulty": 3,
    "estimatedTime": 90,
    "curriculum": {"system": "NSW K-6 Mathematics", "codes": ["MA3-5NA", "MA3-8NA"], "year": 6, "subject": "Mathematics", "strand": "Number and Algebra"},
    "paperMetadata": {"section": "nsw-selective-mathematics", "setId": "nsw-sel-qa21-set5", "sequenceInPaper": 46},
    "status": "needs_correction",
    "validation": {"issue": "Non-integer answer - need to redesign problem"}
  },
  
  // Q47: Percentage + Simultaneous - Difficulty 3
  {
    "questionId": "nsw-sel-qa21-047",
    "questionType": "MCQ",
    "stem": "Two numbers have a sum of 100. If 30% of the larger equals 50% of the smaller, what is the larger number?",
    "mcqOptions": [
      {"id": "A", "text": "50", "isCorrect": false, "feedback": "If both were 50, then 30% of 50 = 15, but 50% of 50 = 25. Not equal."},
      {"id": "B", "text": "60", "isCorrect": false, "feedback": "If larger=60, smaller=40. 30% of 60=18, 50% of 40=20. Not equal."},
      {"id": "C", "text": "62.5", "isCorrect": true, "feedback": "Correct! If L=62.5, S=37.5. 30% of 62.5=18.75=50% of 37.5 ✓"},
      {"id": "D", "text": "65", "isCorrect": false, "feedback": "If larger=65, smaller=35. 30% of 65=19.5, 50% of 35=17.5. Not equal."},
      {"id": "E", "text": "75", "isCorrect": false, "feedback": "If larger=75, smaller=25. 30% of 75=22.5, 50% of 25=12.5. Not equal."}
    ],
    "solution": "**Methodology: Percentage + Simultaneous Equations**\n\n**Step 1: Set up equations**\nLet L = larger, S = smaller\nL + S = 100\n0.30L = 0.50S\n\n**Step 2: From second equation**\n0.30L = 0.50S\n3L = 5S\nL = 5S/3\n\n**Step 3: Substitute**\n5S/3 + S = 100\n5S/3 + 3S/3 = 100\n8S/3 = 100\nS = 37.5\nL = 100 - 37.5 = 62.5\n\n**Verification:**\n30% of 62.5 = 18.75\n50% of 37.5 = 18.75 ✓",
    "hints": [
      {"level": 1, "content": "Let L = larger, S = smaller. L + S = 100.", "revealsCriticalInfo": false},
      {"level": 2, "content": "0.30L = 0.50S means 3L = 5S", "revealsCriticalInfo": false},
      {"level": 3, "content": "Substitute L = 5S/3 into L + S = 100", "revealsCriticalInfo": true}
    ],
    "nswSelective": {"archetype": "Multi-Concept Integration", "archetypeId": "qa21", "conceptsRequired": ["percentages", "simultaneous-equations"], "combinedArchetypes": ["qa11", "qa5"], "distractorTypes": {"A": "half_each", "B": "close_wrong", "D": "close_wrong", "E": "far_wrong"}, "solutionApproach": "Set up percentage equation → Solve with sum constraint", "timeTarget": 90},
    "difficulty": 3,
    "estimatedTime": 90,
    "curriculum": {"system": "NSW K-6 Mathematics", "codes": ["MA3-5NA", "MA3-8NA"], "year": 6, "subject": "Mathematics", "strand": "Number and Algebra"},
    "paperMetadata": {"section": "nsw-selective-mathematics", "setId": "nsw-sel-qa21-set5", "sequenceInPaper": 47},
    "status": "published",
    "validation": {"workedAnswer": 62.5, "verified": true}
  },
  
  // Q48: Percentage + Simultaneous - Difficulty 4
  {
    "questionId": "nsw-sel-qa21-048",
    "questionType": "MCQ",
    "stem": "A shop has two items originally priced at $50 and $80. After different discounts, both cost the same. If the first item has a 20% discount, what discount does the second item have?",
    "mcqOptions": [
      {"id": "A", "text": "40%", "isCorrect": false, "feedback": "40% off $80 = $48, but 20% off $50 = $40. Not equal."},
      {"id": "B", "text": "50%", "isCorrect": true, "feedback": "Correct! 20% off $50 = $40. 50% off $80 = $40. Equal! ✓"},
      {"id": "C", "text": "45%", "isCorrect": false, "feedback": "45% off $80 = $44 ≠ $40."},
      {"id": "D", "text": "35%", "isCorrect": false, "feedback": "35% off $80 = $52 ≠ $40."},
      {"id": "E", "text": "30%", "isCorrect": false, "feedback": "30% off $80 = $56 ≠ $40."}
    ],
    "solution": "**Methodology: Percentage + Equal Prices**\n\n**Step 1: Find discounted price of first item**\n$50 with 20% off = $50 × 0.80 = $40\n\n**Step 2: Find discount needed for second item**\n$80 × (1 - d) = $40\n1 - d = 40/80 = 0.50\nd = 0.50 = 50%\n\n**Verification:**\n$50 × 0.80 = $40 ✓\n$80 × 0.50 = $40 ✓",
    "hints": [
      {"level": 1, "content": "First item after 20% off: $50 × 0.80 = ?", "revealsCriticalInfo": false},
      {"level": 2, "content": "Second item must also equal this price.", "revealsCriticalInfo": false},
      {"level": 3, "content": "Find what percentage of $80 equals $40.", "revealsCriticalInfo": true}
    ],
    "nswSelective": {"archetype": "Multi-Concept Integration", "archetypeId": "qa21", "conceptsRequired": ["percentages", "reverse-percentage", "equations"], "combinedArchetypes": ["qa11", "qa13"], "distractorTypes": {"A": "close_wrong", "C": "close_wrong", "D": "far_wrong", "E": "far_wrong"}, "solutionApproach": "Calculate first discount → Find matching discount", "timeTarget": 75},
    "difficulty": 4,
    "estimatedTime": 75,
    "curriculum": {"system": "NSW K-6 Mathematics", "codes": ["MA3-5NA", "MA3-8NA"], "year": 6, "subject": "Mathematics", "strand": "Number and Algebra"},
    "paperMetadata": {"section": "nsw-selective-mathematics", "setId": "nsw-sel-qa21-set5", "sequenceInPaper": 48},
    "status": "published",
    "validation": {"workedAnswer": 50, "verified": true}
  },
  
  // Q49: Percentage + Simultaneous - Difficulty 4
  {
    "questionId": "nsw-sel-qa21-049",
    "questionType": "MCQ",
    "stem": "Tom scored 80% on a test with x questions. Emma scored 75% on a different test with y questions. If they answered the same number of questions correctly, and y = x + 4, find x.",
    "mcqOptions": [
      {"id": "A", "text": "12", "isCorrect": false, "feedback": "If x=12, 80% of 12=9.6 (not whole). Try again."},
      {"id": "B", "text": "15", "isCorrect": true, "feedback": "Correct! 80% of 15 = 12 correct. 75% of 19 = 14.25... wait, that's not equal."},
      {"id": "C", "text": "16", "isCorrect": false, "feedback": "If x=16, 80% of 16=12.8 (not whole)."},
      {"id": "D", "text": "20", "isCorrect": false, "feedback": "If x=20, 80% of 20=16. y=24, 75% of 24=18 ≠ 16."},
      {"id": "E", "text": "10", "isCorrect": false, "feedback": "If x=10, 80% of 10=8. y=14, 75% of 14=10.5 ≠ 8."}
    ],
    "solution": "**Let me recalculate:**\n\n0.80x = 0.75y = 0.75(x + 4)\n0.80x = 0.75x + 3\n0.05x = 3\nx = 60\n\n**Verification:**\n80% of 60 = 48 correct\ny = 64, 75% of 64 = 48 correct ✓\n\n**The answer is 60, not 15! Need to fix options.**",
    "hints": [
      {"level": 1, "content": "Let correct answers = 0.80x = 0.75y", "revealsCriticalInfo": false},
      {"level": 2, "content": "Substitute y = x + 4 into 0.80x = 0.75y", "revealsCriticalInfo": false},
      {"level": 3, "content": "Solve 0.80x = 0.75(x + 4)", "revealsCriticalInfo": true}
    ],
    "nswSelective": {"archetype": "Multi-Concept Integration", "archetypeId": "qa21", "conceptsRequired": ["percentages", "simultaneous-equations"], "combinedArchetypes": ["qa11", "qa5"], "distractorTypes": {"A": "calculation_error", "C": "close_wrong", "D": "wrong_substitution", "E": "far_wrong"}, "solutionApproach": "Set up percentage equations → Substitute → Solve", "timeTarget": 90},
    "difficulty": 4,
    "estimatedTime": 90,
    "curriculum": {"system": "NSW K-6 Mathematics", "codes": ["MA3-5NA", "MA3-8NA"], "year": 6, "subject": "Mathematics", "strand": "Number and Algebra"},
    "paperMetadata": {"section": "nsw-selective-mathematics", "setId": "nsw-sel-qa21-set5", "sequenceInPaper": 49},
    "status": "needs_correction",
    "validation": {"issue": "Answer is 60, not 15 - need to fix options"}
  },
  
  // Q50: Percentage + Simultaneous - Difficulty 5
  {
    "questionId": "nsw-sel-qa21-050",
    "questionType": "MCQ",
    "stem": "A jacket and shoes together cost $200. After 25% off the jacket and 20% off the shoes, the total is $155. What was the original jacket price?",
    "mcqOptions": [
      {"id": "A", "text": "$80", "isCorrect": false, "feedback": "If jacket=$80, shoes=$120. After discounts: $60+$96=$156≠$155."},
      {"id": "B", "text": "$100", "isCorrect": false, "feedback": "If jacket=$100, shoes=$100. After discounts: $75+$80=$155 ✓... Wait, this works!"},
      {"id": "C", "text": "$120", "isCorrect": true, "feedback": "Correct! Jacket=$120 (discount $90), Shoes=$80 (discount $64). Total=$154... Let me recalculate."},
      {"id": "D", "text": "$140", "isCorrect": false, "feedback": "If jacket=$140, shoes=$60. After discounts: $105+$48=$153≠$155."},
      {"id": "E", "text": "$90", "isCorrect": false, "feedback": "If jacket=$90, shoes=$110. After discounts: $67.5+$88=$155.5≈$155."}
    ],
    "solution": "**Methodology: Percentage + Simultaneous**\n\n**Step 1: Set up equations**\nLet J = jacket price, S = shoes price\nJ + S = 200\n0.75J + 0.80S = 155\n\n**Step 2: Solve**\nFrom first: S = 200 - J\nSubstitute: 0.75J + 0.80(200 - J) = 155\n0.75J + 160 - 0.80J = 155\n-0.05J = -5\nJ = 100\n\n**Verification:**\nJ = $100, S = $100\n0.75(100) + 0.80(100) = 75 + 80 = $155 ✓\n\n**The answer is $100 (option B), not $120!**",
    "hints": [
      {"level": 1, "content": "Let J = jacket, S = shoes. J + S = 200.", "revealsCriticalInfo": false},
      {"level": 2, "content": "After discounts: 0.75J + 0.80S = 155", "revealsCriticalInfo": false},
      {"level": 3, "content": "Substitute S = 200 - J and solve", "revealsCriticalInfo": true}
    ],
    "nswSelective": {"archetype": "Multi-Concept Integration", "archetypeId": "qa21", "conceptsRequired": ["percentages", "simultaneous-equations", "discounts"], "combinedArchetypes": ["qa11", "qa5"], "distractorTypes": {"A": "calculation_error", "C": "wrong_answer", "D": "far_wrong", "E": "close_error"}, "solutionApproach": "Set up two equations → Substitute → Solve", "timeTarget": 90},
    "difficulty": 5,
    "estimatedTime": 90,
    "curriculum": {"system": "NSW K-6 Mathematics", "codes": ["MA3-5NA", "MA3-8NA"], "year": 6, "subject": "Mathematics", "strand": "Number and Algebra"},
    "paperMetadata": {"section": "nsw-selective-mathematics", "setId": "nsw-sel-qa21-set5", "sequenceInPaper": 50},
    "status": "needs_correction",
    "validation": {"issue": "Answer is $100 (B), not $120 (C) - need to fix options"}
  }
];

data.questions.push(...newQuestions);
fs.writeFileSync('qa21-complete.json', JSON.stringify(data, null, 2));
console.log('Added Q41-Q50. Total questions:', data.questions.length);

// Count issues
const issues = data.questions.filter(q => q.status !== 'published');
console.log('Questions needing review/correction:', issues.map(q => q.questionId).join(', '));

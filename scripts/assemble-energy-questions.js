#!/usr/bin/env node

/**
 * Assembles all 4 phases of Energy Forms and Transformations questions
 * into a single complete file with 80 questions
 */

const fs = require('fs');
const path = require('path');

const phaseFiles = [
  { path: 'questions/energy-forms-transformations-phase1-q1-q20.json', phase: 1, range: 'Q1-Q20' },
  { path: 'energy-forms-transformations-phase2-q21-q40.json', phase: 2, range: 'Q21-Q40' },
  { path: 'questions/year8-energy-forms-transformations-phase3-q41-q60.json', phase: 3, range: 'Q41-Q60' },
  { path: 'questions/energy-forms-transformations-phase4-q61-q80.json', phase: 4, range: 'Q61-Q80' },
];

const outputFile = 'questions/energy-forms-transformations-year8-complete.json';

console.log('======================================================');
console.log(' ASSEMBLING ENERGY FORMS AND TRANSFORMATIONS QUESTIONS');
console.log('======================================================\n');

let allQuestions = [];

// Load each phase file
for (const file of phaseFiles) {
  const filePath = path.join(__dirname, file.path);

  if (!fs.existsSync(filePath)) {
    console.error(`ERROR: Phase ${file.phase} file not found: ${filePath}`);
    process.exit(1);
  }

  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    // Handle both array format and {questions: [...]} format
    const questions = Array.isArray(data) ? data : (data.questions || []);

    console.log(`Phase ${file.phase} (${file.range}): ${questions.length} questions loaded`);

    if (questions.length !== 20) {
      console.warn(`  WARNING: Expected 20 questions, got ${questions.length}`);
    }

    allQuestions = allQuestions.concat(questions);
  } catch (error) {
    console.error(`ERROR reading phase ${file.phase}:`, error.message);
    process.exit(1);
  }
}

console.log(`\nTotal questions assembled: ${allQuestions.length}`);

if (allQuestions.length !== 80) {
  console.warn(`WARNING: Expected 80 questions, got ${allQuestions.length}`);
}

// Verify question IDs are sequential
const expectedIds = [];
for (let i = 1; i <= 80; i++) {
  expectedIds.push(`eft-y8-${String(i).padStart(3, '0')}`);
}

const actualIds = allQuestions.map(q => q.questionId);
const missingIds = expectedIds.filter(id => !actualIds.includes(id));
const duplicateIds = actualIds.filter((id, idx) => actualIds.indexOf(id) !== idx);

if (missingIds.length > 0) {
  console.warn(`\nMissing question IDs: ${missingIds.join(', ')}`);
}
if (duplicateIds.length > 0) {
  console.warn(`\nDuplicate question IDs: ${duplicateIds.join(', ')}`);
}

// Sort questions by ID to ensure correct order
allQuestions.sort((a, b) => {
  const numA = parseInt(a.questionId.split('-').pop());
  const numB = parseInt(b.questionId.split('-').pop());
  return numA - numB;
});

// Show set distribution
const setIdCounts = {};
allQuestions.forEach(q => {
  const setId = q.paperMetadata?.setId || 'unknown';
  setIdCounts[setId] = (setIdCounts[setId] || 0) + 1;
});

console.log('\nDistribution by setId:');
Object.entries(setIdCounts).sort().forEach(([setId, count]) => {
  console.log(`  ${setId}: ${count} questions`);
});

// Create complete output
const output = {
  metadata: {
    topic: "Energy Forms and Transformations",
    topicSlug: "energy-forms-transformations",
    outcomeCode: "ACSSU155",
    year: 8,
    subject: "Science",
    strand: "Physical Sciences",
    questionCount: allQuestions.length,
    generatedAt: new Date().toISOString().split('T')[0],
    version: "1.0",
    setsRange: "1-8",
    phaseDistribution: {
      phase1_foundation: { questions: 20, sets: ["year8-energy-forms-transformations-set1", "year8-energy-forms-transformations-set2"] },
      phase2_application: { questions: 20, sets: ["year8-energy-forms-transformations-set3", "year8-energy-forms-transformations-set4"] },
      phase3_connection: { questions: 20, sets: ["year8-energy-forms-transformations-set5", "year8-energy-forms-transformations-set6"] },
      phase4_mastery: { questions: 20, sets: ["year8-energy-forms-transformations-set7", "year8-energy-forms-transformations-set8"] }
    }
  },
  questions: allQuestions
};

// Write output file
const outputPath = path.join(__dirname, outputFile);
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

console.log(`\n======================================================`);
console.log(` Successfully wrote ${allQuestions.length} questions to:`);
console.log(` ${outputPath}`);
console.log(`======================================================\n`);

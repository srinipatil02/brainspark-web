#!/usr/bin/env node
/**
 * Assembles all 12 linear equations set files into a complete 120-question file
 * Output: scripts/questions/linear-equations-year8-complete.json
 */

const fs = require('fs');
const path = require('path');

const questionsDir = path.join(__dirname, 'questions');
const outputFile = path.join(questionsDir, 'linear-equations-year8-complete.json');

// Collect all questions from all sets
const allQuestions = [];
const setFiles = [];

for (let i = 1; i <= 12; i++) {
  const filename = `linear-equations-year8-set${i}.json`;
  const filepath = path.join(questionsDir, filename);

  if (!fs.existsSync(filepath)) {
    console.error(`Missing file: ${filename}`);
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(filepath, 'utf8'));
  setFiles.push({ setNumber: i, metadata: data.metadata, questionCount: data.questions.length });
  allQuestions.push(...data.questions);
}

console.log('\n=== Linear Equations Year 8 Question Set Assembly ===\n');
console.log('Sets processed:');
setFiles.forEach(s => {
  console.log(`  Set ${s.setNumber}: ${s.metadata.focus} (${s.questionCount} questions)`);
});

console.log(`\nTotal questions: ${allQuestions.length}`);

// Validate question IDs are sequential
const expectedIds = [];
for (let i = 1; i <= 120; i++) {
  expectedIds.push(`linear-eq-y8-${String(i).padStart(3, '0')}`);
}

const actualIds = allQuestions.map(q => q.questionId);
const missingIds = expectedIds.filter(id => !actualIds.includes(id));
const duplicateIds = actualIds.filter((id, idx) => actualIds.indexOf(id) !== idx);

if (missingIds.length > 0) {
  console.error('\nMissing question IDs:', missingIds);
}
if (duplicateIds.length > 0) {
  console.error('\nDuplicate question IDs:', duplicateIds);
}

// Create the complete output
const completeOutput = {
  metadata: {
    topic: "Linear Equations",
    topicSlug: "linear-equations",
    outcomeCode: "ACMNA194",
    year: 8,
    subject: "Mathematics",
    strand: "Algebra",
    questionCount: allQuestions.length,
    setCount: 12,
    purpose: "WORKED_SOLUTION questions for step-by-step AI grading",
    createdAt: new Date().toISOString().split('T')[0],
    version: "1.0",
    phases: {
      foundation: { sets: [1, 2, 3], questions: "Q1-30", difficulty: "1-2" },
      application: { sets: [4, 5, 6], questions: "Q31-60", difficulty: "2-3" },
      connection: { sets: [7, 8, 9], questions: "Q61-90", difficulty: "3" },
      mastery: { sets: [10, 11, 12], questions: "Q91-120", difficulty: "3-4" }
    },
    topicProgression: [
      "One-step equations (+/-)",
      "One-step equations (×/÷)",
      "Two-step equations",
      "Equations with brackets",
      "Equations with fractions",
      "Variables both sides",
      "Complex multi-step",
      "Word problems"
    ]
  },
  questions: allQuestions
};

// Write the complete file
fs.writeFileSync(outputFile, JSON.stringify(completeOutput, null, 2));
console.log(`\nComplete file saved: ${outputFile}`);

// Summary statistics
const byDifficulty = {};
allQuestions.forEach(q => {
  byDifficulty[q.difficulty] = (byDifficulty[q.difficulty] || 0) + 1;
});

console.log('\nDifficulty distribution:');
Object.keys(byDifficulty).sort().forEach(d => {
  console.log(`  Level ${d}: ${byDifficulty[d]} questions`);
});

const byType = {};
allQuestions.forEach(q => {
  byType[q.questionType] = (byType[q.questionType] || 0) + 1;
});

console.log('\nQuestion types:');
Object.keys(byType).forEach(t => {
  console.log(`  ${t}: ${byType[t]} questions`);
});

// Validate workedSolutionConfig
let validCount = 0;
let invalidQuestions = [];
allQuestions.forEach(q => {
  if (q.workedSolutionConfig &&
      q.workedSolutionConfig.startingExpression &&
      q.workedSolutionConfig.expectedAnswers &&
      q.workedSolutionConfig.gradingGuidance) {
    validCount++;
  } else {
    invalidQuestions.push(q.questionId);
  }
});

console.log(`\nWorkedSolutionConfig validation: ${validCount}/${allQuestions.length} valid`);
if (invalidQuestions.length > 0) {
  console.log('Invalid questions:', invalidQuestions);
}

console.log('\n✅ Assembly complete!\n');

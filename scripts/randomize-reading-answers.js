#!/usr/bin/env node
/**
 * Randomize Reading Question Answer Positions
 *
 * Fixes the issue where all correct answers are "A" by shuffling
 * the mcqOptions and reassigning position labels (A, B, C, D).
 *
 * Usage: node randomize-reading-answers.js
 */

const fs = require('fs');
const path = require('path');

const READING_DIR = path.join(__dirname, 'questions', 'nsw-selective', 'reading');

// Fisher-Yates shuffle
function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Get all testlet files (not the combined files)
function getTestletFiles() {
  const files = [];
  const archetypeDirs = fs.readdirSync(READING_DIR).filter(f =>
    fs.statSync(path.join(READING_DIR, f)).isDirectory()
  );

  for (const dir of archetypeDirs) {
    const dirPath = path.join(READING_DIR, dir);
    const testletFiles = fs.readdirSync(dirPath)
      .filter(f => f.match(/testlet-\d+\.json$/))
      .map(f => path.join(dirPath, f));
    files.push(...testletFiles);
  }

  return files;
}

// Randomize answer positions for a question
function randomizeQuestion(question) {
  const options = question.mcqOptions;
  if (!options || options.length !== 4) {
    console.warn(`  Warning: Question ${question.questionId} has ${options?.length || 0} options, skipping`);
    return question;
  }

  // Create mapping of old id -> option content (for distractor types)
  const oldIdToOption = {};
  options.forEach(opt => {
    oldIdToOption[opt.id] = { ...opt };
  });

  // Find the correct option before shuffling
  const correctOption = options.find(o => o.isCorrect);
  const correctText = correctOption?.text;

  // Shuffle the options
  const shuffled = shuffle(options);

  // Create mapping of old id -> new id (for distractor types)
  const oldToNewId = {};

  // Reassign ids based on new positions
  const labels = ['A', 'B', 'C', 'D'];
  shuffled.forEach((opt, index) => {
    const oldId = opt.id;
    const newId = labels[index];
    oldToNewId[oldId] = newId;
    opt.id = newId;
  });

  // Find where the correct answer ended up
  const newCorrectId = shuffled.find(o => o.isCorrect)?.id;

  // Update distractorTypes mapping if it exists
  if (question.nswSelectiveReading?.distractorTypes) {
    const oldDistractors = question.nswSelectiveReading.distractorTypes;
    const newDistractors = {};

    for (const [oldId, type] of Object.entries(oldDistractors)) {
      const newId = oldToNewId[oldId];
      if (newId && newId !== newCorrectId) { // Don't include the correct answer
        newDistractors[newId] = type;
      }
    }

    question.nswSelectiveReading.distractorTypes = newDistractors;
  }

  question.mcqOptions = shuffled;

  return { question, newCorrectId };
}

// Process a single testlet file
function processTestlet(filePath) {
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const results = [];

  data.questions.forEach((q, index) => {
    const { question, newCorrectId } = randomizeQuestion(q);
    data.questions[index] = question;
    results.push(newCorrectId);
  });

  // Write back
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');

  return results;
}

// Main execution
console.log('🔀 Randomizing reading question answer positions...\n');

const files = getTestletFiles();
console.log(`Found ${files.length} testlet files\n`);

const answerCounts = { A: 0, B: 0, C: 0, D: 0 };
let totalQuestions = 0;

for (const file of files) {
  const relativePath = path.relative(READING_DIR, file);
  const results = processTestlet(file);

  results.forEach(id => {
    if (id) answerCounts[id]++;
    totalQuestions++;
  });

  console.log(`✅ ${relativePath}: ${results.join(', ')}`);
}

console.log('\n📊 New answer distribution:');
console.log(`   Total questions: ${totalQuestions}`);
Object.entries(answerCounts).forEach(([id, count]) => {
  const pct = Math.round(count / totalQuestions * 100);
  const bar = '█'.repeat(Math.round(pct / 5));
  console.log(`   ${id}: ${count} (${pct}%) ${bar}`);
});

// Check if distribution is reasonable (each answer 15-35%)
const percentages = Object.values(answerCounts).map(c => c / totalQuestions * 100);
const minPct = Math.min(...percentages);
const maxPct = Math.max(...percentages);

if (minPct < 15 || maxPct > 35) {
  console.log('\n⚠️  Distribution is uneven. Consider running again for better balance.');
} else {
  console.log('\n✅ Distribution looks balanced!');
}

console.log('\n🔄 Remember to regenerate the combined *-all-testlets.json files if needed.');

#!/usr/bin/env node
/**
 * Randomize MCQ option positions in NSW Selective question files
 *
 * This script shuffles the mcqOptions array for each question while:
 * - Maintaining the A, B, C, D, E labels after shuffle
 * - Updating distractorTypes to match new positions
 * - Ensuring roughly even distribution of correct answers across positions
 *
 * Usage:
 *   node randomize-mcq-options.js <path-to-complete.json>
 *   node randomize-mcq-options.js --all
 */

const fs = require('fs');
const path = require('path');

const NSW_SELECTIVE_DIR = path.join(__dirname, 'questions', 'nsw-selective');

/**
 * Fisher-Yates shuffle algorithm
 */
function shuffle(array) {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Randomize options for a single question
 */
function randomizeQuestion(question) {
  if (!question.mcqOptions || question.mcqOptions.length !== 5) {
    console.warn(`  ⚠️ Skipping ${question.questionId}: Invalid mcqOptions`);
    return question;
  }

  const originalOptions = question.mcqOptions;
  const originalDistractorTypes = question.nswSelective?.distractorTypes || {};

  // Create mapping of original positions to their data
  const optionData = originalOptions.map((opt, idx) => ({
    originalId: opt.id,
    text: opt.text,
    isCorrect: opt.isCorrect,
    feedback: opt.feedback,
    distractorType: originalDistractorTypes[opt.id] || null
  }));

  // Shuffle the options
  const shuffled = shuffle(optionData);

  // Reassign A, B, C, D, E labels
  const newLabels = ['A', 'B', 'C', 'D', 'E'];
  const newOptions = shuffled.map((opt, idx) => ({
    id: newLabels[idx],
    text: opt.text,
    isCorrect: opt.isCorrect,
    feedback: opt.feedback
  }));

  // Rebuild distractorTypes for non-correct options
  const newDistractorTypes = {};
  shuffled.forEach((opt, idx) => {
    if (!opt.isCorrect && opt.distractorType) {
      newDistractorTypes[newLabels[idx]] = opt.distractorType;
    }
  });

  // Update the question
  return {
    ...question,
    mcqOptions: newOptions,
    nswSelective: {
      ...question.nswSelective,
      distractorTypes: newDistractorTypes
    }
  };
}

/**
 * Process a single file
 */
function processFile(filePath) {
  console.log(`\n📂 Processing: ${path.basename(filePath)}`);

  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const questions = data.questions;

  // Track correct answer distribution
  const correctPositions = { A: 0, B: 0, C: 0, D: 0, E: 0 };

  // Randomize each question
  const randomizedQuestions = questions.map(q => {
    const randomized = randomizeQuestion(q);

    // Track where correct answer ended up
    const correctOpt = randomized.mcqOptions.find(o => o.isCorrect);
    if (correctOpt) {
      correctPositions[correctOpt.id]++;
    }

    return randomized;
  });

  // Update the data
  data.questions = randomizedQuestions;

  // Write back
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

  console.log(`   ✅ Randomized ${questions.length} questions`);
  console.log(`   📊 Correct answer distribution: A=${correctPositions.A}, B=${correctPositions.B}, C=${correctPositions.C}, D=${correctPositions.D}, E=${correctPositions.E}`);

  return { count: questions.length, distribution: correctPositions };
}

/**
 * Process all files
 */
function processAll() {
  console.log('🔍 Scanning for NSW Selective question files...\n');

  const archetypeDirs = fs.readdirSync(NSW_SELECTIVE_DIR).filter(f =>
    fs.statSync(path.join(NSW_SELECTIVE_DIR, f)).isDirectory()
  );

  let totalQuestions = 0;
  const totalDistribution = { A: 0, B: 0, C: 0, D: 0, E: 0 };

  for (const dir of archetypeDirs) {
    // Find the complete.json file
    const files = fs.readdirSync(path.join(NSW_SELECTIVE_DIR, dir));
    const completeFile = files.find(f => f.endsWith('-complete.json'));

    if (completeFile) {
      const filePath = path.join(NSW_SELECTIVE_DIR, dir, completeFile);
      const result = processFile(filePath);
      totalQuestions += result.count;
      Object.keys(result.distribution).forEach(key => {
        totalDistribution[key] += result.distribution[key];
      });
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`🎉 Total: ${totalQuestions} questions randomized`);
  console.log(`📊 Overall distribution: A=${totalDistribution.A}, B=${totalDistribution.B}, C=${totalDistribution.C}, D=${totalDistribution.D}, E=${totalDistribution.E}`);
}

// Main execution
const arg = process.argv[2];

if (!arg) {
  console.log('Usage:');
  console.log('  node randomize-mcq-options.js <path-to-complete.json>');
  console.log('  node randomize-mcq-options.js --all');
  process.exit(1);
}

if (arg === '--all') {
  processAll();
} else {
  const filePath = path.isAbsolute(arg) ? arg : path.join(NSW_SELECTIVE_DIR, arg);

  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    process.exit(1);
  }

  processFile(filePath);
}

console.log('\n✅ Done! Remember to re-upload the questions to Firebase.');

#!/usr/bin/env node
/**
 * Assembles the 80-question States of Matter learning arc
 * from the 4 phase files into a single complete question set
 */

const fs = require('fs');
const path = require('path');

const SCRIPTS_DIR = __dirname;

// Phase files
const phaseFiles = [
  'states-of-matter-phase1-q1-q20.json',
  'states-of-matter-phase2-q21-q40.json',
  'states-of-matter-phase3-q41-q60.json',
  'year8-states-of-matter-phase4-q61-q80.json'
];

// Metadata for the complete question set
const metadata = {
  topic: "States of Matter",
  topicSlug: "states-of-matter",
  outcomeCode: "ACSSU151",
  outcomeDescription: "Properties of the different states of matter can be explained in terms of the motion and arrangement of particles",
  year: 8,
  subject: "Science",
  strand: "Chemical Sciences",
  syllabus: "NSW Science 7-10 (2023)",
  questionCount: 80,
  generatedAt: new Date().toISOString().split('T')[0],
  version: "1.0",
  phases: {
    foundation: { range: "Q1-20", focus: "Build vocabulary, confidence, core understanding" },
    application: { range: "Q21-40", focus: "Apply concepts, connect ideas, real-world scenarios" },
    connection: { range: "Q41-60", focus: "Link concepts, challenge misconceptions" },
    mastery: { range: "Q61-80", focus: "Synthesize, predict, explain complex scenarios" }
  }
};

function loadPhase(filename) {
  const filepath = path.join(SCRIPTS_DIR, filename);
  try {
    const content = fs.readFileSync(filepath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error loading ${filename}:`, error.message);
    return [];
  }
}

function normalizeQuestion(q, index) {
  // Ensure consistent setId for all questions
  return {
    ...q,
    paperMetadata: {
      ...q.paperMetadata,
      section: "year8-science",
      setId: `year8-states-of-matter-set${Math.ceil((index + 1) / 10)}`,
      sequenceInPaper: index + 1
    }
  };
}

function assembleQuestions() {
  console.log('📚 Assembling States of Matter Learning Arc...\n');

  let allQuestions = [];

  for (const file of phaseFiles) {
    const questions = loadPhase(file);
    console.log(`  ✅ ${file}: ${questions.length} questions`);
    allQuestions = allQuestions.concat(questions);
  }

  // Normalize and sort questions by ID
  allQuestions = allQuestions
    .map((q, i) => normalizeQuestion(q, i))
    .sort((a, b) => {
      // Extract question number from ID (som-y8-XXX)
      const numA = parseInt(a.questionId.replace(/\D/g, '').slice(-3));
      const numB = parseInt(b.questionId.replace(/\D/g, '').slice(-3));
      return numA - numB;
    });

  console.log(`\n📊 Total questions: ${allQuestions.length}`);

  // Count by type
  const mcqCount = allQuestions.filter(q => q.questionType === 'MCQ').length;
  const shortCount = allQuestions.filter(q => q.questionType === 'SHORT_ANSWER' || q.questionType === 'short-answer').length;

  console.log(`   MCQ: ${mcqCount}`);
  console.log(`   Short Answer: ${shortCount}`);

  // Create final output
  const output = {
    metadata,
    questions: allQuestions
  };

  // Write to output file
  const outputPath = path.join(SCRIPTS_DIR, 'questions', 'states-of-matter-year8-complete.json');

  // Ensure questions directory exists
  const questionsDir = path.join(SCRIPTS_DIR, 'questions');
  if (!fs.existsSync(questionsDir)) {
    fs.mkdirSync(questionsDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.log(`\n✨ Output written to: ${outputPath}`);

  return output;
}

// Run assembly
assembleQuestions();

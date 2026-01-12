#!/usr/bin/env node

/**
 * Migrate old Elements & Compounds questions to "classic" sets
 *
 * Converts 50 questions from:
 *   setId: "year8-science-elements-compounds-medium"
 * To:
 *   setIds: "year8-elements-compounds-mixtures-set9" through "year8-elements-compounds-mixtures-set13"
 *
 * This preserves the old questions as "classic" content while the new
 * Learning Arc questions occupy sets 1-8.
 */

const fs = require('fs');
const path = require('path');

// Configuration
const TOPIC_SLUG = 'elements-compounds-mixtures';
const YEAR = 8;
const CLASSIC_SET_START = 9; // Classic sets start at 9 (after Learning Arc sets 1-8)
const QUESTIONS_PER_SET = 10;

// Input/Output files
const inputFile = path.join(__dirname, 'year8-elements-compounds-questions.json');
const outputFile = path.join(__dirname, 'questions', 'elements-compounds-mixtures-year8-classic.json');

function assignClassicSetId(questionIndex) {
  const setNumber = Math.floor(questionIndex / QUESTIONS_PER_SET) + CLASSIC_SET_START;
  return `year${YEAR}-${TOPIC_SLUG}-set${setNumber}`;
}

function assignSequenceInPaper(questionIndex) {
  return (questionIndex % QUESTIONS_PER_SET) + 1;
}

function normalizeQuestionType(type) {
  if (type === 'short-answer' || type === 'short_answer') {
    return 'SHORT_ANSWER';
  }
  if (type === 'explanation') {
    return 'SHORT_ANSWER';
  }
  if (type === 'mcq' || type === 'MCQ') {
    return 'MCQ';
  }
  return 'SHORT_ANSWER';
}

function migrateQuestion(question, index) {
  const setId = assignClassicSetId(index);
  const sequenceInPaper = assignSequenceInPaper(index);
  const setNumber = Math.floor(index / QUESTIONS_PER_SET) + CLASSIC_SET_START;

  return {
    questionId: question.questionId,
    questionType: normalizeQuestionType(question.questionType),
    stem: question.stem,
    ...(question.mcqOptions && { mcqOptions: question.mcqOptions }),
    solution: question.solution,
    hints: question.hints || [],
    difficulty: question.difficulty || 3,
    estimatedTime: question.estimatedTime || 180,
    curriculum: {
      system: 'NSW Science K-10 Syllabus',
      codes: ['ACSSU152'],
      year: YEAR,
      subject: 'science',
      strand: 'Chemical Sciences'
    },
    learningArc: {
      phase: 'classic',
      phasePosition: index + 1,
      conceptsUsed: [],
      buildsOn: [],
      preparesFor: []
    },
    pedagogy: {
      type: 'classic',
      targetFeeling: 'Practice and reinforce'
    },
    richContent: {
      hasEquations: question.stem.includes('$') || false,
      hasTables: question.stem.includes('|') || false,
      hasGraphs: false,
      hasDiagrams: false,
      hasCode: false
    },
    paperMetadata: {
      section: `year${YEAR}-science`,
      setId: setId,
      sequenceInPaper: sequenceInPaper
    },
    status: 'published',
    isClassic: true
  };
}

function getSetTitle(setNumber) {
  const titles = {
    9: 'Classic: Atomic Structure',
    10: 'Classic: Periodic Table',
    11: 'Classic: Compounds & Bonding',
    12: 'Classic: Mixtures & Separation',
    13: 'Classic: Applied Chemistry'
  };
  return titles[setNumber] || `Classic: Set ${setNumber}`;
}

function main() {
  console.log('Migrating Elements & Compounds classic questions...\n');

  // Load old questions
  if (!fs.existsSync(inputFile)) {
    console.error('ERROR: Input file not found:', inputFile);
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
  const oldQuestions = data.questions || [];

  console.log(`Loaded ${oldQuestions.length} questions from old format`);

  // Migrate questions
  const migratedQuestions = oldQuestions.map((q, i) => migrateQuestion(q, i));

  // Show distribution
  const setIdCounts = {};
  migratedQuestions.forEach(q => {
    const setId = q.paperMetadata.setId;
    setIdCounts[setId] = (setIdCounts[setId] || 0) + 1;
  });

  console.log('\nClassic set distribution:');
  Object.entries(setIdCounts).sort().forEach(([setId, count]) => {
    const setNum = setId.match(/set(\d+)/)?.[1];
    console.log(`  ${setId}: ${count} questions - "${getSetTitle(parseInt(setNum))}"`);
  });

  // Create output structure
  const output = {
    metadata: {
      topic: 'Elements, Compounds and Mixtures',
      topicSlug: TOPIC_SLUG,
      outcomeCode: 'ACSSU152',
      year: YEAR,
      questionCount: migratedQuestions.length,
      migratedAt: new Date().toISOString().split('T')[0],
      version: '1.0',
      type: 'classic',
      sets: Object.keys(setIdCounts).sort().map(setId => {
        const setNum = parseInt(setId.match(/set(\d+)/)?.[1]);
        return {
          setId,
          title: getSetTitle(setNum),
          questionCount: setIdCounts[setId]
        };
      })
    },
    questions: migratedQuestions
  };

  // Ensure output directory exists
  const outputDir = path.dirname(outputFile);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Write output
  fs.writeFileSync(outputFile, JSON.stringify(output, null, 2));

  console.log(`\n✅ Migrated ${migratedQuestions.length} classic questions`);
  console.log(`   Output: ${outputFile}`);
  console.log(`\nClassic sets: ${CLASSIC_SET_START} - ${CLASSIC_SET_START + Math.ceil(oldQuestions.length / QUESTIONS_PER_SET) - 1}`);
}

main();

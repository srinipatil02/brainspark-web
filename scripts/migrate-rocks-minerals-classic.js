#!/usr/bin/env node

/**
 * Migrate old Rocks & Minerals questions to Classic sets (9-13)
 *
 * Converts:
 * - Old shared setId to per-set format
 * - Question types to normalized format
 * - Adds missing required fields
 */

const fs = require('fs');
const path = require('path');

const OLD_SET_ID = 'year8-science-rocks-minerals-medium';
const NEW_SET_PREFIX = 'year8-rocks-minerals-set';
const QUESTIONS_PER_SET = 10;
const STARTING_SET_NUMBER = 9; // Classic sets start at 9

// Classic set themes
const classicSetThemes = {
  9: { title: 'Classic: Rock Foundations', topics: ['Rock types', 'Formation', 'Identification'] },
  10: { title: 'Classic: Mineral Basics', topics: ['Mineral properties', 'Testing', 'Classification'] },
  11: { title: 'Classic: Earth Processes', topics: ['Weathering', 'Erosion', 'Rock cycle'] },
  12: { title: 'Classic: Resources', topics: ['Mining', 'Sustainability', 'Uses'] },
  13: { title: 'Classic: Geology Mastery', topics: ['Fossils', 'Time', 'Advanced concepts'] },
};

function normalizeQuestionType(type) {
  const typeMap = {
    'multiple-choice': 'MCQ',
    'mcq': 'MCQ',
    'short-answer': 'SHORT_ANSWER',
    'short_answer': 'SHORT_ANSWER',
    'explanation': 'EXTENDED_RESPONSE',
    'extended-response': 'EXTENDED_RESPONSE',
    'extended_response': 'EXTENDED_RESPONSE',
  };
  return typeMap[type?.toLowerCase()] || type?.toUpperCase() || 'SHORT_ANSWER';
}

function migrateQuestions() {
  console.log('======================================================');
  console.log(' MIGRATE ROCKS & MINERALS CLASSIC QUESTIONS');
  console.log('======================================================\n');

  const oldPath = path.join(__dirname, 'year8-rocks-minerals-questions.json');

  if (!fs.existsSync(oldPath)) {
    console.error('ERROR: Old questions file not found:', oldPath);
    process.exit(1);
  }

  const oldData = JSON.parse(fs.readFileSync(oldPath, 'utf8'));
  const oldQuestions = oldData.questions;

  console.log(`Found ${oldQuestions.length} questions to migrate\n`);

  const migratedQuestions = oldQuestions.map((q, index) => {
    const setNumber = Math.floor(index / QUESTIONS_PER_SET) + STARTING_SET_NUMBER;
    const newSetId = `${NEW_SET_PREFIX}${setNumber}`;
    const sequenceInSet = (index % QUESTIONS_PER_SET) + 1;

    // Normalize question type
    const normalizedType = normalizeQuestionType(q.questionType);

    // Generate a new questionId if needed
    const questionId = q.questionId || `rocks-minerals-y8-classic-${String(index + 1).padStart(3, '0')}`;

    // Build migrated question
    const migrated = {
      questionId,
      questionType: normalizedType,
      stem: q.stem || q.question || '',
      solution: q.solution || q.explanation || q.answer || '',
      hints: q.hints || [
        { level: 1, text: 'Think about what you know about this topic.' },
        { level: 2, text: 'Consider the key concepts involved.' },
        { level: 3, text: 'Review the specific details mentioned in the question.' },
      ],
      difficulty: q.difficulty || 3,
      curriculum: q.curriculum || {
        system: 'ACARA',
        codes: ['ACSSU153'],
        year: 8,
        subject: 'Science',
        strand: 'Earth and Space Sciences',
      },
      learningArc: q.learningArc || {
        phase: Math.ceil((setNumber - 8) / 2), // Maps 9-10 to phase 1, 11-12 to phase 2, 13 to phase 3
        phasePosition: sequenceInSet,
        conceptsUsed: ['c1'],
        buildsOn: [],
        preparesFor: [],
      },
      pedagogy: q.pedagogy || {
        type: 'scaffolded',
        targetFeeling: 'I understand this!',
      },
      richContent: q.richContent || {
        hasEquations: false,
        hasTables: false,
        hasDiagrams: false,
      },
      paperMetadata: {
        section: 'year8-science',
        setId: newSetId,
        sequenceInPaper: sequenceInSet,
      },
      status: 'published',
    };

    // Handle MCQ options
    if (normalizedType === 'MCQ') {
      if (q.mcqOptions) {
        migrated.mcqOptions = q.mcqOptions;
      } else if (q.options) {
        // Convert old options format
        migrated.mcqOptions = q.options.map((opt, idx) => ({
          id: ['A', 'B', 'C', 'D'][idx],
          text: typeof opt === 'string' ? opt : opt.text,
          isCorrect: typeof opt === 'string' ? (q.correctAnswer === opt || q.answer === ['A', 'B', 'C', 'D'][idx]) : opt.isCorrect,
          feedback: typeof opt === 'string' ? '' : (opt.feedback || ''),
        }));
      }
    }

    return migrated;
  });

  // Show distribution
  const setCounts = {};
  migratedQuestions.forEach(q => {
    const setId = q.paperMetadata.setId;
    setCounts[setId] = (setCounts[setId] || 0) + 1;
  });

  console.log('Migrated setId distribution:');
  Object.entries(setCounts).sort().forEach(([setId, count]) => {
    const setNum = setId.match(/set(\d+)/)?.[1];
    const theme = classicSetThemes[setNum];
    console.log(`  ${setId}: ${count} questions - ${theme?.title || 'Unknown'}`);
  });

  // Ensure output directory exists
  const outputDir = path.join(__dirname, 'questions');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Write output
  const output = {
    metadata: {
      topic: 'Rocks and Minerals (Classic)',
      topicSlug: 'rocks-minerals',
      outcomeCode: 'ACSSU153',
      year: 8,
      subject: 'Science',
      strand: 'Earth and Space Sciences',
      questionCount: migratedQuestions.length,
      migratedAt: new Date().toISOString().split('T')[0],
      setsRange: `${STARTING_SET_NUMBER}-${STARTING_SET_NUMBER + Math.ceil(oldQuestions.length / QUESTIONS_PER_SET) - 1}`,
      classicSets: classicSetThemes,
    },
    questions: migratedQuestions,
  };

  const outputPath = path.join(outputDir, 'rocks-minerals-year8-classic.json');
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

  console.log(`\nMigrated ${migratedQuestions.length} questions to:`);
  console.log(`  ${outputPath}\n`);

  // Show question type distribution
  const typeCounts = {};
  migratedQuestions.forEach(q => {
    typeCounts[q.questionType] = (typeCounts[q.questionType] || 0) + 1;
  });
  console.log('Question type distribution:');
  Object.entries(typeCounts).forEach(([type, count]) => {
    console.log(`  ${type}: ${count}`);
  });

  console.log('\n======================================================');
  console.log(' MIGRATION COMPLETE');
  console.log('======================================================');
  console.log('\nNext steps:');
  console.log('  1. Run: node scripts/upload-all-rocks-minerals.js');
  console.log('  2. Update app pages to include sets 9-13');
}

migrateQuestions();

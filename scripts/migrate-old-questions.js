#!/usr/bin/env node

/**
 * Migrate old States of Matter questions to new per-set setId format
 *
 * Old: 50 questions with setId "year8-science-states-of-matter-medium"
 * New: Assign to sets 9-13 (10 questions each) with setId "year8-states-of-matter-setN"
 *
 * This creates a migrated file that can be uploaded alongside the new 80 questions.
 */

const fs = require('fs');
const path = require('path');

// Set titles for old questions (sets 9-13)
const oldSetTitles = {
  9: { title: 'Classic Particle Model', subtitle: 'Foundation questions on particle theory' },
  10: { title: 'Classic State Properties', subtitle: 'Properties of solids, liquids, and gases' },
  11: { title: 'Classic Changes', subtitle: 'State changes and energy' },
  12: { title: 'Classic Applications', subtitle: 'Real-world applications' },
  13: { title: 'Classic Mastery', subtitle: 'Advanced particle theory' },
};

function migrateQuestions() {
  console.log('📦 Migrating old States of Matter questions...\n');

  // Read old questions
  const oldPath = path.join(__dirname, 'year8-states-of-matter-questions.json');
  const oldData = JSON.parse(fs.readFileSync(oldPath, 'utf8'));
  const oldQuestions = oldData.questions;

  console.log(`Found ${oldQuestions.length} old questions to migrate\n`);

  // Migrate each question
  const migratedQuestions = oldQuestions.map((q, index) => {
    // Calculate which set (9-13) based on index
    const setNumber = Math.floor(index / 10) + 9;
    const newSetId = `year8-states-of-matter-set${setNumber}`;

    // Normalize questionType to match new format
    let normalizedType = q.questionType;
    if (normalizedType === 'short-answer') normalizedType = 'SHORT_ANSWER';
    if (normalizedType === 'explanation') normalizedType = 'SHORT_ANSWER';
    if (normalizedType === 'mcq') normalizedType = 'MCQ';

    return {
      ...q,
      questionType: normalizedType,
      paperMetadata: {
        ...q.paperMetadata,
        setId: newSetId,
        section: 'year8-science',
        sequenceInPaper: (index % 10) + 1,
      },
      // Add learningArc if missing
      learningArc: q.learningArc || {
        phase: setNumber <= 10 ? 1 : setNumber <= 12 ? 2 : 3,
        phasePosition: (index % 10) + 1,
        conceptsUsed: ['c1'],
        buildsOn: [],
        preparesFor: [],
      },
      // Add pedagogy if missing
      pedagogy: q.pedagogy || {
        type: 'scaffolded',
        targetFeeling: 'I can do this!',
      },
      // Add richContent if missing
      richContent: q.richContent || {
        hasEquations: false,
        hasTables: false,
        hasDiagrams: false,
      },
    };
  });

  // Count by new setId
  const setCounts = {};
  migratedQuestions.forEach(q => {
    const setId = q.paperMetadata.setId;
    setCounts[setId] = (setCounts[setId] || 0) + 1;
  });

  console.log('Migrated setId distribution:');
  Object.entries(setCounts).sort().forEach(([setId, count]) => {
    console.log(`  ${setId}: ${count} questions`);
  });

  // Create output
  const output = {
    metadata: {
      topic: "States of Matter (Classic)",
      topicSlug: "states-of-matter-classic",
      outcomeCode: "ACSSU151",
      year: 8,
      subject: "Science",
      strand: "Chemical Sciences",
      questionCount: migratedQuestions.length,
      migratedAt: new Date().toISOString().split('T')[0],
      originalSource: "year8-states-of-matter-questions.json",
      setsRange: "9-13",
    },
    questions: migratedQuestions,
  };

  // Ensure output directory exists
  const questionsDir = path.join(__dirname, 'questions');
  if (!fs.existsSync(questionsDir)) {
    fs.mkdirSync(questionsDir, { recursive: true });
  }

  // Write migrated file
  const outputPath = path.join(questionsDir, 'states-of-matter-year8-classic.json');
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

  console.log(`\n✅ Migrated ${migratedQuestions.length} questions`);
  console.log(`📄 Output: ${outputPath}`);

  return output;
}

migrateQuestions();

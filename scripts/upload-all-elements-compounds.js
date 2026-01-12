#!/usr/bin/env node

/**
 * Upload ALL Year 8 Elements, Compounds and Mixtures questions to Firebase
 *
 * This uploads:
 * - 80 NEW learning arc questions (sets 1-8): year8-elements-compounds-mixtures-set1 through set8
 * - 50 CLASSIC migrated questions (sets 9-13): year8-elements-compounds-mixtures-set9 through set13
 *
 * Total: 130 questions across 13 sets
 *
 * Usage:
 *   export GOOGLE_APPLICATION_CREDENTIALS="path/to/serviceAccount.json"
 *   node scripts/upload-all-elements-compounds.js
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin
if (!admin.apps.length) {
  const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS ||
    path.join(__dirname, '../../my_learning_path/thebrainspark-project-firebase-adminsdk-fbsvc-2d1f468a9e.json');

  const serviceAccount = require(serviceAccountPath);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://thebrainspark-project.firebaseio.com'
  });
}

const db = admin.firestore();

async function uploadQuestions() {
  console.log('======================================================');
  console.log(' UPLOAD ALL ELEMENTS, COMPOUNDS & MIXTURES QUESTIONS');
  console.log('======================================================\n');

  // Load question files
  const questionsDir = path.join(__dirname, 'questions');

  // New Learning Arc questions (sets 1-8)
  const newQuestionsPath = path.join(questionsDir, 'elements-compounds-mixtures-year8-complete.json');
  // Classic migrated questions (sets 9-13)
  const classicQuestionsPath = path.join(questionsDir, 'elements-compounds-mixtures-year8-classic.json');

  let newQuestions = [];
  let classicQuestions = [];

  // Load new questions
  if (fs.existsSync(newQuestionsPath)) {
    const data = JSON.parse(fs.readFileSync(newQuestionsPath, 'utf8'));
    newQuestions = data.questions || [];
    console.log(`[NEW] Loaded ${newQuestions.length} questions from sets 1-8`);
  } else {
    console.error('ERROR: New questions file not found:', newQuestionsPath);
    process.exit(1);
  }

  // Load classic questions
  if (fs.existsSync(classicQuestionsPath)) {
    const data = JSON.parse(fs.readFileSync(classicQuestionsPath, 'utf8'));
    classicQuestions = data.questions || [];
    console.log(`[CLASSIC] Loaded ${classicQuestions.length} questions from sets 9-13`);
  } else {
    console.warn('WARNING: Classic questions file not found:', classicQuestionsPath);
    console.log('  Run "node scripts/migrate-elements-compounds-classic.js" first to create it.\n');
  }

  // Combine all questions
  const allQuestions = [...newQuestions, ...classicQuestions];

  if (allQuestions.length === 0) {
    console.error('\nERROR: No questions to upload!');
    process.exit(1);
  }

  console.log(`\nTOTAL: ${allQuestions.length} questions to upload\n`);

  // Show distribution by setId
  const setIdCounts = {};
  allQuestions.forEach(q => {
    const setId = q.paperMetadata?.setId || 'unknown';
    setIdCounts[setId] = (setIdCounts[setId] || 0) + 1;
  });

  console.log('Distribution by setId:');
  Object.entries(setIdCounts).sort().forEach(([setId, count]) => {
    console.log(`  ${setId}: ${count} questions`);
  });
  console.log('');

  // Show distribution by type
  const typeCounts = { MCQ: 0, SHORT_ANSWER: 0 };
  allQuestions.forEach(q => {
    typeCounts[q.questionType] = (typeCounts[q.questionType] || 0) + 1;
  });

  console.log('Distribution by type:');
  Object.entries(typeCounts).forEach(([type, count]) => {
    console.log(`  ${type}: ${count} questions`);
  });
  console.log('');

  // Upload in batches (Firestore limit is 500 operations per batch)
  const batchSize = 500;
  const batches = [];

  for (let i = 0; i < allQuestions.length; i += batchSize) {
    batches.push(allQuestions.slice(i, i + batchSize));
  }

  let totalUploaded = 0;

  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = db.batch();
    const currentBatch = batches[batchIndex];

    console.log(`Processing batch ${batchIndex + 1}/${batches.length} (${currentBatch.length} questions)...`);

    for (const question of currentBatch) {
      const docRef = db.collection('questions').doc(question.questionId);
      batch.set(docRef, question);
      totalUploaded++;
    }

    await batch.commit();
    console.log(`  Batch ${batchIndex + 1} committed successfully\n`);
  }

  console.log('======================================================');
  console.log(` Successfully uploaded ${totalUploaded} questions!`);
  console.log('======================================================\n');

  console.log('Questions organized into 13 sets:\n');

  console.log('LEARNING ARC (80 questions):');
  console.log('  Phase 1 - Foundation:');
  console.log('    Set 1: Pure Substances & Mixtures (Q1-10)');
  console.log('    Set 2: Elements & Compounds Intro (Q11-20)');
  console.log('  Phase 2 - Application:');
  console.log('    Set 3: Symbols & Formulas (Q21-30)');
  console.log('    Set 4: Real-World Applications (Q31-40)');
  console.log('  Phase 3 - Connection:');
  console.log('    Set 5: Misconception Challenges (Q41-50)');
  console.log('    Set 6: Deep Connections (Q51-60)');
  console.log('  Phase 4 - Mastery:');
  console.log('    Set 7: Synthesis & Prediction (Q61-70)');
  console.log('    Set 8: Mastery Challenge (Q71-80)\n');

  console.log('CLASSIC (50 questions):');
  console.log('    Set 9: Classic: Atomic Structure');
  console.log('    Set 10: Classic: Periodic Table');
  console.log('    Set 11: Classic: Compounds & Bonding');
  console.log('    Set 12: Classic: Mixtures & Separation');
  console.log('    Set 13: Classic: Applied Chemistry\n');

  console.log('Topic: Elements, Compounds and Mixtures');
  console.log('Outcome Code: ACSSU152');
  console.log('Year Level: 8');
}

// Run the upload
uploadQuestions()
  .then(() => {
    console.log('\nUpload complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nError uploading questions:', error);
    process.exit(1);
  });

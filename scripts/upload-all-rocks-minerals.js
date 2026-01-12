#!/usr/bin/env node

/**
 * Upload ALL Year 8 Rocks & Minerals questions to Firebase
 *
 * This uploads:
 * - 80 NEW Learning Arc questions (sets 1-8): year8-rocks-minerals-set1 through set8
 * - 50 CLASSIC migrated questions (sets 9-13): year8-rocks-minerals-set9 through set13
 *
 * Total: 130 questions across 13 sets
 *
 * Usage:
 *   export GOOGLE_APPLICATION_CREDENTIALS="path/to/serviceAccount.json"
 *   node scripts/upload-all-rocks-minerals.js
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin
if (!admin.apps.length) {
  const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS ||
    path.join(__dirname, '../../REFERENCE-flutter-app/thebrainspark-project-firebase-adminsdk-fbsvc-2d1f468a9e.json');

  const serviceAccount = require(serviceAccountPath);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://thebrainspark-project.firebaseio.com'
  });
}

const db = admin.firestore();

async function uploadQuestions() {
  console.log('======================================================');
  console.log(' UPLOAD ALL ROCKS & MINERALS QUESTIONS');
  console.log('======================================================\n');

  // Load both question files
  const questionsDir = path.join(__dirname, 'questions');

  // New Learning Arc questions (sets 1-8)
  const newQuestionsPath = path.join(questionsDir, 'rocks-minerals-year8-complete.json');
  // Classic migrated questions (sets 9-13)
  const classicQuestionsPath = path.join(questionsDir, 'rocks-minerals-year8-classic.json');

  let newQuestions = [];
  let classicQuestions = [];

  // Load new questions
  if (fs.existsSync(newQuestionsPath)) {
    const newData = JSON.parse(fs.readFileSync(newQuestionsPath, 'utf8'));
    newQuestions = newData.questions || [];
    console.log(`[NEW] Loaded ${newQuestions.length} questions from sets 1-8`);
  } else {
    console.warn('WARNING: New questions file not found:', newQuestionsPath);
  }

  // Load classic questions
  if (fs.existsSync(classicQuestionsPath)) {
    const classicData = JSON.parse(fs.readFileSync(classicQuestionsPath, 'utf8'));
    classicQuestions = classicData.questions || [];
    console.log(`[CLASSIC] Loaded ${classicQuestions.length} questions from sets 9-13`);
  } else {
    console.warn('WARNING: Classic questions file not found:', classicQuestionsPath);
    console.log('  Run "node scripts/migrate-rocks-minerals-classic.js" first to create it.\n');
  }

  // Combine all questions
  const allQuestions = [...newQuestions, ...classicQuestions];

  if (allQuestions.length === 0) {
    console.error('\n ERROR: No questions to upload!');
    process.exit(1);
  }

  console.log(`\n TOTAL: ${allQuestions.length} questions to upload\n`);

  // Show distribution by setId
  const setIdCounts = {};
  allQuestions.forEach(q => {
    const setId = q.paperMetadata?.setId || 'unknown';
    setIdCounts[setId] = (setIdCounts[setId] || 0) + 1;
  });

  console.log('Distribution by setId:');
  Object.entries(setIdCounts).sort().forEach(([setId, count]) => {
    const setNum = setId.match(/set(\d+)/)?.[1] || '?';
    const type = parseInt(setNum) <= 8 ? '[NEW]' : '[CLASSIC]';
    console.log(`  ${type} ${setId}: ${count} questions`);
  });
  console.log('');

  // Upload in batches (Firestore limit is 500 operations per batch)
  const batchSize = 400;
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
  console.log('    Set 1: Rock Types & Formation (Q1-10)');
  console.log('    Set 2: Mineral Properties (Q11-20)');
  console.log('  Phase 2 - Application:');
  console.log('    Set 3: Rock Cycle & Processes (Q21-30)');
  console.log('    Set 4: Real-World Applications (Q31-40)');
  console.log('  Phase 3 - Connection:');
  console.log('    Set 5: Cross-Concept Connections (Q41-50)');
  console.log('    Set 6: Geological Time & Scale (Q51-60)');
  console.log('  Phase 4 - Mastery:');
  console.log('    Set 7: Complex Analysis (Q61-70)');
  console.log('    Set 8: Mastery Challenge (Q71-80)\n');

  console.log('CLASSIC (50 questions):');
  console.log('    Set 9: Classic: Rock Foundations');
  console.log('    Set 10: Classic: Mineral Basics');
  console.log('    Set 11: Classic: Earth Processes');
  console.log('    Set 12: Classic: Resources');
  console.log('    Set 13: Classic: Geology Mastery');
}

// Run the upload
uploadQuestions()
  .then(() => {
    console.log('\n Upload complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n Error uploading questions:', error);
    process.exit(1);
  });

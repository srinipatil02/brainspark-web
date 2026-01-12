#!/usr/bin/env node

/**
 * Upload Year 8 Linear Equations questions to Firebase
 *
 * This uploads 120 WORKED_SOLUTION questions across 12 sets
 * Set IDs: year8-linear-equations-set1 through year8-linear-equations-set12
 *
 * Usage:
 *   export GOOGLE_APPLICATION_CREDENTIALS="path/to/serviceAccount.json"
 *   node scripts/upload-linear-equations.js
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
  console.log(' UPLOAD LINEAR EQUATIONS QUESTIONS');
  console.log('======================================================\n');

  // Load questions
  const questionsPath = path.join(__dirname, 'questions/linear-equations-year8-complete.json');

  if (!fs.existsSync(questionsPath)) {
    console.error('ERROR: Questions file not found:', questionsPath);
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(questionsPath, 'utf8'));
  const questions = data.questions || [];

  console.log(`Loaded ${questions.length} questions from complete file`);
  console.log(`Topic: ${data.metadata.topic}`);
  console.log(`Year: ${data.metadata.year}`);
  console.log(`Subject: ${data.metadata.subject}`);
  console.log(`Question Type: WORKED_SOLUTION\n`);

  // Show distribution by difficulty
  const difficultyCounts = {};
  questions.forEach(q => {
    const diff = q.difficulty || 0;
    difficultyCounts[diff] = (difficultyCounts[diff] || 0) + 1;
  });

  console.log('Distribution by difficulty:');
  Object.entries(difficultyCounts).sort().forEach(([diff, count]) => {
    console.log(`  Difficulty ${diff}: ${count} questions`);
  });
  console.log('');

  // Upload using batch
  const batch = db.batch();

  for (const question of questions) {
    const docRef = db.collection('questions').doc(question.questionId);
    batch.set(docRef, question);
    console.log(`  Prepared: ${question.questionId} - ${question.stem.split('\n')[0].substring(0, 50)}...`);
  }

  console.log('\nCommitting batch...');
  await batch.commit();

  console.log('\n======================================================');
  console.log(` Successfully uploaded ${questions.length} questions!`);
  console.log('======================================================\n');

  // Show sets summary
  const setIds = [...new Set(questions.map(q => q.paperMetadata?.setId).filter(Boolean))];
  console.log(`Sets uploaded: ${setIds.length}`);
  setIds.forEach(setId => {
    const count = questions.filter(q => q.paperMetadata?.setId === setId).length;
    console.log(`  ${setId}: ${count} questions`);
  });

  console.log('\nTo test in UI:');
  console.log('  1. Navigate to /curriculum/mathematics/year8-linear-equations');
  console.log('  2. Select any set (1-12) to test');
  console.log('  3. Test WORKED_SOLUTION grading with step-by-step input');
}

uploadQuestions()
  .then(() => {
    console.log('\nDone!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error uploading questions:', error);
    process.exit(1);
  });

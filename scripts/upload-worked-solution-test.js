#!/usr/bin/env node

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

async function uploadTestQuestions() {
  console.log('======================================================');
  console.log(' UPLOAD WORKED_SOLUTION TEST QUESTIONS');
  console.log('======================================================\n');

  const questionsPath = path.join(__dirname, 'test-worked-solution-questions.json');
  const data = JSON.parse(fs.readFileSync(questionsPath, 'utf8'));
  const questions = data.questions;

  console.log(`Loaded ${questions.length} test questions\n`);

  // Show distribution
  questions.forEach((q, i) => {
    console.log(`  ${i + 1}. ${q.questionId}: ${q.stem.substring(0, 50)}...`);
  });

  console.log('\nUploading to Firestore...\n');

  const batch = db.batch();

  for (const question of questions) {
    const docRef = db.collection('questions').doc(question.questionId);
    batch.set(docRef, question);
    console.log(`  + ${question.questionId}`);
  }

  await batch.commit();

  console.log(`\n======================================================`);
  console.log(` Successfully uploaded ${questions.length} test questions!`);
  console.log(`======================================================\n`);
  console.log('SetId: year8-math-worked-solution-test');
  console.log('\nTo test, create a page that uses this setId or update');
  console.log('an existing set page to point to this setId.\n');
}

uploadTestQuestions()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });

#!/usr/bin/env node

/**
 * Upload Year 8 Rocks & Minerals questions to Firebase
 *
 * Usage:
 *   export GOOGLE_APPLICATION_CREDENTIALS="path/to/serviceAccount.json"
 *   node scripts/upload-rocks-minerals.js
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
  console.log('🪨 Uploading Year 8 Rocks & Minerals Questions...\n');

  // Read the questions file
  const questionsPath = path.join(__dirname, 'year8-rocks-minerals-questions.json');
  const questionsData = JSON.parse(fs.readFileSync(questionsPath, 'utf8'));
  const questions = questionsData.questions;

  console.log(`Found ${questions.length} questions to upload\n`);

  // Upload in batches (Firestore limit is 500 operations per batch)
  const batchSize = 500;
  const batches = [];

  for (let i = 0; i < questions.length; i += batchSize) {
    batches.push(questions.slice(i, i + batchSize));
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
    console.log(`✅ Batch ${batchIndex + 1} committed successfully\n`);
  }

  console.log(`🎉 Successfully uploaded ${totalUploaded} questions!`);
  console.log('\nQuestions organized into 5 sets:');
  console.log('  Set 1: Rock Types & Formation (Q1-10)');
  console.log('  Set 2: Mineral Properties (Q11-20)');
  console.log('  Set 3: Earth Processes (Q21-30)');
  console.log('  Set 4: Geological Resources (Q31-40)');
  console.log('  Set 5: Geological Time (Q41-50)');
  console.log('\nAll questions tagged with setId: year8-science-rocks-minerals-medium');
}

// Run the upload
uploadQuestions()
  .then(() => {
    console.log('\n✨ Upload complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error uploading questions:', error);
    process.exit(1);
  });

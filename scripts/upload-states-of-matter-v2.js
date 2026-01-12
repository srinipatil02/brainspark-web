#!/usr/bin/env node

/**
 * Upload Year 8 States of Matter questions (80 questions, 8 sets) to Firebase
 *
 * This uploads the NEW learning arc questions with per-set setIds:
 * - year8-states-of-matter-set1 through year8-states-of-matter-set8
 *
 * Usage:
 *   export GOOGLE_APPLICATION_CREDENTIALS="path/to/serviceAccount.json"
 *   node scripts/upload-states-of-matter-v2.js
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
  console.log('📚 Uploading Year 8 States of Matter Questions (v2 - 80 questions)...\n');

  // Read the complete questions file
  const questionsPath = path.join(__dirname, 'questions/states-of-matter-year8-complete.json');
  const questionsData = JSON.parse(fs.readFileSync(questionsPath, 'utf8'));
  const questions = questionsData.questions;

  console.log(`Found ${questions.length} questions to upload`);
  console.log(`Metadata: ${questionsData.metadata.topic} - ${questionsData.metadata.outcomeCode}\n`);

  // Show distribution by setId
  const setIdCounts = {};
  questions.forEach(q => {
    const setId = q.paperMetadata?.setId || 'unknown';
    setIdCounts[setId] = (setIdCounts[setId] || 0) + 1;
  });

  console.log('Distribution by setId:');
  Object.entries(setIdCounts).sort().forEach(([setId, count]) => {
    console.log(`  ${setId}: ${count} questions`);
  });
  console.log('');

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
  console.log('\nQuestions organized into 8 sets (Learning Arc):');
  console.log('  Phase 1 - Foundation:');
  console.log('    Set 1: States & Particles (Q1-10)');
  console.log('    Set 2: Particle Properties (Q11-20)');
  console.log('  Phase 2 - Application:');
  console.log('    Set 3: Real-World States (Q21-30)');
  console.log('    Set 4: Energy & Change (Q31-40)');
  console.log('  Phase 3 - Connection:');
  console.log('    Set 5: Challenging Ideas (Q41-50)');
  console.log('    Set 6: Connecting Concepts (Q51-60)');
  console.log('  Phase 4 - Mastery:');
  console.log('    Set 7: Complex Scenarios (Q61-70)');
  console.log('    Set 8: Mastery Challenge (Q71-80)');
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

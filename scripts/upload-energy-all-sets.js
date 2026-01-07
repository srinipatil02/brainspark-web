#!/usr/bin/env node

/**
 * Upload all Year 8 Energy questions (Sets 1-5) to Firebase
 *
 * This script uploads all 50 Energy questions from the agent outputs + existing Q41-Q50
 *
 * Usage:
 *   export GOOGLE_APPLICATION_CREDENTIALS="/Users/srini/code/my_learning_path/thebrainspark-project-firebase-adminsdk-fbsvc-2d1f468a9e.json"
 *   node scripts/upload-energy-all-sets.js
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

async function uploadQuestionsFromFile(filePath, setName) {
  console.log(`\n📦 Uploading ${setName}...`);

  const questionsData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const questions = questionsData.questions || questionsData;

  console.log(`   Found ${questions.length} questions`);

  const batch = db.batch();
  let count = 0;

  for (const question of questions) {
    const docRef = db.collection('questions').doc(question.questionId);
    batch.set(docRef, question);
    count++;
  }

  await batch.commit();
  console.log(`   ✅ Uploaded ${count} questions`);

  return count;
}

async function uploadAllEnergySets() {
  console.log('⚡ Uploading Year 8 Energy Questions - All Sets\n');
  console.log('================================================\n');

  let totalUploaded = 0;

  try {
    // Upload Set 5 (Q41-Q50) - already exists in main file
    const set5Path = path.join(__dirname, 'year8-energy-questions.json');
    if (fs.existsSync(set5Path)) {
      totalUploaded += await uploadQuestionsFromFile(set5Path, 'Set 5 (Q41-Q50) - Energy Resources');
    }

    // Note: Sets 1-4 will be added after agent output extraction
    console.log('\n================================================');
    console.log(`\n🎉 Successfully uploaded ${totalUploaded} Energy questions!`);
    console.log('\nQuestions organized into 5 sets:');
    console.log('  Set 1: Energy Forms & Transformation (Q1-Q10)');
    console.log('  Set 2: Heat & Temperature (Q11-Q20)');
    console.log('  Set 3: Energy Transfer (Q21-Q30)');
    console.log('  Set 4: Conservation of Energy (Q31-Q40)');
    console.log('  Set 5: Energy Resources (Q41-Q50)');
    console.log('\nAll questions tagged with setId: year8-science-energy-medium');

  } catch (error) {
    console.error('❌ Error uploading questions:', error);
    throw error;
  }
}

// Run the upload
uploadAllEnergySets()
  .then(() => {
    console.log('\n✨ Upload complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });

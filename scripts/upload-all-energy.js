#!/usr/bin/env node

/**
 * Upload Energy Forms and Transformations questions to Firestore
 * 80 questions across 8 sets (sets 1-8)
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin
if (!admin.apps.length) {
  const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS ||
    path.join(__dirname, '../../REFERENCE-flutter-app/thebrainspark-project-firebase-adminsdk-fbsvc-2d1f468a9e.json');

  console.log(`Using service account: ${serviceAccountPath}`);

  const serviceAccount = require(serviceAccountPath);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://thebrainspark-project.firebaseio.com'
  });
}

const db = admin.firestore();

async function uploadQuestions() {
  console.log('======================================================');
  console.log(' UPLOAD ENERGY FORMS AND TRANSFORMATIONS QUESTIONS');
  console.log('======================================================\n');

  const questionsDir = path.join(__dirname, 'questions');

  // Load new questions (sets 1-8)
  const newQuestionsPath = path.join(questionsDir, 'energy-forms-transformations-year8-complete.json');

  let allQuestions = [];

  if (fs.existsSync(newQuestionsPath)) {
    const newData = JSON.parse(fs.readFileSync(newQuestionsPath, 'utf8'));
    allQuestions = newData.questions || [];
    console.log(`Loaded ${allQuestions.length} questions from complete file`);
    console.log(`Topic: ${newData.metadata?.topic}`);
    console.log(`Outcome Code: ${newData.metadata?.outcomeCode}`);
  } else {
    console.error('ERROR: Questions file not found:', newQuestionsPath);
    process.exit(1);
  }

  if (allQuestions.length === 0) {
    console.error('ERROR: No questions to upload!');
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

  // Upload in batches (Firestore limit is 500)
  const batchSize = 400;
  const batches = [];

  for (let i = 0; i < allQuestions.length; i += batchSize) {
    batches.push(allQuestions.slice(i, i + batchSize));
  }

  let totalUploaded = 0;
  const uploadedIds = [];

  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = db.batch();
    const currentBatch = batches[batchIndex];

    console.log(`\nProcessing batch ${batchIndex + 1}/${batches.length}...`);

    for (const question of currentBatch) {
      const docRef = db.collection('questions').doc(question.questionId);
      batch.set(docRef, question);
      uploadedIds.push(question.questionId);
      totalUploaded++;
    }

    await batch.commit();
    console.log(`  Batch ${batchIndex + 1} committed successfully (${currentBatch.length} questions)`);
  }

  // Save rollback file
  const uploadsDir = path.join(__dirname, 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().split('T')[0];
  const rollbackPath = path.join(uploadsDir, `energy-forms-transformations-${timestamp}-ids.json`);
  fs.writeFileSync(rollbackPath, JSON.stringify(uploadedIds, null, 2));
  console.log(`\nRollback file saved: ${rollbackPath}`);

  console.log(`\n======================================================`);
  console.log(` Successfully uploaded ${totalUploaded} questions!`);
  console.log(`======================================================\n`);

  console.log('Next steps:');
  console.log('1. Create app pages for year8-energy-forms-transformations');
  console.log('2. Update generateStaticParams with sets 1-8');
  console.log('3. Add set metadata for all 8 sets');
  console.log('4. Run npm run build to verify');
  console.log('5. Test locally with npm run dev');
}

uploadQuestions()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });

#!/usr/bin/env node

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin
if (!admin.apps.length) {
  const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS ||
    path.join(__dirname, '../../REFERENCE-flutter-app/thebrainspark-project-firebase-adminsdk-fbsvc-2d1f468a9e.json');

  console.log('Using service account:', serviceAccountPath);

  const serviceAccount = require(serviceAccountPath);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://thebrainspark-project.firebaseio.com'
  });
}

const db = admin.firestore();

async function uploadQuestions() {
  console.log('======================================================');
  console.log(' UPLOAD ALL CELLS AND CELL STRUCTURE QUESTIONS');
  console.log('======================================================\n');

  const questionsDir = path.join(__dirname, 'questions');

  // Load new questions (sets 1-8)
  const newQuestionsPath = path.join(questionsDir, 'cells-cell-structure-year8-complete.json');

  let allQuestions = [];

  if (fs.existsSync(newQuestionsPath)) {
    const newData = JSON.parse(fs.readFileSync(newQuestionsPath, 'utf8'));
    allQuestions = newData.questions || [];
    console.log(`[NEW] Loaded ${allQuestions.length} questions from complete file`);
    console.log(`      Topic: ${newData.metadata?.topic}`);
    console.log(`      Outcome: ${newData.metadata?.outcomeCode}`);
  } else {
    console.error('ERROR: Question file not found at:', newQuestionsPath);
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

  // Show distribution by question type
  const typeCounts = {};
  allQuestions.forEach(q => {
    const type = q.questionType || 'unknown';
    typeCounts[type] = (typeCounts[type] || 0) + 1;
  });

  console.log('\nDistribution by question type:');
  Object.entries(typeCounts).forEach(([type, count]) => {
    console.log(`  ${type}: ${count} questions`);
  });

  // Show distribution by phase
  const phaseCounts = {};
  allQuestions.forEach(q => {
    const phase = q.learningArc?.phase || 'unknown';
    phaseCounts[phase] = (phaseCounts[phase] || 0) + 1;
  });

  console.log('\nDistribution by learning arc phase:');
  Object.entries(phaseCounts).sort().forEach(([phase, count]) => {
    const phaseName = {
      1: 'Foundation',
      2: 'Application',
      3: 'Connection',
      4: 'Mastery'
    }[phase] || phase;
    console.log(`  Phase ${phase} (${phaseName}): ${count} questions`);
  });

  // Upload in batches (Firestore limit is 500)
  const batchSize = 400;
  const batches = [];

  for (let i = 0; i < allQuestions.length; i += batchSize) {
    batches.push(allQuestions.slice(i, i + batchSize));
  }

  let totalUploaded = 0;

  console.log('\n------------------------------------------------------');
  console.log(' UPLOADING TO FIRESTORE');
  console.log('------------------------------------------------------\n');

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
    console.log(`  Batch ${batchIndex + 1} committed successfully`);
  }

  // Save uploaded IDs for potential rollback
  const uploadedIds = allQuestions.map(q => q.questionId);
  const uploadsDir = path.join(__dirname, 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
  }
  const date = new Date().toISOString().split('T')[0];
  const rollbackPath = path.join(uploadsDir, `cells-${date}-ids.json`);
  fs.writeFileSync(rollbackPath, JSON.stringify(uploadedIds, null, 2));
  console.log(`\nRollback file saved to: ${rollbackPath}`);

  console.log(`\n======================================================`);
  console.log(` SUCCESS: Uploaded ${totalUploaded} questions!`);
  console.log(`======================================================\n`);

  console.log('Next steps:');
  console.log('1. Verify in Firebase Console: https://console.firebase.google.com');
  console.log('2. Filter by: paperMetadata.setId == "year8-cells-cell-structure-set1"');
  console.log('3. Update app to support new sets (if needed)');
  console.log('4. Test locally with: npm run dev\n');
}

uploadQuestions()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });

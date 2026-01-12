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

async function uploadQuestions() {
  console.log('======================================================');
  console.log(' UPLOAD ALL CHEMICAL REACTIONS QUESTIONS');
  console.log('======================================================\n');

  const questionsDir = path.join(__dirname, 'questions');

  // Load all phase files
  const phaseFiles = [
    'year8-chemical-reactions-phase1-q1-q20.json',
    'year8-chemical-reactions-phase2-q21-q40.json',
    'year8-chemical-reactions-phase3-q41-q60.json',
    'year8-chemical-reactions-phase4-q61-q80.json'
  ];

  let allQuestions = [];

  for (const file of phaseFiles) {
    const filePath = path.join(questionsDir, file);
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      // Handle both array format and {questions: [...]} format
      const questions = Array.isArray(data) ? data : (data.questions || []);
      console.log(`[LOADED] ${file}: ${questions.length} questions`);
      allQuestions = allQuestions.concat(questions);
    } else {
      console.log(`[MISSING] ${file}`);
    }
  }

  if (allQuestions.length === 0) {
    console.error('ERROR: No questions to upload!');
    process.exit(1);
  }

  console.log(`\nTOTAL: ${allQuestions.length} questions to upload\n`);

  // Validate questions have required fields
  let validationErrors = 0;
  allQuestions.forEach((q, index) => {
    if (!q.questionId) {
      console.error(`  [ERROR] Question ${index + 1}: Missing questionId`);
      validationErrors++;
    }
    if (!q.paperMetadata?.setId) {
      console.error(`  [ERROR] Question ${q.questionId || index}: Missing setId`);
      validationErrors++;
    }
  });

  if (validationErrors > 0) {
    console.error(`\nValidation failed with ${validationErrors} errors!`);
    process.exit(1);
  }

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

  console.log('\nDistribution by type:');
  Object.entries(typeCounts).forEach(([type, count]) => {
    console.log(`  ${type}: ${count} questions`);
  });

  // Show distribution by difficulty
  const diffCounts = {};
  allQuestions.forEach(q => {
    const diff = q.difficulty || 'unknown';
    diffCounts[diff] = (diffCounts[diff] || 0) + 1;
  });

  console.log('\nDistribution by difficulty:');
  Object.entries(diffCounts).sort().forEach(([diff, count]) => {
    console.log(`  Level ${diff}: ${count} questions`);
  });

  // Upload in batches (Firestore limit is 500)
  const batchSize = 400;
  const batches = [];

  for (let i = 0; i < allQuestions.length; i += batchSize) {
    batches.push(allQuestions.slice(i, i + batchSize));
  }

  let totalUploaded = 0;

  console.log('\n--- Starting upload ---\n');

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
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const date = new Date().toISOString().split('T')[0];
  const rollbackPath = path.join(uploadsDir, `chemical-reactions-${date}-ids.json`);
  fs.writeFileSync(rollbackPath, JSON.stringify(uploadedIds, null, 2));
  console.log(`\nRollback file saved: ${rollbackPath}`);

  console.log(`\n======================================================`);
  console.log(` Successfully uploaded ${totalUploaded} questions!`);
  console.log(`======================================================\n`);

  // Summary
  console.log('SUMMARY:');
  console.log(`  Topic: Chemical Reactions (Year 8)`);
  console.log(`  Total Questions: ${totalUploaded}`);
  console.log(`  Sets: ${Object.keys(setIdCounts).length} (set1-set8)`);
  console.log(`  Collection: questions`);
  console.log(`  Project: thebrainspark-project`);
}

uploadQuestions()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });

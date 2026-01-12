#!/usr/bin/env node

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS ||
  path.join(__dirname, '../../REFERENCE-flutter-app/thebrainspark-project-firebase-adminsdk-fbsvc-2d1f468a9e.json');

const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://thebrainspark-project.firebaseio.com'
});

const db = admin.firestore();

const OLD_SET_ID = 'year8-science-chemical-reactions-medium';
const NEW_SET_PREFIX = 'year8-chemical-reactions-set';
const QUESTIONS_PER_SET = 10;
const STARTING_SET_NUMBER = 9; // Classic sets start at 9

async function migrateQuestions() {
  console.log('======================================================');
  console.log(' MIGRATE CHEMICAL REACTIONS CLASSIC QUESTIONS');
  console.log('======================================================\n');

  // Fetch old questions
  console.log('Fetching old questions with setId:', OLD_SET_ID);
  const snapshot = await db.collection('questions')
    .where('paperMetadata.setId', '==', OLD_SET_ID)
    .get();

  if (snapshot.empty) {
    console.log('No old questions found to migrate!');
    process.exit(0);
  }

  console.log(`Found ${snapshot.size} questions to migrate\n`);

  // Sort questions by their existing sequence or ID
  const questions = snapshot.docs.map(doc => ({
    id: doc.id,
    data: doc.data()
  }));

  // Sort by sequenceInPaper if available, otherwise by questionId
  questions.sort((a, b) => {
    const seqA = a.data.paperMetadata?.sequenceInPaper || 0;
    const seqB = b.data.paperMetadata?.sequenceInPaper || 0;
    if (seqA !== seqB) return seqA - seqB;
    return a.id.localeCompare(b.id);
  });

  // Prepare batch updates
  const batch = db.batch();
  const setDistribution = {};

  questions.forEach((q, index) => {
    const setNumber = Math.floor(index / QUESTIONS_PER_SET) + STARTING_SET_NUMBER;
    const newSetId = `${NEW_SET_PREFIX}${setNumber}`;
    const sequenceInPaper = (index % QUESTIONS_PER_SET) + 1;

    // Track distribution
    setDistribution[newSetId] = (setDistribution[newSetId] || 0) + 1;

    // Update the document
    const docRef = db.collection('questions').doc(q.id);
    batch.update(docRef, {
      'paperMetadata.setId': newSetId,
      'paperMetadata.sequenceInPaper': sequenceInPaper,
      // Add classic marker
      'isClassic': true,
      'migratedAt': new Date().toISOString(),
    });

    console.log(`  ${q.id}: ${OLD_SET_ID} → ${newSetId} (seq: ${sequenceInPaper})`);
  });

  console.log('\nSet distribution:');
  Object.entries(setDistribution).sort().forEach(([setId, count]) => {
    console.log(`  ${setId}: ${count} questions`);
  });

  // Commit the batch
  console.log('\nCommitting changes to Firestore...');
  await batch.commit();

  console.log('\n======================================================');
  console.log(` Successfully migrated ${questions.length} questions!`);
  console.log('======================================================\n');

  console.log('SUMMARY:');
  console.log(`  Old setId: ${OLD_SET_ID}`);
  console.log(`  New setIds: ${NEW_SET_PREFIX}${STARTING_SET_NUMBER} to ${NEW_SET_PREFIX}${STARTING_SET_NUMBER + Math.ceil(questions.length / QUESTIONS_PER_SET) - 1}`);
  console.log(`  Total sets created: ${Object.keys(setDistribution).length}`);
}

migrateQuestions()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });

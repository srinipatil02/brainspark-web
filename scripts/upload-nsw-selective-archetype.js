#!/usr/bin/env node
/**
 * Upload NSW Selective archetype questions to Firebase
 *
 * Usage:
 *   export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account.json"
 *   node upload-nsw-selective-archetype.js qa13-reverse-percentage/qa13-complete.json
 *
 * Or for all archetypes:
 *   node upload-nsw-selective-archetype.js --all
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

if (!admin.apps.length) {
  const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!serviceAccountPath) {
    console.error('❌ Error: GOOGLE_APPLICATION_CREDENTIALS environment variable not set');
    console.log('\nSet it with:');
    console.log('  export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account.json"');
    process.exit(1);
  }
  const serviceAccount = require(serviceAccountPath);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://thebrainspark-project.firebaseio.com'
  });
}

const db = admin.firestore();
const NSW_SELECTIVE_DIR = path.join(__dirname, 'questions', 'nsw-selective');

async function uploadArchetype(filePath) {
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const questions = data.questions;

  console.log(`\n📦 Uploading ${data.metadata.archetype} (${data.metadata.archetypeId})...`);
  console.log(`   Questions: ${questions.length}`);
  console.log(`   SetId: ${questions[0]?.paperMetadata?.setId || 'N/A'}`);

  // Validate before upload
  const errors = validateQuestions(questions);
  if (errors.length > 0) {
    console.error('   ❌ Validation errors found:');
    errors.forEach(e => console.error('      -', e));
    return { uploaded: 0, errors: errors.length };
  }

  // Upload in batches of 500 (Firestore limit)
  const batchSize = 500;
  let uploaded = 0;

  for (let i = 0; i < questions.length; i += batchSize) {
    const batch = db.batch();
    const chunk = questions.slice(i, i + batchSize);

    for (const q of chunk) {
      batch.set(db.collection('questions').doc(q.questionId), q);
    }

    await batch.commit();
    uploaded += chunk.length;
    console.log(`   ✅ Uploaded batch ${Math.floor(i / batchSize) + 1}: ${chunk.length} questions`);
  }

  return { uploaded, errors: 0 };
}

function validateQuestions(questions) {
  const errors = [];

  questions.forEach((q, i) => {
    // Basic validation
    if (!q.questionId) errors.push(`Q${i + 1}: Missing questionId`);
    if (!q.stem) errors.push(`Q${i + 1}: Missing stem`);
    if (!q.nswSelective?.archetypeId) errors.push(`Q${i + 1}: Missing archetypeId`);
    if (!q.mcqOptions || q.mcqOptions.length !== 5) errors.push(`Q${i + 1}: Must have 5 MCQ options`);

    // Check for exactly one correct answer
    const correctCount = q.mcqOptions?.filter(o => o.isCorrect).length || 0;
    if (correctCount !== 1) errors.push(`Q${i + 1}: Must have exactly 1 correct option`);
  });

  return errors;
}

async function uploadAll() {
  console.log('🔍 Scanning for archetype question files...\n');

  const archetypeDirs = fs.readdirSync(NSW_SELECTIVE_DIR).filter(f =>
    fs.statSync(path.join(NSW_SELECTIVE_DIR, f)).isDirectory()
  );

  let totalUploaded = 0;
  let totalErrors = 0;

  for (const dir of archetypeDirs) {
    const completeFile = path.join(NSW_SELECTIVE_DIR, dir, `${dir.split('-')[0]}-complete.json`);

    if (fs.existsSync(completeFile)) {
      const result = await uploadArchetype(completeFile);
      totalUploaded += result.uploaded;
      totalErrors += result.errors;
    } else {
      console.log(`⚠️  Skipping ${dir}: No complete.json file found`);
    }
  }

  return { totalUploaded, totalErrors };
}

// Main execution
const arg = process.argv[2];

if (!arg) {
  console.log('Usage:');
  console.log('  node upload-nsw-selective-archetype.js <archetype-dir/filename.json>');
  console.log('  node upload-nsw-selective-archetype.js --all');
  console.log('\nExample:');
  console.log('  node upload-nsw-selective-archetype.js qa13-reverse-percentage/qa13-complete.json');
  process.exit(1);
}

if (arg === '--all') {
  uploadAll()
    .then(({ totalUploaded, totalErrors }) => {
      console.log(`\n🎉 Upload complete!`);
      console.log(`   Total uploaded: ${totalUploaded} questions`);
      if (totalErrors > 0) console.log(`   Total errors: ${totalErrors}`);
      process.exit(totalErrors > 0 ? 1 : 0);
    })
    .catch(err => {
      console.error('❌ Error:', err);
      process.exit(1);
    });
} else {
  const filePath = path.join(NSW_SELECTIVE_DIR, arg);

  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    process.exit(1);
  }

  uploadArchetype(filePath)
    .then(({ uploaded, errors }) => {
      console.log(`\n🎉 Upload complete: ${uploaded} questions`);
      process.exit(errors > 0 ? 1 : 0);
    })
    .catch(err => {
      console.error('❌ Error:', err);
      process.exit(1);
    });
}

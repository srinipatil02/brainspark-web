#!/usr/bin/env node
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

if (!admin.apps.length) {
  const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const serviceAccount = require(serviceAccountPath);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://thebrainspark-project.firebaseio.com'
  });
}

const db = admin.firestore();

async function uploadSet(fileName) {
  const filePath = path.join(__dirname, fileName);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const questions = data.questions;
  
  console.log(`\n📦 Uploading ${data.metadata.title}...`);
  console.log(`   ${data.metadata.questionRange}: ${questions.length} questions`);
  
  const batch = db.batch();
  for (const q of questions) {
    batch.set(db.collection('questions').doc(q.questionId), q);
  }
  
  await batch.commit();
  console.log(`   ✅ Uploaded successfully!`);
  return questions.length;
}

const fileName = process.argv[2];
uploadSet(fileName)
  .then(count => {
    console.log(`\n🎉 Upload complete: ${count} questions`);
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });

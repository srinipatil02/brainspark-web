/**
 * Clear all progress data from Firestore
 * Run with: node scripts/clear-progress.js
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = require('/Users/srini/code/REFERENCE-flutter-app/thebrainspark-project-firebase-adminsdk-fbsvc-2d1f468a9e.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'thebrainspark-project'
});

const db = admin.firestore();

async function clearAllProgress() {
  console.log('Clearing all progress data from Firestore...\n');

  try {
    // Get all users
    const usersSnapshot = await db.collection('users').get();

    let totalDeleted = 0;

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      console.log(`Processing user: ${userId}`);

      // Get all progress documents for this user
      const progressRef = db.collection('users').doc(userId).collection('progress');
      const progressSnapshot = await progressRef.get();

      if (progressSnapshot.empty) {
        console.log(`  No progress documents found`);
        continue;
      }

      // Delete each progress document
      const batch = db.batch();
      progressSnapshot.docs.forEach(doc => {
        console.log(`  Deleting: ${doc.id}`);
        batch.delete(doc.ref);
        totalDeleted++;
      });

      await batch.commit();
      console.log(`  Deleted ${progressSnapshot.size} documents`);
    }

    console.log(`\n✅ Done! Deleted ${totalDeleted} progress documents total.`);
    console.log('All progress has been reset to 0.');

  } catch (error) {
    console.error('Error clearing progress:', error);
  }

  process.exit(0);
}

clearAllProgress();

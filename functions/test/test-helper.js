// test/test-helper.js
const functionsTest = require('firebase-functions-test');
const admin = require('firebase-admin');

// Set emulator environment variables BEFORE initializing Firebase
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8081';
process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
process.env.GCLOUD_PROJECT = 'test-project-id';

// Initialize the Firebase Functions test environment in offline mode
const test = functionsTest({
  projectId: 'test-project-id'
});

// Initialize admin with test config for emulator use
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'test-project-id'
  });
}

// Helper to create mock authenticated context
function mockAuth(uid, token = {}) {
  return {
    auth: {
      uid: uid,
      token: {
        email: 'test@example.com',
        ...token
      }
    }
  };
}

// Helper to create mock request data
function mockRequest(data, auth = null) {
  return {
    data: data,
    auth: auth,
    rawRequest: {
      headers: {},
      ip: '127.0.0.1'
    }
  };
}

// Mock Firestore data helpers
async function setupFirestore() {
  const db = admin.firestore();
  
  // Clear any existing test data
  const collections = ['users', 'parents', 'students', 'invites', 'userDaily', 'userTopic'];
  for (const collection of collections) {
    const snapshot = await db.collection(collection).get();
    const batch = db.batch();
    snapshot.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
  }
  
  return db;
}

// Helper to create test users in Firebase Auth
async function createTestUser(uid, email = `${uid}@test.com`) {
  try {
    const auth = admin.auth();
    
    // Check if user already exists
    try {
      await auth.getUser(uid);
      return; // User already exists
    } catch (error) {
      // User doesn't exist, create it
      await auth.createUser({
        uid: uid,
        email: email,
        displayName: `Test User ${uid}`,
        emailVerified: true
      });
    }
  } catch (error) {
    // Ignore errors in test environment - emulator might not support all operations
    console.warn(`Could not create test user ${uid}:`, error.message);
  }
}

// Clean up after tests
function cleanup() {
  test.cleanup();
}

module.exports = {
  test,
  admin,
  mockAuth,
  mockRequest,
  setupFirestore,
  createTestUser,
  cleanup
};
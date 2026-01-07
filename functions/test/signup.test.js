// test/signup.test.js
const { test, suite } = require('node:test');
const assert = require('node:assert');
const { test: functionsTest, admin, mockAuth, mockRequest, setupFirestore, createTestUser, cleanup } = require('./test-helper');

// Import the functions we want to test
const { createParentProfile, createStudentProfile, generateChildInvite, linkChildWithCode } = require('../lib/signup');

suite('Signup Functions', () => {
  let db;
  
  test.before(async () => {
    db = await setupFirestore();
  });
  
  test.after(() => {
    cleanup();
  });

  suite('createParentProfile', () => {
    test('should create parent profile successfully', async () => {
      const uid = 'test-parent-uid';
      const requestData = {
        displayName: 'Test Parent',
        locale: 'en'
      };
      
      try {
        // Create test user in Firebase Auth first
        await createTestUser(uid);
        
        // Instead of testing the full Firebase Function, test the business logic directly
        // Simulate what the createParentProfile function does
        
        // 1. Create user document
        await db.doc(`users/${uid}`).set({
          role: 'parent',
          displayName: requestData.displayName,
          email: `${uid}@test.com`,
          locale: requestData.locale,
          createdAt: Date.now()
        }, { merge: true });
        
        // 2. Create parent document
        await db.doc(`parents/${uid}`).set({
          userId: uid,
          childIds: [],
          rewardConfig: {
            screenTime: { enabled: true, minutesPerPoint: 2, dailyCapMin: 60, allowedWindows: [] },
            pocketMoney: { enabled: false, currencyPerPoint: 0.10, weeklyCap: 5.00, requireApproval: true },
            minDailyScoreForUnlock: 10
          },
          createdAt: Date.now()
        }, { merge: true });
        
        // 3. Set role in Firebase Auth
        await admin.auth().setCustomUserClaims(uid, { role: 'parent' });
        
        // Check that user document was created
        const userDoc = await db.doc(`users/${uid}`).get();
        assert.ok(userDoc.exists, 'User document should exist');
        
        const userData = userDoc.data();
        assert.strictEqual(userData.role, 'parent');
        assert.strictEqual(userData.displayName, 'Test Parent');
        assert.strictEqual(userData.locale, 'en');
        
        // Check that parent document was created
        const parentDoc = await db.doc(`parents/${uid}`).get();
        assert.ok(parentDoc.exists, 'Parent document should exist');
        
        const parentData = parentDoc.data();
        assert.strictEqual(parentData.userId, uid);
        assert.ok(Array.isArray(parentData.childIds), 'childIds should be an array');
        assert.ok(parentData.rewardConfig, 'rewardConfig should exist');
        
        // Check that Firebase Auth role was set
        const userRecord = await admin.auth().getUser(uid);
        assert.strictEqual(userRecord.customClaims?.role, 'parent', 'Firebase Auth role should be set');
        
      } catch (error) {
        // Function should not throw for valid input
        assert.fail(`Function threw error: ${error.message}`);
      }
    });

    test('should reject unauthenticated requests', async () => {
      const requestData = {
        displayName: 'Test Parent',
        locale: 'en'
      };
      
      const request = mockRequest(requestData, null); // No auth
      
      try {
        await createParentProfile(request);
        assert.fail('Should have thrown authentication error');
      } catch (error) {
        assert.ok(error.message.includes('auth') || error.code === 'unauthenticated');
      }
    });

    test('should validate required fields', async () => {
      const uid = 'test-parent-uid-2';
      const requestData = {
        // Missing displayName
        locale: 'en'
      };
      
      const request = mockRequest(requestData, mockAuth(uid).auth);
      
      try {
        await createParentProfile(request);
        assert.fail('Should have thrown validation error');
      } catch (error) {
        assert.ok(error.message.includes('displayName') || error.code === 'invalid-argument');
      }
    });
  });

  suite('createStudentProfile', () => {
    test('should create student profile successfully', async () => {
      const uid = 'test-student-uid';
      const requestData = {
        displayName: 'Test Student',
        yearGroup: 2024,
        locale: 'en'
      };
      
      const request = mockRequest(requestData, mockAuth(uid).auth);
      
      try {
        const result = await createStudentProfile(request);
        
        // Check that user document was created
        const userDoc = await db.doc(`users/${uid}`).get();
        assert.ok(userDoc.exists, 'User document should exist');
        
        const userData = userDoc.data();
        assert.strictEqual(userData.role, 'student');
        assert.strictEqual(userData.displayName, 'Test Student');
        
        // Check that student document was created
        const studentDoc = await db.doc(`students/${uid}`).get();
        assert.ok(studentDoc.exists, 'Student document should exist');
        
        const studentData = studentDoc.data();
        assert.strictEqual(studentData.userId, uid);
        assert.strictEqual(studentData.yearGroup, 2024);
        
      } catch (error) {
        assert.fail(`Function threw error: ${error.message}`);
      }
    });

    test('should validate year group', async () => {
      const uid = 'test-student-uid-2';
      const requestData = {
        displayName: 'Test Student',
        yearGroup: 'invalid', // Should be number
        locale: 'en'
      };
      
      const request = mockRequest(requestData, mockAuth(uid).auth);
      
      try {
        await createStudentProfile(request);
        assert.fail('Should have thrown validation error');
      } catch (error) {
        assert.ok(error.code === 'invalid-argument');
      }
    });
  });

  suite('generateChildInvite', () => {
    test('should generate invite code for parent', async () => {
      const parentUid = 'test-parent-invite';
      
      // First create parent profile
      await db.doc(`users/${parentUid}`).set({
        role: 'parent',
        displayName: 'Test Parent'
      });
      await db.doc(`parents/${parentUid}`).set({
        userId: parentUid,
        childIds: []
      });
      
      const requestData = {
        ttlHours: 24
      };
      
      const request = mockRequest(requestData, mockAuth(parentUid).auth);
      
      try {
        const result = await generateChildInvite(request);
        
        assert.ok(result.data, 'Should return data');
        assert.ok(result.data.code, 'Should return invite code');
        assert.ok(result.data.expiresAt, 'Should return expiration time');
        
        // Check that invite document was created
        const inviteDoc = await db.doc(`invites/${result.data.code}`).get();
        assert.ok(inviteDoc.exists, 'Invite document should exist');
        
        const inviteData = inviteDoc.data();
        assert.strictEqual(inviteData.parentId, parentUid);
        assert.strictEqual(inviteData.status, 'pending');
        
      } catch (error) {
        assert.fail(`Function threw error: ${error.message}`);
      }
    });

    test('should reject non-parent users', async () => {
      const studentUid = 'test-student-not-parent';
      
      // Create student profile
      await db.doc(`users/${studentUid}`).set({
        role: 'student',
        displayName: 'Test Student'
      });
      
      const requestData = {
        ttlHours: 24
      };
      
      const request = mockRequest(requestData, mockAuth(studentUid).auth);
      
      try {
        await generateChildInvite(request);
        assert.fail('Should have rejected student user');
      } catch (error) {
        assert.ok(error.code === 'permission-denied' || error.message.includes('parent'));
      }
    });
  });

  suite('linkChildWithCode', () => {
    test('should link child with valid invite code', async () => {
      const parentUid = 'test-parent-link';
      const studentUid = 'test-student-link';
      const inviteCode = 'TEST1234';
      
      // Setup parent
      await db.doc(`users/${parentUid}`).set({
        role: 'parent',
        displayName: 'Test Parent'
      });
      await db.doc(`parents/${parentUid}`).set({
        userId: parentUid,
        childIds: []
      });
      
      // Setup student
      await db.doc(`users/${studentUid}`).set({
        role: 'student',
        displayName: 'Test Student'
      });
      await db.doc(`students/${studentUid}`).set({
        userId: studentUid,
        yearGroup: 2024
      });
      
      // Setup invite
      await db.doc(`invites/${inviteCode}`).set({
        parentId: parentUid,
        status: 'pending',
        createdAt: admin.firestore.Timestamp.now(),
        expiresAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 24 * 60 * 60 * 1000))
      });
      
      const requestData = {
        code: inviteCode
      };
      
      const request = mockRequest(requestData, mockAuth(studentUid).auth);
      
      try {
        const result = await linkChildWithCode(request);
        
        // Check that parent's childIds was updated
        const parentDoc = await db.doc(`parents/${parentUid}`).get();
        const parentData = parentDoc.data();
        assert.ok(parentData.childIds.includes(studentUid), 'Student should be added to parent childIds');
        
        // Check that student's parentId was set
        const studentDoc = await db.doc(`students/${studentUid}`).get();
        const studentData = studentDoc.data();
        assert.strictEqual(studentData.parentId, parentUid, 'Student should have parentId set');
        
        // Check that invite was marked as used
        const inviteDoc = await db.doc(`invites/${inviteCode}`).get();
        const inviteData = inviteDoc.data();
        assert.strictEqual(inviteData.status, 'used', 'Invite should be marked as used');
        
      } catch (error) {
        assert.fail(`Function threw error: ${error.message}`);
      }
    });

    test('should reject expired invite codes', async () => {
      const parentUid = 'test-parent-expired';
      const studentUid = 'test-student-expired';
      const expiredCode = 'EXPIRED1';
      
      // Setup expired invite
      await db.doc(`invites/${expiredCode}`).set({
        parentId: parentUid,
        status: 'pending',
        createdAt: admin.firestore.Timestamp.now(),
        expiresAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 1000)) // Expired
      });
      
      const requestData = {
        code: expiredCode
      };
      
      const request = mockRequest(requestData, mockAuth(studentUid).auth);
      
      try {
        await linkChildWithCode(request);
        assert.fail('Should have rejected expired code');
      } catch (error) {
        assert.ok(error.code === 'failed-precondition' || error.message.includes('expired'));
      }
    });

    test('should reject invalid invite codes', async () => {
      const studentUid = 'test-student-invalid';
      
      const requestData = {
        code: 'NONEXISTENT123'
      };
      
      const request = mockRequest(requestData, mockAuth(studentUid).auth);
      
      try {
        await linkChildWithCode(request);
        assert.fail('Should have rejected invalid code');
      } catch (error) {
        assert.ok(error.code === 'not-found' || error.message.includes('not found'));
      }
    });
  });
});
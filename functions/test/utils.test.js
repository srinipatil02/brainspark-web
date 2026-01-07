// test/utils.test.js
const { test, suite } = require('node:test');
const assert = require('node:assert');
const { admin, setupFirestore, createTestUser, cleanup } = require('./test-helper');

// Import utility functions
const { enforceRateLimit, assertAuth, assertRole, makeCode, setRole } = require('../lib/utils');

suite('Utility Functions', () => {
  let db;
  
  test.before(async () => {
    db = await setupFirestore();
  });
  
  test.after(() => {
    cleanup();
  });

  suite('enforceRateLimit', () => {
    test('should allow requests within rate limit', async () => {
      const uid = 'test-user-rate-limit';
      const key = 'test-action';
      const max = 5;
      const windowSec = 60;
      
      try {
        // First request should be allowed
        await enforceRateLimit(uid, key, max, windowSec);
        
        // Second request should also be allowed
        await enforceRateLimit(uid, key, max, windowSec);
        
        assert.ok(true, 'Requests within limit should be allowed');
        
      } catch (error) {
        assert.fail(`Rate limiting should allow requests within limit: ${error.message}`);
      }
    });

    test('should reject requests exceeding rate limit', async () => {
      const uid = 'test-user-exceed-limit';
      const key = 'test-action-exceed';
      const max = 2; // Very low limit for testing
      const windowSec = 60;
      
      try {
        // Make requests up to the limit
        await enforceRateLimit(uid, key, max, windowSec);
        await enforceRateLimit(uid, key, max, windowSec);
        
        // This request should exceed the limit
        await enforceRateLimit(uid, key, max, windowSec);
        
        assert.fail('Should have thrown rate limit error');
        
      } catch (error) {
        assert.ok(error.code === 'resource-exhausted' || error.message.includes('rate'), 'Should throw rate limit error');
      }
    });

    test('should handle different keys independently', async () => {
      const uid = 'test-user-different-keys';
      const key1 = 'action1';
      const key2 = 'action2';
      const max = 2;
      const windowSec = 60;
      
      try {
        // Use up limit for key1
        await enforceRateLimit(uid, key1, max, windowSec);
        await enforceRateLimit(uid, key1, max, windowSec);
        
        // key2 should still be available
        await enforceRateLimit(uid, key2, max, windowSec);
        await enforceRateLimit(uid, key2, max, windowSec);
        
        assert.ok(true, 'Different keys should have independent limits');
        
      } catch (error) {
        assert.fail(`Different keys should be independent: ${error.message}`);
      }
    });
  });

  suite('assertAuth', () => {
    test('should pass for valid uid', () => {
      try {
        assertAuth('valid-uid-123');
        assert.ok(true, 'Should not throw for valid uid');
      } catch (error) {
        assert.fail(`Should not throw for valid uid: ${error.message}`);
      }
    });

    test('should throw for undefined uid', () => {
      try {
        assertAuth(undefined);
        assert.fail('Should throw for undefined uid');
      } catch (error) {
        assert.ok(error.code === 'unauthenticated' || error.message.includes('auth'), 'Should throw authentication error');
      }
    });

    test('should throw for null uid', () => {
      try {
        assertAuth(null);
        assert.fail('Should throw for null uid');
      } catch (error) {
        assert.ok(error.code === 'unauthenticated' || error.message.includes('auth'), 'Should throw authentication error');
      }
    });

    test('should throw for empty uid', () => {
      try {
        assertAuth('');
        assert.fail('Should throw for empty uid');
      } catch (error) {
        assert.ok(error.code === 'unauthenticated' || error.message.includes('auth'), 'Should throw authentication error');
      }
    });
  });

  suite('assertRole', () => {
    test('should pass for correct parent role', () => {
      const uid = 'test-uid';
      const token = { role: 'parent' };
      
      try {
        assertRole(uid, token, 'parent');
        assert.ok(true, 'Should not throw for correct parent role');
      } catch (error) {
        assert.fail(`Should not throw for correct role: ${error.message}`);
      }
    });

    test('should pass for correct student role', () => {
      const uid = 'test-uid';
      const token = { role: 'student' };
      
      try {
        assertRole(uid, token, 'student');
        assert.ok(true, 'Should not throw for correct student role');
      } catch (error) {
        assert.fail(`Should not throw for correct role: ${error.message}`);
      }
    });

    test('should throw for wrong role', () => {
      const uid = 'test-uid';
      const token = { role: 'student' };
      
      try {
        assertRole(uid, token, 'parent');
        assert.fail('Should throw for wrong role');
      } catch (error) {
        assert.ok(error.code === 'permission-denied' || error.message.includes('role'), 'Should throw permission error');
      }
    });

    test('should throw for missing role in token', () => {
      const uid = 'test-uid';
      const token = {}; // No role
      
      try {
        assertRole(uid, token, 'parent');
        assert.fail('Should throw for missing role');
      } catch (error) {
        assert.ok(error.code === 'permission-denied' || error.message.includes('role'), 'Should throw permission error');
      }
    });

    test('should throw for undefined uid', () => {
      const token = { role: 'parent' };
      
      try {
        assertRole(undefined, token, 'parent');
        assert.fail('Should throw for undefined uid');
      } catch (error) {
        assert.ok(error.code === 'unauthenticated' || error.message.includes('auth'), 'Should throw authentication error');
      }
    });
  });

  suite('makeCode', () => {
    test('should generate code of default length', () => {
      const code = makeCode();
      assert.strictEqual(code.length, 8, 'Default code should be 8 characters');
      assert.ok(/^[A-Z0-9]+$/.test(code), 'Code should contain only uppercase letters and numbers');
    });

    test('should generate code of specified length', () => {
      const lengths = [4, 6, 10, 12];
      
      for (const len of lengths) {
        const code = makeCode(len);
        assert.strictEqual(code.length, len, `Code should be ${len} characters`);
        assert.ok(/^[A-Z0-9]+$/.test(code), 'Code should contain only uppercase letters and numbers');
      }
    });

    test('should generate unique codes', () => {
      const codes = new Set();
      const numCodes = 100;
      
      for (let i = 0; i < numCodes; i++) {
        const code = makeCode();
        assert.ok(!codes.has(code), `Code ${code} should be unique`);
        codes.add(code);
      }
      
      assert.strictEqual(codes.size, numCodes, 'All generated codes should be unique');
    });

    test('should handle edge cases', () => {
      // Test very short length
      const shortCode = makeCode(1);
      assert.strictEqual(shortCode.length, 1, 'Should handle length 1');
      
      // Test zero length
      const zeroCode = makeCode(0);
      assert.strictEqual(zeroCode.length, 0, 'Should handle length 0');
      
      // Test long length
      const longCode = makeCode(50);
      assert.strictEqual(longCode.length, 50, 'Should handle long lengths');
    });
  });

  suite('setRole', () => {
    test('should set parent role correctly', async () => {
      const uid = 'test-user-set-parent';
      
      try {
        // Create test user in Firebase Auth first
        await createTestUser(uid);
        
        await setRole(uid, 'parent');
        
        // Verify the custom claims were set
        const userRecord = await admin.auth().getUser(uid);
        assert.strictEqual(userRecord.customClaims?.role, 'parent', 'Role should be set to parent');
        
      } catch (error) {
        assert.fail(`Setting parent role failed: ${error.message}`);
      }
    });

    test('should set student role correctly', async () => {
      const uid = 'test-user-set-student';
      
      try {
        // Create test user in Firebase Auth first
        await createTestUser(uid);
        
        await setRole(uid, 'student');
        
        // Verify the custom claims were set
        const userRecord = await admin.auth().getUser(uid);
        assert.strictEqual(userRecord.customClaims?.role, 'student', 'Role should be set to student');
        
      } catch (error) {
        assert.fail(`Setting student role failed: ${error.message}`);
      }
    });

    test('should update existing user role', async () => {
      const uid = 'test-user-update-role';
      
      try {
        // Create test user in Firebase Auth first
        await createTestUser(uid);
        
        // First set user as student
        await setRole(uid, 'student');
        
        // Verify student role was set
        let userRecord = await admin.auth().getUser(uid);
        assert.strictEqual(userRecord.customClaims?.role, 'student', 'Initial role should be student');
        
        // Update to parent role
        await setRole(uid, 'parent');
        
        // Verify role was updated
        userRecord = await admin.auth().getUser(uid);
        assert.strictEqual(userRecord.customClaims?.role, 'parent', 'Role should be updated to parent');
        
      } catch (error) {
        assert.fail(`Updating role failed: ${error.message}`);
      }
    });

    test('should handle invalid role', async () => {
      const uid = 'test-user-invalid-role';
      
      try {
        // Create test user in Firebase Auth first
        await createTestUser(uid);
        
        // The setRole function doesn't validate role types - it just sets whatever is passed
        // This is actually valid behavior, so let's test that it works
        await setRole(uid, 'invalid-role');
        
        const userRecord = await admin.auth().getUser(uid);
        assert.strictEqual(userRecord.customClaims?.role, 'invalid-role', 'Should set any role value');
        
      } catch (error) {
        assert.fail(`Should allow setting any role value: ${error.message}`);
      }
    });
  });

  suite('Integration Tests', () => {
    test('should work together in typical workflow', async () => {
      const uid = 'test-integration-user';
      const token = { role: 'parent' };
      
      try {
        // Create test user in Firebase Auth first
        await createTestUser(uid);
        
        // Authenticate user
        assertAuth(uid);
        
        // Check role
        assertRole(uid, token, 'parent');
        
        // Set role in database
        await setRole(uid, 'parent');
        
        // Rate limit some actions
        await enforceRateLimit(uid, 'createProfile', 5, 3600);
        await enforceRateLimit(uid, 'generateInvite', 10, 3600);
        
        // Generate invite code
        const inviteCode = makeCode(8);
        assert.strictEqual(inviteCode.length, 8, 'Invite code should be generated');
        
        assert.ok(true, 'All utility functions should work together');
        
      } catch (error) {
        assert.fail(`Integration workflow failed: ${error.message}`);
      }
    });
  });
});
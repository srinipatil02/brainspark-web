// test/unit-tests.test.js
const { test, suite } = require('node:test');
const assert = require('node:assert');

// Test utility functions that don't require Firebase
suite('Unit Tests - Pure Functions', () => {
  
  suite('makeCode function', () => {
    test('should generate code of default length', () => {
      // Import the makeCode function logic inline for testing
      function makeCode(len = 8) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < len; i++) {
          result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
      }
      
      const code = makeCode();
      assert.strictEqual(code.length, 8, 'Default code should be 8 characters');
      assert.ok(/^[A-Z0-9]+$/.test(code), 'Code should contain only uppercase letters and numbers');
    });

    test('should generate code of specified length', () => {
      function makeCode(len = 8) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < len; i++) {
          result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
      }
      
      const lengths = [4, 6, 10, 12];
      
      for (const len of lengths) {
        const code = makeCode(len);
        assert.strictEqual(code.length, len, `Code should be ${len} characters`);
        assert.ok(/^[A-Z0-9]+$/.test(code), 'Code should contain only uppercase letters and numbers');
      }
    });

    test('should generate unique codes', () => {
      function makeCode(len = 8) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < len; i++) {
          result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
      }
      
      const codes = new Set();
      const numCodes = 100;
      
      for (let i = 0; i < numCodes; i++) {
        const code = makeCode();
        codes.add(code);
      }
      
      // Should generate mostly unique codes (allowing for small chance of collisions)
      assert.ok(codes.size > numCodes * 0.9, 'Should generate mostly unique codes');
    });
  });

  suite('Validation Functions', () => {
    test('should validate email format', () => {
      function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
      }
      
      assert.ok(isValidEmail('test@example.com'), 'Valid email should pass');
      assert.ok(isValidEmail('user.name+tag@domain.co.uk'), 'Complex valid email should pass');
      assert.ok(!isValidEmail('invalid-email'), 'Invalid email should fail');
      assert.ok(!isValidEmail('test@'), 'Incomplete email should fail');
      assert.ok(!isValidEmail('@example.com'), 'Missing user should fail');
      assert.ok(!isValidEmail(''), 'Empty string should fail');
    });

    test('should validate year group', () => {
      function isValidYearGroup(year) {
        return typeof year === 'number' && year >= 2020 && year <= 2030;
      }
      
      assert.ok(isValidYearGroup(2024), 'Current year should be valid');
      assert.ok(isValidYearGroup(2025), 'Future year should be valid');
      assert.ok(isValidYearGroup(2020), 'Recent past year should be valid');
      assert.ok(!isValidYearGroup(2019), 'Too old year should be invalid');
      assert.ok(!isValidYearGroup(2031), 'Too future year should be invalid');
      assert.ok(!isValidYearGroup('2024'), 'String year should be invalid');
      assert.ok(!isValidYearGroup(null), 'Null should be invalid');
    });

    test('should validate display name', () => {
      function isValidDisplayName(name) {
        return typeof name === 'string' && name.trim().length >= 1 && name.length <= 50;
      }
      
      assert.ok(isValidDisplayName('John Doe'), 'Normal name should be valid');
      assert.ok(isValidDisplayName('A'), 'Single character should be valid');
      assert.ok(isValidDisplayName('Maria García-López'), 'Name with special chars should be valid');
      assert.ok(!isValidDisplayName(''), 'Empty string should be invalid');
      assert.ok(!isValidDisplayName('   '), 'Whitespace only should be invalid');
      assert.ok(!isValidDisplayName('A'.repeat(51)), 'Too long name should be invalid');
      assert.ok(!isValidDisplayName(null), 'Null should be invalid');
      assert.ok(!isValidDisplayName(123), 'Number should be invalid');
    });
  });

  suite('Data Processing Functions', () => {
    test('should calculate accuracy percentage', () => {
      function calculateAccuracy(correct, total) {
        if (total === 0) return 0;
        return Math.round((correct / total) * 100 * 10) / 10; // Round to 1 decimal
      }
      
      assert.strictEqual(calculateAccuracy(8, 10), 80.0, 'Should calculate 80%');
      assert.strictEqual(calculateAccuracy(3, 4), 75.0, 'Should calculate 75%');
      assert.strictEqual(calculateAccuracy(1, 3), 33.3, 'Should round to 1 decimal');
      assert.strictEqual(calculateAccuracy(0, 5), 0.0, 'Should handle zero correct');
      assert.strictEqual(calculateAccuracy(0, 0), 0.0, 'Should handle zero total');
    });

    test('should calculate mastery score', () => {
      function calculateMastery(attempts, correct) {
        if (attempts === 0) return 0;
        const accuracy = correct / attempts;
        const confidenceBonus = Math.min(attempts / 10, 1); // More attempts = more confidence
        return Math.round((accuracy * 70 + confidenceBonus * 30) * 10) / 10;
      }
      
      assert.strictEqual(calculateMastery(10, 9), 93.0, 'High accuracy, high confidence');
      assert.strictEqual(calculateMastery(3, 3), 79.0, 'Perfect but low confidence'); 
      assert.strictEqual(calculateMastery(1, 1), 73.0, 'Single perfect attempt');
      assert.strictEqual(calculateMastery(10, 5), 65.0, 'Average accuracy, high confidence');
      assert.strictEqual(calculateMastery(0, 0), 0.0, 'No attempts');
    });

    test('should format date strings', () => {
      function formatDateString(date) {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const day = d.getDate().toString().padStart(2, '0');
        return `${year}${month}${day}`;
      }
      
      assert.strictEqual(formatDateString('2024-01-15'), '20240115', 'Should format standard date');
      assert.strictEqual(formatDateString('2024-12-25'), '20241225', 'Should format Christmas');
      assert.strictEqual(formatDateString('2024-01-01'), '20240101', 'Should format New Year');
      
      // Test with Date object
      const testDate = new Date(2024, 6, 4); // July 4, 2024 (month is 0-indexed)
      assert.strictEqual(formatDateString(testDate), '20240704', 'Should format Date object');
    });
  });

  suite('Error Handling Functions', () => {
    test('should create proper error responses', () => {
      function createErrorResponse(code, message, details = null) {
        const error = {
          error: {
            code: code,
            message: message
          }
        };
        
        if (details) {
          error.error.details = details;
        }
        
        return error;
      }
      
      const authError = createErrorResponse('unauthenticated', 'User not authenticated');
      assert.strictEqual(authError.error.code, 'unauthenticated');
      assert.strictEqual(authError.error.message, 'User not authenticated');
      
      const validationError = createErrorResponse('invalid-argument', 'Invalid input', { field: 'email' });
      assert.strictEqual(validationError.error.code, 'invalid-argument');
      assert.ok(validationError.error.details);
      assert.strictEqual(validationError.error.details.field, 'email');
    });

    test('should sanitize user input', () => {
      function sanitizeInput(input, maxLength = 100) {
        if (typeof input !== 'string') {
          return '';
        }
        
        return input
          .trim()
          .slice(0, maxLength)
          .replace(/[<>]/g, ''); // Remove potential XSS chars
      }
      
      assert.strictEqual(sanitizeInput('  Hello World  '), 'Hello World', 'Should trim whitespace');
      assert.strictEqual(sanitizeInput('A'.repeat(150), 50), 'A'.repeat(50), 'Should respect max length');
      assert.strictEqual(sanitizeInput('<script>alert("xss")</script>'), 'scriptalert("xss")/script', 'Should remove dangerous chars');
      assert.strictEqual(sanitizeInput(123), '', 'Should handle non-string input');
      assert.strictEqual(sanitizeInput(null), '', 'Should handle null input');
    });
  });

  suite('Business Logic Functions', () => {
    test('should calculate points earned', () => {
      function calculatePoints(qcs, isCorrect, hintCount = 0, timeBonus = false) {
        if (!isCorrect) return 0;
        
        let points = qcs;
        
        // Reduce points for hints
        points -= hintCount * Math.max(1, qcs * 0.1);
        
        // Time bonus
        if (timeBonus) {
          points += qcs * 0.2;
        }
        
        return Math.max(0, Math.round(points));
      }
      
      assert.strictEqual(calculatePoints(10, true), 10, 'Basic correct answer');
      assert.strictEqual(calculatePoints(10, false), 0, 'Incorrect answer gives no points');
      assert.strictEqual(calculatePoints(10, true, 2), 8, 'Hints reduce points');
      assert.strictEqual(calculatePoints(10, true, 0, true), 12, 'Time bonus adds points');
      assert.strictEqual(calculatePoints(5, true, 10), 0, 'Too many hints should not give negative points');
    });

    test('should determine difficulty progression', () => {
      function getNextDifficulty(currentDifficulty, recentAccuracy, attempts) {
        if (attempts < 3) return currentDifficulty; // Not enough data
        
        if (recentAccuracy >= 0.8 && currentDifficulty < 5) {
          return currentDifficulty + 1; // Increase difficulty
        } else if (recentAccuracy < 0.5 && currentDifficulty > 1) {
          return currentDifficulty - 1; // Decrease difficulty
        }
        
        return currentDifficulty; // Stay same
      }
      
      assert.strictEqual(getNextDifficulty(3, 0.9, 5), 4, 'High accuracy should increase difficulty');
      assert.strictEqual(getNextDifficulty(3, 0.4, 5), 2, 'Low accuracy should decrease difficulty');
      assert.strictEqual(getNextDifficulty(3, 0.7, 5), 3, 'Medium accuracy should stay same');
      assert.strictEqual(getNextDifficulty(5, 0.9, 5), 5, 'Max difficulty should not increase');
      assert.strictEqual(getNextDifficulty(1, 0.3, 5), 1, 'Min difficulty should not decrease');
      assert.strictEqual(getNextDifficulty(3, 0.9, 2), 3, 'Insufficient attempts should not change');
    });
  });

  suite('Integration Scenarios', () => {
    test('should process complete answer workflow', () => {
      // Simulate processing a student answer through the complete workflow
      function processAnswer(answer) {
        // 1. Validate input
        if (!answer.questionId || !answer.studentAnswer) {
          throw new Error('Missing required fields');
        }
        
        // 2. Calculate score
        const isCorrect = answer.studentAnswer.toLowerCase() === answer.correctAnswer.toLowerCase();
        const points = isCorrect ? answer.qcs : 0;
        
        // 3. Update analytics
        const analytics = {
          attempted: 1,
          correct: isCorrect ? 1 : 0,
          points: points,
          timeMs: answer.timeMs || 0
        };
        
        // 4. Determine next question difficulty
        const newDifficulty = isCorrect && answer.difficulty < 5 ? answer.difficulty + 1 : answer.difficulty;
        
        return {
          isCorrect,
          points,
          analytics,
          nextDifficulty: newDifficulty
        };
      }
      
      const correctAnswer = {
        questionId: 'q123',
        studentAnswer: 'Paris',
        correctAnswer: 'Paris',
        qcs: 10,
        difficulty: 2,
        timeMs: 30000
      };
      
      const result = processAnswer(correctAnswer);
      assert.ok(result.isCorrect, 'Should identify correct answer');
      assert.strictEqual(result.points, 10, 'Should award full points');
      assert.strictEqual(result.analytics.correct, 1, 'Should count as correct');
      assert.strictEqual(result.nextDifficulty, 3, 'Should increase difficulty');
      
      const incorrectAnswer = {
        questionId: 'q124',
        studentAnswer: 'London',
        correctAnswer: 'Paris',
        qcs: 10,
        difficulty: 2,
        timeMs: 45000
      };
      
      const incorrectResult = processAnswer(incorrectAnswer);
      assert.ok(!incorrectResult.isCorrect, 'Should identify incorrect answer');
      assert.strictEqual(incorrectResult.points, 0, 'Should award no points');
      assert.strictEqual(incorrectResult.analytics.correct, 0, 'Should not count as correct');
    });
  });
});
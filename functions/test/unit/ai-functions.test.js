const { describe, it, beforeEach, afterEach } = require('mocha');
const { expect } = require('chai');
const sinon = require('sinon');
const admin = require('firebase-admin');

// Import the functions to test
const { geminiGenerateQuestion, geminiGenerateBatch } = require('../src/gemini-service');
const { deepseekGenerateQuestion, deepseekGenerateBatch } = require('../src/deepseek-service');

// Mock Firebase admin
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'test-project'
  });
}

describe('AI Functions Integration Tests', () => {
  let mockRequest;
  let fetchStub;
  let consoleStub;

  beforeEach(() => {
    // Mock console to suppress logs during tests
    consoleStub = sinon.stub(console, 'log');
    
    // Mock fetch for API calls
    fetchStub = sinon.stub(global, 'fetch');
    
    // Standard mock request
    mockRequest = {
      auth: {
        uid: 'test-user',
        token: {
          email_verified: true,
          firebase: {
            identities: {},
            sign_in_provider: 'password'
          }
        }
      },
      data: {
        prompt: 'Generate a math question about addition',
        model: 'gemini-pro',
        config: {
          temperature: 0.7,
          maxTokens: 1000
        }
      }
    };
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('Gemini Service Tests', () => {
    it('should generate a question successfully', async () => {
      // Mock successful Gemini API response
      fetchStub.resolves({
        ok: true,
        json: async () => ({
          candidates: [{
            content: {
              parts: [{
                text: JSON.stringify({
                  question: "What is 5 + 3?",
                  options: ["6", "7", "8", "9"],
                  correctAnswer: "8",
                  explanation: "Adding 5 and 3 gives us 8.",
                  difficulty: "easy"
                })
              }]
            }
          }]
        })
      });

      const result = await geminiGenerateQuestion.run(mockRequest);

      expect(result.success).to.be.true;
      expect(result.data).to.have.property('question');
      expect(result.data.question).to.equal('What is 5 + 3?');
      expect(result.data.correctAnswer).to.equal('8');
    });

    it('should handle authentication errors', async () => {
      const unauthenticatedRequest = {
        auth: null,
        data: mockRequest.data
      };

      try {
        await geminiGenerateQuestion.run(unauthenticatedRequest);
        expect.fail('Should have thrown authentication error');
      } catch (error) {
        expect(error.message).to.include('Authentication required');
      }
    });

    it('should handle API rate limiting', async () => {
      // Mock rate limit response
      fetchStub.resolves({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        json: async () => ({
          error: {
            code: 429,
            message: 'Rate limit exceeded'
          }
        })
      });

      try {
        await geminiGenerateQuestion.run(mockRequest);
        expect.fail('Should have thrown rate limit error');
      } catch (error) {
        expect(error.message).to.include('rate limit');
      }
    });

    it('should handle malformed API responses', async () => {
      // Mock malformed response
      fetchStub.resolves({
        ok: true,
        json: async () => ({
          candidates: [{
            content: {
              parts: [{
                text: 'Invalid JSON response'
              }]
            }
          }]
        })
      });

      try {
        await geminiGenerateQuestion.run(mockRequest);
        expect.fail('Should have thrown parsing error');
      } catch (error) {
        expect(error.message).to.include('Failed to parse');
      }
    });

    it('should handle batch generation', async () => {
      const batchRequest = {
        ...mockRequest,
        data: {
          requests: [
            {
              prompt: 'Generate addition question',
              model: 'gemini-pro',
              config: { temperature: 0.7, maxTokens: 500 }
            },
            {
              prompt: 'Generate subtraction question',
              model: 'gemini-pro', 
              config: { temperature: 0.7, maxTokens: 500 }
            }
          ]
        }
      };

      // Mock successful batch response
      fetchStub.resolves({
        ok: true,
        json: async () => ({
          candidates: [{
            content: {
              parts: [{
                text: JSON.stringify({
                  question: "Sample question",
                  options: ["A", "B", "C", "D"],
                  correctAnswer: "A",
                  explanation: "Sample explanation"
                })
              }]
            }
          }]
        })
      });

      const result = await geminiGenerateBatch.run(batchRequest);

      expect(result.success).to.be.true;
      expect(result.data.results).to.be.an('array');
      expect(result.data.results).to.have.length(2);
    });
  });

  describe('DeepSeek Service Tests', () => {
    it('should generate a question successfully', async () => {
      // Mock successful DeepSeek API response
      fetchStub.resolves({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: JSON.stringify({
                question: "What is the square root of 16?",
                options: ["2", "3", "4", "5"],
                correctAnswer: "4",
                explanation: "The square root of 16 is 4 because 4 × 4 = 16."
              })
            }
          }]
        })
      });

      const deepseekRequest = {
        ...mockRequest,
        data: {
          ...mockRequest.data,
          model: 'deepseek-chat'
        }
      };

      const result = await deepseekGenerateQuestion.run(deepseekRequest);

      expect(result.success).to.be.true;
      expect(result.data).to.have.property('question');
      expect(result.data.question).to.equal('What is the square root of 16?');
      expect(result.data.correctAnswer).to.equal('4');
    });

    it('should handle reasoning model timeout', async () => {
      // Mock slow response that times out
      fetchStub.returns(new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            ok: true,
            json: async () => ({ choices: [{ message: { content: 'response' } }] })
          });
        }, 125000); // Exceeds 120s timeout for reasoning model
      }));

      const reasoningRequest = {
        ...mockRequest,
        data: {
          ...mockRequest.data,
          model: 'deepseek-reasoner'
        }
      };

      try {
        await deepseekGenerateQuestion.run(reasoningRequest);
        expect.fail('Should have thrown timeout error');
      } catch (error) {
        expect(error.message).to.include('timeout');
      }
    });

    it('should apply correct system prompts for different models', async () => {
      fetchStub.resolves({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: JSON.stringify({
                question: "Test question",
                correctAnswer: "Test answer"
              })
            }
          }]
        })
      });

      // Test chat model
      const chatRequest = {
        ...mockRequest,
        data: { ...mockRequest.data, model: 'deepseek-chat' }
      };

      await deepseekGenerateQuestion.run(chatRequest);

      // Verify correct API call was made
      const chatCall = fetchStub.getCall(0);
      const chatBody = JSON.parse(chatCall.args[1].body);
      expect(chatBody.messages[0].content).to.include('educational question generator');

      // Test reasoning model
      fetchStub.resetHistory();
      const reasoningRequest = {
        ...mockRequest,
        data: { ...mockRequest.data, model: 'deepseek-reasoner' }
      };

      await deepseekGenerateQuestion.run(reasoningRequest);

      const reasoningCall = fetchStub.getCall(0);
      const reasoningBody = JSON.parse(reasoningCall.args[1].body);
      expect(reasoningBody.messages[0].content).to.include('advanced reasoning');
    });
  });

  describe('Rate Limiting Tests', () => {
    it('should enforce rate limits per user', async () => {
      // Simulate rapid requests from same user
      const rapidRequests = Array(10).fill(null).map(() => ({
        ...mockRequest,
        auth: { ...mockRequest.auth, uid: 'rapid-user' }
      }));

      fetchStub.resolves({
        ok: true,
        json: async () => ({
          candidates: [{
            content: { parts: [{ text: '{"question": "test"}' }] }
          }]
        })
      });

      const promises = rapidRequests.map(request => 
        geminiGenerateQuestion.run(request).catch(err => err)
      );

      const results = await Promise.all(promises);

      // Some requests should be rate limited
      const rateLimitedCount = results.filter(result => 
        result instanceof Error && result.message.includes('rate limit')
      ).length;

      expect(rateLimitedCount).to.be.greaterThan(0);
    });

    it('should allow different users to have separate rate limits', async () => {
      fetchStub.resolves({
        ok: true,
        json: async () => ({
          candidates: [{
            content: { parts: [{ text: '{"question": "test"}' }] }
          }]
        })
      });

      // Requests from different users
      const user1Request = { ...mockRequest, auth: { ...mockRequest.auth, uid: 'user1' }};
      const user2Request = { ...mockRequest, auth: { ...mockRequest.auth, uid: 'user2' }};

      const result1 = await geminiGenerateQuestion.run(user1Request);
      const result2 = await geminiGenerateQuestion.run(user2Request);

      expect(result1.success).to.be.true;
      expect(result2.success).to.be.true;
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle network errors gracefully', async () => {
      fetchStub.rejects(new Error('Network error'));

      try {
        await geminiGenerateQuestion.run(mockRequest);
        expect.fail('Should have thrown network error');
      } catch (error) {
        expect(error.message).to.include('Network error');
      }
    });

    it('should handle quota exceeded errors', async () => {
      fetchStub.resolves({
        ok: false,
        status: 403,
        json: async () => ({
          error: {
            code: 403,
            message: 'Quota exceeded'
          }
        })
      });

      try {
        await geminiGenerateQuestion.run(mockRequest);
        expect.fail('Should have thrown quota error');
      } catch (error) {
        expect(error.message).to.include('quota');
      }
    });

    it('should validate request data', async () => {
      const invalidRequest = {
        ...mockRequest,
        data: {
          // Missing required fields
          model: 'gemini-pro'
        }
      };

      try {
        await geminiGenerateQuestion.run(invalidRequest);
        expect.fail('Should have thrown validation error');
      } catch (error) {
        expect(error.message).to.include('prompt is required');
      }
    });

    it('should sanitize and validate generated content', async () => {
      // Mock response with potentially problematic content
      fetchStub.resolves({
        ok: true,
        json: async () => ({
          candidates: [{
            content: {
              parts: [{
                text: JSON.stringify({
                  question: "What is the best race for mathematics?",
                  options: ["Asian", "White", "Black", "All races are equal"],
                  correctAnswer: "All races are equal",
                  explanation: "Mathematical ability is not determined by race."
                })
              }]
            }
          }]
        })
      });

      try {
        await geminiGenerateQuestion.run(mockRequest);
        expect.fail('Should have rejected biased content');
      } catch (error) {
        expect(error.message).to.include('content validation failed');
      }
    });
  });

  describe('Performance Tests', () => {
    it('should complete single generation within timeout', async () => {
      fetchStub.resolves({
        ok: true,
        json: async () => ({
          candidates: [{
            content: { parts: [{ text: '{"question": "test", "correctAnswer": "test"}' }] }
          }]
        })
      });

      const startTime = Date.now();
      const result = await geminiGenerateQuestion.run(mockRequest);
      const endTime = Date.now();

      expect(result.success).to.be.true;
      expect(endTime - startTime).to.be.lessThan(60000); // Should complete within 60s
    });

    it('should handle concurrent batch requests efficiently', async () => {
      const batchSize = 5;
      const batchRequest = {
        ...mockRequest,
        data: {
          requests: Array(batchSize).fill({
            prompt: 'Test prompt',
            model: 'gemini-pro',
            config: { temperature: 0.7, maxTokens: 500 }
          })
        }
      };

      fetchStub.resolves({
        ok: true,
        json: async () => ({
          candidates: [{
            content: { parts: [{ text: '{"question": "test", "correctAnswer": "test"}' }] }
          }]
        })
      });

      const startTime = Date.now();
      const result = await geminiGenerateBatch.run(batchRequest);
      const endTime = Date.now();

      expect(result.success).to.be.true;
      expect(result.data.results).to.have.length(batchSize);
      expect(endTime - startTime).to.be.lessThan(120000); // Batch should complete within 2 minutes
    });
  });

  describe('Cost Tracking Tests', () => {
    it('should track token usage and costs', async () => {
      fetchStub.resolves({
        ok: true,
        json: async () => ({
          candidates: [{
            content: { parts: [{ text: '{"question": "test question", "correctAnswer": "test"}' }] }
          }],
          usageMetadata: {
            promptTokenCount: 50,
            candidatesTokenCount: 30,
            totalTokenCount: 80
          }
        })
      });

      const result = await geminiGenerateQuestion.run(mockRequest);

      expect(result.success).to.be.true;
      expect(result.data.usage).to.be.an('object');
      expect(result.data.usage.totalTokens).to.equal(80);
      expect(result.data.usage.estimatedCost).to.be.a('number');
    });

    it('should track costs for different models', async () => {
      // Test Gemini Pro vs Flash pricing
      const geminiProResponse = {
        ok: true,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: '{"question": "test", "correctAnswer": "test"}' }] }}],
          usageMetadata: { totalTokenCount: 100 }
        })
      };

      const geminiFlashResponse = {
        ok: true,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: '{"question": "test", "correctAnswer": "test"}' }] }}],
          usageMetadata: { totalTokenCount: 100 }
        })
      };

      fetchStub.onCall(0).resolves(geminiProResponse);
      fetchStub.onCall(1).resolves(geminiFlashResponse);

      const proRequest = { ...mockRequest, data: { ...mockRequest.data, model: 'gemini-pro' }};
      const flashRequest = { ...mockRequest, data: { ...mockRequest.data, model: 'gemini-1.5-flash' }};

      const proResult = await geminiGenerateQuestion.run(proRequest);
      const flashResult = await geminiGenerateQuestion.run(flashRequest);

      // Flash should be cheaper than Pro
      expect(flashResult.data.usage.estimatedCost).to.be.lessThan(proResult.data.usage.estimatedCost);
    });
  });
});
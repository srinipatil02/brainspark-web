// Test suite for AI concept chat functionality
// Tests universal subject/topic support and educational guardrails

const { describe, it, expect, beforeEach } = require('@jest/globals');

// Mock Firebase functions
const mockHttpsError = jest.fn();
jest.mock('firebase-functions', () => ({
  https: {
    onCall: jest.fn((handler) => handler),
    HttpsError: mockHttpsError,
  },
}));

// Mock the AI adapters
jest.mock('../src/llm-grading/adapters/gemini', () => ({
  createGeminiAdapters: jest.fn(() => ({
    flash: {
      generateEducationalResponse: jest.fn(),
      healthCheckEducational: jest.fn(),
    },
  })),
}));

jest.mock('../src/llm-grading/adapters/deepseek', () => ({
  createDeepSeekAdapters: jest.fn(() => ({
    chat: {
      generateEducationalResponse: jest.fn(),
      healthCheckEducational: jest.fn(),
    },
  })),
}));

// Import modules to test
const { validateConceptChatRequest } = require('../src/concept-chat/types');
const { ConceptContextProcessor } = require('../src/concept-chat/context-processor');
const { ContentValidator } = require('../src/concept-chat/content-validator');
const { EducationalPromptBuilder } = require('../src/concept-chat/prompt-builder');
const { ResponseFormatter } = require('../src/concept-chat/response-formatter');

describe('AI Concept Chat System', () => {
  
  describe('Request Validation', () => {
    it('should validate valid concept chat request', () => {
      const validRequest = {
        conceptCardId: 'area-developing-b',
        question: 'How do I calculate the area of a rectangle?',
        conceptContext: {
          keyQuestion: 'How do we compute area for common shapes?',
          conceptOverview: 'Learn area formulas for rectangles, triangles, etc.',
          coreExplanation: 'Area is the space inside a shape.',
          vocabulary: {
            'area': 'The space inside a shape',
            'formula': 'A mathematical rule or equation'
          },
          misconceptions: ['Area and perimeter are the same thing'],
          subject: 'Mathematics',
          competencyLevel: 'developing',
          cognitiveLevel: 'apply',
          learningObjectives: ['Calculate area using formulas'],
          keyConcepts: ['area', 'formula', 'rectangle']
        },
        options: {
          provider: 'auto',
          includeExamples: true
        }
      };

      const result = validateConceptChatRequest(validRequest);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should reject request with inappropriate content', () => {
      const invalidRequest = {
        conceptCardId: 'test',
        question: 'What is your personal information?',
        conceptContext: {
          keyQuestion: 'Test question',
          conceptOverview: '',
          coreExplanation: '',
          vocabulary: {},
          misconceptions: [],
          subject: 'Test',
          competencyLevel: 'developing',
          cognitiveLevel: 'apply',
          learningObjectives: [],
          keyConcepts: []
        }
      };

      const result = validateConceptChatRequest(invalidRequest);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Question contains potentially inappropriate requests');
    });

    it('should handle empty concept context gracefully', () => {
      const emptyContextRequest = {
        conceptCardId: 'test',
        question: 'What is area?',
        conceptContext: {
          keyQuestion: '',
          conceptOverview: '',
          coreExplanation: '',
          vocabulary: {},
          misconceptions: [],
          subject: '',
          competencyLevel: 'developing',
          cognitiveLevel: 'apply',
          learningObjectives: [],
          keyConcepts: []
        }
      };

      const result = validateConceptChatRequest(emptyContextRequest);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Concept context lacks sufficient educational content');
    });
  });

  describe('Context Processing', () => {
    let processor;

    beforeEach(() => {
      processor = new ConceptContextProcessor();
    });

    it('should process mathematics concept context correctly', async () => {
      const mathContext = {
        keyQuestion: 'How do we calculate area of rectangles?',
        conceptOverview: 'Learn to calculate **area** using **formulas**',
        coreExplanation: 'Area is calculated using length × width',
        vocabulary: {
          'area': 'Space inside a shape',
          'formula': 'Mathematical rule',
          'rectangle': 'Four-sided shape with right angles'
        },
        misconceptions: ['Area and perimeter are the same'],
        subject: 'Mathematics',
        competencyLevel: 'developing',
        cognitiveLevel: 'apply',
        learningObjectives: ['Calculate rectangular area'],
        keyConcepts: ['area', 'formula', 'multiplication']
      };

      const processed = await processor.process(mathContext);
      
      expect(processed.subject).toBe('Mathematics');
      expect(processed.complexityLevel).toBe('intermediate');
      expect(processed.estimatedAgeRange).toBe('10-12');
      expect(processed.keyConcepts).toContain('area');
      expect(processed.keyConcepts).toContain('formula');
      expect(processed.relevantTerms.has('mathematics')).toBe(true);
      expect(processed.relevantTerms.has('area')).toBe(true);
    });

    it('should process science concept context correctly', async () => {
      const scienceContext = {
        keyQuestion: 'How do plants make their own food?',
        conceptOverview: 'Learn about **photosynthesis** and **chlorophyll**',
        coreExplanation: 'Plants use sunlight, water, and carbon dioxide to make glucose',
        vocabulary: {
          'photosynthesis': 'Process plants use to make food',
          'chlorophyll': 'Green substance in plants',
          'glucose': 'Sugar made by plants'
        },
        misconceptions: ['Plants eat soil for food'],
        subject: 'Science',
        competencyLevel: 'foundation',
        cognitiveLevel: 'understand',
        learningObjectives: ['Explain photosynthesis process'],
        keyConcepts: ['photosynthesis', 'chlorophyll', 'sunlight']
      };

      const processed = await processor.process(scienceContext);
      
      expect(processed.subject).toBe('Science');
      expect(processed.complexityLevel).toBe('basic');
      expect(processed.estimatedAgeRange).toBe('9-11');
      expect(processed.keyConcepts).toContain('photosynthesis');
      expect(processed.relevantTerms.has('science')).toBe(true);
    });
  });

  describe('Content Validation', () => {
    let validator;
    let mockContext;

    beforeEach(() => {
      mockContext = {
        subject: 'Mathematics',
        complexityLevel: 'intermediate',
        estimatedAgeRange: '10-12',
        relevantTerms: new Set(['mathematics', 'area', 'formula', 'rectangle']),
        keyConcepts: ['area', 'formula'],
        vocabularyMap: {
          'area': 'Space inside a shape',
          'formula': 'Mathematical rule'
        },
        originalContext: {
          keyQuestion: 'How do we calculate area?',
          misconceptions: ['Area and perimeter are the same']
        }
      };
      
      validator = new ContentValidator(mockContext);
    });

    it('should approve relevant mathematics question', async () => {
      const question = 'How do I use the area formula for rectangles?';
      const result = await validator.validateQuestion(question);
      
      expect(result.isValid).toBe(true);
    });

    it('should reject off-topic question', async () => {
      const question = 'What did you have for breakfast?';
      const result = await validator.validateQuestion(question);
      
      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('Question not relevant to concept topic');
      expect(result.redirectMessage).toContain('Mathematics');
    });

    it('should validate appropriate AI response', async () => {
      const response = 'Great question! To calculate the area of a rectangle, you multiply length by width. For example, if a rectangle is 5 cm long and 3 cm wide, the area is 5 × 3 = 15 cm².';
      const result = await validator.validateResponse(response, 'How do I calculate area?');
      
      expect(result.isValid).toBe(true);
      expect(result.topicRelevance).toBeGreaterThan(0.5);
      expect(result.ageAppropriate).toBe(true);
      expect(result.educationalValue).toBe('high');
    });

    it('should flag overly complex response', async () => {
      const complexResponse = 'The computational methodology for determining rectangular spatial parameters involves the implementation of multiplicative algorithms utilizing perpendicular dimensional measurements to derive the requisite areal coefficient.';
      const result = await validator.validateResponse(complexResponse, 'How do I calculate area?');
      
      expect(result.wasFiltered).toBe(true);
      expect(result.filteredContent).toBeDefined();
    });
  });

  describe('Educational Prompt Building', () => {
    let promptBuilder;
    let mockContext;

    beforeEach(() => {
      mockContext = {
        subject: 'Mathematics',
        complexityLevel: 'intermediate',
        estimatedAgeRange: '10-12',
        originalContext: {
          keyQuestion: 'How do we calculate area?',
          conceptOverview: 'Learn area formulas',
          competencyLevel: 'developing',
          cognitiveLevel: 'apply',
          learningObjectives: ['Calculate area'],
          vocabulary: { 'area': 'Space inside shape' },
          misconceptions: ['Area equals perimeter'],
          coreExplanation: 'Area is space inside shapes'
        },
        vocabularyMap: { 'area': 'Space inside shape' },
        keyConcepts: ['area', 'formula']
      };
      
      promptBuilder = new EducationalPromptBuilder(mockContext);
    });

    it('should build age-appropriate educational prompt', () => {
      const question = 'How do I calculate area of a rectangle?';
      const prompt = promptBuilder.buildPrompt(question);
      
      expect(prompt.systemPrompt).toContain('Mathematics');
      expect(prompt.systemPrompt).toContain('10-12 years old');
      expect(prompt.systemPrompt).toContain('warm, encouraging');
      expect(prompt.userPrompt).toContain(question);
      expect(prompt.userPrompt).toContain('area');
      expect(prompt.maxTokens).toBeGreaterThan(0);
    });

    it('should generate contextual follow-up suggestions', () => {
      const question = 'How do I calculate area?';
      const suggestions = promptBuilder.buildFollowUpSuggestions(question);
      
      expect(suggestions).toBeInstanceOf(Array);
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.length).toBeLessThanOrEqual(4);
      expect(suggestions[0]).toContain('?'); // Should be questions
    });
  });

  describe('Response Formatting', () => {
    let formatter;
    let mockContext;

    beforeEach(() => {
      mockContext = {
        subject: 'Mathematics',
        vocabularyMap: { 'area': 'Space inside shape', 'formula': 'Mathematical rule' },
        keyConcepts: ['area', 'formula'],
        originalContext: {
          misconceptions: ['Area equals perimeter']
        }
      };
      
      formatter = new ResponseFormatter(mockContext);
    });

    it('should format mathematical expressions correctly', async () => {
      const response = 'Area = length × width. For example, 5 × 3 = 15 cm².';
      const formatted = await formatter.formatResponse({
        content: response,
        originalQuestion: 'How do I calculate area?',
        includeFollowUps: true,
        includeResources: true
      });
      
      expect(formatted.content).toContain('**Area = length × width**');
      expect(formatted.content).toContain('5 × 3');
      expect(formatted.suggestedFollowUps).toBeInstanceOf(Array);
      expect(formatted.educationalResources).toBeInstanceOf(Array);
    });

    it('should enhance vocabulary terms', async () => {
      const response = 'To calculate area, use the formula for rectangles.';
      const formatted = await formatter.formatResponse({
        content: response,
        originalQuestion: 'What is area?',
        includeFollowUps: false,
        includeResources: false
      });
      
      expect(formatted.content).toContain('**area**');
      expect(formatted.content).toContain('**formula**');
    });
  });

  describe('Cross-Subject Support', () => {
    it('should handle English literature context', async () => {
      const englishContext = {
        keyQuestion: 'How do authors develop characters?',
        conceptOverview: 'Learn about **character development** techniques',
        coreExplanation: 'Authors use various methods to create believable characters',
        vocabulary: {
          'protagonist': 'Main character in a story',
          'characterization': 'How authors reveal character traits'
        },
        misconceptions: ['Characters are always based on real people'],
        subject: 'English',
        competencyLevel: 'consolidating',
        cognitiveLevel: 'analyze',
        learningObjectives: ['Analyze character development'],
        keyConcepts: ['character', 'development', 'protagonist']
      };

      const processor = new ConceptContextProcessor();
      const processed = await processor.process(englishContext);
      
      expect(processed.subject).toBe('English');
      expect(processed.keyConcepts).toContain('character');
      expect(processed.relevantTerms.has('english')).toBe(true);
      expect(processed.relevantTerms.has('protagonist')).toBe(true);
    });

    it('should handle History context', async () => {
      const historyContext = {
        keyQuestion: 'What caused World War I?',
        conceptOverview: 'Examine the **causes** and **consequences** of WWI',
        coreExplanation: 'Multiple factors led to the outbreak of World War I',
        vocabulary: {
          'alliance': 'Agreement between countries',
          'nationalism': 'Pride in one\'s country'
        },
        misconceptions: ['WWI had only one cause'],
        subject: 'History',
        competencyLevel: 'extending',
        cognitiveLevel: 'evaluate',
        learningObjectives: ['Evaluate causes of WWI'],
        keyConcepts: ['alliance', 'nationalism', 'causes']
      };

      const processor = new ConceptContextProcessor();
      const processed = await processor.process(historyContext);
      
      expect(processed.subject).toBe('History');
      expect(processed.complexityLevel).toBe('advanced');
      expect(processed.keyConcepts).toContain('alliance');
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed requests gracefully', () => {
      const malformedRequest = {
        conceptCardId: '',
        question: '',
      };

      const result = validateConceptChatRequest(malformedRequest);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should validate against extremely long questions', () => {
      const longQuestion = 'a'.repeat(1000);
      const request = {
        conceptCardId: 'test',
        question: longQuestion,
        conceptContext: {
          keyQuestion: 'Test',
          conceptOverview: '',
          coreExplanation: '',
          vocabulary: {},
          misconceptions: [],
          subject: 'Test',
          competencyLevel: 'developing',
          cognitiveLevel: 'apply',
          learningObjectives: [],
          keyConcepts: []
        }
      };

      const result = validateConceptChatRequest(request);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Question is too long (max 500 characters)');
    });
  });

  describe('Educational Guardrails', () => {
    let validator;

    beforeEach(() => {
      const context = {
        subject: 'Mathematics',
        complexityLevel: 'basic',
        estimatedAgeRange: '9-11',
        relevantTerms: new Set(['math', 'number']),
        keyConcepts: ['addition'],
        vocabularyMap: { 'addition': 'Adding numbers together' },
        originalContext: { keyQuestion: 'How do we add numbers?' }
      };
      validator = new ContentValidator(context);
    });

    it('should reject homework completion requests', async () => {
      const question = 'Can you do my math homework for me?';
      const result = await validator.validateQuestion(question);
      
      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('inappropriate');
    });

    it('should approve learning-focused questions', async () => {
      const question = 'How do I add two numbers together?';
      const result = await validator.validateQuestion(question);
      
      expect(result.isValid).toBe(true);
    });

    it('should ensure responses maintain warm tone', async () => {
      const coldResponse = 'Addition is a mathematical operation. Use the formula.';
      const result = await validator.validateResponse(coldResponse, 'How do I add?');
      
      expect(result.wasFiltered).toBe(true);
      expect(result.filteredContent).toContain('Great question!');
    });
  });
});

// Export test utilities for integration tests
module.exports = {
  createMockConceptContext: (subject, complexity = 'intermediate') => ({
    subject,
    complexityLevel: complexity,
    estimatedAgeRange: complexity === 'basic' ? '9-11' : '10-14',
    relevantTerms: new Set([subject.toLowerCase(), 'learning']),
    keyConcepts: ['concept1', 'concept2'],
    vocabularyMap: { 'term1': 'definition1' },
    originalContext: {
      keyQuestion: `How do we learn about ${subject}?`,
      misconceptions: ['Common mistake']
    }
  })
};
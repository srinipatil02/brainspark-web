// Types for Enhanced Concept Chat feature
// Matches Cloud Function types at /functions/src/concept-chat/types.ts

export interface ConceptContext {
  keyQuestion: string;
  conceptOverview: string;
  coreExplanation: string;
  vocabulary: Record<string, string>;
  misconceptions: string[];
  subject: string;
  competencyLevel: 'foundation' | 'developing' | 'consolidating' | 'extending' | 'proficient';
  cognitiveLevel: 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create';
  learningObjectives: string[];
  keyConcepts: string[];
}

export interface ConceptChatOptions {
  provider?: 'auto' | 'gemini' | 'deepseek';
  includeExamples?: boolean;
  maxComplexity?: 'auto' | 'basic' | 'intermediate' | 'advanced';
  includeFollowUps?: boolean;
  maxResponseLength?: number; // Number of sentences (1-10)
  socraticMode?: boolean;
}

export interface ContentMetadata {
  topicRelevant: boolean;
  ageAppropriate: boolean;
  educationalValue: 'low' | 'medium' | 'high';
  complexity: 'basic' | 'intermediate' | 'advanced';
  confidenceScore: number;
  wasFiltered: boolean;
}

export interface EducationalResource {
  title: string;
  description: string;
  type: 'widget' | 'concept' | 'example' | 'practice';
  url?: string;
  metadata?: Record<string, unknown>;
}

export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  suggestedFollowUps?: string[];
  metadata?: {
    provider?: string;
    processingTime?: number;
    educationalValue?: string;
    confidenceScore?: number;
  };
  isTyping?: boolean;
}

export interface ConceptChatRequest {
  conceptCardId: string;
  question: string;
  conceptContext: ConceptContext;
  options?: ConceptChatOptions;
}

export interface ConceptChatResponse {
  ok: boolean;
  response?: string;
  provider: string;
  processingTime: number;
  contentMetadata?: ContentMetadata;
  suggestedFollowUps?: string[];
  educationalResources?: EducationalResource[];
  error?: string;
  conversationSessionId?: string;
}

export interface ChatProgress {
  conceptsExplored: string[];
  questionsAsked: number;
  sessionStartTime: number;
}

export interface ChatStreaks {
  currentStreak: number;
  longestStreak: number;
  lastChatDate: string | null;
  totalQuestions: number;
}

// Error message mapping for user-friendly messages
export const CHAT_ERROR_MESSAGES: Record<string, string> = {
  'functions/unauthenticated': 'Please sign in to chat with the AI tutor.',
  'functions/resource-exhausted': 'The tutor is busy. Please try again in a moment.',
  'functions/unavailable': 'Service temporarily unavailable. Please try again.',
  'functions/invalid-argument': 'Invalid request. Please try rephrasing your question.',
  'functions/internal': 'Something went wrong on our end. Please try again.',
  'default': 'Something went wrong. Please try again.',
};

// Quick-start questions by topic
export const QUICK_START_QUESTIONS: Record<string, string[]> = {
  cells: [
    'What are the main parts of a cell?',
    'How do cells get energy?',
    'What is the difference between plant and animal cells?',
    'Why are cells called the building blocks of life?',
  ],
  'body-systems': [
    'How does the digestive system break down food?',
    'What role does the heart play in the circulatory system?',
    'How do our lungs exchange gases?',
    'Why is the nervous system important?',
  ],
  default: [
    'Can you explain this concept in simple terms?',
    'What are the key things I should remember?',
    'Can you give me a real-world example?',
    'What mistakes do students commonly make?',
  ],
};

// Affirmation messages for AI responses
export const MICRO_AFFIRMATIONS = [
  'Great question!',
  "You're thinking like a scientist!",
  'Excellent observation!',
  'That shows real curiosity!',
  "I love how you're exploring this!",
  'Good thinking!',
];

// Curiosity hooks for AI responses
export const CURIOSITY_HOOKS = {
  surprise: [
    'Did you know?',
    "Here's something fascinating:",
    'This might surprise you:',
    'An interesting fact:',
  ],
  question: [
    'Ever wondered why...?',
    'What if you could...?',
    'Can you imagine...?',
    'Have you considered...?',
  ],
  connection: [
    'In the real world...',
    'This connects to...',
    "Here's how this works in practice...",
    "You've probably seen this before...",
  ],
};

import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import {
  ConceptContext,
  ConceptChatOptions,
  ConceptChatRequest,
  ConceptChatResponse,
  ChatMessage,
  ChatProgress,
  ChatStreaks,
  CHAT_ERROR_MESSAGES,
} from '@/lib/chatTypes';

// ============ Storage Keys ============
const STREAKS_STORAGE_KEY = 'brainspark-chat-streaks';
const PROGRESS_STORAGE_KEY = 'brainspark-chat-progress';
const SESSION_STORAGE_KEY = 'brainspark-chat-session';

// ============ Cloud Function Call ============

/**
 * Send a message to the concept chat Cloud Function
 */
export async function sendConceptChatMessage(
  conceptCardId: string,
  question: string,
  conceptContext: ConceptContext,
  options?: ConceptChatOptions
): Promise<ConceptChatResponse> {
  try {
    const conceptChat = httpsCallable<ConceptChatRequest, ConceptChatResponse>(
      functions,
      'conceptChat'
    );

    const request: ConceptChatRequest = {
      conceptCardId,
      question,
      conceptContext,
      options: {
        includeFollowUps: true,
        maxResponseLength: 500,
        ...options,
      },
    };

    const result = await conceptChat(request);

    // Update streaks on successful response
    if (result.data.ok) {
      updateStreaks();
      trackConceptExplored(conceptCardId);
    }

    return result.data;
  } catch (error: unknown) {
    console.error('Error calling concept chat:', error);
    return handleChatError(error);
  }
}

/**
 * Handle errors from the Cloud Function and return user-friendly messages
 */
function handleChatError(error: unknown): ConceptChatResponse {
  let errorCode = 'default';

  if (error && typeof error === 'object' && 'code' in error) {
    const firebaseError = error as { code: string; message: string };
    errorCode = firebaseError.code;
  }

  const userMessage = CHAT_ERROR_MESSAGES[errorCode] || CHAT_ERROR_MESSAGES['default'];

  return {
    ok: false,
    error: userMessage,
    provider: 'error',
    processingTime: 0,
  };
}

// ============ Follow-up Question Extraction ============

/**
 * Extract follow-up questions from AI response
 * The backend may return them in various formats:
 * - Delimited: [FOLLOW_UP]question[/FOLLOW_UP]
 * - Numbered: "1. Question?" at the end
 * - Array in suggestedFollowUps field
 */
export function extractFollowUpQuestions(response: string, providedFollowUps?: string[]): string[] {
  // If follow-ups are provided directly, use them
  if (providedFollowUps && providedFollowUps.length > 0) {
    return providedFollowUps;
  }

  const followUps: string[] = [];

  // Pattern 1: Delimited format [FOLLOW_UP]...[/FOLLOW_UP]
  const delimitedPattern = /\[FOLLOW_UP\](.*?)\[\/FOLLOW_UP\]/g;
  let match;
  while ((match = delimitedPattern.exec(response)) !== null) {
    const question = match[1].trim();
    if (question) followUps.push(question);
  }

  if (followUps.length > 0) return followUps;

  // Pattern 2: "Follow-up questions:" section
  const followUpSection = response.match(/(?:follow[- ]?up questions?|want to explore|might wonder):?\s*\n?([\s\S]*?)(?:\n\n|$)/i);
  if (followUpSection) {
    const lines = followUpSection[1].split('\n');
    for (const line of lines) {
      // Match numbered or bulleted questions
      const questionMatch = line.match(/^[\d\-•*]\s*[.):]?\s*(.+\?)/);
      if (questionMatch) {
        followUps.push(questionMatch[1].trim());
      }
    }
  }

  // Limit to 3 follow-up questions
  return followUps.slice(0, 3);
}

/**
 * Remove follow-up question markers from the main response
 */
export function cleanResponseContent(response: string): string {
  // Remove delimited follow-ups
  let cleaned = response.replace(/\[FOLLOW_UP\].*?\[\/FOLLOW_UP\]/g, '');

  // Remove "Follow-up questions:" section if it exists
  cleaned = cleaned.replace(/(?:follow[- ]?up questions?|you might want to explore|you might wonder):?\s*\n?(?:[\d\-•*]\s*[.):]?\s*.+\?\s*\n?)+/gi, '');

  // Clean up extra whitespace
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n').trim();

  return cleaned;
}

// ============ Streaks Tracking (localStorage) ============

/**
 * Get current learning streaks
 */
export function getStreaks(): ChatStreaks {
  if (typeof window === 'undefined') {
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastChatDate: null,
      totalQuestions: 0,
    };
  }

  try {
    const stored = localStorage.getItem(STREAKS_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to read streaks:', e);
  }

  return {
    currentStreak: 0,
    longestStreak: 0,
    lastChatDate: null,
    totalQuestions: 0,
  };
}

/**
 * Update streaks when user asks a question
 */
export function updateStreaks(): ChatStreaks {
  const streaks = getStreaks();
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  if (streaks.lastChatDate === today) {
    // Same day, just increment questions
    streaks.totalQuestions += 1;
  } else if (streaks.lastChatDate) {
    // Check if consecutive day
    const lastDate = new Date(streaks.lastChatDate);
    const todayDate = new Date(today);
    const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      // Consecutive day - extend streak
      streaks.currentStreak += 1;
      streaks.longestStreak = Math.max(streaks.longestStreak, streaks.currentStreak);
    } else if (diffDays > 1) {
      // Streak broken
      streaks.currentStreak = 1;
    }

    streaks.totalQuestions += 1;
    streaks.lastChatDate = today;
  } else {
    // First time chatting
    streaks.currentStreak = 1;
    streaks.longestStreak = 1;
    streaks.totalQuestions = 1;
    streaks.lastChatDate = today;
  }

  try {
    localStorage.setItem(STREAKS_STORAGE_KEY, JSON.stringify(streaks));
  } catch (e) {
    console.error('Failed to save streaks:', e);
  }

  return streaks;
}

// ============ Session Progress Tracking (sessionStorage) ============

/**
 * Get chat progress for current session
 */
export function getChatProgress(): ChatProgress {
  if (typeof window === 'undefined') {
    return {
      conceptsExplored: [],
      questionsAsked: 0,
      sessionStartTime: Date.now(),
    };
  }

  try {
    const stored = sessionStorage.getItem(PROGRESS_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to read chat progress:', e);
  }

  return {
    conceptsExplored: [],
    questionsAsked: 0,
    sessionStartTime: Date.now(),
  };
}

/**
 * Track when a concept is explored
 */
export function trackConceptExplored(conceptId: string): ChatProgress {
  const progress = getChatProgress();

  if (!progress.conceptsExplored.includes(conceptId)) {
    progress.conceptsExplored.push(conceptId);
  }
  progress.questionsAsked += 1;

  try {
    sessionStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress));
  } catch (e) {
    console.error('Failed to save chat progress:', e);
  }

  return progress;
}

/**
 * Reset session progress (e.g., when starting new topic)
 */
export function resetChatProgress(): void {
  try {
    sessionStorage.removeItem(PROGRESS_STORAGE_KEY);
  } catch (e) {
    console.error('Failed to reset chat progress:', e);
  }
}

// ============ Conversation Session Management ============

interface ConversationSession {
  sessionId: string | null;
  conceptCardId: string;
  startTime: number;
  messageCount: number;
}

/**
 * Get or create conversation session for a concept
 */
export function getConversationSession(conceptCardId: string): ConversationSession {
  if (typeof window === 'undefined') {
    return {
      sessionId: null,
      conceptCardId,
      startTime: Date.now(),
      messageCount: 0,
    };
  }

  try {
    const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (stored) {
      const session: ConversationSession = JSON.parse(stored);

      // Check if same concept and session not expired (30 minutes)
      const sessionAge = Date.now() - session.startTime;
      const thirtyMinutes = 30 * 60 * 1000;

      if (session.conceptCardId === conceptCardId && sessionAge < thirtyMinutes) {
        return session;
      }
    }
  } catch (e) {
    console.error('Failed to read session:', e);
  }

  // Create new session
  const newSession: ConversationSession = {
    sessionId: null,
    conceptCardId,
    startTime: Date.now(),
    messageCount: 0,
  };

  return newSession;
}

/**
 * Update conversation session with new session ID from backend
 */
export function updateConversationSession(
  conceptCardId: string,
  sessionId: string
): void {
  const session = getConversationSession(conceptCardId);
  session.sessionId = sessionId;
  session.messageCount += 1;

  try {
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  } catch (e) {
    console.error('Failed to save session:', e);
  }
}

/**
 * Clear conversation session (start fresh)
 */
export function clearConversationSession(): void {
  try {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  } catch (e) {
    console.error('Failed to clear session:', e);
  }
}

// ============ Message Helpers ============

/**
 * Create a user message object
 */
export function createUserMessage(content: string): ChatMessage {
  return {
    id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    content,
    role: 'user',
    timestamp: new Date(),
  };
}

/**
 * Create an assistant message object from API response
 */
export function createAssistantMessage(
  response: ConceptChatResponse
): ChatMessage {
  const cleanedContent = response.response
    ? cleanResponseContent(response.response)
    : response.error || 'Sorry, I could not generate a response.';

  return {
    id: `assistant-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    content: cleanedContent,
    role: 'assistant',
    timestamp: new Date(),
    suggestedFollowUps: response.response
      ? extractFollowUpQuestions(response.response, response.suggestedFollowUps)
      : undefined,
    metadata: {
      provider: response.provider,
      processingTime: response.processingTime,
      educationalValue: response.contentMetadata?.educationalValue,
      confidenceScore: response.contentMetadata?.confidenceScore,
    },
  };
}

/**
 * Create a typing indicator message
 */
export function createTypingMessage(): ChatMessage {
  return {
    id: 'typing-indicator',
    content: '',
    role: 'assistant',
    timestamp: new Date(),
    isTyping: true,
  };
}

// ============ Behavioral Science Helpers ============

/**
 * Get a random micro-affirmation
 */
export function getRandomAffirmation(): string {
  const affirmations = [
    'Great question!',
    "You're thinking like a scientist!",
    'Excellent observation!',
    'That shows real curiosity!',
    "I love how you're exploring this!",
    'Good thinking!',
  ];
  return affirmations[Math.floor(Math.random() * affirmations.length)];
}

/**
 * Get a curiosity hook for starting a response
 */
export function getCuriosityHook(type: 'surprise' | 'question' | 'connection'): string {
  const hooks = {
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
  const typeHooks = hooks[type];
  return typeHooks[Math.floor(Math.random() * typeHooks.length)];
}

/**
 * Determine if we should prompt for "Explain Back" challenge
 * (after 3-4 messages on same concept)
 */
export function shouldPromptExplainBack(messageCount: number): boolean {
  return messageCount > 0 && messageCount % 4 === 0;
}

/**
 * Get an "Explain Back" prompt
 */
export function getExplainBackPrompt(): string {
  const prompts = [
    "Now, can you explain this concept back to me in your own words? It's a great way to check your understanding!",
    "Try explaining what you've learned to me like I'm a friend who doesn't know this topic. What would you say?",
    "Before we continue, can you summarize the key points we've covered? Teaching others helps you remember!",
    "Quick check: If someone asked you about this, how would you explain it simply?",
  ];
  return prompts[Math.floor(Math.random() * prompts.length)];
}

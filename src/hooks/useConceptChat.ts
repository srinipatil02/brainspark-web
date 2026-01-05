'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from './useAuth';
import {
  ConceptContext,
  ConceptChatOptions,
  ChatMessage,
  ChatProgress,
  ChatStreaks,
} from '@/lib/chatTypes';
import {
  sendConceptChatMessage,
  createUserMessage,
  createAssistantMessage,
  createTypingMessage,
  getStreaks,
  getChatProgress,
  getConversationSession,
  updateConversationSession,
  clearConversationSession,
  shouldPromptExplainBack,
  getExplainBackPrompt,
} from '@/services/conceptChatService';

export interface UseConceptChatOptions {
  conceptCardId: string;
  conceptContext: ConceptContext;
  initialSocraticMode?: boolean;
  onMessageSent?: (message: ChatMessage) => void;
  onResponseReceived?: (message: ChatMessage) => void;
  onError?: (error: string) => void;
}

export interface UseConceptChatReturn {
  // State
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  socraticMode: boolean;
  isOpen: boolean;
  sessionId: string | null;
  progress: ChatProgress;
  streaks: ChatStreaks;

  // Actions
  sendMessage: (content: string) => Promise<void>;
  sendFollowUp: (question: string) => Promise<void>;
  clearSession: () => void;
  toggleSocraticMode: () => void;
  openChat: () => void;
  closeChat: () => void;
  dismissError: () => void;

  // Helpers
  isAuthenticated: boolean;
  messageCount: number;
  hasMessages: boolean;
}

export function useConceptChat({
  conceptCardId,
  conceptContext,
  initialSocraticMode = false,
  onMessageSent,
  onResponseReceived,
  onError,
}: UseConceptChatOptions): UseConceptChatReturn {
  const { user, loading: authLoading } = useAuth();

  // Core state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [socraticMode, setSocraticMode] = useState(initialSocraticMode);
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Progress tracking
  const [progress, setProgress] = useState<ChatProgress>(getChatProgress());
  const [streaks, setStreaks] = useState<ChatStreaks>(getStreaks());

  // Track message count for explain-back prompts
  const messageCountRef = useRef(0);

  // Load session on mount
  useEffect(() => {
    const session = getConversationSession(conceptCardId);
    if (session.sessionId) {
      setSessionId(session.sessionId);
      messageCountRef.current = session.messageCount;
    }
  }, [conceptCardId]);

  // Update progress and streaks when they change
  useEffect(() => {
    setProgress(getChatProgress());
    setStreaks(getStreaks());
  }, [messages]);

  // Send a message to the AI
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    // Clear any previous error
    setError(null);

    // Create and add user message
    const userMessage = createUserMessage(content);
    setMessages(prev => [...prev, userMessage]);
    onMessageSent?.(userMessage);

    // Show typing indicator
    setIsLoading(true);
    setMessages(prev => [...prev, createTypingMessage()]);

    try {
      // Build options with current settings
      const options: ConceptChatOptions = {
        socraticMode,
        includeFollowUps: true,
        maxComplexity: 'auto',
      };

      // Call the Cloud Function
      const response = await sendConceptChatMessage(
        conceptCardId,
        content,
        conceptContext,
        options
      );

      // Remove typing indicator
      setMessages(prev => prev.filter(m => !m.isTyping));

      if (response.ok && response.response) {
        // Create assistant message
        const assistantMessage = createAssistantMessage(response);
        setMessages(prev => [...prev, assistantMessage]);
        onResponseReceived?.(assistantMessage);

        // Update session ID if provided
        if (response.conversationSessionId) {
          setSessionId(response.conversationSessionId);
          updateConversationSession(conceptCardId, response.conversationSessionId);
        }

        // Track message count for explain-back
        messageCountRef.current += 1;

        // Check if we should prompt for explain-back
        if (shouldPromptExplainBack(messageCountRef.current)) {
          // Add explain-back prompt after a short delay
          setTimeout(() => {
            const explainBackMessage: ChatMessage = {
              id: `explain-back-${Date.now()}`,
              content: getExplainBackPrompt(),
              role: 'assistant',
              timestamp: new Date(),
              metadata: {
                provider: 'system',
              },
            };
            setMessages(prev => [...prev, explainBackMessage]);
          }, 1500);
        }

        // Refresh streaks
        setStreaks(getStreaks());
        setProgress(getChatProgress());
      } else {
        // Handle error response
        const errorMsg = response.error || 'Failed to get response. Please try again.';
        setError(errorMsg);
        onError?.(errorMsg);

        // Add error as assistant message for visibility
        const errorMessage: ChatMessage = {
          id: `error-${Date.now()}`,
          content: errorMsg,
          role: 'assistant',
          timestamp: new Date(),
          metadata: {
            provider: 'error',
          },
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (err) {
      // Remove typing indicator
      setMessages(prev => prev.filter(m => !m.isTyping));

      const errorMsg = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [conceptCardId, conceptContext, socraticMode, isLoading, onMessageSent, onResponseReceived, onError]);

  // Send a follow-up question (same as sendMessage but explicit)
  const sendFollowUp = useCallback(async (question: string) => {
    await sendMessage(question);
  }, [sendMessage]);

  // Clear the conversation and start fresh
  const clearSession = useCallback(() => {
    setMessages([]);
    setSessionId(null);
    setError(null);
    messageCountRef.current = 0;
    clearConversationSession();
  }, []);

  // Toggle Socratic mode
  const toggleSocraticMode = useCallback(() => {
    setSocraticMode(prev => !prev);
  }, []);

  // Open/close chat modal
  const openChat = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeChat = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Dismiss error
  const dismissError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    messages,
    isLoading,
    error,
    socraticMode,
    isOpen,
    sessionId,
    progress,
    streaks,

    // Actions
    sendMessage,
    sendFollowUp,
    clearSession,
    toggleSocraticMode,
    openChat,
    closeChat,
    dismissError,

    // Helpers
    isAuthenticated: !authLoading && !!user,
    messageCount: messages.filter(m => m.role === 'user').length,
    hasMessages: messages.length > 0,
  };
}

// ============ Additional Hooks for Specific Features ============

/**
 * Hook for tracking learning streaks
 */
export function useLearningStreaks() {
  const [streaks, setStreaks] = useState<ChatStreaks>(getStreaks());

  useEffect(() => {
    // Check streaks on mount
    setStreaks(getStreaks());
  }, []);

  const refresh = useCallback(() => {
    setStreaks(getStreaks());
  }, []);

  return {
    ...streaks,
    refresh,
    hasStreak: streaks.currentStreak > 0,
    isOnFire: streaks.currentStreak >= 3,
    isNewRecord: streaks.currentStreak === streaks.longestStreak && streaks.longestStreak > 1,
  };
}

/**
 * Hook for chat progress in current session
 */
export function useChatProgress() {
  const [progress, setProgress] = useState<ChatProgress>(getChatProgress());

  useEffect(() => {
    setProgress(getChatProgress());
  }, []);

  const refresh = useCallback(() => {
    setProgress(getChatProgress());
  }, []);

  return {
    ...progress,
    refresh,
    conceptCount: progress.conceptsExplored.length,
    sessionDuration: Math.floor((Date.now() - progress.sessionStartTime) / 1000 / 60), // minutes
  };
}

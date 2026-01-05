'use client';

import React from 'react';
import { ConceptContext } from '@/lib/chatTypes';
import { useConceptChat } from '@/hooks/useConceptChat';
import { ConceptChatButton } from './ConceptChatButton';
import { ConceptChatModal } from './ConceptChatModal';

interface ConceptChatWidgetProps {
  conceptCardId: string;
  conceptContext: ConceptContext;
  topicTitle: string;
  topicKey?: string; // Used to get topic-specific quick questions
  initialSocraticMode?: boolean;
}

/**
 * Main chat widget component
 * Combines floating button and modal
 * Drop-in component for any page with concept content
 */
export function ConceptChatWidget({
  conceptCardId,
  conceptContext,
  topicTitle,
  topicKey,
  initialSocraticMode = false,
}: ConceptChatWidgetProps) {
  const {
    // State
    messages,
    isLoading,
    error,
    socraticMode,
    isOpen,
    progress,
    streaks,

    // Actions
    sendMessage,
    sendFollowUp,
    clearSession,
    toggleSocraticMode,
    openChat,
    closeChat,

    // Helpers
    hasMessages,
  } = useConceptChat({
    conceptCardId,
    conceptContext,
    initialSocraticMode,
  });

  return (
    <>
      {/* Floating button (hidden when modal is open) */}
      {!isOpen && (
        <ConceptChatButton
          onClick={openChat}
          hasMessages={hasMessages}
          isLoading={isLoading}
        />
      )}

      {/* Chat modal */}
      <ConceptChatModal
        isOpen={isOpen}
        onClose={closeChat}
        topicTitle={topicTitle}
        topicKey={topicKey}
        messages={messages}
        isLoading={isLoading}
        error={error}
        socraticMode={socraticMode}
        onToggleSocraticMode={toggleSocraticMode}
        onSendMessage={sendMessage}
        onFollowUpClick={sendFollowUp}
        onClearSession={clearSession}
        conceptsExplored={progress.conceptsExplored.length}
        questionsAsked={progress.questionsAsked}
        currentStreak={streaks.currentStreak}
      />
    </>
  );
}

// Re-export individual components for custom implementations
export { ConceptChatButton } from './ConceptChatButton';
export { ConceptChatModal } from './ConceptChatModal';
export { ChatMessage } from './ChatMessage';
export { ChatInput } from './ChatInput';
export { ChatWelcome } from './ChatWelcome';
export { SocraticToggle } from './SocraticToggle';
export { ProgressVisualization } from './ProgressVisualization';

/**
 * Conversation Memory System for AI Tutor
 * Maintains chat context similar to LangChain's ConversationBufferMemory
 * Stores conversation history per student session with automatic cleanup
 */

export interface ChatMessage {
  role: 'human' | 'assistant';
  content: string;
  timestamp: number;
  conceptCardId?: string;
  messageId?: string;
}

export interface ConversationSession {
  sessionId: string;
  userId: string;
  conceptCardId: string;
  messages: ChatMessage[];
  startedAt: number;
  lastActiveAt: number;
  isActive: boolean;
  metadata: {
    subject: string;
    competencyLevel: string;
    cognitiveLevel: string;
    totalMessages: number;
  };
}

export interface ConversationMemoryOptions {
  maxMessages?: number;           // Max messages to keep in context (default: 10)
  maxTokens?: number;            // Max tokens for context window (default: 2000)  
  sessionTimeoutMinutes?: number; // Auto-clear after inactivity (default: 30)
  summarizeAfter?: number;       // Summarize old messages after N messages (default: 20)
}

/**
 * LangChain-style conversation memory for educational AI chat
 * Features:
 * - Per-user session management
 * - Automatic context window management
 * - Message summarization for long conversations
 * - Session timeout and cleanup
 * - Firebase Firestore persistence
 */
export class ConversationMemory {
  private options: Required<ConversationMemoryOptions>;
  
  constructor(options: ConversationMemoryOptions = {}) {
    this.options = {
      maxMessages: options.maxMessages || 10,
      maxTokens: options.maxTokens || 2000,
      sessionTimeoutMinutes: options.sessionTimeoutMinutes || 30,
      summarizeAfter: options.summarizeAfter || 20,
    };
  }

  /**
   * Get or create conversation session for user + concept card
   */
  async getOrCreateSession(
    userId: string,
    conceptCardId: string,
    metadata: ConversationSession['metadata']
  ): Promise<ConversationSession> {
    console.log('🧠 Getting conversation session:', {
      userId: userId.substring(0, 8) + '...',
      conceptCardId,
      subject: metadata.subject,
    });

    const sessionId = this.generateSessionId(userId, conceptCardId);
    
    // Try to get existing active session
    let session = await this.loadSession(sessionId);
    
    if (session && this.isSessionActive(session)) {
      console.log('📝 Found active session with', session.messages.length, 'messages');
      return session;
    }

    // Create new session
    session = {
      sessionId,
      userId,
      conceptCardId,
      messages: [],
      startedAt: Date.now(),
      lastActiveAt: Date.now(),
      isActive: true,
      metadata: {
        ...metadata,
        totalMessages: 0,
      },
    };

    await this.saveSession(session);
    console.log('✨ Created new conversation session');
    return session;
  }

  /**
   * Add message to conversation history
   */
  async addMessage(
    sessionId: string,
    role: 'human' | 'assistant',
    content: string,
    conceptCardId?: string
  ): Promise<ConversationSession> {
    const session = await this.loadSession(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    const message: ChatMessage = {
      role,
      content,
      timestamp: Date.now(),
      conceptCardId,
      messageId: this.generateMessageId(),
    };

    session.messages.push(message);
    session.lastActiveAt = Date.now();
    session.metadata.totalMessages = session.messages.length;

    // Manage context window
    await this.manageContextWindow(session);

    await this.saveSession(session);
    
    console.log('💬 Added message to session:', {
      role,
      contentLength: content.length,
      totalMessages: session.messages.length,
    });

    return session;
  }

  /**
   * Get conversation context for AI prompt
   * Returns recent messages formatted for AI consumption
   */
  getConversationContext(session: ConversationSession): string {
    if (session.messages.length === 0) {
      return '';
    }

    // Get recent messages within token limit
    const contextMessages = this.getRelevantMessages(session);
    
    if (contextMessages.length === 0) {
      return '';
    }

    // Format conversation history for AI
    const contextParts = [
      '## Previous Conversation Context',
      `This is a continuing conversation about ${session.metadata.subject} (${session.conceptCardId}).`,
      'Here are the recent exchanges:\n',
    ];

    contextMessages.forEach((msg, index) => {
      const speaker = msg.role === 'human' ? 'Student' : 'You (AI Tutor)';
      const timeAgo = this.getTimeAgo(msg.timestamp);
      
      contextParts.push(`**${speaker}** (${timeAgo}):`);
      contextParts.push(msg.content);
      contextParts.push(''); // Empty line between messages
    });

    contextParts.push('---');
    contextParts.push('Please continue the conversation naturally, referencing previous context when relevant.\n');

    return contextParts.join('\n');
  }

  /**
   * Clear session (when chat window closed)
   */
  async clearSession(sessionId: string): Promise<void> {
    const session = await this.loadSession(sessionId);
    if (session) {
      session.isActive = false;
      session.lastActiveAt = Date.now();
      await this.saveSession(session);
      console.log('🧹 Session marked as inactive:', sessionId);
    }
  }

  /**
   * Get conversation summary for analytics
   */
  getSessionSummary(session: ConversationSession): {
    duration: number;
    messageCount: number;
    lastActivity: string;
    topics: string[];
  } {
    const duration = session.lastActiveAt - session.startedAt;
    const topics = [...new Set(
      session.messages
        .filter(m => m.conceptCardId)
        .map(m => m.conceptCardId!)
    )];

    return {
      duration,
      messageCount: session.messages.length,
      lastActivity: this.getTimeAgo(session.lastActiveAt),
      topics,
    };
  }

  // Private helper methods

  private generateSessionId(userId: string, conceptCardId: string): string {
    // Create deterministic session ID so same user + concept = same session
    return `session_${userId}_${conceptCardId}_${new Date().toDateString().replace(/\s/g, '')}`;
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private isSessionActive(session: ConversationSession): boolean {
    if (!session.isActive) return false;
    
    const timeoutMs = this.options.sessionTimeoutMinutes * 60 * 1000;
    const isWithinTimeout = (Date.now() - session.lastActiveAt) < timeoutMs;
    
    return isWithinTimeout;
  }

  private async manageContextWindow(session: ConversationSession): Promise<void> {
    // If too many messages, summarize older ones
    if (session.messages.length > this.options.summarizeAfter) {
      await this.summarizeOldMessages(session);
    }

    // Keep only recent messages within limits
    if (session.messages.length > this.options.maxMessages) {
      const keepCount = Math.floor(this.options.maxMessages * 0.8); // Keep 80% of limit
      session.messages = session.messages.slice(-keepCount);
      console.log('✂️ Trimmed conversation to', keepCount, 'recent messages');
    }
  }

  private async summarizeOldMessages(session: ConversationSession): Promise<void> {
    // TODO: In future, use AI to summarize old messages
    // For now, just keep a note about previous discussion
    if (session.messages.length > this.options.summarizeAfter) {
      const oldCount = session.messages.length - this.options.maxMessages;
      const summaryMessage: ChatMessage = {
        role: 'assistant',
        content: `[Previous discussion: ${oldCount} earlier messages about ${session.metadata.subject}]`,
        timestamp: session.messages[0].timestamp,
        messageId: 'summary_' + Date.now(),
      };
      
      // Keep recent messages + summary
      session.messages = [
        summaryMessage,
        ...session.messages.slice(-this.options.maxMessages)
      ];
    }
  }

  private getRelevantMessages(session: ConversationSession): ChatMessage[] {
    // Return messages within token budget
    let totalTokens = 0;
    const messages: ChatMessage[] = [];
    
    // Go backwards from most recent
    for (let i = session.messages.length - 1; i >= 0; i--) {
      const message = session.messages[i];
      const messageTokens = this.estimateTokens(message.content);
      
      if (totalTokens + messageTokens > this.options.maxTokens) {
        break;
      }
      
      messages.unshift(message);
      totalTokens += messageTokens;
    }
    
    return messages;
  }

  private estimateTokens(text: string): number {
    // Rough token estimation: ~4 characters per token
    return Math.ceil(text.length / 4);
  }

  private getTimeAgo(timestamp: number): string {
    const minutes = Math.floor((Date.now() - timestamp) / (1000 * 60));
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  // Firebase persistence methods
  
  private async loadSession(sessionId: string): Promise<ConversationSession | null> {
    try {
      console.log('📖 Loading session from Firestore:', sessionId);
      
      const { getFirestore } = await import('firebase-admin/firestore');
      const db = getFirestore();
      
      const sessionDoc = await db
        .collection('conversationSessions')
        .doc(sessionId)
        .get();

      if (!sessionDoc.exists) {
        console.log('📭 No existing session found');
        return null;
      }

      const data = sessionDoc.data() as ConversationSession;
      console.log('📖 Loaded session with', data.messages?.length || 0, 'messages');
      return data;
      
    } catch (error) {
      console.error('❌ Error loading session:', error);
      return null;
    }
  }

  private async saveSession(session: ConversationSession): Promise<void> {
    try {
      console.log('💾 Saving session to Firestore:', {
        sessionId: session.sessionId,
        messageCount: session.messages.length,
        isActive: session.isActive,
      });

      const { getFirestore } = await import('firebase-admin/firestore');
      const db = getFirestore();
      
      await db
        .collection('conversationSessions')
        .doc(session.sessionId)
        .set(session, { merge: true });
        
      console.log('✅ Session saved successfully');
      
    } catch (error) {
      console.error('❌ Error saving session:', error);
      throw error;
    }
  }

  /**
   * Cleanup inactive sessions (run periodically)
   */
  async cleanupInactiveSessions(): Promise<void> {
    try {
      console.log('🧹 Starting cleanup of inactive conversation sessions');
      
      const { getFirestore } = await import('firebase-admin/firestore');
      const db = getFirestore();
      
      const cutoffTime = Date.now() - (this.options.sessionTimeoutMinutes * 60 * 1000 * 2); // 2x timeout
      
      const inactiveSessions = await db
        .collection('conversationSessions')
        .where('lastActiveAt', '<', cutoffTime)
        .where('isActive', '==', true)
        .limit(100) // Process in batches
        .get();

      if (inactiveSessions.empty) {
        console.log('✨ No inactive sessions to cleanup');
        return;
      }

      const batch = db.batch();
      let cleanupCount = 0;

      inactiveSessions.forEach((doc) => {
        batch.update(doc.ref, {
          isActive: false,
          lastActiveAt: Date.now(),
        });
        cleanupCount++;
      });

      await batch.commit();
      console.log(`🧹 Cleaned up ${cleanupCount} inactive sessions`);
      
    } catch (error) {
      console.error('❌ Error during session cleanup:', error);
    }
  }

  /**
   * Get user's conversation history for analytics
   */
  async getUserConversationHistory(userId: string, limit: number = 10): Promise<ConversationSession[]> {
    try {
      const { getFirestore } = await import('firebase-admin/firestore');
      const db = getFirestore();
      
      const sessions = await db
        .collection('conversationSessions')
        .where('userId', '==', userId)
        .orderBy('lastActiveAt', 'desc')
        .limit(limit)
        .get();

      return sessions.docs.map(doc => doc.data() as ConversationSession);
      
    } catch (error) {
      console.error('❌ Error getting user conversation history:', error);
      return [];
    }
  }
}

/**
 * Global conversation memory instance
 */
export const conversationMemory = new ConversationMemory({
  maxMessages: 10,        // Keep last 10 messages in context
  maxTokens: 1500,        // Stay within AI context limits  
  sessionTimeoutMinutes: 30,  // Clear after 30min inactivity
  summarizeAfter: 15,     // Summarize after 15 messages
});
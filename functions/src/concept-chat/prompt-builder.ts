// Educational prompt builder for AI concept chat
// Creates contextual prompts for any subject/topic with proper educational framing

import { ProcessedContext, EducationalPrompt, ConceptChatOptions } from './types';

/**
 * Builds educational prompts for AI responses
 * Adapts to any subject/topic while maintaining pedagogical best practices
 */
export class EducationalPromptBuilder {
  private context: ProcessedContext;
  
  constructor(context: ProcessedContext) {
    this.context = context;
  }

  /**
   * Build comprehensive educational prompt for AI interaction
   * Now supports conversation history for multi-turn conversations
   */
  buildPrompt(question: string, options?: ConceptChatOptions, conversationContext?: string): EducationalPrompt {
    const maxComplexity = this.resolveComplexity(options?.maxComplexity || 'auto');
    const includeExamples = options?.includeExamples !== false;
    const maxResponseLength = options?.maxResponseLength || 5;
    
    const socraticMode = options?.socraticMode || false;

    console.log('📝 Building educational prompt:', {
      subject: this.context.subject,
      complexity: maxComplexity,
      ageRange: this.context.estimatedAgeRange,
      includeExamples,
      maxResponseLength,
      hasConversationContext: !!conversationContext,
      socraticMode,
    });

    const systemPrompt = this.buildSystemPrompt(maxComplexity, maxResponseLength, includeExamples, socraticMode);
    const userPrompt = this.buildUserPrompt(question, includeExamples, conversationContext);
    const maxTokens = this.calculateMaxTokens(maxResponseLength, includeExamples, !!conversationContext);

    return {
      systemPrompt,
      userPrompt,
      maxTokens,
      includesExamples: includeExamples,
      maxComplexity,
    };
  }

  /**
   * Build system prompt with educational guidelines
   */
  private buildSystemPrompt(
    complexity: string,
    maxSentences: number,
    includeExamples: boolean,
    socraticMode: boolean = false
  ): string {
    const ageRange = this.context.estimatedAgeRange;
    const subject = this.context.subject;
    const competencyLevel = this.context.originalContext.competencyLevel;
    const cognitiveLevel = this.context.originalContext.cognitiveLevel;

    let systemPrompt = `You are a warm, encouraging AI tutor specializing in ${subject} education for students aged ${ageRange}.

EDUCATIONAL CONTEXT:
- Subject: ${subject}
- Competency Level: ${competencyLevel}
- Cognitive Level: ${cognitiveLevel}
- Complexity: ${complexity}
- Target Age: ${ageRange} years old

CORE LEARNING FOCUS:
${this.buildLearningFocus()}

KEY VOCABULARY TO REINFORCE:
${this.buildVocabularyContext()}

STUDENT UNDERSTANDING LEVEL:
${this.buildUnderstandingLevel()}

RESPONSE GUIDELINES:
1. TONE: Be warm, encouraging, and enthusiastic about learning
2. LENGTH: Respond in exactly ${maxSentences} sentences or fewer
3. LANGUAGE: Use age-appropriate vocabulary for ${ageRange}-year-olds
4. COMPLEXITY: Match ${complexity} level complexity
5. FOCUS: Stay strictly within the ${subject} topic area
6. EDUCATIONAL VALUE: Always explain WHY concepts work, not just HOW
7. CONTENT STRUCTURE: Organize information clearly using:
   - Bullet points for lists and key concepts
   - Tables when comparing multiple items
   - Clear headers (##, ###) for sections
   - Short paragraphs (max 2-3 sentences each)
   - Numbered steps for procedures
   - Bold formatting for important terms`;

    if (includeExamples) {
      systemPrompt += `
8. EXAMPLES: Include practical, relatable examples when helpful`;
    }

    // ============ BEHAVIORAL SCIENCE ENHANCEMENTS ============

    // Socratic Mode - when enabled, guide with questions instead of direct answers
    if (socraticMode) {
      systemPrompt += `

SOCRATIC MODE (ACTIVE):
You are using the Socratic method to guide learning through questions.
- Ask clarifying questions before giving direct answers
- Break down complex problems into smaller questions
- Use phrases like "What do you think would happen if...?" or "Why do you think that is?"
- When student gives an answer, ask "Can you explain your reasoning?"
- Celebrate student insights: "That's a great observation! What led you to that?"
- Guide them to discover answers rather than stating them directly
- If they're stuck, provide hints as questions: "Have you considered...?"`;
    }

    // Curiosity Hooks - always include to boost engagement
    systemPrompt += `

CURIOSITY HOOKS (use 1-2 per response to spark interest):
Start or enhance your response with one of these patterns:
- Surprising fact: "Did you know..." or "Here's something fascinating..."
- Real-world connection: "In the real world..." or "You've probably seen this before..."
- "What if..." thought experiments: "What if you could..." or "Ever wondered why...?"
- Mystery opener: "Scientists used to think..." or "This might surprise you..."
Choose hooks that relate to the specific topic being discussed.`;

    // Micro-Affirmations - brief encouragement that builds confidence
    systemPrompt += `

MICRO-AFFIRMATIONS (include 1-2 brief encouragements):
Use these sparingly to acknowledge effort and build confidence:
- "Great question!" - when student asks something thoughtful
- "You're thinking like a scientist!" - when they show curiosity
- "Excellent observation!" - when they notice something important
- "That shows real curiosity!" - when they dig deeper
- "Good thinking!" - when they reason through something
- "I love how you're exploring this!" - when they ask follow-ups
Place affirmations naturally in your response, not all at the beginning.`;

    systemPrompt += `

ENGAGEMENT STRATEGIES:
- Start responses with encouraging words when appropriate
- Connect concepts to real-world applications students can relate to
- Use analogies and comparisons to make abstract concepts concrete
- Acknowledge good questions and thinking
- Build on student's existing knowledge

FOLLOW-UP QUESTIONS REQUIREMENT:
You MUST end your response with exactly 4 contextual follow-up questions that are:
- Age-appropriate for ${ageRange}-year-old students
- Specific to the ${subject} concept being discussed
- Related to the ${competencyLevel} proficiency level
- Designed to deepen understanding at the ${cognitiveLevel} cognitive level
- Phrased as questions a curious ${ageRange}-year-old would naturally ask
- Each question should build on your explanation and encourage further exploration

Format follow-up questions using this EXACT structure:

---FOLLOW_UP_QUESTIONS---
QUESTION_1: [Specific to the concept and age-appropriate] 
QUESTION_2: [Extends the learning at their level]
QUESTION_3: [Connects to real-world applications]
QUESTION_4: [Challenges them appropriately for their age/level]
---END_FOLLOW_UP_QUESTIONS---

IMPORTANT RESTRICTIONS:
- Never provide direct homework answers or test solutions
- Don't request or discuss personal information
- Stay within the educational topic scope
- Avoid overly complex terminology without explanation
- No inappropriate content for the age group
- Focus only on ${subject} concepts related to this learning unit
- ALWAYS include the 4 contextual follow-up questions at the end

Remember: Your goal is to inspire curiosity and deep understanding through your main response AND through age/concept-specific follow-up questions.`;

    return systemPrompt;
  }

  /**
   * Build user prompt with question and context
   * Now supports conversation history for multi-turn conversations
   */
  private buildUserPrompt(question: string, includeExamples: boolean, conversationContext?: string): string {
    let userPrompt = `CONCEPT CARD CONTEXT:
Main Learning Goal: "${this.context.originalContext.keyQuestion}"

Subject Area: ${this.context.subject}
Topic Overview: ${this.context.originalContext.conceptOverview || 'Not specified'}`;

    // Add key concepts if available
    if (this.context.keyConcepts.length > 0) {
      userPrompt += `\n\nKey Concepts in This Unit:
${this.context.keyConcepts.map(concept => `- ${concept}`).join('\n')}`;
    }

    // Add vocabulary definitions
    if (Object.keys(this.context.vocabularyMap).length > 0) {
      userPrompt += `\n\nRelevant Vocabulary:`;
      const topVocab = Object.entries(this.context.vocabularyMap).slice(0, 8);
      for (const [term, definition] of topVocab) {
        userPrompt += `\n- ${term}: ${definition}`;
      }
    }

    // Add learning objectives if available
    if (this.context.originalContext.learningObjectives.length > 0) {
      userPrompt += `\n\nLearning Objectives:`;
      this.context.originalContext.learningObjectives.slice(0, 5).forEach(objective => {
        userPrompt += `\n- ${objective}`;
      });
    }

    // Add common misconceptions to address
    if (this.context.originalContext.misconceptions.length > 0) {
      userPrompt += `\n\nCommon Misconceptions to Watch For:`;
      this.context.originalContext.misconceptions.slice(0, 3).forEach(misconception => {
        userPrompt += `\n- ${misconception}`;
      });
    }

    // Add core explanation if available
    if (this.context.originalContext.coreExplanation) {
      const explanation = this.context.originalContext.coreExplanation;
      const truncatedExplanation = explanation.length > 800 
        ? explanation.substring(0, 800) + '...'
        : explanation;
      
      userPrompt += `\n\nCore Educational Content:
${truncatedExplanation}`;
    }

    // Add conversation history if available
    if (conversationContext && conversationContext.trim().length > 0) {
      userPrompt += `\n\n${conversationContext}`;
    }

    userPrompt += `\n\n---

STUDENT'S QUESTION: "${question}"

Please provide a helpful, educational response that:
1. Directly addresses the student's question
2. Connects to the concept card content above
3. Uses warm, encouraging language appropriate for age ${this.context.estimatedAgeRange}
4. Reinforces key vocabulary and concepts when relevant
5. Helps deepen understanding of ${this.context.subject}`;

    if (includeExamples) {
      userPrompt += `\n6. Includes a practical example if it would help understanding`;
    }

    return userPrompt;
  }

  /**
   * Build learning focus section based on context
   */
  private buildLearningFocus(): string {
    const keyQuestion = this.context.originalContext.keyQuestion;
    const subject = this.context.subject;
    
    if (keyQuestion) {
      return `Students are exploring: "${keyQuestion}"
This is a ${this.context.complexityLevel}-level ${subject} concept focusing on ${this.context.originalContext.cognitiveLevel} skills.`;
    }
    
    return `Students are learning ${this.context.complexityLevel}-level ${subject} concepts with focus on ${this.context.originalContext.cognitiveLevel} skills.`;
  }

  /**
   * Build vocabulary context for AI understanding
   */
  private buildVocabularyContext(): string {
    const vocab = this.context.vocabularyMap;
    
    if (Object.keys(vocab).length === 0) {
      return `Students are building vocabulary related to ${this.context.subject}.`;
    }

    const keyTerms = Object.keys(vocab).slice(0, 6);
    return `Students should understand and use these terms correctly: ${keyTerms.join(', ')}`;
  }

  /**
   * Build understanding level context
   */
  private buildUnderstandingLevel(): string {
    const competencyLevel = this.context.originalContext.competencyLevel;
    const cognitiveLevel = this.context.originalContext.cognitiveLevel;
    
    const competencyDescriptions = {
      'foundation': 'just beginning to learn fundamental concepts',
      'developing': 'building understanding and making connections',
      'consolidating': 'strengthening knowledge and applying skills',
      'extending': 'deepening understanding and exploring complex applications', 
      'proficient': 'demonstrating mastery and tackling advanced challenges',
    };

    const cognitiveDescriptions = {
      'remember': 'focusing on recalling and recognizing information',
      'understand': 'working to comprehend and explain concepts',
      'apply': 'practicing using knowledge in different situations',
      'analyze': 'examining relationships and breaking down complex ideas',
      'evaluate': 'making judgments and assessing information critically',
      'create': 'synthesizing knowledge to produce new ideas and solutions',
    };

    const competencyDesc = competencyDescriptions[competencyLevel] || 'developing their understanding';
    const cognitiveDesc = cognitiveDescriptions[cognitiveLevel] || 'building comprehension';

    return `Students are ${competencyDesc}, with emphasis on ${cognitiveDesc}.`;
  }

  /**
   * Resolve complexity level from options or context
   */
  private resolveComplexity(requestedComplexity: string): string {
    if (requestedComplexity !== 'auto') {
      return requestedComplexity;
    }
    
    return this.context.complexityLevel;
  }

  /**
   * Calculate maximum tokens based on response requirements
   * Now accounts for conversation context
   */
  private calculateMaxTokens(maxSentences: number, includeExamples: boolean, hasConversationContext: boolean = false): number {
    // Base calculation: ~15-20 tokens per sentence for educational content
    let baseTokens = maxSentences * 18;
    
    // Add tokens for examples if requested
    if (includeExamples) {
      baseTokens += 50; // Extra tokens for example content
    }
    
    // Add buffer for educational explanations and warm tone
    baseTokens += 30;
    
    // Add extra tokens for conversation context references
    if (hasConversationContext) {
      baseTokens += 40; // Extra tokens to reference previous conversation
    }
    
    // Ensure reasonable bounds
    return Math.max(100, Math.min(baseTokens, 500));
  }

  /**
   * Build context-aware follow-up suggestions
   */
  buildFollowUpSuggestions(originalQuestion: string): string[] {
    const suggestions: string[] = [];
    const lowerQuestion = originalQuestion.toLowerCase();
    
    // Generic educational follow-ups
    const genericSuggestions = [
      "Can you show me an example?",
      "How is this used in real life?",
      "What's a common mistake to avoid?",
      "Can you explain that in a different way?",
    ];

    // Subject-specific follow-ups based on context
    const subjectSpecific = this.getSubjectSpecificSuggestions();
    
    // Concept-specific follow-ups
    const conceptSpecific = this.getConceptSpecificSuggestions(lowerQuestion);
    
    // Combine suggestions intelligently
    suggestions.push(...conceptSpecific.slice(0, 2));
    suggestions.push(...subjectSpecific.slice(0, 2));
    suggestions.push(...genericSuggestions.slice(0, 2));
    
    // Remove duplicates and limit to 4 suggestions
    const uniqueSuggestions = [...new Set(suggestions)];
    return uniqueSuggestions.slice(0, 4);
  }

  /**
   * Get subject-specific follow-up suggestions
   */
  private getSubjectSpecificSuggestions(): string[] {
    const subject = this.context.subject.toLowerCase();
    
    const subjectSuggestions: Record<string, string[]> = {
      'mathematics': [
        "Can you walk me through the steps?",
        "What formula should I use?",
        "How do I know when to use this method?",
        "Can you show me a practice problem?",
      ],
      'science': [
        "What causes this to happen?",
        "Can you give me a real-world example?",
        "How do scientists study this?",
        "What would happen if...?",
      ],
      'english': [
        "Can you help me understand this better?",
        "What are some examples in literature?",
        "How can I improve my writing with this?",
        "What should I look for when reading?",
      ],
      'history': [
        "What led to this happening?",
        "How did this affect people's lives?",
        "What were the long-term consequences?",
        "How do we know about this today?",
      ],
    };
    
    // Find matching subject suggestions
    for (const [subjectKey, suggestions] of Object.entries(subjectSuggestions)) {
      if (subject.includes(subjectKey) || subjectKey.includes(subject)) {
        return suggestions;
      }
    }
    
    return [];
  }

  /**
   * Get concept-specific follow-up suggestions
   */
  private getConceptSpecificSuggestions(question: string): string[] {
    const suggestions: string[] = [];
    
    // Analyze question content for specific suggestions
    if (question.includes('formula') || question.includes('equation')) {
      suggestions.push("When do I use this formula?");
      suggestions.push("Can you show me step-by-step?");
    }
    
    if (question.includes('why') || question.includes('how')) {
      suggestions.push("Can you give me an analogy?");
      suggestions.push("What's a simple way to remember this?");
    }
    
    if (question.includes('calculate') || question.includes('solve')) {
      suggestions.push("What are common mistakes here?");
      suggestions.push("Can I see another example?");
    }
    
    // Add vocabulary-related suggestions if question involves key terms
    for (const term of Object.keys(this.context.vocabularyMap)) {
      if (question.includes(term.toLowerCase())) {
        suggestions.push(`How does ${term} relate to other concepts?`);
        break;
      }
    }
    
    return suggestions;
  }

  /**
   * Build educational resource suggestions based on context
   */
  buildResourceSuggestions(question: string): Array<{
    title: string;
    description: string;
    type: 'concept' | 'example' | 'practice' | 'widget';
  }> {
    const resources: Array<{
      title: string;
      description: string;
      type: 'concept' | 'example' | 'practice' | 'widget';
    }> = [];

    // Add concept-related resources
    if (this.context.keyConcepts.length > 0) {
      const relatedConcept = this.context.keyConcepts[0];
      resources.push({
        title: `Understanding ${relatedConcept}`,
        description: `Learn more about ${relatedConcept} with detailed explanations`,
        type: 'concept',
      });
    }

    // Add practice suggestions based on question type
    const lowerQuestion = question.toLowerCase();
    if (lowerQuestion.includes('practice') || lowerQuestion.includes('exercise')) {
      resources.push({
        title: 'Practice Problems',
        description: `Try practice problems related to ${this.context.subject}`,
        type: 'practice',
      });
    }

    // Add example resources
    if (lowerQuestion.includes('example') || lowerQuestion.includes('show me')) {
      resources.push({
        title: 'Real-World Examples',
        description: `See how ${this.context.subject} applies in everyday situations`,
        type: 'example',
      });
    }

    return resources.slice(0, 3); // Limit to 3 resources
  }
}
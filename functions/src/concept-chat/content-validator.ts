// Content validator for educational AI responses
// Provides comprehensive safety and relevance checks for any subject/topic

import { 
  ProcessedContext, 
  ValidationResult, 
  QuestionValidationResult
} from './types';

/**
 * Validates content for educational appropriateness and topic relevance
 * Works universally across all subjects and age groups
 */
export class ContentValidator {
  private context: ProcessedContext;
  
  // Universal inappropriate content patterns
  private readonly inappropriatePatterns = [
    // Personal information requests
    /(?:what.*(?:your|my).*(?:name|address|phone|email|password))/i,
    /(?:tell.*me.*about.*(?:yourself|your.*life|personal))/i,
    /(?:where.*do.*you.*live)/i,
    
    // Inappropriate topics for educational context
    /(?:dating|romance|relationship.*advice)/i,
    /(?:political.*opinion|who.*should.*vote)/i,
    /(?:religious.*belief|which.*god)/i,
    
    // Non-educational requests
    /(?:write.*my.*homework|do.*my.*assignment|complete.*my.*work)/i,
    /(?:what.*will.*be.*on.*the.*test|test.*answers|exam.*solutions)/i,
    
    // Harmful instructions
    /(?:how.*to.*hurt|how.*to.*harm|dangerous.*experiment)/i,
    /(?:illegal|break.*law|cheat)/i,
  ];

  // Common profanity patterns (basic set)
  private readonly profanityPatterns = [
    /\b(?:damn|hell|crap|stupid|dumb|idiot)\b/i,
    // Add more as needed, keeping educational context in mind
  ];

  // Age-inappropriate complexity indicators
  private readonly complexityIndicators = {
    high: [
      /(?:differential|integral|calculus|theorem|proof|lemma)/i,
      /(?:molecular|quantum|nuclear|biochemical)/i,
      /(?:philosophical|metaphysical|existential)/i,
      /(?:advanced.*statistics|regression.*analysis|correlation.*matrix)/i,
    ],
    medium: [
      /(?:algebra|geometry|trigonometry|equation|formula)/i,
      /(?:chemical.*reaction|periodic.*table|element)/i,
      /(?:grammar|syntax|literary.*analysis)/i,
      /(?:historical.*context|chronological|civilization)/i,
    ],
    low: [
      /(?:addition|subtraction|counting|basic.*math)/i,
      /(?:simple.*words|spelling|alphabet)/i,
      /(?:colors|shapes|animals|family)/i,
    ],
  };

  constructor(context: ProcessedContext) {
    this.context = context;
  }

  /**
   * Validate student question for appropriateness and relevance
   */
  async validateQuestion(question: string): Promise<QuestionValidationResult> {
    console.log('🔍 Validating question:', {
      questionLength: question.length,
      subject: this.context.subject,
      ageRange: this.context.estimatedAgeRange,
    });

    // 1. Check for inappropriate content
    const inappropriateCheck = this.checkInappropriateContent(question);
    if (!inappropriateCheck.isAppropriate) {
      return {
        isValid: false,
        reason: inappropriateCheck.reason,
        redirectMessage: inappropriateCheck.redirectMessage,
      };
    }

    // 2. Check topic relevance - VERY PERMISSIVE for educational context
    const relevanceScore = this.calculateTopicRelevance(question);
    console.log('🔍 Topic relevance check:', {
      question: question.substring(0, 50) + '...',
      subject: this.context.subject,
      relevanceScore,
      threshold: 0.05, // Very low threshold
      passed: relevanceScore >= 0.05,
    });
    
    if (relevanceScore < 0.05) { // Much more permissive threshold
      return {
        isValid: false,
        reason: 'Question not relevant to concept topic',
        redirectMessage: this.buildTopicRedirectMessage(question),
      };
    }

    // 3. Check age appropriateness
    const ageCheck = this.checkAgeAppropriateness(question);
    if (!ageCheck.isAppropriate) {
      return {
        isValid: false,
        reason: ageCheck.reason,
        redirectMessage: ageCheck.redirectMessage,
        suggestedRephrase: ageCheck.suggestedRephrase,
      };
    }

    // 4. DEBUG: Check for learning value but make it very permissive
    const learningValueCheck = this.assessLearningValue(question);
    console.log('🔍 Learning value check result:', {
      question: question.substring(0, 50) + '...',
      value: learningValueCheck.value,
    });
    
    /* DISABLED - too strict per user feedback
    if (learningValueCheck.value === 'none') {
      return {
        isValid: false,
        reason: 'Question lacks educational value',
        redirectMessage: 'Let me help you learn more about this topic. Try asking about specific concepts, formulas, or real-world applications.',
      };
    }
    */

    console.log('✅ Question validation passed:', {
      relevanceScore,
      ageAppropriate: ageCheck.isAppropriate,
      learningValue: learningValueCheck.value,
    });

    return { isValid: true };
  }

  /**
   * Validate AI response for educational standards
   */
  async validateResponse(response: string, originalQuestion: string): Promise<ValidationResult> {
    console.log('🔍 Validating AI response:', {
      responseLength: response.length,
      subject: this.context.subject,
      complexity: this.context.complexityLevel,
    });

    let wasFiltered = false;
    let filteredContent = response;

    // 1. Check response length and structure
    const lengthCheck = this.checkResponseLength(response);
    if (!lengthCheck.isValid) {
      filteredContent = this.truncateResponse(response);
      wasFiltered = true;
    }

    // 2. Check topic relevance
    const topicRelevance = this.calculateTopicRelevance(response);
    
    // 3. Check age appropriateness
    const ageCheck = this.checkAgeAppropriateness(response);
    if (!ageCheck.isAppropriate) {
      filteredContent = this.makeAgeAppropriate(response);
      wasFiltered = true;
    }

    // 4. Check educational value
    const educationalValue = this.assessEducationalValue(response);
    
    // 5. Check for warm, encouraging tone
    const toneScore = this.assessTone(response);
    if (toneScore < 0.5) {
      filteredContent = this.enhanceTone(filteredContent);
      wasFiltered = true;
    }

    // 6. Validate mathematical/scientific accuracy (basic check)
    const accuracyCheck = this.checkFactualAccuracy(response);
    
    // 7. Calculate overall confidence score
    const confidenceScore = this.calculateConfidenceScore({
      topicRelevance,
      ageAppropriate: ageCheck.isAppropriate,
      educationalValue,
      toneScore,
      accuracyScore: accuracyCheck.score,
    });

    const result: ValidationResult = {
      isValid: confidenceScore >= 0.6,
      topicRelevance,
      ageAppropriate: ageCheck.isAppropriate,
      educationalValue: this.mapEducationalValueScore(educationalValue),
      confidenceScore,
      wasFiltered,
      filteredContent: wasFiltered ? filteredContent : undefined,
      reason: confidenceScore < 0.6 ? 'Response did not meet educational quality standards' : undefined,
    };

    console.log('✅ Response validation completed:', {
      isValid: result.isValid,
      topicRelevance,
      ageAppropriate: result.ageAppropriate,
      educationalValue: result.educationalValue,
      confidenceScore,
      wasFiltered,
    });

    return result;
  }

  /**
   * Check for inappropriate content patterns
   */
  private checkInappropriateContent(text: string): {
    isAppropriate: boolean;
    reason?: string;
    redirectMessage?: string;
  } {

    // Check inappropriate patterns
    for (const pattern of this.inappropriatePatterns) {
      if (pattern.test(text)) {
        return {
          isAppropriate: false,
          reason: 'Contains inappropriate content for educational context',
          redirectMessage: `I'm here to help you learn about ${this.context.subject}. Let's focus on the educational concepts in this topic!`,
        };
      }
    }

    // Check profanity
    for (const pattern of this.profanityPatterns) {
      if (pattern.test(text)) {
        return {
          isAppropriate: false,
          reason: 'Contains inappropriate language',
          redirectMessage: 'Let\'s keep our conversation respectful and focused on learning!',
        };
      }
    }

    return { isAppropriate: true };
  }

  /**
   * Calculate topic relevance score based on concept context
   */
  private calculateTopicRelevance(text: string): number {
    const lowerText = text.toLowerCase();
    let relevantTermCount = 0;
    let totalRelevantTerms = Math.max(this.context.relevantTerms.size, 1);

    // Count matches with relevant terms
    for (const term of this.context.relevantTerms) {
      if (lowerText.includes(term.toLowerCase())) {
        relevantTermCount++;
      }
    }

    // Check subject mention
    if (lowerText.includes(this.context.subject.toLowerCase())) {
      relevantTermCount += 2; // Weight subject mentions more heavily
    }

    // Check key concepts
    for (const concept of this.context.keyConcepts) {
      if (lowerText.includes(concept.toLowerCase())) {
        relevantTermCount += 1.5; // Weight key concepts
      }
    }

    // Check vocabulary terms
    for (const vocabTerm of Object.keys(this.context.vocabularyMap)) {
      if (lowerText.includes(vocabTerm.toLowerCase())) {
        relevantTermCount += 1.5;
      }
    }

    // ENHANCED: Add universal science terms recognition for biology/cell topics
    if (this.context.subject.toLowerCase() === 'science' || 
        this.context.originalContext.keyQuestion?.toLowerCase().includes('cell')) {
      const scienceTerms = [
        'cell', 'cells', 'organelle', 'organelles', 'mitochondria', 'nucleus', 'membrane',
        'chloroplast', 'cytoplasm', 'ribosome', 'endoplasmic', 'golgi', 'vacuole',
        'structure', 'function', 'biology', 'organism', 'tissue', 'organ', 'system',
        'protein', 'dna', 'genetic', 'enzyme', 'molecular', 'cellular'
      ];
      
      for (const term of scienceTerms) {
        if (lowerText.includes(term)) {
          relevantTermCount += 1.5; // Give strong weight to science terms
        }
      }
    }

    // ENHANCED: Add universal math terms recognition  
    if (this.context.subject.toLowerCase() === 'mathematics' || 
        this.context.subject.toLowerCase() === 'math') {
      const mathTerms = [
        'calculate', 'formula', 'equation', 'number', 'area', 'volume', 'perimeter',
        'length', 'width', 'height', 'multiply', 'divide', 'add', 'subtract',
        'fraction', 'decimal', 'percent', 'ratio', 'proportion', 'geometry', 'algebra'
      ];
      
      for (const term of mathTerms) {
        if (lowerText.includes(term)) {
          relevantTermCount += 1.5;
        }
      }
    }

    // Calculate base relevance score with more generous scaling
    const baseScore = Math.min(relevantTermCount / Math.max(totalRelevantTerms * 0.05, 0.5), 1);
    
    // Boost score if text contains educational indicators
    const educationalIndicators = [
      'how', 'why', 'what', 'when', 'where', 'explain', 'understand', 'learn', 
      'calculate', 'solve', 'tell', 'about', 'more', 'function', 'work', 'does'
    ];
    
    let educationalBoost = 0;
    for (const indicator of educationalIndicators) {
      if (lowerText.includes(indicator)) {
        educationalBoost += 0.15; // Higher boost for educational questions
      }
    }

    // Additional boost for any question that seems educational
    if (lowerText.includes('?') || lowerText.includes('how') || lowerText.includes('what')) {
      educationalBoost += 0.2;
    }

    const finalScore = Math.min(baseScore + educationalBoost, 1);
    
    console.log('🔍 Relevance calculation details:', {
      text: lowerText.substring(0, 50) + '...',
      subject: this.context.subject,
      relevantTermCount,
      totalRelevantTerms,
      baseScore,
      educationalBoost,
      finalScore,
    });

    return finalScore;
  }

  /**
   * Check age appropriateness of content
   */
  private checkAgeAppropriateness(text: string): {
    isAppropriate: boolean;
    reason?: string;
    redirectMessage?: string;
    suggestedRephrase?: string;
  } {
    const targetComplexity = this.context.complexityLevel;
    
    // Check if content is too complex
    const detectedComplexity = this.detectComplexityLevel(text);
    
    if (detectedComplexity === 'advanced' && targetComplexity !== 'advanced') {
      return {
        isAppropriate: false,
        reason: 'Content too advanced for age group',
        redirectMessage: `That's a great question! Let me explain it in a way that fits your current learning level.`,
        suggestedRephrase: this.simplifyLanguageForAge(text),
      };
    }

    if (detectedComplexity === 'basic' && targetComplexity === 'advanced') {
      // This is OK - simpler is better for understanding
      return { isAppropriate: true };
    }

    // DEBUG: Check vocabulary complexity but make it very permissive
    const vocabComplexity = this.assessVocabularyComplexity(text);
    const maxComplexity = this.getMaxVocabularyComplexity();
    console.log('🔍 Vocabulary complexity check:', {
      question: text.substring(0, 50) + '...',
      vocabComplexity,
      maxComplexity,
      passed: vocabComplexity <= maxComplexity,
    });
    
    /* DISABLED - too strict per user feedback
    if (vocabComplexity > this.getMaxVocabularyComplexity()) {
      return {
        isAppropriate: false,
        reason: 'Vocabulary too advanced',
        redirectMessage: 'Let me use simpler terms to explain this concept.',
      };
    }
    */

    return { isAppropriate: true };
  }

  /**
   * Detect complexity level of text
   */
  private detectComplexityLevel(text: string): 'basic' | 'intermediate' | 'advanced' {
    // Check against complexity indicators
    for (const pattern of this.complexityIndicators.high) {
      if (pattern.test(text)) {
        return 'advanced';
      }
    }

    for (const pattern of this.complexityIndicators.medium) {
      if (pattern.test(text)) {
        return 'intermediate';
      }
    }

    // Check sentence complexity
    const sentences = text.split(/[.!?]+/);
    const avgWordsPerSentence = sentences.reduce((total, sentence) => {
      return total + sentence.trim().split(/\s+/).length;
    }, 0) / sentences.length;

    if (avgWordsPerSentence > 20) return 'advanced';
    if (avgWordsPerSentence > 12) return 'intermediate';
    return 'basic';
  }

  /**
   * Assess learning value of question or response
   */
  private assessLearningValue(text: string): { value: 'none' | 'low' | 'medium' | 'high' } {
    const lowerText = text.toLowerCase();
    
    // High learning value indicators
    const highValueIndicators = [
      'why', 'how', 'explain', 'understand', 'learn', 'teach', 'show', 'demonstrate',
      'example', 'apply', 'practice', 'solve', 'calculate', 'analyze'
    ];
    
    // Medium learning value indicators
    const mediumValueIndicators = [
      'what', 'when', 'where', 'define', 'describe', 'list', 'identify'
    ];
    
    // Low learning value indicators
    const lowValueIndicators = [
      'is', 'are', 'can', 'will', 'do', 'does'
    ];

    let highCount = 0;
    let mediumCount = 0;
    let lowCount = 0;

    for (const indicator of highValueIndicators) {
      if (lowerText.includes(indicator)) highCount++;
    }
    
    for (const indicator of mediumValueIndicators) {
      if (lowerText.includes(indicator)) mediumCount++;
    }
    
    for (const indicator of lowValueIndicators) {
      if (lowerText.includes(indicator)) lowCount++;
    }

    // Check for topic-specific learning value
    const hasTopicConnection = this.calculateTopicRelevance(text) > 0.5;
    
    if (highCount > 0 && hasTopicConnection) return { value: 'high' };
    if ((mediumCount > 0 || highCount > 0) && hasTopicConnection) return { value: 'medium' };
    if (hasTopicConnection) return { value: 'low' };
    
    return { value: 'none' };
  }

  /**
   * Assess educational value of response
   */
  private assessEducationalValue(response: string): number {
    let score = 0;
    const lowerResponse = response.toLowerCase();

    // Check for explanatory elements
    if (lowerResponse.includes('because') || lowerResponse.includes('since')) score += 0.2;
    if (lowerResponse.includes('example') || lowerResponse.includes('for instance')) score += 0.2;
    if (lowerResponse.includes('this means') || lowerResponse.includes('in other words')) score += 0.1;
    
    // Check for educational scaffolding
    if (lowerResponse.includes('first') || lowerResponse.includes('then') || lowerResponse.includes('next')) score += 0.1;
    if (lowerResponse.includes('remember') || lowerResponse.includes('think about')) score += 0.1;
    
    // Check for concept connections
    const conceptMentions = this.context.keyConcepts.filter(concept => 
      lowerResponse.includes(concept.toLowerCase())
    ).length;
    score += Math.min(conceptMentions * 0.1, 0.3);

    // Check for vocabulary reinforcement
    const vocabMentions = Object.keys(this.context.vocabularyMap).filter(term =>
      lowerResponse.includes(term.toLowerCase())
    ).length;
    score += Math.min(vocabMentions * 0.1, 0.2);

    return Math.min(score, 1);
  }

  /**
   * Assess tone of response for warmth and encouragement
   */
  private assessTone(response: string): number {
    const lowerResponse = response.toLowerCase();
    let toneScore = 0.5; // Neutral baseline

    // Positive tone indicators
    const positiveIndicators = [
      'great', 'excellent', 'wonderful', 'fantastic', 'awesome', 'perfect',
      'good job', 'well done', 'you\'re right', 'exactly', 'that\'s correct'
    ];

    // Encouraging phrases
    const encouragingPhrases = [
      'let\'s', 'we can', 'you can', 'try', 'practice', 'keep going',
      'don\'t worry', 'it\'s okay', 'learning', 'growing', 'improving'
    ];

    // Warm/friendly tone
    const warmIndicators = [
      'i\'m here to help', 'happy to explain', 'glad you asked',
      'interesting question', 'i understand', 'that makes sense'
    ];

    // Check for positive indicators
    for (const indicator of positiveIndicators) {
      if (lowerResponse.includes(indicator)) toneScore += 0.1;
    }

    for (const phrase of encouragingPhrases) {
      if (lowerResponse.includes(phrase)) toneScore += 0.1;
    }

    for (const indicator of warmIndicators) {
      if (lowerResponse.includes(indicator)) toneScore += 0.1;
    }

    // Check for negative tone (subtract points)
    const negativeIndicators = ['wrong', 'incorrect', 'no', 'never', 'impossible', 'can\'t'];
    for (const indicator of negativeIndicators) {
      if (lowerResponse.includes(indicator)) toneScore -= 0.1;
    }

    return Math.max(0, Math.min(toneScore, 1));
  }

  /**
   * Basic factual accuracy check
   */
  private checkFactualAccuracy(response: string): { score: number } {
    // This is a basic implementation - in production, you might want more sophisticated fact-checking
    let accuracyScore = 0.8; // Assume mostly accurate baseline

    // Check for obvious mathematical errors
    const mathExpressions = response.match(/\d+\s*[\+\-\*\/]\s*\d+\s*=\s*\d+/g);
    if (mathExpressions) {
      for (const expr of mathExpressions) {
        try {
          const parts = expr.split('=');
          const leftSide = parts[0].trim();
          const rightSide = parseInt(parts[1].trim());
          
          // Simple evaluation (only for basic operations)
          const calculatedValue = eval(leftSide.replace(/×/g, '*').replace(/÷/g, '/'));
          
          if (Math.abs(calculatedValue - rightSide) > 0.01) {
            accuracyScore -= 0.2; // Deduct for mathematical errors
          }
        } catch (e) {
          // Ignore evaluation errors for complex expressions
        }
      }
    }

    // Check for contradictory statements
    if (response.includes('always') && response.includes('never')) {
      accuracyScore -= 0.1;
    }

    return { score: Math.max(0, accuracyScore) };
  }

  /**
   * Build topic redirect message for off-topic questions
   */
  private buildTopicRedirectMessage(question: string): string {
    const subject = this.context.subject;
    const keyQuestion = this.context.originalContext.keyQuestion;
    
    const suggestions = [];
    
    // Add vocabulary-based suggestions
    const vocabTerms = Object.keys(this.context.vocabularyMap).slice(0, 3);
    if (vocabTerms.length > 0) {
      suggestions.push(`Ask about ${vocabTerms.join(', ')}`);
    }
    
    // Add concept-based suggestions
    const concepts = this.context.keyConcepts.slice(0, 2);
    if (concepts.length > 0) {
      suggestions.push(`Learn about ${concepts.join(' or ')}`);
    }

    let redirectMessage = `I'm here to help you with ${subject}`;
    
    if (keyQuestion) {
      redirectMessage += `, specifically: "${keyQuestion}"`;
    }
    
    if (suggestions.length > 0) {
      redirectMessage += `.\n\nTry asking: ${suggestions.join(', or ')}.`;
    } else {
      redirectMessage += '. What would you like to understand better about this topic?';
    }

    return redirectMessage;
  }

  /**
   * Calculate overall confidence score
   */
  private calculateConfidenceScore(factors: {
    topicRelevance: number;
    ageAppropriate: boolean;
    educationalValue: number;
    toneScore: number;
    accuracyScore: number;
  }): number {
    const weights = {
      topicRelevance: 0.3,
      ageAppropriate: 0.2,
      educationalValue: 0.25,
      toneScore: 0.15,
      accuracyScore: 0.1,
    };

    let score = 0;
    score += factors.topicRelevance * weights.topicRelevance;
    score += (factors.ageAppropriate ? 1 : 0) * weights.ageAppropriate;
    score += factors.educationalValue * weights.educationalValue;
    score += factors.toneScore * weights.toneScore;
    score += factors.accuracyScore * weights.accuracyScore;

    return score;
  }

  /**
   * Helper methods for content modification
   */
  private checkResponseLength(response: string): { isValid: boolean } {
    const sentences = response.split(/[.!?]+/).filter(s => s.trim().length > 0);
    return { isValid: sentences.length <= 6 }; // Allow up to 6 sentences
  }

  private truncateResponse(response: string): string {
    const sentences = response.split(/[.!?]+/).filter(s => s.trim().length > 0);
    return sentences.slice(0, 5).join('. ') + '.';
  }

  private makeAgeAppropriate(response: string): string {
    // Simplify complex vocabulary
    let simplified = response;
    
    // Replace complex terms with simpler alternatives
    const simplifications: Record<string, string> = {
      'utilize': 'use',
      'demonstrate': 'show',
      'comprehend': 'understand',
      'facilitate': 'help',
      'subsequently': 'then',
      'consequently': 'so',
      'furthermore': 'also',
    };

    for (const [complex, simple] of Object.entries(simplifications)) {
      simplified = simplified.replace(new RegExp(`\\b${complex}\\b`, 'gi'), simple);
    }

    return simplified;
  }

  private enhanceTone(response: string): string {
    // Add encouraging elements if missing
    if (!response.toLowerCase().includes('great') && 
        !response.toLowerCase().includes('good') && 
        !response.toLowerCase().includes('excellent')) {
      return `Great question! ${response}`;
    }
    return response;
  }

  private assessVocabularyComplexity(text: string): number {
    // Simple syllable-based complexity assessment
    const words = text.toLowerCase().split(/\s+/);
    let complexityScore = 0;

    for (const word of words) {
      const syllables = this.countSyllables(word);
      if (syllables > 3) complexityScore += 1;
      if (syllables > 5) complexityScore += 1;
    }

    return complexityScore / words.length;
  }

  private countSyllables(word: string): number {
    // Simple syllable counting
    const vowels = word.match(/[aeiouy]+/g);
    return vowels ? vowels.length : 1;
  }

  private getMaxVocabularyComplexity(): number {
    switch (this.context.complexityLevel) {
      case 'basic': return 0.2;
      case 'intermediate': return 0.3;
      case 'advanced': return 0.5;
      default: return 0.3;
    }
  }

  private simplifyLanguageForAge(text: string): string {
    // Basic language simplification
    return text.replace(/\b\w{10,}\b/g, (match) => {
      // Replace very long words with shorter alternatives or break them down
      return match.length > 12 ? '[complex term]' : match;
    });
  }

  private mapEducationalValueScore(score: number): 'low' | 'medium' | 'high' {
    if (score >= 0.7) return 'high';
    if (score >= 0.4) return 'medium';
    return 'low';
  }
}
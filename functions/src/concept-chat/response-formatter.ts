// Response formatter for educational AI chat
// Enhances AI responses with educational features and proper formatting

import { ProcessedContext, FormattedResponse, EducationalResource } from './types';
import { EducationalPromptBuilder } from './prompt-builder';

/**
 * Formats AI responses for optimal educational presentation
 * Adds mathematical formatting, follow-ups, and educational resources
 */
export class ResponseFormatter {
  private context: ProcessedContext;
  private promptBuilder: EducationalPromptBuilder;

  constructor(context: ProcessedContext) {
    this.context = context;
    this.promptBuilder = new EducationalPromptBuilder(context);
  }

  /**
   * Format AI response with educational enhancements
   */
  async formatResponse(options: {
    content: string;
    originalQuestion: string;
    includeFollowUps: boolean;
    includeResources: boolean;
  }): Promise<FormattedResponse> {
    console.log('🎨 Formatting educational response:', {
      contentLength: options.content.length,
      subject: this.context.subject,
      includeFollowUps: options.includeFollowUps,
      includeResources: options.includeResources,
    });

    let formattedContent = options.content;

    // 0. Clean up existing formatting issues first
    formattedContent = this.cleanupFormatting(formattedContent);

    // 1. Format mathematical expressions
    formattedContent = this.formatMathematicalContent(formattedContent);

    // 2. Enhance vocabulary terms
    formattedContent = this.enhanceVocabularyTerms(formattedContent);

    // 3. Format key concepts
    formattedContent = this.formatKeyConcepts(formattedContent);

    // 4. Clean up follow-up questions section from main content (extract separately)
    formattedContent = this.removeFollowUpQuestionsFromContent(formattedContent);

    // 5. Ensure warm, encouraging tone
    formattedContent = this.ensureEncouragingTone(formattedContent);

    // 6. Generate follow-up suggestions (use original content before cleanup)
    const suggestedFollowUps = options.includeFollowUps 
      ? this.generateFollowUpSuggestions(options.originalQuestion, options.content)
      : [];

    // 7. Generate educational resources
    const educationalResources = options.includeResources
      ? this.generateEducationalResources(options.originalQuestion, formattedContent)
      : [];

    console.log('✅ Response formatting completed:', {
      originalLength: options.content.length,
      formattedLength: formattedContent.length,
      followUpsGenerated: suggestedFollowUps.length,
      resourcesGenerated: educationalResources.length,
    });

    return {
      content: formattedContent,
      suggestedFollowUps,
      educationalResources,
    };
  }

  /**
   * Remove follow-up questions section from main content
   */
  private removeFollowUpQuestionsFromContent(content: string): string {
    // Remove the FOLLOW_UP_QUESTIONS section and everything after it
    const cleanedContent = content.replace(/FOLLOW_UP_QUESTIONS:\s*[\s\S]*$/i, '').trim();
    
    console.log('🧹 Cleaned content length:', {
      original: content.length,
      cleaned: cleanedContent.length,
      removedSection: content.length - cleanedContent.length > 50
    });
    
    return cleanedContent;
  }

  /**
   * Clean up formatting issues from AI response
   */
  private cleanupFormatting(content: string): string {
    let cleaned = content;

    // Remove excessive asterisks (3 or more in a row)
    cleaned = cleaned.replace(/\*{3,}/g, '**');
    
    // Fix spacing issues around asterisks
    cleaned = cleaned.replace(/\*\*\s+/g, '**');
    cleaned = cleaned.replace(/\s+\*\*/g, '**');
    
    // Remove double asterisks around single characters or very short words
    cleaned = cleaned.replace(/\*\*([a-zA-Z]{1,2})\*\*/g, '$1');
    
    // Clean up repeated asterisks within text
    cleaned = cleaned.replace(/(\*\*[^*]*)\*+([^*]*\*\*)/g, '$1$2');
    
    // Remove asterisks that appear to be formatting artifacts
    cleaned = cleaned.replace(/\*{2,}([^*\s]{1,3})\*{2,}/g, '$1');

    return cleaned;
  }

  /**
   * Format mathematical expressions for better readability
   */
  private formatMathematicalContent(content: string): string {
    let formatted = content;

    // Clean up excessive asterisks first
    formatted = formatted.replace(/\*{3,}/g, '**');
    
    // Remove existing bold formatting to prevent double-formatting
    formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '$1');

    // Format equations more selectively (Area = length × width)
    formatted = formatted.replace(
      /\b(\w+)\s*=\s*([^\n.!?]*)/g,
      '$1 = $2'
    );

    // Format mathematical operations
    formatted = formatted.replace(/(\d+)\s*\×\s*(\d+)/g, '$1 × $2');
    formatted = formatted.replace(/(\d+)\s*\÷\s*(\d+)/g, '$1 ÷ $2');
    formatted = formatted.replace(/(\d+)\s*\+\s*(\d+)/g, '$1 + $2');
    formatted = formatted.replace(/(\d+)\s*\-\s*(\d+)/g, '$1 - $2');

    // Format units
    formatted = formatted.replace(/(\d+)\s*(cm²|m²|km²|mm²|in²|ft²)/g, '$1 $2');
    formatted = formatted.replace(/(\d+)\s*(cm³|m³|km³|mm³|in³|ft³)/g, '$1 $2');
    formatted = formatted.replace(/(\d+)\s*(cm|m|km|mm|in|ft)/g, '$1 $2');

    // Format fractions
    formatted = formatted.replace(/(\d+)\/(\d+)/g, '$1/$2');

    // Format percentages
    formatted = formatted.replace(/(\d+)\s*%/g, '$1%');

    return formatted;
  }

  /**
   * Enhance vocabulary terms in the response (simplified to avoid over-formatting)
   */
  private enhanceVocabularyTerms(content: string): string {
    // Skip vocabulary enhancement to avoid formatting conflicts
    // The AI response already includes appropriate terminology
    return content;
  }

  /**
   * Format key concepts for emphasis (simplified to avoid over-formatting)
   */
  private formatKeyConcepts(content: string): string {
    // Skip concept emphasis to avoid formatting conflicts
    // The AI response is already well-structured
    return content;
  }

  /**
   * Ensure response has warm, encouraging tone
   */
  private ensureEncouragingTone(content: string): string {
    const lowerContent = content.toLowerCase();
    
    // Check if response already has encouraging elements
    const hasEncouragement = [
      'great', 'excellent', 'wonderful', 'fantastic', 'awesome',
      'good job', 'well done', 'that\'s right', 'exactly'
    ].some(phrase => lowerContent.includes(phrase));

    const hasWarmGreeting = [
      'great question', 'interesting', 'i\'m happy', 'glad you asked',
      'let me help', 'i\'d love to explain'
    ].some(phrase => lowerContent.includes(phrase));

    // Add encouraging opening if missing
    if (!hasEncouragement && !hasWarmGreeting && !lowerContent.startsWith('great')) {
      // Add encouraging opening based on question type
      const encouragingOpeners = [
        'Great question!',
        'I\'m happy to explain that!',
        'That\'s a wonderful thing to ask about!',
        'Excellent thinking!',
      ];
      
      const opener = encouragingOpeners[Math.floor(Math.random() * encouragingOpeners.length)];
      return `${opener} ${content}`;
    }

    return content;
  }

  /**
   * Generate contextual follow-up suggestions
   * First try to extract AI-generated contextual questions, fallback to generic ones
   */
  private generateFollowUpSuggestions(originalQuestion: string, response: string): string[] {
    console.log('🎯 Extracting contextual follow-up questions from AI response');
    
    // First, try to extract AI-generated contextual follow-up questions
    const aiGeneratedQuestions = this.extractAIFollowUpQuestions(response);
    
    if (aiGeneratedQuestions.length >= 2) {
      console.log('✅ Using AI-generated contextual questions:', aiGeneratedQuestions.length);
      return aiGeneratedQuestions.slice(0, 4);
    }
    
    console.log('⚠️ AI didn\'t provide contextual questions, falling back to generic generation');
    
    // Fallback to existing logic if AI didn't provide structured questions
    const baseSuggestions = this.promptBuilder.buildFollowUpSuggestions(originalQuestion);
    
    // Add response-specific suggestions
    const responseSpecific = this.getResponseSpecificSuggestions(response);
    
    // Combine and filter suggestions
    const allSuggestions = [...responseSpecific, ...baseSuggestions];
    
    // Remove duplicates and limit
    const uniqueSuggestions = [...new Set(allSuggestions)];
    
    return uniqueSuggestions.slice(0, 4);
  }

  /**
   * Extract contextual follow-up questions from AI response
   */
  private extractAIFollowUpQuestions(response: string): string[] {
    const questions: string[] = [];
    
    // Look for the FOLLOW_UP_QUESTIONS section - be more flexible with the ending
    const followUpMatch = response.match(/FOLLOW_UP_QUESTIONS:\s*([\s\S]*)$/i);
    
    if (followUpMatch) {
      const questionsText = followUpMatch[1];
      console.log('🔍 Found FOLLOW_UP_QUESTIONS section:', questionsText.substring(0, 100) + '...');
      
      // Extract each question (lines starting with - or •)  
      console.log('🔍 Processing questions text:', questionsText);
      
      const allLines = questionsText.split('\n');
      console.log('📋 All lines found:', allLines.length, allLines);
      
      const questionLines = allLines
        .filter(line => line.trim().match(/^[-•]\s*.+/))
        .map(line => line.replace(/^[-•]\s*/, '').trim())
        .filter(question => question.length > 0);
      
      console.log('✅ Question lines after filtering:', questionLines);
      questions.push(...questionLines);
      
      console.log('📝 Final extracted questions:', questions);
    } else {
      console.log('❌ No FOLLOW_UP_QUESTIONS section found in response');
    }
    
    // Clean up and validate questions
    const cleanQuestions = questions
      .map(q => q.replace(/\[|\]/g, '').trim()) // Remove brackets if present
      .filter(q => q.length > 8) // Just check minimum length - don't require question mark as some may be truncated
      .slice(0, 4); // Limit to 4 questions
    
    console.log('🔍 Final cleaned questions:', cleanQuestions);
    console.log(`📊 Questions validation: ${cleanQuestions.length} questions found, minimum needed: 3`);
    
    return cleanQuestions;
  }

  /**
   * Get suggestions based on the AI response content
   */
  private getResponseSpecificSuggestions(response: string): string[] {
    const suggestions: string[] = [];
    const lowerResponse = response.toLowerCase();

    // Suggestions based on response content
    if (lowerResponse.includes('formula') || lowerResponse.includes('equation')) {
      suggestions.push('Can you show me how to use this formula?');
      suggestions.push('What if I forget this formula during a test?');
    }

    if (lowerResponse.includes('example') || lowerResponse.includes('for instance')) {
      suggestions.push('Can I see a different example?');
      suggestions.push('How do I solve similar problems?');
    }

    if (lowerResponse.includes('because') || lowerResponse.includes('since')) {
      suggestions.push('Is there another way to think about this?');
      suggestions.push('What would happen if we changed something?');
    }

    if (lowerResponse.includes('calculate') || lowerResponse.includes('solve')) {
      suggestions.push('What are the steps I should follow?');
      suggestions.push('How do I check if my answer is right?');
    }

    // Subject-specific suggestions
    if (this.context.subject.toLowerCase().includes('math')) {
      suggestions.push('Can you show me a practice problem?');
    }

    if (this.context.subject.toLowerCase().includes('science')) {
      suggestions.push('How do scientists use this knowledge?');
    }

    return suggestions;
  }

  /**
   * Generate educational resources related to the response
   */
  private generateEducationalResources(originalQuestion: string, response: string): EducationalResource[] {
    const resources: EducationalResource[] = [];
    
    // Use prompt builder's resource logic as base
    const baseResources = this.promptBuilder.buildResourceSuggestions(originalQuestion);
    
    // Add response-specific resources
    const responseSpecific = this.generateResponseSpecificResources(response);
    
    // Convert to EducationalResource format
    baseResources.forEach(resource => {
      resources.push({
        title: resource.title,
        description: resource.description,
        type: resource.type,
      });
    });

    resources.push(...responseSpecific);

    // Add concept card vocabulary as a resource if relevant terms were used
    if (this.wasVocabularyUsed(response)) {
      resources.push({
        title: 'Key Vocabulary',
        description: `Review important terms for ${this.context.subject}`,
        type: 'concept',
        metadata: {
          vocabularyTerms: Object.keys(this.context.vocabularyMap).slice(0, 5),
        },
      });
    }

    // Add misconceptions resource if relevant
    if (this.context.originalContext.misconceptions.length > 0) {
      resources.push({
        title: 'Common Mistakes to Avoid',
        description: 'Learn about common misconceptions in this topic',
        type: 'concept',
        metadata: {
          misconceptions: this.context.originalContext.misconceptions.slice(0, 3),
        },
      });
    }

    return resources.slice(0, 4); // Limit to 4 resources
  }

  /**
   * Generate resources based on response content
   */
  private generateResponseSpecificResources(response: string): EducationalResource[] {
    const resources: EducationalResource[] = [];
    const lowerResponse = response.toLowerCase();

    // Mathematical formulas and calculations
    if (lowerResponse.includes('formula') || lowerResponse.includes('calculate')) {
      resources.push({
        title: 'Formula Practice',
        description: 'Interactive practice with mathematical formulas',
        type: 'widget',
        metadata: { interactionType: 'calculation' },
      });
    }

    // Visual/geometric content
    if (lowerResponse.includes('shape') || lowerResponse.includes('area') || lowerResponse.includes('volume')) {
      resources.push({
        title: 'Visual Shape Explorer',
        description: 'Explore shapes and their properties interactively',
        type: 'widget',
        metadata: { interactionType: 'visualization' },
      });
    }

    // Step-by-step processes
    if (lowerResponse.includes('step') || lowerResponse.includes('first') || lowerResponse.includes('then')) {
      resources.push({
        title: 'Step-by-Step Guide',
        description: 'Guided practice through problem-solving steps',
        type: 'practice',
        metadata: { guidance: 'step-by-step' },
      });
    }

    return resources;
  }

  /**
   * Check if vocabulary terms were used in the response
   */
  private wasVocabularyUsed(response: string): boolean {
    const lowerResponse = response.toLowerCase();
    
    return Object.keys(this.context.vocabularyMap).some(term => 
      lowerResponse.includes(term.toLowerCase())
    );
  }


  /**
   * Add mathematical formatting markers for Flutter rendering
   */
  addMathematicalMarkers(content: string): string {
    let marked = content;

    // Mark equations for special rendering
    marked = marked.replace(
      /\*\*([^*]*=\s*[^*]*)\*\*/g,
      '<math>$1</math>'
    );

    // Mark mathematical operations
    marked = marked.replace(
      /(\d+\s*[×÷+\-]\s*\d+)/g,
      '<math>$1</math>'
    );

    // Mark units
    marked = marked.replace(
      /(\d+\s*(?:cm²|m²|km²|mm²|in²|ft²|cm³|m³|km³|mm³|in³|ft³|cm|m|km|mm|in|ft|%))/g,
      '<math>$1</math>'
    );

    return marked;
  }

  /**
   * Format response for specific age group
   */
  formatForAgeGroup(content: string, ageRange: string): string {
    const [minAge, maxAge] = ageRange.split('-').map(age => parseInt(age.trim()));
    const averageAge = (minAge + maxAge) / 2;

    // Adjust language complexity based on age
    if (averageAge < 11) {
      // Younger students - simpler language
      return this.simplifyForYoungerStudents(content);
    } else if (averageAge > 14) {
      // Older students - can handle more complex language
      return this.enhanceForOlderStudents(content);
    }

    return content; // Middle age range - keep as is
  }

  /**
   * Simplify language for younger students
   */
  private simplifyForYoungerStudents(content: string): string {
    let simplified = content;

    // Replace complex words with simpler alternatives
    const simplifications: Record<string, string> = {
      'calculate': 'work out',
      'determine': 'find',
      'obtain': 'get',
      'utilize': 'use',
      'demonstrate': 'show',
      'identify': 'find',
      'approximately': 'about',
      'subsequently': 'then',
      'consequently': 'so',
      'furthermore': 'also',
    };

    for (const [complex, simple] of Object.entries(simplifications)) {
      const regex = new RegExp(`\\b${complex}\\b`, 'gi');
      simplified = simplified.replace(regex, simple);
    }

    return simplified;
  }

  /**
   * Enhance language for older students
   */
  private enhanceForOlderStudents(content: string): string {
    // For older students, we can use more precise terminology
    // This is less critical than simplification, so minimal changes
    return content;
  }
}
// Context processor for extracting educational context from any concept card
// Dynamically processes concept cards from any subject or topic

import { ConceptContext, ProcessedContext } from './types';

/**
 * Processes concept card context for AI understanding
 * Works universally across all subjects and topics
 */
export class ConceptContextProcessor {
  
  /**
   * Process concept context into AI-ready format
   */
  async process(context: ConceptContext): Promise<ProcessedContext> {
    console.log('📋 Processing concept context:', {
      subject: context.subject,
      competencyLevel: context.competencyLevel,
      cognitiveLevel: context.cognitiveLevel,
      vocabularyCount: Object.keys(context.vocabulary).length,
      conceptsCount: context.keyConcepts.length,
    });

    // Extract and clean vocabulary
    const vocabularyMap = this.processVocabulary(context.vocabulary);
    
    // Extract key concepts from multiple sources
    const keyConcepts = this.extractKeyConcepts(context);
    
    // Build comprehensive relevant terms set
    const relevantTerms = this.buildRelevantTermsSet(context, keyConcepts);
    
    // Determine age range and complexity
    const estimatedAgeRange = this.getAgeRange(context.competencyLevel);
    const complexityLevel = this.getComplexityLevel(context.competencyLevel, context.cognitiveLevel);
    
    // Extract educational keywords for topic validation
    const educationalKeywords = this.extractEducationalKeywords(context);
    
    // Define topic scope for validation
    const topicScope = this.defineTopicScope(context);

    const processed: ProcessedContext = {
      originalContext: context,
      vocabularyMap,
      keyConcepts,
      relevantTerms,
      subject: context.subject,
      estimatedAgeRange,
      complexityLevel,
      educationalKeywords,
      topicScope,
    };

    console.log('✅ Context processing completed:', {
      vocabularyTerms: Object.keys(vocabularyMap).length,
      keyConcepts: keyConcepts.length,
      relevantTermsCount: relevantTerms.size,
      ageRange: estimatedAgeRange,
      complexity: complexityLevel,
      educationalKeywords: educationalKeywords.length,
      topicScope: topicScope.length,
    });

    return processed;
  }

  /**
   * Process and clean vocabulary terms
   */
  private processVocabulary(rawVocabulary: Record<string, string>): Record<string, string> {
    const processed: Record<string, string> = {};
    
    for (const [term, definition] of Object.entries(rawVocabulary)) {
      const cleanTerm = term.trim();
      const cleanDefinition = definition.trim();
      
      if (cleanTerm && cleanDefinition) {
        processed[cleanTerm] = cleanDefinition;
      }
    }
    
    return processed;
  }

  /**
   * Extract key concepts from multiple sources in the concept card
   */
  private extractKeyConcepts(context: ConceptContext): string[] {
    const concepts = new Set<string>();
    
    // Add explicitly provided key concepts
    context.keyConcepts.forEach(concept => {
      if (concept.trim()) {
        concepts.add(concept.trim());
      }
    });
    
    // Extract concepts from vocabulary keys
    Object.keys(context.vocabulary).forEach(term => {
      concepts.add(term.trim());
    });
    
    // Extract concepts from key question (look for important terms)
    const keyQuestionConcepts = this.extractConceptsFromText(context.keyQuestion);
    keyQuestionConcepts.forEach(concept => concepts.add(concept));
    
    // Extract concepts from learning objectives
    context.learningObjectives.forEach(objective => {
      const objectiveConcepts = this.extractConceptsFromText(objective);
      objectiveConcepts.forEach(concept => concepts.add(concept));
    });
    
    // Extract concepts from core explanation (look for bold/emphasized terms)
    const explanationConcepts = this.extractConceptsFromExplanation(context.coreExplanation);
    explanationConcepts.forEach(concept => concepts.add(concept));
    
    return Array.from(concepts).filter(concept => concept.length >= 3); // Filter out very short terms
  }

  /**
   * Extract important terms from text using various heuristics
   */
  private extractConceptsFromText(text: string): string[] {
    if (!text) return [];
    
    const concepts: string[] = [];
    
    // Extract quoted terms
    const quotedTerms = text.match(/"([^"]+)"/g);
    if (quotedTerms) {
      quotedTerms.forEach(quoted => {
        concepts.push(quoted.replace(/"/g, '').trim());
      });
    }
    
    // Extract capitalized terms (proper nouns, important concepts)
    const capitalizedTerms = text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g);
    if (capitalizedTerms) {
      capitalizedTerms.forEach(term => {
        if (term.length > 3 && !this.isCommonWord(term.toLowerCase())) {
          concepts.push(term.trim());
        }
      });
    }
    
    // Extract mathematical or scientific terms
    const technicalTerms = text.match(/\b\w*(?:tion|sion|ment|ness|ity|ism|ics|ogy|phy)\b/gi);
    if (technicalTerms) {
      technicalTerms.forEach(term => {
        if (term.length > 4 && !this.isCommonWord(term.toLowerCase())) {
          concepts.push(term.trim());
        }
      });
    }
    
    return concepts;
  }

  /**
   * Extract concepts from explanation text (look for emphasized terms)
   */
  private extractConceptsFromExplanation(explanation: string): string[] {
    if (!explanation) return [];
    
    const concepts: string[] = [];
    
    // Extract bold terms (**term**)
    const boldTerms = explanation.match(/\*\*([^*]+)\*\*/g);
    if (boldTerms) {
      boldTerms.forEach(bold => {
        const term = bold.replace(/\*\*/g, '').trim();
        if (term.length > 2) {
          concepts.push(term);
        }
      });
    }
    
    // Extract italic terms (*term*)
    const italicTerms = explanation.match(/\*([^*]+)\*/g);
    if (italicTerms) {
      italicTerms.forEach(italic => {
        const term = italic.replace(/\*/g, '').trim();
        if (term.length > 2 && !boldTerms?.some(bold => bold.includes(term))) {
          concepts.push(term);
        }
      });
    }
    
    // Extract terms in caps
    const capsTerms = explanation.match(/\b[A-Z]{2,}\b/g);
    if (capsTerms) {
      capsTerms.forEach(caps => {
        if (caps.length > 2 && caps !== 'THE' && caps !== 'AND' && caps !== 'FOR') {
          concepts.push(caps.toLowerCase());
        }
      });
    }
    
    return concepts;
  }

  /**
   * Build comprehensive set of relevant terms for topic validation
   */
  private buildRelevantTermsSet(context: ConceptContext, keyConcepts: string[]): Set<string> {
    const terms = new Set<string>();
    
    // Add subject
    terms.add(context.subject.toLowerCase());
    
    // Add all vocabulary terms and their variants
    Object.keys(context.vocabulary).forEach(term => {
      terms.add(term.toLowerCase());
      // Add plural/singular variants
      if (term.endsWith('s')) {
        terms.add(term.slice(0, -1).toLowerCase());
      } else {
        terms.add((term + 's').toLowerCase());
      }
    });
    
    // Add key concepts and their variants
    keyConcepts.forEach(concept => {
      const lower = concept.toLowerCase();
      terms.add(lower);
      
      // Add individual words from multi-word concepts
      const words = lower.split(/\s+/);
      words.forEach(word => {
        if (word.length > 3 && !this.isCommonWord(word)) {
          terms.add(word);
        }
      });
    });
    
    // Add subject-specific terms based on the domain
    const domainTerms = this.getSubjectDomainTerms(context.subject);
    domainTerms.forEach(term => terms.add(term));
    
    // Extract terms from key question
    const questionWords = context.keyQuestion.toLowerCase().split(/\s+/);
    questionWords.forEach(word => {
      const cleanWord = word.replace(/[^\w]/g, '');
      if (cleanWord.length > 3 && !this.isCommonWord(cleanWord)) {
        terms.add(cleanWord);
      }
    });
    
    return terms;
  }

  /**
   * Get domain-specific terms based on subject
   */
  private getSubjectDomainTerms(subject: string): string[] {
    const subjectLower = subject.toLowerCase();
    
    const domainTerms: Record<string, string[]> = {
      'mathematics': ['formula', 'equation', 'calculate', 'solve', 'graph', 'function', 'variable', 'number', 'ratio', 'percentage', 'geometry', 'algebra', 'measurement'],
      'measurement': ['measure', 'length', 'width', 'height', 'area', 'volume', 'surface', 'perimeter', 'diameter', 'radius', 'circumference', 'units', 'metric', 'distance', 'size', 'dimension', 'calculate', 'ruler', 'scale', 'cylinder', 'rectangle', 'square', 'circle', 'triangle'],
      'science': ['experiment', 'hypothesis', 'theory', 'observation', 'method', 'data', 'analysis', 'conclusion', 'evidence', 'research', 'biology', 'chemistry', 'physics'],
      'english': ['literature', 'writing', 'grammar', 'vocabulary', 'reading', 'comprehension', 'essay', 'story', 'character', 'plot', 'theme', 'analysis'],
      'history': ['timeline', 'event', 'period', 'civilization', 'culture', 'society', 'government', 'war', 'revolution', 'empire', 'dynasty', 'archaeology'],
      'geography': ['location', 'climate', 'terrain', 'population', 'country', 'continent', 'ocean', 'mountain', 'river', 'city', 'region', 'environment'],
      'art': ['creative', 'design', 'color', 'technique', 'style', 'medium', 'composition', 'expression', 'visual', 'aesthetic', 'culture', 'history'],
    };
    
    // Find matching domain
    for (const [domain, terms] of Object.entries(domainTerms)) {
      if (subjectLower.includes(domain) || domain.includes(subjectLower)) {
        return terms;
      }
    }
    
    return [];
  }

  /**
   * Extract educational keywords for AI prompt context
   */
  private extractEducationalKeywords(context: ConceptContext): string[] {
    const keywords: string[] = [];
    
    // Add competency and cognitive levels
    keywords.push(context.competencyLevel);
    keywords.push(context.cognitiveLevel);
    
    // Add subject
    keywords.push(context.subject);
    
    // Add top vocabulary terms (most important concepts)
    const vocabTerms = Object.keys(context.vocabulary).slice(0, 5);
    keywords.push(...vocabTerms);
    
    // Add top key concepts
    const topConcepts = context.keyConcepts.slice(0, 5);
    keywords.push(...topConcepts);
    
    return keywords.filter(keyword => keyword && keyword.trim().length > 0);
  }

  /**
   * Define topic scope for validation
   */
  private defineTopicScope(context: ConceptContext): string[] {
    const scope: string[] = [];
    
    // Primary subject
    scope.push(context.subject);
    
    // Extract topic from key question
    const questionTopic = this.extractTopicFromQuestion(context.keyQuestion);
    if (questionTopic) {
      scope.push(questionTopic);
    }
    
    // Add major concepts as scope items
    const majorConcepts = context.keyConcepts.filter(concept => concept.length > 5);
    scope.push(...majorConcepts.slice(0, 3));
    
    // Add vocabulary categories
    const vocabCategories = this.categorizeVocabulary(context.vocabulary);
    scope.push(...vocabCategories);
    
    return scope;
  }

  /**
   * Extract main topic from the key question
   */
  private extractTopicFromQuestion(keyQuestion: string): string | null {
    if (!keyQuestion) return null;
    
    // Look for topic indicators
    const topicPatterns = [
      /about\s+(\w+(?:\s+\w+)*)/i,
      /of\s+(\w+(?:\s+\w+)*)/i,
      /with\s+(\w+(?:\s+\w+)*)/i,
      /using\s+(\w+(?:\s+\w+)*)/i,
      /(\w+(?:\s+\w+)*)\s+formulas?/i,
      /calculate\s+(\w+(?:\s+\w+)*)/i,
      /understand\s+(\w+(?:\s+\w+)*)/i,
    ];
    
    for (const pattern of topicPatterns) {
      const match = keyQuestion.match(pattern);
      if (match && match[1]) {
        const topic = match[1].trim();
        if (topic.length > 3 && !this.isCommonWord(topic.toLowerCase())) {
          return topic;
        }
      }
    }
    
    return null;
  }

  /**
   * Categorize vocabulary into topic areas
   */
  private categorizeVocabulary(vocabulary: Record<string, string>): string[] {
    const categories: string[] = [];
    const terms = Object.keys(vocabulary);
    
    // Simple categorization based on term patterns
    if (terms.some(term => /area|volume|measurement|length|width|height/i.test(term))) {
      categories.push('measurement');
    }
    
    if (terms.some(term => /formula|equation|calculate|solve/i.test(term))) {
      categories.push('calculation');
    }
    
    if (terms.some(term => /triangle|rectangle|circle|polygon|shape/i.test(term))) {
      categories.push('geometry');
    }
    
    if (terms.some(term => /probability|chance|outcome|event/i.test(term))) {
      categories.push('probability');
    }
    
    if (terms.some(term => /data|graph|chart|statistics/i.test(term))) {
      categories.push('statistics');
    }
    
    return categories;
  }

  /**
   * Get age range based on competency level
   */
  private getAgeRange(competencyLevel: string): string {
    const ageRanges: Record<string, string> = {
      'foundation': '9-11',
      'developing': '10-12',
      'consolidating': '11-13',
      'extending': '12-14',
      'proficient': '13-16',
    };
    
    return ageRanges[competencyLevel] || '10-14';
  }

  /**
   * Get complexity level based on competency and cognitive levels
   */
  private getComplexityLevel(
    competencyLevel: string, 
    cognitiveLevel: string
  ): 'basic' | 'intermediate' | 'advanced' {
    // Map competency levels
    if (competencyLevel === 'foundation') return 'basic';
    if (competencyLevel === 'proficient' || competencyLevel === 'extending') return 'advanced';
    
    // Map cognitive levels
    if (cognitiveLevel === 'remember' || cognitiveLevel === 'understand') return 'basic';
    if (cognitiveLevel === 'evaluate' || cognitiveLevel === 'create') return 'advanced';
    
    return 'intermediate';
  }

  /**
   * Check if a word is a common word that should be filtered out
   */
  private isCommonWord(word: string): boolean {
    const commonWords = new Set([
      'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'her', 'was', 'one', 'our', 
      'had', 'what', 'when', 'where', 'how', 'why', 'will', 'with', 'this', 'that', 'they', 
      'have', 'from', 'would', 'there', 'their', 'been', 'said', 'each', 'which', 'them', 
      'than', 'many', 'some', 'time', 'very', 'when', 'much', 'then', 'these', 'know', 'take', 
      'into', 'year', 'your', 'good', 'could', 'should', 'over', 'think', 'also', 'back', 
      'after', 'first', 'well', 'want', 'give', 'look', 'here', 'other', 'feel', 'seem', 
      'come', 'just', 'like', 'long', 'make', 'work', 'life', 'only', 'need', 'such', 'even', 
      'most', 'used', 'find', 'still', 'between', 'through', 'about', 'using', 'does', 'help'
    ]);
    
    return commonWords.has(word.toLowerCase());
  }
}
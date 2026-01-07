/**
 * AI Chat Validation Script
 * Tests DeepSeek and Gemini APIs with real concept cards
 * Validates response quality, accuracy, and educational value
 */

const fs = require('fs').promises;
const path = require('path');

// Import AI wrapper functions
const { generateGeminiEducationalResponse, generateDeepSeekEducationalResponse } = require('./src/concept-chat/ai-wrappers');

/**
 * Test concept cards data
 */
const TEST_CARDS = [
  {
    id: 'angles-developing-a',
    path: '/Users/srini/code/my_learning_path/content/universal-cards/angles-developing-a.json',
    subject: 'Geometry',
    level: 'developing',
    questions: [
      'What is the triangle sum rule?',
      'How do I find missing angles when two lines cross?',
      'Can you explain vertically opposite angles with an example?',
      'What are the steps to solve a multi-step angle problem?',
      'Why do angles on a straight line add to 180°?'
    ]
  },
  {
    id: 'algebraic-techniques-extending',
    path: '/Users/srini/code/my_learning_path/content/universal-cards/algebraic-techniques-extending-a.json',
    subject: 'Algebra',
    level: 'extending',
    questions: [
      'How do I factor 6x² + 11x + 3 using the AC method?',
      'What is the difference between factoring by grouping and the AC method?',
      'Can you show me how to simplify algebraic fractions with quadratic factors?',
      'What are the common mistakes when factoring non-monic quadratics?',
      'How do I know which factoring method to choose?'
    ]
  },
  {
    id: 'equations-proficient',
    path: '/Users/srini/code/my_learning_path/content/universal-cards/equations-proficient.json',
    subject: 'Algebra',
    level: 'proficient',
    questions: [
      'How do I solve systems of linear equations using substitution?',
      'What is the elimination method for solving simultaneous equations?',
      'Can you show me how to rearrange literal equations?',
      'How do I build equations from word problems?',
      'When should I choose substitution vs elimination?'
    ]
  }
];

/**
 * Load and parse concept card
 */
async function loadConceptCard(cardPath) {
  try {
    const content = await fs.readFile(cardPath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`❌ Failed to load concept card: ${cardPath}`, error.message);
    return null;
  }
}

/**
 * Build concept context from card data
 */
function buildConceptContext(card) {
  const universalContent = card.universalContent || {};
  
  // Extract vocabulary map
  const vocabularyMap = {};
  if (card.keyVocabulary) {
    card.keyVocabulary.forEach(item => {
      if (item.term && item.definition) {
        vocabularyMap[item.term] = item.definition;
      }
    });
  }
  
  // Extract misconceptions
  const misconceptions = (universalContent.misconceptions || [])
    .map(item => item.misconception || '')
    .filter(text => text.length > 0);
  
  return {
    keyQuestion: universalContent.keyQuestion || 'How do we understand this concept?',
    conceptOverview: universalContent.conceptOverview?.content || '',
    coreExplanation: universalContent.coreExplanation?.content || '',
    vocabulary: vocabularyMap,
    misconceptions,
    subject: card.topic?.subject || 'Mathematics',
    competencyLevel: card.competencyLevel || 'developing',
    cognitiveLevel: card.cognitiveLevel || 'apply',
    learningObjectives: [
      `Understand the concept of ${card.topic?.title || 'this topic'}`,
      `Apply knowledge in problem-solving situations`,
      'Identify key vocabulary and concepts'
    ],
    keyConcepts: [
      card.topic?.title || 'concept',
      ...Object.keys(vocabularyMap).slice(0, 3)
    ]
  };
}

/**
 * Build educational prompt
 */
function buildEducationalPrompt(question, conceptContext) {
  const systemPrompt = `You are a warm, encouraging AI tutor specializing in ${conceptContext.subject}. 

CONTEXT:
- Topic: ${conceptContext.keyQuestion}
- Level: ${conceptContext.competencyLevel} (cognitive: ${conceptContext.cognitiveLevel})
- Subject: ${conceptContext.subject}

KEY CONCEPTS: ${conceptContext.keyConcepts.join(', ')}

VOCABULARY:
${Object.entries(conceptContext.vocabulary).map(([term, def]) => `• ${term}: ${def}`).join('\n')}

COMMON MISCONCEPTIONS TO ADDRESS:
${conceptContext.misconceptions.map(misc => `• ${misc}`).join('\n')}

CORE EXPLANATION CONTEXT:
${conceptContext.coreExplanation.substring(0, 500)}...

GUIDELINES:
- Be warm, encouraging, and supportive
- Explain clearly at the ${conceptContext.competencyLevel} level
- Use examples and step-by-step reasoning
- Address common misconceptions proactively
- Keep responses concise (2-4 paragraphs max)
- Use mathematical notation where appropriate
- End with an encouraging note

Remember: You're helping a student who is learning. Be patient and build confidence.`;

  const userPrompt = `Student Question: "${question}"

Please provide a helpful, encouraging response that explains the concept clearly and helps the student understand. Use the context provided above to give relevant examples and address any misconceptions.`;

  return { systemPrompt, userPrompt };
}

/**
 * Test AI provider with specific question
 */
async function testProvider(provider, question, conceptContext, cardInfo) {
  const startTime = Date.now();
  
  try {
    console.log(`\n🧠 Testing ${provider.toUpperCase()}: "${question}"`);
    console.log(`   📚 Card: ${cardInfo.id} (${cardInfo.subject} - ${cardInfo.level})`);
    
    const { systemPrompt, userPrompt } = buildEducationalPrompt(question, conceptContext);
    
    let response;
    if (provider === 'gemini') {
      response = await generateGeminiEducationalResponse({
        systemPrompt,
        userPrompt,
        maxTokens: 300
      });
    } else {
      response = await generateDeepSeekEducationalResponse({
        systemPrompt,
        userPrompt,
        maxTokens: 300
      });
    }
    
    const duration = Date.now() - startTime;
    
    // Analyze response quality
    const analysis = analyzeResponse(response, question, conceptContext);
    
    console.log(`   ⏱️  Duration: ${duration}ms`);
    console.log(`   📏 Length: ${response.length} characters`);
    console.log(`   📊 Quality Score: ${analysis.overallScore}/10`);
    console.log(`   ✅ Educational Value: ${analysis.educationalValue}`);
    console.log(`   🎯 Topic Relevance: ${analysis.topicRelevance}`);
    console.log(`   💝 Tone Assessment: ${analysis.toneAssessment}`);
    
    if (analysis.concerns.length > 0) {
      console.log(`   ⚠️  Concerns: ${analysis.concerns.join(', ')}`);
    }
    
    console.log(`   💬 Response Preview:`);
    console.log(`      "${response.substring(0, 150)}..."`);
    
    return {
      provider,
      question,
      response,
      duration,
      analysis,
      cardInfo,
      success: true
    };
    
  } catch (error) {
    const duration = Date.now() - startTime;
    console.log(`   ❌ Error: ${error.message}`);
    console.log(`   ⏱️  Duration: ${duration}ms`);
    
    return {
      provider,
      question,
      response: null,
      duration,
      error: error.message,
      cardInfo,
      success: false
    };
  }
}

/**
 * Analyze response quality and educational value
 */
function analyzeResponse(response, question, conceptContext) {
  const analysis = {
    overallScore: 0,
    educationalValue: 'medium',
    topicRelevance: 'good',
    toneAssessment: 'neutral',
    concerns: [],
    strengths: []
  };
  
  // Check response length (should be substantial but not too long)
  if (response.length < 50) {
    analysis.concerns.push('too-short');
    analysis.overallScore -= 2;
  } else if (response.length > 1000) {
    analysis.concerns.push('too-long');
    analysis.overallScore -= 1;
  } else {
    analysis.strengths.push('appropriate-length');
    analysis.overallScore += 1;
  }
  
  const lowerResponse = response.toLowerCase();
  
  // Check for encouraging tone
  const encouragingWords = ['great', 'excellent', 'wonderful', 'good', 'nice', 'well done', 'exactly', 'perfect'];
  const hasEncouragement = encouragingWords.some(word => lowerResponse.includes(word));
  if (hasEncouragement) {
    analysis.toneAssessment = 'encouraging';
    analysis.strengths.push('warm-tone');
    analysis.overallScore += 1;
  }
  
  // Check for mathematical content
  const hasMath = /\d+°|\d+x|\d+=|\d+\+|\d+-|\d+×|\d+÷/.test(response) || 
                 lowerResponse.includes('equation') || 
                 lowerResponse.includes('formula') ||
                 lowerResponse.includes('angle');
  if (hasMath) {
    analysis.strengths.push('contains-math');
    analysis.overallScore += 1;
  }
  
  // Check for examples
  const hasExample = lowerResponse.includes('example') || 
                    lowerResponse.includes('for instance') ||
                    lowerResponse.includes('let\'s say') ||
                    lowerResponse.includes('imagine');
  if (hasExample) {
    analysis.strengths.push('includes-examples');
    analysis.overallScore += 1;
  }
  
  // Check for step-by-step explanation
  const hasSteps = lowerResponse.includes('step') || 
                  lowerResponse.includes('first') || 
                  lowerResponse.includes('then') ||
                  lowerResponse.includes('next') ||
                  /\d+\)|\d+\./.test(response);
  if (hasSteps) {
    analysis.strengths.push('step-by-step');
    analysis.overallScore += 1;
  }
  
  // Check topic relevance by looking for key terms
  const relevantTerms = [
    ...conceptContext.keyConcepts.map(c => c.toLowerCase()),
    ...Object.keys(conceptContext.vocabulary).map(v => v.toLowerCase()),
    conceptContext.subject.toLowerCase()
  ];
  
  const relevanceCount = relevantTerms.filter(term => 
    lowerResponse.includes(term.toLowerCase())
  ).length;
  
  if (relevanceCount >= 3) {
    analysis.topicRelevance = 'excellent';
    analysis.strengths.push('highly-relevant');
    analysis.overallScore += 2;
  } else if (relevanceCount >= 1) {
    analysis.topicRelevance = 'good';
    analysis.strengths.push('relevant');
    analysis.overallScore += 1;
  } else {
    analysis.topicRelevance = 'poor';
    analysis.concerns.push('low-relevance');
    analysis.overallScore -= 1;
  }
  
  // Check for misconceptions addressed
  const addressesMisconceptions = conceptContext.misconceptions.some(misc => 
    lowerResponse.includes(misc.toLowerCase().substring(0, 20))
  );
  if (addressesMisconceptions) {
    analysis.strengths.push('addresses-misconceptions');
    analysis.overallScore += 1;
  }
  
  // Determine educational value
  if (analysis.overallScore >= 7) {
    analysis.educationalValue = 'high';
  } else if (analysis.overallScore >= 4) {
    analysis.educationalValue = 'medium';
  } else {
    analysis.educationalValue = 'low';
  }
  
  // Ensure score is within bounds
  analysis.overallScore = Math.max(0, Math.min(10, analysis.overallScore + 5)); // Base score of 5
  
  return analysis;
}

/**
 * Generate comparison report
 */
function generateReport(allResults) {
  console.log('\n📊 ===== AI CHAT VALIDATION REPORT =====\n');
  
  // Group results by provider
  const geminiResults = allResults.filter(r => r.provider === 'gemini' && r.success);
  const deepseekResults = allResults.filter(r => r.provider === 'deepseek' && r.success);
  
  console.log('🎯 OVERVIEW:');
  console.log(`   Total Tests: ${allResults.length}`);
  console.log(`   Successful: ${allResults.filter(r => r.success).length}`);
  console.log(`   Failed: ${allResults.filter(r => !r.success).length}`);
  
  if (geminiResults.length > 0) {
    console.log('\n🧠 GEMINI PERFORMANCE:');
    const avgScore = geminiResults.reduce((sum, r) => sum + r.analysis.overallScore, 0) / geminiResults.length;
    const avgDuration = geminiResults.reduce((sum, r) => sum + r.duration, 0) / geminiResults.length;
    const highQuality = geminiResults.filter(r => r.analysis.educationalValue === 'high').length;
    
    console.log(`   Average Quality Score: ${avgScore.toFixed(1)}/10`);
    console.log(`   Average Response Time: ${avgDuration.toFixed(0)}ms`);
    console.log(`   High Educational Value: ${highQuality}/${geminiResults.length}`);
    console.log(`   Success Rate: ${(geminiResults.length / (allResults.length / 2) * 100).toFixed(1)}%`);
  }
  
  if (deepseekResults.length > 0) {
    console.log('\n🤖 DEEPSEEK PERFORMANCE:');
    const avgScore = deepseekResults.reduce((sum, r) => sum + r.analysis.overallScore, 0) / deepseekResults.length;
    const avgDuration = deepseekResults.reduce((sum, r) => sum + r.duration, 0) / deepseekResults.length;
    const highQuality = deepseekResults.filter(r => r.analysis.educationalValue === 'high').length;
    
    console.log(`   Average Quality Score: ${avgScore.toFixed(1)}/10`);
    console.log(`   Average Response Time: ${avgDuration.toFixed(0)}ms`);
    console.log(`   High Educational Value: ${highQuality}/${deepseekResults.length}`);
    console.log(`   Success Rate: ${(deepseekResults.length / (allResults.length / 2) * 100).toFixed(1)}%`);
  }
  
  // Compare providers
  if (geminiResults.length > 0 && deepseekResults.length > 0) {
    console.log('\n⚖️ COMPARISON:');
    const geminiAvgScore = geminiResults.reduce((sum, r) => sum + r.analysis.overallScore, 0) / geminiResults.length;
    const deepseekAvgScore = deepseekResults.reduce((sum, r) => sum + r.analysis.overallScore, 0) / deepseekResults.length;
    const geminiAvgTime = geminiResults.reduce((sum, r) => sum + r.duration, 0) / geminiResults.length;
    const deepseekAvgTime = deepseekResults.reduce((sum, r) => sum + r.duration, 0) / deepseekResults.length;
    
    console.log(`   Quality Winner: ${geminiAvgScore > deepseekAvgScore ? 'Gemini' : 'DeepSeek'} (${Math.abs(geminiAvgScore - deepseekAvgScore).toFixed(1)} point difference)`);
    console.log(`   Speed Winner: ${geminiAvgTime < deepseekAvgTime ? 'Gemini' : 'DeepSeek'} (${Math.abs(geminiAvgTime - deepseekAvgTime).toFixed(0)}ms difference)`);
  }
  
  // Subject-specific analysis
  console.log('\n📚 SUBJECT PERFORMANCE:');
  const subjects = [...new Set(allResults.map(r => r.cardInfo.subject))];
  subjects.forEach(subject => {
    const subjectResults = allResults.filter(r => r.cardInfo.subject === subject && r.success);
    if (subjectResults.length > 0) {
      const avgScore = subjectResults.reduce((sum, r) => sum + r.analysis.overallScore, 0) / subjectResults.length;
      console.log(`   ${subject}: ${avgScore.toFixed(1)}/10 (${subjectResults.length} tests)`);
    }
  });
  
  // Show best and worst responses
  const successfulResults = allResults.filter(r => r.success);
  if (successfulResults.length > 0) {
    const bestResponse = successfulResults.sort((a, b) => b.analysis.overallScore - a.analysis.overallScore)[0];
    const worstResponse = successfulResults.sort((a, b) => a.analysis.overallScore - b.analysis.overallScore)[0];
    
    console.log('\n🏆 BEST RESPONSE:');
    console.log(`   Provider: ${bestResponse.provider.toUpperCase()}`);
    console.log(`   Question: "${bestResponse.question}"`);
    console.log(`   Score: ${bestResponse.analysis.overallScore}/10`);
    console.log(`   Strengths: ${bestResponse.analysis.strengths.join(', ')}`);
    console.log(`   Preview: "${bestResponse.response.substring(0, 200)}..."`);
    
    console.log('\n⚠️ NEEDS IMPROVEMENT:');
    console.log(`   Provider: ${worstResponse.provider.toUpperCase()}`);
    console.log(`   Question: "${worstResponse.question}"`);
    console.log(`   Score: ${worstResponse.analysis.overallScore}/10`);
    console.log(`   Concerns: ${worstResponse.analysis.concerns.join(', ')}`);
  }
  
  console.log('\n===== END VALIDATION REPORT =====\n');
}

/**
 * Main test execution
 */
async function runValidationTests() {
  console.log('🚀 Starting AI Chat Validation Tests...\n');
  
  const allResults = [];
  
  // Load all concept cards
  for (const testCard of TEST_CARDS) {
    console.log(`📖 Loading concept card: ${testCard.id}`);
    
    const card = await loadConceptCard(testCard.path);
    if (!card) {
      console.log(`   ❌ Failed to load card, skipping...`);
      continue;
    }
    
    const conceptContext = buildConceptContext(card);
    console.log(`   ✅ Loaded: ${card.topic?.title} (${card.competencyLevel})`);
    
    // Test each question with both providers
    for (const question of testCard.questions) {
      // Test Gemini
      const geminiResult = await testProvider('gemini', question, conceptContext, testCard);
      allResults.push(geminiResult);
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Test DeepSeek
      const deepseekResult = await testProvider('deepseek', question, conceptContext, testCard);
      allResults.push(deepseekResult);
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log(`   🎯 Completed testing ${testCard.questions.length} questions for ${testCard.id}`);
  }
  
  // Generate comprehensive report
  generateReport(allResults);
  
  // Save detailed results to file
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const resultsFile = `/Users/srini/code/my_learning_path/functions/validation_results_${timestamp}.json`;
  
  await fs.writeFile(resultsFile, JSON.stringify(allResults, null, 2));
  console.log(`📁 Detailed results saved to: ${resultsFile}`);
  
  return allResults;
}

// Run the tests if this file is executed directly
if (require.main === module) {
  runValidationTests().catch(console.error);
}

module.exports = {
  runValidationTests,
  testProvider,
  buildConceptContext,
  analyzeResponse
};
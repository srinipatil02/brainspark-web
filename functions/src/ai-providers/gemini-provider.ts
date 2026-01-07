/**
 * Google Gemini AI Provider
 * Supports both Gemini 2.5 Pro and Flash models
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from 'firebase-functions';
import { BaseAIProvider } from './base-provider';
import { QuestionGenerationRequest, GeneratedQuestion, AIProviderConfig } from './types';

export class GeminiProvider extends BaseAIProvider {
  private genAI: GoogleGenerativeAI;
  private model: any;
  
  public readonly name: string;
  public readonly modelId: string;

  constructor(config: AIProviderConfig, modelType: 'gemini-2-5-pro' | 'gemini-2-5-flash') {
    super(config);
    
    this.name = `Gemini ${modelType.includes('pro') ? '2.5 Pro' : '2.5 Flash'}`;
    this.modelId = modelType;
    
    this.genAI = new GoogleGenerativeAI(config.apiKey);
    
    // Map to actual Gemini model names
    const modelName = modelType === 'gemini-2-5-pro' 
      ? 'gemini-2.5-pro' 
      : 'gemini-2.5-flash';
    
    this.model = this.genAI.getGenerativeModel({ 
      model: modelName,
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192, // Increased from 4096 to 8192 to handle longer responses
      },
    });
  }

  protected async generateQuestionInternal(
    request: QuestionGenerationRequest, 
    requestId: string
  ): Promise<GeneratedQuestion> {
    
    try {
      const prompt = this.buildPrompt(request);
      
      logger.info(`📝 [${this.name}] AI Prompt prepared`, {
        requestId,
        promptLength: prompt.length,
        model: this.modelId,
        hasSkillDetails: !!request.skillDetails,
        questionType: request.questionType,
        difficulty: request.difficulty
      });

      logger.info(`🤖 [${this.name}] Sending request to Gemini`, {
        requestId,
        promptLength: prompt.length,
        model: this.modelId
      });

      const result = await this.model.generateContent(prompt);
      
      if (!result || !result.response) {
        throw this.createError('NETWORK_ERROR', 'No response received from Gemini');
      }

      const response = await result.response;
      const text = response.text();

      if (!text || typeof text !== 'string' || text.trim().length === 0) {
        throw this.createError('VALIDATION_ERROR', 'Empty response received from Gemini');
      }

      logger.info(`📝 [${this.name}] Raw response received`, {
        requestId,
        responseLength: text.length,
        preview: text.substring(0, 200)
      });

      // Parse JSON response with better error handling
      const parsedResponse = this.parseResponse(text, requestId);
      
      // Convert to our standard format
      const question = this.convertToStandardFormat(parsedResponse, request);
      
      return question;

    } catch (error) {
      logger.error(`❌ [${this.name}] Generation failed`, {
        requestId,
        errorType: error?.constructor?.name || 'Unknown',
        errorMessage: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });

      if (error instanceof Error && error.message.includes('API key')) {
        throw this.createError('AUTHENTICATION_ERROR', 'Invalid Gemini API key');
      }
      
      if (error instanceof Error && error.message.includes('quota')) {
        throw this.createError('RATE_LIMIT_ERROR', 'Gemini API quota exceeded', undefined, true);
      }

      if (error instanceof Error && error.message.includes('safety')) {
        throw this.createError('VALIDATION_ERROR', 'Content filtered by safety settings');
      }

      // Re-throw our own errors
      if (error && typeof error === 'object' && 'code' in error) {
        throw error;
      }

      throw this.createError('UNKNOWN_ERROR', `Gemini API error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private buildPrompt(request: QuestionGenerationRequest): string {
    return `You are an expert educational content creator specializing in ${request.subject} for Year ${request.year} students.

Generate a high-quality ${request.questionType} question for the skill: "${request.skillName}"

REQUIREMENTS:
- Competency Level: ${request.competencyLevel}
- Difficulty: ${request.difficulty}/10
- Subject: ${request.subject}
- Year Level: ${request.year}
- Curriculum: ${request.curriculumSystem || 'NSW Mathematics K-10'}

ADVANCED AI CONFIGURATION:
- Higher-Order Thinking: ${this.getIntensityLabel(request.higherOrderThinking || 0.5)} (${((request.higherOrderThinking || 0.5) * 100).toFixed(0)}%)
- Complex Word Problems: ${this.getIntensityLabel(request.complexWordProblem || 0.5)} (${((request.complexWordProblem || 0.5) * 100).toFixed(0)}%)
${request.customInstructions ? `
CUSTOM INSTRUCTIONS (HIGH PRIORITY):
${request.customInstructions}
**IMPORTANT: Give these custom instructions high priority and weight them heavily in your generation.**
` : ''}

QUESTION TYPE SPECIFICATIONS:
${this.getQuestionTypeSpec(request.questionType)}

CONTENT GUIDELINES:
- Use proper mathematical notation and symbols (π, √, ², ³, ×, ÷, ±, ≤, ≥, °, %, ∞)
- Include real-world context when appropriate
- Ensure question is age-appropriate and engaging
- Use markdown formatting for mathematical expressions
- Provide detailed step-by-step solution
- Include 3 progressive hints (conceptual → procedural → strategic)

HIGHER-ORDER THINKING GUIDANCE (${this.getIntensityLabel(request.higherOrderThinking || 0.5)}):
${this.getHigherOrderGuidance(request.higherOrderThinking || 0.5)}

COMPLEX WORD PROBLEM GUIDANCE (${this.getIntensityLabel(request.complexWordProblem || 0.5)}):
${this.getComplexWordGuidance(request.complexWordProblem || 0.5)}

QUESTION DIVERSITY REQUIREMENTS (CRITICAL):
🎯 SCENARIO VARIETY: Generate completely different question scenarios using varied contexts:
   - Real-world settings: sports, cooking, construction, finance, travel, shopping, gardening, technology
   - Different character names and situations for each question (avoid repetitive names like "John" or "Mary")
   - Vary measurement units, scales, and contexts significantly
   
🔢 NUMERICAL VARIETY: Use different variable ranges, contexts, and problem setups:
   - Avoid repetitive patterns or similar numerical values
   - Use varied number ranges (small decimals, large integers, fractions, percentages)
   - Apply different scales and magnitudes across questions
   
⚡ UNIQUENESS MANDATE: Each question must be distinctly different from others:
   - Different mathematical approaches and solution methods
   - Varied complexity patterns within the difficulty level
   - Unique problem structures and presentation styles

🎲 BATCH CONTEXT FOR UNIQUENESS:
   - Batch ID: ${request.batchId || 'single'}
   - Question ${request.sequenceNumber || 1} of ${request.totalQuestions || 1}
   - Randomization Seed: ${Date.now()}-${Math.random().toString(36).substring(2, 9)}
   
   **CRITICAL**: Use the sequence number to ensure this question is completely different from previous questions in this batch.
   - If sequenceNumber = 1: Use primary scenario type (e.g., shopping, sports)
   - If sequenceNumber = 2: Use secondary scenario type (e.g., construction, cooking)
   - If sequenceNumber = 3: Use tertiary scenario type (e.g., travel, gardening)
   - Continue varying scenarios systematically to avoid repetition within the batch

RESPONSE FORMAT:
Return ONLY a valid JSON object with this exact structure:

{
  "stem": "Question text with **markdown formatting** and mathematical symbols",
  "questionType": "${request.questionType}",
  ${this.getResponseFormat(request.questionType)}
  "solution": "Detailed step-by-step solution with markdown formatting",
  "hints": [
    {
      "level": 1,
      "content": "Conceptual hint to guide thinking without revealing the answer",
      "revealsCriticalInfo": false
    },
    {
      "level": 2,
      "content": "Procedural hint showing method or approach",
      "revealsCriticalInfo": false
    },
    {
      "level": 3,
      "content": "Strategic hint with specific guidance for solving",
      "revealsCriticalInfo": true
    }
  ],
  "widgets": [
    // SIMPLE DIAGRAM SELECTION: Choose appropriate diagrams for question clarity
    // Available diagram types:
    // GEOMETRY:
    // - "intersecting_lines" - Lines intersecting at a point with angle measurements
    // - "triangle" - Triangle with sides, angles, and labels  
    // - "circle" - Circle with radius, diameter, chords, sectors
    // - "coordinate_plane" - Cartesian plane with points and lines
    // AREA & SURFACE AREA CALCULATIONS:
    // - "rectangle_area" - Rectangle with labeled dimensions for area calculation
    // - "parallelogram_area" - Parallelogram with base and height labeled
    // - "trapezoid_area" - Trapezoid with parallel sides and height
    // - "circle_area" - Circle with radius/diameter for area calculation
    // - "rectangular_prism" - 3D rectangular prism for surface area/volume
    // DATA VISUALIZATION:
    // - "bar_chart_simple" - Basic bar charts for comparing quantities
    // - "line_graph" - Line graphs for trends and continuous data
    // - "scatter_plot" - Scatter plots for correlation analysis
    // - "data_table" - Tables for organizing data clearly
    // - "pie_chart_simple" - Simple pie charts for parts of a whole
    
    // CRITICAL: For intersecting lines diagrams, provide EXACT geometric configuration:
    {
      "widgetType": "intersecting_lines",
      "config": {
        "lines": ["AB", "CD"],           // Exactly which lines are mentioned in question
        "intersection": "O",             // Intersection point name from question text
        "rays": ["OE"],                  // Only rays explicitly mentioned in question
        "knownAngles": {"AOD": 110, "COE": 35}, // EXACT angles given in question stem
        "questionAngle": "BOE",          // The angle being asked about
        "lineAngles": {                  // REQUIRED: Specify exact angles for each line from horizontal
          "AB": 0,                       // Line AB is horizontal (0 degrees)
          "CD": 90                       // Line CD is vertical (90 degrees)  
        },
        "rayAngles": {                   // REQUIRED: Specify exact angle for each ray
          "OE": 45                       // Ray OE at 45 degrees from horizontal
        },
        "showLabels": true,
        "style": "clean"
      },
      "placement": "stem"
    }
  ],
  "contextualInformation": "Real-world context connecting to student experience",
  "realWorldApplication": "How this mathematics concept applies in real situations",
  "keyTakeaways": ["Main concept 1", "Main concept 2", "Main concept 3"],
  "commonMistakes": ["Typical error students make", "Another common misconception"],
  "extensions": ["How to extend this concept", "Related advanced topics"],
  "additionalTags": [
    {"category": "cognitive", "value": "problem-solving", "weight": 0.8},
    {"category": "skill", "value": "mathematical-reasoning", "weight": 0.9}
  ],
  "estimatedDifficulty": ${request.difficulty},
  "prerequisiteKnowledge": ["Concept students should know first", "Another prerequisite"],
  "learningObjectives": ["What students will learn", "Skills they will develop"],
  "assessmentCriteria": ["How to evaluate understanding", "Success indicators"]
}

DIAGRAM CONFIGURATION RULES:
1. **ACCURACY FIRST**: Diagrams must exactly match the question's geometric setup
2. **No Guesswork**: Provide precise angles, positions, and measurements based on question text
3. **Exact Correspondence**: Every element in the diagram must come from the question statement

FOR INTERSECTING LINES DIAGRAMS:
- Include "lineAngles" with exact degree measurements from horizontal (0° = horizontal, 90° = vertical)
- Include "rayAngles" with exact degree measurements for any rays mentioned
- Only include elements explicitly mentioned in the question text
- Use standard mathematical conventions: horizontal line = 0°, vertical line = 90°

GEOMETRIC ACCURACY EXAMPLES:
✅ CORRECT: Question mentions "Line AB is horizontal, line CD is vertical" → "lineAngles": {"AB": 0, "CD": 90}
✅ CORRECT: Question states "ray OE makes a 45° angle with AB" → "rayAngles": {"OE": 45}
❌ WRONG: Guessing positions or using arbitrary angles not mentioned in question

DIAGRAM INTELLIGENCE MATRIX:
GEOMETRY:
- Intersecting lines + angles → "intersecting_lines" (with exact lineAngles and rayAngles)
- Triangle problems → "triangle"  
- Circle geometry → "circle"
- Coordinate problems → "coordinate_plane"
AREA & SURFACE AREA CALCULATIONS:
- Rectangle area problems → "rectangle_area"
- Parallelogram area problems → "parallelogram_area"
- Trapezoid area problems → "trapezoid_area"
- Circle area problems → "circle_area"
- Rectangular prism surface area → "rectangular_prism"
DATA & STATISTICS:
- Comparing quantities → "bar_chart_simple"
- Trends over time → "line_graph"
- Correlation analysis → "scatter_plot"
- Organized data display → "data_table"
- Parts of whole → "pie_chart_simple"

CRITICAL: If geometric positions are not clearly specified in the question, use mathematical conventions (horizontal/vertical lines) and provide proper metadata.

Generate the question now:`;
  }

  private getQuestionTypeSpec(questionType: string): string {
    switch (questionType) {
      case 'MCQ':
        return `- Provide 4 plausible options (A, B, C, D)
- Only one correct answer
- Include distractors that reflect common misconceptions
- Provide brief feedback for each option`;
        
      case 'SPECIFIC_INPUT':
        return `- Expect a specific numerical or algebraic answer
- Define acceptable answer formats and tolerances
- Include units if applicable
- Allow for equivalent forms (e.g., 0.5 = 1/2)`;
        
      case 'SHORT_ANSWER':
        return `- Expect 1-3 sentence written response
- Define key points students should mention
- Provide sample answers with scoring rubric`;
        
      default:
        return '';
    }
  }

  private getResponseFormat(questionType: string): string {
    switch (questionType) {
      case 'MCQ':
        return `"mcqOptions": [
    {"id": "A", "text": "Option A text", "isCorrect": false, "feedback": "Brief explanation"},
    {"id": "B", "text": "Option B text", "isCorrect": false, "feedback": "Brief explanation"},
    {"id": "C", "text": "Option C text", "isCorrect": true, "feedback": "Brief explanation"},
    {"id": "D", "text": "Option D text", "isCorrect": false, "feedback": "Brief explanation"}
  ],`;

      case 'SPECIFIC_INPUT':
        return `"specificInput": {
    "expectedType": "number|fraction|equation|expression|coordinate|measurement",
    "acceptableAnswers": [
      {"value": "exact answer", "tolerance": 0.01, "format": "decimal"}
    ],
    "units": "units if applicable"
  },`;

      case 'SHORT_ANSWER':
        return `"shortAnswer": {
    "maxWords": 50,
    "keyPoints": [
      {"point": "Key concept 1", "weight": 0.4, "required": true},
      {"point": "Key concept 2", "weight": 0.3, "required": false},
      {"point": "Key concept 3", "weight": 0.3, "required": false}
    ]
  },`;

      default:
        return '';
    }
  }

  private parseResponse(text: string, requestId: string): any {
    try {
      if (!text || typeof text !== 'string') {
        throw new Error('Invalid text input - null, undefined, or not a string');
      }

      logger.info(`📝 [${this.name}] Parsing response`, {
        requestId,
        responseLength: text.length,
        responsePreview: text.substring(0, 300) + (text.length > 300 ? '...' : '')
      });

      // Clean the response - remove markdown code blocks and extra text
      let cleanedText = text.trim();
      
      // Remove markdown code blocks
      cleanedText = cleanedText.replace(/```json\s*/gi, '').replace(/```\s*/g, '');
      
      // Remove common AI prefixes/suffixes
      cleanedText = cleanedText.replace(/^Here's?\s+the\s+question:?\s*/i, '');
      cleanedText = cleanedText.replace(/^Here's?\s+a\s+.+?question:?\s*/i, '');
      cleanedText = cleanedText.replace(/I'll\s+create\s+.+?:/i, '');
      
      // Extract JSON from response (handle cases where AI adds extra text)
      let jsonText = cleanedText;
      
      // Try to find JSON object boundaries
      const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonText = jsonMatch[0];
      } else {
        // Try to find opening brace and take everything from there
        const openBraceIndex = cleanedText.indexOf('{');
        if (openBraceIndex >= 0) {
          jsonText = cleanedText.substring(openBraceIndex);
        } else {
          logger.warn(`⚠️ [${this.name}] No JSON braces found`, {
            requestId,
            cleanedPreview: cleanedText.substring(0, 200)
          });
          throw new Error('No JSON structure found in response');
        }
      }
      
      logger.info(`🔍 [${this.name}] Attempting to parse JSON`, {
        requestId,
        jsonLength: jsonText.length,
        jsonPreview: jsonText.substring(0, 200) + (jsonText.length > 200 ? '...' : '')
      });
      
      const parsed = JSON.parse(jsonText);
      
      // Validate required fields exist
      if (!parsed || typeof parsed !== 'object') {
        throw new Error('Parsed result is not an object');
      }

      if (!parsed.stem || typeof parsed.stem !== 'string') {
        throw new Error('Missing or invalid stem field');
      }

      if (!parsed.solution || typeof parsed.solution !== 'string') {
        throw new Error('Missing or invalid solution field');
      }

      if (!parsed.hints || !Array.isArray(parsed.hints)) {
        throw new Error('Missing or invalid hints field');
      }
      
      logger.info(`✅ [${this.name}] Successfully parsed JSON response`, {
        requestId,
        hasStem: !!parsed.stem,
        stemLength: parsed.stem?.length || 0,
        hasSolution: !!parsed.solution,
        solutionLength: parsed.solution?.length || 0,
        hasHints: !!parsed.hints,
        hintsCount: parsed.hints?.length || 0,
        hasMcqOptions: !!parsed.mcqOptions,
        mcqCount: parsed.mcqOptions?.length || 0,
        hasSpecificInput: !!parsed.specificInput,
        hasShortAnswer: !!parsed.shortAnswer,
        stemPreview: parsed.stem ? parsed.stem.substring(0, 100) + (parsed.stem.length > 100 ? '...' : '') : 'NO STEM'
      });
      
      return parsed;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const textPreview = text ? text.substring(0, 500) : 'NO TEXT';
      
      logger.error(`❌ [${this.name}] Failed to parse response`, {
        requestId,
        errorMessage,
        textLength: text?.length || 0,
        textPreview: textPreview,
        errorType: error?.constructor?.name || 'Unknown'
      });
      
      throw this.createError('VALIDATION_ERROR', `Invalid JSON response from Gemini: ${errorMessage}`);
    }
  }

  private convertToStandardFormat(parsedResponse: any, request: QuestionGenerationRequest): GeneratedQuestion {
    // Generate proper question ID following schema pattern
    const questionId = `qb-${Date.now().toString(16).padStart(8, '0')}-${Math.random().toString(16).substr(2, 4)}-${Math.random().toString(16).substr(2, 4)}-${Math.random().toString(16).substr(2, 4)}-${Math.random().toString(16).substr(2, 12)}`;

    // Process MCQ options with rich feedback per schema
    const mcqOptions = parsedResponse.mcqOptions?.map((option: any) => ({
      id: option.id || option.key || 'A',
      text: option.text || option.content || '',
      isCorrect: option.isCorrect || false,
      feedback: option.feedback || option.explanation || ''
    })) || undefined;

    // Process specific input with full validation per schema
    const specificInput = parsedResponse.specificInput ? {
      expectedType: parsedResponse.specificInput.expectedType || 'number',
      acceptableAnswers: parsedResponse.specificInput.acceptableAnswers?.map((answer: any) => ({
        value: answer.value || answer.answer || '',
        tolerance: answer.tolerance || 0.01,
        format: answer.format || 'decimal'
      })) || [],
      units: parsedResponse.specificInput.units || undefined,
      validationRules: parsedResponse.specificInput.validationRules || []
    } : undefined;

    // Process short answer with complete rubric per schema
    const shortAnswer = parsedResponse.shortAnswer ? {
      maxWords: parsedResponse.shortAnswer.maxWords || 50,
      keyPoints: parsedResponse.shortAnswer.keyPoints?.map((point: any) => ({
        point: point.point || point.content || '',
        weight: point.weight || 0.33,
        required: point.required || false
      })) || [],
      rubricVersion: parsedResponse.shortAnswer.rubricVersion || '1.0',
      sampleAnswers: parsedResponse.shortAnswer.sampleAnswers?.map((sample: any) => ({
        answer: sample.answer || '',
        score: sample.score || 0.8,
        feedback: sample.feedback || ''
      })) || []
    } : undefined;

    // Process hints ensuring they follow schema constraints
    const hints = parsedResponse.hints?.slice(0, 3).map((hint: any, index: number) => ({
      level: Math.min(Math.max(hint.level || (index + 1), 1), 3),
      content: hint.content || `Hint ${index + 1}`,
      revealsCriticalInfo: hint.revealsCriticalInfo || false
    })) || [];

    // Process widgets if present in response
    const widgets = parsedResponse.widgets?.map((widget: any) => ({
      widgetType: widget.widgetType || widget.type,
      config: widget.config || {},
      placement: widget.placement || 'stem'
    })) || [];

    // Create comprehensive searchable tags per schema
    const searchableTags = [
      ...this.createSearchableTags(request),
      // Add additional tags from AI response
      ...((parsedResponse.additionalTags || []).map((tag: any) => ({
        category: tag.category || 'topic',
        value: tag.value || tag,
        weight: tag.weight || 0.5
      })))
    ];

    // Create comprehensive AI metadata per schema
    const aiMetadata = {
      generatedBy: this.modelId.includes('pro') ? 'gemini-2-5-pro' : 'gemini-2-5-flash',
      generatedAt: new Date().toISOString(),
      promptVersion: '2.0', // Updated version with rich content
      seedPrompt: `Generate ${request.questionType} for ${request.skillName} at ${request.competencyLevel} level`,
      iterationCount: 0,
      validationStatus: 'generated' as const,
      validatedBy: undefined,
      validatedAt: undefined,
      validationNotes: undefined
    };

    // Calculate performance metrics placeholder
    const performanceMetrics = {
      totalAttempts: 0,
      correctAttempts: 0,
      averageTimeSeconds: 0,
      hintUsageRate: 0,
      skipRate: 0,
      lastUsed: undefined,
      qualityScore: undefined
    };

    const now = new Date().toISOString();

    return {
      questionId,
      questionType: request.questionType,
      stem: parsedResponse.stem,
      mcqOptions,
      specificInput,
      shortAnswer,
      solution: parsedResponse.solution,
      hints,
      widgets: widgets.length > 0 ? widgets : undefined,
      curriculum: this.createCurriculumInfo(request),
      skills: this.createSkillsInfo(request),
      difficulty: request.difficulty,
      estimatedTime: Math.max(30, Math.min(1800, request.difficulty * 60)), // 30sec to 30min per schema
      qcs: Math.max(1, Math.min(10, Math.floor(5 + (request.difficulty / 2)))), // QCS 1-10 per schema
      searchableTags,
      aiMetadata,
      performanceMetrics,
      version: 1,
      status: 'draft' as const,
      createdAt: now,
      updatedAt: now,
      publishedAt: undefined
    };
  }


  public validateConfig(): boolean {
    if (!super.validateConfig()) {
      return false;
    }

    // Additional Gemini-specific validation
    if (!this.config.apiKey.startsWith('AIza')) {
      logger.error(`❌ [${this.name}] Invalid Gemini API key format`);
      return false;
    }

    return true;
  }

  private getIntensityLabel(value: number): string {
    if (value <= 0.2) return 'Minimal';
    if (value <= 0.4) return 'Low';
    if (value <= 0.6) return 'Moderate';
    if (value <= 0.8) return 'High';
    return 'Maximum';
  }

  private getHigherOrderGuidance(intensity: number): string {
    if (intensity <= 0.2) {
      return '- Focus on recall and basic application\n- Use straightforward problems with clear procedures\n- Minimal analysis or evaluation required';
    } else if (intensity <= 0.4) {
      return '- Include some application and basic analysis\n- Add one-step reasoning beyond recall\n- Simple problem-solving with guided approach';
    } else if (intensity <= 0.6) {
      return '- Balance application with analysis and evaluation\n- Require students to compare, contrast, or choose methods\n- Include moderate reasoning and justification';
    } else if (intensity <= 0.8) {
      return '- Emphasize analysis, synthesis, and evaluation\n- Require students to critique, design, or predict\n- Multi-step reasoning with justification required\n- Connect concepts across mathematical domains';
    } else {
      return '- Focus heavily on creation, evaluation, and synthesis\n- Require original problem-solving approaches\n- Students must defend reasoning and critique methods\n- Cross-curricular connections and real-world applications\n- Open-ended problems with multiple solution paths';
    }
  }

  private getComplexWordGuidance(intensity: number): string {
    if (intensity <= 0.2) {
      return '- Simple, direct word problems\n- Single-step calculations\n- Clear, unambiguous language\n- Minimal extraneous information';
    } else if (intensity <= 0.4) {
      return '- Two-step word problems\n- Some context setting required\n- Basic real-world scenarios\n- Limited irrelevant information';
    } else if (intensity <= 0.6) {
      return '- Multi-step problems with interconnected parts\n- Moderate real-world context\n- Some information selection required\n- Basic problem modeling skills needed';
    } else if (intensity <= 0.8) {
      return '- Complex scenarios with multiple variables\n- Rich real-world contexts requiring interpretation\n- Students must identify relevant information\n- Multiple solution approaches possible\n- Involves planning and strategy selection';
    } else {
      return '- Highly complex, authentic real-world scenarios\n- Substantial information processing required\n- Multiple interconnected steps and decisions\n- Open-ended with various valid approaches\n- Requires modeling, assumptions, and justifications\n- Cross-disciplinary connections and contexts';
    }
  }
}
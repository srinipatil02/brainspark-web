/**
 * DeepSeek AI Provider
 * Supports both DeepSeek Chat and Reasoner models
 */

import { logger } from 'firebase-functions';
import { BaseAIProvider } from './base-provider';
import { QuestionGenerationRequest, GeneratedQuestion, AIProviderConfig } from './types';

export class DeepSeekProvider extends BaseAIProvider {
  public readonly name: string;
  public readonly modelId: string;
  
  private readonly baseUrl = 'https://api.deepseek.com/v1/chat/completions';
  private readonly modelName: string;

  constructor(config: AIProviderConfig, modelType: 'deepseek-chat' | 'deepseek-reasoner') {
    super(config);
    
    this.name = `DeepSeek ${modelType.includes('reasoner') ? 'Reasoner' : 'Chat'}`;
    this.modelId = modelType;
    
    // Map to actual DeepSeek model names
    this.modelName = modelType === 'deepseek-chat' 
      ? 'deepseek-chat' 
      : 'deepseek-reasoner';
  }

  protected async generateQuestionInternal(
    request: QuestionGenerationRequest,
    requestId: string
  ): Promise<GeneratedQuestion> {
    
    const prompt = this.buildPrompt(request);

    logger.info(`🤖 [${this.name}] Sending request to DeepSeek`, {
      requestId,
      promptLength: prompt.length,
      model: this.modelName
    });

    const requestBody = {
      model: this.modelName,
      messages: [
        {
          role: 'system',
          content: 'You are an expert educational content creator. Always respond with valid JSON only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 4096,
      temperature: 0.7,
      top_p: 0.95,
      frequency_penalty: 0,
      presence_penalty: 0,
      stream: false
    };

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(this.config.timeout || 30000)
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error(`❌ [${this.name}] API error ${response.status}`, {
          requestId,
          status: response.status,
          error: errorText
        });

        if (response.status === 401) {
          throw this.createError('AUTHENTICATION_ERROR', 'Invalid DeepSeek API key');
        }
        
        if (response.status === 429) {
          throw this.createError('RATE_LIMIT_ERROR', 'DeepSeek API rate limit exceeded', undefined, true);
        }

        throw this.createError('NETWORK_ERROR', `DeepSeek API error: ${response.status} ${errorText}`);
      }

      const responseData = await response.json();
      
      logger.info(`📝 [${this.name}] Response received`, {
        requestId,
        usage: responseData.usage,
        finishReason: responseData.choices?.[0]?.finish_reason
      });

      const text = responseData.choices?.[0]?.message?.content;
      if (!text) {
        throw this.createError('VALIDATION_ERROR', 'Empty response from DeepSeek');
      }

      // Parse JSON response
      const parsedResponse = this.parseResponse(text);
      
      // Convert to our standard format
      const question = this.convertToStandardFormat(parsedResponse, request);
      
      return question;

    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        // Re-throw our custom errors
        throw error;
      }

      logger.error(`❌ [${this.name}] Request failed`, {
        requestId,
        error: error instanceof Error ? error.message : String(error)
      });

      if (error instanceof Error && error.name === 'AbortError') {
        throw this.createError('NETWORK_ERROR', 'DeepSeek API request timeout', undefined, true);
      }

      throw this.createError('UNKNOWN_ERROR', `DeepSeek request failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private buildPrompt(request: QuestionGenerationRequest): string {
    // DeepSeek Reasoner benefits from more structured reasoning prompts
    const isReasoner = this.modelId === 'deepseek-reasoner';
    
    const basePrompt = `You are an expert educational content creator specializing in ${request.subject} for Year ${request.year} students.

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
   - Continue varying scenarios systematically to avoid repetition within the batch`;

    if (isReasoner) {
      return `${basePrompt}

REASONING PROCESS:
1. First, analyze the learning objective and skill requirements
2. Consider the competency level and what students at this level should know
3. Design a question that tests the specific skill effectively
4. Create distractors (for MCQ) that reflect common student errors
5. Develop a clear solution path with proper mathematical reasoning
6. Design hints that scaffold learning without giving away the answer

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
      "content": "Conceptual hint to guide thinking",
      "revealsCriticalInfo": false
    },
    {
      "level": 2,
      "content": "Procedural hint showing method",
      "revealsCriticalInfo": false
    },
    {
      "level": 3,
      "content": "Strategic hint with more specific guidance",
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
  ]
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

CRITICAL: If geometric positions are not clearly specified in the question, use mathematical conventions (horizontal/vertical lines) and provide proper metadata.

Generate the question now:`;
    } else {
      return `${basePrompt}

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
      "content": "Conceptual hint to guide thinking",
      "revealsCriticalInfo": false
    },
    {
      "level": 2,
      "content": "Procedural hint showing method",
      "revealsCriticalInfo": false
    },
    {
      "level": 3,
      "content": "Strategic hint with more specific guidance",
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
  ]
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

CRITICAL: If geometric positions are not clearly specified in the question, use mathematical conventions (horizontal/vertical lines) and provide proper metadata.

Generate the question now:`;
    }
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

  private parseResponse(text: string): any {
    try {
      // Extract JSON from response (handle cases where AI adds extra text)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      
      const jsonText = jsonMatch[0];
      return JSON.parse(jsonText);
      
    } catch (error) {
      logger.error(`❌ [${this.name}] Failed to parse response`, {
        error: error instanceof Error ? error.message : String(error),
        responsePreview: text.substring(0, 500)
      });
      throw this.createError('VALIDATION_ERROR', 'Invalid JSON response from DeepSeek');
    }
  }

  private convertToStandardFormat(parsedResponse: any, request: QuestionGenerationRequest): GeneratedQuestion {
    return {
      questionId: this.generateQuestionId(),
      questionType: request.questionType,
      stem: parsedResponse.stem || '',
      mcqOptions: parsedResponse.mcqOptions || undefined,
      specificInput: parsedResponse.specificInput || undefined,
      shortAnswer: parsedResponse.shortAnswer || undefined,
      solution: parsedResponse.solution || '',
      hints: parsedResponse.hints || [],
      curriculum: this.createCurriculumInfo(request),
      skills: this.createSkillsInfo(request),
      difficulty: request.difficulty,
      estimatedTime: Math.max(60, Math.min(600, request.difficulty * 30)), // 1-10 minutes based on difficulty
      qcs: request.difficulty,
      searchableTags: this.createSearchableTags(request),
      aiMetadata: {
        generatedBy: 'deepseek-chat',
        generatedAt: new Date().toISOString(),
        promptVersion: '1.0',
        seedPrompt: `Generate ${request.questionType} for ${request.skillName}`,
        validationStatus: 'generated' as const
      },
      version: 1,
      status: 'draft' as const,
      createdAt: new Date().toISOString()
    };
  }

  public validateConfig(): boolean {
    if (!super.validateConfig()) {
      return false;
    }

    // Additional DeepSeek-specific validation
    if (!this.config.apiKey.startsWith('sk-')) {
      logger.error(`❌ [${this.name}] Invalid DeepSeek API key format`);
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
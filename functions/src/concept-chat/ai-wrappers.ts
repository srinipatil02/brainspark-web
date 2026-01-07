// AI wrapper functions for educational responses
// Simplified approach that wraps existing adapters without modifying them

import { EducationalResponseRequest } from './types';

/**
 * Generate educational response using Gemini
 */
export async function generateGeminiEducationalResponse(
  request: EducationalResponseRequest
): Promise<string> {
  const startTime = Date.now();
  console.log('🧠 Gemini educational response request:', {
    timestamp: new Date().toISOString(),
    systemPromptLength: request.systemPrompt.length,
    userPromptLength: request.userPrompt.length,
    maxTokens: request.maxTokens,
  });

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('Gemini API key not available');
    }

    const combinedPrompt = `${request.systemPrompt}\n\n---\n\n${request.userPrompt}`;

    // Since we can't directly use generateContent, we'll make a direct API call
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: request.maxTokens || 300,
      },
    });

    const result = await model.generateContent(combinedPrompt);
    const responseText = result.response.text();

    const duration = Date.now() - startTime;
    console.log('✅ Gemini educational response completed:', {
      duration,
      responseLength: responseText?.length || 0,
    });

    if (!responseText || responseText.trim().length === 0) {
      throw new Error('Gemini returned empty educational response');
    }

    return responseText.trim();

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('❌ Gemini educational response failed:', {
      duration,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    throw new Error(`Gemini educational response failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate educational response using DeepSeek
 */
export async function generateDeepSeekEducationalResponse(
  request: EducationalResponseRequest
): Promise<string> {
  const startTime = Date.now();
  console.log('🧠 DeepSeek educational response request:', {
    timestamp: new Date().toISOString(),
    systemPromptLength: request.systemPrompt.length,
    userPromptLength: request.userPrompt.length,
    maxTokens: request.maxTokens,
  });

  try {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      throw new Error('DeepSeek API key not available');
    }

    // Make direct API call to DeepSeek
    const OpenAI = require('openai');
    const client = new OpenAI({
      baseURL: 'https://api.deepseek.com',
      apiKey: apiKey,
    });

    const response = await client.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: request.systemPrompt },
        { role: 'user', content: request.userPrompt }
      ],
      temperature: 0.3,
      max_tokens: request.maxTokens || 300,
      top_p: 0.8,
      frequency_penalty: 0.1,
      presence_penalty: 0.1,
    });

    const duration = Date.now() - startTime;
    const content = response.choices[0]?.message?.content?.trim();

    console.log('✅ DeepSeek educational response completed:', {
      duration,
      responseId: response.id,
      model: response.model,
      usage: response.usage,
      finishReason: response.choices[0]?.finish_reason,
    });

    if (!content || content.length === 0) {
      throw new Error('DeepSeek returned empty educational response');
    }

    return content;

  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error('❌ DeepSeek educational response failed:', {
      duration,
      error: error.message || 'Unknown error',
      errorType: error.type || 'unknown',
    });

    throw new Error(`DeepSeek educational response failed: ${error.message || 'Unknown error'}`);
  }
}

/**
 * Health check for Gemini educational responses
 */
export async function healthCheckGeminiEducational(): Promise<{
  isHealthy: boolean;
  responseTime: number;
  error?: string;
}> {
  const startTime = Date.now();
  
  try {
    const testRequest: EducationalResponseRequest = {
      systemPrompt: "You are a helpful educational AI tutor. Respond briefly and warmly.",
      userPrompt: "Test: What is 2+2? Please respond in one sentence.",
      maxTokens: 50,
    };

    const response = await generateGeminiEducationalResponse(testRequest);
    const responseTime = Date.now() - startTime;
    
    const isHealthy = response.length > 5 && 
                     response.length < 200 && 
                     !response.toLowerCase().includes('error');

    return {
      isHealthy,
      responseTime,
    };

  } catch (error) {
    return {
      isHealthy: false,
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Health check for DeepSeek educational responses
 */
export async function healthCheckDeepSeekEducational(): Promise<{
  isHealthy: boolean;
  responseTime: number;
  error?: string;
}> {
  const startTime = Date.now();
  
  try {
    const testRequest: EducationalResponseRequest = {
      systemPrompt: "You are a helpful educational AI tutor. Respond briefly and warmly.",
      userPrompt: "Test: What is 2+2? Please respond in one sentence.",
      maxTokens: 50,
    };

    const response = await generateDeepSeekEducationalResponse(testRequest);
    const responseTime = Date.now() - startTime;
    
    const isHealthy = response.length > 5 && 
                     response.length < 200 && 
                     !response.toLowerCase().includes('error');

    return {
      isHealthy,
      responseTime,
    };

  } catch (error) {
    return {
      isHealthy: false,
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
/**
 * Gemini Title Generator
 * Handles chat title generation using Gemini API
 * 
 * Extracted from gemini-service.ts for better modularity
 */

import { GoogleGenAI } from '@google/genai';
import { GEMINI_MODELS } from '../gemini-config';
import {
  createTitleGenerationPrompt,
  createFallbackTitle,
  detectTitleLanguage
} from '../ai-shared-utils';

export class GeminiTitleGenerator {
  private static readonly MAX_TITLE_LENGTH = 50;

  constructor(private client: GoogleGenAI) {}

  /**
   * Generate chat title using Gemini Flash 2.0 Lite
   */
  async generateChatTitle(firstMessage: string): Promise<string> {
    try {
      // Detect language for title generation
      const language = detectTitleLanguage(firstMessage);

      // Create optimized prompt for the detected/selected language
      const prompt = createTitleGenerationPrompt(language, firstMessage);

      const response = await this.client.models.generateContent({
        model: GEMINI_MODELS.FLASH_LITE_2_0,
        contents: [{
          role: 'user',
          parts: [{ text: prompt }]
        }],
        config: {
          maxOutputTokens: 30, // Increased for better title generation
          temperature: 0.8, // Slightly lower for more focused titles
        }
      });

      const title = response.text?.trim() || createFallbackTitle(language);

      // Ensure title is not too long
      if (title.length > GeminiTitleGenerator.MAX_TITLE_LENGTH) {
        return title.substring(0, GeminiTitleGenerator.MAX_TITLE_LENGTH - 3) + '...';
      }

      return title;
    } catch (error) {
      console.error('Title generation error:', error);
      // Return fallback title based on detected language
      const language = detectTitleLanguage(firstMessage);
      return createFallbackTitle(language);
    }
  }
}

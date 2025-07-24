/**
 * Gemini Utilities
 * Handles validation and utility functions for Gemini service
 * 
 * Extracted from gemini-service.ts for better modularity
 */

import { GoogleGenAI } from '@google/genai';
import { GEMINI_MODELS, createGeminiConfig, getAvailableModels, type GeminiModelInfo } from '../gemini-config';

export class GeminiUtils {
  /**
   * Validate API key by making a test request
   */
  static async validateApiKey(apiKey: string): Promise<boolean> {
    try {
      const testClient = new GoogleGenAI({ apiKey });
      const response = await testClient.models.generateContent({
        model: GEMINI_MODELS.FLASH_2_5,
        config: createGeminiConfig({
          systemInstruction: 'You are a helpful AI assistant.' // Simple prompt for validation
        }),
        contents: [{ role: 'user', parts: [{ text: 'Hello' }] }],
      });

      return !!response.text;
    } catch (error) {
      // Suppress console error for quota exhausted during validation
      if (error instanceof Error && error.message.toLowerCase().includes('quota')) {
        console.warn('API key validation failed due to quota exhaustion');
      } else {
        console.error('API key validation failed:', error);
      }
      return false;
    }
  }

  /**
   * Get available Gemini models
   */
  static getAvailableModels(): GeminiModelInfo[] {
    return getAvailableModels();
  }

  /**
   * Check if service is properly configured
   */
  static isConfigured(client: GoogleGenAI | null): boolean {
    return client !== null;
  }

  /**
   * Handle API errors with proper error messages
   */
  static handleApiError(error: any, operation: string): Error {
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return new Error(`Lỗi API key khi ${operation}. Vui lòng kiểm tra API key của bạn.`);
      }
      if (error.message.includes('quota')) {
        return new Error(`Đã vượt quá giới hạn API khi ${operation}. Vui lòng thử lại sau.`);
      }
      if (error.message.includes('model')) {
        return new Error(`Lỗi model khi ${operation}. Model có thể không khả dụng.`);
      }
      return new Error(`Lỗi khi ${operation}: ${error.message}`);
    }
    return new Error(`Lỗi không xác định khi ${operation}`);
  }

  /**
   * Add files to message content
   */
  static addFilesToMessage(
    contents: any[], 
    files: Array<{
      data?: string;
      uri?: string;
      mimeType: string;
      name?: string;
    }>,
    createFileParts: (files: any[]) => any[]
  ): void {
    if (contents.length > 0 && files.length > 0) {
      const lastMessage = contents[contents.length - 1];
      if (lastMessage.role === 'user') {
        const fileParts = createFileParts(files);
        // Add file parts to message (cast to bypass TypeScript)
        (lastMessage.parts as any[]).push(...fileParts);
      }
    }
  }
}

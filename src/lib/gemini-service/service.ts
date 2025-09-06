/**
 * Main Gemini Service Class
 * Orchestrates client and server handlers based on runtime environment
 */

import { BaseAIService, AIMessage } from '../ai-config';
import { GEMINI_MODELS, getAvailableModels } from '../gemini-config';
import { GeminiConfigHelper, UseGeminiServiceOptions } from '../gemini-helpers';
import { GeminiClientHandler } from './client-handler';
import { GeminiServerHandler } from './server-handler';
import { GeminiServiceOptions, GeminiContent } from './types';

// Re-export types for external use
export type { UseGeminiServiceOptions, GeminiServiceOptions };

export class GeminiService extends BaseAIService {
  private clientHandler?: GeminiClientHandler;
  private serverHandler?: GeminiServerHandler;
  private isServerSide: boolean;
  protected defaultModel: string = GEMINI_MODELS.FLASH_2_5;
  protected storageKeyPrefix: string = 'gemini';

  constructor(apiKey?: string) {
    super(apiKey);
    
    // Detect if running on server or client
    this.isServerSide = typeof window === 'undefined';
    
    if (this.isServerSide) {
      // Server-side initialization
      if (!apiKey) {
        throw new Error('Gemini API key is required for server-side service.');
      }
      this.serverHandler = new GeminiServerHandler(apiKey);
      this.isConfigured = true;
    } else {
      // Client-side initialization
      this.clientHandler = new GeminiClientHandler();
      this.isConfigured = true;
    }
  }

  /**
   * Configure the service with an API key
   */
  configure(apiKey: string): void {
    this.apiKey = apiKey;
    
    if (this.isServerSide && apiKey) {
      this.serverHandler = new GeminiServerHandler(apiKey);
    }
    
    this.isConfigured = true;
    
    // Only save to storage on client-side
    if (!this.isServerSide) {
      this.saveApiKeyToStorage(apiKey);
    }
  }

  /**
   * Validate API key
   */
  async validateApiKey(apiKey: string): Promise<boolean> {
    if (this.isServerSide) {
      // Server-side instances are trusted
      return true;
    }
    
    if (!this.clientHandler) {
      throw new Error('Client handler not initialized');
    }
    
    return this.clientHandler.validateApiKey(apiKey);
  }

  /**
   * Send a single message and get complete response
   */
  async sendMessage(
    messages: AIMessage[],
    options?: UseGeminiServiceOptions & GeminiServiceOptions
  ): Promise<string> {
    if (this.isServerSide) {
      if (!this.serverHandler) {
        throw new Error('Server handler not initialized');
      }
      return this.serverHandler.sendMessage(messages, options);
    } else {
      if (!this.clientHandler) {
        throw new Error('Client handler not initialized');
      }
      return this.clientHandler.sendMessage(messages, options);
    }
  }

  /**
   * Stream message with optional features
   */
  async streamMessage(
    messages: AIMessage[],
    onChunk: (chunk: string) => void,
    options?: UseGeminiServiceOptions & GeminiServiceOptions
  ): Promise<void> {
    if (this.isServerSide) {
      if (!this.serverHandler) {
        throw new Error('Server handler not initialized');
      }
      return this.serverHandler.streamMessage(messages, onChunk, options);
    } else {
      if (!this.clientHandler) {
        throw new Error('Client handler not initialized');
      }
      return this.clientHandler.streamMessage(messages, onChunk, options);
    }
  }

  /**
   * Stream message with file attachments (server-side only for now)
   */
  async streamMessageWithFiles(
    messages: AIMessage[],
    files: any[],
    onChunk: (chunk: string) => void,
    options?: GeminiServiceOptions
  ): Promise<void> {
    if (!this.isServerSide) {
      // For client-side, use regular streamMessage with files option
      return this.streamMessage(messages, onChunk, { ...options, files });
    }
    
    if (!this.serverHandler) {
      throw new Error('Server handler not initialized');
    }
    
    return this.serverHandler.streamMessageWithFiles(messages, files, onChunk, options);
  }

  /**
   * Generate a chat title based on the first message
   */
  async generateChatTitle(firstMessage: string): Promise<string> {
    if (this.isServerSide) {
      if (!this.serverHandler) return 'New Chat';
      return this.serverHandler.generateChatTitle(firstMessage);
    } else {
      if (!this.clientHandler) return 'New Chat';
      return this.clientHandler.generateChatTitle(firstMessage);
    }
  }

  /**
   * Get available models
   */
  getAvailableModels() {
    return getAvailableModels();
  }

  /**
   * Private helper to convert messages (client-side only)
   */
  private convertMessages(messages: AIMessage[]): GeminiContent[] {
    return GeminiConfigHelper.convertMessages(messages);
  }

  /**
   * Check if service is properly configured
   */
  isServiceConfigured(): boolean {
    return this.isConfigured;
  }

  /**
   * Get current API key (masked for security)
   */
  getCurrentApiKey(): string | null {
    if (!this.apiKey) return null;
    // Return masked version for display
    return this.apiKey.substring(0, 6) + '...' + this.apiKey.substring(this.apiKey.length - 4);
  }

  /**
   * Get current default model
   */
  getDefaultModel(): string {
    return this.defaultModel;
  }
}

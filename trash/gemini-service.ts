/**
 * Google Gemini Service Implementation
 * Handles all Gemini API interactions with proper error handling and streaming
 *
 * BACKUP CREATED: 2025-01-23 - Before cleanup optimization
 */


import {
  GEMINI_MODELS,
  getModelInfo,
  type GeminiModelInfo
} from './gemini-config';
import { BaseAIService, AIMessage } from './ai-config';

import {
  GeminiFileHandler,
  GeminiStreamingHandler,
  GeminiTitleGenerator,
  GeminiUtils,
  GeminiConfigHelper,
  UseGeminiServiceOptions
} from './gemini-helpers';

// Type definitions
interface GeminiContent {
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
}

interface UploadedFile {
  name: string;
  displayName: string;
  mimeType: string;
  sizeBytes: number;
  createTime: string;
  updateTime: string;
  expirationTime: string;
  sha256Hash: string;
  uri: string;
  state: string;
}

// Re-export types for external use
export type { UseGeminiServiceOptions };



export class GeminiService extends BaseAIService {

  protected defaultModel: string = GEMINI_MODELS.FLASH_2_0;
  protected storageKeyPrefix: string = 'gemini';

  constructor(apiKey?: string) {
    super(apiKey);
    // Service is now configured by default, proxy handles the key.
    this.isConfigured = true;
  }

  /**
   * Configure the service with an API key
   */
  configure(apiKey: string): void {
    // The key is saved for the validation endpoint, but not used for requests.
    this.apiKey = apiKey;
    this.isConfigured = true;
    this.saveApiKeyToStorage(apiKey);
  }



  /**
   * Convert AIMessage format to Gemini format (excluding system messages)
   */
  private convertMessages(messages: AIMessage[]): GeminiContent[] {
    return GeminiConfigHelper.convertMessages(messages);
  }





  /**
   * Send a single message and get complete response
   */
  async sendMessage(
    messages: AIMessage[],
    options?: UseGeminiServiceOptions
  ): Promise<string> {
    try {
      const response = await fetch('/api/ai-proxy/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ provider: 'gemini', messages, options }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'AI proxy request failed');
      }

      const data = await response.json();
      return data.response;
    } catch (error) {
      console.error('Gemini sendMessage error:', error);
      throw GeminiUtils.handleApiError(error, 'gửi tin nhắn');
    }
  }

  /**
   * Send message with streaming response. Supports AbortController.
   */
  async streamMessage(
    messages: AIMessage[],
    onChunk: (chunk: string) => void,
    options?: UseGeminiServiceOptions & { abortController?: AbortController; files?: any[] }
  ): Promise<void> {
    try {
      const response = await fetch('/api/ai-proxy/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: 'gemini',
          messages,
          options: { ...options, stream: true },
          files: options?.files || [],
        }),
        signal: options?.abortController?.signal,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'AI proxy stream request failed');
      }

      if (!response.body) {
        throw new Error('Response body is null');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        if (chunk.includes('STREAM_ERROR:')) {
          // Extract message after prefix if available
          const msg = chunk.substring(chunk.indexOf('STREAM_ERROR:') + 'STREAM_ERROR:'.length).trim();
          throw new Error(msg || 'Streaming error');
        }
        onChunk(chunk);
      }
    } catch (error) {
      if ((error as any)?.name === 'AbortError') {
        // Silent abort to caller
        return;
      }
      console.error('Gemini streamMessage error:', error);
      throw GeminiUtils.handleApiError(error, 'stream tin nhắn');
    }
  }

  /**
   * Send message with streaming response and thinking support
   */










  /**
   * Validate API key
   */
  async validateApiKey(apiKey: string): Promise<boolean> {
    try {
      const response = await fetch('/api/user/keys/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ provider: 'gemini', apiKey }),
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      return data.isValid;
    } catch (error) {
      console.error('Gemini validateApiKey error:', error);
      return false;
    }
  }

  /**
   * Get available models
   */
  getAvailableModels(): GeminiModelInfo[] {
    return GeminiUtils.getAvailableModels();
  }

  /**
   * Set default model
   */
  setDefaultModel(model: string): void {
    const modelInfo = getModelInfo(model);
    if (!modelInfo) {
      throw new Error(`Invalid model: ${model}`);
    }
    this.defaultModel = model;
  }

  /**
   * Get current default model
   */
  getDefaultModel(): string {
    return this.defaultModel;
  }
}

// Export singleton instance
let geminiServiceInstance: GeminiService | null = null;

export function getGeminiService(apiKey?: string): GeminiService {
  if (!geminiServiceInstance) {
    geminiServiceInstance = new GeminiService(apiKey);
  } else if (apiKey && !geminiServiceInstance.configured) {
    // Configure existing instance with new API key
    geminiServiceInstance.configure(apiKey);
  }
  return geminiServiceInstance;
}

// Export class for custom instances
export { GeminiService as default };



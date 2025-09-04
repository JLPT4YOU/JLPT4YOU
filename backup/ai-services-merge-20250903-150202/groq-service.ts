/**
 * Groq Service Implementation
 * Handles all Groq API interactions with proper error handling and streaming
 *
 * SECURITY NOTE: This service uses dangerouslyAllowBrowser: true to enable
 * client-side usage. In production, consider implementing server-side proxy
 * to avoid exposing API keys in the browser.
 */


import {
  GROQ_MODELS,
  getGroqModelInfo,
  getAvailableGroqModels,
  getReasoningModels,
  getToolsModels,
  type GroqModelInfo,
  type ReasoningEffort,
  type ReasoningFormat
} from './groq-config';
import { BaseAIService, AIMessage } from './ai-config';
import { getCurrentSystemPrompt } from './prompt-storage';
import { convertMessagesToGroq } from './ai-shared-utils';

// Type definitions


export interface UseGroqServiceOptions {
  model?: string;
  temperature?: number;
  topP?: number; // Will be converted to top_p
  stop?: string | string[] | null;
  // Advanced features for GPT-OSS models
  reasoning_effort?: ReasoningEffort;
  reasoning_format?: ReasoningFormat;
  enable_code_interpreter?: boolean;
  enable_browser_search?: boolean;
}

export class GroqService extends BaseAIService {

  protected defaultModel: string = GROQ_MODELS.OPENAI_GPT_OSS_20B;
  protected storageKeyPrefix: string = 'groq';

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
   * Convert options to Groq-compatible format
   */


  /**
   * Send a single message and get complete response
   */
  async sendMessage(
    messages: AIMessage[],
    options?: UseGroqServiceOptions
  ): Promise<string> {
    try {
      const response = await fetch('/api/ai-proxy/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ provider: 'groq', messages, options }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'AI proxy request failed');
      }

      const data = await response.json();
      return data.response;
    } catch (error) {
      console.error('Groq sendMessage error:', error);
      throw this.handleApiError(error, 'gửi tin nhắn');
    }
  }

  /**
   * Send message with streaming response
   */
  async streamMessage(
    messages: AIMessage[],
    onChunk: (chunk: string) => void,
    options?: UseGroqServiceOptions
  ): Promise<void> {
    try {
      const response = await fetch('/api/ai-proxy/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: 'groq',
          messages,
          options: { ...options, stream: true },
        }),
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
        if (done) {
          break;
        }
        const chunk = decoder.decode(value);
        onChunk(chunk);
      }
    } catch (error) {
      console.error('Groq streamMessage error:', error);
      throw this.handleApiError(error, 'stream tin nhắn');
    }
  }

  /**
   * Send message with thinking mode (non-streaming)
   */


  /**
   * Send message with advanced features (reasoning + tools)
   * Only works with GPT-OSS models
   */


  /**
   * Generate chat title using fast model
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
        body: JSON.stringify({ provider: 'groq', apiKey }),
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      return data.isValid;
    } catch (error) {
      console.error('Groq validateApiKey error:', error);
      return false;
    }
  }

  /**
   * Parse thinking results from Groq response (extract <think> tags)
   */


  /**
   * Get available models
   */
  getAvailableModels(): GroqModelInfo[] {
    return getAvailableGroqModels();
  }

  /**
   * Set default model
   */
  setDefaultModel(model: string): void {
    const modelInfo = getGroqModelInfo(model);
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

  /**
   * Get models that support reasoning
   */
  getReasoningModels(): GroqModelInfo[] {
    return getReasoningModels();
  }

  /**
   * Get models that support tools
   */
  getToolsModels(): GroqModelInfo[] {
    return getToolsModels();
  }


}

// Export singleton instance
let groqServiceInstance: GroqService | null = null;

export function getGroqService(apiKey?: string): GroqService {
  if (!groqServiceInstance) {
    groqServiceInstance = new GroqService(apiKey);
  } else if (apiKey && !groqServiceInstance.configured) {
    groqServiceInstance.configure(apiKey);
  }
  return groqServiceInstance;
}

// Export class for custom instances
export { GroqService as default };

/**
 * AI Provider Configuration
 * Ready for integration with various AI providers
 */

// Type definitions
type AIServiceOptions = Record<string, unknown>

export interface AIProvider {
  name: string;
  apiKey?: string;
  baseURL?: string;
  models: AIModel[];
}

export interface AIModel {
  id: string;
  name: string;
  description: string;
  maxTokens: number;
  supportsStreaming: boolean;
  supportsFiles: boolean;
  costTier: 'free' | 'low' | 'medium' | 'high';
}

// AI Provider configurations
export const AI_PROVIDERS: Record<string, AIProvider> = {
  gemini: {
    name: 'Google Gemini',
    baseURL: 'https://generativelanguage.googleapis.com/v1beta',
    models: [] // Will be populated from gemini-config
  },
  groq: {
    name: 'Groq',
    baseURL: 'https://api.groq.com/openai/v1',
    models: [] // Will be populated from groq-config
  }
};

// Default AI settings
export const DEFAULT_AI_SETTINGS = {
  provider: 'placeholder',
  model: 'placeholder-model',
  temperature: 0.7,
  maxTokens: 2048,
  systemPrompt: `You are iRIN, an AI assistant and teacher from the JLPT4YOU learning platform.

While your specialty is Japanese language learning and JLPT exam preparation, you are a versatile AI who can discuss and help with any topic. You can engage in conversations about:
- Japanese language learning (your specialty)
- General knowledge and various subjects
- Creative discussions and problem-solving
- Educational support across different topics
- Personal interests and hobbies

Always respond in a helpful, encouraging, and engaging manner. Maintain your identity as iRIN from JLPT4YOU while being flexible and adaptive to any conversation topic.`,
  useCustomPrompt: true // Enable custom prompt system
};

// AI response types
export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
}

export interface AIStreamResponse {
  content: string;
  isComplete: boolean;
  error?: string;
}

// Enhanced service interface for AI providers
export interface AIService {
  sendMessage(messages: AIMessage[], options?: AIServiceOptions): Promise<string>;
  streamMessage(messages: AIMessage[], onChunk: (chunk: string) => void, options?: AIServiceOptions): Promise<void>;
  validateApiKey(apiKey: string): Promise<boolean>;
  generateChatTitle?(firstMessage: string): Promise<string>;
  configure?(apiKey: string): void;
  isConfigured?: boolean;
  // Special method for user prompt generation without system prompt injection
  sendMessageWithoutSystemPrompt?(messages: AIMessage[], options?: AIServiceOptions): Promise<string>;

  // Methods for model management, proxied by the secure wrapper
  getAvailableModels?(): any[];
  getDefaultModel?(): string;
  setDefaultModel?(model: string): void;
  modelSupportsAdvancedFeatures?(model: string): boolean;
}

// Base abstract class for AI services with common functionality
export abstract class BaseAIService implements AIService {
  protected apiKey: string | null = null;
  public isConfigured: boolean = false;
  protected abstract defaultModel: string;
  protected abstract storageKeyPrefix: string;

  constructor(apiKey?: string) {
    const key = apiKey || this.getApiKeyFromStorage();
    if (key) {
      this.apiKey = key;
      this.isConfigured = true;
    }
  }

  /**
   * Get API key from localStorage with provider-specific key
   */
  /**
   * Previously read API key from browser localStorage. For security reasons we no
   * longer persist API keys on the client – they live only on the server,
   * encrypted at rest. Always return null on the client.
   */
  protected getApiKeyFromStorage(): string | null {
    return null;
  }

  /**
   * Save API key to localStorage with provider-specific key
   */
  /**
   * NO-OP – we intentionally do NOT write API keys to localStorage anymore.
   * Keys are stored encrypted in Supabase and retrieved only on the server.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected saveApiKeyToStorage(apiKey: string): void {
    /* intentionally empty */
  }

  /**
   * Ensure service is configured before making API calls
   */
  protected ensureConfigured(): void {
    if (!this.isConfigured || !this.apiKey) {
      throw new Error('Service chưa được cấu hình. Vui lòng cung cấp API key.');
    }
  }

  /**
   * Handle API errors with standardized user-friendly messages
   */
  protected handleApiError(error: unknown, context: string): Error {
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();

      // Quota/Rate limit errors
      if (errorMessage.includes('quota') ||
          errorMessage.includes('rate limit') ||
          errorMessage.includes('resource has been exhausted')) {
        return new Error('API quota đã hết. Vui lòng thử lại sau hoặc kiểm tra API key của bạn.');
      }

      // Authentication errors
      if (errorMessage.includes('authentication') ||
          errorMessage.includes('unauthorized') ||
          errorMessage.includes('permission_denied')) {
        return new Error('API key không hợp lệ. Vui lòng kiểm tra lại API key.');
      }

      // Invalid request/argument errors
      if (errorMessage.includes('invalid_argument') ||
          errorMessage.includes('invalid_request_error')) {
        return new Error('Cấu hình không hợp lệ. Vui lòng thử model khác.');
      }

      // Model not found errors
      if (errorMessage.includes('not_found')) {
        return new Error('Model không tồn tại. Vui lòng chọn model khác.');
      }

      // Network/connection errors
      if (errorMessage.includes('network') ||
          errorMessage.includes('connection') ||
          errorMessage.includes('timeout')) {
        return new Error('Lỗi kết nối mạng. Vui lòng kiểm tra internet và thử lại.');
      }
    }

    return new Error(`Có lỗi xảy ra khi ${context}. Vui lòng thử lại.`);
  }

  /**
   * Public getter to check if service is configured
   */
  get configured(): boolean {
    return this.isConfigured;
  }

  // Abstract methods that must be implemented by concrete services
  abstract sendMessage(messages: AIMessage[], options?: AIServiceOptions): Promise<string>;
  abstract streamMessage(messages: AIMessage[], onChunk: (chunk: string) => void, options?: AIServiceOptions): Promise<void>;
  abstract validateApiKey(apiKey: string): Promise<boolean>;
  abstract configure(apiKey: string): void;
}

/**
 * Secure AI Service Wrapper
 * Wraps AI services để fetch API key từ server khi cần sử dụng
 * Đảm bảo API key không bao giờ được fetch khi load trang
 */

import { AIService, AIMessage } from './ai-config'
import { createClient } from '@/utils/supabase/client'

export type ProviderType = 'gemini' | 'groq'

interface SecureServiceConfig {
  provider: ProviderType
  baseService: AIService
}

export class SecureAIServiceWrapper implements AIService {
  private provider: ProviderType
  private baseService: AIService
  constructor(config: SecureServiceConfig) {
    this.provider = config.provider;
    this.baseService = config.baseService;

    // Re-add proxy to delegate non-overridden methods like getAvailableModels to the base service.
    return new Proxy(this, {
      get: (target, prop, receiver) => {
        // If the method is explicitly defined on the wrapper (e.g., streamMessage), use it.
        if (prop in target) {
          return Reflect.get(target, prop, receiver);
        }
        // Otherwise, delegate to the base service (for model lists, etc.).
        return Reflect.get(target.baseService, prop, receiver);
      },
    });
  }

  /**
   * Get authorization headers for API requests.
   */
  private async getAuthHeaders(): Promise<HeadersInit> {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('User not authenticated');
    }
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    };
  }

  /**
   * Stream message by calling the server-side proxy.
   */
  async streamMessage(
    messages: AIMessage[],
    onChunk: (chunk: string) => void,
    options?: any
  ): Promise<void> {
    const headers = await this.getAuthHeaders();
    const body = JSON.stringify({ messages, stream: true, ...options });

    const response = await fetch(`/api/${this.provider}/chat`, {
      method: 'POST',
      headers,
      body,
    });

    if (!response.ok || !response.body) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error occurred' }));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const sse = decoder.decode(value, { stream: true });
        const lines = sse.split('\n\n').filter(line => line.startsWith('data:'));

        for (const line of lines) {
          const jsonStr = line.replace('data: ', '');
          try {
            const data = JSON.parse(jsonStr);
            if (data.done) return;
            if (data.error) throw new Error(data.error);
            if (data.content) {
              onChunk(data.content);
            }
          } catch (e) {
            console.error('Failed to parse SSE chunk:', jsonStr);
          }
        }
      }
    } catch (error) {
      console.error('Streaming failed:', error);
      throw error;
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Send message by calling the server-side proxy (non-streaming).
   */
  async sendMessage(messages: AIMessage[], options?: any): Promise<string> {
    const headers = await this.getAuthHeaders();
    const body = JSON.stringify({ messages, stream: false, ...options });

    const response = await fetch(`/api/${this.provider}/chat`, {
      method: 'POST',
      headers,
      body,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error occurred' }));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.message?.content || '';
  }

  /**
   * Validate API key - use provided key, not cached one
   */
  async validateApiKey(apiKey: string): Promise<boolean> {
    return this.baseService.validateApiKey(apiKey)
  }

  /**
   * Generate chat title via server-side proxy (no key exposure).
   */
  async generateChatTitle?(firstMessage: string): Promise<string> {
    try {
      // Only Gemini currently supports title generation in our services
      if (this.provider !== 'gemini') {
        const words = firstMessage.trim().split(' ').slice(0, 4);
        return words.join(' ') || 'New Chat';
      }

      const headers = await this.getAuthHeaders();
      const res = await fetch('/api/gemini/generate-title', {
        method: 'POST',
        headers,
        body: JSON.stringify({ firstMessage }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Failed to generate title (${res.status})`);
      }

      const data = await res.json();
      return data.title || 'New Chat';
    } catch (e) {
      // Fallback to simple title if server route fails
      const words = firstMessage.trim().split(' ').slice(0, 4);
      return words.join(' ') || 'New Chat';
    }
  }

  /**
   * The wrapper is always considered "configured" because it relies on the server proxy.
   */
  get isConfigured(): boolean {
    return true;
  }

  /**
   * Clearing cache is now a no-op on the client as there's no client-side key.
   */
  clearCache(): void {}

  // All other methods from the AIService interface will be dynamically proxied
  // to the base service, which is now just a thin client for the server API.
  // This dynamic proxying is handled by the constructor logic that was removed and will be simplified.

  /**
   * Get available models - delegates to base service (no key needed).
   */
  getAvailableModels?(): any[] {
    if (this.baseService.getAvailableModels) {
      return this.baseService.getAvailableModels();
    }
    return [];
  }

  /**
   * Get default model - delegates to base service (no key needed).
   */
  getDefaultModel?(): string {
    if (this.baseService.getDefaultModel) {
      return this.baseService.getDefaultModel();
    }
    return '';
  }

  /**
   * Set default model - delegates to base service (no key needed).
   */
  setDefaultModel?(model: string): void {
    if (this.baseService.setDefaultModel) {
      this.baseService.setDefaultModel(model);
    }
  }

  /**
   * Check if a model supports advanced features (for Groq) - delegates to base service.
   */
  modelSupportsAdvancedFeatures?(model: string): boolean {
    if ('modelSupportsAdvancedFeatures' in this.baseService && typeof (this.baseService as any).modelSupportsAdvancedFeatures === 'function') {
      return (this.baseService as any).modelSupportsAdvancedFeatures(model);
    }
    return false;
  }
}

/**
 * Create secure wrapper for AI service
 */
export function createSecureAIService(
  provider: ProviderType,
  baseService: AIService
): SecureAIServiceWrapper {
  return new SecureAIServiceWrapper({
    provider,
    baseService
  })
}

/**
 * Clear all cached API keys (useful for logout)
 */
export function clearAllApiKeyCache(): void {
  // This would be called from a global logout handler

  // Individual services should implement clearCache method
}

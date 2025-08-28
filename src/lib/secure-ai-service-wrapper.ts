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
  private cachedApiKey: string | null = null
  private keyFetchPromise: Promise<string | null> | null = null

  constructor(config: SecureServiceConfig) {
    this.provider = config.provider
    this.baseService = config.baseService

    // Create proxy để delegate tất cả methods không được explicitly defined
    return new Proxy(this, {
      get(target, prop, receiver) {
        // Nếu method đã được defined trong wrapper, sử dụng nó
        if (prop in target) {
          return Reflect.get(target, prop, receiver)
        }

        // Nếu method tồn tại trong base service, delegate với ensureConfigured
        if (prop in target.baseService && typeof (target.baseService as any)[prop] === 'function') {
          return async (...args: any[]) => {
            await target.ensureConfigured()
            return (target.baseService as any)[prop](...args)
          }
        }

        // Fallback to base service property
        return Reflect.get(target.baseService, prop, receiver)
      }
    })
  }

  /**
   * Fetch API key từ server khi cần sử dụng
   * Chỉ fetch một lần và cache kết quả
   */
  private async getApiKey(): Promise<string | null> {
    // Return cached key if available
    if (this.cachedApiKey) {
      return this.cachedApiKey
    }

    // Return existing promise if already fetching
    if (this.keyFetchPromise) {
      return this.keyFetchPromise
    }

    // Start fetching API key
    this.keyFetchPromise = this.fetchApiKeyFromServer()
    
    try {
      this.cachedApiKey = await this.keyFetchPromise
      return this.cachedApiKey
    } catch (error) {
      console.error(`Failed to fetch ${this.provider} API key:`, error)
      return null
    } finally {
      this.keyFetchPromise = null
    }
  }

  /**
   * Fetch API key từ server endpoint
   */
  private async fetchApiKeyFromServer(): Promise<string | null> {
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        console.warn('No authentication session available for API key fetch')
        return null
      }

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      }

      const response = await fetch(`/api/user/keys/${this.provider}/decrypt`, { headers })
      
      if (!response.ok) {
        if (response.status === 404) {
          console.info(`No ${this.provider} API key found for user`)
        } else {
          console.error(`Failed to fetch ${this.provider} API key: ${response.status}`)
        }
        return null
      }

      const data = await response.json()
      return data.key || null
    } catch (error) {
      console.error(`Error fetching ${this.provider} API key:`, error)
      return null
    }
  }

  /**
   * Ensure service is configured với API key từ server
   */
  private async ensureConfigured(): Promise<void> {
    const apiKey = await this.getApiKey()

    if (!apiKey) {
      // Provide more helpful error message based on provider
      const providerName = this.provider === 'gemini' ? 'Google Gemini' : 'Groq'
      const setupMessage = `${providerName} API key chưa được cấu hình. Vui lòng:\n\n` +
        `1. Mở Settings (⚙️) trong chat\n` +
        `2. Chọn tab "API Keys"\n` +
        `3. Nhập ${providerName} API key\n` +
        `4. Thử lại tin nhắn`

      throw new Error(setupMessage)
    }

    // Configure base service if not already configured with this key
    if (!this.baseService.isConfigured || this.baseService.configure) {
      this.baseService.configure?.(apiKey)
    }
  }

  /**
   * Send message - fetch API key if needed
   */
  async sendMessage(messages: AIMessage[], options?: any): Promise<string> {
    await this.ensureConfigured()
    return this.baseService.sendMessage(messages, options)
  }

  /**
   * Stream message - fetch API key if needed
   */
  async streamMessage(
    messages: AIMessage[], 
    onChunk: (chunk: string) => void, 
    options?: any
  ): Promise<void> {
    await this.ensureConfigured()
    return this.baseService.streamMessage(messages, onChunk, options)
  }

  /**
   * Validate API key - use provided key, not cached one
   */
  async validateApiKey(apiKey: string): Promise<boolean> {
    return this.baseService.validateApiKey(apiKey)
  }

  /**
   * Generate chat title - fetch API key if needed
   */
  async generateChatTitle?(firstMessage: string): Promise<string> {
    if (this.baseService.generateChatTitle) {
      await this.ensureConfigured()
      return this.baseService.generateChatTitle(firstMessage)
    }
    throw new Error('generateChatTitle not supported by base service')
  }

  /**
   * Configure - clear cached key to force refetch
   */
  configure?(): void {
    // Clear cached key to force refetch from server
    this.cachedApiKey = null
    this.keyFetchPromise = null

    // Don't configure base service immediately
    // It will be configured when actually needed
  }

  /**
   * Check if configured - always return true since we fetch on-demand
   */
  get isConfigured(): boolean {
    return true // We can always try to fetch the key when needed
  }

  /**
   * Clear cached API key (useful for logout or key updates)
   */
  clearCache(): void {
    this.cachedApiKey = null
    this.keyFetchPromise = null

  }

  /**
   * Check if API key is available without fetching
   */
  hasApiKey(): boolean {
    return this.cachedApiKey !== null
  }

  /**
   * Get provider type
   */
  getProvider(): ProviderType {
    return this.provider
  }

  /**
   * Get available models - delegate to base service
   */
  getAvailableModels?(): any[] {
    if ('getAvailableModels' in this.baseService && typeof this.baseService.getAvailableModels === 'function') {
      return this.baseService.getAvailableModels();
    }
    return []
  }

  /**
   * Get default model - delegate to base service
   */
  getDefaultModel?(): string {
    if ('getDefaultModel' in this.baseService && typeof this.baseService.getDefaultModel === 'function') {
      return this.baseService.getDefaultModel()
    }
    return ''
  }

  /**
   * Set default model - delegate to base service
   */
  setDefaultModel?(model: string): void {
    if ('setDefaultModel' in this.baseService && typeof this.baseService.setDefaultModel === 'function') {
      this.baseService.setDefaultModel(model)
    }
  }

  /**
   * Send message with files - fetch API key if needed
   */
  async sendMessageWithFiles?(
    messages: any[],
    files: any[],
    options?: any
  ): Promise<string> {
    if ('sendMessageWithFiles' in this.baseService && typeof this.baseService.sendMessageWithFiles === 'function') {
      await this.ensureConfigured()
      return this.baseService.sendMessageWithFiles(messages, files, options)
    }
    throw new Error(`sendMessageWithFiles not supported by ${this.provider} service`)
  }

  /**
   * Stream message with files - fetch API key if needed
   */
  async streamMessageWithFiles?(
    messages: any[],
    files: any[],
    onChunk: (chunk: string) => void,
    options?: any
  ): Promise<void> {
    if ('streamMessageWithFiles' in this.baseService && typeof this.baseService.streamMessageWithFiles === 'function') {
      await this.ensureConfigured()
      return this.baseService.streamMessageWithFiles(messages, files, onChunk, options)
    }
    throw new Error(`streamMessageWithFiles not supported by ${this.provider} service`)
  }

  /**
   * Stream message with thinking - fetch API key if needed
   */
  async streamMessageWithThinking?(
    messages: any[],
    onThoughtChunk: (chunk: string) => void,
    onAnswerChunk: (chunk: string) => void,
    options?: any
  ): Promise<any> {
    if ('streamMessageWithThinking' in this.baseService && typeof this.baseService.streamMessageWithThinking === 'function') {
      await this.ensureConfigured()
      return this.baseService.streamMessageWithThinking(messages, onThoughtChunk, onAnswerChunk, options)
    }
    throw new Error(`streamMessageWithThinking not supported by ${this.provider} service`)
  }

  /**
   * Stream message with files and thinking - fetch API key if needed
   */
  async streamMessageWithFilesAndThinking?(
    messages: any[],
    files: any[],
    onThoughtChunk: (chunk: string) => void,
    onAnswerChunk: (chunk: string) => void,
    options?: any
  ): Promise<any> {
    if ('streamMessageWithFilesAndThinking' in this.baseService && typeof this.baseService.streamMessageWithFilesAndThinking === 'function') {
      await this.ensureConfigured()
      return this.baseService.streamMessageWithFilesAndThinking(messages, files, onThoughtChunk, onAnswerChunk, options)
    }
    throw new Error(`streamMessageWithFilesAndThinking not supported by ${this.provider} service`)
  }

  /**
   * Send message WITHOUT system prompt - for user prompt generation
   * This bypasses the automatic system prompt injection to avoid core identity contamination
   */
  async sendMessageWithoutSystemPrompt?(
    messages: any[],
    options?: any
  ): Promise<string> {
    await this.ensureConfigured()

    // For Gemini service, call direct API without system prompt
    if (this.provider === 'gemini' && 'client' in this.baseService) {
      const client = (this.baseService as any).client
      if (!client) {
        throw new Error('Gemini client not initialized')
      }

      const response = await client.models.generateContent({
        model: options?.model || 'gemini-2.0-flash-exp',
        contents: messages.map((msg: any) => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }]
        })),
        config: {
          temperature: options?.temperature || 0.8,
          maxOutputTokens: options?.maxTokens || 400
          // QUAN TRỌNG: KHÔNG có systemInstruction
        }
      })

      return response.text?.trim() || ''
    }

    throw new Error(`sendMessageWithoutSystemPrompt not supported by ${this.provider} service`)
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

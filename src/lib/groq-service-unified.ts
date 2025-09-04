/**
 * Unified Groq Service Implementation  
 * Works both on client (via API proxy) and server (direct API) environments
 * Auto-detects runtime environment and adapts accordingly
 *
 * Created: 2025-01-23 - Merged from groq-service.ts and groq-service-server.ts
 */

import { BaseAIService, AIMessage } from './ai-config';
import { GROQ_MODELS, getToolsModels, getReasoningModels, getGroqModelInfo as getModelInfo, getAvailableGroqModels } from './groq-config';
import { devConsole } from './console-override';
import { convertMessages } from './ai-shared-utils';
import { getCurrentSystemPrompt } from './prompt-storage';

// Export Groq types for external usage
export interface UseGroqServiceOptions {
  model?: string;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  systemPrompt?: string;  // Add systemPrompt to pass from API proxy
  frequency_penalty?: number;
  presence_penalty?: number;
  n?: number;
  stop?: string[];
  enable_browser_search?: boolean;
  enable_code_interpreter?: boolean;
  tools?: Array<{ type: string }>;
  reasoning_effort?: string;
  reasoning_format?: string;
  include_reasoning?: boolean;
  enableThinking?: boolean;
};

export class GroqService extends BaseAIService {
  private client?: any; // Groq instance for server-side
  private isServerSide: boolean;
  protected defaultModel: string = GROQ_MODELS.LLAMA_3_1_8B_INSTANT;
  protected storageKeyPrefix: string = 'groq';

  constructor(apiKey?: string) {
    super(apiKey);
    
    // Detect if running on server or client
    this.isServerSide = typeof window === 'undefined';
    
    if (this.isServerSide) {
      // Server-side initialization
      if (!apiKey) {
        throw new Error('Groq API key is required for server-side service.');
      }
      // Dynamic import to avoid client-side bundle issues
      const Groq = require('groq-sdk');
      this.client = new Groq({ apiKey });
      this.isConfigured = true;
    } else {
      // Client-side - service is configured by default (proxy handles the key)
      this.isConfigured = true;
    }
  }

  /**
   * Configure the service with an API key
   */
  configure(apiKey: string): void {
    this.apiKey = apiKey;
    
    if (this.isServerSide && apiKey) {
      const Groq = require('groq-sdk');
      this.client = new Groq({ apiKey });
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
      // Server-side validation via direct API call
      try {
        const Groq = require('groq-sdk');
        const tempClient = new Groq({ apiKey });
        
        const completion = await tempClient.chat.completions.create({
          messages: [{ role: 'user', content: 'Test' }],
          model: 'llama-3.3-70b-versatile',
          max_tokens: 1,
        });
        
        return !!completion;
      } catch {
        return false;
      }
    }
    
    // Client-side validation via API endpoint
    try {
      const response = await fetch('/api/user/keys/groq/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey }),
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.valid === true;
      }
      return false;
    } catch (error) {
      console.error('Failed to validate Groq API key:', error);
      return false;
    }
  }

  /**
   * Send a single message and get complete response
   */
  async sendMessage(
    messages: AIMessage[],
    options?: UseGroqServiceOptions
  ): Promise<string> {
    // Server-side direct API call
    if (this.isServerSide) {
      return this.sendMessageServer(messages, options);
    }
    
    // Client-side proxy call
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
        throw new Error(errorData.error || 'Groq request failed');
      }

      const data = await response.json();
      return data.response;
    } catch (error: any) {
      console.error('Groq sendMessage error:', error);
      throw error;
    }
  }

  /**
   * Server-side sendMessage implementation
   */
  private async sendMessageServer(
    messages: AIMessage[],
    options?: UseGroqServiceOptions
  ): Promise<string> {
    if (!this.client) {
      throw new Error('Groq client not initialized for server-side operation');
    }
    
    try {
      const model = options?.model || this.defaultModel;
      // Use systemPrompt from options (from API proxy with Supabase data)
      // Only fallback to getCurrentSystemPrompt if not provided
      const systemPrompt = options?.systemPrompt || getCurrentSystemPrompt();
      
      // Create prompt with system message
      const groqMessages = [
        { role: 'system', content: systemPrompt },
        ...convertMessages(messages, 'groq')
      ];

      // Build the request parameters
      const requestParams: any = {
        messages: groqMessages,
        model,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.max_tokens ?? 2048,
        top_p: options?.top_p ?? 0.9,
        frequency_penalty: options?.frequency_penalty ?? 0,
        presence_penalty: options?.presence_penalty ?? 0,
        n: options?.n ?? 1,
        stop: options?.stop,
      };

      // Add tools if provided
      if (options?.tools && options.tools.length > 0) {
        requestParams.tools = options.tools;
      }

      const completion = await this.client.chat.completions.create(requestParams);

      return completion.choices[0]?.message?.content || '';
    } catch (error: any) {
      console.error('Groq API error:', error);
      throw error;
    }
  }

  /**
   * Stream message with real-time response chunks
   */
  async streamMessage(
    messages: AIMessage[],
    onChunk: (chunk: string) => void,
    options?: UseGroqServiceOptions & { 
      abortController?: AbortController;
      abortSignal?: AbortSignal;
    }
  ): Promise<void> {
    // Server-side direct API streaming
    if (this.isServerSide) {
      return this.streamMessageServer(messages, onChunk, options);
    }
    
    // Client-side proxy streaming
    try {
      const response = await fetch('/api/ai-proxy/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          provider: 'groq', 
          messages, 
          options: { ...options, stream: true } 
        }),
        signal: options?.abortController?.signal,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Stream request failed');
      }

      if (!response.body) {
        throw new Error('No response body for streaming');
      }

      // Process the stream  
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim()) {
            onChunk(line + '\n');
          }
        }
      }

      if (buffer.trim()) {
        onChunk(buffer + '\n');
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Stream aborted by user');
        return;
      }
      console.error('Groq streamMessage error:', error);
      throw error;
    }
  }

  /**
   * Server-side streamMessage implementation
   */
  private async streamMessageServer(
    messages: AIMessage[],
    onChunk: (chunk: string) => void,
    options?: any
  ): Promise<void> {
    if (!this.client) {
      throw new Error('Groq client not initialized for server-side operation');
    }
    
    const model = options?.model || this.defaultModel;
    // Use systemPrompt from options (from API proxy with Supabase data)
    // Only fallback to getCurrentSystemPrompt if not provided
    const systemPrompt = options?.systemPrompt || getCurrentSystemPrompt();
    const abortSignal = options?.abortSignal || options?.abortController?.signal;
    
    try {
      // Check if it's a reasoning model
      const isReasoningModel = getReasoningModels().some(m => m.id === model);
      
      if (isReasoningModel) {
        // Stream reasoning model with special handling
        // Create prompt with system message
        const groqMessages = [
          { role: 'system', content: systemPrompt },
          ...convertMessages(messages, 'groq')
        ];
        
        // Build the request parameters for reasoning model
        const requestParams: any = {
          messages: groqMessages,
          model,
          temperature: options?.temperature ?? 0.7,
          max_tokens: options?.max_tokens ?? 8192,
          stream: true,
        };
        
        // Add reasoning effort for GPT-OSS models
        if (model.includes('gpt-oss')) {
          // Default to 'low' if thinking not explicitly enabled
          requestParams.reasoning_effort = options?.enableThinking ? 'high' : 'low';
        }

        // Add tools if provided
        if (options?.tools && options.tools.length > 0) {
          requestParams.tools = options.tools;
        }

        const stream = await this.client.chat.completions.create(requestParams);

        let isThinking = false;
        let thoughtBuffer = '';
        
        for await (const chunk of stream) {
          if (abortSignal?.aborted) break;
          
          const content = chunk.choices[0]?.delta?.content || '';
          if (!content) continue;

          // Check for thinking markers - both <thinking> and <think>
          if (content.includes('<thinking>') || content.includes('<think>')) {
            isThinking = true;
            thoughtBuffer = '';
            const parts = content.split(/<think(?:ing)?>/);
            if (parts[0]) {
              onChunk(JSON.stringify({ type: 'content', content: parts[0] }) + '\n');
            }
            if (parts[1]) {
              thoughtBuffer = parts[1];
            }
            continue;
          }

          if (isThinking) {
            if (content.includes('</thinking>') || content.includes('</think>')) {
              isThinking = false;
              const parts = content.split(/<\/think(?:ing)?>/);
              if (parts[0]) {
                thoughtBuffer += parts[0];
              }
              // Send complete thought as reasoning for GPT-OSS models
              if (thoughtBuffer) {
                if (model.includes('gpt-oss')) {
                  // GPT-OSS sends reasoning type for auto-collapse
                  onChunk(JSON.stringify({ type: 'reasoning', content: thoughtBuffer }) + '\n');
                } else {
                  // Other models send thought type
                  onChunk(JSON.stringify({ type: 'thought', content: thoughtBuffer }) + '\n');
                }
              }
              onChunk(JSON.stringify({ type: 'reasoning_complete' }) + '\n');
              // Send remaining content
              if (parts[1]) {
                onChunk(JSON.stringify({ type: 'content', content: parts[1] }) + '\n');
              }
              thoughtBuffer = '';
            } else {
              thoughtBuffer += content;
            }
          } else {
            onChunk(JSON.stringify({ type: 'content', content }) + '\n');
          }
        }

        onChunk(JSON.stringify({ type: 'done' }) + '\n');
      } else {
        // Regular streaming
        const groqMessages = [
          { role: 'system', content: systemPrompt },
          ...convertMessages(messages, 'groq')
        ];
        
        // Build the request parameters for regular model
        const requestParams: any = {
          messages: groqMessages,
          model,
          temperature: options?.temperature ?? 0.7,
          max_tokens: options?.max_tokens ?? 2048,
          top_p: options?.top_p ?? 0.9,
          frequency_penalty: options?.frequency_penalty ?? 0,
          presence_penalty: options?.presence_penalty ?? 0,
          stream: true,
        };

        // Add tools if provided
        if (options?.tools && options.tools.length > 0) {
          requestParams.tools = options.tools;
        }

        const stream = await this.client.chat.completions.create(requestParams);

        for await (const chunk of stream) {
          if (abortSignal?.aborted) break;
          
          const content = chunk.choices[0]?.delta?.content || '';
          if (content) {
            onChunk(JSON.stringify({ type: 'content', content }) + '\n');
          }
        }

        onChunk(JSON.stringify({ type: 'done' }) + '\n');
      }
    } catch (error: any) {
      console.error('Groq streaming error:', error);
      throw error;
    }
  }

  /**
   * Generate a chat title based on the first message
   */
  async generateChatTitle(firstMessage: string): Promise<string> {
    try {
      const prompt = `Generate a short, concise title (3-5 words) for a chat that starts with: "${firstMessage}". Only output the title, nothing else.`;
      const title = await this.sendMessage([{ role: 'user', content: prompt }], {
        model: this.defaultModel,
        temperature: 0.7,
        max_tokens: 50
      });
      return title.trim() || 'New Chat';
    } catch (error) {
      console.error('Failed to generate title:', error);
      return 'New Chat';
    }
  }

  /**
   * Get available models
   */
  getAvailableModels() {
    return getAvailableGroqModels();
  }

  /**
   * Check if a model supports advanced features
   */
  modelSupportsAdvancedFeatures(model: string): boolean {
    return getReasoningModels().some((m: any) => m.id === model);
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

  /**
   * Get models that support tools
   */
  getToolsModels() {
    return getToolsModels();
  }

  /**
   * Get reasoning models
   */
  getReasoningModels() {
    return getReasoningModels();
  }
}

// Export singleton instance
let groqServiceInstance: GroqService | null = null;

export function getGroqService(apiKey?: string): GroqService {
  if (!groqServiceInstance) {
    groqServiceInstance = new GroqService(apiKey);
  } else if (apiKey && !groqServiceInstance.configured) {
    // Allow reconfiguration if service wasn't configured before
    groqServiceInstance.configure(apiKey);
  }
  return groqServiceInstance;
}

// Export as default for compatibility
export default GroqService;

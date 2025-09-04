/**
 * Unified Gemini Service Implementation
 * Works both on client (via API proxy) and server (direct API) environments
 * Auto-detects runtime environment and adapts accordingly
 * 
 * Created: 2025-01-23 - Merged from gemini-service.ts and gemini-service-server.ts
 */

import { BaseAIService, AIMessage } from './ai-config';
import { GEMINI_MODELS, getModelInfo, getAvailableModels, createGeminiConfig } from './gemini-config';
import { 
  GeminiFileHandler,
  GeminiStreamingHandler,
  GeminiTitleGenerator,
  GeminiUtils,
  GeminiConfigHelper,
  UseGeminiServiceOptions
} from './gemini-helpers';
import { getCurrentSystemPrompt } from './prompt-storage';

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
  private client?: any; // GoogleGenAI instance for server-side
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
      // Dynamic import to avoid client-side bundle issues
      const { GoogleGenAI } = require('@google/genai');
      this.client = new GoogleGenAI({ apiKey });
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
      const { GoogleGenAI } = require('@google/genai');
      this.client = new GoogleGenAI({ apiKey });
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
    
    // Client-side validation via API endpoint
    try {
      const response = await fetch('/api/user/keys/gemini/validate', {
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
      console.error('Failed to validate Gemini API key:', error);
      return false;
    }
  }

  /**
   * Send a single message and get complete response
   */
  async sendMessage(
    messages: AIMessage[],
    options?: UseGeminiServiceOptions & {
      systemPrompt?: string;
      enableGoogleSearch?: boolean;
      enableTools?: boolean;
      enableUrlContext?: boolean;
      enableCodeExecution?: boolean;
    }
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
   * Server-side sendMessage implementation
   */
  private async sendMessageServer(
    messages: AIMessage[],
    options?: any
  ): Promise<string> {
    if (!this.client) {
      throw new Error('Gemini client not initialized for server-side operation');
    }
    
    const modelId = options?.model || GEMINI_MODELS.FLASH_2_5;
    // Use systemPrompt from options (from API proxy with Supabase data)
    // Only fallback to getCurrentSystemPrompt if not provided
    const systemPrompt = options?.systemPrompt || getCurrentSystemPrompt();

    let firstUserInjected = false;
    const contents = (messages || [])
      .filter(m => m.role !== 'system')
      .map((m) => {
        let text = m.content;
        if (!firstUserInjected && m.role === 'user' && systemPrompt) {
          text = `${systemPrompt}\n\n---\n\n${m.content}`;
          firstUserInjected = true;
        }
        return {
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text }]
        } as any;
      });

    // Build tools config
    const tools: any[] = [];
    if (options?.enableUrlContext) tools.push({ urlContext: {} });
    if (options?.enableGoogleSearch || options?.enableTools) tools.push({ googleSearch: {} });
    if (options?.enableCodeExecution) tools.push({ codeExecution: {} });

    const config = createGeminiConfig({
      model: modelId,
      temperature: options?.temperature,
      tools,
      systemInstruction: systemPrompt  // Pass the systemPrompt to config
    });

    const resp: any = await this.client.models.generateContent({
      model: modelId,
      config,
      contents
    });

    // Parse response parts
    try {
      const parts = resp?.candidates?.[0]?.content?.parts || [];
      if (parts.length > 0) {
        let combined = '';
        for (const part of parts) {
          if (part.text) combined += part.text;
          if (part.executableCode && part.executableCode.code) {
            const lang = (part.executableCode.language || 'text').toLowerCase();
            combined += `\n\`\`\`${lang}\n${part.executableCode.code}\n\`\`\`\n`;
          }
          if (part.codeExecutionResult && part.codeExecutionResult.output) {
            combined += `\nOutput:\n\`\`\`\n${part.codeExecutionResult.output}\n\`\`\`\n`;
          }
        }
        if (combined.trim()) return combined;
      }
    } catch {}

    // Fallback
    if (resp?.text) return resp.text as string;
    const text = resp?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text).join('') ?? '';
    return text || 'No response generated';
  }

  /**
   * Stream message with optional features
   */
  async streamMessage(
    messages: AIMessage[],
    onChunk: (chunk: string) => void,
    options?: UseGeminiServiceOptions & {
      abortController?: AbortController;
      files?: any[];
      systemPrompt?: string;
      enableGoogleSearch?: boolean;
      enableTools?: boolean;
      enableUrlContext?: boolean;
      enableCodeExecution?: boolean;
      enableThinking?: boolean;
      thinkingConfig?: { thinkingBudget?: number; includeThoughts?: boolean };
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
          provider: 'gemini', 
          messages, 
          options: { ...options, stream: true },
          files: options?.files 
        }),
        signal: options?.abortController?.signal,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'AI proxy stream failed');
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
      console.error('Gemini streamMessage error:', error);
      throw GeminiUtils.handleApiError(error, 'stream tin nhắn');
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
      throw new Error('Gemini client not initialized for server-side operation');
    }
    
    const modelId = options?.model || GEMINI_MODELS.FLASH_2_5;
    // Use systemPrompt from options (from API proxy with Supabase data)
    // Only fallback to getCurrentSystemPrompt if not provided
    const systemPrompt = options?.systemPrompt || getCurrentSystemPrompt();
    const abortSignal = options?.abortSignal || options?.abortController?.signal;

    let firstUserInjected = false;
    const contents = (messages || [])
      .filter(m => m.role !== 'system')
      .map((m) => {
        let text = m.content;
        if (!firstUserInjected && m.role === 'user' && systemPrompt) {
          text = `${systemPrompt}\n\n---\n\n${m.content}`;
          firstUserInjected = true;
        }
        return {
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text }]
        } as any;
      });

    // Build tools/thinking config
    const tools: any[] = [];
    if (options?.enableUrlContext) tools.push({ urlContext: {} });
    if (options?.enableGoogleSearch || options?.enableTools) tools.push({ googleSearch: {} });
    if (options?.enableCodeExecution) tools.push({ codeExecution: {} });

    const configOverrides: any = {
      temperature: options?.temperature,
      tools,
      model: modelId,
      systemInstruction: systemPrompt
    };

    if (options?.enableThinking) {
      configOverrides.thinkingConfig = {
        thinkingBudget: options?.thinkingConfig?.thinkingBudget ?? -1,
        includeThoughts: options?.thinkingConfig?.includeThoughts ?? true,
      };
    }

    const config = createGeminiConfig(configOverrides);

    try {
      const stream: any = await this.client.models.generateContentStream({
        model: modelId,
        config,
        contents
      });

      let hadThought = false;
      let hadContent = false;
      
      for await (const chunk of stream) {
        // Stop early if aborted
        if (abortSignal?.aborted) break;

        if (options?.enableThinking) {
          // Process thinking mode chunks
          const parts = chunk?.candidates?.[0]?.content?.parts || [];
          if (parts.length > 0) {
            for (const part of parts) {
              if (part.thought && part.text) {
                hadThought = true;
                onChunk(JSON.stringify({ type: 'thought', content: part.text }) + '\n');
              } else if (!part.thought && part.text) {
                if (hadThought && !hadContent) {
                  onChunk(JSON.stringify({ type: 'reasoning_complete' }) + '\n');
                  hadContent = true;
                }
                onChunk(JSON.stringify({ type: 'content', content: part.text }) + '\n');
              } else if (part.executableCode && part.executableCode.code) {
                if (hadThought && !hadContent) {
                  onChunk(JSON.stringify({ type: 'reasoning_complete' }) + '\n');
                  hadContent = true;
                }
                const lang = (part.executableCode.language || 'text').toLowerCase();
                const codeContent = `\n\`\`\`${lang}\n${part.executableCode.code}\n\`\`\`\n`;
                onChunk(JSON.stringify({ type: 'content', content: codeContent }) + '\n');
              } else if (part.codeExecutionResult && part.codeExecutionResult.output) {
                if (hadThought && !hadContent) {
                  onChunk(JSON.stringify({ type: 'reasoning_complete' }) + '\n');
                  hadContent = true;
                }
                const outputContent = `\nOutput:\n\`\`\`\n${part.codeExecutionResult.output}\n\`\`\`\n`;
                onChunk(JSON.stringify({ type: 'content', content: outputContent }) + '\n');
              }
            }
          } else if (chunk?.text) {
            if (hadThought && !hadContent) {
              onChunk(JSON.stringify({ type: 'reasoning_complete' }) + '\n');
              hadContent = true;
            }
            onChunk(JSON.stringify({ type: 'content', content: chunk.text }) + '\n');
          }
          continue;
        }

        // Default (non-thinking) behavior
        const parts = chunk?.candidates?.[0]?.content?.parts || [];
        if (parts.length > 0) {
          for (const part of parts) {
            if (part.text) {
              onChunk(JSON.stringify({ type: 'content', content: part.text }) + '\n');
            }
            if (part.executableCode && part.executableCode.code) {
              const lang = (part.executableCode.language || 'text').toLowerCase();
              const codeContent = `\n\`\`\`${lang}\n${part.executableCode.code}\n\`\`\`\n`;
              onChunk(JSON.stringify({ type: 'content', content: codeContent }) + '\n');
            }
            if (part.codeExecutionResult && part.codeExecutionResult.output) {
              const outputContent = `\nOutput:\n\`\`\`\n${part.codeExecutionResult.output}\n\`\`\`\n`;
              onChunk(JSON.stringify({ type: 'content', content: outputContent }) + '\n');
            }
          }
        } else if (chunk?.text) {
          onChunk(JSON.stringify({ type: 'content', content: chunk.text }) + '\n');
        }
      }
      
      // Send completion signal
      onChunk(JSON.stringify({ type: 'done' }) + '\n');
    } catch (err) {
      throw err;
    }
  }

  /**
   * Stream message with file attachments (server-side only for now)
   */
  async streamMessageWithFiles(
    messages: AIMessage[],
    files: any[],
    onChunk: (chunk: string) => void,
    options?: any
  ): Promise<void> {
    if (!this.isServerSide) {
      // For client-side, use regular streamMessage with files option
      return this.streamMessage(messages, onChunk, { ...options, files });
    }
    
    if (!this.client) {
      throw new Error('Gemini client not initialized for server-side operation');
    }
    
    const modelId = options?.model || GEMINI_MODELS.FLASH_2_5;
    const systemPrompt = options?.systemPrompt;
    const abortSignal = options?.abortSignal || options?.abortController?.signal;

    let firstUserInjected = false;
    const contents = (messages || [])
      .filter(m => m.role !== 'system')
      .map((m) => {
        let text = m.content;
        if (!firstUserInjected && m.role === 'user' && systemPrompt) {
          text = `${systemPrompt}\n\n---\n\n${m.content}`;
          firstUserInjected = true;
        }
        return {
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text }]
        } as any;
      });

    // Add files to the last user message
    if (contents.length > 0 && files && files.length > 0) {
      const lastMessage = contents[contents.length - 1];
      if (lastMessage.role === 'user') {
        const fileParts = files.map(file => ({
          inlineData: {
            mimeType: file.mimeType || 'application/octet-stream',
            data: file.data
          }
        }));
        lastMessage.parts.push(...fileParts);
      }
    }

    // Build tools config
    const tools: any[] = [];
    if (options?.enableUrlContext) tools.push({ urlContext: {} });
    if (options?.enableGoogleSearch || options?.enableTools) tools.push({ googleSearch: {} });
    if (options?.enableCodeExecution) tools.push({ codeExecution: {} });

    const config = createGeminiConfig({
      model: modelId,
      temperature: options?.temperature,
      tools,
      systemInstruction: systemPrompt  // Pass the systemPrompt to config
    });

    try {
      const stream: any = await this.client.models.generateContentStream({
        model: modelId,
        config,
        contents
      });

      for await (const chunk of stream) {
        if (abortSignal?.aborted) break;

        const parts = chunk?.candidates?.[0]?.content?.parts || [];
        if (parts.length > 0) {
          for (const part of parts) {
            if (part.text) {
              onChunk(JSON.stringify({ type: 'content', content: part.text }) + '\n');
            }
            if (part.executableCode && part.executableCode.code) {
              const lang = (part.executableCode.language || 'text').toLowerCase();
              const codeContent = `\n\`\`\`${lang}\n${part.executableCode.code}\n\`\`\`\n`;
              onChunk(JSON.stringify({ type: 'content', content: codeContent }) + '\n');
            }
            if (part.codeExecutionResult && part.codeExecutionResult.output) {
              const outputContent = `\nOutput:\n\`\`\`\n${part.codeExecutionResult.output}\n\`\`\`\n`;
              onChunk(JSON.stringify({ type: 'content', content: outputContent }) + '\n');
            }
          }
        } else if (chunk?.text) {
          onChunk(JSON.stringify({ type: 'content', content: chunk.text }) + '\n');
        }
      }
      
      onChunk(JSON.stringify({ type: 'done' }) + '\n');
    } catch (err) {
      throw err;
    }
  }

  /**
   * Generate a chat title based on the first message
   */
  async generateChatTitle(firstMessage: string): Promise<string> {
    if (this.isServerSide) {
      // Server-side: use direct API
      if (!this.client) return 'New Chat';
      const generator = new GeminiTitleGenerator(this.client);
      return generator.generateChatTitle(firstMessage);
    }
    
    // Client-side: use API endpoint
    try {
      const response = await fetch('/api/ai-proxy/generate-title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          firstMessage,
          provider: 'gemini' 
        }),
      });

      if (!response.ok) {
        return 'New Chat';
      }

      const data = await response.json();
      return data.title || 'New Chat';
    } catch (error) {
      console.error('Failed to generate title:', error);
      return 'New Chat';
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

// Export singleton instance
let geminiServiceInstance: GeminiService | null = null;

export function getGeminiService(apiKey?: string): GeminiService {
  if (!geminiServiceInstance) {
    geminiServiceInstance = new GeminiService(apiKey);
  } else if (apiKey && !geminiServiceInstance.configured) {
    // Allow reconfiguration if service wasn't configured before
    geminiServiceInstance.configure(apiKey);
  }
  return geminiServiceInstance;
}

// Export as default for compatibility
export default GeminiService;

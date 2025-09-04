/**
 * Gemini Service Implementation (Server-Side)
 * This version communicates directly with the Google GenAI API and is intended for backend use only.
 */

import { GoogleGenAI } from '@google/genai';
import { GEMINI_MODELS, createGeminiConfig } from './gemini-config';
import { BaseAIService, AIMessage } from './ai-config';

export class GeminiServiceServer extends BaseAIService {
  private client: GoogleGenAI;
  protected defaultModel: string = GEMINI_MODELS.FLASH_2_5;
  protected storageKeyPrefix: string = 'gemini';

  constructor(apiKey: string) {
    super(apiKey);
    if (!apiKey) {
      throw new Error('Gemini API key is required for server-side service.');
    }
    // Initialize GoogleGenAI client (genai SDK) with apiKey
    this.client = new GoogleGenAI({ apiKey });
    this.isConfigured = true;
  }

  async validateApiKey(_apiKey: string): Promise<boolean> {
    // Validation handled by dedicated endpoint; server-side instances are trusted.
    return true;
  }

  configure(apiKey: string): void {
    this.apiKey = apiKey;
    this.client = new GoogleGenAI({ apiKey });
    this.isConfigured = true;
  }

  /**
   * Send non-streaming request with optional Google Search tool.
   * We still inject systemPrompt into the first user message for consistency.
   */
  async sendMessage(
    messages: AIMessage[],
    options?: { model?: string; temperature?: number; systemPrompt?: string; enableGoogleSearch?: boolean; enableTools?: boolean; enableUrlContext?: boolean; enableCodeExecution?: boolean }
  ): Promise<string> {
    const modelId = options?.model || GEMINI_MODELS.FLASH_2_5;
    const systemPrompt: string | undefined = options?.systemPrompt;

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
      tools
    });

    const resp: any = await this.client.models.generateContent({
      model: modelId,
      config,
      contents
    });

    // Prefer parsing parts to include code execution outputs
    try {
      const parts = resp?.candidates?.[0]?.content?.parts || [];
      if (parts.length > 0) {
        let combined = '';
        for (const part of parts) {
          if (part.text) combined += part.text;
          if (part.executableCode && part.executableCode.code) {
            const lang = (part.executableCode.language || 'text').toLowerCase();
            combined += `\n\u0060\u0060\u0060${lang}\n${part.executableCode.code}\n\u0060\u0060\u0060\n`;
          }
          if (part.codeExecutionResult && part.codeExecutionResult.output) {
            combined += `\nOutput:\n\u0060\u0060\u0060\n${part.codeExecutionResult.output}\n\u0060\u0060\u0060\n`;
          }
        }
        if (combined.trim()) return combined;
      }
    } catch {}

    // Fallback to SDK convenience
    if (resp?.text) return resp.text as string;
    const text = resp?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text).join('') ?? '';
    return text || 'No response generated';
  }

  /**
   * Stream message with file attachments
   */
  async streamMessageWithFiles(
    messages: AIMessage[],
    files: any[],
    onChunk: (chunk: string) => void,
    options?: {
      model?: string;
      temperature?: number;
      systemPrompt?: string;
      abortSignal?: AbortSignal;
      enableGoogleSearch?: boolean;
      enableTools?: boolean;
      enableUrlContext?: boolean;
      enableCodeExecution?: boolean;
    }
  ): Promise<void> {
    const modelId = options?.model || GEMINI_MODELS.FLASH_2_5;
    const systemPrompt: string | undefined = options?.systemPrompt;

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
        // Convert files to Gemini format
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
      tools
    });

    try {
      const stream: any = await this.client.models.generateContentStream({
        model: modelId,
        config,
        contents
      });

      for await (const chunk of stream) {
        // Stop early if aborted by caller
        if (options?.abortSignal?.aborted) break;

        // Forward text and code blocks as JSON chunks
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
      // Re-throw to allow route to format STREAM_ERROR
      throw err;
    }
  }

  /**
   * Streaming using Google GenAI SDK generateContentStream.
   * - Injects systemPrompt into the first user message (same as sendMessage).
   * - Supports optional AbortSignal via options.abortSignal to stop streaming early.
   * - When enableThinking is true and model supports it, we forward raw SDK chunks (JSON lines) to the client
   *   so the frontend can render thinking content exactly as provided by Google Gemini (no custom tags added).
   */
  async streamMessage(
    messages: AIMessage[],
    onChunk: (chunk: string) => void,
    options?: {
      model?: string;
      temperature?: number;
      systemPrompt?: string;
      abortSignal?: AbortSignal;
      enableGoogleSearch?: boolean;
      enableTools?: boolean;
      enableUrlContext?: boolean;
      enableCodeExecution?: boolean;
      enableThinking?: boolean;
      thinkingConfig?: { thinkingBudget?: number; includeThoughts?: boolean };
    }
  ): Promise<void> {
    const modelId = options?.model || GEMINI_MODELS.FLASH_2_5;
    const systemPrompt: string | undefined = options?.systemPrompt;

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
      console.log('[Gemini Thinking] Enabled for first message:', {
        model: modelId,
        messageCount: messages.length,
        hasHistory: messages.length > 1,
        thinkingConfig: configOverrides.thinkingConfig
      });
    }

    const config = createGeminiConfig(configOverrides);
    
    // Debug log the final config
    if (options?.enableThinking && config.thinkingConfig) {
      console.log('[Gemini Config] Final config with thinking:', {
        hasThinkingConfig: !!config.thinkingConfig,
        thinkingBudget: config.thinkingConfig?.thinkingBudget,
        includeThoughts: config.thinkingConfig?.includeThoughts
      });
    }

    try {
      const stream: any = await this.client.models.generateContentStream({
        model: modelId,
        config,
        contents
      });

      let hadThought = false;
      let hadContent = false;
      
      for await (const chunk of stream) {
        // Stop early if aborted by caller
        if (options?.abortSignal?.aborted) break;

        if (options?.enableThinking) {
          // Process thinking mode chunks with proper format
          const parts = chunk?.candidates?.[0]?.content?.parts || [];
          if (parts.length > 0) {
            for (const part of parts) {
              // Handle thought parts
              if (part.thought && part.text) {
                hadThought = true;
                onChunk(JSON.stringify({ type: 'thought', content: part.text }) + '\n');
              }
              // Handle regular text parts (non-thought)
              else if (!part.thought && part.text) {
                // If we had thoughts and now getting content, send reasoning_complete signal
                if (hadThought && !hadContent) {
                  onChunk(JSON.stringify({ type: 'reasoning_complete' }) + '\n');
                  hadContent = true;
                }
                onChunk(JSON.stringify({ type: 'content', content: part.text }) + '\n');
              }
              // Handle executable code
              else if (part.executableCode && part.executableCode.code) {
                if (hadThought && !hadContent) {
                  onChunk(JSON.stringify({ type: 'reasoning_complete' }) + '\n');
                  hadContent = true;
                }
                const lang = (part.executableCode.language || 'text').toLowerCase();
                const codeContent = `\n\`\`\`${lang}\n${part.executableCode.code}\n\`\`\`\n`;
                onChunk(JSON.stringify({ type: 'content', content: codeContent }) + '\n');
              }
              // Handle code execution results
              else if (part.codeExecutionResult && part.codeExecutionResult.output) {
                if (hadThought && !hadContent) {
                  onChunk(JSON.stringify({ type: 'reasoning_complete' }) + '\n');
                  hadContent = true;
                }
                const outputContent = `\nOutput:\n\`\`\`\n${part.codeExecutionResult.output}\n\`\`\`\n`;
                onChunk(JSON.stringify({ type: 'content', content: outputContent }) + '\n');
              }
            }
          } else if (chunk?.text) {
            // Fallback for plain text
            if (hadThought && !hadContent) {
              onChunk(JSON.stringify({ type: 'reasoning_complete' }) + '\n');
              hadContent = true;
            }
            onChunk(JSON.stringify({ type: 'content', content: chunk.text }) + '\n');
          }
          continue;
        }

        // Default (non-thinking) behavior: forward text and code blocks as JSON chunks
        const parts = chunk?.candidates?.[0]?.content?.parts || [];
        if (parts.length > 0) {
          for (const part of parts) {
            if (part.text) {
              // Send as JSON chunk to match Groq format
              onChunk(JSON.stringify({ type: 'content', content: part.text }) + '\n');
            }
            if (part.executableCode && part.executableCode.code) {
              const lang = (part.executableCode.language || 'text').toLowerCase();
              const codeContent = `\n\u0060\u0060\u0060${lang}\n${part.executableCode.code}\n\u0060\u0060\u0060\n`;
              onChunk(JSON.stringify({ type: 'content', content: codeContent }) + '\n');
            }
            if (part.codeExecutionResult && part.codeExecutionResult.output) {
              const outputContent = `\nOutput:\n\u0060\u0060\u0060\n${part.codeExecutionResult.output}\n\u0060\u0060\u0060\n`;
              onChunk(JSON.stringify({ type: 'content', content: outputContent }) + '\n');
            }
          }
        } else if (chunk?.text) {
          // Send as JSON chunk to match Groq format
          onChunk(JSON.stringify({ type: 'content', content: chunk.text }) + '\n');
        }
      }
      
      // Send done signal for thinking mode
      if (options?.enableThinking) {
        onChunk(JSON.stringify({ type: 'done' }) + '\n');
      }
      
      // Send completion signal for non-thinking mode
      if (!options?.enableThinking) {
        onChunk(JSON.stringify({ type: 'done' }) + '\n');
      }
    } catch (err) {
      // Re-throw to allow route to format STREAM_ERROR
      throw err;
    }
  }
}

/**
 * Server-side Gemini service handler
 * Manages direct API calls and server-side operations
 */

import { AIMessage } from '../ai-config';
import { GEMINI_MODELS, createGeminiConfig } from '../gemini-config';
import { GeminiTitleGenerator } from '../gemini-helpers';
import { getCurrentSystemPrompt } from '../prompt-storage';
import { GeminiServiceOptions, GeminiResponse } from './types';

export class GeminiServerHandler {
  private client: any;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('Gemini API key is required for server-side service.');
    }
    
    // Dynamic import to avoid client-side bundle issues
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { GoogleGenAI } = require('@google/genai');
    this.client = new GoogleGenAI({ apiKey });
  }

  /**
   * Send message via direct API
   */
  async sendMessage(
    messages: AIMessage[],
    options?: GeminiServiceOptions
  ): Promise<string> {
    const modelId = options?.model || GEMINI_MODELS.FLASH_2_5;
    const systemPrompt = options?.systemPrompt || getCurrentSystemPrompt();

    const contents = this.convertMessages(messages, systemPrompt);
    const tools = this.buildToolsConfig(options);
    
    const config = createGeminiConfig({
      model: modelId,
      temperature: options?.temperature,
      tools,
      systemInstruction: systemPrompt
    });

    const resp: GeminiResponse = await this.client.models.generateContent({
      model: modelId,
      config,
      contents
    });

    return this.parseResponse(resp);
  }

  /**
   * Stream message via direct API
   */
  async streamMessage(
    messages: AIMessage[],
    onChunk: (chunk: string) => void,
    options?: GeminiServiceOptions
  ): Promise<void> {
    const modelId = options?.model || GEMINI_MODELS.FLASH_2_5;
    const systemPrompt = options?.systemPrompt || getCurrentSystemPrompt();
    const abortSignal = options?.abortSignal || options?.abortController?.signal;

    const contents = this.convertMessages(messages, systemPrompt);
    const tools = this.buildToolsConfig(options);

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

      if (options?.enableThinking) {
        await this.processThinkingStream(stream, onChunk, abortSignal);
      } else {
        await this.processRegularStream(stream, onChunk, abortSignal);
      }
      
      onChunk(JSON.stringify({ type: 'done' }) + '\n');
    } catch (err) {
      throw err;
    }
  }

  /**
   * Stream message with file attachments
   */
  async streamMessageWithFiles(
    messages: AIMessage[],
    files: any[],
    onChunk: (chunk: string) => void,
    options?: GeminiServiceOptions
  ): Promise<void> {
    const modelId = options?.model || GEMINI_MODELS.FLASH_2_5;
    const systemPrompt = options?.systemPrompt;
    const abortSignal = options?.abortSignal || options?.abortController?.signal;

    const contents = this.convertMessages(messages, systemPrompt);
    
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

    const tools = this.buildToolsConfig(options);
    const config = createGeminiConfig({
      model: modelId,
      temperature: options?.temperature,
      tools,
      systemInstruction: systemPrompt
    });

    try {
      const stream: any = await this.client.models.generateContentStream({
        model: modelId,
        config,
        contents
      });

      await this.processRegularStream(stream, onChunk, abortSignal);
      onChunk(JSON.stringify({ type: 'done' }) + '\n');
    } catch (err) {
      throw err;
    }
  }

  /**
   * Generate chat title
   */
  async generateChatTitle(firstMessage: string): Promise<string> {
    const generator = new GeminiTitleGenerator(this.client);
    return generator.generateChatTitle(firstMessage);
  }

  /**
   * Convert AI messages to Gemini format
   */
  private convertMessages(messages: AIMessage[], systemPrompt?: string): any[] {
    let firstUserInjected = false;
    
    return (messages || [])
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
        };
      });
  }

  /**
   * Build tools configuration
   */
  private buildToolsConfig(options?: GeminiServiceOptions): any[] {
    const tools: any[] = [];
    if (options?.enableUrlContext) tools.push({ urlContext: {} });
    if (options?.enableGoogleSearch || options?.enableTools) tools.push({ googleSearch: {} });
    if (options?.enableCodeExecution) tools.push({ codeExecution: {} });
    return tools;
  }

  /**
   * Parse API response
   */
  private parseResponse(resp: GeminiResponse): string {
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
   * Process thinking mode stream
   */
  private async processThinkingStream(
    stream: any,
    onChunk: (chunk: string) => void,
    abortSignal?: AbortSignal
  ): Promise<void> {
    let hadThought = false;
    let hadContent = false;
    
    for await (const chunk of stream) {
      if (abortSignal?.aborted) break;

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
    }
  }

  /**
   * Process regular stream
   */
  private async processRegularStream(
    stream: any,
    onChunk: (chunk: string) => void,
    abortSignal?: AbortSignal
  ): Promise<void> {
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
  }
}

/**
 * Client-side Gemini service handler
 * Manages API proxy calls and client-side operations
 */

import { AIMessage } from '../ai-config';
import { GeminiServiceOptions } from './types';
import { GeminiUtils } from '../gemini-helpers';

export class GeminiClientHandler {
  /**
   * Send message via API proxy
   */
  async sendMessage(
    messages: AIMessage[],
    options?: GeminiServiceOptions
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
   * Stream message via API proxy
   */
  async streamMessage(
    messages: AIMessage[],
    onChunk: (chunk: string) => void,
    options?: GeminiServiceOptions
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

      await this.processStreamResponse(response.body, onChunk);
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
   * Generate chat title via API proxy
   */
  async generateChatTitle(firstMessage: string): Promise<string> {
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
   * Validate API key via endpoint
   */
  async validateApiKey(apiKey: string): Promise<boolean> {
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
   * Process streaming response body
   */
  private async processStreamResponse(
    body: ReadableStream<Uint8Array>,
    onChunk: (chunk: string) => void
  ): Promise<void> {
    const reader = body.getReader();
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
  }
}

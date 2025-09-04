/**
 * Groq Service Implementation (Server-Side)
 * This version communicates directly with the Groq API and is intended for backend use only.
 */

import Groq from 'groq-sdk';
import { GROQ_MODELS, getGroqModelInfo } from './groq-config';
import { BaseAIService, AIMessage } from './ai-config';


export class GroqServiceServer extends BaseAIService {
  private client: Groq;
  protected defaultModel: string = GROQ_MODELS.LLAMA_3_1_8B_INSTANT;
  protected storageKeyPrefix: string = 'groq';

  constructor(apiKey: string) {
    super(apiKey);
    if (!apiKey) {
      throw new Error('Groq API key is required for server-side service.');
    }
    this.client = new Groq({ apiKey });
    this.isConfigured = true;
  }

  async validateApiKey(_apiKey: string): Promise<boolean> {
    // Validation is handled by dedicated endpoint; server instances are trusted.
    return true;
  }

  configure(apiKey: string): void {
    this.apiKey = apiKey;
    this.client = new Groq({ apiKey });
    this.isConfigured = true;
  }

  async sendMessage(messages: AIMessage[], options?: any): Promise<string> {
    // Map AIMessage to Groq format, preserving 'system' role
    const groqMessages = (messages || []).map((m: any) => ({
      role: m.role === 'assistant' ? 'assistant' : m.role === 'system' ? 'system' : 'user',
      content: m.content
    }));

    const model = options?.model || this.defaultModel;
    const modelInfo = getGroqModelInfo(model);

    const payload: any = {
      model,
      messages: groqMessages as any,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.max_tokens ?? 1024,
    };

    // Advanced features for GPT-OSS models
    if (modelInfo?.supportsTools && options?.tools) {
      payload.tools = options.tools;
      // Don't set tool_choice - let model decide
      
      if (options?.reasoning_effort) payload.reasoning_effort = options.reasoning_effort;
      if (options?.reasoning_format) payload.reasoning_format = options.reasoning_format;
    }


    const response = await this.client.chat.completions.create(payload);
    return response.choices[0]?.message?.content || '';
  }

  async streamMessage(messages: AIMessage[], onChunk: (chunk: string) => void, options?: any): Promise<void> {
    const groqMessages = (messages || []).map((m: any) => ({
      role: m.role === 'assistant' ? 'assistant' : m.role === 'system' ? 'system' : 'user',
      content: m.content
    }));

    const model = options?.model || this.defaultModel;
    const modelInfo = getGroqModelInfo(model);

    // Check if we should enable reasoning mode
    const enableReasoning = modelInfo?.supportsTools && 
      (options?.enableThinking || options?.include_reasoning || 
       options?.reasoning_effort || options?.reasoning_format);

    console.log('[Groq] Streaming config:', {
      model,
      enableReasoning,
      hasTools: modelInfo?.supportsTools,
      options: {
        enableThinking: options?.enableThinking,
        include_reasoning: options?.include_reasoning,
        reasoning_effort: options?.reasoning_effort,
        tools: options?.tools?.length
      }
    });

    // For models that support reasoning, we need to handle it differently
    // Check for GPT-OSS models (they all start with 'openai/')
    const isGPTOSS = model.startsWith('openai/gpt-oss');
    if (enableReasoning && isGPTOSS) {
      // First, get the complete response with reasoning (non-streaming)
      onChunk(JSON.stringify({ type: 'status', content: 'Thinking...' }) + '\n');
      
      const reasoningPayload: any = {
        model,
        messages: groqMessages as any,
        include_reasoning: true,
        stream: false,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.max_tokens ?? 4096,
      };

      if (options?.reasoning_effort) {
        reasoningPayload.reasoning_effort = options.reasoning_effort;
      } else {
        // Default to medium if not specified
        reasoningPayload.reasoning_effort = 'medium';
      }
      
      // Add tools if provided
      if (options?.tools && Array.isArray(options.tools)) {
        reasoningPayload.tools = options.tools;
        // Don't set tool_choice for reasoning - let model use its judgment
      }

      try {
        console.log('[Groq GPT-OSS] Sending reasoning request with payload:', {
          model: reasoningPayload.model,
          include_reasoning: reasoningPayload.include_reasoning,
          reasoning_effort: reasoningPayload.reasoning_effort,
          hasTools: !!reasoningPayload.tools,
          messageCount: reasoningPayload.messages?.length
        });
        
        const response = await this.client.chat.completions.create(reasoningPayload);
        const message = response.choices[0]?.message;
        const reasoning = (message as any)?.reasoning;
        const content = message?.content || '';

        console.log('[Groq GPT-OSS] Reasoning response:', { 
          hasReasoning: !!reasoning, 
          reasoningLength: reasoning?.length,
          hasContent: !!content,
          contentLength: content.length 
        });

        // Stream reasoning content incrementally if available
        if (reasoning) {
          const reasoningChunkSize = 30; // Characters per chunk for reasoning
          for (let i = 0; i < reasoning.length; i += reasoningChunkSize) {
            const chunk = reasoning.slice(i, i + reasoningChunkSize);
            onChunk(JSON.stringify({ type: 'thought', content: chunk }) + '\n');
            await new Promise(resolve => setTimeout(resolve, 15)); // Small delay for streaming effect
          }
          // Send a signal that reasoning is complete
          onChunk(JSON.stringify({ type: 'reasoning_complete' }) + '\n');
        }

        // Then stream the content character by character for effect
        if (content) {
          const chunkSize = 20; // Characters per chunk
          for (let i = 0; i < content.length; i += chunkSize) {
            const chunk = content.slice(i, i + chunkSize);
            onChunk(JSON.stringify({ type: 'content', content: chunk }) + '\n');
            await new Promise(resolve => setTimeout(resolve, 10)); // Small delay for streaming effect
          }
        }

        // Send done signal after successful reasoning
        onChunk(JSON.stringify({ type: 'done' }) + '\n');
      } catch (error: any) {
        console.error('[Groq GPT-OSS] Error getting reasoning response:', error?.message || error);
        console.error('[Groq GPT-OSS] Error details:', error?.response?.data || error);
        
        // Fall back to regular streaming
        await this.streamWithoutReasoning(groqMessages, onChunk, model, options);
        // Send done signal after fallback
        onChunk(JSON.stringify({ type: 'done' }) + '\n');
      }
    } else {
      // Regular streaming without reasoning
      await this.streamWithoutReasoning(groqMessages, onChunk, model, options);
      // Send done signal after regular streaming
      onChunk(JSON.stringify({ type: 'done' }) + '\n');
    }
  }

  private async streamWithoutReasoning(groqMessages: any[], onChunk: (chunk: string) => void, model: string, options?: any): Promise<void> {
    const payload: any = {
      model,
      messages: groqMessages,
      stream: true,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.max_tokens ?? 4096,
    };

    const stream = await this.client.chat.completions.create(payload);

    for await (const chunk of stream as any) {
      const delta = chunk.choices[0]?.delta;
      if (delta?.content) {
        onChunk(JSON.stringify({ type: 'content', content: delta.content }) + '\n');
      }
    }
  }

  async getFinalReasoning(messages: AIMessage[], options?: any): Promise<string | undefined> {
    const model = options?.model || this.defaultModel;
    const modelInfo = getGroqModelInfo(model);

    // Only applies to models that support 'include_reasoning'
    if (!modelInfo?.supportsTools) return undefined;

    const groqMessages = (messages || []).map((m: any) => ({
      role: m.role === 'assistant' ? 'assistant' : m.role === 'system' ? 'system' : 'user',
      content: m.content
    }));

    const payload: any = {
      model,
      messages: groqMessages as any,
      include_reasoning: true,
      stream: false,
    };

    try {
      const response = await this.client.chat.completions.create(payload);
      return (response.choices[0]?.message as any)?.reasoning || undefined;
    } catch (error) {
      console.error('Error fetching final reasoning:', error);
      return undefined;
    }
  }
}

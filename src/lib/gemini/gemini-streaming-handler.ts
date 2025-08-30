/**
 * Gemini Streaming Handler
 * Handles all streaming operations for Gemini API
 * 
 * Extracted from gemini-service.ts for better modularity
 */

import { GoogleGenAI } from '@google/genai';
import { createGeminiConfig, getModelInfo } from '../gemini-config';
import { getCurrentSystemPrompt } from '../prompt-storage';
import { convertMessagesToGemini } from '../ai-shared-utils';
import { AIMessage } from '../ai-config';
import { GeminiFileHandler } from './gemini-file-handler';

export interface UseGeminiStreamingOptions {
  model?: string;
  temperature?: number;
  enableThinking?: boolean;
  enableTools?: boolean;
  enableGoogleSearch?: boolean;
  enableUrlContext?: boolean;
  enableCodeExecution?: boolean;
  thinkingConfig?: {
    thinkingBudget?: number;
    includeThoughts?: boolean;
  };
}

export interface StreamingResult {
  thoughtsTokenCount?: number;
  outputTokenCount?: number;
}

export interface FileAttachment {
  data?: string; // base64 for inline
  uri?: string; // URI for uploaded files
  mimeType: string;
  name?: string;
}

export class GeminiStreamingHandler {
  constructor(
    private client: GoogleGenAI,
    private fileHandler: GeminiFileHandler
  ) {}

  /**
   * Get appropriate tools configuration based on options
   */
  private getToolsConfig(options?: UseGeminiStreamingOptions): any[] {
    const tools: any[] = [];

    // Add URL context if enabled
    if (options?.enableUrlContext) {
      tools.push({ urlContext: {} });
    }

    // Add Google Search if enabled
    if (options?.enableGoogleSearch) {
      tools.push({ googleSearch: {} });
    }

    // Add Code Execution if enabled
    if (options?.enableCodeExecution) {
      tools.push({ codeExecution: {} });
    }

    // Fallback to basic tools if enableTools is true but no specific tools enabled
    if (options?.enableTools && tools.length === 0) {
      tools.push({ googleSearch: {} });
    }

    return tools;
  }

  /**
   * Convert AIMessage format to Gemini format (excluding system messages)
   */
  private convertMessages(messages: AIMessage[]): any[] {
    return convertMessagesToGemini(messages);
  }

  /**
   * Send message with streaming response
   */
  async streamMessage(
    messages: AIMessage[],
    onChunk: (chunk: string) => void,
    options?: UseGeminiStreamingOptions
  ): Promise<void> {
    const model = options?.model || 'gemini-2.0-flash-exp';

    // Kiểm tra xem model có hỗ trợ thinking không
    const modelInfo = getModelInfo(model);
    const supportsThinkingMode = modelInfo?.supportsThinking || false;

    // Tạo config cơ bản
    const configOptions: any = {
      temperature: options?.temperature,
      systemInstruction: getCurrentSystemPrompt(),
      tools: this.getToolsConfig(options)
    };

    // Chỉ thêm thinkingConfig nếu model hỗ trợ và tính năng được bật
    if (supportsThinkingMode && options?.enableThinking) {
      configOptions.thinkingConfig = {
        thinkingBudget: options?.thinkingConfig?.thinkingBudget ?? -1,
        includeThoughts: options?.thinkingConfig?.includeThoughts ?? true
      };
    }

    const config = createGeminiConfig(configOptions);
    const contents = this.convertMessages(messages);

    const response = await this.client.models.generateContentStream({
      model,
      config,
      contents,
    });

    for await (const chunk of response) {
      // Prefer inspecting parts to capture code execution outputs too
      const parts = chunk.candidates?.[0]?.content?.parts || [];
      if (parts.length > 0) {
        for (const part of parts) {
          if (part.text) {
            onChunk(part.text);
          }
          if (part.executableCode && part.executableCode.code) {
            const lang = (part.executableCode.language || 'text').toLowerCase();
            const codeBlock = `\n\u0060\u0060\u0060${lang}\n${part.executableCode.code}\n\u0060\u0060\u0060\n`;
            onChunk(codeBlock);
          }
          if (part.codeExecutionResult && part.codeExecutionResult.output) {
            const outputBlock = `\nOutput:\n\u0060\u0060\u0060\n${part.codeExecutionResult.output}\n\u0060\u0060\u0060\n`;
            onChunk(outputBlock);
          }
        }
      } else if (chunk.text) {
        // Fallback in case SDK provided plain text convenience
        onChunk(chunk.text);
      }
    }
  }

  /**
   * Send message with streaming response and thinking support
   */
  async streamMessageWithThinking(
    messages: AIMessage[],
    onThoughtChunk: (chunk: string) => void,
    onAnswerChunk: (chunk: string) => void,
    options?: UseGeminiStreamingOptions
  ): Promise<StreamingResult> {
    const model = options?.model || 'gemini-2.0-flash-exp';

    // Kiểm tra xem model có hỗ trợ thinking không
    const modelInfo = getModelInfo(model);
    const supportsThinkingMode = modelInfo?.supportsThinking || false;

    if (!supportsThinkingMode) {
      // Fallback to regular streaming if thinking not supported
      await this.streamMessage(messages, onAnswerChunk, options);
      return {};
    }

    // Tạo config với thinking enabled
    const configOptions: any = {
      temperature: options?.temperature,
      systemInstruction: getCurrentSystemPrompt(),
      tools: this.getToolsConfig(options),
      thinkingConfig: {
        thinkingBudget: options?.thinkingConfig?.thinkingBudget ?? -1,
        includeThoughts: true
      }
    };

    const config = createGeminiConfig(configOptions);
    const contents = this.convertMessages(messages);

    const response = await this.client.models.generateContentStream({
      model,
      config,
      contents,
    });

    let thoughtsTokenCount = 0;
    let outputTokenCount = 0;

    for await (const chunk of response) {
      // Process each part in the chunk
      const parts = chunk.candidates?.[0]?.content?.parts || [];

      parts.forEach((part: any) => {
        // Thought text
        if (part.thought && part.text) {
          onThoughtChunk(part.text);
        }

        // Answer text
        if (!part.thought && part.text) {
          onAnswerChunk(part.text);
        }

        // Executable code block
        if (part.executableCode && part.executableCode.code) {
          const lang = (part.executableCode.language || 'text').toLowerCase();
          const codeBlock = `\n\u0060\u0060\u0060${lang}\n${part.executableCode.code}\n\u0060\u0060\u0060\n`;
          onAnswerChunk(codeBlock);
        }

        // Code execution result output
        if (part.codeExecutionResult && part.codeExecutionResult.output) {
          const outputBlock = `\nOutput:\n\u0060\u0060\u0060\n${part.codeExecutionResult.output}\n\u0060\u0060\u0060\n`;
          onAnswerChunk(outputBlock);
        }
      });

      // Update token counts if available
      if (chunk.usageMetadata) {
        thoughtsTokenCount = chunk.usageMetadata.thoughtsTokenCount || thoughtsTokenCount;
        outputTokenCount = chunk.usageMetadata.candidatesTokenCount || outputTokenCount;
      }
    }

    return { thoughtsTokenCount, outputTokenCount };
  }

  /**
   * Stream message with file attachments (no thinking support)
   */
  async streamMessageWithFiles(
    messages: AIMessage[],
    files: FileAttachment[],
    onChunk: (chunk: string) => void,
    options?: UseGeminiStreamingOptions
  ): Promise<void> {
    const model = options?.model || 'gemini-2.0-flash-exp';
    const modelInfo = getModelInfo(model);

    if (!modelInfo?.supportsFiles) {
      throw new Error(`Model ${model} does not support file uploads`);
    }

    // Tạo config cơ bản (no thinking)
    const configOptions: any = {
      temperature: options?.temperature,
      systemInstruction: getCurrentSystemPrompt()
    };

    const config = createGeminiConfig(configOptions);
    const contents = this.convertMessages(messages);

    // Add files to the last user message
    if (contents.length > 0 && files.length > 0) {
      const lastMessage = contents[contents.length - 1];
      if (lastMessage.role === 'user') {
        const fileParts = this.fileHandler.createFileParts(files);
        // Add file parts to message (cast to bypass TypeScript)
        (lastMessage.parts as any[]).push(...fileParts);
      }
    }

    const response = await this.client.models.generateContentStream({
      model,
      config,
      contents,
    });

    for await (const chunk of response) {
      const parts = chunk.candidates?.[0]?.content?.parts || [];
      if (parts.length > 0) {
        for (const part of parts) {
          if (part.text) {
            onChunk(part.text);
          }
          if (part.executableCode && part.executableCode.code) {
            const lang = (part.executableCode.language || 'text').toLowerCase();
            const codeBlock = `\n\u0060\u0060\u0060${lang}\n${part.executableCode.code}\n\u0060\u0060\u0060\n`;
            onChunk(codeBlock);
          }
          if (part.codeExecutionResult && part.codeExecutionResult.output) {
            const outputBlock = `\nOutput:\n\u0060\u0060\u0060\n${part.codeExecutionResult.output}\n\u0060\u0060\u0060\n`;
            onChunk(outputBlock);
          }
        }
      } else if (chunk.text) {
        onChunk(chunk.text);
      }
    }
  }

  /**
   * Send message with file attachments and thinking support (streaming)
   */
  async streamMessageWithFilesAndThinking(
    messages: AIMessage[],
    files: FileAttachment[],
    onThoughtChunk: (chunk: string) => void,
    onAnswerChunk: (chunk: string) => void,
    options?: UseGeminiStreamingOptions
  ): Promise<StreamingResult> {
    const model = options?.model || 'gemini-2.0-flash-exp';
    const modelInfo = getModelInfo(model);

    if (!modelInfo?.supportsFiles) {
      throw new Error(`Model ${model} does not support file uploads`);
    }

    // Kiểm tra xem model có hỗ trợ thinking không
    const supportsThinkingMode = modelInfo?.supportsThinking || false;

    if (!supportsThinkingMode) {
      // Fallback to regular file streaming if thinking not supported
      await this.streamMessageWithFiles(messages, files, onAnswerChunk, options);
      return {};
    }

    // Tạo config với thinking enabled
    const configOptions: any = {
      temperature: options?.temperature,
      systemInstruction: getCurrentSystemPrompt(),
      tools: this.getToolsConfig(options),
      thinkingConfig: {
        thinkingBudget: options?.thinkingConfig?.thinkingBudget ?? -1,
        includeThoughts: true
      }
    };

    const config = createGeminiConfig(configOptions);
    const contents = this.convertMessages(messages);

    // Add files to the last user message
    if (contents.length > 0 && files.length > 0) {
      const lastMessage = contents[contents.length - 1];
      if (lastMessage.role === 'user') {
        const fileParts = this.fileHandler.createFileParts(files);
        // Add file parts to message (cast to bypass TypeScript)
        (lastMessage.parts as any[]).push(...fileParts);
      }
    }

    const response = await this.client.models.generateContentStream({
      model,
      config,
      contents,
    });

    let thoughtsTokenCount = 0;
    let outputTokenCount = 0;

    for await (const chunk of response) {
      // Process each part in the chunk
      const parts = chunk.candidates?.[0]?.content?.parts || [];

      parts.forEach((part: any) => {
        if (!part.text) return;

        if (part.thought) {
          // This is a thought chunk
          onThoughtChunk(part.text);
        } else {
          // This is an answer chunk
          onAnswerChunk(part.text);
        }
      });

      // Update token counts if available
      if (chunk.usageMetadata) {
        thoughtsTokenCount = chunk.usageMetadata.thoughtsTokenCount || thoughtsTokenCount;
        outputTokenCount = chunk.usageMetadata.candidatesTokenCount || outputTokenCount;
      }
    }

    return { thoughtsTokenCount, outputTokenCount };
  }
}

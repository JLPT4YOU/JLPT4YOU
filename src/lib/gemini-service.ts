/**
 * Google Gemini Service Implementation
 * Handles all Gemini API interactions with proper error handling and streaming
 *
 * BACKUP CREATED: 2025-01-23 - Before cleanup optimization
 */

import { GoogleGenAI } from '@google/genai';
import {
  GEMINI_MODELS,
  createGeminiConfig,
  getModelInfo,
  getAvailableModels as getAvailableGeminiModels,
  type GeminiModelInfo
} from './gemini-config';
import { BaseAIService, AIMessage } from './ai-config';
import { getCurrentSystemPrompt, getAICommunicationLanguage, detectLanguageFromMessage } from './prompt-storage';
import {
  createTitleGenerationPrompt,
  createFallbackTitle,
  detectTitleLanguage,
  convertMessagesToGemini
} from './ai-shared-utils';
import { GeminiFileHandler } from './gemini/gemini-file-handler';

export interface GeminiMessage {
  role: 'user' | 'model';
  parts: Array<{
    text: string;
    inlineData?: {
      mimeType: string;
      data: string; // base64 encoded
    };
  }>;
}



export interface CodeExecutionResult {
  text?: string;
  executableCode?: {
    language: string;
    code: string;
  };
  codeExecutionResult?: {
    outcome: string;
    output: string;
  };
}



export interface UseGeminiServiceOptions {
  model?: string;
  temperature?: number;
  enableThinking?: boolean;
  enableTools?: boolean;
  enableGoogleSearch?: boolean;
  enableUrlContext?: boolean;
  enableCodeExecution?: boolean;
  thinkingConfig?: {
    thinkingBudget?: number; // 0 = off, -1 = dynamic thinking
    includeThoughts?: boolean; // Enable thought summaries
  };
}

export class GeminiService extends BaseAIService {
  private client: GoogleGenAI | null = null;
  private fileHandler: GeminiFileHandler | null = null;
  protected defaultModel: string = GEMINI_MODELS.FLASH_2_0;
  protected storageKeyPrefix: string = 'gemini';

  // Constants for file processing
  private static readonly MAX_TITLE_LENGTH = 50;

  constructor(apiKey?: string) {
    super(apiKey);
    const key = apiKey || process.env.GEMINI_API_KEY || this.getApiKeyFromStorage();
    if (key) {
      this.apiKey = key;
      this.client = new GoogleGenAI({ apiKey: key });
      this.fileHandler = new GeminiFileHandler(this.client);
      this.isConfigured = true;
    }
  }

  /**
   * Configure the service with an API key
   */
  configure(apiKey: string): void {
    this.apiKey = apiKey;
    this.client = new GoogleGenAI({ apiKey });
    this.fileHandler = new GeminiFileHandler(this.client);
    this.isConfigured = true;
    this.saveApiKeyToStorage(apiKey);
  }

  /**
   * Get appropriate tools configuration based on options
   */
  private getToolsConfig(options?: UseGeminiServiceOptions): any[] {
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
  private convertMessages(messages: AIMessage[]): GeminiMessage[] {
    return convertMessagesToGemini(messages) as GeminiMessage[];
  }

  /**
   * Parse code execution results from response
   */
  private parseCodeExecutionResults(response: any): { text: string; codeResults?: CodeExecutionResult[] } {
    const parts = response?.candidates?.[0]?.content?.parts || [];
    let combinedText = '';
    const codeResults: CodeExecutionResult[] = [];

    parts.forEach((part: any) => {
      if (part.text) {
        combinedText += part.text + '\n';
      }

      if (part.executableCode && part.executableCode.code) {
        codeResults.push({
          text: part.text,
          executableCode: {
            language: part.executableCode.language || 'python',
            code: part.executableCode.code
          }
        });
      }

      if (part.codeExecutionResult && part.codeExecutionResult.output) {
        const lastResult = codeResults[codeResults.length - 1];
        if (lastResult) {
          lastResult.codeExecutionResult = {
            outcome: part.codeExecutionResult.outcome || 'success',
            output: part.codeExecutionResult.output
          };
        }
      }
    });

    return {
      text: combinedText.trim() || 'No response generated',
      codeResults: codeResults.length > 0 ? codeResults : undefined
    };
  }



  /**
   * Send a single message and get complete response
   */
  async sendMessage(
    messages: AIMessage[],
    options?: UseGeminiServiceOptions
  ): Promise<string> {
    try {
      this.ensureConfigured();

      const model = options?.model || this.defaultModel;

      // Kiểm tra xem model có hỗ trợ thinking không trước khi thêm thinkingConfig
      const modelInfo = getModelInfo(model);
      const supportsThinkingMode = modelInfo?.supportsThinking || false;

      // Tạo config cơ bản
      const systemPrompt = getCurrentSystemPrompt();

      const configOptions: any = {
        temperature: options?.temperature,
        systemInstruction: systemPrompt,
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

      const response = await this.client!.models.generateContent({
        model,
        config,
        contents,
      });

      // Parse code execution results if present
      if (options?.enableCodeExecution) {
        const parsed = this.parseCodeExecutionResults(response);
        return parsed.text;
      }

      return response.text || 'No response generated';
    } catch (error) {
      console.error('Gemini sendMessage error:', error);
      throw this.handleApiError(error, 'gửi tin nhắn');
    }
  }

  /**
   * Send message with streaming response
   */
  async streamMessage(
    messages: AIMessage[],
    onChunk: (chunk: string) => void,
    options?: UseGeminiServiceOptions
  ): Promise<void> {
    try {
      this.ensureConfigured();

      const model = options?.model || this.defaultModel;

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

      const response = await this.client!.models.generateContentStream({
        model,
        config,
        contents,
      });

      for await (const chunk of response) {
        if (chunk.text) {
          onChunk(chunk.text);
        }
      }
    } catch (error) {
      console.error('Gemini streamMessage error:', error);
      throw this.handleApiError(error, 'stream tin nhắn');
    }
  }

  /**
   * Send message with streaming response and thinking support
   */
  async streamMessageWithThinking(
    messages: AIMessage[],
    onThoughtChunk: (chunk: string) => void,
    onAnswerChunk: (chunk: string) => void,
    options?: UseGeminiServiceOptions
  ): Promise<{ thoughtsTokenCount?: number; outputTokenCount?: number }> {
    try {
      this.ensureConfigured();

      const model = options?.model || this.defaultModel;

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

      const response = await this.client!.models.generateContentStream({
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
    } catch (error) {
      console.error('Gemini streamMessageWithThinking error:', error);
      throw this.handleApiError(error, 'stream tin nhắn với thinking');
    }
  }

  /**
   * Generate chat title using Gemini Flash 2.0 Lite
   */
  async generateChatTitle(firstMessage: string): Promise<string> {
    try {
      this.ensureConfigured();

      // Detect language for title generation
      const language = detectTitleLanguage(firstMessage);

      // Create optimized prompt for the detected/selected language
      const prompt = createTitleGenerationPrompt(language, firstMessage);

      const response = await this.client!.models.generateContent({
        model: GEMINI_MODELS.FLASH_LITE_2_0,
        contents: [{
          role: 'user',
          parts: [{ text: prompt }]
        }],
        config: {
          maxOutputTokens: 20,
          temperature: 1.0,
        }
      });

      const title = response.text?.trim() || createFallbackTitle(language);

      // Ensure title is not too long
      if (title.length > GeminiService.MAX_TITLE_LENGTH) {
        return title.substring(0, GeminiService.MAX_TITLE_LENGTH - 3) + '...';
      }

      return title;
    } catch (error) {
      console.error('Failed to generate chat title:', error);
      // Create a simple title from first message
      const words = firstMessage.trim().split(' ').slice(0, 4);
      const fallbackTitle = words.join(' ');

      if (fallbackTitle) {
        return fallbackTitle;
      }

      // Language-specific fallback titles
      const aiLanguage = typeof window !== 'undefined' ? localStorage.getItem('ai_language') || 'auto' : 'auto';

      let language: string;
      if (aiLanguage === 'auto') {
        language = detectLanguageFromMessage(firstMessage);
      } else {
        language = getAICommunicationLanguage(firstMessage);
      }

      return createFallbackTitle(language);
    }
  }

  /**
   * Upload PDF from URL to Gemini
   */
  async uploadRemotePDF(url: string, displayName: string): Promise<any> {
    try {
      this.ensureConfigured();

      if (!this.fileHandler) {
        throw new Error('File handler not initialized');
      }

      return await this.fileHandler.uploadRemotePDF(url, displayName);
    } catch (error) {
      console.error(`Failed to upload PDF ${displayName}:`, error);
      throw error;
    }
  }

  /**
   * Process multiple local PDF files
   */
  async processMultipleLocalPDFs(
    prompt: string,
    files: File[],
    modelId: string = GEMINI_MODELS.FLASH_2_5
  ): Promise<string> {
    try {
      this.ensureConfigured();

      if (!this.fileHandler) {
        throw new Error('File handler not initialized');
      }

      return await this.fileHandler.processMultipleLocalPDFs(prompt, files, modelId);
    } catch (error) {
      console.error('Failed to process multiple local PDFs:', error);
      throw error;
    }
  }

  /**
   * Process multiple PDFs from URLs in a single request
   */
  async processMultiplePDFs(
    prompt: string,
    pdfUrls: Array<{ url: string; displayName: string }>,
    modelId: string = GEMINI_MODELS.FLASH_2_5
  ): Promise<string> {
    try {
      this.ensureConfigured();

      if (!this.fileHandler) {
        throw new Error('File handler not initialized');
      }

      return await this.fileHandler.processMultiplePDFs(prompt, pdfUrls, modelId);
    } catch (error) {
      console.error('Failed to process multiple PDFs:', error);
      throw error;
    }
  }



  /**
   * Upload file to Gemini and get URI
   */
  async uploadFile(file: File): Promise<{ uri: string; mimeType: string }> {
    try {
      this.ensureConfigured();

      if (!this.fileHandler) {
        throw new Error('File handler not initialized');
      }

      const result = await this.fileHandler.uploadFile(file);
      return {
        uri: result.uri,
        mimeType: result.mimeType
      };
    } catch (error) {
      console.error('File upload error:', error);
      throw this.handleApiError(error, 'upload file');
    }
  }

  /**
   * Send message with file attachments and thinking support (streaming)
   * Supports both uploaded files (URI) and inline data (base64)
   */
  async streamMessageWithFilesAndThinking(
    messages: AIMessage[],
    files: Array<{
      data?: string; // base64 for inline
      uri?: string; // URI for uploaded files
      mimeType: string;
      name?: string;
    }>,
    onThoughtChunk: (chunk: string) => void,
    onAnswerChunk: (chunk: string) => void,
    options?: UseGeminiServiceOptions
  ): Promise<{ thoughtsTokenCount?: number; outputTokenCount?: number }> {
    try {
      this.ensureConfigured();

      const model = options?.model || this.defaultModel;
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

      // Tạo config với thinking enabled (same as text-only)
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
          if (!this.fileHandler) {
            throw new Error('File handler not initialized');
          }

          const fileParts = this.fileHandler.createFileParts(files);
          // Add file parts to message (cast to bypass TypeScript)
          (lastMessage.parts as any[]).push(...fileParts);
        }
      }

      const response = await this.client!.models.generateContentStream({
        model,
        config,
        contents,
      });

      let thoughtsTokenCount = 0;
      let outputTokenCount = 0;

      for await (const chunk of response) {
        // Process each part in the chunk (same as text-only thinking)
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
    } catch (error) {
      console.error('Gemini sendMessageWithFiles error:', error);
      throw this.handleApiError(error, 'gửi tin nhắn với file');
    }
  }

  /**
   * Stream message with file attachments (no thinking support)
   * Fallback method for models that don't support thinking
   */
  async streamMessageWithFiles(
    messages: AIMessage[],
    files: Array<{
      data?: string; // base64 for inline
      uri?: string; // URI for uploaded files
      mimeType: string;
      name?: string;
    }>,
    onChunk: (chunk: string) => void,
    options?: UseGeminiServiceOptions
  ): Promise<void> {
    try {
      this.ensureConfigured();

      const model = options?.model || this.defaultModel;
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
          if (!this.fileHandler) {
            throw new Error('File handler not initialized');
          }

          const fileParts = this.fileHandler.createFileParts(files);
          // Add file parts to message (cast to bypass TypeScript)
          (lastMessage.parts as any[]).push(...fileParts);
        }
      }

      const response = await this.client!.models.generateContentStream({
        model,
        config,
        contents,
      });

      for await (const chunk of response) {
        if (chunk.text) {
          onChunk(chunk.text);
        }
      }
    } catch (error) {
      console.error('Gemini streamMessageWithFiles error:', error);
      throw this.handleApiError(error, 'stream tin nhắn với file');
    }
  }

  /**
   * Send message with file attachments (multimodal) - Non-streaming
   * Supports both uploaded files (URI) and inline data (base64)
   */
  async sendMessageWithFiles(
    messages: AIMessage[],
    files: Array<{
      data?: string; // base64 for inline
      uri?: string; // URI for uploaded files
      mimeType: string;
      name?: string;
    }>,
    options?: UseGeminiServiceOptions
  ): Promise<string> {
    try {
      this.ensureConfigured();

      const model = options?.model || this.defaultModel;
      const modelInfo = getModelInfo(model);

      if (!modelInfo?.supportsFiles) {
        throw new Error(`Model ${model} does not support file uploads`);
      }

      // Kiểm tra xem model có hỗ trợ thinking không
      const supportsThinkingMode = modelInfo?.supportsThinking || false;

      // Tạo config cơ bản
      const configOptions: any = {
        temperature: options?.temperature,
        systemInstruction: getCurrentSystemPrompt()
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

      // Add files to the last user message
      if (contents.length > 0 && files.length > 0) {
        const lastMessage = contents[contents.length - 1];
        if (lastMessage.role === 'user') {
          if (!this.fileHandler) {
            throw new Error('File handler not initialized');
          }

          const fileParts = this.fileHandler.createFileParts(files);
          // Add file parts to message (cast to bypass TypeScript)
          (lastMessage.parts as any[]).push(...fileParts);
        }
      }

      const response = await this.client!.models.generateContent({
        model,
        config,
        contents,
      });

      return response.text || 'No response generated';
    } catch (error) {
      console.error('Gemini sendMessageWithFiles error:', error);
      throw this.handleApiError(error, 'gửi tin nhắn với file');
    }
  }



  /**
   * Validate API key
   */
  async validateApiKey(apiKey: string): Promise<boolean> {
    try {
      const testClient = new GoogleGenAI({ apiKey });
      const response = await testClient.models.generateContent({
        model: GEMINI_MODELS.FLASH_2_5,
        config: createGeminiConfig({
          systemInstruction: 'You are a helpful AI assistant.' // Simple prompt for validation
        }),
        contents: [{ role: 'user', parts: [{ text: 'Hello' }] }],
      });

      return !!response.text;
    } catch (error) {
      // Suppress console error for quota exhausted during validation
      if (error instanceof Error && error.message.toLowerCase().includes('quota')) {
        console.warn('API key validation failed due to quota exhaustion');
      } else {
        console.error('API key validation failed:', error);
      }
      return false;
    }
  }

  /**
   * Get available models
   */
  getAvailableModels(): GeminiModelInfo[] {
    return getAvailableGeminiModels();
  }

  /**
   * Set default model
   */
  setDefaultModel(model: string): void {
    const modelInfo = getModelInfo(model);
    if (!modelInfo) {
      throw new Error(`Invalid model: ${model}`);
    }
    this.defaultModel = model;
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
    // Configure existing instance with new API key
    geminiServiceInstance.configure(apiKey);
  }
  return geminiServiceInstance;
}

// Export class for custom instances
export { GeminiService as default };



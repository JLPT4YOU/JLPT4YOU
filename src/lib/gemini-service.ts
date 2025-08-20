/**
 * Google Gemini Service Implementation
 * Handles all Gemini API interactions with proper error handling and streaming
 *
 * BACKUP CREATED: 2025-01-23 - Before cleanup optimization
 */

import { GoogleGenAI } from '@google/genai';
import {
  GEMINI_MODELS,
  getModelInfo,
  type GeminiModelInfo
} from './gemini-config';
import { BaseAIService, AIMessage } from './ai-config';

import { GeminiFileHandler } from './gemini/gemini-file-handler';
import { GeminiStreamingHandler } from './gemini/gemini-streaming-handler';
import { GeminiTitleGenerator } from './gemini/gemini-title-generator';
import { GeminiUtils } from './gemini/gemini-utils';
import {
  GeminiConfigHelper,
  UseGeminiServiceOptions
} from './gemini/gemini-config-helper';

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
  private client: GoogleGenAI | null = null;
  private fileHandler: GeminiFileHandler | null = null;
  private streamingHandler: GeminiStreamingHandler | null = null;
  private titleGenerator: GeminiTitleGenerator | null = null;
  protected defaultModel: string = GEMINI_MODELS.FLASH_2_0;
  protected storageKeyPrefix: string = 'gemini';

  constructor(apiKey?: string) {
    super(apiKey);
    const key = apiKey || process.env.GEMINI_API_KEY || this.getApiKeyFromStorage();
    if (key) {
      this.apiKey = key;
      this.client = new GoogleGenAI({ apiKey: key });
      this.fileHandler = new GeminiFileHandler(this.client);
      this.streamingHandler = new GeminiStreamingHandler(this.client, this.fileHandler);
      this.titleGenerator = new GeminiTitleGenerator(this.client);
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
    this.streamingHandler = new GeminiStreamingHandler(this.client, this.fileHandler);
    this.titleGenerator = new GeminiTitleGenerator(this.client);
    this.isConfigured = true;
    this.saveApiKeyToStorage(apiKey);
  }



  /**
   * Convert AIMessage format to Gemini format (excluding system messages)
   */
  private convertMessages(messages: AIMessage[]): GeminiContent[] {
    return GeminiConfigHelper.convertMessages(messages);
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

      // Validate model and options
      GeminiConfigHelper.validateModelOptions(model, options);

      // Build configuration using helper
      const config = GeminiConfigHelper.buildConfig({
        ...options,
        model
      });
      const contents = this.convertMessages(messages);

      const response = await this.client!.models.generateContent({
        model,
        config,
        contents,
      });

      // Parse code execution results if present
      if (options?.enableCodeExecution) {
        const parsed = GeminiConfigHelper.parseCodeExecutionResults(response);
        return parsed.text;
      }

      return response.text || 'No response generated';
    } catch (error) {
      console.error('Gemini sendMessage error:', error);
      throw GeminiUtils.handleApiError(error, 'gửi tin nhắn');
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

      if (!this.streamingHandler) {
        throw new Error('Streaming handler not initialized');
      }

      const streamingOptions = {
        ...options,
        model: options?.model || this.defaultModel
      };

      await this.streamingHandler.streamMessage(messages, onChunk, streamingOptions);
    } catch (error) {
      console.error('Gemini streamMessage error:', error);
      throw GeminiUtils.handleApiError(error, 'stream tin nhắn');
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

      // Đảm bảo streamingHandler được khởi tạo với client đã cấu hình
      if (!this.streamingHandler || !this.client) {
        throw new Error('Streaming handler not initialized');
      }

      const streamingOptions = {
        ...options,
        model: options?.model || this.defaultModel
      };

      return await this.streamingHandler.streamMessageWithThinking(
        messages,
        onThoughtChunk,
        onAnswerChunk,
        streamingOptions
      );
    } catch (error) {
      console.error('Gemini streamMessageWithThinking error:', error);
      throw GeminiUtils.handleApiError(error, 'stream tin nhắn với thinking');
    }
  }

  /**
   * Generate chat title using Gemini Flash 2.0 Lite
   */
  async generateChatTitle(firstMessage: string): Promise<string> {
    try {
      this.ensureConfigured();

      if (!this.titleGenerator) {
        throw new Error('Title generator not initialized');
      }

      return await this.titleGenerator.generateChatTitle(firstMessage);
    } catch (error) {
      console.error('Failed to generate chat title:', error);
      throw GeminiUtils.handleApiError(error, 'tạo tiêu đề chat');
    }
  }

  /**
   * Upload PDF from URL to Gemini
   */
  async uploadRemotePDF(url: string, displayName: string): Promise<UploadedFile | any> {
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
      throw GeminiUtils.handleApiError(error, 'upload file');
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

      // Đảm bảo streamingHandler được khởi tạo với client đã cấu hình
      if (!this.streamingHandler || !this.client) {
        throw new Error('Streaming handler not initialized');
      }

      const streamingOptions = {
        ...options,
        model: options?.model || this.defaultModel
      };

      return await this.streamingHandler.streamMessageWithFilesAndThinking(
        messages,
        files,
        onThoughtChunk,
        onAnswerChunk,
        streamingOptions
      );
    } catch (error) {
      console.error('Gemini sendMessageWithFiles error:', error);
      throw GeminiUtils.handleApiError(error, 'gửi tin nhắn với file');
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

      if (!this.streamingHandler) {
        throw new Error('Streaming handler not initialized');
      }

      const streamingOptions = {
        ...options,
        model: options?.model || this.defaultModel
      };

      await this.streamingHandler.streamMessageWithFiles(
        messages,
        files,
        onChunk,
        streamingOptions
      );
    } catch (error) {
      console.error('Gemini streamMessageWithFiles error:', error);
      throw GeminiUtils.handleApiError(error, 'stream tin nhắn với file');
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

      // Validate model supports files
      if (!GeminiConfigHelper.supportsFiles(model)) {
        throw new Error(`Model ${model} does not support file uploads`);
      }

      // Build configuration using helper
      const config = GeminiConfigHelper.buildFileConfig({
        ...options,
        model
      });
      const contents = this.convertMessages(messages);

      // Add files to the last user message
      if (!this.fileHandler) {
        throw new Error('File handler not initialized');
      }
      GeminiUtils.addFilesToMessage(contents, files, this.fileHandler.createFileParts.bind(this.fileHandler));

      const response = await this.client!.models.generateContent({
        model,
        config,
        contents,
      });

      return response.text || 'No response generated';
    } catch (error) {
      console.error('Gemini sendMessageWithFiles error:', error);
      throw GeminiUtils.handleApiError(error, 'gửi tin nhắn với file');
    }
  }



  /**
   * Validate API key
   */
  async validateApiKey(apiKey: string): Promise<boolean> {
    return await GeminiUtils.validateApiKey(apiKey);
  }

  /**
   * Get available models
   */
  getAvailableModels(): GeminiModelInfo[] {
    return GeminiUtils.getAvailableModels();
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



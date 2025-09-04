/**
 * Consolidated Gemini Helpers
 * Combines all Gemini utility classes and helpers in one file
 * to reduce fragmentation and improve maintainability
 */

import { GoogleGenAI } from '@google/genai';
import { 
  GEMINI_MODELS, 
  createGeminiConfig, 
  getAvailableModels, 
  getModelInfo,
  type GeminiModelInfo 
} from './gemini-config';
import { getCurrentSystemPrompt } from './prompt-storage';
import {
  convertMessagesToGemini,
  createTitleGenerationPrompt,
  createFallbackTitle,
  detectTitleLanguage
} from './ai-shared-utils';
import { AIMessage } from './ai-config';

// ==================== INTERFACES ====================

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

export interface FileUploadResult {
  uri: string;
  mimeType: string;
  name?: string;
  state?: string;
}

export interface FileProcessingOptions {
  displayName?: string;
  mimeType?: string;
}

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

// ==================== GEMINI UTILS CLASS ====================

export class GeminiUtils {
  /**
   * Validate API key by making a test request
   */
  static async validateApiKey(apiKey: string): Promise<boolean> {
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
   * Get available Gemini models
   */
  static getAvailableModels(): GeminiModelInfo[] {
    return getAvailableModels();
  }

  /**
   * Check if service is properly configured
   */
  static isConfigured(client: GoogleGenAI | null): boolean {
    return client !== null;
  }

  /**
   * Handle API errors
   */
  static handleApiError(error: any, operation: string = 'unknown'): Error {
    console.error(`Gemini API error during ${operation}:`, error);

    if (error instanceof Error) {
      if (error.message.includes('quota')) {
        return new Error(`API quota exceeded. Please try again later.`);
      }
      if (error.message.includes('model')) {
        return new Error(`Selected model is not available or invalid.`);
      }
      return error;
    }

    return new Error(`Gemini operation failed: ${operation}`);
  }
}

// ==================== GEMINI CONFIG HELPER CLASS ====================

export class GeminiConfigHelper {
  /**
   * Convert AIMessage format to Gemini format (excluding system messages)
   */
  static convertMessages(messages: AIMessage[]): GeminiMessage[] {
    return convertMessagesToGemini(messages) as GeminiMessage[];
  }
  /**
   * Build configuration for Gemini API calls
   */
  static buildConfig(
    messages: AIMessage[],
    options: UseGeminiServiceOptions = {}
  ): {
    model: string;
    contents: GeminiMessage[];
    config: any;
  } {
    const model = options.model || GEMINI_MODELS.FLASH_2_5;
    const systemPrompt = getCurrentSystemPrompt();

    // Get model-specific features
    const modelInfo = getModelInfo(model);
    const supportsThinking = modelInfo?.supportsThinking && options.enableThinking;
    const supportsTools = false; // Tools not yet supported
    const supportsGoogleSearch = modelInfo?.supportsGoogleSearch && options.enableGoogleSearch;
    const supportsUrlContext = false; // URL context not yet supported
    const supportsCodeExecution = modelInfo?.supportsCodeExecution && options.enableCodeExecution;

    // Convert messages to Gemini format
    const contents = convertMessagesToGemini(messages) as GeminiMessage[];

    // Build configuration
    const config = createGeminiConfig({
      temperature: options.temperature ?? 0.8,
      systemInstruction: systemPrompt,
      enableThinking: supportsThinking,
      enableTools: supportsTools,
      enableGoogleSearch: supportsGoogleSearch,
      enableUrlContext: supportsUrlContext,
      enableCodeExecution: supportsCodeExecution,
      thinkingBudget: options.thinkingConfig?.thinkingBudget,
      includeThoughts: options.thinkingConfig?.includeThoughts
    });

    return {
      model,
      contents,
      config
    };
  }

  /**
   * Process tool call responses
   */
  static processToolCalls(response: any): CodeExecutionResult[] {
    const results: CodeExecutionResult[] = [];
    
    if (response.parts) {
      for (const part of response.parts) {
        if (part.executableCode || part.codeExecutionResult) {
          results.push({
            text: part.text,
            executableCode: part.executableCode,
            codeExecutionResult: part.codeExecutionResult
          });
        }
      }
    }
    
    return results;
  }
}

// ==================== GEMINI TITLE GENERATOR CLASS ====================

export class GeminiTitleGenerator {
  private static readonly MAX_TITLE_LENGTH = 50;

  constructor(private client: GoogleGenAI) {}

  /**
   * Generate chat title using Gemini Flash 2.0 Lite
   */
  async generateChatTitle(firstMessage: string): Promise<string> {
    try {
      // Detect language for title generation
      const language = detectTitleLanguage(firstMessage);

      // Create optimized prompt for the detected/selected language
      const prompt = createTitleGenerationPrompt(language, firstMessage);

      const response = await this.client.models.generateContent({
        model: GEMINI_MODELS.FLASH_LITE_2_0,
        contents: [{
          role: 'user',
          parts: [{ text: prompt }]
        }],
        config: {
          maxOutputTokens: 30, // Increased for better title generation
          temperature: 0.8, // Slightly lower for more focused titles
        }
      });

      const title = response.text?.trim() || createFallbackTitle(language);

      // Ensure title is not too long
      if (title.length > GeminiTitleGenerator.MAX_TITLE_LENGTH) {
        return title.substring(0, GeminiTitleGenerator.MAX_TITLE_LENGTH - 3) + '...';
      }

      return title;
    } catch (error) {
      console.error('Failed to generate chat title:', error);
      return createFallbackTitle('auto');
    }
  }
}

// ==================== GEMINI FILE HANDLER CLASS ====================

export class GeminiFileHandler {
  // Constants for file processing
  private static readonly FILE_PROCESSING_CHECK_INTERVAL = 2000; // 2 seconds
  private static readonly REMOTE_FILE_PROCESSING_CHECK_INTERVAL = 5000; // 5 seconds
  private static readonly MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB limit

  constructor(private client: GoogleGenAI) {}

  /**
   * Upload file to Gemini API
   */
  async uploadFile(fileData: string, mimeType: string, displayName?: string): Promise<FileUploadResult> {
    try {
      const blob = new Blob([Buffer.from(fileData, 'base64')]);
      const response = await this.client.files.upload({
        file: blob,
        displayName
      } as any);

      return {
        uri: response.uri || '',
        mimeType: response.mimeType || mimeType,
        name: response.name || displayName || 'file',
        state: response.state || 'PROCESSING'
      };
    } catch (error) {
      throw GeminiUtils.handleApiError(error, 'file upload');
    }
  }

  /**
   * Wait for file to be processed
   */
  async waitForFileProcessing(uri: string): Promise<boolean> {
    const maxAttempts = 30;
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        const file = await this.client.files.get({ name: uri });
        
        if (file.state === 'ACTIVE') {
          return true;
        }
        
        if (file.state === 'FAILED') {
          throw new Error('File processing failed');
        }

        await new Promise(resolve => 
          setTimeout(resolve, GeminiFileHandler.FILE_PROCESSING_CHECK_INTERVAL)
        );
        attempts++;
      } catch (error) {
        throw GeminiUtils.handleApiError(error, 'file processing check');
      }
    }

    throw new Error('File processing timeout');
  }

  /**
   * Check if file size is within limits
   */
  validateFileSize(fileData: string): void {
    const sizeInBytes = (fileData.length * 3) / 4; // Approximate base64 to bytes
    if (sizeInBytes > GeminiFileHandler.MAX_FILE_SIZE) {
      throw new Error(`File size exceeds ${GeminiFileHandler.MAX_FILE_SIZE / (1024 * 1024)}MB limit`);
    }
  }
}

// ==================== GEMINI STREAMING HANDLER CLASS ====================

export class GeminiStreamingHandler {
  constructor(
    private client: GoogleGenAI,
    private fileHandler: GeminiFileHandler
  ) {}

  /**
   * Stream message with optional file attachments
   */
  async streamMessageWithFiles(
    messages: AIMessage[],
    files: FileAttachment[],
    onChunk: (chunk: string) => void,
    options: UseGeminiStreamingOptions = {}
  ): Promise<StreamingResult> {
    try {
      // Process file attachments if any
      const fileUris = await this.processFileAttachments(files);
      
      // Build configuration
      const { model, contents, config } = GeminiConfigHelper.buildConfig(messages, options);
      
      // Add file URIs to the last message if available
      if (fileUris.length > 0 && contents.length > 0) {
        const lastMessage = contents[contents.length - 1];
        for (const uri of fileUris) {
          lastMessage.parts.push({
            fileData: {
              mimeType: 'application/pdf', // Or detect from file
              fileUri: uri
            }
          } as any);
        }
      }

      // Stream the response
      const stream = await this.client.models.generateContentStream({
        model,
        contents,
        config
      });

      let thoughtsTokenCount = 0;
      let outputTokenCount = 0;

      for await (const chunk of stream) {
        const text = chunk.text;
        if (text) {
          onChunk(text);
          outputTokenCount += text.length; // Approximate
        }
      }

      return {
        thoughtsTokenCount,
        outputTokenCount
      };
    } catch (error) {
      throw GeminiUtils.handleApiError(error, 'streaming with files');
    }
  }

  /**
   * Process file attachments and return URIs
   */
  private async processFileAttachments(files: FileAttachment[]): Promise<string[]> {
    const uris: string[] = [];

    for (const file of files) {
      if (file.uri) {
        // File already uploaded
        uris.push(file.uri);
      } else if (file.data) {
        // Upload inline file
        const result = await this.fileHandler.uploadFile(
          file.data,
          file.mimeType,
          file.name
        );
        
        // Wait for processing
        await this.fileHandler.waitForFileProcessing(result.uri);
        uris.push(result.uri);
      }
    }

    return uris;
  }
}

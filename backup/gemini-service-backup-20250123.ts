/**
 * BACKUP FILE - Google Gemini Service Implementation
 * Created: 2025-01-23 before cleanup optimization
 * Original file: src/lib/gemini-service.ts
 * 
 * This is a complete backup copy for rollback purposes
 * Handles all Gemini API interactions with proper error handling and streaming
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

export interface GeminiRequest {
  model: string;
  config: any;
  contents: GeminiMessage[];
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

export interface ThinkingResult {
  thoughtSummary?: string;
  answer: string;
  thoughtsTokenCount?: number;
  outputTokenCount?: number;
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
  protected defaultModel: string = GEMINI_MODELS.FLASH_2_0;
  protected storageKeyPrefix: string = 'gemini';

  constructor(apiKey?: string) {
    super(apiKey);
    const key = apiKey || process.env.GEMINI_API_KEY || this.getApiKeyFromStorage();
    if (key) {
      this.apiKey = key;
      this.client = new GoogleGenAI({ apiKey: key });
      this.isConfigured = true;
    }
  }

  /**
   * Configure the service with an API key
   */
  configure(apiKey: string): void {
    this.apiKey = apiKey;
    this.client = new GoogleGenAI({ apiKey });
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

  // parseThinkingResults function removed - not used
  // Moved to trash: trash/ai-optimization-20250721-222554/unused-code/

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
      console.log('🔧 Gemini service - System prompt length:', systemPrompt.length);
      console.log('📝 Gemini service - System prompt preview:', systemPrompt.substring(0, 200) + '...');

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

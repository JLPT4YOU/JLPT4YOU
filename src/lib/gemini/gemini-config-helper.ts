/**
 * Gemini Configuration Helper
 * Handles configuration building and utilities for Gemini service
 * 
 * Extracted from gemini-service.ts for better modularity
 */

import { createGeminiConfig, getModelInfo } from '../gemini-config';
import { getCurrentSystemPrompt } from '../prompt-storage';
import { convertMessagesToGemini } from '../ai-shared-utils';
import { AIMessage } from '../ai-config';

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

export class GeminiConfigHelper {
  /**
   * Build configuration for Gemini API calls
   */
  static buildConfig(options?: UseGeminiServiceOptions): any {
    const systemPrompt = getCurrentSystemPrompt();

    // Simple tools config
    const tools: any[] = [];
    if (options?.enableUrlContext) tools.push({ urlContext: {} });
    if (options?.enableGoogleSearch) tools.push({ googleSearch: {} });
    if (options?.enableCodeExecution) tools.push({ codeExecution: {} });
    if (options?.enableTools && tools.length === 0) tools.push({ googleSearch: {} });

    const configOptions: any = {
      temperature: options?.temperature,
      systemInstruction: systemPrompt,
      tools
    };

    // Add thinking config if supported and enabled
    if (options?.model && options?.enableThinking) {
      const modelInfo = getModelInfo(options.model);
      const supportsThinkingMode = modelInfo?.supportsThinking || false;

      if (supportsThinkingMode) {
        configOptions.thinkingConfig = {
          thinkingBudget: options?.thinkingConfig?.thinkingBudget ?? -1,
          includeThoughts: options?.thinkingConfig?.includeThoughts ?? true
        };
      }
    }

    return createGeminiConfig(configOptions);
  }

  /**
   * Build configuration for file operations (no thinking)
   */
  static buildFileConfig(options?: UseGeminiServiceOptions): any {
    const systemPrompt = getCurrentSystemPrompt();

    const configOptions: any = {
      temperature: options?.temperature,
      systemInstruction: systemPrompt
    };

    // Add thinking config if supported and enabled
    if (options?.model && options?.enableThinking) {
      const modelInfo = getModelInfo(options.model);
      const supportsThinkingMode = modelInfo?.supportsThinking || false;

      if (supportsThinkingMode) {
        configOptions.thinkingConfig = {
          thinkingBudget: options?.thinkingConfig?.thinkingBudget ?? -1,
          includeThoughts: options?.thinkingConfig?.includeThoughts ?? true
        };
      }
    }

    return createGeminiConfig(configOptions);
  }

  /**
   * Convert AIMessage format to Gemini format
   */
  static convertMessages(messages: AIMessage[]): any[] {
    return convertMessagesToGemini(messages);
  }

  /**
   * Check if model supports files
   */
  static supportsFiles(model: string): boolean {
    const modelInfo = getModelInfo(model);
    return modelInfo?.supportsFiles || false;
  }

  /**
   * Check if model supports thinking
   */
  static supportsThinking(model: string): boolean {
    const modelInfo = getModelInfo(model);
    return modelInfo?.supportsThinking || false;
  }

  /**
   * Validate model and options compatibility
   */
  static validateModelOptions(model: string, options?: UseGeminiServiceOptions): void {
    const modelInfo = getModelInfo(model);

    if (!modelInfo) {
      throw new Error(`Unknown model: ${model}`);
    }

    // Check file support
    if (options?.enableUrlContext && !modelInfo.supportsFiles) {
      console.warn(`Model ${model} does not support file uploads, URL context disabled`);
    }

    // Check thinking support
    if (options?.enableThinking && !modelInfo.supportsThinking) {
      console.warn(`Model ${model} does not support thinking mode, feature disabled`);
    }
  }

  /**
   * Parse code execution results from response
   */
  static parseCodeExecutionResults(response: any): { text: string; codeResults?: CodeExecutionResult[] } {
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
}

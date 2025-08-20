/**
 * Groq Service Implementation
 * Handles all Groq API interactions with proper error handling and streaming
 *
 * SECURITY NOTE: This service uses dangerouslyAllowBrowser: true to enable
 * client-side usage. In production, consider implementing server-side proxy
 * to avoid exposing API keys in the browser.
 */

import Groq from 'groq-sdk';
import {
  GROQ_MODELS,
  createGroqConfig,
  getGroqModelInfo,
  getAvailableGroqModels,
  getReasoningModels,
  getToolsModels,
  type GroqModelInfo,
  type GroqAdvancedResponse,
  type ReasoningEffort,
  type ReasoningFormat
} from './groq-config';
import { BaseAIService, AIMessage } from './ai-config';
import { getCurrentSystemPrompt, getAICommunicationLanguage, detectLanguageFromMessage } from './prompt-storage';
import {
  createTitleGenerationPrompt,
  createFallbackTitle,
  detectTitleLanguage,
  convertMessagesToGroq
} from './ai-shared-utils';

// Type definitions
interface ThinkingResult {
  thoughtSummary: string;
  answer: string;
  thinkingTokens: number;
  outputTokens: number;
}

interface GroqMessage {
  role: string;
  content: string;
}

interface GroqOptions {
  model?: string;
  temperature?: number;
  top_p?: number;
  stop?: string | string[] | null;
  stream?: boolean;
}

interface GroqStreamChunk {
  choices: Array<{
    delta?: {
      content?: string;
      reasoning?: string; // For OpenAI GPT-OSS models
    };
  }>;
  // Alternative formats from OpenAI GPT-OSS
  delta?: {
    content?: string;
    reasoning?: string;
  };
  content?: string;
  reasoning?: string;
}

export interface UseGroqServiceOptions {
  model?: string;
  temperature?: number;
  topP?: number; // Will be converted to top_p
  stop?: string | string[] | null;
  // Advanced features for GPT-OSS models
  reasoning_effort?: ReasoningEffort;
  reasoning_format?: ReasoningFormat;
  enable_code_interpreter?: boolean;
  enable_browser_search?: boolean;
}

export class GroqService extends BaseAIService {
  private client: Groq | null = null;
  protected defaultModel: string = GROQ_MODELS.OPENAI_GPT_OSS_20B;
  protected storageKeyPrefix: string = 'groq';

  constructor(apiKey?: string) {
    super(apiKey);
    const key = apiKey || process.env.GROQ_API_KEY || this.getApiKeyFromStorage();
    if (key) {
      this.apiKey = key;
      this.client = new Groq({
        apiKey: key,
        dangerouslyAllowBrowser: true // Required for client-side usage
      });
      this.isConfigured = true;
    }
  }

  /**
   * Configure the service with an API key
   */
  configure(apiKey: string): void {
    this.apiKey = apiKey;
    this.client = new Groq({
      apiKey,
      dangerouslyAllowBrowser: true // Required for client-side usage
    });
    this.isConfigured = true;
    this.saveApiKeyToStorage(apiKey);
  }



  /**
   * Convert options to Groq-compatible format
   */
  private convertOptions(options?: UseGroqServiceOptions): GroqOptions {
    if (!options) return {};

    const groqOptions: GroqOptions = {};

    if (options.model) groqOptions.model = options.model;
    if (options.temperature !== undefined) groqOptions.temperature = options.temperature;
    if (options.topP !== undefined) groqOptions.top_p = options.topP;
    if (options.stop !== undefined) groqOptions.stop = options.stop;

    return groqOptions;
  }

  /**
   * Convert AIMessage format to Groq format
   */
  private convertMessages(messages: AIMessage[]): GroqMessage[] {
    const systemPrompt = getCurrentSystemPrompt();

    const convertedMessages: GroqMessage[] = [
      { role: 'system', content: systemPrompt }
    ];

    // Add conversation messages using shared utility
    const groqMessages = convertMessagesToGroq(messages);
    convertedMessages.push(...groqMessages as Array<{ role: string; content: string }>);

    return convertedMessages;
  }

  /**
   * Check if model supports advanced features
   */
  private supportsAdvancedFeatures(model: string): boolean {
    const modelInfo = getGroqModelInfo(model);
    return modelInfo?.supportsReasoning || modelInfo?.supportsTools || false;
  }

  /**
   * Build tools array for advanced models
   */
  private buildTools(options?: UseGroqServiceOptions): any[] | undefined {
    if (!options) return undefined;

    const tools: any[] = [];

    if (options.enable_code_interpreter) {
      tools.push({ type: 'code_interpreter' });
    }

    if (options.enable_browser_search) {
      tools.push({ type: 'browser_search' });
    }

    return tools.length > 0 ? tools : undefined;
  }

  /**
   * Build advanced config for GPT-OSS models
   */
  private buildAdvancedConfig(model: string, options?: UseGroqServiceOptions): any {
    const baseConfig = this.convertOptions(options);

    if (!this.supportsAdvancedFeatures(model) || !options) {
      return baseConfig;
    }

    const advancedConfig: any = { ...baseConfig };

    // Add reasoning parameters (these are specific to OpenAI GPT-OSS models)
    if (options.reasoning_effort) {
      advancedConfig.reasoning_effort = options.reasoning_effort;
    }

    // Note: reasoning_format is NOT supported by OpenAI GPT-OSS models
    // Only add reasoning_format for other models that support it
    if (options.reasoning_format && !model.includes('openai/gpt-oss')) {
      advancedConfig.reasoning_format = options.reasoning_format;
    }

    // Add tools - use the exact format expected by Groq API for GPT-OSS models
    const tools = this.buildTools(options);
    if (tools && tools.length > 0) {
      advancedConfig.tools = tools;
    }

    // Log the config for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log('🔧 Advanced config for model', model, ':', advancedConfig);
    }

    return advancedConfig;
  }

  /**
   * Send a single message and get complete response
   */
  async sendMessage(
    messages: AIMessage[],
    options?: UseGroqServiceOptions
  ): Promise<string> {
    try {
      this.ensureConfigured();

      const model = options?.model || this.defaultModel;
      const advancedConfig = this.buildAdvancedConfig(model, options);
      
      // For OpenAI GPT-OSS models, we need to pass the parameters directly
      const isGPTOSS = model.includes('openai/gpt-oss');
      
      const config = createGroqConfig({
        ...advancedConfig,
        model,
        stream: false,
        // Ensure max_completion_tokens is set for GPT-OSS models
        max_completion_tokens: advancedConfig.max_completion_tokens || 8192
      });

      const convertedMessages = this.convertMessages(messages);

      // Build the final request with all parameters
      const requestConfig: any = {
        ...config,
        messages: convertedMessages
      };

      // Add advanced features directly to the request for GPT-OSS models
      if (isGPTOSS) {
        if (advancedConfig.reasoning_effort) {
          requestConfig.reasoning_effort = advancedConfig.reasoning_effort;
        }
        // Note: reasoning_format is NOT supported by OpenAI GPT-OSS models
        if (advancedConfig.tools) {
          requestConfig.tools = advancedConfig.tools;
        }

        // Log the request for debugging
        if (process.env.NODE_ENV === 'development') {
          console.log('📤 Groq API Request for GPT-OSS (non-streaming):', {
            model: requestConfig.model,
            reasoning_effort: requestConfig.reasoning_effort,
            tools: requestConfig.tools
          });
        }
      }

      const response = await this.client!.chat.completions.create(requestConfig);

      return response.choices[0]?.message?.content || 'No response generated';
    } catch (error) {
      console.error('Groq sendMessage error:', error);
      throw this.handleApiError(error, 'gửi tin nhắn');
    }
  }

  /**
   * Send message with streaming response
   */
  async streamMessage(
    messages: AIMessage[],
    onChunk: (chunk: string) => void,
    options?: UseGroqServiceOptions
  ): Promise<void> {
    try {
      this.ensureConfigured();

      const model = options?.model || this.defaultModel;
      const advancedConfig = this.buildAdvancedConfig(model, options);
      
      // For OpenAI GPT-OSS models, we need to pass the parameters directly
      const isGPTOSS = model.includes('openai/gpt-oss');
      
      const config = createGroqConfig({
        ...advancedConfig,
        model,
        stream: true,
        // Ensure max_completion_tokens is set for GPT-OSS models
        max_completion_tokens: advancedConfig.max_completion_tokens || 8192
      });

      const convertedMessages = this.convertMessages(messages);

      // Build the final request with all parameters
      const requestConfig: any = {
        ...config,
        messages: convertedMessages
      };

      // Add advanced features directly to the request for GPT-OSS models
      if (isGPTOSS) {
        if (advancedConfig.reasoning_effort) {
          requestConfig.reasoning_effort = advancedConfig.reasoning_effort;
        }
        // Note: reasoning_format is NOT supported by OpenAI GPT-OSS models
        if (advancedConfig.tools) {
          requestConfig.tools = advancedConfig.tools;
        }

        // Log the request for debugging
        if (process.env.NODE_ENV === 'development') {
          console.log('📤 Groq API Request for GPT-OSS:', {
            model: requestConfig.model,
            reasoning_effort: requestConfig.reasoning_effort,
            tools: requestConfig.tools
          });
        }
      }

      const response = await this.client!.chat.completions.create(requestConfig);

      let fullContent = '';
      let answerContent = '';
      let isInThinkingMode = false;
      let thinkingBuffer = '';
      let hasThinkingContent = false;
      let thinkingStarted = false;
      let thinkingCompleted = false;

      // Check if response is a stream or regular response
      if (config.stream && Symbol.asyncIterator in response) {
        for await (const chunk of response as AsyncIterable<GroqStreamChunk>) {
        const content = chunk.choices[0]?.delta?.content || chunk.delta?.content || chunk.content;
        const reasoning = chunk.choices[0]?.delta?.reasoning || chunk.delta?.reasoning || chunk.reasoning;

        // Handle OpenAI GPT-OSS reasoning (thinking mode)
        if (reasoning) {
          if (!thinkingStarted) {
            onChunk('__GROQ_THINKING_START__');
            thinkingStarted = true;
            hasThinkingContent = true;
          }
          onChunk(`__GROQ_THINKING_CONTENT__${reasoning}`);
          thinkingBuffer += reasoning;
        }

        if (content) {
          fullContent += content;

          // Check for thinking tags
          if (content.includes('<think>')) {
            isInThinkingMode = true;
            hasThinkingContent = true;

            // Start thinking display immediately
            if (!thinkingStarted) {
              onChunk('__GROQ_THINKING_START__');
              thinkingStarted = true;
            }

            // Send thinking content (remove <think> tag)
            const thinkingContent = content.replace('<think>', '');
            if (thinkingContent.trim()) {
              onChunk(`__GROQ_THINKING_CONTENT__${thinkingContent}`);
            }
            thinkingBuffer += content;

          } else if (content.includes('</think>')) {
            isInThinkingMode = false;

            // Send remaining thinking content (remove </think> tag)
            const thinkingContent = content.replace('</think>', '');
            if (thinkingContent.trim()) {
              onChunk(`__GROQ_THINKING_CONTENT__${thinkingContent}`);
            }
            thinkingBuffer += content;

            // End thinking display
            if (!thinkingCompleted) {
              onChunk('__GROQ_THINKING_END__');
              thinkingCompleted = true;
            }

          } else if (isInThinkingMode) {
            // Stream thinking content in real-time
            onChunk(`__GROQ_THINKING_CONTENT__${content}`);
            thinkingBuffer += content;

          } else {
            // Stream answer content normally (only after thinking is done)
            if (thinkingCompleted || !hasThinkingContent) {
              answerContent += content;
              onChunk(content);
            }
          }
        }

        // For OpenAI models: End thinking when we start getting content and no more reasoning
        if (content && hasThinkingContent && !thinkingCompleted && !reasoning) {
          onChunk('__GROQ_THINKING_END__');
          thinkingCompleted = true;
          // Send any buffered content immediately after ending thinking
          if (content && !isInThinkingMode) {
            answerContent += content;
            onChunk(content);
          }
        }
      }
      } else {
        // Handle non-streaming response
        const content = response.choices[0]?.message?.content || '';
        onChunk(content);
      }
    } catch (error) {
      console.error('Groq streamMessage error:', error);
      throw this.handleApiError(error, 'stream tin nhắn');
    }
  }

  /**
   * Send message with thinking mode (non-streaming)
   */
  async sendMessageWithThinking(
    messages: AIMessage[],
    options?: UseGroqServiceOptions
  ): Promise<ThinkingResult> {
    try {
      this.ensureConfigured();

      const model = options?.model || this.defaultModel;
      const convertedOptions = this.convertOptions(options);
      const config = createGroqConfig({
        ...convertedOptions,
        model,
        stream: false
      });

      const convertedMessages = this.convertMessages(messages);

      const response = await this.client!.chat.completions.create({
        ...config,
        messages: convertedMessages
      });

      const content = response.choices[0]?.message?.content || '';
      return this.parseThinkingResults(content);
    } catch (error) {
      console.error('Groq sendMessageWithThinking error:', error);
      throw this.handleApiError(error, 'gửi tin nhắn với thinking mode');
    }
  }

  /**
   * Send message with advanced features (reasoning + tools)
   * Only works with GPT-OSS models
   */
  async sendAdvancedMessage(
    messages: AIMessage[],
    options?: UseGroqServiceOptions
  ): Promise<GroqAdvancedResponse> {
    try {
      this.ensureConfigured();

      const model = options?.model || this.defaultModel;

      // Check if model supports advanced features
      if (!this.supportsAdvancedFeatures(model)) {
        throw new Error(`Model ${model} does not support advanced features. Use GPT-OSS models instead.`);
      }

      const advancedConfig = this.buildAdvancedConfig(model, options);
      
      // For OpenAI GPT-OSS models, we need to pass the parameters directly
      const isGPTOSS = model.includes('openai/gpt-oss');
      
      const config = createGroqConfig({
        ...advancedConfig,
        model,
        stream: false,
        // Ensure max_completion_tokens is set for GPT-OSS models
        max_completion_tokens: advancedConfig.max_completion_tokens || 8192
      });

      const convertedMessages = this.convertMessages(messages);

      // Build the final request with all parameters
      const requestConfig: any = {
        ...config,
        messages: convertedMessages
      };

      // Add advanced features directly to the request for GPT-OSS models
      if (isGPTOSS) {
        if (advancedConfig.reasoning_effort) {
          requestConfig.reasoning_effort = advancedConfig.reasoning_effort;
        }
        // Note: reasoning_format is NOT supported by OpenAI GPT-OSS models
        if (advancedConfig.tools) {
          requestConfig.tools = advancedConfig.tools;
        }

        // Log the request for debugging
        console.log('📤 Groq API Request for GPT-OSS (advanced):', {
          model: requestConfig.model,
          reasoning_effort: requestConfig.reasoning_effort,
          tools: requestConfig.tools,
          max_completion_tokens: requestConfig.max_completion_tokens
        });
      }

      const response = await this.client!.chat.completions.create(requestConfig);

      const choice = response.choices[0];
      const message = choice?.message;

      // Build advanced response
      const advancedResponse: GroqAdvancedResponse = {
        content: message?.content || 'No response generated'
      };

      // Add reasoning if available
      if ((message as any)?.reasoning) {
        advancedResponse.reasoning = (message as any).reasoning;
      }

      // Add executed tools if available
      if ((message as any)?.executed_tools) {
        advancedResponse.executed_tools = (message as any).executed_tools;
      }

      return advancedResponse;
    } catch (error) {
      console.error('Groq sendAdvancedMessage error:', error);
      throw this.handleApiError(error, 'gửi tin nhắn với tính năng nâng cao');
    }
  }

  /**
   * Generate chat title using fast model
   */
  async generateChatTitle(firstMessage: string): Promise<string> {
    try {
      this.ensureConfigured();

      // Detect language for title generation
      const language = detectTitleLanguage(firstMessage);

      const prompt = createTitleGenerationPrompt(language, firstMessage);

      const response = await this.client!.chat.completions.create({
        model: GROQ_MODELS.LLAMA_3_1_8B_INSTANT, // Use Llama 3.1 8B Instant for title generation
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: 0.8, // Slightly lower for more focused titles
        max_completion_tokens: 30, // Increased for better title generation
        stream: false
      });

      const title = response.choices[0]?.message?.content?.trim() || createFallbackTitle(language);

      // Ensure title is not too long
      if (title.length > 50) {
        return title.substring(0, 47) + '...';
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
   * Validate API key
   */
  async validateApiKey(apiKey: string): Promise<boolean> {
    try {
      const testClient = new Groq({
        apiKey,
        dangerouslyAllowBrowser: true // Required for client-side usage
      });
      const response = await testClient.chat.completions.create({
        model: GROQ_MODELS.COMPOUND_MINI, // Use fast model for validation
        messages: [{ role: 'user', content: 'Hello' }],
        max_completion_tokens: 10,
        stream: false
      });

      return !!response.choices[0]?.message?.content;
    } catch (error) {
      console.error('API key validation failed:', error);
      return false;
    }
  }

  /**
   * Parse thinking results from Groq response (extract <think> tags)
   */
  private parseThinkingResults(content: string): ThinkingResult {
    // Extract thinking content between <think> and </think> tags
    const thinkingRegex = /<think>([\s\S]*?)<\/think>/gi;
    const matches = content.match(thinkingRegex);

    let thoughtSummary = '';
    let answer = content;

    if (matches) {
      // Extract all thinking content
      matches.forEach(match => {
        const thinkingContent = match.replace(/<\/?think>/gi, '').trim();
        thoughtSummary += thinkingContent + '\n\n';
      });

      // Remove thinking tags from the answer
      answer = content.replace(thinkingRegex, '').trim();
    }

    // Estimate token counts (rough approximation)
    const thinkingTokens = Math.ceil(thoughtSummary.length / 4);
    const outputTokens = Math.ceil(answer.length / 4);

    return {
      thoughtSummary: thoughtSummary.trim(),
      answer: answer.trim(),
      thinkingTokens,
      outputTokens
    };
  }

  /**
   * Get available models
   */
  getAvailableModels(): GroqModelInfo[] {
    return getAvailableGroqModels();
  }

  /**
   * Set default model
   */
  setDefaultModel(model: string): void {
    const modelInfo = getGroqModelInfo(model);
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

  /**
   * Get models that support reasoning
   */
  getReasoningModels(): GroqModelInfo[] {
    return getReasoningModels();
  }

  /**
   * Get models that support tools
   */
  getToolsModels(): GroqModelInfo[] {
    return getToolsModels();
  }

  /**
   * Check if a specific model supports advanced features
   */
  modelSupportsAdvancedFeatures(model: string): boolean {
    return this.supportsAdvancedFeatures(model);
  }
}

// Export singleton instance
let groqServiceInstance: GroqService | null = null;

export function getGroqService(apiKey?: string): GroqService {
  if (!groqServiceInstance) {
    groqServiceInstance = new GroqService(apiKey);
  } else if (apiKey && !groqServiceInstance.configured) {
    groqServiceInstance.configure(apiKey);
  }
  return groqServiceInstance;
}

// Export class for custom instances
export { GroqService as default };

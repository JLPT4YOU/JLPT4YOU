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
  type GroqModelInfo,
  IRIN_GROQ_SYSTEM_INSTRUCTION
} from './groq-config';
import { BaseAIService, AIMessage } from './ai-config';
import { getCurrentSystemPrompt } from './prompt-storage';
import {
  createTitleGenerationPrompt,
  createFallbackTitle,
  detectTitleLanguage,
  convertMessagesToGroq
} from './ai-shared-utils';

// Thinking result interface for Groq
interface ThinkingResult {
  thoughtSummary: string;
  answer: string;
  thinkingTokens: number;
  outputTokens: number;
}



export interface UseGroqServiceOptions {
  model?: string;
  temperature?: number;
  topP?: number; // Will be converted to top_p
  stop?: string | string[] | null;
}

export class GroqService extends BaseAIService {
  private client: Groq | null = null;
  protected defaultModel: string = GROQ_MODELS.LLAMA_3_3_70B;
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
  private convertOptions(options?: UseGroqServiceOptions): any {
    if (!options) return {};

    const groqOptions: any = {};

    if (options.model) groqOptions.model = options.model;
    if (options.temperature !== undefined) groqOptions.temperature = options.temperature;
    if (options.topP !== undefined) groqOptions.top_p = options.topP;
    if (options.stop !== undefined) groqOptions.stop = options.stop;

    return groqOptions;
  }

  /**
   * Convert AIMessage format to Groq format
   */
  private convertMessages(messages: AIMessage[]): Array<{ role: string; content: string }> {
    const systemPrompt = getCurrentSystemPrompt() || IRIN_GROQ_SYSTEM_INSTRUCTION;

    const convertedMessages: Array<{ role: string; content: string }> = [
      { role: 'system', content: systemPrompt }
    ];

    // Add conversation messages using shared utility
    const groqMessages = convertMessagesToGroq(messages);
    convertedMessages.push(...groqMessages as Array<{ role: string; content: string }>);

    return convertedMessages;
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
      const convertedOptions = this.convertOptions(options);
      const config = createGroqConfig({
        ...convertedOptions,
        model,
        stream: false // Non-streaming for this method
      });

      const convertedMessages = this.convertMessages(messages);

      const response = await this.client!.chat.completions.create({
        ...config,
        messages: convertedMessages
      });

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
      const convertedOptions = this.convertOptions(options);
      const config = createGroqConfig({
        ...convertedOptions,
        model,
        stream: true
      });

      const convertedMessages = this.convertMessages(messages);

      const stream = await this.client!.chat.completions.create({
        ...config,
        messages: convertedMessages
      });

      let fullContent = '';
      let answerContent = '';
      let isInThinkingMode = false;
      let thinkingBuffer = '';
      let hasThinkingContent = false;
      let thinkingStarted = false;
      let thinkingCompleted = false;

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
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
   * Generate chat title using fast model
   */
  async generateChatTitle(firstMessage: string): Promise<string> {
    try {
      this.ensureConfigured();

      // Detect language for title generation
      const language = detectTitleLanguage(firstMessage);

      const prompt = createTitleGenerationPrompt(language, firstMessage);

      const response = await this.client!.chat.completions.create({
        model: GROQ_MODELS.COMPOUND_MINI, // Use fast model for title generation
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: 1.0,
        max_completion_tokens: 20,
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

/**
 * Shared AI Utilities
 * Common utilities used across different AI service providers
 */

import { AIMessage } from './ai-config';
import { getAICommunicationLanguage, detectLanguageFromMessage } from './prompt-storage';

/**
 * Language-specific title generation templates
 */
const TITLE_GENERATION_TEMPLATES: Record<string, string> = {
  'Tiếng Việt': `Tạo tiêu đề ngắn gọn 4-6 từ cho cuộc trò chuyện này. Chỉ trả về tiêu đề bằng tiếng Việt, không giải thích:`,
  'English': `Create a concise 4-6 word title for this conversation. Only return the title in English, no explanation:`,
  '日本語': `この会話の簡潔な4-6語のタイトルを作成してください。日本語でタイトルのみを返し、説明は不要です：`
};

/**
 * Language-specific fallback titles
 */
const FALLBACK_TITLES: Record<string, string> = {
  'Tiếng Việt': 'Cuộc trò chuyện mới',
  'English': 'New Chat',
  '日本語': '新しいチャット'
};

/**
 * Create optimized title generation prompt for any language
 */
export function createTitleGenerationPrompt(language: string, firstMessage: string): string {
  // If it's a known language, use the template
  if (TITLE_GENERATION_TEMPLATES[language]) {
    return `${TITLE_GENERATION_TEMPLATES[language]}\n\n"${firstMessage}"`;
  }

  // For custom languages, create a dynamic prompt
  return `Create a concise 4-6 word title for this conversation in ${language}.
IMPORTANT: Respond ONLY in ${language}, no other language. Only return the title, no explanation:

"${firstMessage}"`;
}

/**
 * Create fallback title for any language
 */
export function createFallbackTitle(language: string): string {
  // If it's a known language, use the fallback
  if (FALLBACK_TITLES[language]) {
    return FALLBACK_TITLES[language];
  }

  // For custom languages, create a generic fallback
  return `New Chat (${language})`;
}

/**
 * Detect language for title generation
 */
export function detectTitleLanguage(firstMessage: string): string {
  // Check if auto-detect mode is enabled
  const aiLanguage = typeof window !== 'undefined' ? localStorage.getItem('ai_language') || 'auto' : 'auto';

  if (aiLanguage === 'auto') {
    return detectLanguageFromMessage(firstMessage);
  } else {
    return getAICommunicationLanguage(firstMessage);
  }
}

/**
 * Message conversion utilities for different providers
 */
export interface ConvertedMessage {
  role: string;
  content?: string;
  parts?: Array<{ text: string }>;
}

/**
 * Convert AIMessage to Gemini format
 */
export function convertMessagesToGemini(messages: AIMessage[]): ConvertedMessage[] {
  return messages
    .filter(msg => msg.role !== 'system') // Filter out system messages
    .map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));
}

/**
 * Convert AIMessage to Groq/OpenAI format
 */
export function convertMessagesToGroq(messages: AIMessage[]): ConvertedMessage[] {
  return messages
    .filter(msg => msg.role !== 'system') // Filter out system messages
    .map(msg => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content
    }));
}

/**
 * Generic message converter that can be extended for other providers
 */
export function convertMessages(
  messages: AIMessage[], 
  format: 'gemini' | 'groq' | 'openai'
): ConvertedMessage[] {
  switch (format) {
    case 'gemini':
      return convertMessagesToGemini(messages);
    case 'groq':
    case 'openai':
      return convertMessagesToGroq(messages);
    default:
      throw new Error(`Unsupported message format: ${format}`);
  }
}

/**
 * Validate API key format for different providers
 */
export function validateApiKeyFormat(apiKey: string, provider: 'gemini' | 'groq'): boolean {
  if (!apiKey || typeof apiKey !== 'string') {
    return false;
  }

  switch (provider) {
    case 'gemini':
      // Gemini API keys typically start with 'AIza' and are 39 characters long
      return apiKey.startsWith('AIza') && apiKey.length === 39;
    case 'groq':
      // Groq API keys typically start with 'gsk_' and are longer
      return apiKey.startsWith('gsk_') && apiKey.length > 50;
    default:
      return false;
  }
}

/**
 * Create standardized error messages for common scenarios
 */
export const ERROR_MESSAGES = {
  NOT_CONFIGURED: 'Service chưa được cấu hình. Vui lòng cung cấp API key.',
  INVALID_API_KEY: 'API key không hợp lệ. Vui lòng kiểm tra lại API key.',
  QUOTA_EXCEEDED: 'API quota đã hết. Vui lòng thử lại sau hoặc kiểm tra API key của bạn.',
  INVALID_CONFIG: 'Cấu hình không hợp lệ. Vui lòng thử model khác.',
  MODEL_NOT_FOUND: 'Model không tồn tại. Vui lòng chọn model khác.',
  NETWORK_ERROR: 'Lỗi kết nối mạng. Vui lòng kiểm tra internet và thử lại.',
  GENERIC_ERROR: (context: string) => `Có lỗi xảy ra khi ${context}. Vui lòng thử lại.`
} as const;

/**
 * Utility to create AI messages
 */
export function createAIMessage(
  content: string, 
  role: 'user' | 'assistant' | 'system' = 'user'
): AIMessage {
  return {
    role,
    content,
    timestamp: new Date()
  };
}

/**
 * Utility to format messages for API calls (generic)
 */
export function formatMessagesForAPI(messages: AIMessage[]): any[] {
  return messages.map(msg => ({
    role: msg.role,
    content: msg.content
  }));
}

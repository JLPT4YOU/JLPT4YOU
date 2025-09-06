/**
 * Shared AI Utilities
 * Common utilities used across different AI service providers
 */

import { AIMessage } from './ai-config';
import { detectLanguageFromMessage } from './prompt-storage';

/**
 * Language-specific title generation templates
 */
const TITLE_GENERATION_TEMPLATES: Record<string, string> = {
  'Tiếng Việt': `Bạn là chuyên gia tạo tiêu đề sáng tạo. Hãy phân tích nội dung tin nhắn và tạo một tiêu đề:

YÊU CẦU:
- 4-6 từ, súc tích và có ý nghĩa
- Phản ánh chính xác chủ đề hoặc mục đích của cuộc trò chuyện
- Sử dụng từ ngữ hấp dẫn, dễ nhớ
- Tránh từ chung chung như "hỏi về", "thảo luận"
- Ưu tiên từ khóa quan trọng nhất

VÍ DỤ:
- "Làm thế nào để học tiếng Nhật hiệu quả?" → "Chiến lược học tiếng Nhật"
- "Tôi muốn tìm hiểu về AI" → "Khám phá trí tuệ nhân tạo"
- "Giúp tôi viết CV xin việc" → "Tối ưu hóa CV chuyên nghiệp"

Chỉ trả về tiêu đề bằng tiếng Việt, không giải thích:`,

  'English': `You are a creative title generation expert. Analyze the message content and create a compelling title:

REQUIREMENTS:
- 4-6 words, concise and meaningful
- Accurately reflect the topic or purpose of the conversation
- Use engaging, memorable language
- Avoid generic words like "asking about", "discussing"
- Prioritize the most important keywords

EXAMPLES:
- "How to learn Japanese effectively?" → "Japanese Learning Strategies"
- "I want to understand AI" → "Exploring Artificial Intelligence"
- "Help me write a resume" → "Professional Resume Optimization"

Only return the title in English, no explanation:`,

  '日本語': `あなたは創造的なタイトル生成の専門家です。メッセージの内容を分析し、魅力的なタイトルを作成してください：

要件：
- 4-6語、簡潔で意味のある
- 会話のトピックや目的を正確に反映
- 魅力的で覚えやすい言葉を使用
- 「について聞く」「議論する」などの一般的な言葉を避ける
- 最も重要なキーワードを優先

例：
- "日本語を効果的に学ぶ方法は？" → "日本語学習戦略"
- "AIについて理解したい" → "人工知能の探求"
- "履歴書を書くのを手伝って" → "プロ履歴書最適化"

日本語でタイトルのみを返し、説明は不要です：`
};

/**
 * Language-specific fallback titles
 */
const FALLBACK_TITLES: Record<string, string> = {
  'Tiếng Việt': 'Trò chuyện với AI',
  'English': 'AI Conversation',
  '日本語': 'AI との会話'
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
  return `You are a creative title generation expert. Analyze the message content and create a compelling title in ${language}:

REQUIREMENTS:
- 4-6 words, concise and meaningful
- Accurately reflect the topic or purpose of the conversation
- Use engaging, memorable language in ${language}
- Avoid generic words like "asking about", "discussing"
- Prioritize the most important keywords

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

  // For custom languages, create a more meaningful fallback
  return `AI Chat (${language})`;
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
    // Use detectLanguageFromMessage for all cases since getAICommunicationLanguage is deprecated
    return detectLanguageFromMessage(firstMessage);
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
  const systemPrompt = getCurrentSystemPrompt();
  // Gemini prefers the system prompt to be part of the first user message.
  const geminiMessages: ConvertedMessage[] = [];

  messages.forEach((msg, index) => {
    if (msg.role === 'system') return; // Skip any explicit system messages

    let content = msg.content;
    // Prepend system prompt to the very first user message
    if (index === 0 && msg.role === 'user') {
      content = `${systemPrompt}\n\n---\n\n${msg.content}`;
    }

    geminiMessages.push({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: content }]
    });
  });

  return geminiMessages;
}

/**
 * Convert AIMessage to Groq/OpenAI format
 */
import { getCurrentSystemPrompt } from './prompt-storage';

export function convertMessagesToGroq(messages: AIMessage[]): ConvertedMessage[] {
  const systemPrompt = getCurrentSystemPrompt();
  const groqMessages: ConvertedMessage[] = [{ role: 'system', content: systemPrompt }];

  messages.forEach(msg => {
    if (msg.role !== 'system') {
      groqMessages.push({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content
      });
    }
  });

  return groqMessages;
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

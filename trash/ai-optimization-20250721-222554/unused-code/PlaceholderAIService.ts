/**
 * PlaceholderAIService - REMOVED FROM PRODUCTION
 * 
 * MOVED TO TRASH: 2025-07-21
 * REASON: Not used in production, only for demo/testing purposes
 * ORIGINAL PATH: src/lib/ai-service.ts (lines 74-176)
 * 
 * This service was a placeholder implementation that provided demo responses
 * but was never used in the actual application since we have real AI providers
 * (Gemini and Groq).
 */

import { AIMessage, AIService, DEFAULT_AI_SETTINGS } from '../../../src/lib/ai-config';
import { getCurrentSystemPrompt, getAICommunicationLanguage, detectLanguageFromMessage } from '../../../src/lib/prompt-storage';

/**
 * Get localized responses based on AI communication language setting
 */
function getLocalizedResponses(userMessage?: string) {
  // Check if auto-detect mode is enabled
  const aiLanguage = typeof window !== 'undefined' ? localStorage.getItem('ai_language') || 'auto' : 'auto';

  let language: string;
  if (aiLanguage === 'auto' && userMessage) {
    language = detectLanguageFromMessage(userMessage);
  } else {
    language = getAICommunicationLanguage(userMessage);
  }

  const responses = {
    'Tiếng Việt': {
      greeting: (isCustom: boolean) => isCustom 
        ? 'Xin chào! Tôi là iRIN với cấu hình tùy chỉnh của bạn. Tôi sẽ hỗ trợ bạn học tiếng Nhật theo phong cách riêng!' 
        : 'Xin chào em! Cô là iRIN từ JLPT4YOU. Cô sẽ giúp em học tiếng Nhật hiệu quả nhất!',
      grammar: 'Ngữ pháp tiếng Nhật có thể phức tạp, nhưng cô sẽ giải thích từng bước một cách dễ hiểu. Em muốn học về ngữ pháp nào?',
      kanji: 'Kanji là phần quan trọng trong tiếng Nhật. Cô có thể giúp em học từ cơ bản đến nâng cao. Em đang ở level nào?',
      vocabulary: 'Từ vựng là nền tảng của việc học ngôn ngữ. Cô sẽ giúp em mở rộng vốn từ vựng tiếng Nhật một cách hiệu quả!',
      jlpt: 'JLPT là kỳ thi quan trọng! Cô có kinh nghiệm giúp nhiều học viên đậu JLPT. Em đang chuẩn bị level nào?',
      technology: 'Công nghệ AI như cô đang giúp việc học tiếng Nhật trở nên thú vị và hiệu quả hơn. Em có muốn tìm hiểu thêm không?',
      entertainment: 'Anime, manga và J-pop là cách tuyệt vời để học tiếng Nhật! Cô có thể gợi ý nhiều tài liệu hay.',
      food: 'Ẩm thực Nhật rất phong phú! Học tiếng Nhật qua món ăn cũng rất thú vị. Em thích món nào nhất?',
      culture: 'Văn hóa Nhật Bản thật tuyệt vời! Hiểu văn hóa sẽ giúp em học tiếng Nhật tốt hơn.',
      default: (msg: string) => `Em vừa nói "${msg}". Cô hiểu em muốn tìm hiểu về chủ đề này. Hãy cùng cô khám phá nhé!`
    },
    'English': {
      greeting: (isCustom: boolean) => isCustom 
        ? 'Hello! I\'m iRIN with your custom configuration. I\'ll help you learn Japanese in your personalized style!' 
        : 'Hello! I\'m iRIN from JLPT4YOU. I\'ll help you learn Japanese effectively!',
      grammar: 'Japanese grammar can be complex, but I\'ll explain it step by step. What grammar point would you like to learn?',
      kanji: 'Kanji is crucial in Japanese. I can help you from basics to advanced levels. What\'s your current level?',
      vocabulary: 'Vocabulary is the foundation of language learning. I\'ll help you expand your Japanese vocabulary effectively!',
      jlpt: 'JLPT is an important exam! I have experience helping many students pass. Which level are you preparing for?',
      technology: 'AI technology like me is making Japanese learning more interesting and effective. Want to learn more?',
      entertainment: 'Anime, manga, and J-pop are great ways to learn Japanese! I can suggest many good resources.',
      food: 'Japanese cuisine is so diverse! Learning Japanese through food is also fun. What\'s your favorite dish?',
      culture: 'Japanese culture is wonderful! Understanding culture helps you learn Japanese better.',
      default: (msg: string) => `You just said "${msg}". I understand you want to explore this topic. Let\'s discover it together!`
    },
    '日本語': {
      greeting: (isCustom: boolean) => isCustom 
        ? 'こんにちは！私はあなたのカスタム設定を持つiRINです。あなた専用のスタイルで日本語学習をサポートします！' 
        : 'こんにちは！私はJLPT4YOUのiRINです。効果的に日本語を学習できるようお手伝いします！',
      grammar: '日本語の文法は複雑ですが、段階的に分かりやすく説明します。どの文法を学びたいですか？',
      kanji: '漢字は日本語の重要な部分です。基礎から上級まで対応できます。現在のレベルはいかがですか？',
      vocabulary: '語彙は言語学習の基礎です。効果的に日本語の語彙を増やすお手伝いをします！',
      jlpt: 'JLPTは重要な試験ですね！多くの学習者の合格をサポートした経験があります。どのレベルの準備をしていますか？',
      technology: '私のようなAI技術が日本語学習をより面白く効果的にしています。もっと知りたいですか？',
      entertainment: 'アニメ、マンガ、J-POPは日本語学習の素晴らしい方法です！良いリソースを提案できます。',
      food: '日本料理はとても多様です！食べ物を通じて日本語を学ぶのも楽しいですね。好きな料理は何ですか？',
      culture: '日本文化は素晴らしいです！文化を理解すると日本語がより上達します。',
      default: (msg: string) => `「${msg}」とおっしゃいましたね。このトピックについて探求したいのですね。一緒に発見しましょう！`
    }
  };

  return responses[language] || responses['Tiếng Việt'];
}

class PlaceholderAIService implements AIService {
  private apiKey?: string;
  private provider: string = 'placeholder';

  constructor(apiKey?: string) {
    this.apiKey = apiKey;
  }

  async sendMessage(messages: AIMessage[], options?: any): Promise<string> {
    // Placeholder implementation with custom prompt support
    await this.delay(1000); // Simulate API call delay

    // Get current system prompt (includes custom configuration)
    const systemPrompt = getCurrentSystemPrompt();

    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === 'user') {
      return this.generatePlaceholderResponse(lastMessage.content, systemPrompt);
    }

    return 'Xin lỗi, tôi không hiểu câu hỏi của bạn. Vui lòng thử lại!';
  }

  async streamMessage(
    messages: AIMessage[], 
    onChunk: (chunk: string) => void, 
    options?: any
  ): Promise<void> {
    const response = await this.sendMessage(messages, options);
    
    // Simulate streaming by sending chunks
    const words = response.split(' ');
    for (let i = 0; i < words.length; i++) {
      await this.delay(50); // Simulate streaming delay
      const chunk = i === 0 ? words[i] : ' ' + words[i];
      onChunk(chunk);
    }
  }

  async validateApiKey(apiKey: string): Promise<boolean> {
    // Placeholder validation - always returns true for demo
    return apiKey.length > 0;
  }

  private generatePlaceholderResponse(userMessage: string, systemPrompt?: string): string {
    const message = userMessage.toLowerCase();
    const responses = getLocalizedResponses(userMessage);

    // Use custom prompt context if available
    const isCustomPrompt = systemPrompt && systemPrompt !== DEFAULT_AI_SETTINGS.systemPrompt;

    // Simple keyword-based responses for demo
    if (message.includes('grammar') || message.includes('ngữ pháp') || message.includes('文法')) {
      return responses.grammar;
    }

    if (message.includes('kanji') || message.includes('chữ hán') || message.includes('漢字')) {
      return responses.kanji;
    }

    if (message.includes('vocabulary') || message.includes('từ vựng') || message.includes('語彙')) {
      return responses.vocabulary;
    }

    if (message.includes('jlpt') || message.includes('thi') || message.includes('試験')) {
      return responses.jlpt;
    }

    if (message.includes('hello') || message.includes('hi') || message.includes('xin chào') || message.includes('こんにちは')) {
      return responses.greeting(isCustomPrompt);
    }
    
    // General topics
    if (message.includes('technology') || message.includes('công nghệ') || message.includes('ai') || message.includes('programming') || message.includes('テクノロジー')) {
      return responses.technology;
    }

    if (message.includes('music') || message.includes('nhạc') || message.includes('movie') || message.includes('phim') || message.includes('音楽') || message.includes('映画')) {
      return responses.entertainment;
    }

    if (message.includes('food') || message.includes('đồ ăn') || message.includes('cooking') || message.includes('nấu ăn') || message.includes('料理') || message.includes('食べ物')) {
      return responses.food;
    }

    if (message.includes('travel') || message.includes('du lịch') || message.includes('culture') || message.includes('văn hóa') || message.includes('旅行') || message.includes('文化')) {
      return responses.culture;
    }

    // Default response
    return responses.default(userMessage);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const aiService = new PlaceholderAIService();

// Export class for custom instances
export { PlaceholderAIService };

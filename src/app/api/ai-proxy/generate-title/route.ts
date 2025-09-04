import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { GeminiService } from '@/lib/gemini-service-unified';

// Simple language detection based on character analysis
function detectLanguageFromMessage(message: string): string {
  // Check for Vietnamese characters
  if (/[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i.test(message)) {
    return 'Tiếng Việt';
  }
  // Check for Japanese characters (hiragana, katakana, kanji)
  if (/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(message)) {
    return '日本語';
  }
  // Default to English
  return 'English';
}

// Server-side function to create a title generation prompt
function createTitleGenerationPrompt(language: string, firstMessage: string): string {
  const templates: Record<string, string> = {
    'Tiếng Việt': `Bạn là chuyên gia tạo tiêu đề. Dựa vào tin nhắn này, tạo một tiêu đề 4-6 từ, súc tích, phản ánh đúng chủ đề. Chỉ trả về tiêu đề, không giải thích:\n\n"${firstMessage}"`,
    'English': `You are a title generation expert. Based on this message, create a concise 4-6 word title that reflects the topic. Return only the title, no explanation:\n\n"${firstMessage}"`,
    '日本語': `あなたはタイトル生成の専門家です。このメッセージに基づき、トピックを反映した4-6語の簡潔なタイトルを作成してください。タイトルのみを返し、説明は不要です：\n\n「${firstMessage}」`
  };
  if (templates[language]) return templates[language];
  // Generic template for other languages
  return `You are a title generation expert. Respond ONLY in ${language}. Based on this message, create a concise 4-6 word title that reflects the topic. Return only the title, no explanation:\n\n"${firstMessage}"`;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { firstMessage } = await request.json();
    if (!firstMessage) {
      return NextResponse.json({ error: 'firstMessage is required' }, { status: 400 });
    }

    // Fetch user's language preference and Gemini API key
    const { data: userData } = await supabase
      .from('users')
      .select('metadata')
      .eq('id', user.id)
      .single();

    const { data: apiKeyData, error: apiKeyError } = await supabase
      .from('user_api_keys')
      .select('api_key')
      .eq('user_id', user.id)
      .eq('provider', 'gemini') // Default to Gemini for title generation
      .single();

    if (apiKeyError || !apiKeyData?.api_key) {
      return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 400 });
    }

    // Determine language
    const aiLanguage = userData?.metadata?.aiLanguage || 'auto';
    const customAiLanguage = userData?.metadata?.customAiLanguage || '';

    let language: string;
    if (aiLanguage === 'auto') {
      language = detectLanguageFromMessage(firstMessage);
    } else if (aiLanguage === 'custom' && typeof customAiLanguage === 'string' && customAiLanguage.trim()) {
      language = customAiLanguage.trim();
    } else {
      const map: Record<string, string> = {
        vietnamese: 'Tiếng Việt',
        english: 'English',
        japanese: '日本語'
      };
      language = map[aiLanguage] || 'English';
    }

    const geminiService = new GeminiService(apiKeyData.api_key);
    const titlePrompt = createTitleGenerationPrompt(language, firstMessage);
    
    const title = await geminiService.sendMessage([{ role: 'user', content: titlePrompt }], {
      model: 'gemini-1.5-flash-latest',
      temperature: 0.5
    });

    // Clean up the title
    const cleanedTitle = title.replace(/["\*]/g, '').trim();

    return NextResponse.json({ title: cleanedTitle });

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
    console.error('[GENERATE TITLE API] Error:', errorMessage);
    return NextResponse.json({ error: 'Failed to generate title' }, { status: 500 });
  }
}


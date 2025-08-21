import { NextRequest, NextResponse } from 'next/server';
import { getGeminiService } from '@/lib/gemini-service';
import { generateExercisePrompt } from '@/lib/study/exercise-prompts';
// Remove external API imports - use local proxy endpoints instead
import { z } from 'zod';
import { devConsole } from '@/lib/console-override';

// Request validation schema
const generateRequestSchema = z.object({
  level: z.enum(['n5', 'n4', 'n3', 'n2', 'n1']),
  type: z.enum(['vocabulary', 'grammar', 'reading', 'kanji', 'mixed']),
  // count = number of AI questions to generate (for reading: number of passages)
  count: z.number().min(1).max(50).default(10),
  difficulty: z.string().optional(), // Allow custom format for reading (e.g., "medium_short")
  selectionMode: z.enum(['random', 'sequential']).default('random'),
  // materialLimit = how many materials to fetch as context for AI
  materialLimit: z.number().min(1).max(100).optional(),
  offset: z.number().min(0).optional(),
  model: z.string().optional(),
  enableThinking: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  reuseRecent: z.boolean().default(false) // Check for recent similar exercises
});

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request
    const body = await request.json();
    const params = generateRequestSchema.parse(body);
    
    // Special handling for Reading: count = number of passages, each passage generates 3 questions
    let finalCount = params.count;
    if (params.type === 'reading') {
      // For reading, count represents number of passages, but we need to tell AI to generate count * 3 questions
      finalCount = params.count; // Keep as number of passages for prompt
    }

    // Get materials from JLPT API or fallback to defaults
    const materialsToUse = await getMaterials(params.level, params.type, params.selectionMode, params.offset, params.materialLimit ?? params.count);

    // Generate prompt for Gemini
    const prompt = generateExercisePrompt({
      level: params.level,
      type: params.type,
      count: finalCount,
      difficulty: params.difficulty,
      materials: materialsToUse,
      tags: params.tags
    });
    
    // Fetch Gemini API key from secure endpoint (Supabase-backed)
    const origin = new URL(request.url).origin;
    const authHeader = request.headers.get('authorization') || '';
    const keyRes = await fetch(`${origin}/api/user/keys/gemini/decrypt`, {
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { Authorization: authHeader } : {})
      },
      // Forward cookies as well in case auth uses cookies
      // Next.js fetch in route handlers forwards cookies by default when same-origin
    });

    if (!keyRes.ok) {
      const status = keyRes.status;
      if (status === 401) throw new Error('Bạn chưa đăng nhập. Vui lòng đăng nhập để sử dụng AI.');
      if (status === 404) throw new Error('Chưa tìm thấy Gemini API key. Vào Settings → API Keys để thêm key.');
      throw new Error(`Không thể lấy Gemini API key (status ${status}).`);
    }

    const keyData = await keyRes.json().catch(() => ({} as any));
    const apiKey = keyData?.key as string | undefined;
    if (!apiKey) {
      throw new Error('Gemini API key rỗng hoặc không hợp lệ. Vào Settings → API Keys để cấu hình.');
    }

    // Call Gemini AI to generate questions with server-fetched key
    const geminiService = getGeminiService(apiKey);
    const response = await geminiService.sendMessage([
      { role: 'user', content: prompt }
    ], {
      model: params.model,
      enableThinking: params.enableThinking,
      thinkingConfig: { includeThoughts: true, thinkingBudget: -1 }
    });
    
    // Parse AI response (robust)
    let questions: any;
    try {
      const text = (response || '').trim();

      // 1) Direct JSON parse
      try {
        const direct = JSON.parse(text);
        questions = Array.isArray(direct) ? direct : (direct?.questions ?? null);
      } catch {}

      // 2) Fenced code block ```json
      if (!questions) {
        const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (fenceMatch) {
          try {
            const parsed = JSON.parse(fenceMatch[1]);
            questions = Array.isArray(parsed) ? parsed : (parsed?.questions ?? null);
          } catch {}
        }
      }

      // 3) First JSON array
      if (!questions) {
        const arrayMatch = text.match(/\[[\s\S]*\]/);
        if (arrayMatch) {
          try { questions = JSON.parse(arrayMatch[0]); } catch {}
        }
      }

      // 4) First JSON object with questions key
      if (!questions) {
        const objMatch = text.match(/\{[\s\S]*\}/);
        if (objMatch) {
          try { const parsed = JSON.parse(objMatch[0]); questions = parsed?.questions ?? null; } catch {}
        }
      }

      if (!questions) throw new Error('Invalid response format from AI');
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      throw new Error('AI không thể tạo câu hỏi. Vui lòng thử lại sau.');
    }
    
    // Validate and format questions
    const expectedQuestionCount = params.type === 'reading' ? params.count * 3 : params.count;
    questions = validateAndFormatQuestions(questions, expectedQuestionCount, params.type);
    
    // Generate a unique ID locally (not saved to database)
    const setId = `local_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    
    // Prepare exercise metadata
    const metadata = {
      count: questions.length,
      difficulty: params.difficulty || 'medium',
      tags: params.tags || [],
      generatedAt: new Date().toISOString(),
      model: params.model || 'gemini-2.0-flash',
      thinkingMode: params.enableThinking || false,
      level: params.level,
      type: params.type
    };
    
    // Return questions without saving to database
    return NextResponse.json({
      success: true,
      data: {
        setId: setId,
        questions: questions,
        metadata: metadata,
        reused: false
      }
    });
    
  } catch (error) {
    console.error('Error generating exercise:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate exercise'
      },
      { status: 500 }
    );
  }
}

// GET endpoint removed - no longer using Supabase storage

// Get materials from JLPT API with fallback to defaults
async function getMaterials(level: string, type: string, selectionMode: 'random' | 'sequential', offset: number | undefined, materialLimit: number): Promise<any[]> {
  devConsole.log(`🔍 [getMaterials] Fetching ${type} for level ${level}`);

  try {
    const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
    if (type === 'vocabulary') {
      // Random mode: fetch 50 items with random=true
      if (selectionMode === 'random') {
        const url = new URL(`${baseUrl}/api/jlpt/words/kanji-only`);
        url.searchParams.set('level', level.toLowerCase());
        url.searchParams.set('limit', '50');
        url.searchParams.set('random', 'true')
        devConsole.log(`📡 [API] Vocabulary RANDOM: ${url.toString()}`);
        const response = await fetch(url.toString(), {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          }
        });
        if (!response.ok) throw new Error(`Local proxy error: ${response.status}`);
        const data = await response.json();
        const words = data.words || data.kanji || [];
        devConsole.log(`📊 [API] Vocabulary response:`, { wordsCount: words.length || 0, firstWord: words?.[0] || null });
        if (Array.isArray(words) && words.length > 0) {
          return words.map((w: any) => {
            const kanji = w.Kanji || w.kanji || w.word || '';
            const reading = w.Hiragana || w.reading || kanji;
            const meaning = w.vn || w.en || '';
            const example = w.vd || w.example_jp || `${kanji}を使います。`;
            return { content: { word: kanji, reading, meaning, example } };
          });
        }
      } else { // sequential
        const url = new URL(`${baseUrl}/api/jlpt/words/kanji-only`);
        url.searchParams.set('level', level.toLowerCase());
        url.searchParams.set('limit', String(materialLimit || 10)); // Default 10 for sequential vocabulary
        if (typeof offset === 'number') url.searchParams.set('offset', String(offset));
        devConsole.log(`📡 [API] Vocabulary SEQUENTIAL: ${url.toString()}`);
        const response = await fetch(url.toString(), {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          }
        });
        if (!response.ok) throw new Error(`Local proxy error: ${response.status}`);
        const data = await response.json();
        const words = data.words || data.kanji || [];
        devConsole.log(`📊 [API] Vocabulary response:`, { wordsCount: words.length || 0, firstWord: words?.[0] || null });
        if (Array.isArray(words) && words.length > 0) {
          return words.map((w: any) => {
            const kanji = w.Kanji || w.kanji || w.word || '';
            const reading = w.Hiragana || w.reading || kanji;
            const meaning = w.vn || w.en || '';
            const example = w.vd || w.example_jp || `${kanji}を使います。`;
            return { content: { word: kanji, reading, meaning, example } };
          });
        }
      }
    } else if (type === 'grammar') {
      if (selectionMode === 'random') {
        const url = new URL(`${baseUrl}/api/jlpt/grammar/structure-examples`);
        url.searchParams.set('level', level.toLowerCase());
        url.searchParams.set('limit', '5'); // Fixed limit 5 for random grammar
        url.searchParams.set('random', 'true')
        devConsole.log(`📡 [API] Grammar RANDOM: ${url.toString()}`);
        const response = await fetch(url.toString(), {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          }
        });
        if (!response.ok) throw new Error(`Local proxy error: ${response.status}`);
        const data = await response.json();
        const grammarItems = data.grammar || [];
        devConsole.log(`📊 [API] Grammar response:`, { grammarCount: grammarItems.length || 0, firstGrammar: grammarItems?.[0] || null });
        if (Array.isArray(grammarItems) && grammarItems.length > 0) {
          return grammarItems.map((g: any) => {
            const pattern = g.grammar || g.structure || '';
            const meaning = g.meaning_vn || g.meaning_en || '';
            const example = g.examples?.[0]?.jp || g.examples_jp?.[0] || `${pattern}の例文です。`;
            return { content: { pattern, meaning, example } };
          });
        }
      } else { // sequential
        const url = new URL(`${baseUrl}/api/jlpt/grammar/structure-examples`);
        url.searchParams.set('level', level.toLowerCase());
        url.searchParams.set('limit', String(materialLimit || 5)); // Default 5 for sequential grammar
        if (typeof offset === 'number') url.searchParams.set('offset', String(offset));
        devConsole.log(`📡 [API] Grammar SEQUENTIAL: ${url.toString()}`);
        const response = await fetch(url.toString(), {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          }
        });
        if (!response.ok) throw new Error(`Local proxy error: ${response.status}`);
        const data = await response.json();
        const grammarItems = data.grammar || [];
        devConsole.log(`📊 [API] Grammar response:`, { grammarCount: grammarItems.length || 0, firstGrammar: grammarItems?.[0] || null });
        if (Array.isArray(grammarItems) && grammarItems.length > 0) {
          return grammarItems.map((g: any) => {
            const pattern = g.grammar || g.structure || '';
            const meaning = g.meaning_vn || g.meaning_en || '';
            const example = g.examples?.[0]?.jp || g.examples_jp?.[0] || `${pattern}の例文です。`;
            return { content: { pattern, meaning, example } };
          });
        }
      }
    } else if (type === 'reading') {
      // For reading comprehension, we need both vocabulary and grammar materials
      devConsole.log(`📡 [API] Reading: Fetching combined vocabulary + grammar for ${level}`);

      // Fetch vocabulary materials (limit to reasonable amount)
      const vocabLimit = Math.min(materialLimit || 20, 30);
      const grammarLimit = Math.min(materialLimit || 10, 15);

      const [vocabMaterials, grammarMaterials] = await Promise.all([
        // Get vocabulary materials
        (async () => {
          try {
            const url = new URL(`${baseUrl}/api/jlpt/words/kanji-only`);
            url.searchParams.set('level', level.toLowerCase());
            url.searchParams.set('limit', String(vocabLimit));
            if (selectionMode === 'random') url.searchParams.set('random', 'true');
            if (selectionMode === 'sequential' && typeof offset === 'number') {
              url.searchParams.set('offset', String(offset));
            }

            const response = await fetch(url.toString(), {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
              }
            });
            if (!response.ok) throw new Error(`Vocabulary API error: ${response.status}`);
            const data = await response.json();
            const words = data.words || data.kanji || [];
            return words.map((w: any) => {
              const kanji = w.Kanji || w.kanji || w.word || '';
              const reading = w.Hiragana || w.reading || kanji;
              const meaning = w.vn || w.en || '';
              const example = w.vd || w.example_jp || `${kanji}を使います。`;
              return { content: { word: kanji, reading, meaning, example }, type: 'vocabulary' };
            });
          } catch (error) {
            console.error('Failed to fetch vocabulary for reading:', error);
            return [];
          }
        })(),

        // Get grammar materials
        (async () => {
          try {
            const url = new URL(`${baseUrl}/api/jlpt/grammar/structure-examples`);
            url.searchParams.set('level', level.toLowerCase());
            url.searchParams.set('limit', String(grammarLimit));
            if (selectionMode === 'random') url.searchParams.set('random', 'true');
            if (selectionMode === 'sequential' && typeof offset === 'number') {
              url.searchParams.set('offset', String(Math.floor(offset / 2))); // Offset for grammar
            }

            const response = await fetch(url.toString(), {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
              }
            });
            if (!response.ok) throw new Error(`Grammar API error: ${response.status}`);
            const data = await response.json();
            const grammarItems = data.grammar || [];
            return grammarItems.map((g: any) => {
              const pattern = g.grammar || g.structure || '';
              const meaning = g.meaning_vn || g.meaning_en || '';
              const example = g.examples?.[0]?.jp || g.examples_jp?.[0] || `${pattern}の例文です。`;
              return { content: { pattern, meaning, example }, type: 'grammar' };
            });
          } catch (error) {
            console.error('Failed to fetch grammar for reading:', error);
            return [];
          }
        })()
      ]);

      // Combine and return materials
      const combinedMaterials = [...vocabMaterials, ...grammarMaterials];
      devConsole.log(`📊 [API] Reading materials:`, {
        vocabCount: vocabMaterials.length,
        grammarCount: grammarMaterials.length,
        totalCount: combinedMaterials.length
      });

      if (combinedMaterials.length > 0) {
        return combinedMaterials;
      }
    }
  } catch (error) {
    console.error(`❌ [API] Failed to fetch ${type} from API for ${level}:`, error);
  }

  // No fallback: strict API-only as requested
  throw new Error(`Không thể lấy dữ liệu ${type} cho level ${level}. Vui lòng thử lại sau hoặc kiểm tra API key/domain whitelist.`);
}



// Validate and format questions from AI
function validateAndFormatQuestions(questions: any[], targetCount: number, type?: string): any[] {
  if (!Array.isArray(questions)) {
    throw new Error('AI không trả về danh sách câu hỏi hợp lệ.');
  }

  // Ensure each question has required fields
  const validated = questions.map((q, index) => {
    if (!q.question || !Array.isArray(q.options) || q.correct === undefined) {
      throw new Error(`Câu hỏi ${index + 1} từ AI không đầy đủ thông tin.`);
    }

    const baseQuestion = {
      id: q.id || `q${index + 1}`,
      type: q.type || 'multiple_choice',
      question: q.question,
      options: q.options,
      correct: q.correct,
      explanation: q.explanation || 'Không có giải thích',
      tags: q.tags || [],
      difficulty: q.difficulty || 'medium'
    };

    // Add reading-specific fields if present
    if (type === 'reading' && q.passage) {
      return {
        ...baseQuestion,
        passage: q.passage,
        vocabulary_used: q.vocabulary_used || [],
        grammar_used: q.grammar_used || []
      };
    }

    return baseQuestion;
  });

  // Check if we have enough questions
  if (validated.length < targetCount) {
    throw new Error(`AI chỉ tạo được ${validated.length}/${targetCount} câu hỏi. Vui lòng thử lại.`);
  }

  return validated.slice(0, targetCount);
}




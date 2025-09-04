import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { GeminiService } from '@/lib/gemini-service-unified';
import { GroqService } from '@/lib/groq-service-unified';
import { CORE_IDENTITY_PROMPT } from '@/lib/prompt-storage';
// Build language instruction from user metadata (server-safe)
function buildLanguageInstruction(aiLanguage: string, customAiLanguage: string): string {
  const map: Record<string, string> = {
    vietnamese: 'Respond in Vietnamese. Use "Cô" (teacher) and "em" (student) naturally.',
    english: 'Respond in English with warm, encouraging teacher tone.',
    japanese: 'Respond in Japanese using appropriate sensei-student honorifics.'
  };

  if (!aiLanguage || aiLanguage === 'auto') {
    return `Respond in the user's language. Adapt cultural communication style naturally.`;
  }
  if (aiLanguage === 'custom' && customAiLanguage?.trim()) {
    return `Respond in ${customAiLanguage.trim()}. Use culturally appropriate teacher-student communication style for ${customAiLanguage.trim()} speakers.`;
  }
  return map[aiLanguage] || `Respond in ${aiLanguage}. Use culturally appropriate teacher-student communication style.`;
}


export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { provider, messages, options, files } = await request.json();

    if (!provider || !messages) {
      return NextResponse.json({ error: 'Missing provider or messages' }, { status: 400 });
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('metadata')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: 'Failed to fetch user data' }, { status: 500 });
    }

    const rawCustomPrompt = userData.metadata?.customPrompt;
    const customPrompt = typeof rawCustomPrompt === 'string'
      ? rawCustomPrompt
      : (rawCustomPrompt?.generatedPrompt || '');

    const aiLanguage = userData.metadata?.aiLanguage || 'auto';
    const customAiLanguage = userData.metadata?.customAiLanguage || '';

    const { data: apiKeyData, error: apiKeyError } = await supabase
      .from('user_api_keys')
      .select('api_key')
      .eq('user_id', user.id)
      .eq('provider', provider)
      .single();

    if (apiKeyError || !apiKeyData) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 });
    }

    const apiKey = apiKeyData.api_key;

    // Check if first message is a system override (for exercise generation)
    const firstMessage = Array.isArray(messages) && messages[0];
    const hasSystemOverride = firstMessage?.role === 'system';
    
    let serverMessages;
    let systemPrompt: string;
    
    if (hasSystemOverride) {
      // Use the provided system message AS-IS (for exercise generation)
      serverMessages = [...messages];
      systemPrompt = firstMessage.content as string;
    } else {
      // Compose per-user system prompt (core + language + user custom + server time context)
      const languageInstruction = buildLanguageInstruction(aiLanguage, customAiLanguage);
      const nowIso = new Date().toISOString();
      const systemTimeContext = `Current server time (ISO): ${nowIso}. When asked "hôm nay ngày mấy" or "what's today", answer using this current date.`;
      systemPrompt = `${CORE_IDENTITY_PROMPT}\n\n${languageInstruction}\n\n${systemTimeContext}${customPrompt ? `\n\n---\n\n${customPrompt}` : ''}`;

      serverMessages = [
        { role: 'system', content: systemPrompt },
        ...(Array.isArray(messages) ? messages : [])
      ];
    }

    if (options?.stream) {
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          const onChunk = (chunk: string) => {
            try {
              controller.enqueue(encoder.encode(chunk));
            } catch (err) {
              // Swallow enqueue errors if stream is already closed
            }
          };

          const abortHandler = () => {
            try { controller.close(); } catch {}
          };
          request.signal.addEventListener('abort', abortHandler);

          try {
            console.log(`[PROXY STREAM] Attempting to stream from ${provider}`);
            if (provider === 'gemini') {
              const geminiService = new GeminiService(apiKey);
              // Handle streaming with or without files
              await geminiService.streamMessage(
                serverMessages as any,
                onChunk,
                { 
                  ...options, 
                  systemPrompt, 
                  abortSignal: request.signal as any,
                  files: files && files.length > 0 ? files : undefined,
                  enableGoogleSearch: options?.enableGoogleSearch,
                  enableTools: options?.enableTools,
                  enableCodeExecution: options?.enableCodeExecution,
                  enableUrlContext: options?.enableUrlContext,
                  enableThinking: options?.enableThinking
                }
              );
            } else if (provider === 'groq') {
              const groqService = new GroqService(apiKey);
              // Groq doesn't support files, so we ignore them
              await groqService.streamMessage(serverMessages as any, onChunk, {
                ...options,
                systemPrompt,
                abortSignal: request.signal as any,
                enableThinking: options?.enableThinking,
                enable_code_interpreter: options?.enable_code_interpreter,
                enable_browser_search: options?.enable_browser_search,
                reasoning_effort: options?.reasoning_effort,
                reasoning_format: options?.reasoning_format
              });
            }
            console.log(`[PROXY STREAM] Stream from ${provider} finished successfully.`);
          } catch (e) {
            console.error(`[PROXY STREAM] Caught error during stream generation for ${provider}:`, e);
            const errorMessage = e instanceof Error ? e.message : 'An unknown streaming error occurred';
            try {
              controller.enqueue(encoder.encode(`STREAM_ERROR: AI_PROXY_PROVIDER_ERROR: ${errorMessage}`));
            } catch {}
          } finally {
            try { controller.close(); } catch {}
            request.signal.removeEventListener('abort', abortHandler);
          }
        },
        cancel() {
          // Ensure closure on client aborts
        }
      });
      return new Response(stream, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-store',
          'Transfer-Encoding': 'chunked'
        },
      });
    } else {
      if (provider === 'gemini') {
        const geminiService = new GeminiService(apiKey);
        const response = await geminiService.sendMessage(serverMessages as any, { 
          ...options, 
          systemPrompt,
          enableGoogleSearch: options?.enableGoogleSearch,
          enableTools: options?.enableTools,
          enableCodeExecution: options?.enableCodeExecution,
          enableUrlContext: options?.enableUrlContext,
          enableThinking: options?.enableThinking
        });
        return NextResponse.json({ response });
      } else if (provider === 'groq') {
        const groqService = new GroqService(apiKey);
        const response = await groqService.sendMessage(serverMessages as any, {
          ...options,
          systemPrompt,
          enableThinking: options?.enableThinking,
          enable_code_interpreter: options?.enable_code_interpreter,
          enable_browser_search: options?.enable_browser_search,
          reasoning_effort: options?.reasoning_effort,
          reasoning_format: options?.reasoning_format
        });
        return NextResponse.json({ response });
      }
    }

    return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
    console.error('[AI PROXY CHAT] Error:', errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}


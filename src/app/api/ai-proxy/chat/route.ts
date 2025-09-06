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
          } catch (e: any) {
            console.error(`[PROXY STREAM] Caught error during stream generation for ${provider}:`, e);

            // Detect rate limits and send a friendly multilingual AI-style message
            const lowerMsg = (e?.message || '').toLowerCase();
            const isGroqRateLimit = e?.status === 429 || e?.statusCode === 429 || lowerMsg.includes('rate limit') || lowerMsg.includes('too many requests');
            const isGeminiRateLimit = e?.status === 429 || e?.statusCode === 429 || lowerMsg.includes('resource_exhausted') || lowerMsg.includes('resource exhausted') || lowerMsg.includes('rate limit');

            // Helper to safely read header value from various shapes
            const getHeader = (headers: any, key: string): string | undefined => {
              if (!headers) return undefined;
              try {
                if (typeof headers.get === 'function') return headers.get(key) || undefined;
              } catch {}
              const entries = typeof headers.entries === 'function' ? Array.from(headers.entries()) : Object.entries(headers);
              const found = entries.find((entry: any) => {
                const [k] = Array.isArray(entry) ? entry : [entry];
                return String(k).toLowerCase() === key.toLowerCase();
              }) as [string, string] | undefined;
              return found ? String(found[1]) : undefined;
            };

            if (provider === 'groq' && isGroqRateLimit) {
              const hdrs = e?.headers || e?.response?.headers;
              const retryAfter = getHeader(hdrs, 'retry-after');
              const resetTokens = getHeader(hdrs, 'x-ratelimit-reset-tokens');
              const waitHint = retryAfter ? `${retryAfter}s` : (resetTokens || 'a moment');
              const msg = `Rate limit reached. Please try again in ${waitHint}.\nĐã vượt giới hạn. Vui lòng thử lại sau ${waitHint}.\nレート制限に達しました。${waitHint}後に再試行してください。`;
              try {
                controller.enqueue(encoder.encode(JSON.stringify({ type: 'content', content: msg }) + '\n'));
                controller.enqueue(encoder.encode(JSON.stringify({ type: 'done' }) + '\n'));
              } catch {}
            } else if (provider === 'gemini' && isGeminiRateLimit) {
              const hdrs = e?.headers || e?.response?.headers;
              const retryAfter = getHeader(hdrs, 'retry-after');
              const waitHint = retryAfter ? `${retryAfter}s` : 'a moment';
              const msg = `Too many requests. Please try again in ${waitHint}.\nQuá nhiều yêu cầu. Vui lòng thử lại sau ${waitHint}.\nリクエストが多すぎます。${waitHint}後にもう一度お試しください。`;
              try {
                controller.enqueue(encoder.encode(JSON.stringify({ type: 'content', content: msg }) + '\n'));
                controller.enqueue(encoder.encode(JSON.stringify({ type: 'done' }) + '\n'));
              } catch {}
            } else if (provider === 'gemini') {
              const status = e?.status || e?.statusCode || e?.response?.status;
              let msg: string | null = null;
              if (status === 403 || lowerMsg.includes('permission_denied')) {
                msg = 'Permission denied. Check API key or access.\nKhông có quyền. Vui lòng kiểm tra API key hoặc quyền truy cập.\n権限がありません。APIキーやアクセス権を確認してください。';
              } else if (status === 400 && (lowerMsg.includes('invalid_argument') || lowerMsg.includes('invalid') || lowerMsg.includes('malformed'))) {
                msg = 'Invalid request. Please check and try again.\nYêu cầu không hợp lệ. Vui lòng kiểm tra và thử lại.\nリクエストが無効です。確認してから再試行してください。';
              } else if (status === 400 && lowerMsg.includes('failed_precondition')) {
                msg = 'Billing required or region unsupported. Enable billing in Google AI Studio.\nCần bật thanh toán hoặc khu vực không hỗ trợ. Hãy bật billing trong Google AI Studio.\n請求の有効化が必要、または地域が未対応です。Google AI Studioで課金を有効にしてください。';
              } else if (status === 404 || lowerMsg.includes('not_found')) {
                msg = 'Resource not found. Please check your inputs.\nKhông tìm thấy tài nguyên. Vui lòng kiểm tra thông tin.\nリソースが見つかりません。入力内容を確認してください。';
              } else if (status === 500 || status === 503 || status === 504 || lowerMsg.includes('internal') || lowerMsg.includes('unavailable') || lowerMsg.includes('deadline_exceeded')) {
                msg = 'Service is busy. Please try again later or switch model.\nDịch vụ đang quá tải. Vui lòng thử lại sau hoặc đổi mô hình.\nサービスが混雑しています。後でもう一度試すか、別のモデルをご利用ください。';
              }
              if (msg) {
                try {
                  controller.enqueue(encoder.encode(JSON.stringify({ type: 'content', content: msg }) + '\n'));
                  controller.enqueue(encoder.encode(JSON.stringify({ type: 'done' }) + '\n'));
                } catch {}
              } else {
                const errorMessage = e instanceof Error ? e.message : 'An unknown streaming error occurred';
                try {
                  controller.enqueue(encoder.encode(JSON.stringify({ type: 'content', content: `Error: ${errorMessage}` }) + '\n'));
                  controller.enqueue(encoder.encode(JSON.stringify({ type: 'done' }) + '\n'));
                } catch {}
              }
            } else {
              const errorMessage = e instanceof Error ? e.message : 'An unknown streaming error occurred';
              try {
                controller.enqueue(encoder.encode(JSON.stringify({ type: 'content', content: `Error: ${errorMessage}` }) + '\n'));
                controller.enqueue(encoder.encode(JSON.stringify({ type: 'done' }) + '\n'));
              } catch {}
            }
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
        try {
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
        } catch (e: any) {
          // Handle Gemini errors gracefully with multilingual AI-style messages
          const lowerMsg = (e?.message || '').toLowerCase();
          const status = e?.status || e?.statusCode || e?.response?.status;

          const getHeader = (headers: any, key: string): string | undefined => {
            if (!headers) return undefined;
            try { if (typeof headers.get === 'function') { const v = headers.get(key); return v != null ? String(v) : undefined; } } catch {}
            let entries: Array<[string, any]> = [];
            try { entries = typeof headers.entries === 'function' ? Array.from(headers.entries()) : Object.entries(headers) as Array<[string, any]>; } catch { entries = Object.entries(headers) as Array<[string, any]>; }
            for (const [k, v] of entries) { if (String(k).toLowerCase() === key.toLowerCase()) return v != null ? String(v) : undefined; }
            return undefined;
          };

          // 429 RESOURCE_EXHAUSTED (rate limit)
          const isRateLimit = status === 429 || lowerMsg.includes('resource_exhausted') || lowerMsg.includes('resource exhausted') || lowerMsg.includes('rate limit');
          if (isRateLimit) {
            const hdrs = e?.headers || e?.response?.headers;
            const retryAfter = getHeader(hdrs, 'retry-after');
            const waitHint = retryAfter ? `${retryAfter}s` : 'a moment';
            const response = `Too many requests. Please try again in ${waitHint}.\nQuá nhiều yêu cầu. Vui lòng thử lại sau ${waitHint}.\nリクエストが多すぎます。${waitHint}後にもう一度お試しください。`;
            return NextResponse.json({ response });
          }

          // 403 PERMISSION_DENIED
          if (status === 403 || lowerMsg.includes('permission_denied')) {
            const response = 'Permission denied. Check API key or access.\nKhông có quyền. Vui lòng kiểm tra API key hoặc quyền truy cập.\n権限がありません。APIキーやアクセス権を確認してください。';
            return NextResponse.json({ response });
          }

          // 400 INVALID_ARGUMENT (malformed) / FAILED_PRECONDITION (billing/region)
          if (status === 400 && (lowerMsg.includes('invalid_argument') || lowerMsg.includes('invalid') || lowerMsg.includes('malformed'))) {
            const response = 'Invalid request. Please check and try again.\nYêu cầu không hợp lệ. Vui lòng kiểm tra và thử lại.\nリクエストが無効です。確認してから再試行してください。';
            return NextResponse.json({ response });
          }
          if (status === 400 && lowerMsg.includes('failed_precondition')) {
            const response = 'Billing required or region unsupported. Enable billing in Google AI Studio.\nCần bật thanh toán hoặc khu vực không hỗ trợ. Hãy bật billing trong Google AI Studio.\n請求の有効化が必要、または地域が未対応です。Google AI Studioで課金を有効にしてください。';
            return NextResponse.json({ response });
          }

          // 404 NOT_FOUND
          if (status === 404 || lowerMsg.includes('not_found')) {
            const response = 'Resource not found. Please check your inputs.\nKhông tìm thấy tài nguyên. Vui lòng kiểm tra thông tin.\nリソースが見つかりません。入力内容を確認してください。';
            return NextResponse.json({ response });
          }

          // 500/503/504 and similar (INTERNAL/UNAVAILABLE/DEADLINE_EXCEEDED)
          if (status === 500 || status === 503 || status === 504 || lowerMsg.includes('internal') || lowerMsg.includes('unavailable') || lowerMsg.includes('deadline_exceeded')) {
            const response = 'Service is busy. Please try again later or switch model.\nDịch vụ đang quá tải. Vui lòng thử lại sau hoặc đổi mô hình.\nサービスが混雑しています。後でもう一度試すか、別のモデルをご利用ください。';
            return NextResponse.json({ response });
          }

          // Fallback: rethrow to preserve original error handling
          throw e;
        }
      } else if (provider === 'groq') {
        const groqService = new GroqService(apiKey);
        try {
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
        } catch (e: any) {
          // Gracefully handle Groq rate limits by returning an AI-style message
          const lowerMsg = (e?.message || '').toLowerCase();
          const isRateLimit = e?.status === 429 || e?.statusCode === 429 || lowerMsg.includes('rate limit') || lowerMsg.includes('too many requests');
          if (isRateLimit) {
            const getHeader = (headers: any, key: string): string | undefined => {
              if (!headers) return undefined;
              try { if (typeof headers.get === 'function') return headers.get(key) || undefined; } catch {}
              const entries = typeof headers.entries === 'function' ? Array.from(headers.entries()) : Object.entries(headers);
              const found = entries.find((entry: any) => {
                const [k] = Array.isArray(entry) ? entry : [entry];
                return String(k).toLowerCase() === key.toLowerCase();
              }) as [string, string] | undefined;
              return found ? String(found[1]) : undefined;
            };
            const hdrs = e?.headers || e?.response?.headers;
            const retryAfter = getHeader(hdrs, 'retry-after');
            const resetTokens = getHeader(hdrs, 'x-ratelimit-reset-tokens');
            const waitHint = retryAfter ? `${retryAfter}s` : (resetTokens || 'a moment');
            const response = `Rate limit reached. Please try again in ${waitHint}.\nĐã vượt giới hạn. Vui lòng thử lại sau ${waitHint}.\nレート制限に達しました。${waitHint}後に再試行してください。`;
            return NextResponse.json({ response });
          }
          throw e;
        }
      }
    }

    return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
    console.error('[AI PROXY CHAT] Error:', errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}


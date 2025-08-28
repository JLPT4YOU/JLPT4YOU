/**
 * Next.js API Route for Gemini Chat
 * Handles both regular and streaming chat requests
 */

import { NextRequest, NextResponse } from 'next/server';
import { getGeminiService } from '@/lib/gemini-service';
import { createAIMessage } from '@/lib/ai-shared-utils';
import { supabaseAdmin } from '@/utils/supabase/admin';
import { decrypt } from '@/lib/crypto-utils';

const SECRET = process.env.APP_ENCRYPT_SECRET || '';

function getAccessToken(req: NextRequest): string | null {
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.replace('Bearer ', '').trim();
  }
  const cookieToken = req.cookies.get('sb-access-token')?.value;
  return cookieToken || null;
}

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user and decrypt API key on the server
    const accessToken = getAccessToken(request);
    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized: No access token' }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(accessToken);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
    }

    const { data: row, error: dbError } = await (supabaseAdmin as any)
      .from('user_api_keys')
      .select('key_encrypted')
      .eq('user_id', user.id)
      .eq('provider', 'gemini')
      .single();

    if (dbError || !row) {
      return NextResponse.json({ error: 'Gemini API key not found for user.' }, { status: 404 });
    }

    if (!SECRET) {
      console.error('APP_ENCRYPT_SECRET is not configured on the server.');
      return NextResponse.json({ error: 'Server encryption secret not configured.' }, { status: 500 });
    }

    let decryptedKey: string;
    try {
      decryptedKey = decrypt(row.key_encrypted, SECRET);
    } catch (e) {
      console.error('API key decryption failed:', e);
      return NextResponse.json({ error: 'API key decryption failed on the server.' }, { status: 500 });
    }

    if (!decryptedKey) {
      return NextResponse.json({ error: 'Decrypted key is empty or invalid.' }, { status: 500 });
    }

    // 2. Process the chat request using the decrypted key
    const body = await request.json();
    const {
      messages,
      model,
      temperature,
      enableThinking,
      enableTools,
      stream = false,
      files = []
    } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages array is required' }, { status: 400 });
    }

    // Initialize service with the decrypted user key for this request only
    const geminiService = getGeminiService(decryptedKey);

    // 3. Handle streaming or regular requests
    if (stream) {
      const encoder = new TextEncoder();
      const readableStream = new ReadableStream({
        async start(controller) {
          const send = (data: object) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));

          try {
            if (enableThinking) {
              await geminiService.streamMessageWithFilesAndThinking!(
                messages,
                files,
                (thoughtChunk: string) => send({ type: 'thought', content: thoughtChunk }),
                (answerChunk: string) => send({ type: 'answer', content: answerChunk }),
                { model, temperature, enableTools }
              );
            } else {
              await geminiService.streamMessageWithFiles!(
                messages,
                files,
                (chunk: string) => send({ type: 'answer', content: chunk }),
                { model, temperature, enableTools }
              );
            }
            send({ done: true });
            controller.close();
          } catch (error) {
            send({ error: error instanceof Error ? error.message : 'Unknown streaming error' });
            controller.close();
          }
        },
      });

      return new Response(readableStream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // Handle regular (non-streaming) requests
    let response: string;
    if (files && files.length > 0) {
      response = await geminiService.sendMessageWithFiles(
        messages,
        files,
        { model, temperature, enableThinking, enableTools }
      );
    } else {
      response = await geminiService.sendMessage(
        messages,
        { model, temperature, enableThinking, enableTools }
      );
    }

    return NextResponse.json({
      message: createAIMessage(response, 'assistant'),
      model: model || geminiService.getDefaultModel()
    });

  } catch (error) {
    console.error('Gemini API route error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    const geminiService = getGeminiService();

    switch (action) {
      case 'models':
        return NextResponse.json({
          models: geminiService.getAvailableModels(),
          defaultModel: geminiService.getDefaultModel()
        });

      case 'validate':
        const apiKey = searchParams.get('apiKey');
        if (!apiKey) {
          return NextResponse.json(
            { error: 'API key is required for validation' },
            { status: 400 }
          );
        }
        
        const isValid = await geminiService.validateApiKey(apiKey);
        return NextResponse.json({ valid: isValid });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported actions: models, validate' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Gemini API GET error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

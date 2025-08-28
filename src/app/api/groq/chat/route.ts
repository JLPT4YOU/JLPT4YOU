/**
 * Next.js API Route for Groq Chat
 * Handles both regular and streaming chat requests with advanced features
 */

import { NextRequest, NextResponse } from 'next/server';
import { getGroqService } from '@/lib/groq-service';
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
      .eq('provider', 'groq')
      .single();

    if (dbError || !row) {
      return NextResponse.json({ error: 'Groq API key not found for user.' }, { status: 404 });
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
      topP,
      stop,
      stream = false,
      reasoning_effort,
      reasoning_format,
      enable_code_interpreter,
      enable_browser_search
    } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages array is required' }, { status: 400 });
    }

    const groqService = getGroqService(decryptedKey);

    const options = {
      model,
      temperature,
      topP,
      stop,
      reasoning_effort,
      reasoning_format,
      enable_code_interpreter,
      enable_browser_search
    };

    // 3. Handle streaming or regular requests
    if (stream) {
      const encoder = new TextEncoder();
      const readableStream = new ReadableStream({
        async start(controller) {
          try {
            await groqService.streamMessage(
              messages,
              (chunk: string) => {
                const data = `data: ${JSON.stringify({ content: chunk })}\n\n`;
                controller.enqueue(encoder.encode(data));
              },
              options
            );
            const doneData = `data: ${JSON.stringify({ done: true })}\n\n`;
            controller.enqueue(encoder.encode(doneData));
            controller.close();
          } catch (error) {
            const errorData = `data: ${JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown streaming error' })}\n\n`;
            controller.enqueue(encoder.encode(errorData));
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

    // Handle regular requests
    if (groqService.modelSupportsAdvancedFeatures(model || groqService.getDefaultModel())) {
      const advancedResponse = await groqService.sendAdvancedMessage(messages, options);
      return NextResponse.json({
        message: createAIMessage(advancedResponse.content, 'assistant'),
        reasoning: advancedResponse.reasoning,
        executed_tools: advancedResponse.executed_tools,
        model: model || groqService.getDefaultModel(),
        advanced_features: true
      });
    } else {
      const response = await groqService.sendMessage(messages, options);
      return NextResponse.json({
        message: createAIMessage(response, 'assistant'),
        model: model || groqService.getDefaultModel(),
        advanced_features: false
      });
    }

  } catch (error) {
    console.error('Groq API route error:', error);
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

    const groqService = getGroqService();

    switch (action) {
      case 'models':
        return NextResponse.json({
          models: groqService.getAvailableModels(),
          defaultModel: groqService.getDefaultModel(),
          reasoningModels: groqService.getReasoningModels(),
          toolsModels: groqService.getToolsModels()
        });

      case 'validate':
        const apiKey = searchParams.get('apiKey');
        if (!apiKey) {
          return NextResponse.json(
            { error: 'API key is required for validation' },
            { status: 400 }
          );
        }
        
        const isValid = await groqService.validateApiKey(apiKey);
        return NextResponse.json({ valid: isValid });

      case 'features':
        const model = searchParams.get('model');
        if (!model) {
          return NextResponse.json(
            { error: 'Model parameter is required' },
            { status: 400 }
          );
        }
        
        return NextResponse.json({
          model,
          supportsAdvancedFeatures: groqService.modelSupportsAdvancedFeatures(model)
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported actions: models, validate, features' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Groq API GET error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

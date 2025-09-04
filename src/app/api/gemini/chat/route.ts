/**
 * Next.js API Route for Gemini Chat
 * Handles both regular and streaming chat requests
 */

import { NextRequest, NextResponse } from 'next/server';
import { getGeminiService } from '@/lib/gemini-service-unified';
import { createAIMessage } from '@/lib/ai-shared-utils';

export async function POST(request: NextRequest) {
  try {
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
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    const geminiService = getGeminiService();
    
    // Handle streaming requests
    if (stream) {
      const encoder = new TextEncoder();
      
      const stream = new ReadableStream({
        async start(controller) {
          try {
            await geminiService.streamMessage(
              messages,
              (chunk: string) => {
                const data = `data: ${JSON.stringify({ content: chunk })}\n\n`;
                controller.enqueue(encoder.encode(data));
              },
              { model, temperature, enableThinking, enableTools }
            );
            
            // Send completion signal
            const doneData = `data: ${JSON.stringify({ done: true })}\n\n`;
            controller.enqueue(encoder.encode(doneData));
            controller.close();
          } catch (error) {
            const errorData = `data: ${JSON.stringify({ 
              error: error instanceof Error ? error.message : 'Unknown error' 
            })}\n\n`;
            controller.enqueue(encoder.encode(errorData));
            controller.close();
          }
        },
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // Handle regular requests
    // Note: Client-side GeminiService doesn't support file uploads
    // File uploads should be handled through the server-side API
    const response = await geminiService.sendMessage(
      messages,
      { model, temperature, enableThinking, enableTools }
    );

    return NextResponse.json({ 
      message: createAIMessage(response, 'assistant'),
      model: model || geminiService.getDefaultModel()
    });

  } catch (error) {
    console.error('Gemini API route error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error : undefined
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

/**
 * Next.js API Route for Groq Chat
 * Handles both regular and streaming chat requests with advanced features
 */

import { NextRequest, NextResponse } from 'next/server';
import { getGroqService } from '@/lib/groq-service-unified';
import { createAIMessage } from '@/lib/ai-shared-utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      messages, 
      model, 
      temperature,
      topP,
      stop,
      stream = false,
      // Advanced features for GPT-OSS models
      reasoning_effort,
      reasoning_format,
      enable_code_interpreter,
      enable_browser_search
    } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    const groqService = getGroqService();
    
    // Build options with advanced features
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

    // Handle streaming requests
    if (stream) {
      const encoder = new TextEncoder();
      
      const stream = new ReadableStream({
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
    let response: string;
    
    // Use regular message method (client-side GroqService doesn't have advanced features)
    response = await groqService.sendMessage(messages, options);
    
    return NextResponse.json({ 
      message: createAIMessage(response, 'assistant'),
      model: model || groqService.getDefaultModel(),
      advanced_features: false
    });

  } catch (error) {
    console.error('Groq API route error:', error);
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
        
        const reasoningModels = groqService.getReasoningModels();
        const supportsAdvanced = reasoningModels.some(m => m.id === model);
        
        return NextResponse.json({
          model,
          supportsAdvancedFeatures: supportsAdvanced
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

/**
 * Next.js API Route for Groq Advanced Features
 * Dedicated endpoint for GPT-OSS models with reasoning and tools
 */

import { NextRequest, NextResponse } from 'next/server';
import { getGroqService } from '@/lib/groq-service';
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
      reasoning_effort = 'medium',
      reasoning_format = 'parsed',
      enable_code_interpreter = false,
      enable_browser_search = false,
      stream = false
    } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    const groqService = getGroqService();
    const targetModel = model || groqService.getDefaultModel();
    
    // Validate that model supports advanced features
    if (!groqService.modelSupportsAdvancedFeatures(targetModel)) {
      return NextResponse.json(
        { 
          error: `Model ${targetModel} does not support advanced features. Use GPT-OSS models instead.`,
          supportedModels: groqService.getReasoningModels().map(m => m.id)
        },
        { status: 400 }
      );
    }

    // Build advanced options
    const options = {
      model: targetModel,
      temperature,
      topP,
      stop,
      reasoning_effort,
      reasoning_format,
      enable_code_interpreter,
      enable_browser_search
    };

    // Handle streaming requests with advanced features
    if (stream) {
      const encoder = new TextEncoder();
      
      const stream = new ReadableStream({
        async start(controller) {
          try {
            // For streaming, we'll use regular streaming but with advanced config
            await groqService.streamMessage(
              messages,
              (chunk: string) => {
                const data = `data: ${JSON.stringify({ 
                  content: chunk,
                  type: 'content'
                })}\n\n`;
                controller.enqueue(encoder.encode(data));
              },
              options
            );
            
            // Send completion signal
            const doneData = `data: ${JSON.stringify({ 
              done: true,
              type: 'complete'
            })}\n\n`;
            controller.enqueue(encoder.encode(doneData));
            controller.close();
          } catch (error) {
            const errorData = `data: ${JSON.stringify({ 
              error: error instanceof Error ? error.message : 'Unknown error',
              type: 'error'
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

    // Handle non-streaming advanced requests
    const advancedResponse = await groqService.sendAdvancedMessage(messages, options);
    
    return NextResponse.json({ 
      message: createAIMessage(advancedResponse.content, 'assistant'),
      reasoning: advancedResponse.reasoning,
      executed_tools: advancedResponse.executed_tools,
      model: targetModel,
      advanced_features: {
        reasoning_effort,
        reasoning_format,
        code_interpreter_enabled: enable_code_interpreter,
        browser_search_enabled: enable_browser_search
      }
    });

  } catch (error) {
    console.error('Groq Advanced API route error:', error);
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
      case 'supported-models':
        return NextResponse.json({
          reasoning_models: groqService.getReasoningModels(),
          tools_models: groqService.getToolsModels(),
          default_model: groqService.getDefaultModel()
        });

      case 'reasoning-options':
        return NextResponse.json({
          reasoning_efforts: ['low', 'medium', 'high'],
          reasoning_formats: ['parsed', 'raw', 'hidden'],
          default_effort: 'medium',
          default_format: 'parsed'
        });

      case 'tools-options':
        return NextResponse.json({
          available_tools: [
            {
              type: 'code_interpreter',
              description: 'Execute Python code and return results'
            },
            {
              type: 'browser_search',
              description: 'Search the web for current information'
            }
          ]
        });

      case 'model-capabilities':
        const model = searchParams.get('model');
        if (!model) {
          return NextResponse.json(
            { error: 'Model parameter is required' },
            { status: 400 }
          );
        }
        
        const modelInfo = groqService.getAvailableModels().find(m => m.id === model);
        if (!modelInfo) {
          return NextResponse.json(
            { error: 'Model not found' },
            { status: 404 }
          );
        }

        return NextResponse.json({
          model: model,
          supports_reasoning: (modelInfo as any).supportsReasoning || false,
          supports_tools: (modelInfo as any).supportsTools || false,
          supports_streaming: modelInfo.supportsStreaming,
          category: (modelInfo as any).category || 'text'
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported actions: supported-models, reasoning-options, tools-options, model-capabilities' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Groq Advanced API GET error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

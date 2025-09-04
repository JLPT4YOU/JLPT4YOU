import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { GeminiService } from '@/lib/gemini-service-unified';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userInput = await request.json();

    // Fetch Gemini API key from the database
    const { data: apiKeyData, error: apiKeyError } = await supabase
      .from('user_api_keys')
      .select('api_key')
      .eq('user_id', user.id)
      .eq('provider', 'gemini')
      .single();

    if (apiKeyError || !apiKeyData) {
      return NextResponse.json({ error: 'Gemini API key not found for prompt generation' }, { status: 404 });
    }

    const geminiApiKey = apiKeyData.api_key;
    const geminiService = new GeminiService(geminiApiKey);

    // Build generation prompt from inputs safely
    const preferredName = (userInput?.preferredName || '').toString().slice(0, 100);
    const desiredTraits = (userInput?.desiredTraits || '').toString().slice(0, 500);
    const personalInfo = (userInput?.personalInfo || '').toString().slice(0, 800);
    const additionalRequests = (userInput?.additionalRequests || '').toString().slice(0, 500);

    const generationPrompt = `You are a professional Prompt Engineer. Create a personalized communication prompt for an AI assistant.

Here is what the user wants:

1. "Please call me: ${preferredName}"
2. "I want you to have these characteristics: ${desiredTraits}"
3. "I want you to know about me: ${personalInfo}"
4. "I want you to pay attention to: ${additionalRequests}"

REQUIREMENTS:
- DO NOT mention AI identity or name (avoid "you are", "your name is")
- Focus on communication style and user preferences
- Maximum 250 words
- Use clear, direct instructions
- Structure it as guidance for how to communicate with this specific user

Return ONLY the final prompt text.`;

    const messages = [{ role: 'user', content: generationPrompt }];

    // Important: do NOT pass systemPrompt option here
    const generatedPrompt = await geminiService.sendMessage(messages as any, { model: 'gemini-1.5-flash-latest' });

    return NextResponse.json({ generatedPrompt });

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
    console.error('[GENERATE PROMPT API] Error:', errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}


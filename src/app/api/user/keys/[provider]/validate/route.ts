import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;
  
  try {
    const body = await request.json();
    const { apiKey } = body;

    if (!apiKey) {
      return NextResponse.json({ valid: false, error: 'API key is required' }, { status: 400 });
    }

    let valid = false;

    switch (provider) {
      case 'gemini': {
        try {
          // Dynamic import to avoid client-side bundle issues
          const { GoogleGenAI } = require('@google/genai');
          const genAI = new GoogleGenAI({ apiKey });
          
          // Make a minimal test request
          const result = await genAI.models.generateContent({
            model: 'gemini-1.5-flash',
            contents: [{ role: 'user', parts: [{ text: 'Test' }] }]
          });
          
          // Nếu có response thì API key hợp lệ
          if (result.text) {
            valid = true;
          }
        } catch (error: any) {
          console.error('Gemini validation error:', error?.message || error);
          // Check for specific error messages
          if (error?.message?.includes('API_KEY_INVALID')) {
            return NextResponse.json({ valid: false, error: 'Invalid API key' });
          }
        }
        break;
      }

      case 'groq': {
        try {
          // Test Groq API key
          const response = await fetch('https://api.groq.com/openai/v1/models', {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            }
          });

          valid = response.ok;
          
          if (!valid && response.status === 401) {
            return NextResponse.json({ valid: false, error: 'Invalid API key' });
          }
        } catch (error) {
          console.error('Groq validation error:', error);
        }
        break;
      }

      default:
        return NextResponse.json({ valid: false, error: 'Invalid provider' }, { status: 400 });
    }

    return NextResponse.json({ valid });

  } catch (error) {
    console.error(`API key validation error for ${provider}:`, error);
    return NextResponse.json({ 
      valid: false, 
      error: 'Failed to validate API key' 
    }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'

export async function POST(request: NextRequest) {
  try {
    const { apiKey } = await request.json()

    if (!apiKey || typeof apiKey !== 'string') {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 400 }
      )
    }

    // Test the API key with a simple request
    const genAI = new GoogleGenAI({ apiKey })

    // Make a minimal test request
    const result = await genAI.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: [{ role: 'user', parts: [{ text: 'Test' }] }]
    })

    if (result.text) {
      return NextResponse.json({ valid: true })
    } else {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      )
    }
  } catch (error: any) {
    console.error('API key validation error:', error)
    
    // Handle specific Gemini API errors
    if (error.message?.includes('API_KEY_INVALID')) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      )
    }
    
    if (error.message?.includes('PERMISSION_DENIED')) {
      return NextResponse.json(
        { error: 'API key does not have permission' },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to validate API key' },
      { status: 500 }
    )
  }
}

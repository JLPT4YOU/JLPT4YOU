/**
 * Next.js API Route - Proxy for Google Translate
 * Handles CORS issues for Safari browser
 */

import { NextRequest, NextResponse } from 'next/server';

// Proxy configuration
const PROXY_CONFIG = {
  baseUrl: 'https://translate.googleapis.com/translate_a/single',
  timeout: 10000,
  userAgents: [
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  ]
};

// Handle OPTIONS for CORS preflight
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, source_lang = 'auto', target_lang = 'vi', method = 'mazii' } = body;

    if (!text) {
      return NextResponse.json(
        { success: false, error: 'Missing text parameter' },
        { status: 400 }
      );
    }

    // Build Google Translate parameters
    const params = new URLSearchParams({
      client: 'gtx',
      sl: source_lang,
      tl: target_lang,
      q: text,
    });

    // Add dt parameters based on method
    if (method === 'jdict') {
      ['t', 'bd', 'ex', 'ld', 'md', 'qca', 'rw', 'rm', 'ss', 'at'].forEach(dt => {
        params.append('dt', dt);
      });
      params.append('dj', '1');
    } else {
      params.append('dt', 't');
    }

    // Select random user agent
    const userAgent = PROXY_CONFIG.userAgents[Math.floor(Math.random() * PROXY_CONFIG.userAgents.length)];
    
    // Set referer based on method
    const referer = method === 'jdict' ? 'https://jdict.net/' : 'https://mazii.net/';

    // Make request to Google Translate
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), PROXY_CONFIG.timeout);

    try {
      const response = await fetch(`${PROXY_CONFIG.baseUrl}?${params.toString()}`, {
        method: 'GET',
        headers: {
          'User-Agent': userAgent,
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'vi-VN,vi;q=0.9,en;q=0.8,ja;q=0.7',
          'Accept-Encoding': 'gzip, deflate, br',
          'Referer': referer,
          'Origin': referer.replace(/\/$/, ''),
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Google Translate API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Parse response based on method
      let translatedText = '';
      let sourceDetected = source_lang;
      let confidence = 1.0;

      if (method === 'jdict' && data.sentences) {
        translatedText = data.sentences[0]?.trans || '';
        sourceDetected = data.src || source_lang;
        confidence = data.confidence || 0;
      } else if (data && Array.isArray(data) && data[0]) {
        // Mazii method response format
        if (Array.isArray(data[0]) && data[0][0]) {
          translatedText = data[0][0][0] || '';
        }
        sourceDetected = data[2] || source_lang;
      }

      return NextResponse.json({
        success: true,
        translated_text: translatedText,
        source_language: sourceDetected,
        target_language: target_lang,
        confidence: confidence,
        method: method,
        original_text: text
      }, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=3600',
        }
      });

    } catch (error: any) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        return NextResponse.json(
          { success: false, error: 'Request timeout' },
          { status: 408 }
        );
      }
      throw error;
    }

  } catch (error: any) {
    console.error('Translation proxy error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Translation failed',
        original_text: body?.text 
      },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
        }
      }
    );
  }
}

// Handle GET requests (for testing)
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'healthy',
    service: 'Next.js Translation Proxy',
    message: 'Use POST method to translate text',
    endpoints: {
      translate: '/api/translate-proxy',
      method: 'POST',
      params: {
        text: 'Text to translate (required)',
        source_lang: 'Source language code (optional, default: auto)',
        target_lang: 'Target language code (optional, default: vi)',
        method: 'Translation method: mazii or jdict (optional, default: mazii)'
      }
    }
  }, {
    headers: {
      'Access-Control-Allow-Origin': '*',
    }
  });
}

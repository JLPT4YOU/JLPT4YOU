import { NextRequest, NextResponse } from 'next/server';

export interface TranslationResult {
  translatedText: string;
  originalText: string;
  sourceLanguage: string;
  targetLanguage: string;
  confidence?: number;
  romanization?: string;
  alternatives?: any[];
  service: string;
  timestamp: number;
}

class ServerTranslateService {
  private cache = new Map<string, TranslationResult>();
  private readonly cacheExpiry = 5 * 60 * 1000; // 5 minutes

  async translate(
    text: string,
    sourceLanguage: string = 'auto',
    targetLanguage: string = 'vi'
  ): Promise<TranslationResult> {
    if (!text.trim()) {
      throw new Error('Text to translate cannot be empty');
    }

    // Check cache first
    const cacheKey = `${text}-${sourceLanguage}-${targetLanguage}`;
    const cached = this.cache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < this.cacheExpiry) {
      return cached;
    }

    // Try multiple translation methods
    const methods = [
      () => this.translateWithLibreTranslate(text, sourceLanguage, targetLanguage),
      () => this.translateWithMyMemory(text, sourceLanguage, targetLanguage),
      () => this.translateWithGoogleProxy(text, sourceLanguage, targetLanguage),
      () => this.translateWithBingProxy(text, sourceLanguage, targetLanguage),
    ];

    for (const method of methods) {
      try {
        const result = await method();
        if (result && result.translatedText !== text) {
          // Cache successful result
          this.cache.set(cacheKey, result);
          return result;
        }
      } catch (error) {
        console.warn('Translation method failed:', error);
        continue;
      }
    }

    // Fallback: return original text
    return {
      translatedText: text,
      originalText: text,
      sourceLanguage,
      targetLanguage,
      service: 'Fallback',
      timestamp: Date.now(),
      confidence: 0
    };
  }

  private async translateWithLibreTranslate(
    text: string,
    sourceLanguage: string,
    targetLanguage: string
  ): Promise<TranslationResult> {
    // LibreTranslate - Free and open source
    const url = 'https://libretranslate.de/translate';
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; JLPT4YOU/1.0)',
      },
      body: JSON.stringify({
        q: text,
        source: sourceLanguage === 'auto' ? 'auto' : this.mapLanguageCode(sourceLanguage),
        target: this.mapLanguageCode(targetLanguage),
        format: 'text'
      }),
    });

    if (!response.ok) {
      throw new Error(`LibreTranslate failed: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      translatedText: data.translatedText || text,
      originalText: text,
      sourceLanguage: data.detectedLanguage?.language || sourceLanguage,
      targetLanguage,
      service: 'LibreTranslate',
      timestamp: Date.now(),
      confidence: data.detectedLanguage?.confidence || 0.8
    };
  }

  private async translateWithMyMemory(
    text: string,
    sourceLanguage: string,
    targetLanguage: string
  ): Promise<TranslationResult> {
    // MyMemory - Free translation API
    const langPair = `${this.mapLanguageCode(sourceLanguage)}|${this.mapLanguageCode(targetLanguage)}`;
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langPair}`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; JLPT4YOU/1.0)',
      },
    });

    if (!response.ok) {
      throw new Error(`MyMemory failed: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.responseStatus !== 200) {
      throw new Error(`MyMemory API error: ${data.responseStatus}`);
    }

    return {
      translatedText: data.responseData.translatedText || text,
      originalText: text,
      sourceLanguage: sourceLanguage,
      targetLanguage,
      service: 'MyMemory',
      timestamp: Date.now(),
      confidence: parseFloat(data.responseData.match) || 0.7
    };
  }

  private async translateWithGoogleProxy(
    text: string,
    sourceLanguage: string,
    targetLanguage: string
  ): Promise<TranslationResult> {
    // Use a different approach with server-side request
    const params = new URLSearchParams({
      client: 'gtx',
      sl: sourceLanguage,
      tl: targetLanguage,
      dt: 't',
      q: text,
    });

    const endpoints = [
      'https://translate.googleapis.com/translate_a/single',
      'https://clients5.google.com/translate_a/single',
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${endpoint}?${params.toString()}`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': '*/*',
            'Accept-Language': 'en-US,en;q=0.9',
          },
        });

        if (!response.ok) continue;

        const data = await response.json();
        
        if (data && data[0] && data[0][0] && data[0][0][0]) {
          return {
            translatedText: data[0][0][0],
            originalText: text,
            sourceLanguage: data[2] || sourceLanguage,
            targetLanguage,
            service: 'Google (Server)',
            timestamp: Date.now(),
            confidence: 0.9
          };
        }
      } catch (error) {
        continue;
      }
    }

    throw new Error('Google proxy translation failed');
  }

  private async translateWithBingProxy(
    text: string,
    sourceLanguage: string,
    targetLanguage: string
  ): Promise<TranslationResult> {
    // Bing Translator (simplified approach)
    const url = 'https://www.bing.com/ttranslatev3';
    
    const formData = new URLSearchParams({
      fromLang: this.mapLanguageCodeForBing(sourceLanguage),
      toLang: this.mapLanguageCodeForBing(targetLanguage),
      text: text,
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://www.bing.com/translator',
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Bing failed: ${response.status}`);
    }

    const data = await response.json();
    
    if (data && data[0] && data[0].translations && data[0].translations[0]) {
      return {
        translatedText: data[0].translations[0].text,
        originalText: text,
        sourceLanguage: data[0].detectedLanguage?.language || sourceLanguage,
        targetLanguage,
        service: 'Bing',
        timestamp: Date.now(),
        confidence: data[0].detectedLanguage?.score || 0.8
      };
    }

    throw new Error('Bing translation parsing failed');
  }

  private mapLanguageCode(code: string): string {
    const mapping: Record<string, string> = {
      'ja': 'ja',
      'vi': 'vi', 
      'en': 'en',
      'ko': 'ko',
      'zh': 'zh',
      'th': 'th',
      'auto': 'auto'
    };
    return mapping[code] || code;
  }

  private mapLanguageCodeForBing(code: string): string {
    const mapping: Record<string, string> = {
      'ja': 'ja',
      'vi': 'vi',
      'en': 'en',
      'ko': 'ko',
      'zh': 'zh-Hans',
      'th': 'th',
      'auto': 'auto-detect'
    };
    return mapping[code] || code;
  }
}

const serverTranslateService = new ServerTranslateService();

export async function POST(request: NextRequest) {
  try {
    const { text, sourceLanguage = 'auto', targetLanguage = 'vi' } = await request.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text parameter is required' },
        { status: 400 }
      );
    }

    const result = await serverTranslateService.translate(text, sourceLanguage, targetLanguage);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Translation API error:', error);
    return NextResponse.json(
      { error: 'Translation failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const text = searchParams.get('text');
  const sourceLanguage = searchParams.get('sl') || 'auto';
  const targetLanguage = searchParams.get('tl') || 'vi';

  if (!text) {
    return NextResponse.json(
      { error: 'Text parameter is required' },
      { status: 400 }
    );
  }

  try {
    const result = await serverTranslateService.translate(text, sourceLanguage, targetLanguage);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Translation API error:', error);
    return NextResponse.json(
      { error: 'Translation failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

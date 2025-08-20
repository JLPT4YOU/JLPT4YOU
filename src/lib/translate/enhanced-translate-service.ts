/**
 * Enhanced Translation Service
 * Combines Google Translate with alternative services and fallback options
 * Optimized for Japanese-Vietnamese translation in JLPT4YOU
 */

export interface TranslationResult {
  translatedText: string;
  originalText: string;
  sourceLanguage: string;
  targetLanguage: string;
  confidence?: number;
  romanization?: string;
  alternatives?: AlternativeTranslation[];
  service: string;
  timestamp: number;
}

export interface AlternativeTranslation {
  src_phrase: string;
  alternative: Array<{
    word_postproc: string;
    score: number;
  }>;
}

export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
}

// Enhanced language support for JLPT4YOU
export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt' },
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย' },
];

class EnhancedTranslateService {
  private readonly googleBaseUrl = 'https://translate.googleapis.com/translate_a/single';
  private readonly defaultParams = {
    client: 'gtx',
    dt: ['t', 'bd', 'ex', 'ld', 'md', 'qca', 'rw', 'rm', 'ss', 'at'],
    dj: '1'
  };

  // Cache for translations to improve performance
  private cache = new Map<string, TranslationResult>();
  private readonly cacheExpiry = 5 * 60 * 1000; // 5 minutes

  /**
   * Primary translation method with enhanced features
   */
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

    try {
      // Try Google Translate first (most reliable)
      const result = await this.translateWithGoogle(text, sourceLanguage, targetLanguage);
      
      // Cache the result
      this.cache.set(cacheKey, result);
      
      return result;
    } catch (error) {
      console.error('Google Translate failed:', error);
      
      // Fallback to alternative methods
      return await this.translateWithFallback(text, sourceLanguage, targetLanguage);
    }
  }

  /**
   * Google Translate implementation (enhanced version of existing)
   */
  private async translateWithGoogle(
    text: string,
    sourceLanguage: string,
    targetLanguage: string
  ): Promise<TranslationResult> {
    const url = this.buildGoogleUrl(text, sourceLanguage, targetLanguage);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9,ja;q=0.8,vi;q=0.7',
        'Referer': 'https://translate.google.com/',
      },
    });

    if (!response.ok) {
      throw new Error(`Google Translate failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return this.parseGoogleResponse(data, text, sourceLanguage, targetLanguage);
  }

  /**
   * Fallback translation methods
   */
  private async translateWithFallback(
    text: string,
    sourceLanguage: string,
    targetLanguage: string
  ): Promise<TranslationResult> {
    // Try alternative Google endpoints
    const alternativeEndpoints = [
      'https://translate.google.com/translate_a/single',
      'https://clients5.google.com/translate_a/single',
    ];

    for (const endpoint of alternativeEndpoints) {
      try {
        const result = await this.tryAlternativeGoogleEndpoint(
          endpoint, text, sourceLanguage, targetLanguage
        );
        if (result) return result;
      } catch (error) {
        console.warn(`Alternative endpoint ${endpoint} failed:`, error);
      }
    }

    // If all else fails, return a basic result
    return {
      translatedText: text, // Return original text as fallback
      originalText: text,
      sourceLanguage,
      targetLanguage,
      service: 'Fallback',
      timestamp: Date.now(),
      confidence: 0
    };
  }

  /**
   * Try alternative Google Translate endpoints
   */
  private async tryAlternativeGoogleEndpoint(
    baseUrl: string,
    text: string,
    sourceLanguage: string,
    targetLanguage: string
  ): Promise<TranslationResult | null> {
    const params = new URLSearchParams({
      client: 'gtx',
      sl: sourceLanguage,
      tl: targetLanguage,
      dj: '1',
      q: text,
    });

    this.defaultParams.dt.forEach(dt => {
      params.append('dt', dt);
    });

    const url = `${baseUrl}?${params.toString()}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return this.parseGoogleResponse(data, text, sourceLanguage, targetLanguage);
  }

  /**
   * Build Google Translate URL
   */
  private buildGoogleUrl(text: string, sourceLanguage: string, targetLanguage: string): string {
    const params = new URLSearchParams({
      client: this.defaultParams.client,
      sl: sourceLanguage,
      tl: targetLanguage,
      dj: this.defaultParams.dj,
      q: text,
    });

    this.defaultParams.dt.forEach(dt => {
      params.append('dt', dt);
    });

    return `${this.googleBaseUrl}?${params.toString()}`;
  }

  /**
   * Parse Google Translate response
   */
  private parseGoogleResponse(
    data: any,
    originalText: string,
    sourceLanguage: string,
    targetLanguage: string
  ): TranslationResult {
    const result: TranslationResult = {
      originalText,
      sourceLanguage: data.src || sourceLanguage,
      targetLanguage,
      translatedText: '',
      alternatives: [],
      service: 'Google Translate',
      timestamp: Date.now(),
    };

    // Parse main translation
    if (data.sentences && data.sentences.length > 0) {
      result.translatedText = data.sentences
        .filter((sentence: any) => sentence.trans)
        .map((sentence: any) => sentence.trans)
        .join('');

      // Get romanization if available (useful for Japanese)
      const romanizationSentence = data.sentences.find((s: any) => s.src_translit);
      if (romanizationSentence) {
        result.romanization = romanizationSentence.src_translit;
      }
    }

    // Parse alternatives
    if (data.alternative_translations && data.alternative_translations.length > 0) {
      result.alternatives = data.alternative_translations;
    }

    // Parse confidence
    if (typeof data.confidence === 'number') {
      result.confidence = data.confidence;
    }

    return result;
  }

  /**
   * Detect language with enhanced accuracy
   */
  async detectLanguage(text: string): Promise<string> {
    if (!text.trim()) {
      throw new Error('Text for language detection cannot be empty');
    }

    // Simple heuristics for common languages in JLPT4YOU
    if (/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(text)) {
      return 'ja'; // Japanese characters detected
    }
    
    if (/[àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]/.test(text)) {
      return 'vi'; // Vietnamese diacritics detected
    }

    try {
      const result = await this.translate(text, 'auto', 'en');
      return result.sourceLanguage;
    } catch (error) {
      console.error('Language detection error:', error);
      return 'auto';
    }
  }

  /**
   * Batch translation with rate limiting
   */
  async translateBatch(
    texts: string[],
    sourceLanguage: string = 'auto',
    targetLanguage: string = 'vi',
    batchSize: number = 5
  ): Promise<TranslationResult[]> {
    const results: TranslationResult[] = [];
    
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const batchPromises = batch.map(text => 
        this.translate(text, sourceLanguage, targetLanguage)
      );
      
      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          // Add error result
          results.push({
            translatedText: batch[index],
            originalText: batch[index],
            sourceLanguage,
            targetLanguage,
            service: 'Error',
            timestamp: Date.now(),
            confidence: 0
          });
        }
      });

      // Rate limiting: wait between batches
      if (i + batchSize < texts.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return results;
  }

  /**
   * Clear translation cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  /**
   * Check if language is supported
   */
  isLanguageSupported(languageCode: string): boolean {
    return SUPPORTED_LANGUAGES.some(lang => lang.code === languageCode);
  }

  /**
   * Get language information
   */
  getLanguageInfo(languageCode: string): LanguageOption | undefined {
    return SUPPORTED_LANGUAGES.find(lang => lang.code === languageCode);
  }

  /**
   * Get all supported languages
   */
  getSupportedLanguages(): LanguageOption[] {
    return [...SUPPORTED_LANGUAGES];
  }
}

// Export singleton instance
export const enhancedTranslateService = new EnhancedTranslateService();

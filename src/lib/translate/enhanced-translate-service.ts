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
  private readonly proxyServerUrl = 'http://localhost:8080'; // Proxy server for Safari bypass
  private readonly defaultParams = {
    client: 'gtx',
    dt: ['t', 'bd', 'ex', 'ld', 'md', 'qca', 'rw', 'rm', 'ss', 'at'],
    dj: '1'
  };

  // Cache for translations to improve performance
  private cache = new Map<string, TranslationResult>();
  private readonly cacheExpiry = 5 * 60 * 1000; // 5 minutes

  // Rate limiting and retry logic
  private lastRequestTime = 0;
  private readonly minRequestInterval = 500; // 500ms between requests
  private retryCount = new Map<string, number>();
  private readonly maxRetries = 3;

  /**
   * Detect if current browser is Safari
   */
  private isSafari(): boolean {
    if (typeof window === 'undefined') return false;
    const userAgent = window.navigator.userAgent;
    return /Safari/.test(userAgent) && !/Chrome/.test(userAgent);
  }

  /**
   * Check if proxy server is available
   */
  private async isProxyAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.proxyServerUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(2000), // 2 second timeout
      });
      return response.ok;
    } catch (error) {
      console.warn('Proxy server not available:', error);
      return false;
    }
  }

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

    // Rate limiting: ensure minimum interval between requests
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.minRequestInterval) {
      await new Promise(resolve => setTimeout(resolve, this.minRequestInterval - timeSinceLastRequest));
    }
    this.lastRequestTime = Date.now();

    // Retry logic
    const retryKey = cacheKey;
    const currentRetries = this.retryCount.get(retryKey) || 0;

    try {
      // For Safari, try proxy server first if available
      if (this.isSafari() && await this.isProxyAvailable()) {
        console.log('Safari detected, using proxy server');
        const result = await this.translateWithProxy(text, sourceLanguage, targetLanguage);

        // Reset retry count on success
        this.retryCount.delete(retryKey);

        // Cache the result
        this.cache.set(cacheKey, result);

        return result;
      }

      // Try server-side API first (most reliable bypass)
      const result = await this.translateWithServerAPI(text, sourceLanguage, targetLanguage);

      // Reset retry count on success
      this.retryCount.delete(retryKey);

      // Cache the result
      this.cache.set(cacheKey, result);

      return result;
    } catch (error) {
      console.error('Primary translation method failed, trying fallback:', error);

      try {
        // For Safari, try proxy server as fallback
        if (this.isSafari()) {
          try {
            const result = await this.translateWithProxy(text, sourceLanguage, targetLanguage);

            // Reset retry count on success
            this.retryCount.delete(retryKey);

            // Cache the result
            this.cache.set(cacheKey, result);

            return result;
          } catch (proxyError) {
            console.error('Proxy server failed:', proxyError);
          }
        }

        // Fallback to client-side Google Translate
        const result = await this.translateWithGoogle(text, sourceLanguage, targetLanguage);

        // Reset retry count on success
        this.retryCount.delete(retryKey);

        // Cache the result
        this.cache.set(cacheKey, result);

        return result;
      } catch (clientError) {
        console.error('Client-side Google Translate failed:', clientError);

        // Increment retry count
        this.retryCount.set(retryKey, currentRetries + 1);

        // If we haven't exceeded max retries, try fallback
        if (currentRetries < this.maxRetries) {
          return await this.translateWithFallback(text, sourceLanguage, targetLanguage);
        } else {
          // Reset retry count and return fallback result
          this.retryCount.delete(retryKey);
          return await this.translateWithFallback(text, sourceLanguage, targetLanguage);
        }
      }
    }
  }

  /**
   * Server-side API translation (bypass CORS and browser restrictions)
   */
  private async translateWithServerAPI(
    text: string,
    sourceLanguage: string,
    targetLanguage: string
  ): Promise<TranslationResult> {
    const response = await fetch('/api/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        sourceLanguage,
        targetLanguage,
      }),
    });

    if (!response.ok) {
      throw new Error(`Server API failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();

    if (result.error) {
      throw new Error(`Server API error: ${result.error}`);
    }

    return result;
  }

  /**
   * Proxy server translation (Safari bypass)
   */
  private async translateWithProxy(
    text: string,
    sourceLanguage: string,
    targetLanguage: string
  ): Promise<TranslationResult> {
    const response = await fetch(`${this.proxyServerUrl}/translate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        source_lang: sourceLanguage,
        target_lang: targetLanguage,
        method: 'mazii' // Use mazii method for better compatibility
      }),
    });

    if (!response.ok) {
      throw new Error(`Proxy server failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(`Proxy server error: ${result.error}`);
    }

    // Convert proxy response to our TranslationResult format
    return {
      translatedText: result.translated_text,
      originalText: result.original_text,
      sourceLanguage: result.source_language,
      targetLanguage: result.target_language,
      confidence: result.confidence,
      service: `Proxy Server (${result.method})`,
      timestamp: Date.now(),
    };
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

    // Detect browser and adjust headers accordingly
    const headers = this.getBrowserOptimizedHeaders();

    const response = await fetch(url, {
      method: 'GET',
      headers,
      // Add credentials for better compatibility
      credentials: 'omit',
      // Add referrer policy
      referrerPolicy: 'no-referrer-when-downgrade',
    });

    if (!response.ok) {
      throw new Error(`Google Translate failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return this.parseGoogleResponse(data, text, sourceLanguage, targetLanguage);
  }

  /**
   * Get browser-optimized headers for better compatibility
   */
  private getBrowserOptimizedHeaders(): Record<string, string> {
    const userAgent = navigator.userAgent;
    const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent);
    const isChrome = /Chrome/.test(userAgent);
    const isFirefox = /Firefox/.test(userAgent);

    let headers: Record<string, string> = {
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.9,ja;q=0.8,vi;q=0.7',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
    };

    if (isSafari) {
      // Safari-specific headers
      headers['User-Agent'] = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15';
      headers['Sec-Fetch-Dest'] = 'empty';
      headers['Sec-Fetch-Mode'] = 'cors';
      headers['Sec-Fetch-Site'] = 'cross-site';
    } else if (isChrome) {
      // Chrome-specific headers with rotation
      const chromeVersions = ['120.0.0.0', '119.0.0.0', '118.0.0.0', '117.0.0.0'];
      const randomVersion = chromeVersions[Math.floor(Math.random() * chromeVersions.length)];
      headers['User-Agent'] = `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${randomVersion} Safari/537.36`;
      headers['sec-ch-ua'] = `"Google Chrome";v="${randomVersion.split('.')[0]}", "Chromium";v="${randomVersion.split('.')[0]}", "Not_A Brand";v="99"`;
      headers['sec-ch-ua-mobile'] = '?0';
      headers['sec-ch-ua-platform'] = '"macOS"';
    } else if (isFirefox) {
      // Firefox-specific headers
      headers['User-Agent'] = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/119.0';
    } else {
      // Default headers
      headers['User-Agent'] = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    }

    // Add referer only for non-Safari browsers
    if (!isSafari) {
      headers['Referer'] = 'https://translate.google.com/';
    }

    return headers;
  }

  /**
   * Fallback translation methods
   */
  private async translateWithFallback(
    text: string,
    sourceLanguage: string,
    targetLanguage: string
  ): Promise<TranslationResult> {
    // Try alternative Google endpoints with different strategies
    const alternativeEndpoints = [
      'https://translate.google.com/translate_a/single',
      'https://clients5.google.com/translate_a/single',
      'https://translate.googleapis.com/translate_a/single',
      // Add more endpoints for better fallback
      'https://translate.google.cn/translate_a/single', // China endpoint
    ];

    // Try each endpoint with different approaches
    for (let i = 0; i < alternativeEndpoints.length; i++) {
      const endpoint = alternativeEndpoints[i];
      try {
        // Add delay between attempts to avoid rate limiting
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000 * i));
        }

        const result = await this.tryAlternativeGoogleEndpoint(
          endpoint, text, sourceLanguage, targetLanguage
        );
        if (result) return result;
      } catch (error) {
        console.warn(`Alternative endpoint ${endpoint} failed:`, error);
      }
    }

    // Try with simplified parameters as last resort
    try {
      const result = await this.trySimplifiedTranslation(text, sourceLanguage, targetLanguage);
      if (result) return result;
    } catch (error) {
      console.warn('Simplified translation failed:', error);
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
   * Try simplified translation with minimal parameters
   */
  private async trySimplifiedTranslation(
    text: string,
    sourceLanguage: string,
    targetLanguage: string
  ): Promise<TranslationResult | null> {
    const params = new URLSearchParams({
      client: 'gtx',
      sl: sourceLanguage,
      tl: targetLanguage,
      q: text,
    });

    const url = `https://translate.googleapis.com/translate_a/single?${params.toString()}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.1; Trident/6.0)',
        'Accept': '*/*',
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return this.parseGoogleResponse(data, text, sourceLanguage, targetLanguage);
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

    // Use optimized headers for alternative endpoints
    const headers = this.getBrowserOptimizedHeaders();

    const response = await fetch(url, {
      method: 'GET',
      headers,
      credentials: 'omit',
      referrerPolicy: 'no-referrer-when-downgrade',
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
    this.retryCount.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[]; retryCount: number } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      retryCount: this.retryCount.size
    };
  }

  /**
   * Clean expired cache entries
   */
  cleanExpiredCache(): void {
    const now = Date.now();
    for (const [key, result] of this.cache.entries()) {
      if (now - result.timestamp > this.cacheExpiry) {
        this.cache.delete(key);
      }
    }
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

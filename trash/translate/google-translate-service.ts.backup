/**
 * Google Translate Service (Unofficial API)
 * Sử dụng endpoint không chính thức của Google Translate
 * Miễn phí nhưng không được Google chính thức hỗ trợ
 */

export interface TranslationResult {
  translatedText: string;
  originalText: string;
  sourceLanguage: string;
  targetLanguage: string;
  confidence?: number;
  romanization?: string;
  alternatives?: AlternativeTranslation[];
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

// Supported languages for JLPT4YOU
export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt' },
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย' },
];

class GoogleTranslateService {
  private readonly baseUrl = 'https://translate.googleapis.com/translate_a/single';
  private readonly defaultParams = {
    client: 'gtx',
    dt: ['t', 'bd', 'ex', 'ld', 'md', 'qca', 'rw', 'rm', 'ss', 'at'],
    dj: '1'
  };

  /**
   * Dịch văn bản từ ngôn ngữ nguồn sang ngôn ngữ đích
   */
  async translate(
    text: string,
    sourceLanguage: string = 'auto',
    targetLanguage: string = 'vi'
  ): Promise<TranslationResult> {
    if (!text.trim()) {
      throw new Error('Text to translate cannot be empty');
    }

    try {
      const url = this.buildUrl(text, sourceLanguage, targetLanguage);
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      if (!response.ok) {
        throw new Error(`Translation failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return this.parseResponse(data, text, sourceLanguage, targetLanguage);
    } catch (error) {
      console.error('Translation error:', error);
      throw new Error(`Failed to translate: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Phát hiện ngôn ngữ của văn bản
   */
  async detectLanguage(text: string): Promise<string> {
    if (!text.trim()) {
      throw new Error('Text for language detection cannot be empty');
    }

    try {
      const result = await this.translate(text, 'auto', 'en');
      return result.sourceLanguage;
    } catch (error) {
      console.error('Language detection error:', error);
      throw new Error('Failed to detect language');
    }
  }

  /**
   * Dịch nhiều văn bản cùng lúc
   */
  async translateBatch(
    texts: string[],
    sourceLanguage: string = 'auto',
    targetLanguage: string = 'vi'
  ): Promise<TranslationResult[]> {
    const promises = texts.map(text => 
      this.translate(text, sourceLanguage, targetLanguage)
    );
    
    return Promise.all(promises);
  }

  /**
   * Xây dựng URL cho API request
   */
  private buildUrl(text: string, sourceLanguage: string, targetLanguage: string): string {
    const params = new URLSearchParams({
      client: this.defaultParams.client,
      sl: sourceLanguage,
      tl: targetLanguage,
      dj: this.defaultParams.dj,
      q: text,
    });

    // Thêm các dt parameters
    this.defaultParams.dt.forEach(dt => {
      params.append('dt', dt);
    });

    return `${this.baseUrl}?${params.toString()}`;
  }

  /**
   * Parse response từ Google Translate API
   */
  private parseResponse(
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
    };

    // Parse main translation
    if (data.sentences && data.sentences.length > 0) {
      result.translatedText = data.sentences
        .filter((sentence: any) => sentence.trans)
        .map((sentence: any) => sentence.trans)
        .join('');

      // Get romanization if available
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
   * Kiểm tra xem ngôn ngữ có được hỗ trợ không
   */
  isLanguageSupported(languageCode: string): boolean {
    return SUPPORTED_LANGUAGES.some(lang => lang.code === languageCode);
  }

  /**
   * Lấy thông tin ngôn ngữ từ mã ngôn ngữ
   */
  getLanguageInfo(languageCode: string): LanguageOption | undefined {
    return SUPPORTED_LANGUAGES.find(lang => lang.code === languageCode);
  }
}

// Export singleton instance
export const googleTranslateService = new GoogleTranslateService();

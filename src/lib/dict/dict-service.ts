// Dictionary API Service
// Based on JDict// API configuration - Using internal proxy to bypass CORS
const API_BASE = '/api/dict';

export interface SuggestItem {
  id: string | number;
  slug?: string; // prefer slug for /words/{slugOrId}
  word?: string | { name: string; tag?: string; index?: number };
  kana?: string | { name: string; tag?: string; index?: number };
  suggest_mean?: string | { name: string; tag?: string; index?: number };
  grammar?: string | { name: string; tag?: string; index?: number };
  definition?: string | { name: string; tag?: string; index?: number };
  type: 'word' | 'grammar';
}

export interface WordDetail {
  id: number;
  word: string | { name: string; tag?: string; index?: number };
  kana: string | { name: string; tag?: string; index?: number };
  level?: string | { name: string; tag?: string; index?: number };
  type?: string | { name: string; tag?: string; index?: number };
  meanings: Array<{
    id: number;
    mean: string | { name: string; tag?: string; index?: number };
    note?: string | { name: string; tag?: string; index?: number };
    kind?: string | { name: string; tag?: string; index?: number };
  }>;
  kanjis?: Array<{
    kanji: string | { name: string; tag?: string; index?: number };
    hanviet?: string | { name: string; tag?: string; index?: number };
    onyomi?: string | { name: string; tag?: string; index?: number };
    kunyomi?: string | { name: string; tag?: string; index?: number };
    stroke?: number | { name: string; tag?: string; index?: number };
  }>;
  examples?: Array<{
    id: number;
    content: string | { name: string; tag?: string; index?: number };
    mean: string | { name: string; tag?: string; index?: number };
    transcription?: string | { name: string; tag?: string; index?: number };
  }>;
  related_words?: Array<{
    id: number;
    word: string | { name: string; tag?: string; index?: number };
    kana?: string | { name: string; tag?: string; index?: number };
    suggest_mean?: string | { name: string; tag?: string; index?: number };
    slug?: string;
  }>;
}

export interface GrammarDetail {
  id: number;
  grammar: string | { name: string; tag?: string; index?: number };
  level?: string | { name: string; tag?: string; index?: number };
  definition?: string | { name: string; tag?: string; index?: number };
  usage?: string | { name: string; tag?: string; index?: number };
  context?: string | { name: string; tag?: string; index?: number };
  examples?: Array<{
    id: number;
    content: string | { name: string; tag?: string; index?: number };
    mean: string | { name: string; tag?: string; index?: number };
  }>;
}

export type KeywordPosition = 'start' | 'middle' | 'end';
export type SearchType = 'word' | 'grammar';

class DictionaryService {
  private abortController: AbortController | null = null;

  // Cancel any pending requests
  cancelPendingRequests() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  // Search suggestions
  async getSuggestions(
    keyword: string,
    type: SearchType = 'word',
    position: KeywordPosition = 'start'
  ): Promise<SuggestItem[]> {
    // Cancel previous request if exists
    this.cancelPendingRequests();
    
    // Create new abort controller
    this.abortController = new AbortController();

    try {
      const params = new URLSearchParams({
        keyword,
        keyword_position: position,
        type
      });

      const response = await fetch(
        `${API_BASE}/suggest?${params}`,
        { signal: this.abortController.signal }
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      
      // API returns { list: [...] } format
      const items = data?.list || [];
      
      // Transform response to standardized format
      return items.map((item: any) => ({
        ...item,
        type
      }));
    } catch (error: any) {
      if (error.name === 'AbortError') {
        // Request was cancelled, return empty
        return [];
      }
      console.error('Suggestion error:', error);
      throw error;
    }
  }

  // Get word detail
  async getWordDetail(slugOrId: string | number, getRelated = true): Promise<WordDetail> {
    try {
      const params = getRelated ? '?get_relate=1' : '';
      const response = await fetch(
        `${API_BASE}/words/${encodeURIComponent(slugOrId)}${params}`
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Word detail error:', error);
      throw error;
    }
  }

  // Get grammar detail
  async getGrammarDetail(id: string | number): Promise<GrammarDetail> {
    try {
      const response = await fetch(
        `${API_BASE}/grammars/${id}`
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Grammar detail error:', error);
      throw error;
    }
  }

  // Get radicals (for kanji browsing)
  async getRadicals(): Promise<any> {
    try {
      // Use internal proxy for radicals
      const response = await fetch(`${API_BASE}/radicals`);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Radicals error:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const dictService = new DictionaryService();

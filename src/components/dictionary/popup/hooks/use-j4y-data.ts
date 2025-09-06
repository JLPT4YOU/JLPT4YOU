/**
 * Hook for managing J4YDict data fetching
 */

import { useState, useEffect } from 'react';
import { dictService, type WordDetail } from '@/lib/dict/dict-service';
import type { J4YDataState } from '../types';

export function useJ4YData(query: string): J4YDataState {
  const [data, setData] = useState<WordDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    // Try to get word detail from J4YDict API first
    dictService.getSuggestions(query, 'word', 'start')
      .then(async (suggestions) => {
        if (cancelled) return;
        if (suggestions.length > 0) {
          // Get the first suggestion and fetch its details
          const firstSuggestion = suggestions[0];
          const wordDetail = await dictService.getWordDetail(firstSuggestion.slug || firstSuggestion.id, true);
          setData(wordDetail);
        } else {
          setError('Không tìm thấy từ trong J4YDict');
        }
      })
      .catch((e) => {
        if (!cancelled) {
          console.error('J4YDict error:', e);
          setError(e.message || 'Lỗi khi tải dữ liệu J4YDict');
        }
      })
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [query]);

  return { data, loading, error };
}

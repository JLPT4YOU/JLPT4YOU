/**
 * Hook for managing Google Translate data fetching
 */

import { useState, useEffect } from 'react';
import { enhancedTranslateService, type TranslationResult } from '@/lib/translate/enhanced-translate-service';
import type { TranslateDataState } from '../types';

export function useTranslateData(query: string): TranslateDataState {
  const [data, setData] = useState<TranslationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    enhancedTranslateService.translate(query, 'auto', 'vi')
      .then((result) => {
        if (cancelled) return;
        setData(result);
      })
      .catch((e) => {
        if (!cancelled) {
          console.error('Google Translate error:', e);
          setError(e.message || 'Lỗi khi dịch');
        }
      })
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [query]);

  return { data, loading, error };
}

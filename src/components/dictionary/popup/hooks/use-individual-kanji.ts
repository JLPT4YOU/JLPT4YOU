/**
 * Hook for managing individual kanji data fetching
 */

import { useState, useEffect } from 'react';
import { lookupDjCached } from '../../service';
import { parseDjFulltext } from '../../parseDj';
import { sanitizeHtml } from '../../sanitizer';
import type { IndividualKanjiState } from '../types';

interface UseIndividualKanjiProps {
  kanjiIdx: number;
  svgs: { char?: string; svg: string }[];
  query: string;
}

export function useIndividualKanji({ kanjiIdx, svgs, query }: UseIndividualKanjiProps): IndividualKanjiState {
  const [data, setData] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!svgs.length || kanjiIdx >= svgs.length) return;
    const selectedKanji = svgs[kanjiIdx].char;
    
    // Skip if already fetched or is the full query
    if (!selectedKanji || data[selectedKanji] || selectedKanji === query) return;
    
    // Only fetch individual if we have multiple Kanji
    if (svgs.length <= 1) return;
    
    let cancelled = false;
    setLoading(true);
    
    lookupDjCached(selectedKanji)
      .then((res) => {
        if (cancelled) return;
        const parsed = parseDjFulltext(res.fulltext);
        const kanjiSection = parsed.sections.find(s => s.label.toLowerCase().includes('kanji'));
        if (kanjiSection) {
          setData(prev => ({
            ...prev,
            [selectedKanji]: sanitizeHtml(kanjiSection.html)
          }));
        }
      })
      .catch(console.error)
      .finally(() => !cancelled && setLoading(false));
    
    return () => {
      cancelled = true;
    };
  }, [kanjiIdx, svgs, data, query]);

  return { data, loading };
}

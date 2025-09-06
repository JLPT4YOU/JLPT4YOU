/**
 * Hook for managing TraCau data fetching
 */

import { useState, useEffect } from 'react';
import { lookupDjCached } from '../../service';
import { parseDjFulltext } from '../../parseDj';
import { sanitizeHtml } from '../../sanitizer';
import type { TraCauDataState } from '../types';

export function useTraCauData(query: string): TraCauDataState {
  const [htmlSections, setHtmlSections] = useState<{ key: string; label: string; html: string }[]>([]);
  const [svgs, setSvgs] = useState<{ char?: string; svg: string }[]>([]);
  const [kanjiContents, setKanjiContents] = useState<{ char: string; html: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    
    lookupDjCached(query)
      .then((res) => {
        if (cancelled) return;
        const parsed = parseDjFulltext(res.fulltext);
        const sections = parsed.sections.map((s) => ({ ...s, html: sanitizeHtml(s.html) }));
        setHtmlSections(sections);
        setSvgs(parsed.svgs);
        setKanjiContents(parsed.kanjiContents || []);
      })
      .catch((e) => !cancelled && setError(e.message || 'Lỗi không xác định'))
      .finally(() => !cancelled && setLoading(false));
    
    return () => {
      cancelled = true;
    };
  }, [query]);

  return { htmlSections, svgs, kanjiContents, loading, error };
}

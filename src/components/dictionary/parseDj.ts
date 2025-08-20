/*
 * Parse /dj fulltext HTML -> structured sections
 */

export type DjSection = { key: 'dict_jv' | 'dict_je' | 'dict_kj'; label: string; html: string };
export type DjParsed = { 
  sections: DjSection[]; 
  svgs: { char?: string; svg: string }[];
  kanjiContents?: { char: string; html: string }[]; // Per-Kanji HTML content
};

const LABELS: Record<DjSection['key'], string> = {
  dict_jv: 'JP‑VN',
  dict_je: 'JP‑EN',
  dict_kj: 'Kanji',
};

export function parseDjFulltext(fulltext: string): DjParsed {
  const doc = new DOMParser().parseFromString(fulltext, 'text/html');
  const get = (id: DjSection['key']): DjSection | null => {
    const article = doc.querySelector(`article#${id}`) as HTMLElement | null;
    if (!article) return null;
    const label = (article.getAttribute('data-tab-name') || LABELS[id]).trim();
    return { key: id, label, html: article.innerHTML };
  };

  // Extract inline SVG strings for Kanji strokes from inline scripts
  const svgs: { char?: string; svg: string }[] = [];
  const kanjiChars: string[] = [];
  doc.querySelectorAll('script').forEach((s) => {
    const text = s.textContent || '';
    // Match patterns: var text2160 = '日'; var svg2160 = '...svg...';
    const textMatch = text.match(/var\s+text\d+\s*=\s*'([^']+)'/);
    const svgMatch = text.match(/var\s+svg\d+\s*=\s*'([\s\S]*?)';/);
    if (svgMatch) {
      const char = textMatch?.[1] || '';
      svgs.push({ char, svg: svgMatch[1] });
      if (char) kanjiChars.push(char);
    }
  });

  const sections = (['dict_jv', 'dict_je', 'dict_kj'] as DjSection['key'][])
    .map((k) => get(k))
    .filter((x): x is DjSection => Boolean(x));

  // Parse and split Kanji content for individual characters
  const kanjiContents = parseKanjiContent(doc, kanjiChars);

  return { sections, svgs, kanjiContents };
}

/**
 * Parse Kanji section content
 * 
 * NOTE: The TraCau API returns combined content for compound Kanji words,
 * not individual per-character descriptions. This is a backend limitation.
 * For compound words like "日本", the API provides one unified description
 * for the entire word, not separate descriptions for "日" and "本".
 * 
 * The SVG animations are properly separated per character, but the descriptive
 * content (meanings, readings, vocabulary) is for the compound as a whole.
 */
function parseKanjiContent(doc: Document, kanjiChars: string[]): { char: string; html: string }[] {
  const kanjiArticle = doc.querySelector('article#dict_kj');
  if (!kanjiArticle || kanjiChars.length === 0) return [];

  const simpleTabs = kanjiArticle.querySelector('.simpleTabs .stc');
  if (!simpleTabs) return [];
  
  const html = simpleTabs.innerHTML;
  
  // Return the same content for all Kanji characters
  // This is necessary because the API doesn't provide per-character content for compounds
  return kanjiChars.map(char => ({ char, html }));
}


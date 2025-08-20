# JDict-style Dictionary (5 core features)

This README focuses on exactly 5 features for your personal web dictionary:

1) Search bar with dropdown suggestions showing brief details
2) Từ vựng (Word) detail
3) Ngữ pháp (Grammar) detail
4) Kanji (Hán tự)
5) Ví dụ (Examples)

Note: JDict does not publish an official API spec. Endpoints below are observed and may change without notice. Use responsibly.

---

## 1) Search bar + Suggestion dropdown
- Purpose: While typing, show a dropdown with brief details; click to open the full detail in the section below.
- Endpoint: GET `https://api.jdict.net/api/v1/suggest`
- Query params:
  - `keyword` (required)
  - `keyword_position` = `start` | `middle` | `end`
  - `type` = `word` | `grammar`
- Examples:
  - Word: `curl 'https://api.jdict.net/api/v1/suggest?keyword=%E7%8C%AB&keyword_position=start&type=word'`
  - Grammar: `curl 'https://api.jdict.net/api/v1/suggest?keyword=tame&keyword_position=start&type=grammar'`
- Render in dropdown:
  - For word: show `word`, `kana`, `suggest_mean`
  - For grammar: show `grammar`, `definition`
- Implementation notes:
  - Debounce ~300ms; cancel stale requests with AbortController
  - On Enter: pick first suggestion and open detail
  - Optional selector in the search bar: "Kiểu" = `Từ vựng | Ngữ pháp` (maps to `type`)

---

## 2) Từ vựng (Word) detail
- Endpoint: GET `https://api.jdict.net/api/v1/words/{slugOrId}`
- Optional query: `get_relate=1` to include `related_words`
- Example: `curl 'https://api.jdict.net/api/v1/words/%E7%8C%AB-30909?get_relate=1'`
- Render sections:
  - Header: `word`, `kana`, JLPT `level`, `type`
  - Meanings: list of `mean`, part-of-speech tag
  - Kanjis: `hanviet`, `onyomi`, `kunyomi`, `stroke`
  - Examples: `content` + `mean`
  - Related words: clickable chips

---

## 3) Ngữ pháp (Grammar) detail
- Suggest first, then load detail by id.
- Suggest endpoint: GET `/suggest` with `type=grammar`
- Detail endpoint: GET `https://api.jdict.net/api/v1/grammars/{id}`
- Example: `curl 'https://api.jdict.net/api/v1/grammars/126'`
- Render sections:
  - Header: `grammar`, JLPT `level`
  - Definition, Usage (công thức), Context
  - Examples

---

## 4) Kanji (Hán tự)
- Practical sources available now:
  - In Word detail: `kanjis[]` includes per-kanji info (hanviet, readings, stroke)
  - Static radicals list: GET `https://jdict.net/radical.json` (for browsing/filtering by radical)
- Implementation options:
  - Basic: when a word is opened, render its `kanjis[]` (works without an extra API)
  - Browse-by-radical: fetch `radical.json`, build a simple explorer UI that filters words/kanji (you can then open a word detail to show kanji info)
- Note: A dedicated Kanji detail endpoint may exist but is not confirmed publicly. The above approach is stable without guessing endpoints.

---

## 5) Ví dụ (Examples)
- Available immediately via Word detail: `examples[]`
  - Show each example line as "content" + translation `mean`
- If you need a global Examples search page:
  - Capture requests on the JDict "Câu ví dụ" page to find the exact endpoint (not officially documented). Until then, use the examples within Word/Grammar details.

---

## Minimal UI layout (like JDict)
- Top: Search bar with
  - Text input, `keyword_position` (Bắt đầu | Giữa | Kết thúc), `type` (Từ vựng | Ngữ pháp)
  - Dropdown suggestions showing brief details
- Below: 4 sections (tabs or stacked)
  1. Từ vựng: renders Word detail
  2. Ngữ pháp: renders Grammar detail
  3. Kanji: shows kanji data from Word detail and/or a radicals browser
  4. Ví dụ: shows examples from Word/Grammar detail
- Responsive single-column on mobile; keyboard navigation in dropdown (↑/↓/Enter)

---

## Minimal JS calls
```js
const API = 'https://api.jdict.net/api/v1';

async function suggest(keyword, type='word', position='start') {
  const url = `${API}/suggest?keyword=${encodeURIComponent(keyword)}&keyword_position=${position}&type=${type}`;
  const r = await fetch(url); if (!r.ok) throw new Error(r.status); return r.json();
}

async function getWord(slugOrId) {
  const url = `${API}/words/${encodeURIComponent(slugOrId)}?get_relate=1`;
  const r = await fetch(url); if (!r.ok) throw new Error(r.status); return r.json();
}

async function getGrammar(id) {
  const url = `${API}/grammars/${id}`;
  const r = await fetch(url); if (!r.ok) throw new Error(r.status); return r.json();
}

async function getRadicals() {
  const r = await fetch('https://jdict.net/radical.json');
  if (!r.ok) throw new Error(r.status); return r.json();
}
```

---

## Notes
- CORS currently allows browser calls; use debounce and caching to reduce load
- No official API; endpoints may change. Use reasonably and credit JDict


<!-- The older detailed README content below can be ignored if you only need the 5 features above. -->

# JDict-style Personal Dictionary

A minimal personal dictionary page (jdict.html) that uses JDict's public JSON endpoints with a UI modeled after jdict.net. Includes an API Explorer and Network Logger to help you explore endpoints and debug requests.

Note: JDict does not publish an official API spec. Endpoints below were observed from the website and may change without notice. Use responsibly.

---

## Quick start

- Open the file locally in a browser: `jdict.html`
- Features:
  - Auto-suggest while typing (word search)
  - Result detail view: meanings, kanji, examples, related words
  - API Explorer: try endpoints and copy curl commands
  - Network Logger: logs all fetch requests

---

## API Reference (observed)

Base URLs:
- API: `https://api.jdict.net/api/v1`
- Static content: `https://jdict.net`

### 1) Suggest (word)
- Method: GET `/suggest`
- Query params:
  - `keyword` (required)
  - `keyword_position` = `start` | `middle` | `end`
  - `type` = `word`
- Example:
  - curl 'https://api.jdict.net/api/v1/suggest?keyword=%E7%8C%AB&keyword_position=start&type=word'
- Response (shape):
  - `{ list: [{ id, slug, word, kana, suggest_mean, type: { name, tag } }, ...] }`

### 2) Word detail
- Method: GET `/words/{slugOrId}`
- Query params:
  - `get_relate=1` (optional; returns related_words)
- Example:
  - curl 'https://api.jdict.net/api/v1/words/%E7%8C%AB-30909?get_relate=1'
- Response (shape):
  - `{ id, slug, word, kana, level, type, kanjis: [...], meanings: [...], examples: [...], related_words: [...] }`

### 3) Suggest (grammar)
- Method: GET `/suggest`
- Query params:
  - `keyword` (required)
  - `keyword_position` = `start` | `middle` | `end`
  - `type` = `grammar`
- Example:
  - curl 'https://api.jdict.net/api/v1/suggest?keyword=tame&keyword_position=start&type=grammar'
- Response (shape):
  - `{ list: [{ id, grammar, definition }, ...] }`

### 4) Grammar detail
- Method: GET `/grammars/{id}`
- Example:
  - curl 'https://api.jdict.net/api/v1/grammars/126'
- Response (shape):
  - `{ id, grammar, definition, usage, context, level, examples: [{ content, mean }, ...] }`

### 5) Newest words
- Method: GET `/words/get_newest`
- Example:
  - curl 'https://api.jdict.net/api/v1/words/get_newest'

### 6) Latest contributions
- Method: GET `/contributes/get_latest`
- Example:
  - curl 'https://api.jdict.net/api/v1/contributes/get_latest'

### 7) Contributions list
- Method: GET `/contributes`
- Query params:
  - `page`, `per_page`
  - `ref_id` (e.g., word id), `ref_type` = `Word` | `Kanji`
  - `user_id` (optional)
- Example:
  - curl 'https://api.jdict.net/api/v1/contributes?page=1&per_page=5&ref_id=30909&ref_type=Word&user_id='

### 8) Access statistics
- Method: GET `/access_statistics`
- Example:
  - curl 'https://api.jdict.net/api/v1/access_statistics'

### 9) Radicals (static)
- Method: GET `https://jdict.net/radical.json`

### Possibly available (TBD, confirm by observing site)
- Examples search, Kanji detail, Translate, Kana conversion

---

## UI design spec (JDict-inspired)

The goal is to emulate the clear, fast, and simple UX of jdict.net while keeping it lightweight.

### Global structure
- Header: compact title and quick links (optional)
- Main area: Search card, Suggestions, Result detail
- Optional sections below: API Explorer, Network Logger
- Footer: attribution note

### Search bar
- Text input with placeholder
- Position selector: `Bắt đầu | Giữa | Kết thúc` → maps to `keyword_position`
- (Optional) Type selector: `Từ vựng | Ngữ pháp` → maps to `type` (`word`/`grammar`)
- Search button and Enter-to-search
- Debounce input (≈300 ms) and AbortController to cancel stale requests

### Suggestions panel
- Responsive list of items
- Word suggestion item shows: word (bold), kana, short meaning, tag
- Grammar suggestion item shows: grammar pattern, short definition
- Click item → load detail

### Result detail (word)
- Header: Word (big), Kana (accent), JLPT badge, type tag
- Sections:
  - Meanings list (with part-of-speech tags)
  - Kanji info (Hanviet, Onyomi/Kunyomi, Stroke count)
  - Examples (content + mean)
  - Related words as clickable chips

### Result detail (grammar)
- Header: Grammar pattern, JLPT level
- Sections:
  - Definition
  - Usage/formula (e.g., `N修飾型 ＋ ために`)
  - Context/notes
  - Examples

### Lists (optional)
- Newest words (preview list)
- Latest contributions (preview list)

### Utility panels (developer)
- API Explorer: pick preset, build URL, run, preview JSON, copy curl
- Network Logger: toggle capture, filter to jdict.net, view request/response previews

### Accessibility & keyboard
- Tab focus styles for interactive items
- Arrow Up/Down to navigate suggestion list; Enter to pick
- aria-live regions for loading states

### Responsive
- Single-column on small screens; fluid spacing and font sizes

---

## Integration guidelines

### Fetch strategy
- Debounce suggest requests (300–400 ms)
- Abort previous suggest requests when typing continues
- Cache short-lived results (e.g., 5 minutes) for recently queried keywords
- Defensive error handling: display clear error messages; retry/backoff for 429/5xx

### CORS and rate limits
- CORS currently allows browser calls
- No official rate limit published; avoid aggressive scraping

### Legal
- No official public API docs; robots.txt on the main domain disallows `/api/`
- Use reasonably, credit JDict, and consider asking permission for production use

---

## File layout

- `jdict.html` — Single-page UI + API Explorer + Network Logger
  - Pure HTML/CSS/JS, no build step required
  - Open directly in browser

---

## Minimal JS client examples

JavaScript (browser/Node):

```js
const API = 'https://api.jdict.net/api/v1';

async function suggestWord(keyword, position='start') {
  const url = `${API}/suggest?keyword=${encodeURIComponent(keyword)}&keyword_position=${position}&type=word`;
  const r = await fetch(url); if (!r.ok) throw new Error(r.status); return r.json();
}

async function getWord(slugOrId) {
  const url = `${API}/words/${encodeURIComponent(slugOrId)}?get_relate=1`;
  const r = await fetch(url); if (!r.ok) throw new Error(r.status); return r.json();
}

async function suggestGrammar(keyword, position='start') {
  const url = `${API}/suggest?keyword=${encodeURIComponent(keyword)}&keyword_position=${position}&type=grammar`;
  const r = await fetch(url); if (!r.ok) throw new Error(r.status); return r.json();
}

async function getGrammar(id) {
  const url = `${API}/grammars/${id}`;
  const r = await fetch(url); if (!r.ok) throw new Error(r.status); return r.json();
}
```

---

## Roadmap (optional)

- Add Favorites and History (localStorage)
- Keyboard navigation in suggestion list
- Add tabs for Grammar search and display
- Add Kanji page and Radicals filter
- Examples search tab (if endpoint confirmed)
- Offline caching and service worker (future)

---

## Attribution

- Data originates from JDict (https://jdict.net). Respect their service, avoid heavy scraping, and request permission for production integrations.


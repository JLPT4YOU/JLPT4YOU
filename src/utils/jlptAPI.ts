// JLPT Vocabulary & Grammar API utility
// What: Wrapper for jlpt-vocabulary-api with simple in-memory caching
// Why: Centralize API calls and avoid duplicate fetches
// Impact: None to existing code; adds grammar helpers used by new /study grammar pages

const BASE_URL = (process.env.NEXT_PUBLIC_JLPT_API_URL as string) || 'https://jlpt-vocabulary-api-6jmc.vercel.app'
const API_KEY = (process.env.NEXT_PUBLIC_JLPT_API_KEY as string) || 'test_key'

const cache = new Map<string, unknown>()

function buildUrl(endpoint: string, params?: Record<string, string | number | boolean>) {
  const isBrowser = typeof window !== 'undefined'
  const isJest = typeof process !== 'undefined' && (!!(process as any).env) && (process as any).env.NODE_ENV === 'test'
  const useLocalBase = isBrowser && !isJest && window.location.hostname === 'localhost'
  const base = useLocalBase ? window.location.origin : BASE_URL
  const url = new URL(endpoint, base)
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') url.searchParams.append(k, String(v))
    })
  }
  return url.toString()
}

async function call(endpoint: string, params?: Record<string, string | number | boolean>) {
  const isBrowser = typeof window !== 'undefined'
  const isJest = typeof process !== 'undefined' && (!!(process as any).env) && (process as any).env.NODE_ENV === 'test'
  const useLocalProxy = isBrowser && !isJest && window.location.hostname === 'localhost'
  // Use Next proxy endpoints when local browser (not test) to avoid CORS/domain restriction
  const mappedEndpoint = useLocalProxy
    ? (endpoint.startsWith('/api/words')
        ? (endpoint.startsWith('/api/words/random') ? '/api/jlpt/words/random' : '/api/jlpt/words')
        : (endpoint.startsWith('/api/grammar')
            ? (endpoint.startsWith('/api/grammar/random') ? '/api/jlpt/grammar/random' : '/api/jlpt/grammar')
            : endpoint))
    : endpoint

  const url = buildUrl(mappedEndpoint, params)
  if (cache.has(url)) return cache.get(url)

  const headers: Record<string, string> = useLocalProxy ? {} : { 'X-API-Key': API_KEY || '' }
  const res = await fetch(url, { headers })

  if (!res.ok) {
    throw new Error(`[jlptAPI] HTTP ${res.status}`)
  }

  const data = await res.json()
  cache.set(url, data)
  return data
}

// ===== Vocabulary types & functions =====
export type JLPTWord = {
  Hiragana?: string
  Kanji: string
  en: string
  vn: string
  vd?: string
  level: string // e.g. "N5"
}

export type WordsResponse = {
  count?: number
  level?: string
  limit?: number
  offset?: number
  total?: number
  words: JLPTWord[]
}

export function getWordsByLevel(level: string, limit = 10, offset = 0): Promise<WordsResponse> {
  return call('/api/words', { level, limit, offset })
}

export function searchWords(word: string, opts?: { level?: string; limit?: number; offset?: number }): Promise<WordsResponse> {
  const params: Record<string, string | number> = { word }
  if (opts?.level) params.level = opts.level
  if (typeof opts?.limit === 'number') params.limit = opts.limit
  if (typeof opts?.offset === 'number') params.offset = opts.offset
  return call('/api/words', params)
}

export function getRandomWords(limit = 10, level?: string): Promise<WordsResponse> {
  const params: Record<string, string | number> = { limit }
  if (level) params.level = level
  return call('/api/words/random', params)
}

// ===== Grammar types & functions =====
export type JLPTGrammarExample = {
  jp: string
  vn?: string
  en?: string
}

export type JLPTGrammar = {
  id: number
  grammar: string
  meaning_vn?: string
  meaning_en?: string
  structure?: string
  level: string // e.g. "N3"
  examples?: JLPTGrammarExample[]
}

export type GrammarResponse = {
  level?: string
  count?: number
  total?: number
  limit?: number
  offset?: number
  grammar: JLPTGrammar[]
}

export function getGrammarByLevel(level: string, limit = 10, offset = 0): Promise<GrammarResponse> {
  return call('/api/grammar', { level, limit, offset })
}

export function searchGrammar(query: string, opts?: { level?: string; limit?: number; offset?: number }): Promise<GrammarResponse> {
  const params: Record<string, string | number> = { grammar: query }
  if (opts?.level) params.level = opts.level
  if (typeof opts?.limit === 'number') params.limit = opts.limit
  if (typeof opts?.offset === 'number') params.offset = opts.offset
  return call('/api/grammar', params)
}

export function getRandomGrammar(count = 1, level?: string): Promise<GrammarResponse> {
  const params: Record<string, string | number> = { count }
  if (level) params.level = level
  return call('/api/grammar/random', params)
}

// Simple helper to clear cache (e.g. in tests)
export function __clearCache() {
  cache.clear()
}


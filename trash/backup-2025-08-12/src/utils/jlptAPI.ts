// BACKUP 2025-08-12
// Original src/utils/jlptAPI.ts
// JLPT Vocabulary API utility
// What: Wrapper for jlpt-vocabulary-api with simple in-memory caching
// Why: Centralize API calls and avoid duplicate fetches
// Impact: None to existing code; only new usage by /study vocabulary pages

const BASE_URL = (process.env.NEXT_PUBLIC_JLPT_API_URL as string) || 'https://jlpt-vocabulary-api-6jmc.vercel.app'
const API_KEY = (process.env.NEXT_PUBLIC_JLPT_API_KEY as string) || 'test_key'

const cache = new Map<string, any>()

function buildUrl(endpoint: string, params?: Record<string, any>) {
  const isBrowser = typeof window !== 'undefined'
  const isLocal = isBrowser && window.location.hostname === 'localhost'
  const base = isLocal && isBrowser ? window.location.origin : BASE_URL
  const url = new URL(endpoint, base)
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') url.searchParams.append(k, String(v))
    })
  }
  return url.toString()
}

async function call(endpoint: string, params?: Record<string, any>) {
  const isBrowser = typeof window !== 'undefined'
  const isLocal = isBrowser && window.location.hostname === 'localhost'
  // Use Next proxy endpoints when local to avoid CORS/domain restriction
  const mappedEndpoint = isLocal
    ? (endpoint.startsWith('/api/words/random') ? '/api/jlpt/words/random' : '/api/jlpt/words')
    : endpoint

  const url = buildUrl(mappedEndpoint, params)
  if (cache.has(url)) return cache.get(url)

  const headers: Record<string, string> = isLocal ? {} : { 'X-API-Key': API_KEY || '' }
  const res = await fetch(url, { headers })

  if (!res.ok) {
    throw new Error(`[jlptAPI] HTTP ${res.status}`)
  }

  const data = await res.json()
  cache.set(url, data)
  return data
}

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
  const params: Record<string, any> = { word }
  if (opts?.level) params.level = opts.level
  if (typeof opts?.limit === 'number') params.limit = opts.limit
  if (typeof opts?.offset === 'number') params.offset = opts.offset
  return call('/api/words', params)
}

export function getRandomWords(limit = 10, level?: string): Promise<WordsResponse> {
  return call('/api/words/random', { limit, level })
}

// Simple helper to clear cache (e.g. in tests)
export function __clearCache() {
  cache.clear()
}


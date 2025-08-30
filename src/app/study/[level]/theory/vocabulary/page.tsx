"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { LanguagePageWrapper } from '@/components/language-page-wrapper'
import { useLocalStorage } from '@/hooks/use-local-storage'
import { debounceFn } from '@/hooks/use-debounce'
import { getWordsByLevel, searchWords, JLPTWord } from '@/utils/jlptAPI'

const LIMIT_OPTIONS = [10, 20, 50, 100]

export default function StudyVocabularyPage() {
  return (
    <ProtectedRoute>
      <LanguagePageWrapper>
        {({ language, translations, t }) => (
          <Content language={language} translations={translations} t={t} />
        )}
      </LanguagePageWrapper>
    </ProtectedRoute>
  )
}

interface ContentProps {
  language: string
  translations: any
  t: (key: string) => string
}

function Content({ language, translations, t }: ContentProps) {
  const level = getLevelFromPath()
  const { value: limit, setValue: setLimit } = useLocalStorage<number>('study.vocab.limit', { defaultValue: 10 })
  const { value: lastSearch, setValue: setLastSearch } = useLocalStorage<string>('study.vocab.lastSearch', { defaultValue: '' , serializer: { parse: (v) => v, stringify: (v) => v }})

  const [query, setQuery] = useState(lastSearch || '')
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [words, setWords] = useState<JLPTWord[]>([])
  const [hasNext, setHasNext] = useState(false)
  const [total, setTotal] = useState<number | null>(null)

  const isSearchMode = query.trim().length > 0

  const fetchLevelWords = async (reset = false) => {
    setLoading(true)
    setError(null)
    try {
      const currentOffset = (reset ? 0 : page * limit)
      const data = await getWordsByLevel(level, limit, currentOffset)
      setWords(data.words || [])
      setHasNext((data.words?.length || 0) === limit)
      if (reset) setPage(1)
      else setPage(prev => prev + 1)
      setTotal(typeof data.total === 'number' ? data.total : null)
    } catch (e: any) {
      setError(e?.message || 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  const fetchSearchWords = async (reset = false) => {
    setLoading(true)
    setError(null)
    try {
      const currentOffset = (reset ? 0 : page * limit)
      // Do not send level param for search to maximize matches; filter client-side by level
      const data = await searchWords(query.trim(), { limit, offset: currentOffset })
      const filtered = (data.words || []).filter(w => (w.level || '').toLowerCase() === level.toLowerCase())
      setWords(filtered)
      setHasNext(filtered.length === limit)
      if (reset) setPage(1)
      else setPage(prev => prev + 1)
      setTotal(typeof data.total === 'number' ? data.total : null)
    } catch (e: any) {
      setError(e?.message || 'Failed to search')
    } finally {
      setLoading(false)
    }
  }

  // Initial load / level or limit changes
  useEffect(() => {
    if (!isSearchMode) {
      setWords([])
      setPage(0)
      void fetchLevelWords(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level, limit])

  // Debounced search on query changes
  useEffect(() => {
    const id = window.setTimeout(() => {
      setLastSearch(query)
      if (query.trim()) {
        void fetchSearchWords(true)
      } else {
        // back to level mode
        setWords([])
        setPage(0)
        void fetchLevelWords(true)
      }
    }, 300)
    return () => window.clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])

  const onChangeLimit = (val: number) => {
    setLimit(val)
    setWords([])
    setPage(0)
    if (!isSearchMode) fetchLevelWords(true)
  }

  const onLoadMore = () => {
    if (loading || !hasNext) return
    if (isSearchMode) fetchSearchWords(false)
    else fetchLevelWords(false)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="app-container py-6">
        <div className="app-content max-w-6xl mx-auto">
          <Header level={level} t={t} />
          <Controls
            query={query}
            setQuery={setQuery}
            limit={limit}
            setLimit={onChangeLimit}
            t={t}
          />
          <WordGrid words={words} loading={loading} error={error} t={t} />
          <FooterControls
            loading={loading}
            hasNext={hasNext}
            page={page}
            limit={limit}
            total={total}
            onPrev={() => {
              if (loading || page <= 1) return
              setPage(prev => Math.max(0, prev - 1))
              void (isSearchMode ? fetchSearchWords(true) : fetchLevelWords(true))
            }}
            onNext={() => onLoadMore()}
          />
        </div>
      </div>
    </div>
  )
}

function getLevelFromPath() {
  if (typeof window === 'undefined') return 'n5'
  const parts = window.location.pathname.split('/')
  // /study/:level/theory/vocabulary
  return (parts[2] || 'n5').toLowerCase()
}

function Header({ level, t }: { level: string; t: (key: string) => string }) {
  return (
    <div className="text-center app-space-md">
      <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
        {t('study.vocabulary.pageTitle').replace('{level}', level.toUpperCase())}
      </h1>
      <p className="text-muted-foreground">{t('study.vocabulary.pageSubtitle')}</p>
    </div>
  )
}

function Controls({
  query,
  setQuery,
  limit,
  setLimit,
  t
}: {
  query: string
  setQuery: (v: string) => void
  limit: number
  setLimit: (n: number) => void
  t: (key: string) => string
}) {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
      <div className="flex-1 flex items-center gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('study.vocabulary.search.placeholder')}
          className="w-full px-4 py-2 rounded-xl bg-card text-foreground placeholder:text-muted-foreground/70 border border-border"
        />
        {query && (
          <button
            className="px-3 py-2 rounded-xl bg-muted text-foreground border border-border"
            onClick={() => setQuery('')}
          >
            {t('study.vocabulary.search.clear')}
          </button>
        )}
      </div>
      <div className="flex items-center gap-2">
        <label className="text-sm text-muted-foreground">Limit</label>
        <select
          value={limit}
          onChange={(e) => setLimit(Number(e.target.value))}
          className="px-3 py-2 rounded-xl bg-card text-foreground border border-border"
        >
          {LIMIT_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>
    </div>
  )
}

function WordGrid({ words, loading, error, t }: { words: JLPTWord[]; loading: boolean; error: string | null; t: (key: string) => string }) {
  if (error) {
    return (
      <div className="text-center text-destructive">{error}</div>
    )
  }
  return (
    <>
      {words.length === 0 && !loading ? (
        <div className="text-center text-muted-foreground">{t('study.vocabulary.search.noResults')}</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-6">
          {words.map((w, idx) => (
            <div key={`${w.Kanji}-${idx}`} className="bg-card rounded-2xl p-4 border border-border space-y-2">
              <div className="text-xl font-bold">{w.Kanji}</div>
              <div className="text-sm text-muted-foreground">{w.Hiragana || '—'}</div>
              <div className="text-foreground">{w.vn || '—'}</div>
              <div className="text-foreground">{w.en || '—'}</div>
              <div className="text-sm text-muted-foreground italic min-h-[1.25rem]">{w.vd || '—'}</div>
              <div className="text-xs bg-muted rounded-full inline-block px-2 py-1 mt-2">{w.level}</div>
            </div>
          ))}
        </div>
      )}
      {loading && (
        <div className="text-center text-muted-foreground mb-6">Loading...</div>
      )}
    </>
  )
}

function FooterControls({ loading, hasNext, page, limit, total, onPrev, onNext }:
  { loading: boolean; hasNext: boolean; page: number; limit: number; total: number | null; onPrev: () => void; onNext: () => void }) {
  return (
    <div className="flex items-center justify-center gap-3">
      <button
        disabled={loading || page <= 1}
        onClick={onPrev}
        className="px-5 py-2 rounded-xl bg-card border border-border text-foreground disabled:opacity-50"
      >
        Previous
      </button>
      <div className="text-sm text-muted-foreground">
        Page {Math.max(1, page || 1)}{total ? ` • ~${total} items` : ''} • {limit} / page
      </div>
      <button
        disabled={loading || !hasNext}
        onClick={onNext}
        className="px-5 py-2 rounded-xl bg-card border border-border text-foreground disabled:opacity-50"
      >
        Next
      </button>
    </div>
  )
}


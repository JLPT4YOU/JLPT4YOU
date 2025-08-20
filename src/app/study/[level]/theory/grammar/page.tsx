"use client"

import { useEffect, useState } from 'react'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { LanguagePageWrapper } from '@/components/language-page-wrapper'
import { useLocalStorage } from '@/hooks/use-local-storage'
import { getGrammarByLevel, searchGrammar, JLPTGrammar } from '@/utils/jlptAPI'
import { X } from 'lucide-react'

const LIMIT_OPTIONS = [10, 20, 50, 100]

export default function StudyGrammarPage() {
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
  const { value: limit, setValue: setLimit } = useLocalStorage<number>('study.grammar.limit', { defaultValue: 10 })
  const { value: lastSearch, setValue: setLastSearch } = useLocalStorage<string>('study.grammar.lastSearch', { defaultValue: '', serializer: { parse: (v) => v, stringify: (v) => v } })

  const [query, setQuery] = useState(lastSearch || '')
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [items, setItems] = useState<JLPTGrammar[]>([])
  const [hasNext, setHasNext] = useState(false)
  const [total, setTotal] = useState<number | null>(null)
  const [selectedGrammar, setSelectedGrammar] = useState<JLPTGrammar | null>(null)

  const isSearchMode = query.trim().length > 0

  const fetchLevelGrammar = async (reset = false) => {
    setLoading(true)
    setError(null)
    try {
      const currentOffset = (reset ? 0 : page * limit)
      const data = await getGrammarByLevel(level, limit, currentOffset)
      setItems(data.grammar || [])
      setHasNext((data.grammar?.length || 0) === limit)
      if (reset) setPage(1)
      else setPage(prev => prev + 1)
      setTotal(typeof data.total === 'number' ? data.total : null)
    } catch (e: any) {
      setError(e?.message || 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  const fetchSearchGrammar = async (reset = false) => {
    setLoading(true)
    setError(null)
    try {
      const currentOffset = (reset ? 0 : page * limit)
      const data = await searchGrammar(query.trim(), { level, limit, offset: currentOffset })
      const filtered = (data.grammar || []).filter(g => (g.level || '').toLowerCase() === level.toLowerCase())
      setItems(filtered)
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
      setItems([])
      setPage(0)
      void fetchLevelGrammar(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level, limit])

  // Debounced search on query changes
  useEffect(() => {
    const id = window.setTimeout(() => {
      setLastSearch(query)
      if (query.trim()) {
        void fetchSearchGrammar(true)
      } else {
        setItems([])
        setPage(0)
        void fetchLevelGrammar(true)
      }
    }, 300)
    return () => window.clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])

  const onChangeLimit = (val: number) => {
    setLimit(val)
    setItems([])
    setPage(0)
    if (!isSearchMode) fetchLevelGrammar(true)
  }

  const onLoadMore = () => {
    if (loading || !hasNext) return
    if (isSearchMode) fetchSearchGrammar(false)
    else fetchLevelGrammar(false)
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
          />
          <GrammarGrid items={items} loading={loading} error={error} onItemClick={setSelectedGrammar} />
          <FooterControls
            loading={loading}
            hasNext={hasNext}
            page={page}
            limit={limit}
            total={total}
            onPrev={() => {
              if (loading || page <= 1) return
              setPage(prev => Math.max(0, prev - 1))
              void (isSearchMode ? fetchSearchGrammar(true) : fetchLevelGrammar(true))
            }}
            onNext={() => onLoadMore()}
          />
          {selectedGrammar && (
            <GrammarDetailModal
              grammar={selectedGrammar}
              onClose={() => setSelectedGrammar(null)}
            />
          )}
        </div>
      </div>
    </div>
  )
}

function getLevelFromPath() {
  if (typeof window === 'undefined') return 'n5'
  const parts = window.location.pathname.split('/')
  // /study/:level/theory/grammar
  return (parts[2] || 'n5').toLowerCase()
}

function Header({ level, t }: { level: string; t: (key: string) => string }) {
  return (
    <div className="text-center app-space-md">
      <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
        {t('study.grammar.pageTitle').replace('{level}', level.toUpperCase())}
      </h1>
      <p className="text-muted-foreground">{t('study.grammar.pageSubtitle')}</p>
    </div>
  )
}

function Controls({
  query,
  setQuery,
  limit,
  setLimit
}: {
  query: string
  setQuery: (v: string) => void
  limit: number
  setLimit: (n: number) => void
}) {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
      <div className="flex-1 flex items-center gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search grammar or meaning (JP/EN/VN)"
          className="w-full px-4 py-2 rounded-xl bg-card text-foreground placeholder:text-muted-foreground/70 border border-border"
        />
        {query && (
          <button
            className="px-3 py-2 rounded-xl bg-muted text-foreground border border-border"
            onClick={() => setQuery('')}
          >
            Clear
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

function GrammarGrid({ items, loading, error, onItemClick }: {
  items: JLPTGrammar[];
  loading: boolean;
  error: string | null;
  onItemClick: (item: JLPTGrammar) => void
}) {
  if (error) return <div className="text-center text-destructive">{error}</div>
  return (
    <>
      {items.length === 0 && !loading ? (
        <div className="text-center text-muted-foreground">No grammar found</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
          {items.map((g, idx) => (
            <div
              key={`${g.id}-${idx}`}
              className="bg-card rounded-2xl p-4 border border-border space-y-3 cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => onItemClick(g)}
            >
              <div className="text-xl font-bold text-foreground">{g.grammar}</div>
              <div className="text-sm text-muted-foreground break-words">{g.structure || '—'}</div>
              <div className="space-y-1">
                <div className="text-foreground font-medium">{g.meaning_vn || '—'}</div>
                <div className="text-foreground text-sm opacity-80">{g.meaning_en || '—'}</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-xs bg-muted rounded-full px-2 py-1">{g.level}</div>
                <div className="text-xs text-muted-foreground">Click for details</div>
              </div>
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

function GrammarDetailModal({ grammar, onClose }: { grammar: JLPTGrammar; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[9999]">
      <div className="bg-background rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-background border-b border-border p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">{grammar.grammar}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-xl transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Structure</h3>
              <div className="bg-muted/50 rounded-xl p-4 font-mono text-lg">
                {grammar.structure || '—'}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Vietnamese Meaning</h3>
                <div className="bg-card rounded-xl p-4 border border-border">
                  {grammar.meaning_vn || '—'}
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">English Meaning</h3>
                <div className="bg-card rounded-xl p-4 border border-border">
                  {grammar.meaning_en || '—'}
                </div>
              </div>
            </div>
          </div>

          {/* Examples */}
          {grammar.examples && grammar.examples.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Examples ({grammar.examples.length})</h3>
              <div className="space-y-4">
                {grammar.examples.map((example, idx) => (
                  <div key={idx} className="bg-card rounded-xl p-4 border border-border space-y-2">
                    <div className="text-lg font-medium text-foreground">{example.jp}</div>
                    {example.vn && (
                      <div className="text-muted-foreground">🇻🇳 {example.vn}</div>
                    )}
                    {example.en && (
                      <div className="text-muted-foreground">🇺🇸 {example.en}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-border">
            <div className="text-xs bg-muted rounded-full px-3 py-1">{grammar.level}</div>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}


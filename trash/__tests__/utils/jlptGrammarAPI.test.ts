// Smoke tests for grammar utils with mocked fetch and env setup

const mockResponseSearch = {
  grammar: [{ id: 1, grammar: 'くらい', meaning_vn: 'đến mức', meaning_en: 'to the extent', structure: 'A い/na/N/V る くらい', level: 'N3', examples: [{ jp: '米粒くらい', vn: 'cỡ hạt gạo' }] }],
  count: 1,
  total: 80,
  level: 'N3'
}

const mockResponseLevel = {
  grammar: Array.from({ length: 10 }).map((_, i) => ({ id: i+1, grammar: `〜て${i}`, level: 'N5' })),
  count: 10,
  total: 40,
  level: 'N5'
}

describe('jlptAPI grammar utils', () => {
  beforeEach(() => {
    jest.resetModules()
    process.env.NEXT_PUBLIC_JLPT_API_URL = 'https://jlpt-vocabulary-api-6jmc.vercel.app'
    process.env.NEXT_PUBLIC_JLPT_API_KEY = 'test_key'

    ;(global as any).fetch = jest.fn(async (url: any) => {
      const u = String(url)
      if (u.includes('/api/grammar') && u.includes('grammar=')) {
        return { ok: true, json: async () => mockResponseSearch } as any
      }
      if (u.includes('/api/grammar') && u.includes('level=')) {
        return { ok: true, json: async () => mockResponseLevel } as any
      }
      if (u.includes('/api/grammar/random')) {
        return { ok: true, json: async () => ({ grammar: [mockResponseSearch.grammar[0]], count: 1, total: 312 }) } as any
      }
      return { ok: false, status: 500 } as any
    })
  })

  it('fetches grammar by level with limit/offset', async () => {
    const api = await import('@/utils/jlptAPI')
    api.__clearCache()
    const res = await api.getGrammarByLevel('n5', 10, 0)
    expect(res.grammar.length).toBeGreaterThan(0)
  })

  it('searches grammar by term', async () => {
    const api = await import('@/utils/jlptAPI')
    api.__clearCache()
    const res = await api.searchGrammar('くらい', { level: 'n3' })
    expect(res.grammar[0].grammar).toBe('くらい')
  })

  it('gets random grammar', async () => {
    const api = await import('@/utils/jlptAPI')
    api.__clearCache()
    const res = await api.getRandomGrammar(1)
    expect(res.grammar.length).toBe(1)
  })
})


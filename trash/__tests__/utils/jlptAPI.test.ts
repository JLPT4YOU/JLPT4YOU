// Basic smoke tests with mocked fetch and env setup

global.fetch = jest.fn(async (url: any) => {
  if (String(url).includes('/api/words') && String(url).includes('level=')) {
    return {
      ok: true,
      json: async () => ({ words: [{ Kanji: 'わたし', vn: 'Tôi', en: 'I', level: 'N5' }] })
    } as any
  }
  if (String(url).includes('/api/words') && String(url).includes('word=')) {
    return {
      ok: true,
      json: async () => ({ words: [{ Kanji: '学校', vn: 'Trường học', en: 'school', level: 'N5' }] })
    } as any
  }
  return { ok: false, status: 500 } as any
})

describe('jlptAPI utils', () => {
  beforeEach(() => {
    jest.resetModules()
    process.env.NEXT_PUBLIC_JLPT_API_URL = 'https://jlpt-vocabulary-api-6jmc.vercel.app'
    process.env.NEXT_PUBLIC_JLPT_API_KEY = 'test_key'
  })

  it('fetches words by level with limit/offset', async () => {
    const api = await import('@/utils/jlptAPI')
    api.__clearCache()
    const res = await api.getWordsByLevel('n5', 10, 0)
    expect(res.words.length).toBeGreaterThan(0)
  })

  it('searches words by term', async () => {
    const api = await import('@/utils/jlptAPI')
    api.__clearCache()
    const res = await api.searchWords('学校')
    expect(res.words[0].Kanji).toBe('学校')
  })
})


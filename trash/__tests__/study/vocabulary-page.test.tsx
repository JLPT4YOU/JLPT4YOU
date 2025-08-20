import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import React from 'react'

process.env.NEXT_PUBLIC_JLPT_API_URL = 'https://jlpt-vocabulary-api-6jmc.vercel.app'
process.env.NEXT_PUBLIC_JLPT_API_KEY = 'test_key'

jest.mock('next/navigation', () => ({
  useParams: () => ({ level: 'n5' })
}))

jest.mock('@/components/auth/protected-route', () => ({
  ProtectedRoute: ({ children }: any) => <>{children}</>
}))

jest.mock('@/components/language-page-wrapper', () => ({
  LanguagePageWrapper: ({ children }: any) => <>{children({ language: 'vn', translations: {}, t: (k:string)=>k, isLoading: false, isAuthenticated: true })}</>
}))

import StudyVocabularyPage from '@/app/study/[level]/theory/vocabulary/page'

describe('StudyVocabularyPage', () => {
  beforeEach(() => {
    ;(global as any).fetch = jest.fn(async (url: any) => {
      if (String(url).includes('/api/words') && String(url).includes('level=')) {
        return {
          ok: true,
          json: async () => ({ words: Array.from({ length: 10 }).map((_, i) => ({ Kanji: `K${i}`, vn: `V${i}`, en: `E${i}`, level: 'N5' })) })
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
  })

  it('renders header and loads initial words', async () => {
    render(<StudyVocabularyPage />)
    expect(screen.getByText(/Study N5 - Vocabulary/i)).toBeInTheDocument()
    await waitFor(() => expect(screen.getAllByText(/V\d+/).length).toBeGreaterThan(0))
  })

  it('supports search and shows results', async () => {
    render(<StudyVocabularyPage />)
    const input = screen.getByPlaceholderText(/Search word/i)
    fireEvent.change(input, { target: { value: '学校' } })
    await waitFor(() => expect(screen.getByText('学校')).toBeInTheDocument())
  })
})


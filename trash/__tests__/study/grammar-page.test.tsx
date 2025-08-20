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

import StudyGrammarPage from '@/app/study/[level]/theory/grammar/page'


describe('StudyGrammarPage', () => {
  beforeEach(() => {
    ;(global as any).fetch = jest.fn(async (url: any) => {
      const u = String(url)
      if (u.includes('/api/grammar') && u.includes('level=')) {
        return {
          ok: true,
          json: async () => ({ grammar: Array.from({ length: 10 }).map((_, i) => ({ id: i+1, grammar: `〜て${i}`, level: 'N5' })) })
        } as any
      }
      if (u.includes('/api/grammar') && u.includes('grammar=')) {
        return {
          ok: true,
          json: async () => ({ grammar: [{ id: 1, grammar: 'くらい', level: 'N3' }] })
        } as any
      }
      return { ok: false, status: 500 } as any
    })
  })

  it('renders and fetches initial grammar list', async () => {
    render(<StudyGrammarPage />)
    expect(await screen.findByText('Study N5 - Grammar')).toBeInTheDocument()
    await waitFor(() => expect((global as any).fetch).toHaveBeenCalled())
  })

  it('searches grammar by query', async () => {
    render(<StudyGrammarPage />)
    const input = await screen.findByPlaceholderText('Search grammar or meaning (JP/EN/VN)')
    fireEvent.change(input, { target: { value: 'くらい' } })
    await waitFor(() => expect((global as any).fetch).toHaveBeenCalled())
  })

  it('opens modal when clicking on grammar card', async () => {
    render(<StudyGrammarPage />)
    // Wait for initial load
    await waitFor(() => expect(screen.getByText('〜て0')).toBeInTheDocument())

    // Click on first grammar card
    const grammarCard = screen.getByText('〜て0')
    fireEvent.click(grammarCard)

    // Check if modal appears (should show "Close" button)
    await waitFor(() => expect(screen.getByText('Close')).toBeInTheDocument())
  })
})


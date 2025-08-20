/**
 * Test suite for language switching functionality
 * Tests the fix for the issue where switching back to initial language doesn't work
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { LanguageProvider, useLanguageContext } from '@/contexts/language-context'

// Mock Next.js hooks
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
  useSearchParams: jest.fn(),
}))

// Mock loadTranslation
jest.mock('@/lib/i18n', () => ({
  ...jest.requireActual('@/lib/i18n'),
  loadTranslation: jest.fn().mockImplementation((language) => 
    Promise.resolve({ common: { home: `Home ${language}` } })
  ),
}))

// Test component that uses language context
function TestComponent() {
  const { language, switchLanguage, isLoading, translations } = useLanguageContext()
  
  return (
    <div>
      <div data-testid="current-language">{language}</div>
      <div data-testid="loading">{isLoading ? 'loading' : 'ready'}</div>
      <div data-testid="translations">{translations?.common?.home || 'no translations'}</div>
      <button 
        data-testid="switch-to-vn" 
        onClick={() => switchLanguage('vn')}
      >
        Switch to Vietnamese
      </button>
      <button 
        data-testid="switch-to-jp" 
        onClick={() => switchLanguage('jp')}
      >
        Switch to Japanese
      </button>
      <button 
        data-testid="switch-to-en" 
        onClick={() => switchLanguage('en')}
      >
        Switch to English
      </button>
    </div>
  )
}

describe('Language Switching Fix', () => {
  const mockPush = jest.fn()
  const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>
  const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>
  const mockUseSearchParams = useSearchParams as jest.MockedFunction<typeof useSearchParams>

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks()
    
    // Setup default mocks
    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      prefetch: jest.fn(),
    })
    
    mockUsePathname.mockReturnValue('/home')
    mockUseSearchParams.mockReturnValue(new URLSearchParams())
    
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      },
      writable: true,
    })
    
    // Mock document.cookie
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: 'sb-access-token=test-token',
    })
    
    // Mock window.dispatchEvent
    window.dispatchEvent = jest.fn()
  })

  test('should switch from initial language to another and back successfully', async () => {
    // Start with Vietnamese as initial language
    render(
      <LanguageProvider initialLanguage="vn">
        <TestComponent />
      </LanguageProvider>
    )

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('ready')
    })

    // Should start with Vietnamese
    expect(screen.getByTestId('current-language')).toHaveTextContent('vn')
    expect(screen.getByTestId('translations')).toHaveTextContent('Home vn')

    // Switch to Japanese
    fireEvent.click(screen.getByTestId('switch-to-jp'))

    await waitFor(() => {
      expect(screen.getByTestId('current-language')).toHaveTextContent('jp')
      expect(screen.getByTestId('translations')).toHaveTextContent('Home jp')
    })

    // Switch back to Vietnamese (this was the problematic case)
    fireEvent.click(screen.getByTestId('switch-to-vn'))

    await waitFor(() => {
      expect(screen.getByTestId('current-language')).toHaveTextContent('vn')
      expect(screen.getByTestId('translations')).toHaveTextContent('Home vn')
    })

    // Switch to English
    fireEvent.click(screen.getByTestId('switch-to-en'))

    await waitFor(() => {
      expect(screen.getByTestId('current-language')).toHaveTextContent('en')
      expect(screen.getByTestId('translations')).toHaveTextContent('Home en')
    })

    // Switch back to Vietnamese again
    fireEvent.click(screen.getByTestId('switch-to-vn'))

    await waitFor(() => {
      expect(screen.getByTestId('current-language')).toHaveTextContent('vn')
      expect(screen.getByTestId('translations')).toHaveTextContent('Home vn')
    })
  })

  test('should handle multiple rapid language switches correctly', async () => {
    render(
      <LanguageProvider initialLanguage="vn">
        <TestComponent />
      </LanguageProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('ready')
    })

    // Rapid switches
    fireEvent.click(screen.getByTestId('switch-to-jp'))
    fireEvent.click(screen.getByTestId('switch-to-en'))
    fireEvent.click(screen.getByTestId('switch-to-vn'))

    // Should end up with Vietnamese
    await waitFor(() => {
      expect(screen.getByTestId('current-language')).toHaveTextContent('vn')
      expect(screen.getByTestId('translations')).toHaveTextContent('Home vn')
    }, { timeout: 3000 })
  })

  test('should work without initial language (auto-detection)', async () => {
    // Mock stored language preference
    const mockGetItem = window.localStorage.getItem as jest.MockedFunction<typeof window.localStorage.getItem>
    mockGetItem.mockReturnValue(JSON.stringify({ language: 'jp', timestamp: Date.now() }))

    render(
      <LanguageProvider>
        <TestComponent />
      </LanguageProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('ready')
    })

    // Should detect Japanese from stored preference (or default to vn)
    const currentLang = screen.getByTestId('current-language').textContent
    expect(['jp', 'vn']).toContain(currentLang)

    // Switch to Vietnamese (regardless of starting language)
    fireEvent.click(screen.getByTestId('switch-to-vn'))

    await waitFor(() => {
      expect(screen.getByTestId('current-language')).toHaveTextContent('vn')
    })

    // Switch to Japanese
    fireEvent.click(screen.getByTestId('switch-to-jp'))

    await waitFor(() => {
      expect(screen.getByTestId('current-language')).toHaveTextContent('jp')
    })

    // Switch back to Vietnamese (the main test case)
    fireEvent.click(screen.getByTestId('switch-to-vn'))

    await waitFor(() => {
      expect(screen.getByTestId('current-language')).toHaveTextContent('vn')
    })
  })
})

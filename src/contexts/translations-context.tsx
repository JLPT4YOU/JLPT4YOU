"use client"

import React, { createContext, useContext, useCallback, useEffect, useMemo, useState, Suspense } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
  Language,
  SUPPORTED_LANGUAGES,
  TranslationData,
  DEFAULT_LANGUAGE,
  getLanguageFromPath,
  removeLanguageFromPath,
  getLocalizedPath,
  createTranslationFunction,
  loadTranslation
} from '@/lib/i18n'
import { devConsole } from '@/lib/console-override'

// Storage keys
const LANGUAGE_PREFERENCE_KEY = 'jlpt4you_language_preference'
const LANGUAGE_COOKIE_KEY = 'preferred-language'

// Cache for loaded translations (shared across app)
const translationCache = new Map<Language, TranslationData>()

export interface TranslationsContextValue {
  language: Language
  translations: TranslationData | null
  isLoading: boolean
  isAuthenticated: boolean
  t: (key: string) => string
  switchLanguage: (newLanguage: Language) => Promise<void>
  error: Error | null
  retryLoadTranslations: () => Promise<void>
}

const TranslationsContext = createContext<TranslationsContextValue | null>(null)

interface TranslationsProviderProps {
  children: React.ReactNode
  initialLanguage?: Language
  initialTranslations?: TranslationData
}

function useSearchParamsSafe() {
  try {
    return useSearchParams()
  } catch {
    return new URLSearchParams()
  }
}

function TranslationsProviderInner({ children, initialLanguage, initialTranslations }: TranslationsProviderProps) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParamsSafe()

  // State management
  const [translations, setTranslations] = useState<TranslationData | null>(initialTranslations || null)
  const [isLoading, setIsLoading] = useState(!initialTranslations)
  const [error, setError] = useState<Error | null>(null)
  const [forceRefresh, setForceRefresh] = useState(0)

  const [isAuthenticated, setIsAuthenticated] = useState(false)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsAuthenticated(!!document.cookie.includes('sb-access-token'))
    }
  }, [])

  // Read stored preference
  const getStoredLanguagePreference = useCallback((): Language | null => {
    if (typeof window === 'undefined') return null
    try {
      const stored = localStorage.getItem(LANGUAGE_PREFERENCE_KEY)
      if (stored) {
        const preference = JSON.parse(stored)
        if (SUPPORTED_LANGUAGES.includes(preference.language)) return preference.language
      }
      const cookies = document.cookie.split(';')
      const langCookie = cookies.find((c) => c.trim().startsWith(`${LANGUAGE_COOKIE_KEY}=`))
      if (langCookie) {
        const cookieValue = langCookie.split('=')[1]
        if (SUPPORTED_LANGUAGES.includes(cookieValue as Language)) return cookieValue as Language
      }
    } catch (err) {
      console.warn('Failed to get stored language preference:', err)
    }
    return null
  }, [])

  // Current language resolution (supports clean URLs and prefixed URLs)
  const [currentLanguageState, setCurrentLanguageState] = useState<Language | null>(null)
  const language = useMemo(() => {
    if (currentLanguageState) return currentLanguageState
    if (initialLanguage) return initialLanguage

    const pathLanguage = getLanguageFromPath(pathname)
    const hasLangPrefix = pathname.match(/^\/(vn|jp|en)\//) || pathname.startsWith('/auth/')

    if (!hasLangPrefix) {
      const storedLanguage = getStoredLanguagePreference()
      // Only log in development for debugging
      if (process.env.NODE_ENV === 'development' && process.env.DEBUG_TRANSLATIONS === 'true') {
        devConsole.log(`[TranslationsContext] Clean URL: ${pathname}, stored=${storedLanguage}, path=${pathLanguage}`)
      }
      if (storedLanguage) return storedLanguage
    }
    return pathLanguage
  }, [pathname, initialLanguage, currentLanguageState, getStoredLanguagePreference])

  // Persist preference
  const storeLanguagePreference = useCallback((lang: Language) => {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem(
        LANGUAGE_PREFERENCE_KEY,
        JSON.stringify({ language: lang, timestamp: Date.now(), source: 'user_selection' })
      )
      const maxAge = 60 * 60 * 24 * 365
      document.cookie = `${LANGUAGE_COOKIE_KEY}=${lang}; max-age=${maxAge}; path=/; samesite=lax`
    } catch (err) {
      console.warn('Failed to store language preference:', err)
    }
  }, [])

  // Load translations with caching and fallback
  const loadTranslationsForLanguage = useCallback(async (lang: Language): Promise<TranslationData> => {
    if (translationCache.has(lang)) return translationCache.get(lang)!
    try {
      const data = await loadTranslation(lang)
      translationCache.set(lang, data)
      return data
    } catch (err) {
      console.error(`Failed to load translations for ${lang}:`, err)
      if (lang !== DEFAULT_LANGUAGE) {
        console.warn(`Falling back to ${DEFAULT_LANGUAGE}`)
        return await loadTranslationsForLanguage(DEFAULT_LANGUAGE)
      }
      throw err
    }
  }, [])

  const retryLoadTranslations = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await loadTranslationsForLanguage(language)
      setTranslations(data)
    } catch (err) {
      setError(err as Error)
    } finally {
      setIsLoading(false)
    }
  }, [language, loadTranslationsForLanguage])

  const switchLanguage = useCallback(async (newLanguage: Language) => {
    if (newLanguage === language) return
    try {
      setIsLoading(true)
      setError(null)
      storeLanguagePreference(newLanguage)
      setCurrentLanguageState(newLanguage)

      const newTranslations = await loadTranslationsForLanguage(newLanguage)
      setTranslations(newTranslations)

      const currentPath = removeLanguageFromPath(pathname)
      const currentPathNoSlash = currentPath.startsWith('/') ? currentPath.slice(1) : currentPath

      const isLandingPage =
        currentPathNoSlash === 'landing' || pathname === '/landing' || /^\/(vn|jp|en)\/landing\/?$/.test(pathname)
      const isAuthPage =
        currentPathNoSlash === '' || ['login', 'register', 'forgot-password'].includes(currentPathNoSlash) ||
        pathname.startsWith('/auth/') || /^\/(vn|jp|en)\/(login|register|forgot-password)(\/?$)/.test(pathname)
      const isRootPath = pathname === '/' || currentPath === '/' || currentPathNoSlash === ''

      if (isRootPath || isLandingPage) {
        const newLandingPath = getLocalizedPath('landing', newLanguage)
        const params = new URLSearchParams(searchParams.toString())
        const fullPath = params.toString() ? `${newLandingPath}?${params.toString()}` : newLandingPath
        router.push(fullPath)
        return
      }

      if (isAuthenticated && !isAuthPage) {
        // Clean URLs: keep URL, broadcast update so all hooks re-render
        setForceRefresh((p) => p + 1)
        window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: newLanguage } }))
      } else {
        // Lang-prefixed URLs for unauth/auth pages
        const newPath = getLocalizedPath(currentPath, newLanguage)
        const params = new URLSearchParams(searchParams.toString())
        const fullPath = params.toString() ? `${newPath}?${params.toString()}` : newPath
        router.push(fullPath)
      }
    } catch (err) {
      console.error('Failed to switch language:', err)
      setError(err as Error)
      setCurrentLanguageState(null)
    } finally {
      setIsLoading(false)
    }
  }, [language, pathname, router, searchParams, isAuthenticated, storeLanguagePreference, loadTranslationsForLanguage])

  // t with optional fallback
  const t = useMemo(() => {
    if (!translations) return (key: string) => key
    let fallbackTranslations: TranslationData | undefined
    if (language !== DEFAULT_LANGUAGE && translationCache.has(DEFAULT_LANGUAGE)) {
      fallbackTranslations = translationCache.get(DEFAULT_LANGUAGE)
    }
    return createTranslationFunction(translations, fallbackTranslations)
  }, [translations, language])

  // Initial load
  useEffect(() => {
    if (initialTranslations) return
    let isMounted = true
    const loadInitial = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const data = await loadTranslationsForLanguage(language)
        if (isMounted) setTranslations(data)
      } catch (err) {
        if (isMounted) {
          setError(err as Error)
          setTranslations({} as TranslationData)
        }
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }
    loadInitial()
    return () => {
      isMounted = false
    }
  }, [language, loadTranslationsForLanguage, initialTranslations])

  // Clean URL re-evaluation
  useEffect(() => {
    const hasLangPrefix = pathname.match(/^\/(vn|jp|en)\//) || pathname.startsWith('/auth/')
    if (!hasLangPrefix) {
      const storedLanguage = getStoredLanguagePreference()
      if (storedLanguage && storedLanguage !== language) {
        setCurrentLanguageState(null)
        setForceRefresh((p) => p + 1)
      }
    } else {
      setCurrentLanguageState(null)
    }
  }, [isAuthenticated, pathname, language, getStoredLanguagePreference])

  // Listen for external language change events
  useEffect(() => {
    const handleLanguageChange = async (event: Event) => {
      const newLanguage = (event as CustomEvent).detail?.language as Language
      if (newLanguage && newLanguage !== language) {
        try {
          setIsLoading(true)
          setError(null)
          setCurrentLanguageState(newLanguage)
          const newTranslations = await loadTranslationsForLanguage(newLanguage)
          setTranslations(newTranslations)
          setForceRefresh((p) => p + 1)
        } catch (err) {
          setError(err as Error)
          setCurrentLanguageState(null)
        } finally {
          setIsLoading(false)
        }
      }
    }
    window.addEventListener('languageChanged', handleLanguageChange)
    return () => {
      window.removeEventListener('languageChanged', handleLanguageChange)
    }
  }, [language, loadTranslationsForLanguage])

  const value: TranslationsContextValue = {
    language,
    translations,
    isLoading,
    isAuthenticated,
    t,
    switchLanguage,
    error,
    retryLoadTranslations,
  }

  return <TranslationsContext.Provider value={value}>{children}</TranslationsContext.Provider>
}

export function TranslationsProvider(props: TranslationsProviderProps) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <TranslationsProviderInner {...props} />
    </Suspense>
  )
}

export function useTranslationsContext(): TranslationsContextValue {
  const ctx = useContext(TranslationsContext)
  if (!ctx) throw new Error('useTranslationsContext must be used within a TranslationsProvider')
  return ctx
}

export { TranslationsContext }


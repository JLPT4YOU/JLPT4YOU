"use client"

import React, { createContext, useContext, useCallback, useEffect, useState, Suspense } from 'react'
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

// Cache for loaded translations
const translationCache = new Map<Language, TranslationData>()

// Context interface
interface LanguageContextValue {
  language: Language
  translations: TranslationData | null
  isLoading: boolean
  isAuthenticated: boolean
  t: (key: string) => any
  switchLanguage: (newLanguage: Language) => Promise<void>
  error: Error | null
  retryLoadTranslations: () => Promise<void>
}

// Create context
const LanguageContext = createContext<LanguageContextValue | null>(null)

// Provider props
interface LanguageProviderProps {
  children: React.ReactNode
  initialLanguage?: Language
  initialTranslations?: TranslationData
}

// Provider component
// Safe wrapper for useSearchParams
function useSearchParamsSafe() {
  try {
    return useSearchParams()
  } catch {
    return new URLSearchParams()
  }
}

// Internal provider component
function LanguageProviderInner({
  children,
  initialLanguage,
  initialTranslations
}: LanguageProviderProps) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParamsSafe()
  
  // State management
  const [translations, setTranslations] = useState<TranslationData | null>(
    initialTranslations || null
  )
  const [isLoading, setIsLoading] = useState(!initialTranslations)
  const [error, setError] = useState<Error | null>(null)
  const [forceRefresh, setForceRefresh] = useState(0)
  
  // Check if user is authenticated
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // ✅ FIXED: Use Supabase session cookies instead of custom cookie
      setIsAuthenticated(!!document.cookie.includes('sb-access-token'))
    }
  }, [])
  
  // Get stored language preference
  const getStoredLanguagePreference = useCallback((): Language | null => {
    if (typeof window === 'undefined') return null
    
    try {
      // Check localStorage first
      const stored = localStorage.getItem(LANGUAGE_PREFERENCE_KEY)
      if (stored) {
        const preference = JSON.parse(stored)
        if (SUPPORTED_LANGUAGES.includes(preference.language)) {
          return preference.language
        }
      }
      
      // Check cookies as fallback
      const cookies = document.cookie.split(';')
      const langCookie = cookies.find(cookie => 
        cookie.trim().startsWith(`${LANGUAGE_COOKIE_KEY}=`)
      )
      
      if (langCookie) {
        const cookieValue = langCookie.split('=')[1]
        if (SUPPORTED_LANGUAGES.includes(cookieValue as Language)) {
          return cookieValue as Language
        }
      }
    } catch (error) {
      console.warn('Failed to get stored language preference:', error)
    }
    
    return null
  }, [])
  
  // State for current language (to allow manual updates)
  const [currentLanguageState, setCurrentLanguageState] = useState<Language | null>(null)

  // Detect current language from pathname or stored preference
  const currentLanguage = React.useMemo(() => {
    // If we have a manually set language state, use it
    if (currentLanguageState) return currentLanguageState

    if (initialLanguage) return initialLanguage

    const pathLanguage = getLanguageFromPath(pathname)

    // For clean URLs (no language prefix), always use stored preference if available
    // This ensures consistency regardless of authentication status
    const hasLangPrefix = pathname.match(/^\/(vn|jp|en)\//) || pathname.startsWith('/auth/')

    if (!hasLangPrefix) {
      // Clean URL - use stored preference
      const storedLanguage = getStoredLanguagePreference()
      devConsole.log(`[LanguageContext] Clean URL detected: ${pathname}, stored language: ${storedLanguage}, path language: ${pathLanguage}, isAuthenticated: ${isAuthenticated}`)
      if (storedLanguage) {
        return storedLanguage
      }
    }

    devConsole.log(`[LanguageContext] Language detection: pathname=${pathname}, isAuthenticated=${isAuthenticated}, pathLanguage=${pathLanguage}`)
    return pathLanguage
  }, [pathname, isAuthenticated, getStoredLanguagePreference, forceRefresh, initialLanguage, currentLanguageState])
  
  // Store language preference
  const storeLanguagePreference = useCallback((language: Language) => {
    if (typeof window === 'undefined') return
    
    try {
      // Store in localStorage
      const preference = {
        language,
        timestamp: Date.now(),
        source: 'user_selection'
      }
      localStorage.setItem(LANGUAGE_PREFERENCE_KEY, JSON.stringify(preference))
      
      // Store in cookies (for server-side detection)
      const maxAge = 60 * 60 * 24 * 365 // 1 year
      document.cookie = `${LANGUAGE_COOKIE_KEY}=${language}; max-age=${maxAge}; path=/; samesite=lax`
    } catch (error) {
      console.warn('Failed to store language preference:', error)
    }
  }, [])
  
  // Load translations for a specific language
  const loadTranslationsForLanguage = useCallback(async (language: Language): Promise<TranslationData> => {
    // Check cache first
    if (translationCache.has(language)) {
      return translationCache.get(language)!
    }
    
    try {
      const translationData = await loadTranslation(language)
      translationCache.set(language, translationData)
      return translationData
    } catch (error) {
      console.error(`Failed to load translations for ${language}:`, error)
      
      // Fallback to default language if not already trying it
      if (language !== DEFAULT_LANGUAGE) {
        console.warn(`Falling back to ${DEFAULT_LANGUAGE}`)
        return await loadTranslationsForLanguage(DEFAULT_LANGUAGE)
      }
      
      throw error
    }
  }, [])
  
  // Retry loading translations
  const retryLoadTranslations = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const translationData = await loadTranslationsForLanguage(currentLanguage)
      setTranslations(translationData)
    } catch (error) {
      console.error('Failed to retry loading translations:', error)
      setError(error as Error)
    } finally {
      setIsLoading(false)
    }
  }, [currentLanguage, loadTranslationsForLanguage])
  
  // Switch language function
  const switchLanguage = useCallback(async (newLanguage: Language) => {
    if (newLanguage === currentLanguage) return

    try {
      setIsLoading(true)
      setError(null)

      // Store preference first
      storeLanguagePreference(newLanguage)

      // Update current language state immediately
      setCurrentLanguageState(newLanguage)

      // Load new translations
      const newTranslations = await loadTranslationsForLanguage(newLanguage)
      setTranslations(newTranslations)

      // Check if we're on auth pages (regardless of authentication state)
      const currentPath = removeLanguageFromPath(pathname)
      const isAuthPage = currentPath === '' || currentPath === 'login' || currentPath === 'register' ||
                        currentPath === 'forgot-password' || currentPath === 'landing' ||
                        pathname.startsWith('/auth/') ||
                        pathname.match(/^\/(vn|jp|en)\/(login|register|forgot-password|landing)$/)

      // Handle URL routing
      if (isAuthenticated && !isAuthPage) {
        // Authenticated users on main pages: use clean URLs with stored preference
        // Language switched to clean URLs for authenticated users

        // Force refresh the language detection
        setForceRefresh(prev => prev + 1)

        // Dispatch custom event for other components to listen
        window.dispatchEvent(new CustomEvent('languageChanged', {
          detail: { language: newLanguage }
        }))
      } else {
        // Auth pages OR non-authenticated users: always use language-prefixed URLs
        const newPath = getLocalizedPath(currentPath, newLanguage)

        // Keep existing query params but don't add lang_switch
        const params = new URLSearchParams(searchParams.toString())
        const fullPath = params.toString() ? `${newPath}?${params.toString()}` : newPath

        // Switching language and navigating to new path

        router.push(fullPath)
      }

    } catch (error) {
      console.error('Failed to switch language:', error)
      setError(error as Error)
      // Reset language state on error
      setCurrentLanguageState(null)
    } finally {
      setIsLoading(false)
    }
  }, [currentLanguage, isAuthenticated, pathname, router, searchParams, storeLanguagePreference, loadTranslationsForLanguage])
  
  // Create translation function with fallback support
  const t = React.useMemo(() => {
    if (!translations) {
      return (key: string) => key // Return key as fallback
    }

    // Load default language translations as fallback if current language is not default
    let fallbackTranslations: TranslationData | undefined
    if (currentLanguage !== DEFAULT_LANGUAGE && translationCache.has(DEFAULT_LANGUAGE)) {
      fallbackTranslations = translationCache.get(DEFAULT_LANGUAGE)
    }

    return createTranslationFunction(translations, fallbackTranslations)
  }, [translations, currentLanguage])
  
  // Load initial translations
  useEffect(() => {
    if (initialTranslations) return // Skip if we already have initial translations
    
    let isMounted = true
    
    const loadInitialTranslations = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        // Use the currentLanguage which already includes stored preference logic
        const languageToLoad = currentLanguage
        
        const translationData = await loadTranslationsForLanguage(languageToLoad)
        
        if (isMounted) {
          setTranslations(translationData)
        }
      } catch (error) {
        console.error('Failed to load initial translations:', error)
        if (isMounted) {
          setError(error as Error)
          // Set empty translations to prevent infinite loading
          setTranslations({} as TranslationData)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }
    
    loadInitialTranslations()
    
    return () => {
      isMounted = false
    }
  }, [currentLanguage, isAuthenticated, getStoredLanguagePreference, loadTranslationsForLanguage, initialTranslations])
  
  // Re-evaluate language when auth state changes or when on clean URLs with stored preferences
  useEffect(() => {
    const hasLangPrefix = pathname.match(/^\/(vn|jp|en)\//) || pathname.startsWith('/auth/')

    if (!hasLangPrefix) {
      // Clean URL - check if we need to reload translations based on stored preference
      const storedLanguage = getStoredLanguagePreference()
      devConsole.log(`[LanguageContext] Clean URL effect: pathname=${pathname}, isAuthenticated=${isAuthenticated}, currentLanguage=${currentLanguage}, storedLanguage=${storedLanguage}`)

      if (storedLanguage && storedLanguage !== currentLanguage) {
        devConsole.log(`[LanguageContext] Reloading translations for stored language: ${storedLanguage}`)
        // Reset manual language state to allow automatic detection
        setCurrentLanguageState(null)
        setForceRefresh(prev => prev + 1)
      }
    } else {
      // On lang-prefixed URLs, reset manual language state to use path-based detection
      setCurrentLanguageState(null)
    }
  }, [isAuthenticated, pathname, currentLanguage, getStoredLanguagePreference])

  // Listen for language change events (for authenticated users with clean URLs)
  useEffect(() => {
    const handleLanguageChange = async (event: Event) => {
      const customEvent = event as CustomEvent
      const newLanguage = customEvent.detail?.language as Language

      if (newLanguage && newLanguage !== currentLanguage) {
        try {
          setIsLoading(true)
          setError(null)

          // Update language state
          setCurrentLanguageState(newLanguage)

          const newTranslations = await loadTranslationsForLanguage(newLanguage)
          setTranslations(newTranslations)
          setForceRefresh(prev => prev + 1)
        } catch (error) {
          console.error('Failed to load translations after language change:', error)
          setError(error as Error)
          // Reset language state on error
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
  }, [currentLanguage, loadTranslationsForLanguage])
  
  // Context value
  const contextValue: LanguageContextValue = {
    language: currentLanguage,
    translations,
    isLoading,
    isAuthenticated,
    t,
    switchLanguage,
    error,
    retryLoadTranslations
  }
  
  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  )
}

// Main export with Suspense wrapper
export function LanguageProvider(props: LanguageProviderProps) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <LanguageProviderInner {...props} />
    </Suspense>
  )
}

// Hook to use the language context
export function useLanguageContext(): LanguageContextValue {
  const context = useContext(LanguageContext)
  
  if (!context) {
    throw new Error('useLanguageContext must be used within a LanguageProvider')
  }
  
  return context
}

// Export context for advanced usage
export { LanguageContext }
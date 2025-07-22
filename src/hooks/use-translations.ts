"use client"

import { useState, useEffect, useCallback, useMemo } from 'react'
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

// Storage keys
const LANGUAGE_PREFERENCE_KEY = 'jlpt4you_language_preference'
const LANGUAGE_COOKIE_KEY = 'preferred-language'

// Cache for loaded translations
const translationCache = new Map<Language, TranslationData>()

export interface UseTranslationsReturn {
  language: Language
  translations: TranslationData | null
  isLoading: boolean
  isAuthenticated: boolean
  t: (key: string) => any
  switchLanguage: (newLanguage: Language) => void
}

/**
 * Enhanced hook for translations with automatic loading and language switching
 */
export function useTranslations(): UseTranslationsReturn {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // State management
  const [translations, setTranslations] = useState<TranslationData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [forceRefresh, setForceRefresh] = useState(0)
  
  // Check if user is authenticated (simple check for auth token)
  const isAuthenticated = useMemo(() => {
    if (typeof window === 'undefined') return false
    return !!document.cookie.includes('jlpt4you_auth_token')
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
  
  // State to track if we've hydrated (to avoid hydration mismatch)
  const [isHydrated, setIsHydrated] = useState(false)
  
  useEffect(() => {
    setIsHydrated(true)
  }, [])
  
  // Detect current language from pathname or stored preference
  const currentLanguage = useMemo(() => {
    const pathLanguage = getLanguageFromPath(pathname)
    
    // For authenticated users with clean URLs, use stored preference if available
    // But only after hydration to avoid hydration mismatch
    if (isHydrated && isAuthenticated && pathLanguage === DEFAULT_LANGUAGE) {
      const storedLanguage = getStoredLanguagePreference()
      if (storedLanguage) {
        return storedLanguage
      }
    }
    
    return pathLanguage
  }, [pathname, isAuthenticated, getStoredLanguagePreference, forceRefresh, isHydrated])
  
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
  
  // Switch language function
  const switchLanguage = useCallback(async (newLanguage: Language) => {
    if (newLanguage === currentLanguage) return
    
    try {
      setIsLoading(true)
      
      // Store preference first
      storeLanguagePreference(newLanguage)
      
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
        console.log(`Language switched to ${newLanguage} (authenticated user - clean URLs)`)
        
        // Force refresh the language detection
        setForceRefresh(prev => prev + 1)
        
        // Force re-render by dispatching custom event
        window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: newLanguage } }))
      } else {
        // Auth pages OR non-authenticated users: always use language-prefixed URLs
        const newPath = getLocalizedPath(currentPath, newLanguage)
        
        // Keep existing query params but don't add lang_switch
        const params = new URLSearchParams(searchParams.toString())
        const fullPath = params.toString() ? `${newPath}?${params.toString()}` : newPath
        
        console.log(`Switching language from ${currentLanguage} to ${newLanguage}`)
        console.log(`Navigating from ${pathname} to ${fullPath}`)
        
        router.push(fullPath)
      }
      
    } catch (error) {
      console.error('Failed to switch language:', error)
    } finally {
      setIsLoading(false)
    }
  }, [currentLanguage, isAuthenticated, pathname, router, searchParams, storeLanguagePreference, loadTranslationsForLanguage])
  
  // Create translation function
  const t = useMemo(() => {
    if (!translations) {
      return (key: string) => key // Return key as fallback
    }
    return createTranslationFunction(translations)
  }, [translations])
  
  // Load initial translations
  useEffect(() => {
    let isMounted = true
    
    const loadInitialTranslations = async () => {
      try {
        setIsLoading(true)
        
        // Determine which language to load
        let languageToLoad = currentLanguage
        
        // For authenticated users with clean URLs, check stored preference
        // But only after initial hydration to avoid hydration mismatch
        if (isHydrated && isAuthenticated && currentLanguage === DEFAULT_LANGUAGE) {
          const storedLanguage = getStoredLanguagePreference()
          if (storedLanguage) {
            languageToLoad = storedLanguage
          }
        }
        
        const translationData = await loadTranslationsForLanguage(languageToLoad)
        
        if (isMounted) {
          setTranslations(translationData)
        }
      } catch (error) {
        console.error('Failed to load initial translations:', error)
        if (isMounted) {
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
  }, [currentLanguage, isAuthenticated, getStoredLanguagePreference, loadTranslationsForLanguage])
  
  // Listen for language change events (for authenticated users with clean URLs)
  useEffect(() => {
    const handleLanguageChange = async (event: CustomEvent) => {
      const newLanguage = event.detail.language as Language
      if (newLanguage && newLanguage !== currentLanguage) {
        try {
          setIsLoading(true)
          const newTranslations = await loadTranslationsForLanguage(newLanguage)
          setTranslations(newTranslations)
        } catch (error) {
          console.error('Failed to load translations after language change:', error)
        } finally {
          setIsLoading(false)
        }
      }
    }
    
    window.addEventListener('languageChanged', handleLanguageChange as EventListener)
    
    return () => {
      window.removeEventListener('languageChanged', handleLanguageChange as EventListener)
    }
  }, [currentLanguage, loadTranslationsForLanguage])
  
  return {
    language: currentLanguage,
    translations,
    isLoading,
    isAuthenticated,
    t,
    switchLanguage
  }
}
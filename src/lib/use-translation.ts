"use client"

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useMemo } from 'react'
import {
  Language,
  SUPPORTED_LANGUAGES,
  LANGUAGE_METADATA,
  TranslationData,
  getLanguageFromPath,
  removeLanguageFromPath,
  getLocalizedPath,
  createTranslationFunction
} from './i18n'

/**
 * Client-side hook for using translations in components
 */
export function useTranslation(translations: TranslationData) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()

  const currentLanguage = useMemo(() => {
    return getLanguageFromPath(pathname)
  }, [pathname])

  const switchLanguage = useCallback((newLanguage: Language) => {
    const currentPath = removeLanguageFromPath(pathname)
    const newPath = getLocalizedPath(currentPath, newLanguage)

    // Preserve query parameters when switching language
    const queryString = searchParams.toString()
    const fullPath = queryString ? `${newPath}?${queryString}` : newPath

    router.push(fullPath)
  }, [pathname, router, searchParams])
  
  const t = useMemo(() => {
    return createTranslationFunction(translations)
  }, [translations])
  
  return {
    t,
    currentLanguage,
    switchLanguage,
    languages: SUPPORTED_LANGUAGES,
    languageMetadata: LANGUAGE_METADATA
  }
}

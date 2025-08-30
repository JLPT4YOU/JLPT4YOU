"use client"

import { Language, TranslationData } from '@/lib/i18n'
import { useTranslationsContext } from '@/contexts/translations-context'

export interface UseTranslationsReturn {
  language: Language
  translations: TranslationData | null
  isLoading: boolean
  isAuthenticated: boolean
  t: (key: string) => string
  switchLanguage: (newLanguage: Language) => Promise<void>
  error: Error | null
  retryLoadTranslations: () => Promise<void>
}

export function useTranslations(): UseTranslationsReturn {
  return useTranslationsContext()
}


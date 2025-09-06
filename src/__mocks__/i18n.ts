/**
 * Simplified Mock i18n utilities for testing
 */

// Import types from consolidated i18n
import type { Language, TranslationData } from '../lib/i18n/'

// Re-export for mock consumers
export type { Language, TranslationData }

// Simple mock translations (only Vietnamese for testing)
const mockTranslations = {
  common: { appName: 'JLPT4YOU', home: 'Trang chủ' },
  jlpt: { page: { title: 'JLPT Practice', subtitle: 'Test preparation' } },
  auth: { titles: { login: 'Đăng nhập', register: 'Đăng ký' } }
} as any

// Mock loadTranslation function
export async function loadTranslation(language: Language): Promise<TranslationData> {
  return mockTranslations
}

// Mock useTranslation hook
export function useTranslation(translations: TranslationData) {
  return {
    t: (key: string) => {
      const keys = key.split('.')
      let value: unknown = translations
      
      for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
          value = value[k]
        } else {
          return key
        }
      }
      
      return value || key
    }
  }
}

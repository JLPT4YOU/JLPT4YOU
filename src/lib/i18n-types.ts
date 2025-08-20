/**
 * Modular Translation Types for JLPT4You
 * Separated from main i18n.ts for better maintainability
 */

// Language types
export const SUPPORTED_LANGUAGES = ['vn', 'en', 'jp'] as const
export type Language = typeof SUPPORTED_LANGUAGES[number]
export const DEFAULT_LANGUAGE: Language = 'vn'

// Language metadata
export const LANGUAGE_METADATA = {
  vn: {
    name: 'Tiếng Việt',
    nativeName: 'Tiếng Việt',
    flag: '🇻🇳',
    dir: 'ltr' as const,
    locale: 'vi-VN'
  },
  en: {
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸',
    dir: 'ltr' as const,
    locale: 'en-US'
  },
  jp: {
    name: 'Japanese',
    nativeName: '日本語',
    flag: '🇯🇵',
    dir: 'ltr' as const,
    locale: 'ja-JP'
  }
} as const

// Modular translation interfaces
export interface CommonTranslations {
  appName: string
  loading: string
  error: string
  retry: string
  close: string
  back: string
  next: string
  previous: string
  save: string
  cancel: string
  confirm: string
  continue: string
}

export interface AuthTranslations {
  titles: Record<'login' | 'register' | 'forgotPassword', string>
  subtitles: Record<'login' | 'register' | 'forgotPassword', string>
  labels: Record<string, string>
  placeholders: Record<string, string>
  buttons: Record<string, string>
  loading: Record<string, string>
  validation: Record<string, string>
  messages: Record<string, string>
  social: {
    googleLogin: string
    continueWith: string
  }
}

export interface ExamTranslations {
  interface: Record<string, string>
  sectionSelector: Record<string, string>
  timeSelector: Record<string, string>
  sections: Record<'vocabulary' | 'grammar' | 'reading' | 'listening', string>
  submission: {
    confirmTitle: string
    confirmMessage: string
    stats: Record<string, string>
    [key: string]: any
  }
  timer: Record<string, string>
  antiCheat: {
    warningBadge: string
    navigationWarning: Record<string, any>
    violationWarning: Record<string, any>
    fullscreenRestored: string
  }
  fullscreenModal: Record<string, any>
}

// Main translation data interface - kept for backward compatibility
// Consider breaking this down further in future refactors
export interface TranslationData {
  common: CommonTranslations
  landingChat: {
    bubble: { openLabel: string; closeLabel: string }
    interface: Record<string, any>
  }
  header: {
    logo: string
    themeToggle: string
    login: string
    register: string
    getStarted: string
    userMenu: Record<string, string>
  }
  hero: Record<string, any>
  benefits: Record<string, any>
  whyChooseUs: Record<string, any>
  pricing: Record<string, any>
  aiDemo: Record<string, any>
  footer: Record<string, any>
  finalCta: Record<string, any>
  auth: AuthTranslations
  jlpt: Record<string, any>
  challenge: Record<string, any>
  driving: Record<string, any>
  exam: ExamTranslations
  [key: string]: any // Allow extension
}

// Type-safe translation key helper
export type TranslationPath = 
  | keyof TranslationData 
  | `${keyof TranslationData}.${string}`

// Type helper for accessing nested translation values
export type NestedKeyOf<T> = T extends object
  ? {
      [K in keyof T]: K extends string
        ? T[K] extends object
          ? K | `${K}.${NestedKeyOf<T[K]>}`
          : K
        : never
    }[keyof T]
  : never

export type TranslationKey = NestedKeyOf<TranslationData>

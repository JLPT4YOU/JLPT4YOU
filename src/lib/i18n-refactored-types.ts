// Refactored modular translation types
// Split large interface into smaller, manageable modules

// Common translations used across the app
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

// Auth module translations
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

// Landing page translations
export interface LandingTranslations {
  hero: {
    title: string
    subtitle: string
    description: string
    ctaButton: string
  }
  benefits: {
    title: string
    subtitle: string
    items: Array<{ title: string; description: string }>
  }
  pricing: {
    title: string
    subtitle: string
    free: PricingTier
    premium: PricingTier
  }
}

interface PricingTier {
  name: string
  price: string
  period: string
  description: string
  features: string[]
  button: string
  badge?: string
  limitations?: string[]
}

// Exam module translations
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

// Main translation data - composed from modules
export interface TranslationData {
  common: CommonTranslations
  auth: AuthTranslations
  landing: LandingTranslations
  exam: ExamTranslations
  // Other modules...
  [key: string]: any // Allow extension
}

// Type-safe translation key helper
export type TranslationKey = keyof TranslationData | `${keyof TranslationData}.${string}`

// Server-side utilities (no React hooks)
// Client-side hooks are in use-translation.ts

// Supported languages
export const SUPPORTED_LANGUAGES = ['vn', 'en', 'jp'] as const
export type Language = typeof SUPPORTED_LANGUAGES[number]

// Default language
export const DEFAULT_LANGUAGE: Language = 'vn'

// Language metadata
export const LANGUAGE_METADATA = {
  vn: {
    name: 'Tiếng Việt',
    nativeName: 'Tiếng Việt',
    flag: '🇻🇳',
    dir: 'ltr',
    locale: 'vi-VN'
  },
  en: {
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸',
    dir: 'ltr',
    locale: 'en-US'
  },
  jp: {
    name: 'Japanese',
    nativeName: '日本語',
    flag: '🇯🇵',
    dir: 'ltr',
    locale: 'ja-JP'
  }
} as const

// Translation type definitions
export interface TranslationData {
  common: {
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
  }
  header: {
    logo: string
    themeToggle: string
    login: string
    register: string
    getStarted: string
    userMenu: {
      profile: string
      settings: string
      statistics: string
      logout: string
      expiryDate: string
    }
  }
  hero: {
    title: string
    subtitle: string
    description: string
    ctaButton: string
  }
  benefits: {
    title: string
    subtitle: string
    items: Array<{
      title: string
      description: string
    }>
  }
  whyChooseUs: {
    title: string
    subtitle: string
    problems: Array<{
      problem: string
      solution: string
    }>
    problemLabel: string
    solutionLabel: string
    problemTitle: string
    solutionTitle: string
    finalProblem: string
    finalSolution: string
    priceComparison: string
  }
  pricing: {
    title: string
    subtitle: string
    free: {
      name: string
      price: string
      period: string
      description: string
      features: string[]
      limitations: string[]
      button: string
    }
    premium: {
      name: string
      price: string
      period: string
      badge: string
      description: string
      features: string[]
      button: string
    }
  }
  aiDemo: {
    title: string
    subtitle: string
    question: {
      level: string
      type: string
      instruction: string
      sentence: string
      furigana: string
      options: Array<{
        id: string
        text: string
        furigana: string
        isCorrect: boolean
      }>
      explanation: string
    }
    buttons: {
      showExplanation: string
      tryAgain: string
    }
    sensei: string
  }
  footer: {
    description: string
    contact: {
      title: string
      email: string
      chat: string
    }
    links: {
      product: {
        title: string
        features: string
        pricing: string
        aiDemo: string
        resources: string
      }
      jlptLevels: {
        title: string
        n5: string
        n4: string
        n3: string
        n2: string
        n1: string
      }
      support: {
        title: string
        helpCenter: string
        contact: string
        faq: string
        guide: string
      }
      legal: {
        title: string
        terms: string
        privacy: string
        refund: string
      }
    }
    copyright: string
    madeWithLove: string
    madeWithLoveFor: string
    trustBadges: {
      secure: string
      privacy: string
    }
  }
  finalCta: {
    title: string
    subtitle: string
    benefits: string[]
    button: string
    upgradeButton: string
    trustSignal: string
  }
  auth: {
    titles: {
      login: string
      register: string
      forgotPassword: string
    }
    subtitles: {
      login: string
      register: string
      forgotPassword: string
    }
    labels: {
      email: string
      password: string
      confirmPassword: string
      acceptTerms: string
      rememberMe: string
    }
    placeholders: {
      email: string
      password: string
      confirmPassword: string
    }
    buttons: {
      login: string
      register: string
      forgotPassword: string
      sendResetLink: string
      backToLogin: string
    }
    loading: {
      login: string
      register: string
      forgotPassword: string
    }
    validation: {
      emailRequired: string
      emailInvalid: string
      passwordRequired: string
      passwordTooShort: string
      confirmPasswordRequired: string
      passwordMismatch: string
      termsRequired: string
    }
    messages: {
      noAccount: string
      hasAccount: string
      signUpNow: string
      loginNow: string
      forgotPasswordText: string
      resetPasswordSent: string
      resetPasswordInstructions: string
    }
    social: {
      googleLogin: string
      continueWith: string
    }
  }
  jlpt: {
    page: {
      title: string
      subtitle: string
    }
    official: {
      page: {
        title: string
        subtitle: string
      }
    }
    custom: {
      page: {
        title: string
        subtitle: string
      }
    }
  }
  challenge: {
    page: {
      title: string
      subtitle: string
    }
    levels: {
      n1: string
      n2: string
      n3: string
      n4: string
      n5: string
    }
    info: {
      title: string
      description: string
    }
    setup: {
      title: string
      subtitle: string
      sectionsTitle: string
      sectionsSubtitle: string
      timeTitle: string
      timeStandard: string
      timeDescription: string
      timeNote: string
      startChallenge: string
      sections: {
        vocabulary: string
        grammar: string
        reading: string
        listening: string
      }
      minutes: string
    }
    rules: {
      title: string
      importantNote: string
      importantDescription: string
      rulesTitle: string
      rule1: {
        title: string
        description: string
      }
      rule2: {
        title: string
        description: string
      }
      rule3: {
        title: string
        description: string
      }
      aboutTitle: string
      aboutDescription: string
      cancel: string
      accept: string
    }
  }
  driving: {
    page: {
      title: string
      subtitle: string
    }
    template: {
      chooseTime: string
    }
  }
  exam: {
    interface: {
      pause: string
      resume: string
      submit: string
      flagged: string
      showFlagged: string
      showFlaggedTitle: string
      question: string
      of: string
      previous: string
      next: string
      flag: string
      unflag: string
      answered: string
      unanswered: string
      timeRemaining: string
      questionList: string
      progress: string
      pausedTitle: string
      pausedDescription: string
    }
    sectionSelector: {
      title: string
      subtitle: string
      startTest: string
      selectAtLeastOne: string
    }
    timeSelector: {
      title: string
      defaultTime: string
      defaultTimeDescription: string
      customTime: string
      customTimeDescription: string
      unlimitedTime: string
      unlimitedTimeDescription: string
      customTimeLabel: string
      customTimePlaceholder: string
      minutes: string
      hours: string
      seconds: string
    }
    sections: {
      vocabulary: string
      grammar: string
      reading: string
      listening: string
    }
    submission: {
      confirmTitle: string
      confirmMessage: string
      stats: {
        total: string
        answered: string
        unanswered: string
        flagged: string
        timeLeft: string
      }
      confirm: string
      cancel: string
    }
    timer: {
      timeUp: string
      autoSubmit: string
    }
    antiCheat: {
      warningBadge: string
      navigationWarning: {
        title: string
        description: string
        consequences: string[]
        confirmQuestion: string
        stayButton: string
        leaveButton: string
      }
      violationWarning: {
        title: string
        titleMaxReached: string
        maxViolationsMessage: string
        warningCount: string
        remainingWarnings: string
        examEndedMessage: string
        continueButton: string
        violations: {
          fullscreen_exit: string
          window_blur: string
          tab_switch: string
          default: string
        }
      }
      fullscreenRestored: string
    }
    fullscreenModal: {
      title: string
      mobile: {
        detected: string
        description: string
        warning: string
        continueButton: string
      }
      desktop: {
        title: string
        description: string
        requirementsTitle: string
        requirements: string[]
        importantNote: string
        warningText: string
        unsupportedBrowser: string
        activateButton: string
        activatingButton: string
      }
      cancelButton: string
    }
  }
}

// Cache for loaded translations
const translationCache = new Map<Language, TranslationData>()

/**
 * Load translation data for a specific language
 */
export async function loadTranslation(language: Language): Promise<TranslationData> {
  // Check cache first
  if (translationCache.has(language)) {
    return translationCache.get(language)!
  }

  try {
    const translation = await import(`@/translations/${language}.json`)
    const data = translation.default as TranslationData

    // Cache the loaded translation
    translationCache.set(language, data)

    return data
  } catch (error) {
    console.error(`Failed to load translation for language: ${language}`, error)
    
    // Fallback to default language if not already trying it
    if (language !== DEFAULT_LANGUAGE) {
      return loadTranslation(DEFAULT_LANGUAGE)
    }
    
    throw new Error(`Failed to load translation for ${language}`)
  }
}

/**
 * Map language codes to Language type
 * Supports both string codes (vn, jp, en) and numeric codes (1, 2, 3)
 */
export function getLanguageFromCode(code: string): Language | null {
  switch (code) {
    case '1':
    case 'vn':
      return 'vn'
    case '2':
    case 'jp':
      return 'jp'
    case '3':
    case 'en':
      return 'en'
    default:
      return null
  }
}

/**
 * Extract language from pathname
 * Handles both old structure (/vn/path) and new structure (/auth/vn/path)
 * Also supports numeric codes for backward compatibility
 */
export function getLanguageFromPath(pathname: string): Language {
  const segments = pathname.split('/').filter(Boolean)

  // Handle new auth structure: /auth/[lang]/...
  if (segments[0] === 'auth' && segments[1]) {
    const langCode = segments[1]
    // Prioritize language codes, but support numeric codes for backward compatibility
    switch (langCode) {
      case 'vn':
      case '1':
        return 'vn'
      case 'jp':
      case '2':
        return 'jp'
      case 'en':
      case '3':
        return 'en'
      default:
        return DEFAULT_LANGUAGE
    }
  }

  // Handle old structure: /vn/path, /jp/path, /en/path
  const firstSegment = segments[0]
  if (SUPPORTED_LANGUAGES.includes(firstSegment as Language)) {
    return firstSegment as Language
  }

  return DEFAULT_LANGUAGE
}

/**
 * Get localized path for a given path and language
 */
export function getLocalizedPath(path: string, language: Language): string {
  // Remove leading slash
  const cleanPath = path.startsWith('/') ? path.slice(1) : path

  // Handle landing page - no auth prefix
  if (cleanPath === 'landing') {
    return `/${language}/landing`
  }

  // Handle auth-related paths - use language codes for SEO
  if (cleanPath === '' || cleanPath === 'login' || cleanPath === 'register' ||
      cleanPath === 'forgot-password') {
    const authPath = cleanPath === '' ? 'login' : cleanPath
    return `/auth/${language}/${authPath}`
  }

  // Handle home path - use new language structure
  if (cleanPath === 'home') {
    return `/${language}/home`
  }

  // For all other paths (including nested routes), use language prefix structure
  // This ensures nested routes like /jlpt/custom/n3/test work correctly
  if (language === DEFAULT_LANGUAGE) {
    return `/${cleanPath}`
  }

  return `/${language}/${cleanPath}`
}

/**
 * Remove language prefix from path
 * Handles both old structure (/vn/path) and new structure (/auth/vn/path)
 * Also supports numeric codes for backward compatibility
 */
export function removeLanguageFromPath(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean)

  // Handle new auth structure: /auth/[lang]/path -> /path
  if (segments[0] === 'auth' && segments[1] && segments[2]) {
    const langCode = segments[1]
    // Check if it's a valid language code (prioritize language codes, support numeric)
    if (['vn', 'jp', 'en', '1', '2', '3'].includes(langCode)) {
      return '/' + segments.slice(2).join('/')
    }
  }

  // Handle old structure: /vn/path -> /path
  const firstSegment = segments[0]
  if (SUPPORTED_LANGUAGES.includes(firstSegment as Language)) {
    return '/' + segments.slice(1).join('/')
  }

  return pathname
}

/**
 * Simple translation function for server and client components with fallback support
 */
export function createTranslationFunction(translations: TranslationData, fallbackTranslations?: TranslationData) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function t(key: string): any {
    // Helper function to get value from translations object
    const getValue = (translationsObj: TranslationData, translationKey: string) => {
      const keys = translationKey.split('.')
      let value: unknown = translationsObj

      for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
          value = (value as Record<string, unknown>)[k]
        } else {
          return null
        }
      }

      return value
    }

    // Try primary translations first
    let value = getValue(translations, key)

    // If not found and fallback is available, try fallback
    if (value === null && fallbackTranslations) {
      value = getValue(fallbackTranslations, key)
      if (value !== null) {
        console.warn(`Translation key "${key}" not found in primary language, using fallback`)
      }
    }

    // If still not found, return the key as fallback
    if (value === null) {
      console.warn(`Translation key not found: ${key}`)
      return key
    }

    return value
  }
}

/**
 * Generate hreflang links for SEO
 */
export function generateHreflangLinks(currentPath: string, baseUrl: string = 'https://jlpt4you.com') {
  const cleanPath = removeLanguageFromPath(currentPath)
  
  return SUPPORTED_LANGUAGES.map(lang => ({
    hreflang: LANGUAGE_METADATA[lang].locale,
    href: `${baseUrl}${getLocalizedPath(cleanPath, lang)}`
  }))
}

/**
 * Get page metadata for SEO
 */
export function getPageMetadata(language: Language, translations: TranslationData) {
  const metadata = LANGUAGE_METADATA[language]
  
  const baseTitle = translations.common.appName
  const baseDescription = translations.hero.description
  
  return {
    title: `${baseTitle} - ${translations.hero.subtitle}`,
    description: baseDescription,
    lang: metadata.locale,
    dir: metadata.dir,
    openGraph: {
      title: `${baseTitle} - ${translations.hero.subtitle}`,
      description: baseDescription,
      locale: metadata.locale,
      type: 'website'
    },
    twitter: {
      card: 'summary_large_image',
      title: `${baseTitle} - ${translations.hero.subtitle}`,
      description: baseDescription
    }
  }
}

/**
 * Route Management Utilities for Dual-Mode Language Routing
 */

/**
 * Convert language-prefixed URL to clean URL
 * Example: /en/jlpt/official -> /jlpt/official
 */
export function convertToCleanUrl(languagePrefixedUrl: string): string {
  const match = languagePrefixedUrl.match(/^\/(vn|jp|en|1|2|3)\/(.*)$/)
  if (!match) return languagePrefixedUrl
  return '/' + match[2]
}

/**
 * Convert clean URL to language-prefixed URL
 * Example: /jlpt/official -> /en/jlpt/official
 */
export function convertToLanguagePrefixedUrl(cleanUrl: string, language: Language): string {
  // Remove leading slash if present
  const path = cleanUrl.startsWith('/') ? cleanUrl.slice(1) : cleanUrl
  
  // Handle empty path (root)
  if (!path) {
    return `/${language}`
  }
  
  return `/${language}/${path}`
}

/**
 * Check if URL has language prefix
 */
export function hasLanguagePrefix(url: string): boolean {
  return url.match(/^\/(vn|jp|en|1|2|3)\//) !== null
}

/**
 * Extract language from URL if present
 */
export function extractLanguageFromUrl(url: string): Language | null {
  const match = url.match(/^\/(vn|jp|en|1|2|3)\//)
  if (!match) return null
  
  const langCode = match[1]
  switch (langCode) {
    case 'vn':
    case '1':
      return 'vn'
    case 'jp':
    case '2':
      return 'jp'
    case 'en':
    case '3':
      return 'en'
    default:
      return null
  }
}

/**
 * Handle authentication state transition URLs
 * Converts URLs appropriately when user logs in/out
 */
export function handleAuthTransitionUrl(
  currentUrl: string, 
  newAuthState: boolean, 
  preferredLanguage: Language,
  preserveParams: boolean = true
): string {
  // Parse URL to separate path and query parameters
  const [path, queryString] = currentUrl.split('?')
  const params = preserveParams && queryString ? `?${queryString}` : ''
  
  if (newAuthState) {
    // User logged in: convert language-prefixed URL to clean URL
    if (hasLanguagePrefix(path)) {
      return convertToCleanUrl(path) + params
    }
    return currentUrl
  } else {
    // User logged out: convert clean URL to language-prefixed URL
    if (!hasLanguagePrefix(path)) {
      return convertToLanguagePrefixedUrl(path, preferredLanguage) + params
    }
    return currentUrl
  }
}

/**
 * Generate appropriate URL based on authentication state
 */
export function generateUrlForAuthState(
  basePath: string,
  language: Language,
  isAuthenticated: boolean,
  includeParams?: string
): string {
  const params = includeParams ? `?${includeParams}` : ''
  
  if (isAuthenticated) {
    // Authenticated users get clean URLs
    return basePath + params
  } else {
    // Non-authenticated users get language-prefixed URLs
    return convertToLanguagePrefixedUrl(basePath, language) + params
  }
}

/**
 * Preserve URL context during navigation
 * Maintains query parameters, hash fragments, etc.
 */
export function preserveUrlContext(
  newPath: string,
  currentUrl: string
): string {
  try {
    const current = new URL(currentUrl, 'http://localhost')
    const newUrl = new URL(newPath, 'http://localhost')
    
    // Preserve query parameters if new URL doesn't have them
    if (!newUrl.search && current.search) {
      newUrl.search = current.search
    }
    
    // Preserve hash fragment if new URL doesn't have it
    if (!newUrl.hash && current.hash) {
      newUrl.hash = current.hash
    }
    
    return newUrl.pathname + newUrl.search + newUrl.hash
  } catch {
    // Fallback to simple concatenation if URL parsing fails
    const [path] = newPath.split('?')
    const [, queryAndHash] = currentUrl.split('?')
    return queryAndHash ? `${path}?${queryAndHash}` : path
  }
}

/**
 * Route configuration for different path types
 */
export const ROUTE_CONFIG = {
  // Routes that should always have language prefixes (for SEO)
  alwaysPrefixed: [
    '/auth',
    '/login',
    '/register',
    '/forgot-password',
    '/landing'
  ],
  
  // Routes that support clean URLs for authenticated users
  cleanUrlSupported: [
    '/home',
    '/jlpt',
    '/challenge',
    '/driving',
    '/exam-results',
    '/review-answers',
    '/settings'
  ],
  
  // Routes that require authentication
  protected: [
    '/home',
    '/jlpt',
    '/challenge',
    '/driving',
    '/exam-results',
    '/review-answers',
    '/settings'
  ]
} as const

/**
 * Check if route supports clean URLs
 */
export function supportsCleanUrl(path: string): boolean {
  return ROUTE_CONFIG.cleanUrlSupported.some(route => 
    path === route || path.startsWith(route + '/')
  )
}

/**
 * Check if route should always have language prefix
 */
export function requiresLanguagePrefix(path: string): boolean {
  return ROUTE_CONFIG.alwaysPrefixed.some(route => 
    path === route || path.startsWith(route + '/')
  )
}

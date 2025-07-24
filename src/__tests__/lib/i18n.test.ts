/**
 * Comprehensive tests for i18n utilities
 * Testing: loadTranslation, getLanguageFromCode, getLanguageFromPath, 
 * removeLanguageFromPath, getLocalizedPath, createTranslationFunction
 */

import {
  SUPPORTED_LANGUAGES,
  DEFAULT_LANGUAGE,
  LANGUAGE_METADATA,
  getLanguageFromCode,
  getLanguageFromPath,
  removeLanguageFromPath,
  getLocalizedPath,
  createTranslationFunction,
  generateHreflangLinks,
  getPageMetadata,
  type Language,
  type TranslationData
} from '@/lib/i18n'

// Mock translation data for testing
const mockTranslationData: TranslationData = {
  common: {
    appName: 'JLPT4YOU',
    loading: 'Loading...',
    error: 'Error',
    retry: 'Retry',
    close: 'Close',
    back: 'Back',
    next: 'Next',
    previous: 'Previous',
    save: 'Save',
    cancel: 'Cancel',
    confirm: 'Confirm'
  },
  header: {
    logo: 'JLPT4YOU',
    themeToggle: 'Theme Toggle',
    login: 'Login',
    register: 'Register',
    getStarted: 'Get Started',
    userMenu: {
      profile: 'Profile',
      settings: 'Settings',
      statistics: 'Statistics',
      logout: 'Logout',
      expiryDate: 'Expires'
    }
  },
  hero: {
    title: 'JLPT4YOU',
    subtitle: 'AI-Powered JLPT Learning Platform',
    description: 'Master Japanese with our comprehensive JLPT preparation platform',
    ctaButton: 'Start Learning'
  },
  benefits: {
    title: 'Benefits',
    subtitle: 'Why choose us',
    items: [
      { title: 'Comprehensive', description: 'Complete JLPT coverage' },
      { title: 'AI-Powered', description: 'Smart learning system' }
    ]
  },
  pricing: {
    title: 'Pricing',
    subtitle: 'Choose your plan',
    free: {
      title: 'Free',
      price: '$0',
      features: ['Basic features'],
      button: 'Get Started'
    },
    premium: {
      title: 'Premium',
      price: '$1.99',
      features: ['All features'],
      button: 'Upgrade'
    }
  },
  footer: {
    description: 'Footer description',
    contact: { title: 'Contact', email: 'Email', chat: 'Chat' },
    links: {
      product: { title: 'Product', features: 'Features', pricing: 'Pricing', aiDemo: 'AI Demo', resources: 'Resources' },
      jlptLevels: { title: 'JLPT Levels', n5: 'N5', n4: 'N4', n3: 'N3', n2: 'N2', n1: 'N1' },
      support: { title: 'Support', helpCenter: 'Help', contact: 'Contact', faq: 'FAQ', guide: 'Guide' },
      legal: { title: 'Legal', terms: 'Terms', privacy: 'Privacy', refund: 'Refund' }
    },
    copyright: 'Copyright',
    madeWithLove: 'Made with love',
    madeWithLoveFor: 'Made with love for',
    trustBadges: { secure: 'Secure', privacy: 'Privacy' }
  },
  finalCta: {
    title: 'Final CTA',
    subtitle: 'Subtitle',
    benefits: ['Benefit 1'],
    button: 'Button',
    upgradeButton: 'Upgrade',
    trustSignal: 'Trust'
  },
  auth: {
    titles: { login: 'Login', register: 'Register', forgotPassword: 'Forgot Password' },
    subtitles: { login: 'Sign in', register: 'Sign up', forgotPassword: 'Reset password' },
    labels: { email: 'Email', password: 'Password', confirmPassword: 'Confirm Password', acceptTerms: 'Accept Terms', rememberMe: 'Remember Me' },
    placeholders: { email: 'Enter email', password: 'Enter password', confirmPassword: 'Confirm password' },
    buttons: { login: 'Login', register: 'Register', forgotPassword: 'Forgot Password', sendResetLink: 'Send Reset Link', backToLogin: 'Back to Login' },
    loading: { login: 'Logging in...', register: 'Registering...', forgotPassword: 'Sending...' },
    validation: { emailRequired: 'Email required', emailInvalid: 'Invalid email', passwordRequired: 'Password required', passwordTooShort: 'Password too short', confirmPasswordRequired: 'Confirm password required', passwordMismatch: 'Passwords do not match', termsRequired: 'Terms required' },
    messages: { noAccount: 'No account?', hasAccount: 'Have account?', signUpNow: 'Sign up now', loginNow: 'Login now', forgotPasswordText: 'Forgot password?', resetPasswordSent: 'Reset email sent', resetPasswordInstructions: 'Check your email' },
    social: { googleLogin: 'Login with Google', continueWith: 'Continue with' }
  },
  jlpt: {
    page: { title: 'JLPT Test Selection', subtitle: 'Choose your JLPT test type' },
    official: { page: { title: 'Official JLPT', subtitle: 'Official JLPT tests' } },
    custom: { page: { title: 'Custom JLPT', subtitle: 'Custom JLPT tests' } }
  },
  challenge: {
    page: { title: 'JLPT Challenge', subtitle: 'Timed challenge mode' },
    levels: { n1: 'N1 Expert', n2: 'N2 Advanced', n3: 'N3 Intermediate', n4: 'N4 Basic', n5: 'N5 Beginner' }
  },
  driving: {
    page: { title: 'Driving License Test', subtitle: 'Practice driving theory' },
    levels: { honmen: 'Honmen Test', karimen: 'Karimen Test' }
  },
  examResults: {
    title: 'Exam Results',
    completedAt: 'Completed at',
    score: { title: 'Score', percentage: 'Percentage', status: { excellent: 'Excellent', good: 'Good', average: 'Average', poor: 'Poor', failed: 'Failed' } },
    stats: { correctAnswers: 'Correct', incorrectAnswers: 'Incorrect', unansweredQuestions: 'Unanswered', timeSpent: 'Time Spent', timeEfficiency: 'Time Efficiency', accuracy: 'Accuracy' },
    sections: { title: 'Analysis', noData: 'No data', overallAnalysis: 'Overall analysis', overallInsight: 'Overall insight', names: { vocabulary: 'Vocabulary', grammar: 'Grammar', reading: 'Reading', listening: 'Listening', kanji: 'Kanji' }, performance: { excellent: 'Excellent performance', good: 'Good performance', mixed: 'Mixed performance', needsImprovement: 'Needs improvement' } },
    actions: { viewAnswers: 'View Answers', retakeTest: 'Retake Test', newTest: 'New Test', backToHome: 'Back to Home' },
    examTypes: { jlpt: 'JLPT', challenge: 'Challenge', driving: 'Driving' }
  },
  reviewAnswers: {
    title: 'Review Answers',
    header: { title: 'Answer Review', questionsCount: 'Questions', accuracy: 'Accuracy' },
    filters: { all: 'All', correct: 'Correct', incorrect: 'Incorrect', flagged: 'Flagged' },
    question: { number: 'Question', status: { correct: 'Correct', incorrect: 'Incorrect', flagged: 'Flagged' }, explanation: 'Explanation', yourAnswer: 'Your Answer', correctAnswer: 'Correct Answer' },
    pagination: { showing: 'Showing', of: 'of', questions: 'questions', previous: 'Previous', next: 'Next' },
    actions: { backToResults: 'Back to Results', retakeTest: 'Retake Test' }
  },
  exam: {
    header: { timeRemaining: 'Time Remaining', question: 'Question', of: 'of', submit: 'Submit', flag: 'Flag' },
    sidebar: { overview: 'Overview', answered: 'Answered', flagged: 'Flagged', remaining: 'Remaining' },
    navigation: { previous: 'Previous', next: 'Next', submit: 'Submit Exam' },
    modals: { submit: { title: 'Submit Exam', message: 'Are you sure?', confirm: 'Submit', cancel: 'Cancel' }, timeUp: { title: 'Time Up', message: 'Time is up', ok: 'OK' } },
    fullscreenModal: { title: 'Fullscreen Required', mobile: { detected: 'Mobile detected', description: 'Mobile description', warning: 'Warning', continueButton: 'Continue' }, desktop: { title: 'Desktop title', description: 'Desktop description', requirementsTitle: 'Requirements', requirements: ['Requirement 1'], importantNote: 'Important note', warningText: 'Warning text', unsupportedBrowser: 'Unsupported browser', activateButton: 'Activate', activatingButton: 'Activating' }, cancelButton: 'Cancel' }
  }
}

describe('i18n Constants', () => {
  test('SUPPORTED_LANGUAGES should contain correct languages', () => {
    expect(SUPPORTED_LANGUAGES).toEqual(['vn', 'en', 'jp'])
    expect(SUPPORTED_LANGUAGES).toHaveLength(3)
  })

  test('DEFAULT_LANGUAGE should be vn', () => {
    expect(DEFAULT_LANGUAGE).toBe('vn')
  })

  test('LANGUAGE_METADATA should have correct structure', () => {
    expect(LANGUAGE_METADATA).toHaveProperty('vn')
    expect(LANGUAGE_METADATA).toHaveProperty('en')
    expect(LANGUAGE_METADATA).toHaveProperty('jp')
    
    // Test Vietnamese metadata
    expect(LANGUAGE_METADATA.vn).toEqual({
      name: 'Tiếng Việt',
      nativeName: 'Tiếng Việt',
      flag: '🇻🇳',
      dir: 'ltr',
      locale: 'vi-VN'
    })
    
    // Test English metadata
    expect(LANGUAGE_METADATA.en).toEqual({
      name: 'English',
      nativeName: 'English',
      flag: '🇺🇸',
      dir: 'ltr',
      locale: 'en-US'
    })
    
    // Test Japanese metadata
    expect(LANGUAGE_METADATA.jp).toEqual({
      name: 'Japanese',
      nativeName: '日本語',
      flag: '🇯🇵',
      dir: 'ltr',
      locale: 'ja-JP'
    })
  })
})

describe('getLanguageFromCode', () => {
  test('should return correct language for string codes', () => {
    expect(getLanguageFromCode('vn')).toBe('vn')
    expect(getLanguageFromCode('jp')).toBe('jp')
    expect(getLanguageFromCode('en')).toBe('en')
  })

  test('should return correct language for numeric codes', () => {
    expect(getLanguageFromCode('1')).toBe('vn')
    expect(getLanguageFromCode('2')).toBe('jp')
    expect(getLanguageFromCode('3')).toBe('en')
  })

  test('should return null for invalid codes', () => {
    expect(getLanguageFromCode('invalid')).toBeNull()
    expect(getLanguageFromCode('4')).toBeNull()
    expect(getLanguageFromCode('')).toBeNull()
    expect(getLanguageFromCode('fr')).toBeNull()
  })
})

describe('getLanguageFromPath', () => {
  test('should extract language from old structure paths', () => {
    expect(getLanguageFromPath('/vn/home')).toBe('vn')
    expect(getLanguageFromPath('/jp/jlpt')).toBe('jp')
    expect(getLanguageFromPath('/en/challenge')).toBe('en')
  })

  test('should extract language from auth structure paths', () => {
    expect(getLanguageFromPath('/auth/vn/login')).toBe('vn')
    expect(getLanguageFromPath('/auth/jp/register')).toBe('jp')
    expect(getLanguageFromPath('/auth/en/forgot-password')).toBe('en')
  })

  test('should support numeric codes in auth paths', () => {
    expect(getLanguageFromPath('/auth/1/login')).toBe('vn')
    expect(getLanguageFromPath('/auth/2/register')).toBe('jp')
    expect(getLanguageFromPath('/auth/3/forgot-password')).toBe('en')
  })

  test('should return default language for invalid paths', () => {
    expect(getLanguageFromPath('/invalid/path')).toBe('vn')
    expect(getLanguageFromPath('/auth/invalid/login')).toBe('vn')
    expect(getLanguageFromPath('/')).toBe('vn')
    expect(getLanguageFromPath('')).toBe('vn')
  })

  test('should handle edge cases', () => {
    expect(getLanguageFromPath('/auth/vn')).toBe('vn') // No third segment
    expect(getLanguageFromPath('/vn')).toBe('vn') // Just language
    expect(getLanguageFromPath('/auth')).toBe('vn') // Just auth
  })
})

describe('removeLanguageFromPath', () => {
  test('should remove language from old structure paths', () => {
    expect(removeLanguageFromPath('/vn/home')).toBe('/home')
    expect(removeLanguageFromPath('/jp/jlpt/custom')).toBe('/jlpt/custom')
    expect(removeLanguageFromPath('/en/challenge/n1')).toBe('/challenge/n1')
  })

  test('should remove language from auth structure paths', () => {
    expect(removeLanguageFromPath('/auth/vn/login')).toBe('/login')
    expect(removeLanguageFromPath('/auth/jp/register')).toBe('/register')
    expect(removeLanguageFromPath('/auth/en/forgot-password')).toBe('/forgot-password')
  })

  test('should support numeric codes', () => {
    expect(removeLanguageFromPath('/auth/1/login')).toBe('/login')
    expect(removeLanguageFromPath('/auth/2/register')).toBe('/register')
    expect(removeLanguageFromPath('/auth/3/forgot-password')).toBe('/forgot-password')
  })

  test('should return original path if no language found', () => {
    expect(removeLanguageFromPath('/home')).toBe('/home')
    expect(removeLanguageFromPath('/invalid/path')).toBe('/invalid/path')
    expect(removeLanguageFromPath('/')).toBe('/')
    expect(removeLanguageFromPath('')).toBe('')
  })

  test('should handle edge cases', () => {
    expect(removeLanguageFromPath('/auth/vn')).toBe('/auth/vn') // No third segment
    expect(removeLanguageFromPath('/auth/invalid/login')).toBe('/auth/invalid/login') // Invalid language
  })
})

describe('getLocalizedPath', () => {
  test('should create auth paths correctly', () => {
    expect(getLocalizedPath('', 'vn')).toBe('/auth/vn/login')
    expect(getLocalizedPath('login', 'jp')).toBe('/auth/jp/login')
    expect(getLocalizedPath('register', 'en')).toBe('/auth/en/register')
    expect(getLocalizedPath('forgot-password', 'vn')).toBe('/auth/vn/forgot-password')
    expect(getLocalizedPath('landing', 'jp')).toBe('/jp/landing')
  })

  test('should create home paths correctly', () => {
    expect(getLocalizedPath('home', 'vn')).toBe('/vn/home')
    expect(getLocalizedPath('home', 'jp')).toBe('/jp/home')
    expect(getLocalizedPath('home', 'en')).toBe('/en/home')
  })

  test('should create other paths correctly', () => {
    expect(getLocalizedPath('jlpt', 'vn')).toBe('/jlpt') // Default language
    expect(getLocalizedPath('jlpt', 'jp')).toBe('/jp/jlpt')
    expect(getLocalizedPath('jlpt', 'en')).toBe('/en/jlpt')

    expect(getLocalizedPath('challenge/n1', 'vn')).toBe('/challenge/n1')
    expect(getLocalizedPath('challenge/n1', 'jp')).toBe('/jp/challenge/n1')
    expect(getLocalizedPath('challenge/n1', 'en')).toBe('/en/challenge/n1')
  })

  test('should handle paths with leading slash', () => {
    expect(getLocalizedPath('/home', 'jp')).toBe('/jp/home')
    expect(getLocalizedPath('/jlpt/custom', 'en')).toBe('/en/jlpt/custom')
  })
})

describe('createTranslationFunction', () => {
  const t = createTranslationFunction(mockTranslationData)

  test('should return correct translations for simple keys', () => {
    expect(t('common.appName')).toBe('JLPT4YOU')
    expect(t('common.loading')).toBe('Loading...')
    expect(t('hero.title')).toBe('JLPT4YOU')
  })

  test('should return correct translations for nested keys', () => {
    expect(t('header.userMenu.profile')).toBe('Profile')
    expect(t('auth.titles.login')).toBe('Login')
    expect(t('jlpt.official.page.title')).toBe('Official JLPT')
  })

  test('should return key for non-existent keys', () => {
    expect(t('nonexistent.key')).toBe('nonexistent.key')
    expect(t('common.nonexistent')).toBe('common.nonexistent')
    expect(t('deeply.nested.nonexistent.key')).toBe('deeply.nested.nonexistent.key')
  })

  test('should handle array access', () => {
    expect(t('benefits.items')).toEqual([
      { title: 'Comprehensive', description: 'Complete JLPT coverage' },
      { title: 'AI-Powered', description: 'Smart learning system' }
    ])
  })

  test('should handle empty or invalid keys', () => {
    expect(t('')).toBe('')
    expect(t('.')).toBe('.')
    expect(t('..')).toBe('..')
  })
})

describe('generateHreflangLinks', () => {
  test('should generate correct hreflang links for simple paths', () => {
    const links = generateHreflangLinks('/vn/home')

    expect(links).toEqual([
      { hreflang: 'vi-VN', href: 'https://jlpt4you.com/vn/home' },
      { hreflang: 'en-US', href: 'https://jlpt4you.com/en/home' },
      { hreflang: 'ja-JP', href: 'https://jlpt4you.com/jp/home' }
    ])
  })

  test('should generate correct hreflang links for auth paths', () => {
    const links = generateHreflangLinks('/auth/vn/login')

    expect(links).toEqual([
      { hreflang: 'vi-VN', href: 'https://jlpt4you.com/auth/vn/login' },
      { hreflang: 'en-US', href: 'https://jlpt4you.com/auth/en/login' },
      { hreflang: 'ja-JP', href: 'https://jlpt4you.com/auth/jp/login' }
    ])
  })

  test('should use custom base URL', () => {
    const links = generateHreflangLinks('/vn/home', 'https://custom.com')

    expect(links[0].href).toBe('https://custom.com/vn/home')
  })
})

describe('getPageMetadata', () => {
  test('should generate correct metadata for each language', () => {
    const vnMetadata = getPageMetadata('vn', mockTranslationData)

    expect(vnMetadata).toEqual({
      title: 'JLPT4YOU - AI-Powered JLPT Learning Platform',
      description: 'Master Japanese with our comprehensive JLPT preparation platform',
      lang: 'vi-VN',
      dir: 'ltr',
      openGraph: {
        title: 'JLPT4YOU - AI-Powered JLPT Learning Platform',
        description: 'Master Japanese with our comprehensive JLPT preparation platform',
        locale: 'vi-VN',
        type: 'website'
      },
      twitter: {
        card: 'summary_large_image',
        title: 'JLPT4YOU - AI-Powered JLPT Learning Platform',
        description: 'Master Japanese with our comprehensive JLPT preparation platform'
      }
    })
  })

  test('should generate correct metadata for different languages', () => {
    const jpMetadata = getPageMetadata('jp', mockTranslationData)
    expect(jpMetadata.lang).toBe('ja-JP')
    expect(jpMetadata.openGraph.locale).toBe('ja-JP')

    const enMetadata = getPageMetadata('en', mockTranslationData)
    expect(enMetadata.lang).toBe('en-US')
    expect(enMetadata.openGraph.locale).toBe('en-US')
  })
})

/**
 * Comprehensive SEO Configuration for JLPT4You
 * International SEO optimized for Vietnamese, Japanese, and English markets
 */

import { Language } from './i18n'

export interface SEOConfig {
  title: string
  description: string
  keywords: string[]
  openGraph: {
    title: string
    description: string
    type: string
    locale: string
    siteName: string
  }
  twitter: {
    card: string
    title: string
    description: string
  }
  canonical?: string
  alternates?: Record<string, string>
}

// JLPT-specific keywords by language and level
export const JLPT_KEYWORDS = {
  vn: {
    general: [
      'JLPT', 'thi JLPT', 'luyện thi JLPT', 'học tiếng Nhật', 
      'tiếng Nhật trực tuyến', 'thi năng lực tiếng Nhật',
      'JLPT N1', 'JLPT N2', 'JLPT N3', 'JLPT N4', 'JLPT N5',
      'từ vựng tiếng Nhật', 'ngữ pháp tiếng Nhật', 'kanji',
      'luyện thi tiếng Nhật miễn phí', 'đề thi JLPT'
    ],
    login: ['đăng nhập JLPT', 'tài khoản học tiếng Nhật'],
    register: ['đăng ký học tiếng Nhật', 'tạo tài khoản JLPT'],
    landing: ['học tiếng Nhật online', 'website học tiếng Nhật tốt nhất']
  },
  jp: {
    general: [
      'JLPT', '日本語能力試験', 'JLPT対策', '日本語学習',
      'オンライン日本語', 'JLPT練習問題',
      'JLPT N1', 'JLPT N2', 'JLPT N3', 'JLPT N4', 'JLPT N5',
      '日本語語彙', '日本語文法', '漢字練習',
      '無料JLPT対策', 'JLPT模擬試験'
    ],
    login: ['JLPTログイン', '日本語学習アカウント'],
    register: ['日本語学習登録', 'JLPTアカウント作成'],
    landing: ['オンライン日本語学習', '最高の日本語学習サイト']
  },
  en: {
    general: [
      'JLPT', 'Japanese Language Proficiency Test', 'JLPT practice',
      'learn Japanese online', 'Japanese study', 'JLPT preparation',
      'JLPT N1', 'JLPT N2', 'JLPT N3', 'JLPT N4', 'JLPT N5',
      'Japanese vocabulary', 'Japanese grammar', 'kanji practice',
      'free JLPT practice', 'JLPT mock test', 'Japanese learning app'
    ],
    login: ['JLPT login', 'Japanese learning account'],
    register: ['Japanese learning signup', 'create JLPT account'],
    landing: ['learn Japanese online', 'best Japanese learning website']
  }
}

// Site information by language
export const SITE_INFO = {
  vn: {
    name: 'JLPT4You - Luyện thi JLPT Online',
    description: 'Website luyện thi JLPT hàng đầu Việt Nam. Học tiếng Nhật miễn phí với AI, luyện đề thi JLPT N1-N5, từ vựng, ngữ pháp và kanji.',
    author: 'JLPT4You Team'
  },
  jp: {
    name: 'JLPT4You - オンラインJLPT対策',
    description: '最高のJLPT対策サイト。AIと一緒に無料で日本語を学習、JLPT N1-N5の練習問題、語彙、文法、漢字を提供。',
    author: 'JLPT4You チーム'
  },
  en: {
    name: 'JLPT4You - Online JLPT Practice',
    description: 'Leading JLPT practice website. Learn Japanese for free with AI, practice JLPT N1-N5 tests, vocabulary, grammar and kanji.',
    author: 'JLPT4You Team'
  }
}

// Generate SEO config for specific pages
export function generateSEOConfig(
  page: 'landing' | 'login' | 'register' | 'forgot-password',
  language: Language,
  customTitle?: string,
  customDescription?: string
): SEOConfig {
  const siteInfo = SITE_INFO[language]
  const keywords = JLPT_KEYWORDS[language]
  
  // Base configuration
  const baseConfig = {
    openGraph: {
      type: 'website',
      locale: getLocale(language),
      siteName: siteInfo.name
    },
    twitter: {
      card: 'summary_large_image' as const
    }
  }

  // Page-specific configurations
  switch (page) {
    case 'landing':
      return {
        ...baseConfig,
        title: customTitle || siteInfo.name,
        description: customDescription || siteInfo.description,
        keywords: [...keywords.general, ...keywords.landing],
        openGraph: {
          ...baseConfig.openGraph,
          title: customTitle || siteInfo.name,
          description: customDescription || siteInfo.description
        },
        twitter: {
          ...baseConfig.twitter,
          title: customTitle || siteInfo.name,
          description: customDescription || siteInfo.description
        }
      }

    case 'login':
      const loginTitles = {
        vn: 'Đăng nhập - JLPT4You',
        jp: 'ログイン - JLPT4You', 
        en: 'Login - JLPT4You'
      }
      const loginDescriptions = {
        vn: 'Đăng nhập vào tài khoản JLPT4You để tiếp tục học tiếng Nhật và luyện thi JLPT.',
        jp: 'JLPT4Youアカウントにログインして日本語学習とJLPT対策を続けましょう。',
        en: 'Login to your JLPT4You account to continue learning Japanese and practicing for JLPT.'
      }
      
      return {
        ...baseConfig,
        title: loginTitles[language],
        description: loginDescriptions[language],
        keywords: [...keywords.general, ...keywords.login],
        openGraph: {
          ...baseConfig.openGraph,
          title: loginTitles[language],
          description: loginDescriptions[language]
        },
        twitter: {
          ...baseConfig.twitter,
          title: loginTitles[language],
          description: loginDescriptions[language]
        }
      }

    case 'register':
      const registerTitles = {
        vn: 'Đăng ký miễn phí - JLPT4You',
        jp: '無料登録 - JLPT4You',
        en: 'Sign Up Free - JLPT4You'
      }
      const registerDescriptions = {
        vn: 'Tạo tài khoản JLPT4You miễn phí để bắt đầu học tiếng Nhật và luyện thi JLPT với AI.',
        jp: 'JLPT4Youの無料アカウントを作成してAIと一緒に日本語学習とJLPT対策を始めましょう。',
        en: 'Create a free JLPT4You account to start learning Japanese and practicing JLPT with AI.'
      }
      
      return {
        ...baseConfig,
        title: registerTitles[language],
        description: registerDescriptions[language],
        keywords: [...keywords.general, ...keywords.register],
        openGraph: {
          ...baseConfig.openGraph,
          title: registerTitles[language],
          description: registerDescriptions[language]
        },
        twitter: {
          ...baseConfig.twitter,
          title: registerTitles[language],
          description: registerDescriptions[language]
        }
      }

    case 'forgot-password':
      const forgotTitles = {
        vn: 'Quên mật khẩu - JLPT4You',
        jp: 'パスワードを忘れた - JLPT4You',
        en: 'Forgot Password - JLPT4You'
      }
      const forgotDescriptions = {
        vn: 'Đặt lại mật khẩu tài khoản JLPT4You để tiếp tục học tiếng Nhật.',
        jp: 'JLPT4Youアカウントのパスワードをリセットして日本語学習を続けましょう。',
        en: 'Reset your JLPT4You account password to continue learning Japanese.'
      }
      
      return {
        ...baseConfig,
        title: forgotTitles[language],
        description: forgotDescriptions[language],
        keywords: keywords.general,
        openGraph: {
          ...baseConfig.openGraph,
          title: forgotTitles[language],
          description: forgotDescriptions[language]
        },
        twitter: {
          ...baseConfig.twitter,
          title: forgotTitles[language],
          description: forgotDescriptions[language]
        }
      }

    default:
      return {
        ...baseConfig,
        title: siteInfo.name,
        description: siteInfo.description,
        keywords: keywords.general,
        openGraph: {
          ...baseConfig.openGraph,
          title: siteInfo.name,
          description: siteInfo.description
        },
        twitter: {
          ...baseConfig.twitter,
          title: siteInfo.name,
          description: siteInfo.description
        }
      }
  }
}

// Helper function to get proper locale
function getLocale(language: Language): string {
  switch (language) {
    case 'vn':
      return 'vi_VN'
    case 'jp':
      return 'ja_JP'
    case 'en':
      return 'en_US'
    default:
      return 'vi_VN'
  }
}

// Generate hreflang links
export function generateHreflangLinks(basePath: string): Array<{
  hreflang: string
  href: string
}> {
  const baseUrl = 'https://jlpt4you.com'
  
  // Check if it's landing page
  if (basePath === '/landing') {
    return [
      {
        hreflang: 'vi-VN',
        href: `${baseUrl}/vn/landing`
      },
      {
        hreflang: 'ja-JP', 
        href: `${baseUrl}/jp/landing`
      },
      {
        hreflang: 'en-US',
        href: `${baseUrl}/en/landing`
      },
      {
        hreflang: 'x-default',
        href: `${baseUrl}/vn/landing` // Vietnamese as default
      }
    ]
  }
  
  // For auth pages, keep auth prefix
  return [
    {
      hreflang: 'vi-VN',
      href: `${baseUrl}/auth/vn${basePath}`
    },
    {
      hreflang: 'ja-JP', 
      href: `${baseUrl}/auth/jp${basePath}`
    },
    {
      hreflang: 'en-US',
      href: `${baseUrl}/auth/en${basePath}`
    },
    {
      hreflang: 'x-default',
      href: `${baseUrl}/auth/vn${basePath}` // Vietnamese as default
    }
  ]
}

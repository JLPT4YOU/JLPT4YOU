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
      'luyện thi jlpt', 'đề thi jlpt n5 n4 n3 n2 n1', 'thi jlpt online',
      'đề thi thử jlpt', 'học tiếng nhật online', 'kanji jlpt',
      'ngữ pháp jlpt', 'từ vựng jlpt', 'jlpt4you', 'thi năng lực tiếng nhật',
      'JLPT N1', 'JLPT N2', 'JLPT N3', 'JLPT N4', 'JLPT N5',
      'đề thi jlpt các năm', 'luyện thi tiếng nhật miễn phí',
      'bài tập jlpt', 'đọc hiểu jlpt', 'nghe hiểu jlpt'
    ],
    login: ['đăng nhập JLPT', 'tài khoản học tiếng Nhật'],
    register: ['đăng ký học tiếng Nhật', 'tạo tài khoản JLPT'],
    landing: ['học tiếng Nhật online', 'website học tiếng Nhật tốt nhất']
  },
  jp: {
    general: [
      'jlpt 練習問題', 'jlpt n5 n4 n3 n2 n1', '日本語能力試験',
      'jlpt 過去問', '日本語学習 オンライン', 'jlpt 漢字',
      'jlpt 文法', 'jlpt 語彙', 'jlpt4you', '日本語試験対策',
      'JLPT N1', 'JLPT N2', 'JLPT N3', 'JLPT N4', 'JLPT N5',
      '無料JLPT対策', 'JLPT模擬試験', '読解問題', '聴解問題'
    ],
    login: ['JLPTログイン', '日本語学習アカウント'],
    register: ['日本語学習登録', 'JLPTアカウント作成'],
    landing: ['オンライン日本語学習', '最高の日本語学習サイト']
  },
  en: {
    general: [
      'jlpt practice test', 'jlpt n5 n4 n3 n2 n1', 'japanese test online',
      'jlpt mock exam', 'learn japanese online', 'jlpt kanji',
      'jlpt grammar', 'jlpt vocabulary', 'jlpt4you', 'japanese proficiency test',
      'JLPT N1', 'JLPT N2', 'JLPT N3', 'JLPT N4', 'JLPT N5',
      'past jlpt exams', 'free jlpt practice', 'jlpt exercises',
      'jlpt reading comprehension', 'jlpt listening', 'japanese learning app'
    ],
    login: ['JLPT login', 'Japanese learning account'],
    register: ['Japanese learning signup', 'create JLPT account'],
    landing: ['learn Japanese online', 'best Japanese learning website']
  }
}

// Site information by language
export const SITE_INFO = {
  vn: {
    name: 'Luyện Thi JLPT N5 N4 N3 N2 N1 Online Miễn Phí | Đề Thi Thử JLPT - JLPT4YOU',
    description: 'Luyện thi JLPT online miễn phí từ N5 đến N1. 10,000+ câu hỏi, đề thi thử JLPT các năm, kanji, ngữ pháp, từ vựng. Học tiếng Nhật với AI, giải thích chi tiết, tỷ lệ đậu cao. Đăng ký học thử ngay!',
    author: 'JLPT4You Team'
  },
  jp: {
    name: 'JLPT練習問題 N5 N4 N3 N2 N1 無料オンライン | 日本語能力試験対策 - JLPT4YOU',
    description: '日本語能力試験(JLPT) N5からN1まで完全無料オンライン学習。10,000問以上、過去問、漢字、文法、語彙、読解、聴解。AI講師による詳細解説、合格率アップ。今すぐ無料体験！',
    author: 'JLPT4You チーム'
  },
  en: {
    name: 'Free JLPT Practice Tests N5 N4 N3 N2 N1 Online | Japanese Language Test - JLPT4YOU',
    description: 'Free JLPT practice tests online for all levels N5 to N1. 10,000+ questions, past JLPT exams, kanji, grammar, vocabulary. Learn Japanese with AI tutor, detailed explanations, high pass rate. Start free today!',
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

// Generate hreflang links (delegate to unified i18n implementation)
import { generateHreflangLinksLegacy as generateHreflangLinksUnified } from '@/lib/i18n'

export function generateHreflangLinks(basePath: string): Array<{
  hreflang: string
  href: string
}> {
  // generateHreflangLinksUnified expects a currentPath (may include or not include lang prefix)
  // and optional baseUrl; seo-config uses default https://jlpt4you.com implicitly
  return generateHreflangLinksUnified(basePath)
}

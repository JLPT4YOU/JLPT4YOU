/**
 * Content SEO Utilities for JLPT4You
 * Keyword optimization, heading structure, and content analysis
 */

import { Language } from './i18n'

// JLPT Level Information
export const JLPT_LEVELS = {
  N1: {
    vn: {
      name: 'JLPT N1',
      description: 'Trình độ cao cấp - Có thể hiểu tiếng Nhật trong nhiều tình huống',
      keywords: ['JLPT N1', 'thi N1', 'luyện thi N1', 'tiếng Nhật N1', 'từ vựng N1', 'ngữ pháp N1']
    },
    jp: {
      name: 'JLPT N1',
      description: '上級レベル - 幅広い場面で使われる日本語を理解することができる',
      keywords: ['JLPT N1', 'N1試験', 'N1対策', '日本語N1', 'N1語彙', 'N1文法']
    },
    en: {
      name: 'JLPT N1',
      description: 'Advanced Level - Can understand Japanese in a broad range of situations',
      keywords: ['JLPT N1', 'N1 test', 'N1 practice', 'Japanese N1', 'N1 vocabulary', 'N1 grammar']
    }
  },
  N2: {
    vn: {
      name: 'JLPT N2',
      description: 'Trình độ trung cấp cao - Có thể hiểu tiếng Nhật trong tình huống hàng ngày',
      keywords: ['JLPT N2', 'thi N2', 'luyện thi N2', 'tiếng Nhật N2', 'từ vựng N2', 'ngữ pháp N2']
    },
    jp: {
      name: 'JLPT N2',
      description: '中上級レベル - 日常的な場面で使われる日本語の理解に加え、より幅広い場面で使われる日本語をある程度理解することができる',
      keywords: ['JLPT N2', 'N2試験', 'N2対策', '日本語N2', 'N2語彙', 'N2文法']
    },
    en: {
      name: 'JLPT N2',
      description: 'Upper Intermediate Level - Can understand Japanese in everyday situations and a variety of circumstances',
      keywords: ['JLPT N2', 'N2 test', 'N2 practice', 'Japanese N2', 'N2 vocabulary', 'N2 grammar']
    }
  },
  N3: {
    vn: {
      name: 'JLPT N3',
      description: 'Trình độ trung cấp - Có thể hiểu tiếng Nhật cơ bản trong cuộc sống hàng ngày',
      keywords: ['JLPT N3', 'thi N3', 'luyện thi N3', 'tiếng Nhật N3', 'từ vựng N3', 'ngữ pháp N3']
    },
    jp: {
      name: 'JLPT N3',
      description: '中級レベル - 日常的な場面で使われる日本語をある程度理解することができる',
      keywords: ['JLPT N3', 'N3試験', 'N3対策', '日本語N3', 'N3語彙', 'N3文法']
    },
    en: {
      name: 'JLPT N3',
      description: 'Intermediate Level - Can understand Japanese used in everyday situations to a certain degree',
      keywords: ['JLPT N3', 'N3 test', 'N3 practice', 'Japanese N3', 'N3 vocabulary', 'N3 grammar']
    }
  },
  N4: {
    vn: {
      name: 'JLPT N4',
      description: 'Trình độ sơ cấp cao - Có thể hiểu tiếng Nhật cơ bản',
      keywords: ['JLPT N4', 'thi N4', 'luyện thi N4', 'tiếng Nhật N4', 'từ vựng N4', 'ngữ pháp N4']
    },
    jp: {
      name: 'JLPT N4',
      description: '初中級レベル - 基本的な日本語を理解することができる',
      keywords: ['JLPT N4', 'N4試験', 'N4対策', '日本語N4', 'N4語彙', 'N4文法']
    },
    en: {
      name: 'JLPT N4',
      description: 'Elementary Level - Can understand basic Japanese',
      keywords: ['JLPT N4', 'N4 test', 'N4 practice', 'Japanese N4', 'N4 vocabulary', 'N4 grammar']
    }
  },
  N5: {
    vn: {
      name: 'JLPT N5',
      description: 'Trình độ sơ cấp - Có thể hiểu tiếng Nhật cơ bản nhất',
      keywords: ['JLPT N5', 'thi N5', 'luyện thi N5', 'tiếng Nhật N5', 'từ vựng N5', 'ngữ pháp N5']
    },
    jp: {
      name: 'JLPT N5',
      description: '初級レベル - 基本的な日本語をある程度理解することができる',
      keywords: ['JLPT N5', 'N5試験', 'N5対策', '日本語N5', 'N5語彙', 'N5文法']
    },
    en: {
      name: 'JLPT N5',
      description: 'Beginner Level - Can understand some basic Japanese',
      keywords: ['JLPT N5', 'N5 test', 'N5 practice', 'Japanese N5', 'N5 vocabulary', 'N5 grammar']
    }
  }
} as const

// Content Categories
export const CONTENT_CATEGORIES = {
  vn: {
    vocabulary: {
      name: 'Từ vựng',
      description: 'Học từ vựng tiếng Nhật theo cấp độ JLPT',
      keywords: ['từ vựng tiếng Nhật', 'vocabulary JLPT', 'học từ vựng', 'từ vựng N1', 'từ vựng N2']
    },
    grammar: {
      name: 'Ngữ pháp',
      description: 'Luyện tập ngữ pháp tiếng Nhật từ cơ bản đến nâng cao',
      keywords: ['ngữ pháp tiếng Nhật', 'grammar JLPT', 'học ngữ pháp', 'ngữ pháp N1', 'ngữ pháp N2']
    },
    kanji: {
      name: 'Kanji',
      description: 'Học và luyện tập chữ Kanji theo cấp độ JLPT',
      keywords: ['kanji', 'chữ Hán', 'học kanji', 'kanji N1', 'kanji N2', 'luyện kanji']
    },
    reading: {
      name: 'Đọc hiểu',
      description: 'Luyện tập kỹ năng đọc hiểu tiếng Nhật',
      keywords: ['đọc hiểu tiếng Nhật', 'reading JLPT', 'luyện đọc', 'đọc hiểu N1', 'đọc hiểu N2']
    },
    listening: {
      name: 'Nghe hiểu',
      description: 'Luyện tập kỹ năng nghe hiểu tiếng Nhật',
      keywords: ['nghe hiểu tiếng Nhật', 'listening JLPT', 'luyện nghe', 'nghe hiểu N1', 'nghe hiểu N2']
    }
  },
  jp: {
    vocabulary: {
      name: '語彙',
      description: 'JLPTレベル別日本語語彙学習',
      keywords: ['日本語語彙', 'JLPT語彙', '語彙学習', 'N1語彙', 'N2語彙']
    },
    grammar: {
      name: '文法',
      description: '基礎から上級まで日本語文法練習',
      keywords: ['日本語文法', 'JLPT文法', '文法学習', 'N1文法', 'N2文法']
    },
    kanji: {
      name: '漢字',
      description: 'JLPTレベル別漢字学習・練習',
      keywords: ['漢字', '漢字学習', '漢字練習', 'N1漢字', 'N2漢字']
    },
    reading: {
      name: '読解',
      description: '日本語読解スキル練習',
      keywords: ['日本語読解', 'JLPT読解', '読解練習', 'N1読解', 'N2読解']
    },
    listening: {
      name: '聴解',
      description: '日本語聴解スキル練習',
      keywords: ['日本語聴解', 'JLPT聴解', '聴解練習', 'N1聴解', 'N2聴解']
    }
  },
  en: {
    vocabulary: {
      name: 'Vocabulary',
      description: 'Learn Japanese vocabulary by JLPT level',
      keywords: ['Japanese vocabulary', 'JLPT vocabulary', 'vocabulary learning', 'N1 vocabulary', 'N2 vocabulary']
    },
    grammar: {
      name: 'Grammar',
      description: 'Practice Japanese grammar from basic to advanced',
      keywords: ['Japanese grammar', 'JLPT grammar', 'grammar learning', 'N1 grammar', 'N2 grammar']
    },
    kanji: {
      name: 'Kanji',
      description: 'Learn and practice Kanji by JLPT level',
      keywords: ['kanji', 'Japanese characters', 'kanji learning', 'N1 kanji', 'N2 kanji']
    },
    reading: {
      name: 'Reading',
      description: 'Practice Japanese reading comprehension skills',
      keywords: ['Japanese reading', 'JLPT reading', 'reading practice', 'N1 reading', 'N2 reading']
    },
    listening: {
      name: 'Listening',
      description: 'Practice Japanese listening comprehension skills',
      keywords: ['Japanese listening', 'JLPT listening', 'listening practice', 'N1 listening', 'N2 listening']
    }
  }
} as const

// Generate SEO-optimized content title
export function generateContentTitle(
  category: keyof typeof CONTENT_CATEGORIES.vn,
  level: keyof typeof JLPT_LEVELS,
  language: Language,
  customTitle?: string
): string {
  if (customTitle) return customTitle

  const levelInfo = JLPT_LEVELS[level][language]
  const categoryInfo = CONTENT_CATEGORIES[language][category]

  const templates = {
    vn: `${categoryInfo.name} ${levelInfo.name} - Luyện thi JLPT miễn phí`,
    jp: `${levelInfo.name} ${categoryInfo.name} - 無料JLPT対策`,
    en: `${levelInfo.name} ${categoryInfo.name} - Free JLPT Practice`
  }

  return templates[language]
}

// Generate SEO-optimized meta description
export function generateContentDescription(
  category: keyof typeof CONTENT_CATEGORIES.vn,
  level: keyof typeof JLPT_LEVELS,
  language: Language,
  customDescription?: string
): string {
  if (customDescription) return customDescription

  const levelInfo = JLPT_LEVELS[level][language]
  const categoryInfo = CONTENT_CATEGORIES[language][category]

  const templates = {
    vn: `${categoryInfo.description} ${levelInfo.name}. ${levelInfo.description}. Luyện thi JLPT miễn phí với AI hỗ trợ.`,
    jp: `${categoryInfo.description}${levelInfo.name}。${levelInfo.description}。AIサポート付き無料JLPT対策。`,
    en: `${categoryInfo.description} for ${levelInfo.name}. ${levelInfo.description}. Free JLPT practice with AI support.`
  }

  return templates[language]
}

// Generate content keywords
export function generateContentKeywords(
  category: keyof typeof CONTENT_CATEGORIES.vn,
  level: keyof typeof JLPT_LEVELS,
  language: Language
): string[] {
  const levelKeywords = JLPT_LEVELS[level][language].keywords
  const categoryKeywords = CONTENT_CATEGORIES[language][category].keywords
  
  return [...levelKeywords, ...categoryKeywords]
}

// Generate heading structure for SEO
export function generateHeadingStructure(
  category: keyof typeof CONTENT_CATEGORIES.vn,
  level: keyof typeof JLPT_LEVELS,
  language: Language
) {
  const levelInfo = JLPT_LEVELS[level][language]
  const categoryInfo = CONTENT_CATEGORIES[language][category]

  const headings = {
    vn: {
      h1: `${categoryInfo.name} ${levelInfo.name}`,
      h2: [
        `Giới thiệu về ${levelInfo.name}`,
        `Cách học ${categoryInfo.name} hiệu quả`,
        `Bài tập ${categoryInfo.name} ${levelInfo.name}`,
        `Tips luyện thi ${levelInfo.name}`
      ],
      h3: [
        `Đặc điểm ${levelInfo.name}`,
        `Phương pháp học ${categoryInfo.name}`,
        `Lộ trình học ${levelInfo.name}`,
        `Tài liệu tham khảo`
      ]
    },
    jp: {
      h1: `${levelInfo.name} ${categoryInfo.name}`,
      h2: [
        `${levelInfo.name}について`,
        `効果的な${categoryInfo.name}学習方法`,
        `${levelInfo.name} ${categoryInfo.name}練習問題`,
        `${levelInfo.name}対策のコツ`
      ],
      h3: [
        `${levelInfo.name}の特徴`,
        `${categoryInfo.name}学習方法`,
        `${levelInfo.name}学習ロードマップ`,
        `参考資料`
      ]
    },
    en: {
      h1: `${levelInfo.name} ${categoryInfo.name}`,
      h2: [
        `About ${levelInfo.name}`,
        `Effective ${categoryInfo.name} Learning Methods`,
        `${levelInfo.name} ${categoryInfo.name} Practice`,
        `${levelInfo.name} Study Tips`
      ],
      h3: [
        `${levelInfo.name} Features`,
        `${categoryInfo.name} Study Methods`,
        `${levelInfo.name} Learning Roadmap`,
        `Reference Materials`
      ]
    }
  }

  return headings[language]
}

// Generate alt text for images
export function generateImageAltText(
  type: 'logo' | 'level-badge' | 'category-icon' | 'practice-screenshot',
  context: {
    level?: keyof typeof JLPT_LEVELS
    category?: keyof typeof CONTENT_CATEGORIES.vn
    language: Language
  }
): string {
  const { level, category, language } = context

  const altTexts = {
    vn: {
      logo: 'Logo JLPT4You - Website luyện thi JLPT hàng đầu',
      'level-badge': level ? `Badge ${JLPT_LEVELS[level].vn.name} - ${JLPT_LEVELS[level].vn.description}` : 'JLPT Level Badge',
      'category-icon': category ? `Icon ${CONTENT_CATEGORIES.vn[category].name} - ${CONTENT_CATEGORIES.vn[category].description}` : 'Category Icon',
      'practice-screenshot': level && category ? `Screenshot luyện tập ${CONTENT_CATEGORIES.vn[category].name} ${JLPT_LEVELS[level].vn.name}` : 'Practice Screenshot'
    },
    jp: {
      logo: 'JLPT4You ロゴ - 最高のJLPT対策サイト',
      'level-badge': level ? `${JLPT_LEVELS[level].jp.name} バッジ - ${JLPT_LEVELS[level].jp.description}` : 'JLPTレベルバッジ',
      'category-icon': category ? `${CONTENT_CATEGORIES.jp[category].name} アイコン - ${CONTENT_CATEGORIES.jp[category].description}` : 'カテゴリーアイコン',
      'practice-screenshot': level && category ? `${JLPT_LEVELS[level].jp.name} ${CONTENT_CATEGORIES.jp[category].name} 練習スクリーンショット` : '練習スクリーンショット'
    },
    en: {
      logo: 'JLPT4You Logo - Leading JLPT Practice Website',
      'level-badge': level ? `${JLPT_LEVELS[level].en.name} Badge - ${JLPT_LEVELS[level].en.description}` : 'JLPT Level Badge',
      'category-icon': category ? `${CONTENT_CATEGORIES.en[category].name} Icon - ${CONTENT_CATEGORIES.en[category].description}` : 'Category Icon',
      'practice-screenshot': level && category ? `${JLPT_LEVELS[level].en.name} ${CONTENT_CATEGORIES.en[category].name} Practice Screenshot` : 'Practice Screenshot'
    }
  }

  return altTexts[language][type]
}

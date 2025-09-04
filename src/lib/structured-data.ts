/**
 * Structured Data (Schema.org) for JLPT4You
 * Educational content markup for better search visibility
 */

import { Language } from './i18n'

// Schema.org types
type SchemaOrgType = Record<string, unknown>

// Organization Schema
export function generateOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "JLPT4You",
    "url": "https://jlpt4you.com",
    "logo": "https://jlpt4you.com/logo.png",
    "description": "Leading JLPT practice platform with 10,000+ questions, AI tutor support, and comprehensive study materials for all levels N5-N1. Free online Japanese language test preparation.",
    "foundingDate": "2024",
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer service",
      "email": "support@jlpt4you.com"
    },
    "sameAs": [
      "https://twitter.com/jlpt4you",
      "https://facebook.com/jlpt4you",
      "https://instagram.com/jlpt4you"
    ],
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "VN"
    }
  }
}

// Website Schema
export function generateWebsiteSchema(language: Language) {
  const urls = {
    vn: "https://jlpt4you.com/auth/vn",
    jp: "https://jlpt4you.com/auth/jp", 
    en: "https://jlpt4you.com/auth/en"
  }

  const names = {
    vn: "Luyện Thi JLPT N5 N4 N3 N2 N1 Online Miễn Phí | Đề Thi Thử JLPT - JLPT4YOU",
    jp: "JLPT練習問題 N5 N4 N3 N2 N1 無料オンライン | 日本語能力試験対策 - JLPT4YOU",
    en: "Free JLPT Practice Tests N5 N4 N3 N2 N1 Online | Japanese Language Test - JLPT4YOU"
  }

  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": names[language],
    "url": urls[language],
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${urls[language]}/search?q={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    },
    "inLanguage": language === 'vn' ? 'vi-VN' : language === 'jp' ? 'ja-JP' : 'en-US'
  }
}

// Educational Organization Schema
export function generateEducationalOrganizationSchema(language: Language) {
  const descriptions = {
    vn: "Platform luyện thi JLPT online miễn phí hàng đầu với 10,000+ câu hỏi, đề thi thử các năm, học với AI. Tỷ lệ đậu cao cho mọi cấp độ N5-N1.",
    jp: "10,000問以上の問題、過去問、AI講師付きの無料JLPT対策プラットフォーム。N5からN1まで全レベル対応、高い合格率。",
    en: "Leading free JLPT practice platform with 10,000+ questions, past exams, AI tutor. High pass rate for all levels N5-N1."
  }

  return {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    "name": "JLPT4You",
    "description": descriptions[language],
    "url": "https://jlpt4you.com",
    "logo": "https://jlpt4you.com/logo.png",
    "educationalCredentialAwarded": "JLPT Preparation Certificate",
    "hasCredential": {
      "@type": "EducationalOccupationalCredential",
      "name": "JLPT Practice Completion",
      "description": "Certificate for completing JLPT practice courses"
    }
  }
}

// Course Schema for JLPT Levels
export function generateCourseSchema(level: 'N1' | 'N2' | 'N3' | 'N4' | 'N5', language: Language) {
  const courseNames = {
    vn: {
      N1: "Luyện thi JLPT N1 - Trình độ cao cấp",
      N2: "Luyện thi JLPT N2 - Trình độ trung cấp cao", 
      N3: "Luyện thi JLPT N3 - Trình độ trung cấp",
      N4: "Luyện thi JLPT N4 - Trình độ sơ cấp cao",
      N5: "Luyện thi JLPT N5 - Trình độ sơ cấp"
    },
    jp: {
      N1: "JLPT N1対策 - 上級レベル",
      N2: "JLPT N2対策 - 中上級レベル",
      N3: "JLPT N3対策 - 中級レベル", 
      N4: "JLPT N4対策 - 初中級レベル",
      N5: "JLPT N5対策 - 初級レベル"
    },
    en: {
      N1: "JLPT N1 Practice - Advanced Level",
      N2: "JLPT N2 Practice - Upper Intermediate Level",
      N3: "JLPT N3 Practice - Intermediate Level",
      N4: "JLPT N4 Practice - Elementary Level", 
      N5: "JLPT N5 Practice - Beginner Level"
    }
  }

  const descriptions = {
    vn: {
      N1: "Khóa luyện thi JLPT N1 với đề thi thực tế, từ vựng và ngữ pháp nâng cao",
      N2: "Khóa luyện thi JLPT N2 với bài tập tương tác và AI hỗ trợ học tập",
      N3: "Khóa luyện thi JLPT N3 cơ bản với hệ thống học tập thông minh",
      N4: "Khóa luyện thi JLPT N4 dành cho người mới bắt đầu học tiếng Nhật",
      N5: "Khóa luyện thi JLPT N5 từ cơ bản với phương pháp học hiệu quả"
    },
    jp: {
      N1: "実際の試験問題、上級語彙・文法を使ったJLPT N1対策コース",
      N2: "インタラクティブな練習問題とAI学習サポート付きJLPT N2対策コース", 
      N3: "スマート学習システムを使った基本的なJLPT N3対策コース",
      N4: "日本語学習初心者向けJLPT N4対策コース",
      N5: "効果的な学習方法による基礎からのJLPT N5対策コース"
    },
    en: {
      N1: "JLPT N1 preparation course with real exam questions, advanced vocabulary and grammar",
      N2: "JLPT N2 preparation course with interactive exercises and AI learning support",
      N3: "Basic JLPT N3 preparation course with smart learning system", 
      N4: "JLPT N4 preparation course for Japanese language beginners",
      N5: "JLPT N5 preparation course from basics with effective learning methods"
    }
  }

  return {
    "@context": "https://schema.org",
    "@type": "Course",
    "name": courseNames[language][level],
    "description": descriptions[language][level],
    "provider": {
      "@type": "Organization",
      "name": "JLPT4You",
      "url": "https://jlpt4you.com"
    },
    "educationalLevel": level,
    "inLanguage": language === 'vn' ? 'vi-VN' : language === 'jp' ? 'ja-JP' : 'en-US',
    "courseMode": "online",
    "isAccessibleForFree": true,
    "hasCourseInstance": {
      "@type": "CourseInstance",
      "courseMode": "online",
      "instructor": {
        "@type": "Organization", 
        "name": "JLPT4You AI Tutor"
      }
    }
  }
}

// WebApplication Schema
export function generateWebApplicationSchema(language: Language) {
  const names = {
    vn: "JLPT4YOU - Ứng dụng Luyện Thi JLPT Online Miễn Phí",
    jp: "JLPT4YOU - 無料JLPT練習問題オンラインアプリ",
    en: "JLPT4YOU - Free JLPT Practice Test App"
  }

  const descriptions = {
    vn: "Ứng dụng luyện thi JLPT miễn phí với 10,000+ câu hỏi, đề thi thử, kanji, ngữ pháp, từ vựng. AI giảng viên hỗ trợ 24/7, giải thích chi tiết.",
    jp: "10,000問以上、模擬試験、漢字、文法、語彙を含む無料JLPT練習アプリ。24/7 AI講師サポート、詳細解説付き。",
    en: "Free JLPT practice app with 10,000+ questions, mock exams, kanji, grammar, vocabulary. 24/7 AI tutor support with detailed explanations."
  }

  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": names[language],
    "description": descriptions[language],
    "url": "https://jlpt4you.com",
    "applicationCategory": "EducationalApplication",
    "operatingSystem": "Web Browser",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "ratingCount": "2850",
      "bestRating": "5"
    },
    "featureList": [
      "10,000+ JLPT Practice Questions",
      "Past JLPT Exam Papers",
      "AI-Powered Tutor Support",
      "Vocabulary Training N5-N1", 
      "Grammar Exercises All Levels",
      "Kanji Practice with Stroke Order",
      "Reading Comprehension Tests",
      "Listening Practice Materials",
      "Progress Tracking & Analytics",
      "Detailed Answer Explanations",
      "Free Mock Exams"
    ]
  }
}

// FAQ Schema for common JLPT questions
export function generateFAQSchema(language: Language) {
  const faqs = {
    vn: [
      {
        question: "JLPT là gì?",
        answer: "JLPT (Japanese Language Proficiency Test) là kỳ thi năng lực tiếng Nhật được công nhận quốc tế, có 5 cấp độ từ N5 (cơ bản) đến N1 (nâng cao)."
      },
      {
        question: "JLPT4You có miễn phí không?",
        answer: "JLPT4You cung cấp nhiều tính năng miễn phí bao gồm luyện thi cơ bản, từ vựng và ngữ pháp. Gói premium có thêm nhiều tính năng nâng cao."
      },
      {
        question: "Làm sao để chuẩn bị thi JLPT hiệu quả?",
        answer: "Luyện tập thường xuyên với đề thi thực tế, học từ vựng và ngữ pháp theo cấp độ, sử dụng AI để nhận phản hồi cá nhân hóa."
      }
    ],
    jp: [
      {
        question: "JLPTとは何ですか？",
        answer: "JLPT（日本語能力試験）は国際的に認められた日本語能力試験で、N5（基礎）からN1（上級）まで5つのレベルがあります。"
      },
      {
        question: "JLPT4Youは無料ですか？",
        answer: "JLPT4Youは基本的な練習問題、語彙、文法を含む多くの無料機能を提供しています。プレミアムプランではより多くの高度な機能が利用できます。"
      },
      {
        question: "JLPT対策を効果的に行うには？",
        answer: "実際の試験問題で定期的に練習し、レベル別の語彙・文法を学習し、AIを使ってパーソナライズされたフィードバックを受けることです。"
      }
    ],
    en: [
      {
        question: "What is JLPT?",
        answer: "JLPT (Japanese Language Proficiency Test) is an internationally recognized Japanese language proficiency test with 5 levels from N5 (basic) to N1 (advanced)."
      },
      {
        question: "Is JLPT4You free?",
        answer: "JLPT4You offers many free features including basic practice tests, vocabulary and grammar. Premium plans include additional advanced features."
      },
      {
        question: "How to prepare for JLPT effectively?",
        answer: "Practice regularly with real exam questions, study vocabulary and grammar by level, and use AI for personalized feedback."
      }
    ]
  }

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs[language].map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  }
}

// Generate all structured data for a page
export function generatePageStructuredData(
  page: 'landing' | 'login' | 'register' | 'forgot-password',
  language: Language,
  level?: 'N1' | 'N2' | 'N3' | 'N4' | 'N5'
) {
  const schemas: SchemaOrgType[] = [
    generateOrganizationSchema(),
    generateWebsiteSchema(language),
    generateEducationalOrganizationSchema(language),
    generateWebApplicationSchema(language)
  ]

  if (page === 'landing') {
    schemas.push(generateFAQSchema(language))

    if (level) {
      schemas.push(generateCourseSchema(level, language))
    }
  }

  return schemas
}

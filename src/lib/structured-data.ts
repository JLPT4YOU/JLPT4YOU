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
    "description": "Leading JLPT practice platform for Japanese language learners",
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
    vn: "JLPT4You - Luyện thi JLPT Online",
    jp: "JLPT4You - オンラインJLPT対策",
    en: "JLPT4You - Online JLPT Practice"
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
    vn: "Tổ chức giáo dục hàng đầu về luyện thi JLPT và học tiếng Nhật online",
    jp: "JLPT対策と日本語学習のための主要な教育機関",
    en: "Leading educational organization for JLPT preparation and Japanese language learning"
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
    vn: "JLPT4You - Ứng dụng học tiếng Nhật",
    jp: "JLPT4You - 日本語学習アプリ",
    en: "JLPT4You - Japanese Learning App"
  }

  const descriptions = {
    vn: "Ứng dụng web học tiếng Nhật và luyện thi JLPT với AI hỗ trợ",
    jp: "AI サポート付き日本語学習・JLPT対策ウェブアプリ",
    en: "Japanese learning and JLPT practice web application with AI support"
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
      "ratingValue": "4.8",
      "ratingCount": "1250",
      "bestRating": "5"
    },
    "featureList": [
      "JLPT Practice Tests",
      "AI-Powered Learning",
      "Vocabulary Training", 
      "Grammar Exercises",
      "Kanji Practice",
      "Progress Tracking"
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

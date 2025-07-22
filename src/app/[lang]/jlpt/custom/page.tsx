import { Metadata } from 'next'
import { notFound } from "next/navigation"
import { loadTranslation, Language } from "@/lib/i18n"
import { JLPTCustomPageContent } from "@/components/jlpt/jlpt-custom-page-content"

interface JLPTCustomPageProps {
  params: Promise<{
    lang: string
  }>
}

// Map language codes to Language type
const getLanguageFromCode = (code: string): Language | null => {
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

export async function generateMetadata({ params }: JLPTCustomPageProps): Promise<Metadata> {
  const { lang } = await params
  const language = getLanguageFromCode(lang)

  if (!language) {
    return {}
  }

  const translations = await loadTranslation(language)

  const titles = {
    vn: `${translations.common.appName} - ${translations.jlpt.custom.page.title}`,
    jp: `${translations.common.appName} - ${translations.jlpt.custom.page.title}`,
    en: `${translations.common.appName} - ${translations.jlpt.custom.page.title}`
  }

  return {
    title: titles[language],
    description: translations.jlpt.custom.page.subtitle,
    alternates: {
      languages: {
        'vi-VN': 'https://jlpt4you.com/vn/jlpt/custom',
        'ja-JP': 'https://jlpt4you.com/jp/jlpt/custom',
        'en-US': 'https://jlpt4you.com/en/jlpt/custom',
        'x-default': 'https://jlpt4you.com/vn/jlpt/custom'
      }
    },
    robots: {
      index: true,
      follow: true,
    },
    other: {
      'content-language': language === 'vn' ? 'vi-VN' : language === 'jp' ? 'ja-JP' : 'en-US'
    }
  }
}

export default async function JLPTCustomPage({ params }: JLPTCustomPageProps) {
  const { lang } = await params
  const language = getLanguageFromCode(lang)
  
  if (!language) {
    notFound()
  }

  const translations = await loadTranslation(language)

  return <JLPTCustomPageContent translations={translations} language={language} />
}

// Generate static params for all language codes
export async function generateStaticParams() {
  return [
    { lang: 'vn' },
    { lang: 'jp' },
    { lang: 'en' },
    { lang: '1' },
    { lang: '2' },
    { lang: '3' }
  ]
}

// Enable static generation
export const dynamic = 'force-static'

import { Metadata } from 'next'
import { notFound } from "next/navigation"
import { loadTranslation, Language } from "@/lib/i18n"
import { DrivingPageContent } from "@/components/driving/driving-page-content"

interface DrivingPageProps {
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

export async function generateMetadata({ params }: DrivingPageProps): Promise<Metadata> {
  const { lang } = await params
  const language = getLanguageFromCode(lang)

  if (!language) {
    return {}
  }

  const translations = await loadTranslation(language)

  const titles = {
    vn: `${translations.common.appName} - ${translations.driving.page.title}`,
    jp: `${translations.common.appName} - ${translations.driving.page.title}`,
    en: `${translations.common.appName} - ${translations.driving.page.title}`
  }

  return {
    title: titles[language],
    description: translations.driving.page.subtitle,
    alternates: {
      languages: {
        'vi-VN': 'https://jlpt4you.com/vn/driving',
        'ja-JP': 'https://jlpt4you.com/jp/driving',
        'en-US': 'https://jlpt4you.com/en/driving',
        'x-default': 'https://jlpt4you.com/vn/driving'
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

export default async function DrivingPage({ params }: DrivingPageProps) {
  const { lang } = await params
  const language = getLanguageFromCode(lang)
  
  if (!language) {
    notFound()
  }

  const translations = await loadTranslation(language)

  return <DrivingPageContent translations={translations} language={language} />
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

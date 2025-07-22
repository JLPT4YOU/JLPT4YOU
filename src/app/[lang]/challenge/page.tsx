import { Metadata } from 'next'
import { notFound } from "next/navigation"
import { loadTranslation, Language } from "@/lib/i18n"
import { ChallengePageContent } from "@/components/challenge/challenge-page-content"

interface ChallengePageProps {
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

export async function generateMetadata({ params }: ChallengePageProps): Promise<Metadata> {
  const { lang } = await params
  const language = getLanguageFromCode(lang)

  if (!language) {
    return {}
  }

  const translations = await loadTranslation(language)

  const titles = {
    vn: `${translations.common.appName} - ${translations.challenge.page.title}`,
    jp: `${translations.common.appName} - ${translations.challenge.page.title}`,
    en: `${translations.common.appName} - ${translations.challenge.page.title}`
  }

  return {
    title: titles[language],
    description: translations.challenge.page.subtitle,
    alternates: {
      languages: {
        'vi-VN': 'https://jlpt4you.com/vn/challenge',
        'ja-JP': 'https://jlpt4you.com/jp/challenge',
        'en-US': 'https://jlpt4you.com/en/challenge',
        'x-default': 'https://jlpt4you.com/vn/challenge'
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

export default async function ChallengePage({ params }: ChallengePageProps) {
  const { lang } = await params
  const language = getLanguageFromCode(lang)
  
  if (!language) {
    notFound()
  }

  const translations = await loadTranslation(language)

  return <ChallengePageContent translations={translations} language={language} />
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

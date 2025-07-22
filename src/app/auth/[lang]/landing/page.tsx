import { Metadata } from 'next'
import { notFound } from "next/navigation"
import { LandingPage as LandingPageComponent } from '@/components/landing/landing-page'
import { loadTranslation, Language } from '@/lib/i18n'
import { generateSEOConfig, generateHreflangLinks } from '@/lib/seo-config'

interface LandingPageProps {
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

// Generate metadata for SEO
export async function generateMetadata({ params }: LandingPageProps): Promise<Metadata> {
  const { lang } = await params
  const language = getLanguageFromCode(lang)

  if (!language) {
    notFound()
  }

  const seoConfig = generateSEOConfig('landing', language)
  const hreflangLinks = generateHreflangLinks('/landing')

  return {
    title: seoConfig.title,
    description: seoConfig.description,
    keywords: seoConfig.keywords.join(', '),
    authors: [{ name: 'JLPT4You Team' }],
    openGraph: {
      ...seoConfig.openGraph,
      url: `https://jlpt4you.com/auth/${lang}/landing`,
      images: [
        {
          url: 'https://jlpt4you.com/og-image-landing.jpg',
          width: 1200,
          height: 630,
          alt: seoConfig.openGraph.title
        }
      ]
    },
    twitter: {
      ...seoConfig.twitter,
      images: ['https://jlpt4you.com/twitter-image-landing.jpg']
    },
    alternates: {
      canonical: `https://jlpt4you.com/auth/${lang}/landing`,
      languages: Object.fromEntries(
        hreflangLinks.map(link => [
          link.hreflang === 'vi-VN' ? 'vi' :
          link.hreflang === 'ja-JP' ? 'ja' :
          link.hreflang === 'en-US' ? 'en' : 'x-default',
          link.href
        ])
      )
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      }
    },
    other: {
      'content-language': language === 'vn' ? 'vi-VN' : language === 'jp' ? 'ja-JP' : 'en-US'
    }
  }
}

export default async function LandingPage({ params }: LandingPageProps) {
  const { lang } = await params
  const language = getLanguageFromCode(lang)
  
  if (!language) {
    notFound()
  }

  const translations = await loadTranslation(language)

  return <LandingPageComponent translations={translations} language={language} />
}

// Generate static params for all language codes (SEO-friendly)
export async function generateStaticParams() {
  return [
    { lang: 'vn' }, // Vietnamese (primary)
    { lang: 'jp' }, // Japanese (primary)
    { lang: 'en' }, // English (primary)
    { lang: '1' },  // Vietnamese (backward compatibility)
    { lang: '2' },  // Japanese (backward compatibility)
    { lang: '3' }   // English (backward compatibility)
  ]
}

// Enable static generation
export const dynamic = 'force-static'

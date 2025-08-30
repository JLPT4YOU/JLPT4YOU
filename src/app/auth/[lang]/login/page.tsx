import { Suspense } from "react"
import { Metadata } from "next"
import { notFound } from "next/navigation"
import { loadTranslation, Language } from '@/lib/i18n'
import { AuthPageContent } from "@/components/auth/auth-page-content"
import { getLanguageFromCode } from '@/lib/page-utils-core'
import { generateSEOConfig, generateHreflangLinks } from "@/lib/seo-config"

interface LoginPageProps {
  params: Promise<{
    lang: string
  }>
}



// Generate metadata for SEO
export async function generateMetadata({ params }: LoginPageProps): Promise<Metadata> {
  const { lang } = await params
  const language = getLanguageFromCode(lang)

  if (!language) {
    notFound()
  }

  const seoConfig = generateSEOConfig('login', language)
  const hreflangLinks = generateHreflangLinks('/login')

  return {
    title: seoConfig.title,
    description: seoConfig.description,
    keywords: seoConfig.keywords.join(', '),
    authors: [{ name: 'JLPT4You Team' }],
    openGraph: {
      ...seoConfig.openGraph,
      url: `https://jlpt4you.com/auth/${lang}/login`,
      images: [
        {
          url: 'https://jlpt4you.com/og-image-auth.jpg',
          width: 1200,
          height: 630,
          alt: seoConfig.openGraph.title
        }
      ]
    },
    twitter: {
      ...seoConfig.twitter,
      images: ['https://jlpt4you.com/twitter-image-auth.jpg']
    },
    alternates: {
      canonical: `https://jlpt4you.com/auth/${lang}/login`,
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

export default async function LoginPage({ params }: LoginPageProps) {
  const { lang } = await params
  const language = getLanguageFromCode(lang)
  
  if (!language) {
    notFound()
  }

  const translations = await loadTranslation(language)

  return (
    <Suspense fallback={<div>{translations.common.loading}</div>}>
      <AuthPageContent
        translations={translations}
        initialMode="login"
        language={language}
      />
    </Suspense>
  )
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

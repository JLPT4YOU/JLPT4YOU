/**
 * Structured Data Component for SEO
 * Renders JSON-LD structured data in the document head
 */

import { Language } from '@/lib/i18n'
import { generatePageStructuredData } from '@/lib/structured-data'

interface StructuredDataProps {
  page: 'landing' | 'login' | 'register' | 'forgot-password'
  language: Language
  level?: 'N1' | 'N2' | 'N3' | 'N4' | 'N5'
}

export function StructuredData({ page, language, level }: StructuredDataProps) {
  const schemas = generatePageStructuredData(page, language, level)

  return (
    <>
      {schemas.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(schema, null, 2)
          }}
        />
      ))}
    </>
  )
}

// Hreflang component for language alternatives
interface HreflangLinksProps {
  basePath: string
}

export function HreflangLinks({ basePath }: HreflangLinksProps) {
  const baseUrl = 'https://jlpt4you.com'
  
  const hreflangLinks = [
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

  return (
    <>
      {hreflangLinks.map((link) => (
        <link
          key={link.hreflang}
          rel="alternate"
          hrefLang={link.hreflang}
          href={link.href}
        />
      ))}
    </>
  )
}

// Canonical URL component
interface CanonicalUrlProps {
  url: string
}

export function CanonicalUrl({ url }: CanonicalUrlProps) {
  return <link rel="canonical" href={url} />
}

// Open Graph Image component
interface OpenGraphImageProps {
  title: string
  type?: 'landing' | 'auth'
}

export function OpenGraphImage({ title, type = 'landing' }: OpenGraphImageProps) {
  const imageUrl = `https://jlpt4you.com/og-image-${type}.jpg`
  const twitterImageUrl = `https://jlpt4you.com/twitter-image-${type}.jpg`

  return (
    <>
      {/* Open Graph */}
      <meta property="og:image" content={imageUrl} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={title} />
      
      {/* Twitter Card */}
      <meta name="twitter:image" content={twitterImageUrl} />
      <meta name="twitter:image:alt" content={title} />
    </>
  )
}

// Robots meta tag component
export function RobotsMeta() {
  return (
    <>
      <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      <meta name="googlebot" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
    </>
  )
}

// Language and region meta tags
interface LanguageMetaProps {
  language: Language
}

export function LanguageMeta({ language }: LanguageMetaProps) {
  const contentLanguage = language === 'vn' ? 'vi-VN' : language === 'jp' ? 'ja-JP' : 'en-US'
  const htmlLang = language === 'vn' ? 'vi' : language === 'jp' ? 'ja' : 'en'

  return (
    <>
      <meta httpEquiv="content-language" content={contentLanguage} />
      <meta name="language" content={htmlLang} />
      <html lang={htmlLang} />
    </>
  )
}

// Comprehensive SEO Head component
interface SEOHeadProps {
  page: 'landing' | 'login' | 'register' | 'forgot-password'
  language: Language
  title: string
  canonicalUrl: string
  basePath: string
  level?: 'N1' | 'N2' | 'N3' | 'N4' | 'N5'
}

export function SEOHead({
  page,
  language,
  title,
  canonicalUrl,
  basePath,
  level
}: SEOHeadProps) {
  return (
    <>
      <StructuredData page={page} language={language} level={level} />
      <HreflangLinks basePath={basePath} />
      <CanonicalUrl url={canonicalUrl} />
      <OpenGraphImage
        title={title}
        type={page === 'landing' ? 'landing' : 'auth'}
      />
      <RobotsMeta />
      <LanguageMeta language={language} />
    </>
  )
}

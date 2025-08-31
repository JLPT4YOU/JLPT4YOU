import { notFound } from "next/navigation"
import { LandingPage as LandingPageComponent } from '@/components/landing'
import { loadTranslation, Language } from '@/lib/i18n'
import { getLanguageFromCode } from '@/lib/page-utils-core'
import { generateLanguageStaticParams } from '@/lib/shared/static-params-utils'
import { Metadata } from 'next';

interface LandingPageProps {
  params: {
    lang: string
  }
}

// Generate metadata with localized titles and SEO
export async function generateMetadata(
  { params }: { params: Promise<{ lang: string }> }
): Promise<Metadata> {
  const { lang } = await params;
  const language = getLanguageFromCode(lang);
  if (!language) {
    return {};
  }

  const translations = await loadTranslation(language);
  const t = (key: string) => {
    const keys = key.split('.');
    let value: any = translations;
    for (const k of keys) {
      value = value?.[k];
    }
    return value || key;
  };

  const baseUrl = 'https://jlpt4you.com';

  return {
    title: t('seo.title'),
    description: t('seo.description'),
    keywords: "JLPT, học tiếng Nhật, luyện thi JLPT, tiếng Nhật online, JLPT N1, JLPT N2, JLPT N3, JLPT N4, JLPT N5, 日本語能力試験, JLPT practice test",
    authors: [{ name: "JLPT4You Team" }],
    creator: "JLPT4You",
    publisher: "JLPT4You",
    robots: {
      index: true,
      follow: true,
    },
    manifest: '/site.webmanifest',
    openGraph: {
      type: 'website',
      locale: language === 'vn' ? 'vi_VN' : (language === 'jp' ? 'ja_JP' : 'en_US'),
      url: `${baseUrl}/${language}`,
      siteName: 'JLPT4You',
      title: t('seo.title'),
      description: t('seo.description'),
      images: [
        {
          url: `${baseUrl}/og-image-${language}.jpg`,
          width: 1200,
          height: 630,
          alt: t('seo.title')
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title: t('seo.title'),
      description: t('seo.description'),
      images: [`${baseUrl}/twitter-image-${language}.jpg`]
    },
    alternates: {
      canonical: `${baseUrl}/${language}`,
      languages: {
        'vi-VN': `${baseUrl}/vn`,
        'en-US': `${baseUrl}/en`,
        'ja-JP': `${baseUrl}/jp`,
        'x-default': `${baseUrl}/vn`
      },
    },
  };
}



export default async function LandingPage(
  { params }: { params: Promise<{ lang: string }> }
) {
  const { lang } = await params;
  const language = getLanguageFromCode(lang);

  if (!language) {
    notFound();
  }

  const translations = await loadTranslation(language);

  return <LandingPageComponent translations={translations} language={language} />
}

// Generate static params for all language codes (SEO-friendly)
export async function generateStaticParams() {
  return generateLanguageStaticParams()
}

// Enable static generation
export const dynamic = 'force-static'

import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/contexts/auth-context";
import { LanguageProvider } from "@/contexts/language-context";
import { Header } from "@/components/header";
import { NavigationProtectionWrapper } from "@/components/navigation-protection-wrapper";
import { ConditionalHeaderWrapper } from "@/components/conditional-header-wrapper";
import { ComprehensivePerformanceMonitor } from "@/components/performance-monitor";
import { Suspense } from "react";
import Script from "next/script";

// Optimized Noto Sans Japanese font loading with comprehensive language support
const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500", "600", "700"], // Light, Normal, Medium, Semibold, Bold
  display: "swap", // Improve font loading performance
  preload: true,
  fallback: [
    // Comprehensive fallback system for all languages
    "system-ui", // Modern system fonts
    "-apple-system", // macOS/iOS
    "BlinkMacSystemFont", // Chrome on macOS
    "Segoe UI", // Windows
    "Roboto", // Android
    "Helvetica Neue", // macOS fallback
    "Arial", // Universal fallback
    "Noto Sans", // Google's universal font
    "Liberation Sans", // Linux
    "sans-serif" // Generic fallback
  ]
});

// SEO-optimized metadata for international targeting
export const metadata: Metadata = {
  title: "JLPT4YOU - Học tiếng Nhật hiệu quả với AI",
  description: "Website luyện thi JLPT hàng đầu Việt Nam. Học tiếng Nhật miễn phí với AI, luyện đề thi JLPT N1-N5, từ vựng, ngữ pháp và kanji.",
  keywords: "JLPT, học tiếng Nhật, luyện thi JLPT, tiếng Nhật online, JLPT N1, JLPT N2, JLPT N3, JLPT N4, JLPT N5",
  authors: [{ name: "JLPT4You Team" }],
  creator: "JLPT4You",
  publisher: "JLPT4You",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-32x32.svg', sizes: '32x32', type: 'image/svg+xml' },
      { url: '/favicon-16x16.svg', sizes: '16x16', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' }
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180' }
    ]
  },
  manifest: '/site.webmanifest',
  openGraph: {
    type: 'website',
    locale: 'vi_VN',
    url: 'https://jlpt4you.com',
    siteName: 'JLPT4You',
    title: 'JLPT4You - Học tiếng Nhật hiệu quả với AI',
    description: 'Website luyện thi JLPT hàng đầu Việt Nam với AI hỗ trợ học tập',
    images: [
      {
        url: 'https://jlpt4you.com/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'JLPT4You - Học tiếng Nhật với AI'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'JLPT4You - Học tiếng Nhật hiệu quả với AI',
    description: 'Website luyện thi JLPT hàng đầu Việt Nam với AI hỗ trợ học tập',
    images: ['https://jlpt4you.com/twitter-image.jpg']
  },
  alternates: {
    canonical: 'https://jlpt4you.com',
    languages: {
      'vi-VN': 'https://jlpt4you.com/auth/vn',
      'ja-JP': 'https://jlpt4you.com/auth/jp',
      'en-US': 'https://jlpt4you.com/auth/en'
    }
  },
  verification: {
    google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
    // yahoo: 'your-yahoo-verification-code'
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" type="image/svg+xml" sizes="32x32" href="/favicon-32x32.svg" />
        <link rel="icon" type="image/svg+xml" sizes="16x16" href="/favicon-16x16.svg" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <meta name="theme-color" content="#000000" />
      </head>
      <body
        className={`${notoSansJP.variable} antialiased font-sans`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <LanguageProvider>
            <AuthProvider>
              <NavigationProtectionWrapper>
                <ConditionalHeaderWrapper>
                  <Header />
                </ConditionalHeaderWrapper>
                <main>
                  <Suspense fallback={<div className="min-h-screen bg-background" />}>
                    {children}
                  </Suspense>
                </main>
              </NavigationProtectionWrapper>
            </AuthProvider>

            {/* Performance monitoring for Core Web Vitals - Console logging disabled */}
            {process.env.NODE_ENV === 'production' && <ComprehensivePerformanceMonitor />}
          </LanguageProvider>
        </ThemeProvider>

        {/* Critical performance scripts */}
        <Script
          id="performance-observer"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              // Early performance monitoring
              if ('PerformanceObserver' in window) {
                const observer = new PerformanceObserver((list) => {
                  for (const entry of list.getEntries()) {
                    if (entry.entryType === 'largest-contentful-paint') {
                      // LCP metric tracked
                    }
                    if (entry.entryType === 'first-input') {
                      // FID metric tracked
                    }
                  }
                });
                observer.observe({entryTypes: ['largest-contentful-paint', 'first-input']});
              }
            `
          }}
        />

        {/* Preconnect to external domains for better performance */}
        <Script
          id="preconnect-domains"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              // Preconnect to external domains
              const preconnectDomains = [
                'https://fonts.googleapis.com',
                'https://fonts.gstatic.com',
                'https://www.google-analytics.com',
                'https://www.googletagmanager.com'
              ];

              preconnectDomains.forEach(domain => {
                const link = document.createElement('link');
                link.rel = 'preconnect';
                link.href = domain;
                link.crossOrigin = 'anonymous';
                document.head.appendChild(link);
              });
            `
          }}
        />
      </body>
    </html>
  );
}

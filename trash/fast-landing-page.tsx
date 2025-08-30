"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { TranslationData, getLocalizedPath } from "@/lib/i18n"
import { useTranslation } from "@/lib/use-translation"
import { setLanguagePreferenceFromPath } from "@/lib/auth-utils"

interface FastLandingPageProps {
  translations: TranslationData
}

export function FastLandingPage({ translations }: FastLandingPageProps) {
  const router = useRouter()
  const { t, currentLanguage } = useTranslation(translations)

  const handleGetStarted = () => {
    setLanguagePreferenceFromPath(currentLanguage)
    router.push(getLocalizedPath('/auth', currentLanguage))
  }

  const handleTryDemo = () => {
    setLanguagePreferenceFromPath(currentLanguage)
    router.push(getLocalizedPath('/challenge', currentLanguage))
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Simple Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xl font-bold">JLPT4YOU</span>
          </div>
          <Button onClick={handleGetStarted} size="sm">
            {t('header.getStarted')}
          </Button>
        </div>
      </header>

      {/* Hero Section - Simplified */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center space-y-8">
          {/* Hero Image for LCP */}
          <div className="w-full max-w-2xl mx-auto mb-8">
            <div
              className="w-full h-64 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg flex items-center justify-center"
              style={{ minHeight: '256px' }}
            >
              <span className="text-6xl">🎯</span>
            </div>
          </div>

          {/* Main Heading - Optimized for LCP */}
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight">
              {t('hero.title')}
            </h1>
            <h2 className="text-xl md:text-2xl lg:text-3xl text-muted-foreground max-w-4xl mx-auto">
              {t('hero.subtitle')}
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              {t('hero.description')}
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex items-center justify-center gap-4 pt-8">
            <Button
              onClick={handleGetStarted}
              size="lg"
              className="px-8 py-3 text-lg font-medium"
            >
              {t('hero.ctaButton')}
            </Button>
            <Button
              onClick={handleTryDemo}
              variant="outline"
              size="lg"
              className="px-8 py-3 text-lg font-medium"
            >
              {t('hero.tryDemo')}
            </Button>
          </div>
        </div>
      </section>

      {/* Key Benefits - Simplified */}
      <section className="container mx-auto px-4 py-16 bg-muted/50">
        <div className="text-center space-y-12">
          <h2 className="text-3xl md:text-4xl font-bold">
            {t('benefits.title')}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Benefit 1 */}
            <div className="space-y-4">
              <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
                <span className="text-2xl">🎯</span>
              </div>
              <h3 className="text-xl font-semibold">{t('benefits.benefit1.title')}</h3>
              <p className="text-muted-foreground">{t('benefits.benefit1.description')}</p>
            </div>

            {/* Benefit 2 */}
            <div className="space-y-4">
              <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
                <span className="text-2xl">🤖</span>
              </div>
              <h3 className="text-xl font-semibold">{t('benefits.benefit2.title')}</h3>
              <p className="text-muted-foreground">{t('benefits.benefit2.description')}</p>
            </div>

            {/* Benefit 3 */}
            <div className="space-y-4">
              <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-xl font-semibold">{t('benefits.benefit3.title')}</h3>
              <p className="text-muted-foreground">{t('benefits.benefit3.description')}</p>
            </div>

            {/* Benefit 4 */}
            <div className="space-y-4">
              <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="text-xl font-semibold">{t('benefits.benefit4.title')}</h3>
              <p className="text-muted-foreground">{t('benefits.benefit4.description')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing - Simplified */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center space-y-12">
          <h2 className="text-3xl md:text-4xl font-bold">
            {t('pricing.title')}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Plan */}
            <div className="border rounded-lg p-8 space-y-6">
              <div className="space-y-2">
                <h3 className="text-2xl font-bold">{t('pricing.free.title')}</h3>
                <div className="text-4xl font-bold">$0</div>
                <p className="text-muted-foreground">{t('pricing.free.description')}</p>
              </div>
              <Button onClick={handleGetStarted} className="w-full">
                {t('pricing.free.cta')}
              </Button>
            </div>

            {/* Premium Plan */}
            <div className="border-2 border-primary rounded-lg p-8 space-y-6 relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
                  {t('pricing.premium.badge')}
                </span>
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold">{t('pricing.premium.title')}</h3>
                <div className="text-4xl font-bold">$1.99</div>
                <p className="text-muted-foreground">{t('pricing.premium.description')}</p>
              </div>
              <Button onClick={handleGetStarted} className="w-full">
                {t('pricing.premium.cta')}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="container mx-auto px-4 py-16 bg-primary text-primary-foreground">
        <div className="text-center space-y-8">
          <h2 className="text-3xl md:text-4xl font-bold">
            {t('finalCta.title')}
          </h2>
          <p className="text-xl max-w-2xl mx-auto opacity-90">
            {t('finalCta.description')}
          </p>
          <Button
            onClick={handleGetStarted}
            size="lg"
            variant="secondary"
            className="px-8 py-3 text-lg font-medium"
          >
            {t('finalCta.button')}
          </Button>
        </div>
      </section>

      {/* Simple Footer */}
      <footer className="border-t bg-muted/50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center space-y-4">
            <div className="text-lg font-semibold">JLPT4YOU</div>
            <p className="text-sm text-muted-foreground">
              © 2025 JLPT4YOU. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

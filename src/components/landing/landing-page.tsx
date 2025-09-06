"use client"

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { LandingHeader } from "@/components/landing/landing-header"
import { HeroSection } from "@/components/landing/hero-section"
import { TranslationData, Language } from "@/lib/i18n/"
import { useScrollPreservation } from "@/lib/use-scroll-preservation"
import { useViewport } from "@/hooks/use-viewport"

// Lazy load below-the-fold components for better LCP
const KeyBenefitsSection = dynamic(() => import("@/components/landing/key-benefits-section").then(mod => ({ default: mod.KeyBenefitsSection })), {
  loading: () => <div className="h-96 bg-muted animate-pulse" />,
  ssr: true
})

const AIExplanationDemo = dynamic(() => import("@/components/landing/ai-explanation-demo").then(mod => ({ default: mod.AIExplanationDemo })), {
  loading: () => <div className="h-96 bg-muted animate-pulse" />,
  ssr: false // Heavy component, client-side only
})

const PricingSection = dynamic(() => import("@/components/landing/pricing-section").then(mod => ({ default: mod.PricingSection })), {
  loading: () => <div className="h-96 bg-muted animate-pulse" />,
  ssr: true
})

const WhyChooseUsSection = dynamic(() => import("@/components/landing/why-choose-us-section").then(mod => ({ default: mod.WhyChooseUsSection })), {
  loading: () => <div className="h-64 bg-muted animate-pulse" />,
  ssr: true
})

const FinalCTASection = dynamic(() => import("@/components/landing/final-cta-section").then(mod => ({ default: mod.FinalCTASection })), {
  loading: () => <div className="h-48 bg-muted animate-pulse" />,
  ssr: true
})

const Footer = dynamic(() => import("@/components/landing/footer").then(mod => ({ default: mod.Footer })), {
  loading: () => <div className="h-32 bg-muted animate-pulse" />,
  ssr: true
})

const LandingChatWidget = dynamic(() => import("@/components/landing-chat").then(mod => ({ default: mod.LandingChatWidget })), {
  loading: () => null,
  ssr: false // Chat widget doesn't need SSR
})

interface LandingPageProps {
  translations: TranslationData
  language?: Language
}

export function LandingPage({ translations, language = 'vn' }: LandingPageProps) {
  // Initialize scroll preservation hook
  useScrollPreservation()
  
  const { isMobile, mounted } = useViewport()
  const [showBelowHero, setShowBelowHero] = useState(false)

  // On mobile, use Intersection Observer to lazy load below-hero content
  useEffect(() => {
    if (!mounted) return
    
    // On desktop, show everything immediately
    if (!isMobile) {
      setShowBelowHero(true)
      return
    }

    // On mobile, wait for user scroll
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setShowBelowHero(true)
            observer.disconnect()
          }
        })
      },
      { rootMargin: '100px' } // Load 100px before visible
    )

    // Observe a trigger element at bottom of hero
    const trigger = document.getElementById('hero-trigger')
    if (trigger) {
      observer.observe(trigger)
    }

    return () => observer.disconnect()
  }, [isMobile, mounted])

  // Create translation function
  const t = (key: string) => {
    const keys = key.split('.');
    let value: any = translations;
    for (const k of keys) {
      value = value?.[k];
    }
    return value || key;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* SEO: Structured semantic HTML with proper heading hierarchy */}
      <LandingHeader translations={translations} />

      <main>
        {/* SEO: Main content area with proper semantic structure */}
        <section aria-label="Hero Section">
          <HeroSection translations={translations} />
        </section>

        {/* Trigger element for lazy loading on mobile */}
        <div id="hero-trigger" className="h-0" />

        {/* On mobile, only render below-hero content after scroll */}
        {(!mounted || !isMobile || showBelowHero) && (
          <>
            <section aria-label="Key Benefits" id="benefits">
              <KeyBenefitsSection translations={translations} />
            </section>

            <section aria-label="AI Demo" id="demo">
              <AIExplanationDemo translations={translations} />
            </section>

            <section aria-label="Pricing" id="pricing">
              <PricingSection translations={translations} />
            </section>

            <section aria-label="Why Choose Us" id="why-choose-us">
              <WhyChooseUsSection translations={translations} />
            </section>

            <section aria-label="Call to Action">
              <FinalCTASection translations={translations} />
            </section>
          </>
        )}
      </main>

      <footer>
        <Footer translations={translations} />
      </footer>

      {/* Landing Chat Widget */}
      <LandingChatWidget translations={translations} />

      {/* SEO: Hidden structured data for better indexing */}
      <div className="sr-only">
        <h1>JLPT4You - {t('seo.structuredData.title')}</h1>
        <p>{t('seo.structuredData.description')}</p>
        {/* Logo replaced with text for SEO - no image file needed */}
        <span>JLPT4YOU Logo</span>
      </div>
    </div>
  )
}

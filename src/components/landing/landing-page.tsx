"use client"

import Image from "next/image"
import { LandingHeader } from "@/components/landing/landing-header"
import { HeroSection } from "@/components/landing/hero-section"
import { KeyBenefitsSection } from "@/components/landing/key-benefits-section"
import { AIExplanationDemo } from "@/components/landing/ai-explanation-demo"
import { PricingSection } from "@/components/landing/pricing-section"
import { WhyChooseUsSection } from "@/components/landing/why-choose-us-section"
import { FinalCTASection } from "@/components/landing/final-cta-section"
import { Footer } from "@/components/landing/footer"
import { TranslationData, Language, createTranslationFunction } from "@/lib/i18n"
import { generateImageAltText } from "@/lib/content-seo"
import { useScrollPreservation } from "@/lib/use-scroll-preservation"

interface LandingPageProps {
  translations: TranslationData
  language?: Language
}

export function LandingPage({ translations, language = 'vn' }: LandingPageProps) {
  // Initialize scroll preservation hook
  useScrollPreservation()

  // Create translation function
  const t = createTranslationFunction(translations)

  // Generate SEO-optimized alt text for images
  const logoAltText = generateImageAltText('logo', { language })

  return (
    <div className="min-h-screen bg-background">
      {/* SEO: Structured semantic HTML with proper heading hierarchy */}
      <LandingHeader translations={translations} />

      <main>
        {/* SEO: Main content area with proper semantic structure */}
        <section aria-label="Hero Section">
          <HeroSection translations={translations} />
        </section>

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
      </main>

      <footer>
        <Footer translations={translations} />
      </footer>

      {/* SEO: Hidden structured data for better indexing */}
      <div className="sr-only">
        <h1>JLPT4You - {t('seo.structuredData.title')}</h1>
        <p>{t('seo.structuredData.description')}</p>
        <Image src="/logo.png" alt={logoAltText} width={32} height={32} />
      </div>
    </div>
  )
}

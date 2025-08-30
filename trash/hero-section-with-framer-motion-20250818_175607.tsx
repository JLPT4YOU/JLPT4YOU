"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { TranslationData } from "@/lib/i18n"
import { useTranslation } from "@/lib/use-translation"
import { setLanguagePreferenceFromPath } from "@/lib/auth-utils"
import { GraduationCap } from "lucide-react"
import { motion } from "framer-motion"

// Simple static background for better LCP performance
const SimpleBackground = () => {
  return (
    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5" />
  )
}

interface HeroSectionProps {
  translations: TranslationData
}

export function HeroSection({ translations }: HeroSectionProps) {
  const router = useRouter()
  const { t, currentLanguage } = useTranslation(translations)

  return (
    <section className="relative py-12 md:py-20 lg:py-24 bg-background overflow-hidden">
      {/* Simple static background for better LCP */}
      <SimpleBackground />

      <div className="app-container app-section relative z-10">
        <div className="app-content">
          <div className="text-center space-y-6 md:space-y-8 max-w-4xl mx-auto">

            {/* Animated Title with Icon - Slide up from bottom */}
            <motion.div
              className="space-y-4"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <div className="flex items-center justify-center space-x-2 mb-6">
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <GraduationCap className="h-8 w-8 md:h-12 md:w-12 text-primary" />
                </motion.div>
                <motion.h1
                  className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                >
                  JLPT4YOU
                </motion.h1>
              </div>
            </motion.div>

            {/* Subheading - Animated from bottom */}
            <motion.div
              className="space-y-4 md:space-y-6"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <h2 className="text-lg md:text-2xl lg:text-3xl font-semibold text-foreground px-2">
                {t('hero.subtitle')}
              </h2>
              <p className="text-sm md:text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed px-4">
                {t('hero.description')}
              </p>
            </motion.div>

            {/* CTA Buttons - Animated from bottom */}
            <motion.div
              className="flex items-center justify-center gap-3 md:gap-4 pt-4 md:pt-6 px-4"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
            >
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Set language preference before redirecting to auth
                  setLanguagePreferenceFromPath(window.location.pathname)
                  router.push(`/auth/${currentLanguage}/login`)
                }}
                className="bg-background border-border text-foreground px-4 md:px-6 py-2 md:py-3 text-sm font-medium hover-muted"
              >
                {t('header.login')}
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  // Set language preference before redirecting to auth
                  setLanguagePreferenceFromPath(window.location.pathname)
                  router.push(`/auth/${currentLanguage}/register`)
                }}
                className="bg-primary text-primary-foreground px-4 md:px-6 py-2 md:py-3 text-sm font-medium"
              >
                {t('hero.ctaButton')}
              </Button>
            </motion.div>

            {/* Social Proof section removed */}

          </div>
        </div>
      </div>
    </section>
  )
}

"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { TranslationData } from "@/lib/i18n"
import { useTranslation } from "@/lib/use-translation"
import { setLanguagePreferenceFromPath } from "@/lib/auth-utils"
import { GraduationCap } from "lucide-react"

// Simple static background for better LCP performance
const SimpleBackground = () => {
  return (
    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5" />
  )
}

// CSS Animation styles for better performance than Framer Motion
const animationStyles = `
  /* Use transform-only animations to keep element visible for LCP */
  @keyframes slideUpFade {
    from {
      transform: translateY(16px);
    }
    to {
      transform: translateY(0);
    }
  }

  @keyframes scaleIn {
    from {
      transform: scale(0.92);
    }
    to {
      transform: scale(1);
    }
  }

  @keyframes slideUpSmall {
    from {
      transform: translateY(12px);
    }
    to {
      transform: translateY(0);
    }
  }

  .animate-slide-up-fade {
    animation: slideUpFade 0.35s ease-out forwards;
    will-change: transform;
  }

  /* Only run animations when parent container has .is-anim-ready */
  .hero-anim :is(.animate-slide-up-fade, .animate-scale-in, .animate-slide-up-title, .animate-slide-up-subtitle, .animate-slide-up-buttons) {
    animation-play-state: paused;
  }
  .hero-anim.is-anim-ready :is(.animate-slide-up-fade, .animate-scale-in, .animate-slide-up-title, .animate-slide-up-subtitle, .animate-slide-up-buttons) {
    animation-play-state: running;
  }

  .animate-scale-in {
    animation: scaleIn 0.4s ease-out 0.05s forwards;
    will-change: transform;
  }

  .animate-slide-up-title {
    animation: slideUpSmall 0.35s ease-out 0s forwards;
    will-change: transform;
  }

  .animate-slide-up-subtitle {
    animation: slideUpFade 0.4s ease-out 0.05s forwards;
    will-change: transform;
  }

  .animate-slide-up-buttons {
    animation: slideUpSmall 0.45s ease-out 0.1s forwards;
    will-change: transform;
  }
`

interface HeroSectionProps {
  translations: TranslationData
}

export function HeroSection({ translations }: HeroSectionProps) {
  const router = useRouter()
  const { t, currentLanguage } = useTranslation(translations)

  // Delay animations until after first frame for better LCP
  useEffect(() => {
    const root = document.getElementById('hero-anim-root')
    if (!root) return
    const raf = requestAnimationFrame(() => {
      root.classList.add('is-anim-ready')
    })
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <>
      {/* Inject CSS animations */}
      <style dangerouslySetInnerHTML={{ __html: animationStyles }} />

      <section className="relative py-12 md:py-20 lg:py-24 bg-background overflow-hidden">
        {/* Simple static background for better LCP */}
        <SimpleBackground />

        <div className="app-container app-section relative z-10">
          <div className="app-content hero-anim" id="hero-anim-root">
            <div className="text-center space-y-6 md:space-y-8 max-w-4xl mx-auto">

              {/* Animated Title with Icon - CSS animations for better performance */}
              <div className="space-y-4 animate-slide-up-fade">
                <div className="flex items-center justify-center space-x-2 mb-6">
                  <div className="animate-scale-in">
                    <GraduationCap className="h-8 w-8 md:h-12 md:w-12 text-primary" />
                  </div>
                  <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground">
                    JLPT4YOU
                  </h1>
                </div>
              </div>

            {/* Subheading - keep static to be good LCP text */}
            <div className="space-y-4 md:space-y-6">
              <h2 className="text-lg md:text-2xl lg:text-3xl font-semibold text-foreground px-2">
                {t('hero.subtitle')}
              </h2>
              <p className="text-sm md:text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed px-4">
                {t('hero.description')}
              </p>
            </div>

            {/* CTA Buttons - animate after first frame */}
            <div className="flex items-center justify-center gap-3 md:gap-4 pt-4 md:pt-6 px-4 animate-slide-up-buttons">
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
            </div>

            {/* Social Proof section removed */}

          </div>
        </div>
      </div>
    </section>
    </>
  )
}

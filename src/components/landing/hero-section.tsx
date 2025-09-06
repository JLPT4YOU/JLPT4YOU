"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { TranslationData } from "@/lib/i18n/"
import { useTranslation } from "@/lib/use-translation"
import { setLanguagePreferenceFromPath } from "@/lib/auth-utils"
import { GraduationCap } from "lucide-react"

// Animated gradient background for visual interest
const AnimatedBackground = () => {
  return (
    <>
      <div className="absolute inset-0 animated-gradient" />
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background/95 to-background" />
    </>
  )
}

// CSS Animation styles for better performance than Framer Motion
const animationStyles = `
  /* Gradient animation for background */
  @keyframes gradientShift {
    0% {
      background-position: 0% 50%;
    }
    50% {
      background-position: 100% 50%;
    }
    100% {
      background-position: 0% 50%;
    }
  }

  /* Float animation for icon */
  @keyframes floatIcon {
    0%, 100% {
      transform: translateY(0px);
    }
    50% {
      transform: translateY(-10px);
    }
  }

  /* Typewriter effect for title */
  @keyframes typewriter {
    from {
      width: 0;
    }
    to {
      width: 100%;
    }
  }

  /* Fade in with scale */
  @keyframes fadeInScale {
    from {
      opacity: 0;
      transform: scale(0.95) translateY(10px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }

  /* Slide up fade for text */
  @keyframes slideUpFade {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* Button hover pulse */
  @keyframes buttonPulse {
    0% {
      box-shadow: 0 0 0 0 rgba(var(--primary-rgb), 0.4);
    }
    70% {
      box-shadow: 0 0 0 10px rgba(var(--primary-rgb), 0);
    }
    100% {
      box-shadow: 0 0 0 0 rgba(var(--primary-rgb), 0);
    }
  }

  /* Animated gradient background */
  .animated-gradient {
    background: linear-gradient(
      -45deg,
      var(--primary) 0%,
      var(--secondary) 25%,
      var(--accent) 50%,
      var(--primary) 100%
    );
    background-size: 400% 400%;
    animation: gradientShift 15s ease infinite;
    opacity: 0.05;
  }

  /* Floating icon */
  .float-icon {
    animation: floatIcon 3s ease-in-out infinite;
  }

  /* Title animation */
  .hero-title {
    overflow: hidden;
    white-space: nowrap;
    animation: fadeInScale 0.6s ease-out forwards;
  }

  /* Subtitle animation */
  .hero-subtitle {
    opacity: 0;
    animation: slideUpFade 0.7s ease-out 0.3s forwards;
  }

  /* Description animation */
  .hero-description {
    opacity: 0;
    animation: slideUpFade 0.8s ease-out 0.5s forwards;
  }

  /* Buttons animation */
  .hero-buttons {
    opacity: 0;
    animation: slideUpFade 0.9s ease-out 0.7s forwards;
  }

  /* Button hover effect */
  .btn-pulse:hover {
    animation: buttonPulse 1.5s infinite;
  }

  /* CSS variables for primary RGB */
  :root {
    --primary-rgb: 26, 26, 26;
  }
  .dark {
    --primary-rgb: 255, 255, 255;
  }
`

interface HeroSectionProps {
  translations: TranslationData
}

export function HeroSection({ translations }: HeroSectionProps) {
  const router = useRouter()
  const { t, currentLanguage } = useTranslation(translations)

  // No delay needed for CSS animations
  useEffect(() => {
    // Preload fonts for smooth animation
    document.fonts.ready.then(() => {
      // Font loaded, animations will be smooth
    })
  }, [])

  return (
    <>
      {/* Inject CSS animations */}
      <style dangerouslySetInnerHTML={{ __html: animationStyles }} />

      <section className="relative py-12 md:py-20 lg:py-24 bg-background overflow-hidden">
        {/* Animated gradient background */}
        <AnimatedBackground />

        <div className="app-container app-section relative z-10">
          <div className="app-content">
            <div className="text-center space-y-6 md:space-y-8 max-w-4xl mx-auto">

              {/* Animated Title with Floating Icon */}
              <div className="space-y-4">
                <div className="flex items-center justify-center space-x-3 mb-6">
                  <div className="float-icon">
                    <GraduationCap className="h-10 w-10 md:h-14 md:w-14 text-primary" />
                  </div>
                  <h1 className="hero-title text-4xl md:text-6xl lg:text-7xl font-bold text-foreground">
                    JLPT4YOU
                  </h1>
                </div>
              </div>

            {/* Animated Subheading */}
            <div className="space-y-4 md:space-y-6">
              <h2 className="hero-subtitle text-lg md:text-2xl lg:text-3xl font-semibold text-foreground px-2">
                {t('hero.subtitle')}
              </h2>
              <p className="hero-description text-sm md:text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed px-4">
                {t('hero.description')}
              </p>
            </div>

            {/* Animated CTA Buttons */}
            <div className="hero-buttons flex items-center justify-center gap-3 md:gap-4 pt-4 md:pt-6 px-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Set language preference before redirecting to auth
                  setLanguagePreferenceFromPath(window.location.pathname)
                  router.push(`/auth/${currentLanguage}/login`)
                }}
                className="bg-background border-border text-foreground px-4 md:px-6 py-2 md:py-3 text-sm font-medium hover-muted transition-all duration-300 hover:scale-105"
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
                className="btn-pulse bg-primary text-primary-foreground px-4 md:px-6 py-2 md:py-3 text-sm font-medium transition-all duration-300 hover:scale-105"
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

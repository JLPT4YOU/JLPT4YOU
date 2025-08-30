"use client"

import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { TranslationData, getLocalizedPath } from "@/lib/i18n"
import { useTranslation } from "@/lib/use-translation"
import { setLanguagePreferenceFromPath } from "@/lib/auth-utils"

// Import motion directly for better compatibility
import { motion } from "framer-motion"

const SimpleTetrisAnimation = dynamic(() => import("./simple-tetris-animation").then(mod => ({ default: mod.SimpleTetrisAnimation })), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-gradient-to-br from-primary/10 to-secondary/10 rounded-lg" />
})

// Star type definition
interface Star {
  id: string
  x: number
  y: number
  size: number
  delay: number
  duration: number
  type: 'large' | 'medium' | 'small'
}

// Sparkling Stars Background Component
const SparklingStarsBackground = () => {
  const [stars, setStars] = useState<Star[]>([])
  const [isClient, setIsClient] = useState(false)

  // Only generate stars on client-side to avoid hydration mismatch
  useEffect(() => {
    setIsClient(true)

    const generateStars = (): Star[] => {
    const stars: Star[] = []
    const minDistance = 8 // Minimum distance between stars (in percentage)

    // Helper function to check if position is too close to existing stars
    const isTooClose = (newX: number, newY: number, existingStars: Star[]) => {
      return existingStars.some(star => {
        const distance = Math.sqrt(
          Math.pow(newX - star.x, 2) + Math.pow(newY - star.y, 2)
        )
        return distance < minDistance
      })
    }

    // Helper function to generate safe position
    const generateSafePosition = (existingStars: Star[], maxAttempts = 50) => {
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const x = Math.random() * 100
        const y = Math.random() * 100

        if (!isTooClose(x, y, existingStars)) {
          return { x, y }
        }
      }
      // Fallback: return random position if can't find safe spot
      return { x: Math.random() * 100, y: Math.random() * 100 }
    }

    // Large bright stars first (need most space) - reduced for performance
    for (let i = 0; i < 3; i++) {
      const position = generateSafePosition(stars)
      stars.push({
        id: `large-${i}`,
        x: position.x,
        y: position.y,
        size: Math.random() * 3 + 5, // 5-8px
        delay: Math.random() * 8,
        duration: Math.random() * 5 + 4, // 4-9s
        type: 'large'
      })
    }

    // Medium stars (less common) - reduced for performance
    for (let i = 0; i < 8; i++) {
      const position = generateSafePosition(stars)
      stars.push({
        id: `medium-${i}`,
        x: position.x,
        y: position.y,
        size: Math.random() * 2 + 3, // 3-5px
        delay: Math.random() * 6,
        duration: Math.random() * 4 + 3, // 3-7s
        type: 'medium'
      })
    }

    // Small twinkling stars (most common) - reduced for performance
    for (let i = 0; i < 20; i++) { // Further reduced for better performance
      const position = generateSafePosition(stars)
      stars.push({
        id: `small-${i}`,
        x: position.x,
        y: position.y,
        size: Math.random() * 2 + 1, // 1-3px
        delay: Math.random() * 5,
        duration: Math.random() * 3 + 2, // 2-5s
        type: 'small'
      })
    }

      return stars
    }

    setStars(generateStars())
  }, [])

  // Don't render anything on server-side to avoid hydration mismatch
  if (!isClient) {
    return <div className="absolute inset-0 overflow-hidden opacity-60" />
  }

  return (
    <div className="absolute inset-0 overflow-hidden opacity-60 pointer-events-none">
      {stars.map((star) => (
        <motion.div
          key={star.id}
          className={`absolute rounded-full ${
            star.type === 'large'
              ? 'bg-primary shadow-lg'
              : star.type === 'medium'
              ? 'bg-foreground shadow-md'
              : 'bg-foreground/80'
          }`}
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            boxShadow: star.type === 'large'
              ? '0 0 10px rgba(255,255,255,0.3)'
              : star.type === 'medium'
              ? '0 0 6px rgba(255,255,255,0.2)'
              : 'none'
          }}
          animate={{
            opacity: star.type === 'large'
              ? [0.3, 1, 0.3]
              : star.type === 'medium'
              ? [0.2, 0.8, 0.2]
              : [0.1, 0.6, 0.1],
            scale: star.type === 'large'
              ? [0.8, 1.3, 0.8]
              : star.type === 'medium'
              ? [0.9, 1.2, 0.9]
              : [0.8, 1.1, 0.8],
          }}
          transition={{
            duration: star.duration,
            delay: star.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  )
}

// Clean background - only sparkling stars, no learning icons

interface HeroSectionProps {
  translations: TranslationData
}

export function HeroSection({ translations }: HeroSectionProps) {
  const router = useRouter()
  const [isVisible, setIsVisible] = useState(false)
  const { t, currentLanguage } = useTranslation(translations)

  useEffect(() => {
    // Start animation immediately for better LCP
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 100) // Much faster for better performance

    return () => clearTimeout(timer)
  }, [])

  return (
    <section className="relative py-12 md:py-20 lg:py-24 bg-background overflow-hidden">
      {/* Clean Sparkling Stars Background Only */}
      <SparklingStarsBackground />

      <div className="app-container app-section relative z-10">
        <div className="app-content">
          <div className="text-center space-y-6 md:space-y-8 max-w-4xl mx-auto">
            
            {/* Tetris Animation Title */}
            <div className="space-y-4">
              <SimpleTetrisAnimation isVisible={isVisible} />
            </div>

            {/* Subheading */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }} // Faster animation for better LCP
              className="space-y-4 md:space-y-6"
            >
              <h2 className="text-lg md:text-2xl lg:text-3xl font-semibold text-foreground px-2">
                {t('hero.subtitle')}
              </h2>
              <p className="text-sm md:text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed px-4">
                {t('hero.description')}
              </p>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }} // Faster animation for better LCP
              className="flex items-center justify-center gap-3 md:gap-4 pt-4 md:pt-6 px-4"
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

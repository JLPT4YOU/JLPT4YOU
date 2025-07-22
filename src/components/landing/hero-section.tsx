"use client"

import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { SimpleTetrisAnimation } from "./simple-tetris-animation"
import { useEffect, useState } from "react"
import { TranslationData } from "@/lib/i18n"
import { useTranslation } from "@/lib/use-translation"
// No learning icons needed - only stars background

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

    // Large bright stars first (need most space)
    for (let i = 0; i < 5; i++) {
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

    // Medium stars (less common)
    for (let i = 0; i < 12; i++) {
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

    // Small twinkling stars (most common)
    for (let i = 0; i < 30; i++) { // Reduced from 35 to 30 for better spacing
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
    <div className="absolute inset-0 overflow-hidden opacity-60">
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
  const { t } = useTranslation(translations)

  useEffect(() => {
    // Start animation after component mounts
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 800) // Longer delay for better UX

    return () => clearTimeout(timer)
  }, [])

  return (
    <section className="relative py-16 md:py-20 lg:py-24 bg-background overflow-hidden">
      {/* Clean Sparkling Stars Background Only */}
      <SparklingStarsBackground />
      
      <div className="app-container app-section">
        <div className="app-content">
          <div className="text-center space-y-8 max-w-4xl mx-auto">
            
            {/* Tetris Animation Title */}
            <div className="space-y-4">
              <SimpleTetrisAnimation isVisible={isVisible} />
            </div>

            {/* Subheading */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 2.8 }} // Wait for simple animation to complete (8 letters * 0.25 + 0.8)
              className="space-y-6"
            >
              <h2 className="text-xl md:text-2xl lg:text-3xl font-semibold text-foreground">
                {t('hero.subtitle')}
              </h2>
              <p className="text-base md:text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed px-4">
                {t('hero.description')}
              </p>
            </motion.div>

            {/* CTA Button */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 3.4 }}
              className="flex items-center justify-center pt-6"
            >
              <Button
                size="lg"
                onClick={() => router.push('/register')}
                className="bg-primary text-primary-foreground px-8 py-3 text-base md:text-lg font-medium min-w-[180px] md:min-w-[200px]"
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

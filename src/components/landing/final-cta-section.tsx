"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ArrowRight, Star } from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { TranslationData } from "@/lib/i18n"
import { useTranslation } from "@/lib/use-translation"

interface FinalCTASectionProps {
  translations: TranslationData
}

// Final CTA Section Component
export const FinalCTASection = ({ translations }: FinalCTASectionProps) => {
  const router = useRouter()
  const { t } = useTranslation(translations)
  const [stars, setStars] = useState<Array<{
    id: number
    left: number
    top: number
    duration: number
    delay: number
  }>>([])
  const [isClient, setIsClient] = useState(false)

  // Only generate stars on client-side to avoid hydration mismatch
  useEffect(() => {
    setIsClient(true)
    setStars(
      Array.from({ length: 20 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        duration: 3 + Math.random() * 2,
        delay: Math.random() * 2,
      }))
    )
  }, [])

  return (
    <section className="relative bg-foreground py-16 md:py-20 lg:py-24 overflow-hidden">
      <div className="app-container app-section">
        <div className="app-content">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            {/* Subtle star pattern */}
            {isClient && stars.map((star) => (
              <motion.div
                key={star.id}
                className="absolute"
                style={{
                  left: `${star.left}%`,
                  top: `${star.top}%`,
                }}
                animate={{
                  opacity: [0.3, 1, 0.3],
                  scale: [0.8, 1.2, 0.8],
                }}
                transition={{
                  duration: star.duration,
                  repeat: Infinity,
                  delay: star.delay,
                }}
              >
                <Star className="w-4 h-4 text-background fill-current" />
              </motion.div>
            ))}
          </div>

          <div className="relative z-10 text-center max-w-4xl mx-auto">
            {/* Main Heading */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
              className="mb-6 md:mb-8"
            >
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-background mb-4">
                {t('finalCta.title')}
              </h2>
              <p className="text-lg md:text-xl text-background/80 max-w-2xl mx-auto leading-relaxed">
                {t('finalCta.subtitle')}
              </p>
            </motion.div>

            {/* Key Benefits */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-10"
            >
              {(t('finalCta.benefits') as string[]).map((benefit, index) => (
                <div key={index} className="flex items-center justify-center gap-2 text-background/90">
                  <Star className="w-5 h-5 fill-current" />
                  <span className="text-sm md:text-base font-medium">{benefit}</span>
                </div>
              ))}
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Button
                size="lg"
                onClick={() => router.push('/register')}
                className="w-full sm:w-auto bg-background text-foreground px-8 py-4 text-base md:text-lg font-semibold shadow-lg group hover-brightness-light"
              >
                {t('finalCta.button')}
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform text-foreground" />
              </Button>

              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto border-2 border-background text-background px-8 py-4 text-base md:text-lg font-semibold hover:border-background/80 hover:text-background/90 transition-colors"
              >
                {t('finalCta.upgradeButton')}
              </Button>
            </motion.div>

            {/* Trust Signal */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="mt-8 text-center"
            >
              <p className="text-sm md:text-base text-background/70">
                {t('finalCta.trustSignal')}
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}

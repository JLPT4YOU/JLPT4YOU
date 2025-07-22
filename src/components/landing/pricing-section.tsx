"use client"

import { motion } from "framer-motion"
import { Check, X, Crown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TranslationData } from "@/lib/i18n"
import { useTranslation } from "@/lib/use-translation"

interface PricingSectionProps {
  translations: TranslationData
}

// Pricing Section Component
export const PricingSection = ({ translations }: PricingSectionProps) => {
  const { t } = useTranslation(translations)

  // Get pricing data from translations
  const freeData = t('pricing.free') as {
    name: string; price: string; period: string; description: string; features: string[]; limitations: string[]; button: string
  }
  const premiumData = t('pricing.premium') as {
    name: string; price: string; period: string; description: string; features: string[]; button: string; badge: string
  }

  const pricingTiers = [
    {
      id: "free",
      name: freeData.name,
      price: freeData.price,
      period: freeData.period,
      description: freeData.description,
      isRecommended: false,
      features: [
        ...freeData.features.map((text: string) => ({ text, included: true })),
        ...freeData.limitations.map((text: string) => ({ text, included: false }))
      ],
      ctaText: freeData.button,
      ctaVariant: "outline" as const
    },
    {
      id: "premium",
      name: premiumData.name,
      price: premiumData.price,
      period: premiumData.period,
      description: premiumData.description,
      badge: premiumData.badge,
      isRecommended: true,
      features: premiumData.features.map((text: string) => ({ text, included: true })),
      ctaText: premiumData.button,
      ctaVariant: "default" as const
    }
  ]
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1
      }
    }
  }

  const cardVariants = {
    hidden: { 
      opacity: 0, 
      y: 30,
      scale: 0.95
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        duration: 0.6
      }
    }
  }

  return (
    <section id="pricing" className="relative bg-background py-16 md:py-20 lg:py-24">
      <div className="app-container app-section">
        <div className="app-content">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12 md:mb-16"
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              {t('pricing.title')}
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              {t('pricing.subtitle')}
            </p>
          </motion.div>

          {/* Pricing Cards */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 max-w-5xl mx-auto"
          >
            {pricingTiers.map((tier) => (
              <motion.div
                key={tier.id}
                variants={cardVariants}
                whileHover={{ 
                  y: -8,
                  transition: { duration: 0.3 }
                }}
                className="group relative"
              >
                <div className={`
                  relative bg-background rounded-2xl p-6 md:p-8 h-full
                  ${tier.isRecommended
                    ? 'border-2 border-foreground bg-muted/5 shadow-lg hover-card'
                    : 'border border-border/50 hover-card-scale'
                  }
                `}>
                  {/* Recommended Badge */}
                  {tier.isRecommended && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <div className="bg-foreground text-background px-4 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                        <Crown className="w-4 h-4" />
                        {premiumData.badge}
                      </div>
                    </div>
                  )}

                  {/* Tier Header */}
                  <div className="text-center mb-6">
                    <h3 className="text-xl md:text-2xl font-semibold text-foreground mb-2">
                      {tier.name}
                    </h3>
                    <div className="mb-2">
                      <span className={`
                        font-black text-foreground
                        ${tier.isRecommended ? 'text-3xl md:text-4xl' : 'text-2xl md:text-3xl'}
                      `}>
                        {tier.price}
                      </span>
                      <span className="text-base md:text-lg text-muted-foreground ml-1">
                        {tier.period}
                      </span>
                    </div>
                    <p className="text-sm md:text-base text-muted-foreground">
                      {tier.description}
                    </p>
                  </div>

                  {/* Features List */}
                  <div className="space-y-3 mb-8">
                    {tier.features.map((feature, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          {feature.included ? (
                            <Check className="w-5 h-5 text-green-600" />
                          ) : (
                            <X className="w-5 h-5 text-red-500" />
                          )}
                        </div>
                        <span className={`
                          text-sm md:text-base leading-relaxed
                          ${feature.included ? 'text-foreground' : 'text-muted-foreground line-through'}
                        `}>
                          {feature.text}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* CTA Button */}
                  <div className="mt-auto">
                    <Button
                      variant={tier.ctaVariant}
                      size="lg"
                      className={`
                        w-full py-3 text-base md:text-lg font-medium
                        ${tier.isRecommended
                          ? 'bg-foreground text-background hover-brightness-medium'
                          : 'bg-transparent border-border text-foreground hover-ghost'
                        }
                      `}
                    >
                      {tier.ctaText}
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}

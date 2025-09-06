"use client"

import { motion } from "framer-motion"
import { FileText, Bot, Library, TrendingUp } from "lucide-react"
import { TranslationData } from "@/lib/i18n/"
import { useTranslation } from "@/lib/use-translation"

interface KeyBenefitsSectionProps {
  translations: TranslationData
}

// Key Benefits Section Component
export const KeyBenefitsSection = ({ translations }: KeyBenefitsSectionProps) => {
  const { t } = useTranslation(translations)

  const benefitItems = t('benefits.items') as Array<{title: string, description: string}>

  const benefits = [
    {
      id: 1,
      icon: FileText,
      title: benefitItems[0]?.title || "",
      description: benefitItems[0]?.description || ""
    },
    {
      id: 2,
      icon: Bot,
      title: benefitItems[1]?.title || "",
      description: benefitItems[1]?.description || ""
    },
    {
      id: 3,
      icon: Library,
      title: benefitItems[2]?.title || "",
      description: benefitItems[2]?.description || ""
    },
    {
      id: 4,
      icon: TrendingUp,
      title: benefitItems[3]?.title || "",
      description: benefitItems[3]?.description || ""
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

  const itemVariants = {
    hidden: { 
      opacity: 0, 
      y: 30 
    },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.6
      }
    }
  }

  return (
    <section id="features" className="relative bg-background py-12 md:py-20 lg:py-24">
      <div className="app-container app-section">
        <div className="app-content px-4">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8 md:mb-16"
          >
            <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              {t('benefits.title')}
            </h2>
            <p className="text-base md:text-xl text-muted-foreground max-w-2xl mx-auto">
              {t('benefits.subtitle')}
            </p>
          </motion.div>

          {/* Benefits Grid */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8"
          >
            {benefits.map((benefit) => {
              const IconComponent = benefit.icon
              
              return (
                <motion.div
                  key={benefit.id}
                  variants={itemVariants}
                  whileHover={{ 
                    y: -8,
                    transition: { duration: 0.3 }
                  }}
                  className="group"
                >
                  <div className="bg-background rounded-2xl p-4 md:p-8 h-full border border-border/50 hover-card-scale">
                    {/* Icon */}
                    <div className="mb-4 md:mb-6">
                      <div className="w-10 h-10 md:w-14 md:h-14 bg-muted rounded-xl flex items-center justify-center hover-brightness-light">
                        <IconComponent className="w-5 h-5 md:w-7 md:h-7 text-foreground" />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="space-y-2 md:space-y-3">
                      <h3 className="text-base md:text-xl font-semibold text-foreground leading-tight">
                        {benefit.title}
                      </h3>
                      <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                        {benefit.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        </div>
      </div>
    </section>
  )
}

"use client"

import { motion } from "framer-motion"
import { AlertTriangle, CheckCircle, Clock, DollarSign, BookOpen } from "lucide-react"
import { TranslationData } from "@/lib/i18n/"
import { useTranslation } from "@/lib/use-translation"

interface WhyChooseUsSectionProps {
  translations: TranslationData
}

// Why Choose Us Section Component
export const WhyChooseUsSection = ({ translations }: WhyChooseUsSectionProps) => {
  const { t } = useTranslation(translations)

  // Problem-Solution Data
  const problemSolutionItems = t('whyChooseUs.problems') as Array<{problem: string, solution: string}>

  const problemSolutions = [
    {
      id: 1,
      problem: problemSolutionItems[0]?.problem || "",
      solution: problemSolutionItems[0]?.solution || "",
      icon: Clock
    },
    {
      id: 2,
      problem: problemSolutionItems[1]?.problem || "",
      solution: problemSolutionItems[1]?.solution || "",
      icon: DollarSign
    },
    {
      id: 3,
      problem: problemSolutionItems[2]?.problem || "",
      solution: problemSolutionItems[2]?.solution || "",
      icon: BookOpen
    }
  ]
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2
      }
    }
  }

  const itemVariants = {
    hidden: {
      opacity: 0,
      x: -30
    },
    visible: {
      opacity: 1,
      x: 0
    }
  }

  const ctaVariants = {
    hidden: {
      opacity: 0,
      y: 30
    },
    visible: {
      opacity: 1,
      y: 0
    }
  }

  return (
    <section id="why-choose-us" className="relative bg-muted/5 py-10 md:py-16">
      <div className="app-container app-section">
        <div className="app-content px-4">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-6 md:mb-12"
          >
            <h2 className="text-xl md:text-3xl lg:text-4xl font-bold text-foreground mb-3">
              {t('whyChooseUs.title')}
            </h2>
            <p className="text-sm md:text-lg text-muted-foreground max-w-xl mx-auto">
              {t('whyChooseUs.subtitle')}
            </p>
          </motion.div>

          {/* Problem vs Solution Comparison */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="max-w-5xl mx-auto mb-6 md:mb-10"
          >
            {/* Table Header */}
            <div className="hidden md:grid md:grid-cols-2 gap-4 mb-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                  <h3 className="text-xl font-semibold text-foreground">
                    {t('whyChooseUs.problemLabel')} {t('whyChooseUs.problemTitle')}
                  </h3>
                </div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <h3 className="text-xl font-semibold text-foreground">
                    {t('whyChooseUs.solutionLabel')} {t('whyChooseUs.solutionTitle')}
                  </h3>
                </div>
              </div>
            </div>

            {/* Problem-Solution Rows */}
            <div className="space-y-3 md:space-y-4">
              {problemSolutions.map((item) => {
                const IconComponent = item.icon

                return (
                  <motion.div
                    key={item.id}
                    variants={itemVariants}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="bg-background rounded-2xl border border-border/50 overflow-hidden hover:border-border transition-colors duration-300"
                  >
                    {/* Mobile Layout */}
                    <div className="md:hidden p-4">
                      <div className="flex items-start gap-3 mb-3">
                        <AlertTriangle className="w-4 h-4 text-destructive mt-1 flex-shrink-0" />
                        <div>
                          <h4 className="text-xs font-medium text-muted-foreground mb-1">{t('whyChooseUs.problemLabel')}</h4>
                          <p className="text-sm text-foreground leading-relaxed">
                            {item.problem}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <IconComponent className="w-4 h-4 text-success mt-1 flex-shrink-0" />
                        <div>
                          <h4 className="text-xs font-medium text-muted-foreground mb-1">{t('whyChooseUs.solutionLabel')}</h4>
                          <p className="text-sm text-foreground leading-relaxed">
                            {item.solution}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Desktop Layout */}
                    <div className="hidden md:grid md:grid-cols-2">
                      {/* Problem Side */}
                      <div className="p-4 md:p-6 border-r border-border/50">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="w-4 h-4 text-destructive mt-1 flex-shrink-0" />
                          <p className="text-sm md:text-base text-foreground leading-relaxed">
                            {item.problem}
                          </p>
                        </div>
                      </div>

                      {/* Solution Side */}
                      <div className="p-4 md:p-6 bg-success/5">
                        <div className="flex items-start gap-3">
                          <IconComponent className="w-4 h-4 text-success flex-shrink-0 mt-1" />
                          <p className="text-sm md:text-base text-foreground leading-relaxed font-medium">
                            {item.solution}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>

          {/* Call-to-Action Summary */}
          <motion.div
            variants={ctaVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.8 }}
            className="max-w-3xl mx-auto text-center"
          >
            <div className="bg-background rounded-2xl border border-border/50 p-6 shadow-lg">
              {/* Problem Statement */}
              <div className="mb-4">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  <span className="text-base md:text-lg text-muted-foreground">
                    {t('whyChooseUs.finalProblem')}
                  </span>
                </div>
              </div>

              {/* Solution Statement */}
              <div className="mb-4">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-base md:text-lg font-medium text-foreground">
                    {t('whyChooseUs.finalSolution')}
                  </span>
                </div>
              </div>

              {/* Price Comparison */}
              <div className="text-center">
                <div className="inline-flex items-center gap-2 text-base md:text-lg font-semibold text-foreground">
                  <span className="text-xl">👉</span>
                  <span>{t('whyChooseUs.priceComparison')}</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

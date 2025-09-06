/**
 * Premium Pricing Page Component
 * Component hiển thị bảng giá gọn gàng với 2 gói: Free và Premium
 */

"use client"

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Crown, Check, X, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { useTranslations } from '@/hooks/use-translations'
import { TranslationData } from '@/lib/i18n'

interface PremiumPricingPageProps {
  translations: TranslationData
}

export function PremiumPricingPage({ translations }: PremiumPricingPageProps) {
  const router = useRouter()
  const { user } = useAuth()
  const { t } = useTranslations()

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5 }
    }
  }

  // Get pricing data from translations with fallbacks
  const freeData = (t('pricing.free') || {
    name: 'Free',
    price: '$0',
    period: '/month',
    description: 'Perfect for getting started',
    features: ['5 exams per month', 'Basic N5-N4 vocabulary', 'N5-N4 grammar', 'Basic result reports'],
    limitations: ['No AI explanations', 'No progress tracking', 'No advanced materials'],
    button: 'Get Started Free'
  }) as {
    name: string; price: string; period: string; description: string; features: string[]; limitations: string[]; button: string
  }

  const premiumData = (t('pricing.premium') || {
    name: 'Premium',
    price: '$2.49',
    period: '/month',
    description: 'Complete learning experience',
    features: ['Unlimited exams', 'Complete N5-N1 vocabulary', 'Detailed N5-N1 grammar', 'iRIN AI explanations', 'Detailed progress tracking', 'Exclusive materials library', 'Priority support'],
    button: 'Upgrade to Premium',
    badge: 'RECOMMENDED'
  }) as {
    name: string; price: string; period: string; description: string; features: string[]; button: string; badge: string
  }

  const handleFreePlan = () => {
    if (!user) {
      router.push('/auth')
      return
    }
    // User already has free access, redirect to home
    router.push('/home')
  }

  const handlePremiumPlan = () => {
    if (!user) {
      router.push('/auth')
      return
    }

    if (user.role === 'Premium') {
      router.push('/home')
      return
    }

    router.push('/premium')
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12"
      >
        <Crown className="w-16 h-16 mx-auto mb-6 text-foreground" />
        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
          {t('pricing.title')}
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          {t('pricing.subtitle')}
        </p>
      </motion.div>

      {/* Pricing Cards */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto"
      >
        {/* Free Plan */}
        <motion.div
          variants={cardVariants}
          className="group relative"
        >
          <div className="relative bg-background rounded-2xl p-8 h-full border border-border/50 hover:border-border transition-colors">
            {/* Plan Header */}
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-foreground mb-2">
                {freeData.name}
              </h3>
              <p className="text-muted-foreground mb-4">
                {freeData.description}
              </p>
              <div className="flex items-baseline justify-center">
                <span className="text-5xl font-bold text-foreground">
                  {freeData.price}
                </span>
                <span className="text-muted-foreground ml-2">
                  {freeData.period}
                </span>
              </div>
            </div>

            {/* Features */}
            <div className="space-y-4 mb-8">
              {(freeData.features || []).map((feature, index) => (
                <div key={index} className="flex items-center">
                  <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-foreground">{feature}</span>
                </div>
              ))}
              {(freeData.limitations || []).map((limitation, index) => (
                <div key={index} className="flex items-center">
                  <X className="w-5 h-5 text-red-500 mr-3 flex-shrink-0" />
                  <span className="text-muted-foreground">{limitation}</span>
                </div>
              ))}
            </div>

            {/* CTA Button */}
            <Button
              onClick={handleFreePlan}
              variant="outline"
              size="lg"
              className="w-full"
            >
              {freeData.button}
            </Button>
          </div>
        </motion.div>

        {/* Premium Plan */}
        <motion.div
          variants={cardVariants}
          className="group relative"
        >
          <div className="relative bg-background rounded-2xl p-8 h-full border-2 border-foreground bg-muted/5 shadow-lg">
            {/* Recommended Badge */}
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <div className="bg-foreground text-background px-4 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                <Crown className="w-4 h-4" />
                {premiumData.badge}
              </div>
            </div>

            {/* Plan Header */}
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-foreground mb-2">
                {premiumData.name}
              </h3>
              <p className="text-muted-foreground mb-4">
                {premiumData.description}
              </p>
              <div className="flex items-baseline justify-center">
                <span className="text-5xl font-bold text-foreground">
                  {premiumData.price}
                </span>
                <span className="text-muted-foreground ml-2">
                  {premiumData.period}
                </span>
              </div>
            </div>

            {/* Features */}
            <div className="space-y-4 mb-8">
              {(premiumData.features || []).map((feature, index) => (
                <div key={index} className="flex items-center">
                  <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-foreground">{feature}</span>
                </div>
              ))}
            </div>

            {/* CTA Button */}
            <Button
              onClick={handlePremiumPlan}
              size="lg"
              className="w-full"
              disabled={user?.role === 'Premium'}
            >
              {user?.role === 'Premium' ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Đã có Premium
                </>
              ) : (
                <>
                  {premiumData.button}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}

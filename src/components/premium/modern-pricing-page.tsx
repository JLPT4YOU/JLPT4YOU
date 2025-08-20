/**
 * Modern Premium Pricing Page
 * Inspired by Stripe, Vercel, and modern SaaS pricing pages
 */

"use client"

import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Crown, 
  Check, 
  X, 
  Sparkles, 
  Zap,
  Shield,
  Users,
  BookOpen,
  Brain,
  TrendingUp,
  Award,
  Clock,
  ChevronRight,
  Star
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context-simple'
import { useLanguageContext } from '@/contexts/language-context'
import { cn } from '@/lib/utils'

interface ModernPricingPageProps {
  translations?: any
}

export function ModernPricingPage({ translations }: ModernPricingPageProps) {
  const router = useRouter()
  const { user } = useAuth()
  const { t } = useLanguageContext()
  // Removed billing period toggle - going directly to checkout

  // Pricing data
  const plans = [
    {
      id: 'free',
      name: t('pricing.free.name'),
      description: t('pricing.free.description'),
      price: {
        monthly: 0,
        yearly: 0
      },
      features: [
        { text: t('pricing.free.features.0'), included: true, highlight: false },
        { text: t('pricing.free.features.1'), included: true, highlight: false },
        { text: t('pricing.free.features.2'), included: true, highlight: false },
        { text: t('pricing.free.features.3'), included: true, highlight: false },
        { text: t('pricing.premium.features.2'), included: false, highlight: false },
        { text: t('pricing.premium.features.4'), included: false, highlight: false },
        { text: t('pricing.premium.features.5'), included: false, highlight: false },
        { text: t('pricing.premium.features.6'), included: false, highlight: false }
      ],
      cta: t('pricing.free.button'),
      popular: false,
      gradient: 'from-gray-500/10 to-gray-600/10',
      borderColor: 'border-gray-200 dark:border-gray-800',
      current: user && user.role !== 'Premium'
    },
    {
      id: 'premium',
      name: t('pricing.premium.name'),
      description: t('pricing.premium.description'),
      price: {
        monthly: 1.99,
        yearly: 19.99 // Save ~17%
      },
      originalPrice: {
        monthly: null,
        yearly: 23.88
      },
      features: [
        { text: t('pricing.premium.features.0'), included: true, highlight: true },
        { text: t('pricing.premium.features.1'), included: true, highlight: true },
        { text: t('pricing.premium.features.2'), included: true, highlight: false },
        { text: t('pricing.premium.features.3'), included: true, highlight: true },
        { text: t('pricing.premium.features.4'), included: true, highlight: false },
        { text: t('pricing.premium.features.5'), included: true, highlight: false },
        { text: t('pricing.premium.features.6'), included: true, highlight: false },
        { text: t('pages.payment.premiumFeature1'), included: true, highlight: false }
      ],
      cta: t('pricing.premium.button'),
      popular: true,
      gradient: 'from-primary/20 via-primary/10 to-secondary/20',
      borderColor: 'border-primary/50',
      badge: t('pricing.premium.badge'),
      saveBadge: null,
      current: user && user.role === 'Premium'
    }
  ]

  const testimonials = [
    {
      name: 'Nguyễn Văn A',
      role: 'Đã đạt N2',
      content: 'Premium giúp tôi tiết kiệm rất nhiều thời gian học tập với AI giải thích chi tiết.',
      rating: 5
    },
    {
      name: 'Trần Thị B',
      role: 'Đang học N3',
      content: 'Tài liệu độc quyền và không giới hạn bài thi thực sự đáng giá.',
      rating: 5
    },
    {
      name: 'Lê Văn C',
      role: 'Mới bắt đầu',
      content: 'iRIN AI như một gia sư riêng, giúp tôi hiểu sâu mọi câu hỏi.',
      rating: 5
    }
  ]

  const handlePlanSelect = (planId: string) => {
    if (!user) {
      router.push('/auth/register')
      return
    }

    if (planId === 'free') {
      router.push('/home')
      return
    }

    // For premium, go to checkout with selected billing period
    router.push(`/premium/checkout?plan=${planId}`)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary/10 rounded-full blur-3xl" />
        
        <div className="relative max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <Badge variant="secondary" className="mb-4">
              <Sparkles className="w-3 h-3 mr-1" />
              {t('pricing.title')}
            </Badge>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4">
              {t('pricing.subtitle')}
            </h1>

            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              {t('pages.payment.description')}
            </p>

            {/* Removed billing toggle - simplified pricing */}
          </motion.div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="relative"
            >
              {plan.popular && (
                <div className="absolute -top-4 left-0 right-0 flex justify-center z-10">
                  <Badge className="bg-primary text-primary-foreground px-4 py-1">
                    {plan.badge}
                  </Badge>
                </div>
              )}

              <div className={cn(
                "relative h-full rounded-2xl p-8 transition-all duration-300",
                "bg-card",
                "border-2 hover:shadow-2xl",
                plan.borderColor,
                plan.popular && "scale-105 shadow-xl"
              )}>
                {/* Background Gradient */}
                <div className={cn(
                  "absolute inset-0 rounded-2xl bg-gradient-to-br opacity-50",
                  plan.gradient
                )} />

                <div className="relative">
                  {/* Plan Header */}
                  <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-2xl font-bold">{plan.name}</h3>
                      {plan.current && (
                        <Badge variant="secondary">
                          Gói hiện tại
                        </Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground">{plan.description}</p>
                  </div>

                  {/* Pricing */}
                  <div className="mb-8">
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-bold">
                        {plan.price.monthly === 0 ? 'Miễn phí' : `$${plan.price.monthly}`}
                      </span>
                      <span className="text-muted-foreground">
                        USD/tháng
                      </span>
                    </div>
                    {plan.originalPrice && plan.originalPrice.yearly && plan.id === 'premium' && (
                      <div className="flex items-center gap-2 mt-2">
                        <del className="text-muted-foreground">
                          ${(plan.originalPrice.yearly / 12).toFixed(2)} USD/tháng
                        </del>
                        <Badge variant="secondary" className="text-xs bg-success text-success-foreground">
                          Tiết kiệm 17%
                        </Badge>
                      </div>
                    )}
                  </div>

                  {/* Features */}
                  <div className="space-y-4 mb-8">
                    {plan.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        {feature.included ? (
                          <div className={cn(
                            "rounded-full p-1",
                            feature.highlight 
                              ? "bg-primary/20 text-primary" 
                              : "bg-green-500/20 text-green-600 dark:text-green-400"
                          )}>
                            <Check className="w-4 h-4" />
                          </div>
                        ) : (
                          <div className="rounded-full bg-muted p-1">
                            <X className="w-4 h-4 text-muted-foreground" />
                          </div>
                        )}
                        <span className={cn(
                          "text-sm",
                          feature.included ? "text-foreground" : "text-muted-foreground",
                          feature.highlight && "font-medium"
                        )}>
                          {feature.text}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* CTA Button */}
                  <Button
                    onClick={() => handlePlanSelect(plan.id)}
                    className={cn(
                      "w-full h-12 text-base font-medium transition-all",
                      plan.popular 
                        ? "bg-primary hover:brightness-110 text-primary-foreground shadow-lg transition-all"
                        : "bg-secondary hover:brightness-110 text-secondary-foreground transition-all"
                    )}
                  >
                    {plan.cta}
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>

                  {/* Trust Indicators */}
                  {plan.popular && (
                    <div className="mt-4 flex items-center justify-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Shield className="w-3 h-3" />
                        Bảo mật
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Hủy bất cứ lúc nào
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <Badge variant="secondary" className="mb-4">
            <Zap className="w-3 h-3 mr-1" />
            {t('pages.payment.whyUpgrade')}
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {t('pages.payment.whyUpgrade')}
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: Brain,
              title: t('pages.payment.benefit2Title'),
              description: t('pages.payment.benefit2Description')
            },
            {
              icon: BookOpen,
              title: t('pages.payment.benefit1Title'),
              description: t('pages.payment.benefit1Description')
            },
            {
              icon: TrendingUp,
              title: t('pages.payment.benefit3Title'),
              description: t('pages.payment.benefit3Description')
            },
            {
              icon: Users,
              title: t('pages.payment.freeFeature3'),
              description: t('pages.payment.benefit1Description')
            },
            {
              icon: Award,
              title: t('pages.payment.premiumFeature4'),
              description: t('pages.payment.benefit3Description')
            },
            {
              icon: Shield,
              title: t('pages.payment.premiumFeature5'),
              description: t('pages.payment.benefit2Description')
            }
          ].map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.05 }}
              className="group relative rounded-xl p-6 bg-card border border-border/50 hover:border-primary/50 transition-all"
            >
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative">
                <div className="rounded-lg bg-primary/10 w-12 h-12 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Testimonials */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-24 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <Badge variant="secondary" className="mb-4">
            <Star className="w-3 h-3 mr-1" />
            Người dùng yêu thích
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Hơn 10,000+ người học tin tưởng
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="rounded-xl p-6 bg-card border border-border/50"
            >
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                ))}
              </div>
              <p className="text-sm mb-4 text-muted-foreground">
                "{testimonial.content}"
              </p>
              <div>
                <p className="font-semibold text-sm">{testimonial.name}</p>
                <p className="text-xs text-muted-foreground">{testimonial.role}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

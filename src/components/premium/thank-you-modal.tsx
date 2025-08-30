/**
 * Thank You Modal Component
 * Modal hiển thị sau khi thanh toán thành công
 */

"use client"

import { motion, AnimatePresence } from 'framer-motion'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle, Crown, Gift, ArrowRight, Sparkles } from 'lucide-react'
import { formatExpiryDate } from '@/lib/premium-utils'
import { useTranslations } from '@/hooks/use-translations'

interface PurchaseResult {
  success: boolean
  newExpiryDate: string
  transactionId: string
  months: number
  amount: number
  couponUsed?: string
}

interface User {
  name?: string
  email?: string
  role?: string
}

interface ThankYouModalProps {
  isOpen: boolean
  onClose: () => void
  purchaseResult: PurchaseResult
  user?: User | null
}

export function ThankYouModal({ isOpen, onClose, purchaseResult, user }: ThankYouModalProps) {
  const { t } = useTranslations()

  const confettiVariants = {
    initial: { scale: 0, rotate: 0 },
    animate: {
      scale: [0, 1.2, 1],
      rotate: [0, 180, 360],
      transition: {
        duration: 0.6,
        times: [0, 0.6, 1]
      }
    }
  }

  const cardVariants = {
    initial: { opacity: 0, y: 50, scale: 0.9 },
    animate: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.5,
        type: "spring" as const,
        stiffness: 300,
        damping: 30
      }
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogContent className="max-w-2xl p-0 overflow-hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="relative bg-gradient-to-br from-primary/5 via-transparent to-secondary/5"
            >
              {/* Confetti Background */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {Array.from({ length: 20 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                    }}
                    variants={confettiVariants}
                    initial="initial"
                    animate="animate"
                    transition={{ delay: i * 0.1 }}
                  >
                    <Sparkles 
                      className={`w-4 h-4 ${
                        i % 3 === 0 ? 'text-primary' : 
                        i % 3 === 1 ? 'text-secondary' : 'text-accent'
                      }`} 
                    />
                  </motion.div>
                ))}
              </div>

              <div className="relative z-10 p-8">
                <DialogHeader className="text-center space-y-4 mb-6">
                  {/* Success Icon */}
                  <motion.div
                    variants={confettiVariants}
                    initial="initial"
                    animate="animate"
                    className="mx-auto"
                  >
                    <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-12 h-12 text-green-600" />
                    </div>
                  </motion.div>

                  {/* Title (Radix requires DialogTitle for a11y) */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <DialogTitle asChild>
                      <h2 className="text-3xl font-bold text-center mb-2">
                        {t('pages.payment.thankYou.title')}
                      </h2>
                    </DialogTitle>
                    <p className="text-lg text-muted-foreground">
                      {t('pages.payment.thankYou.subtitle')}
                    </p>
                  </motion.div>
                </DialogHeader>

                {/* Account Info Card */}
                <motion.div
                  variants={cardVariants}
                  initial="initial"
                  animate="animate"
                  transition={{ delay: 0.4 }}
                >
                  <Card className="border-2 border-primary/20 shadow-lg">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <Crown className="w-6 h-6 text-primary" />
                        <div>
                          <h3 className="text-xl font-bold">{t('pages.payment.thankYou.accountTitle')}</h3>
                          <p className="text-sm text-muted-foreground">
                            {user?.name || user?.email}
                          </p>
                        </div>
                        <Badge className="ml-auto bg-primary text-primary-foreground">
                          PREMIUM
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <div className="text-sm text-muted-foreground">{t('pages.payment.thankYou.duration')}</div>
                          <div className="font-semibold">
                            {purchaseResult.months} {t('pages.payment.thankYou.months')}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="text-sm text-muted-foreground">{t('pages.payment.thankYou.expires')}</div>
                          <div className="font-semibold">
                            {formatExpiryDate(purchaseResult.newExpiryDate)}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="text-sm text-muted-foreground">{t('pages.payment.thankYou.amount')}</div>
                          <div className="font-semibold text-primary">
                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(purchaseResult.amount)}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="text-sm text-muted-foreground">{t('pages.payment.thankYou.transaction')}</div>
                          <div className="font-mono text-xs">
                            {purchaseResult.transactionId}
                          </div>
                        </div>
                      </div>

                      {purchaseResult.couponUsed && (
                        <div className="mt-4 p-3 bg-success/10 border border-success/20 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Gift className="w-4 h-4 text-success" />
                            <span className="text-sm text-success">
                              {t('pages.payment.thankYou.couponApplied')}: <strong>{purchaseResult.couponUsed}</strong>
                            </span>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Premium Features Preview */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="mt-6"
                >
                  <h4 className="font-semibold mb-3 text-center">
                    {t('pages.payment.thankYou.featuresTitle')}
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {[
                      t('pages.payment.premiumFeature1'),
                      t('pages.payment.premiumFeature2'),
                      t('pages.payment.premiumFeature3'),
                      t('pages.payment.premiumFeature4'),
                      t('pages.payment.premiumFeature5'),
                      t('pages.payment.premiumFeature6')
                    ].map((feature, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.7 + index * 0.1 }}
                        className="flex items-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span>{feature as string}</span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>

                {/* Action Buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="flex gap-3 mt-8"
                >
                  <Button
                    onClick={onClose}
                    className="flex-1"
                    size="lg"
                  >
                    {t('pages.payment.thankYou.action')}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </motion.div>

                {/* Email Confirmation Notice */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  className="text-center mt-4"
                >
                  <p className="text-xs text-muted-foreground">
                    {t('pages.payment.thankYou.emailSent')} {user?.email}
                  </p>
                </motion.div>
              </div>
            </motion.div>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  )
}

/**
 * Premium Checkout Component
 * Component chính cho trang thanh toán premium
 */

"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Crown, Check, Gift, CreditCard } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { useTranslations } from '@/hooks/use-translations'
import { TranslationData } from '@/lib/i18n'
import { MonthSelector } from './month-selector'
import { CouponInput } from './coupon-input'
import { PriceCalculator } from './price-calculator'
import { ThankYouModal } from './thank-you-modal'
import { premiumService } from '@/lib/premium-service'

interface PremiumCheckoutProps {
  translations: TranslationData
  demoMode?: boolean
  demoUser?: any
}

export function PremiumCheckout({ translations, demoMode = false, demoUser }: PremiumCheckoutProps) {
  const router = useRouter()
  const { user, refreshUser } = useAuth()
  const { t } = useTranslations()
  
  // State management
  const [selectedMonths, setSelectedMonths] = useState(1)
  const [couponCode, setCouponCode] = useState('')
  const [couponDiscount, setCouponDiscount] = useState(0)
  const [isValidCoupon, setIsValidCoupon] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showThankYou, setShowThankYou] = useState(false)
  const [purchaseResult, setPurchaseResult] = useState<any>(null)

  // Pricing configuration
  const basePrice = 99000 // 99k VND per month
  const discountTiers = [
    { months: 1, discount: 0, label: 'Cơ bản' },
    { months: 3, discount: 0.05, label: 'Phổ biến', badge: 'Tiết kiệm 5%' },
    { months: 6, discount: 0.10, label: 'Tốt nhất', badge: 'Tiết kiệm 10%' },
    { months: 12, discount: 0.15, label: 'Siêu tiết kiệm', badge: 'Tiết kiệm 15%' }
  ]

  // Calculate pricing
  const calculatePrice = () => {
    const tier = discountTiers.find(t => t.months <= selectedMonths) || discountTiers[0]
    const subtotal = basePrice * selectedMonths
    const tierDiscount = subtotal * tier.discount
    const couponDiscountAmount = (subtotal - tierDiscount) * (couponDiscount / 100)
    const total = subtotal - tierDiscount - couponDiscountAmount
    
    return {
      subtotal,
      tierDiscount,
      couponDiscountAmount,
      total: Math.max(total, 0),
      discountPercent: tier.discount * 100
    }
  }

  const pricing = calculatePrice()

  // Handle coupon validation
  const handleCouponApply = async (code: string) => {
    setCouponCode(code)
    
    if (!code.trim()) {
      setCouponDiscount(0)
      setIsValidCoupon(false)
      return
    }

    // Validate coupon code
    const result = await premiumService.validateCoupon(code)
    if (result.valid) {
      setCouponDiscount(result.discount)
      setIsValidCoupon(true)
    } else {
      setCouponDiscount(0)
      setIsValidCoupon(false)
    }
  }

  // Handle purchase
  const handlePurchase = async () => {
    if (!user) return

    setIsProcessing(true)
    
    try {
      const result = await premiumService.purchasePremium({
        userId: user.id,
        months: selectedMonths,
        couponCode: couponCode || undefined,
        amount: pricing.total,
        originalAmount: pricing.subtotal,
        discountAmount: pricing.couponDiscountAmount
      })

      if (result.success) {
        setPurchaseResult(result)
        setShowThankYou(true)
        // Refresh user data to get updated premium status
        await refreshUser()
      } else {
        // Handle error
        alert(result.error || t('premium.errors.paymentError') || 'Có lỗi xảy ra khi thanh toán')
      }
    } catch (error) {
      console.error('Purchase error:', error)
      alert(t('premium.errors.paymentRetry') || 'Có lỗi xảy ra khi thanh toán. Vui lòng thử lại.')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại
          </Button>

          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Crown className="w-16 h-16 mx-auto mb-4 text-foreground" />
              <h1 className="text-3xl md:text-4xl font-bold mb-2 text-foreground">
                Nâng cấp Premium
              </h1>
              <p className="text-muted-foreground text-lg">
                Mở khóa tất cả tính năng và nâng cao trải nghiệm học tập
              </p>
            </motion.div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Side - Package Selection */}
          <motion.div
            className="lg:col-span-2 space-y-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            {/* Month Selection */}
            <div className="bg-background rounded-2xl p-6 border border-border/50">
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
                  <Crown className="w-5 h-5" />
                  Chọn gói Premium
                </h3>
              </div>
              <MonthSelector
                selectedMonths={selectedMonths}
                onMonthChange={setSelectedMonths}
                discountTiers={discountTiers}
              />
            </div>

            {/* Coupon Input */}
            <div className="bg-background rounded-2xl p-6 border border-border/50">
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
                  <Gift className="w-5 h-5" />
                  Mã giảm giá
                </h3>
              </div>
              <CouponInput
                couponCode={couponCode}
                onCouponApply={handleCouponApply}
                isValid={isValidCoupon}
                discount={couponDiscount}
              />
            </div>

            {/* Premium Features */}
            <div className="bg-background rounded-2xl p-6 border border-border/50">
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-foreground">Tính năng Premium</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  'Không giới hạn số lần thi',
                  'Truy cập tất cả đề thi',
                  'Phân tích chi tiết kết quả',
                  'Tải PDF đề thi và đáp án',
                  'AI trợ giúp cá nhân hóa',
                  'Ưu tiên hỗ trợ khách hàng'
                ].map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-foreground">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Right Side - Price Summary */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="bg-background rounded-2xl p-6 border border-border/50 sticky top-4">
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-foreground">{t('premium.checkout.orderSummary') || 'Tóm tắt đơn hàng'}</h3>
              </div>
              <PriceCalculator
                selectedMonths={selectedMonths}
                pricing={pricing}
                couponCode={couponCode}
                isValidCoupon={isValidCoupon}
              />

              <Button
                onClick={handlePurchase}
                disabled={isProcessing}
                className="w-full mt-6"
                size="lg"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Thanh toán ngay
                  </>
                )}
              </Button>

              <p className="text-xs text-muted-foreground text-center mt-4">
                Bằng cách thanh toán, bạn đồng ý với điều khoản dịch vụ của chúng tôi
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Thank You Modal */}
      {showThankYou && purchaseResult && (
        <ThankYouModal
          isOpen={showThankYou}
          onClose={() => {
            setShowThankYou(false)
            router.push('/settings')
          }}
          purchaseResult={purchaseResult}
          user={user}
        />
      )}
    </>
  )
}

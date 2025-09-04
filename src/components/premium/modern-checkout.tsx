/**
 * Modern Premium Checkout Component
 * Streamlined checkout experience inspired by Stripe & modern SaaS
 */

"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  ArrowLeft, 
  Crown, 
  Check, 
  CreditCard,
  Shield,
  Lock,
  ChevronRight,
  Sparkles,
  Gift,
  Tag,
  Clock,
  AlertCircle
} from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context-simple'
import { useTranslations } from '@/hooks/use-translations'
import { cn } from '@/lib/utils'
import { premiumService } from '@/lib/premium-service'
import { ThankYouModal } from './thank-you-modal'
import { getUserBalance } from '@/lib/balance-utils'
import { validateCoupon, calculateDiscountAmount } from '@/lib/coupon-validation'

interface ModernCheckoutProps {
  translations?: any
}

export function ModernCheckout({ translations }: ModernCheckoutProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, refreshUser } = useAuth()
  const { t } = useTranslations()
  
  // Get plan details from URL params
  const selectedPlan = searchParams.get('plan') || 'premium'
  const billingPeriod = searchParams.get('billing') as 'monthly' | 'yearly' || 'monthly'
  
  // State management
  const [selectedMonths, setSelectedMonths] = useState(billingPeriod === 'yearly' ? 12 : 1)
  const [couponCode, setCouponCode] = useState('')
  const [couponDiscount, setCouponDiscount] = useState(0)
  const [couponDiscountType, setCouponDiscountType] = useState<'percentage' | 'fixed'>('percentage')
  const [couponId, setCouponId] = useState<string | undefined>()
  const [isValidCoupon, setIsValidCoupon] = useState(false)
  const [couponPercentApplied, setCouponPercentApplied] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showThankYou, setShowThankYou] = useState(false)
  const [purchaseResult, setPurchaseResult] = useState<any>(null)
  const [showCouponInput, setShowCouponInput] = useState(false)
  const [couponError, setCouponError] = useState('')
  const [userBalance, setUserBalance] = useState<number>(0)
  const [balanceLoading, setBalanceLoading] = useState(true)
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false)

  // Pricing configuration based on billing period
  const basePrice = 2.49 // $2.49 USD per month
  const yearlyPrice = 24.99 // $24.99 USD per year (save ~17%)
  
  // Duration options with discounts
  const durationOptions = [
    { months: 1, label: `1 ${t('pages.payment.thankYou.months')}`, discount: 0 },
    { months: 3, label: `3 ${t('pages.payment.thankYou.months')}`, discount: 5, badge: t('pages.payment.checkout.save5') },
    { months: 6, label: `6 ${t('pages.payment.thankYou.months')}`, discount: 10, badge: t('pages.payment.checkout.popular') },
    { months: 12, label: `12 ${t('pages.payment.thankYou.months')}`, discount: 17, badge: t('pages.payment.checkout.best') }
  ]
  
  const getPrice = () => {
    if (billingPeriod === 'yearly') {
      return yearlyPrice
    }
    return basePrice * selectedMonths
  }

  const getMonthlyEquivalent = () => {
    if (billingPeriod === 'yearly') {
      return Math.round(yearlyPrice / 12)
    }
    return basePrice
  }

  // Get duration discount based on selected months
  const getDurationDiscount = () => {
    const option = durationOptions.find(opt => opt.months === selectedMonths)
    return option?.discount || 0
  }

  // Calculate pricing with discounts
  const calculatePrice = () => {
    const baseSubtotal = getPrice()
    // Apply duration discount first
    const durationDiscountPercent = getDurationDiscount()
    const durationDiscountAmount = baseSubtotal * (durationDiscountPercent / 100)
    const afterDurationDiscount = baseSubtotal - durationDiscountAmount
    
    // Then apply coupon discount on the already discounted price
    const couponDiscountAmount = couponDiscountType === 'percentage' 
      ? afterDurationDiscount * (couponDiscount / 100)
      : Math.min(couponDiscount, afterDurationDiscount) // Fixed discount can't exceed total
    const total = afterDurationDiscount - couponDiscountAmount
    
    return {
      subtotal: baseSubtotal,
      durationDiscountAmount,
      durationDiscountPercent,
      couponDiscountAmount,
      total: Math.max(total, 0),
      monthlyEquivalent: getMonthlyEquivalent()
    }
  }

  const pricing = calculatePrice()

  // Fetch user balance on mount
  useEffect(() => {
    if (user?.id) {
      setBalanceLoading(true)
      getUserBalance(user.id)
        .then(balance => {
          setUserBalance(balance)
          setBalanceLoading(false)
        })
        .catch(err => {
          console.error('Error fetching balance:', err)
          setBalanceLoading(false)
        })
    }
  }, [user])

  // Check if user has sufficient balance
  const hasInsufficientBalance = userBalance < pricing.total

  // Handle coupon validation
  const handleCouponApply = async () => {
    setCouponError('')
    setIsValidatingCoupon(true)
    
    if (!couponCode.trim()) {
      setCouponError(t('pages.payment.checkout.enterCoupon'))
      setIsValidatingCoupon(false)
      return
    }

    try {
      // Calculate the amount after duration discount for validation
      const baseSubtotal = getPrice()
      const durationDiscountPercent = getDurationDiscount()
      const durationDiscountAmount = baseSubtotal * (durationDiscountPercent / 100)
      const afterDurationDiscount = baseSubtotal - durationDiscountAmount
      
      // Validate coupon code
      const result = await validateCoupon(couponCode, afterDurationDiscount)
      
      if (result.valid) {
        // The backend returns discount_value as the ACTUAL AMOUNT discounted
        const discountedAmount = Number(result.discount_value || 0)
        setCouponDiscount(discountedAmount)
        // Force calculation branch to treat as fixed amount
        setCouponDiscountType('fixed')
        setCouponId(result.coupon_id)
        setIsValidCoupon(true)
        // Compute effective percent for display (rounded to 2 decimals)
        const pct = afterDurationDiscount > 0 ? (discountedAmount / afterDurationDiscount) * 100 : 0
        setCouponPercentApplied(Math.max(0, Math.min(100, Number(pct.toFixed(2)))))
        setCouponError('Áp dụng mã giảm giá thành công!')
      } else {
        setCouponDiscount(0)
        setCouponPercentApplied(0)
        setIsValidCoupon(false)
        setCouponError(result.message || t('pages.payment.checkout.invalidCoupon'))
      }
    } catch (error) {
      console.error('Error validating coupon:', error)
      setCouponError(t('pages.payment.checkout.couponError'))
    } finally {
      setIsValidatingCoupon(false)
    }
  }

  // Handle purchase
  const handlePurchase = async () => {
    if (!user) return

    setIsProcessing(true)
    
    try {
      const result = await premiumService.purchasePremium({
        userId: user.id,
        months: billingPeriod === 'yearly' ? 12 : selectedMonths,
        couponCode: isValidCoupon ? couponCode : undefined,
        couponId: isValidCoupon ? couponId : undefined,
        amount: pricing.total,
        originalAmount: pricing.subtotal,
        discountAmount: pricing.couponDiscountAmount
      })

      if (result.success) {
        setPurchaseResult(result)
        setShowThankYou(true)
        await refreshUser()
      } else {
        alert(result.error || t('pages.payment.checkout.paymentError'))
      }
    } catch (error) {
      console.error('Purchase error:', error)
      alert(t('pages.payment.checkout.paymentRetry'))
    } finally {
      setIsProcessing(false)
    }
  }

  // Update selected months when billing period is yearly
  useEffect(() => {
    if (billingPeriod === 'yearly') {
      setSelectedMonths(12)
    }
  }, [billingPeriod])

  return (
    <>
      <div className="min-h-screen bg-background">
        {/* Background Effects */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => router.push('/premium')}
              className="mb-6"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Quay lại bảng giá
            </Button>

            {/* Progress Steps */}
            <div className="flex items-center justify-center mb-8">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                    <Check className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium">Chọn gói</span>
                </div>
                <div className="w-16 h-[2px] bg-primary" />
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                    2
                  </div>
                  <span className="text-sm font-medium">{t('pages.payment.checkout.payment')}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Checkout Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Plan Selection Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card rounded-2xl p-6 border border-border/50"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Crown className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{t('pages.payment.checkout.premiumPlan')}</h3>
                    <p className="text-sm text-muted-foreground">
                      {billingPeriod === 'yearly' ? t('pages.payment.checkout.yearlyBilling') : t('pages.payment.checkout.monthlyBilling')}
                    </p>
                  </div>
                </div>

                {/* Duration Selection (only show for monthly) */}
                {billingPeriod === 'monthly' && (
                  <div>
                    <Label className="text-sm font-medium mb-3 block">
                      {t('pages.payment.checkout.selectDuration')}
                    </Label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {durationOptions.map((option) => (
                        <button
                          key={option.months}
                          onClick={() => setSelectedMonths(option.months)}
                          className={cn(
                            "relative rounded-lg p-3 text-center transition-all",
                            "border-2 hover:border-primary/50",
                            selectedMonths === option.months
                              ? "border-primary bg-primary/10"
                              : "border-border/50 bg-card"
                          )}
                        >
                          {/* Show discount badge for options with discount */}
                          {option.discount > 0 ? (
                            <Badge 
                              variant="secondary" 
                              className="absolute -top-2 -right-2 text-[10px] px-2 py-0.5 bg-success text-success-foreground"
                            >
                              {t('pages.payment.checkout.savePercent').replace('{percent}', option.discount.toString())}
                            </Badge>
                          ) : option.badge && (
                            <Badge 
                              variant="secondary" 
                              className="absolute -top-2 -right-2 text-[10px] px-2 py-0.5"
                            >
                              {option.badge}
                            </Badge>
                          )}
                          <div className="font-semibold text-sm">{option.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Features Reminder */}
                <div className="mt-6 p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-primary mt-0.5" />
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Bạn sẽ nhận được:</p>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li className="flex items-center gap-2">
                          <Check className="w-3 h-3 text-green-500" />
                          Không giới hạn bài thi
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="w-3 h-3 text-green-500" />
                          iRIN AI giải thích chi tiết
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="w-3 h-3 text-green-500" />
                          Tài liệu độc quyền N5-N1
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Payment Notice */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-muted/50 rounded-xl p-4 border border-border/50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{t('pages.payment.checkout.balancePayment')}</p>
                    <p className="text-xs text-muted-foreground">
                      {t('pages.payment.checkout.balanceDescription')}
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Security Badge */}
              <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  Bảo mật SSL
                </div>
                <div className="flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  Mã hóa 256-bit
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Hủy bất cứ lúc nào
                </div>
              </div>
            </div>

            {/* Order Summary Sidebar */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="sticky top-4 bg-card rounded-2xl p-6 border border-border/50"
              >
                <h3 className="font-semibold mb-4">Tóm tắt đơn hàng</h3>

                <div className="space-y-4">
                  {/* Selected Plan */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm">{t('pages.payment.checkout.premiumPlan')}</span>
                      <Badge variant="secondary" className="text-xs">
                        {billingPeriod === 'yearly' ? `12 ${t('pages.payment.thankYou.months')}` : `${selectedMonths} ${t('pages.payment.thankYou.months')}`}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        ${(pricing.subtotal / (billingPeriod === 'yearly' ? 12 : selectedMonths)).toFixed(2)}/{t('pages.payment.thankYou.months')}
                      </span>
                      <span className="font-medium">
                        ${pricing.subtotal.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Coupon Section - Always visible */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-2">
                      <Gift className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Mã giảm giá</span>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Nhập mã giảm giá"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        size="sm"
                        onClick={handleCouponApply}
                        className="bg-primary hover:bg-primary/90"
                      >
                        {t('pages.payment.checkout.apply')}
                      </Button>
                    </div>
                    {couponError && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {couponError}
                      </p>
                    )}

                    {/* Duration discount display */}
                    {pricing.durationDiscountAmount > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Giảm giá theo gói ({pricing.durationDiscountPercent}%)</span>
                        <span className="text-success">
                          -${pricing.durationDiscountAmount.toFixed(2)}
                        </span>
                      </div>
                    )}

                    {/* Coupon display */}
                    {isValidCoupon && (
                      <div className="flex items-center justify-between p-2 rounded-lg bg-success/10 border border-success/20">
                        <div className="flex items-center gap-2">
                          <Tag className="w-4 h-4 text-success" />
                          <span className="text-sm font-medium text-success">
                            Mã giảm giá: {couponCode} (-{couponPercentApplied}%)
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            setCouponCode('')
                            setCouponDiscount(0)
                            setCouponPercentApplied(0)
                            setIsValidCoupon(false)
                          }}
                          className="text-muted-foreground hover:text-foreground p-1"
                        >
                          ×
                        </button>
                      </div>
                    )}

                    {/* Coupon discount amount */}
                    {pricing.couponDiscountAmount > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Giảm từ mã</span>
                        <span className="text-success">
                          -${pricing.couponDiscountAmount.toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between mb-4">
                      <span className="font-semibold">Tổng cộng</span>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-foreground">
                          ${pricing.total.toFixed(2)}
                        </div>
                      </div>
                    </div>

                    {/* Balance Display */}
                    <div className="mb-4 p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Số dư của bạn:</span>
                        {balanceLoading ? (
                          <div className="w-16 h-4 bg-muted animate-pulse rounded" />
                        ) : (
                          <span className={cn(
                            "font-semibold",
                            hasInsufficientBalance ? "text-destructive" : "text-success"
                          )}>
                            ${userBalance.toFixed(2)}
                          </span>
                        )}
                      </div>
                      {!balanceLoading && hasInsufficientBalance && (
                        <div className="mt-2 flex items-center gap-1 text-xs text-red-500">
                          <AlertCircle className="w-3 h-3" />
                          <span>{t('pages.payment.checkout.insufficientBalance').replace('{amount}', (pricing.total - userBalance).toFixed(2))}</span>
                        </div>
                      )}
                    </div>

                    <Button
                      onClick={handlePurchase}
                      disabled={isProcessing || hasInsufficientBalance || balanceLoading}
                      className="w-full h-12 bg-primary hover:brightness-110 text-primary-foreground font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isProcessing ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                          {t('pages.payment.checkout.processing')}
                        </>
                      ) : (
                        <>
                          {t('pages.payment.checkout.payNow')}
                          <ChevronRight className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>

                    <p className="text-xs text-center text-muted-foreground mt-3">
                      {t('pages.payment.checkout.termsAgreement')}{' '}
                      <a href="#" className="text-primary hover:underline">
                        {t('pages.payment.checkout.termsOfService')}
                      </a>
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Thank You Modal */}
      {showThankYou && (
        <ThankYouModal
          isOpen={showThankYou}
          onClose={() => {
            setShowThankYou(false)
            router.push('/home')
          }}
          purchaseResult={purchaseResult}
        />
      )}
    </>
  )
}

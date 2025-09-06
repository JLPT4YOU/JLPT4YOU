/**
 * Modern Checkout Inner Component
 * Orchestrates all checkout step components and hooks
 */

"use client"

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { useTranslations } from '@/hooks/use-translations'
import { premiumService } from '@/lib/premium-service'
import { ThankYouModal } from '../thank-you-modal'
import { useCheckoutState } from './hooks/use-checkout-state'
import { usePricing } from './hooks/use-pricing'
import { 
  CheckoutHeader, 
  PlanSelection, 
  PaymentNotice, 
  OrderSummary, 
  SecurityBadges 
} from './components'
import { DurationOption } from './types'

interface ModernCheckoutInnerProps {
  translations?: any
}

export function ModernCheckoutInner({ translations }: ModernCheckoutInnerProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, refreshUser } = useAuth()
  const { t } = useTranslations()
  
  // Get plan details from URL params
  const selectedPlan = searchParams.get('plan') || 'premium'
  const billingPeriod = searchParams.get('billing') as 'monthly' | 'yearly' || 'monthly'
  
  // Modal state
  const [showThankYou, setShowThankYou] = useState(false)
  const [purchaseResult, setPurchaseResult] = useState<any>(null)

  // Duration options with discounts
  const durationOptions: DurationOption[] = [
    { months: 1, label: `1 ${t('pages.payment.thankYou.months')}`, discount: 0 },
    { months: 3, label: `3 ${t('pages.payment.thankYou.months')}`, discount: 5, badge: t('pages.payment.checkout.save5') },
    { months: 6, label: `6 ${t('pages.payment.thankYou.months')}`, discount: 10, badge: t('pages.payment.checkout.popular') },
    { months: 12, label: `12 ${t('pages.payment.thankYou.months')}`, discount: 17, badge: t('pages.payment.checkout.best') }
  ]

  // Checkout state management
  const {
    state,
    updateSelectedMonths,
    updateCouponCode,
    validateCouponCode,
    removeCoupon,
    setProcessing
  } = useCheckoutState(billingPeriod, durationOptions, t)

  // Pricing calculations
  const { pricing } = usePricing(
    billingPeriod,
    state.selectedMonths,
    state.coupon.discount,
    state.coupon.discountType,
    durationOptions
  )

  // Handle coupon validation
  const handleCouponApply = async () => {
    const baseSubtotal = billingPeriod === 'yearly' ? 24.99 : 2.49 * state.selectedMonths
    const durationDiscountPercent = durationOptions.find(opt => opt.months === state.selectedMonths)?.discount || 0
    const durationDiscountAmount = baseSubtotal * (durationDiscountPercent / 100)
    const afterDurationDiscount = baseSubtotal - durationDiscountAmount
    
    await validateCouponCode(afterDurationDiscount, t)
  }

  // Handle purchase
  const handlePurchase = async () => {
    if (!user) return

    setProcessing(true)
    
    try {
      const result = await premiumService.purchasePremium({
        userId: user.id,
        months: billingPeriod === 'yearly' ? 12 : state.selectedMonths,
        couponCode: state.coupon.isValid ? state.coupon.code : undefined,
        couponId: state.coupon.isValid ? state.coupon.id : undefined,
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
      setProcessing(false)
    }
  }

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
          <CheckoutHeader 
            onBack={() => router.push('/premium')}
            t={t}
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Checkout Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Plan Selection Card */}
              <PlanSelection
                billingPeriod={billingPeriod}
                selectedMonths={state.selectedMonths}
                durationOptions={durationOptions}
                onMonthsChange={updateSelectedMonths}
                t={t}
              />

              {/* Payment Notice */}
              <PaymentNotice t={t} />

              {/* Security Badge */}
              <SecurityBadges />
            </div>

            {/* Order Summary Sidebar */}
            <div className="lg:col-span-1">
              <OrderSummary
                pricing={pricing}
                coupon={state.coupon}
                userBalance={state.userBalance}
                balanceLoading={state.balanceLoading}
                isProcessing={state.isProcessing}
                billingPeriod={billingPeriod}
                selectedMonths={state.selectedMonths}
                onCouponCodeChange={updateCouponCode}
                onCouponApply={handleCouponApply}
                onCouponRemove={removeCoupon}
                onPurchase={handlePurchase}
                t={t}
              />
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

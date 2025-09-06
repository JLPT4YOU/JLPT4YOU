/**
 * Order Summary Component
 */

import { motion } from 'framer-motion';
import { Badge, Button } from '@/components/ui';
import { ChevronRight, AlertCircle } from 'lucide-react';
import { CouponSection } from './coupon-section';
import { BalanceDisplay } from './balance-display';
import { PricingDetails, CouponState } from '../types';
import { cn } from '@/lib/utils';

interface OrderSummaryProps {
  pricing: PricingDetails;
  coupon: CouponState;
  userBalance: number;
  balanceLoading: boolean;
  isProcessing: boolean;
  billingPeriod: 'monthly' | 'yearly';
  selectedMonths: number;
  onCouponCodeChange: (code: string) => void;
  onCouponApply: () => void;
  onCouponRemove: () => void;
  onPurchase: () => void;
  t: (key: string) => string;
}

export function OrderSummary({ 
  pricing, 
  coupon, 
  userBalance, 
  balanceLoading, 
  isProcessing,
  billingPeriod,
  selectedMonths,
  onCouponCodeChange,
  onCouponApply,
  onCouponRemove,
  onPurchase,
  t 
}: OrderSummaryProps) {
  const hasInsufficientBalance = userBalance < pricing.total;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="sticky top-4 bg-card rounded-2xl p-6 border border-border/50"
    >
      <h3 className="font-semibold mb-4">{t('pages.payment.checkout.orderSummary')}</h3>

      <div className="space-y-4">
        {/* Selected Plan */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm">{t('pages.payment.checkout.premiumPlan')}</span>
            <Badge variant="secondary" className="text-xs">
              {billingPeriod === 'yearly' 
                ? `12 ${t('pages.payment.thankYou.months')}` 
                : `${selectedMonths} ${t('pages.payment.thankYou.months')}`
              }
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

        {/* Coupon Section */}
        <CouponSection
          coupon={coupon}
          pricing={pricing}
          onCouponCodeChange={onCouponCodeChange}
          onCouponApply={onCouponApply}
          onCouponRemove={onCouponRemove}
          t={t}
        />

        <div className="pt-4 border-t">
          <div className="flex items-center justify-between mb-4">
            <span className="font-semibold">{t('pages.payment.checkout.total')}</span>
            <div className="text-right">
              <div className="text-2xl font-bold text-foreground">
                ${pricing.total.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Balance Display */}
          <BalanceDisplay
            userBalance={userBalance}
            balanceLoading={balanceLoading}
            hasInsufficientBalance={hasInsufficientBalance}
            pricing={pricing}
            t={t}
          />

          <Button
            onClick={onPurchase}
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
  );
}

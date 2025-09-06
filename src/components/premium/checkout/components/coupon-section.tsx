/**
 * Coupon Section Component
 */

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Gift, AlertCircle, Tag } from 'lucide-react';
import { CouponState, PricingDetails } from '../types';

interface CouponSectionProps {
  coupon: CouponState;
  pricing: PricingDetails;
  onCouponCodeChange: (code: string) => void;
  onCouponApply: () => void;
  onCouponRemove: () => void;
  t: (key: string) => string;
}

export function CouponSection({ 
  coupon, 
  pricing, 
  onCouponCodeChange, 
  onCouponApply, 
  onCouponRemove, 
  t 
}: CouponSectionProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-2">
        <Gift className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium">{t('pages.payment.checkout.couponCode')}</span>
      </div>
      
      <div className="flex gap-2">
        <Input
          placeholder={t('pages.payment.checkout.enterCoupon')}
          value={coupon.code}
          onChange={(e) => onCouponCodeChange(e.target.value)}
          className="flex-1"
        />
        <Button
          size="sm"
          onClick={onCouponApply}
          disabled={coupon.isValidating}
          className="bg-primary hover:bg-primary/90"
        >
          {coupon.isValidating ? t('pages.payment.checkout.validating') : t('pages.payment.checkout.apply')}
        </Button>
      </div>
      
      {coupon.error && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {coupon.error}
        </p>
      )}

      {/* Duration discount display */}
      {pricing.durationDiscountAmount > 0 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {t('pages.payment.checkout.durationDiscount')} ({pricing.durationDiscountPercent}%)
          </span>
          <span className="text-success">
            -${pricing.durationDiscountAmount.toFixed(2)}
          </span>
        </div>
      )}

      {/* Coupon display */}
      {coupon.isValid && (
        <div className="flex items-center justify-between p-2 rounded-lg bg-success/10 border border-success/20">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-success" />
            <span className="text-sm font-medium text-success">
              {t('pages.payment.checkout.couponApplied')}: {coupon.code} (-{coupon.percentApplied}%)
            </span>
          </div>
          <button
            onClick={onCouponRemove}
            className="text-muted-foreground hover:text-foreground p-1"
          >
            ×
          </button>
        </div>
      )}

      {/* Coupon discount amount */}
      {pricing.couponDiscountAmount > 0 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{t('pages.payment.checkout.couponDiscount')}</span>
          <span className="text-success">
            -${pricing.couponDiscountAmount.toFixed(2)}
          </span>
        </div>
      )}
    </div>
  );
}

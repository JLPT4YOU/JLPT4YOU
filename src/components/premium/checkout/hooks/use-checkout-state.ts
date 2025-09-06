/**
 * Custom hook for managing checkout state
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { getUserBalance } from '@/lib/balance-utils';
import { validateCoupon } from '@/lib/coupon-validation';
import { CheckoutState, CouponState, DurationOption } from '../types';

export const useCheckoutState = (
  billingPeriod: 'monthly' | 'yearly',
  durationOptions: DurationOption[],
  t: (key: string) => string
) => {
  const { user } = useAuth();
  
  const [state, setState] = useState<CheckoutState>({
    selectedMonths: billingPeriod === 'yearly' ? 12 : 1,
    coupon: {
      code: '',
      discount: 0,
      discountType: 'percentage',
      isValid: false,
      percentApplied: 0,
      error: '',
      isValidating: false
    },
    isProcessing: false,
    userBalance: 0,
    balanceLoading: true
  });

  // Fetch user balance on mount
  useEffect(() => {
    if (user?.id) {
      setState(prev => ({ ...prev, balanceLoading: true }));
      getUserBalance(user.id)
        .then(balance => {
          setState(prev => ({ 
            ...prev, 
            userBalance: balance,
            balanceLoading: false 
          }));
        })
        .catch(err => {
          console.error('Error fetching balance:', err);
          setState(prev => ({ ...prev, balanceLoading: false }));
        });
    }
  }, [user]);

  // Update selected months when billing period changes
  useEffect(() => {
    if (billingPeriod === 'yearly') {
      setState(prev => ({ ...prev, selectedMonths: 12 }));
    }
  }, [billingPeriod]);

  const updateSelectedMonths = async (months: number) => {
    // Update months first
    setState(prev => ({ ...prev, selectedMonths: months }));
    
    // If there's a valid coupon, recalculate it for the new duration
    if (state.coupon.isValid) {
      await recalculateCouponForNewDuration(months, billingPeriod, state.coupon, durationOptions);
    }
  };

  // Auto-recalculate coupon when duration changes
  const recalculateCouponForNewDuration = async (
    months: number,
    billingPeriod: 'monthly' | 'yearly',
    couponState: CouponState,
    durationOptions: DurationOption[]
  ) => {
    if (!couponState.isValid || !couponState.code.trim()) return;

    // Calculate new price after duration discount
    const baseSubtotal = billingPeriod === 'yearly' ? 24.99 : 2.49 * months;
    const durationDiscountPercent = durationOptions.find(opt => opt.months === months)?.discount || 0;
    const durationDiscountAmount = baseSubtotal * (durationDiscountPercent / 100);
    const afterDurationDiscount = baseSubtotal - durationDiscountAmount;

    try {
      const result = await validateCoupon(couponState.code, afterDurationDiscount);
      
      if (result.valid) {
        const discountedAmount = Number(result.discount_value || 0);
        const pct = afterDurationDiscount > 0 
          ? (discountedAmount / afterDurationDiscount) * 100 
          : 0;

        setState(prev => ({
          ...prev,
          coupon: {
            ...prev.coupon,
            discount: discountedAmount,
            percentApplied: Math.max(0, Math.min(100, Number(pct.toFixed(2)))),
            error: t('pages.payment.checkout.couponRecalculated')
          }
        }));
      } else {
        // Coupon is no longer valid for new price
        setState(prev => ({
          ...prev,
          coupon: {
            ...prev.coupon,
            isValid: false,
            discount: 0,
            percentApplied: 0,
            error: t('pages.payment.checkout.couponNotValidForPlan')
          }
        }));
      }
    } catch (error) {
      console.error('Error recalculating coupon:', error);
      // Keep coupon but show warning
      setState(prev => ({
        ...prev,
        coupon: {
          ...prev.coupon,
          error: t('pages.payment.checkout.couponRecalculationError')
        }
      }));
    }
  };

  const updateCouponCode = (code: string) => {
    setState(prev => ({
      ...prev,
      coupon: {
        ...prev.coupon,
        code,
        error: '',
        isValid: false,
        discount: 0,
        percentApplied: 0
      }
    }));
  };

  const validateCouponCode = async (
    afterDurationDiscountAmount: number,
    t: (key: string) => string
  ) => {
    setState(prev => ({
      ...prev,
      coupon: { ...prev.coupon, error: '', isValidating: true }
    }));

    if (!state.coupon.code.trim()) {
      setState(prev => ({
        ...prev,
        coupon: {
          ...prev.coupon,
          error: t('pages.payment.checkout.enterCoupon'),
          isValidating: false
        }
      }));
      return;
    }

    try {
      const result = await validateCoupon(state.coupon.code, afterDurationDiscountAmount);
      
      if (result.valid) {
        const discountedAmount = Number(result.discount_value || 0);
        const pct = afterDurationDiscountAmount > 0 
          ? (discountedAmount / afterDurationDiscountAmount) * 100 
          : 0;

        setState(prev => ({
          ...prev,
          coupon: {
            ...prev.coupon,
            discount: discountedAmount,
            discountType: 'fixed',
            id: result.coupon_id,
            isValid: true,
            percentApplied: Math.max(0, Math.min(100, Number(pct.toFixed(2)))),
            error: t('pages.payment.checkout.couponAppliedSuccessfully'),
            isValidating: false
          }
        }));
      } else {
        setState(prev => ({
          ...prev,
          coupon: {
            ...prev.coupon,
            discount: 0,
            percentApplied: 0,
            isValid: false,
            error: result.message || t('pages.payment.checkout.invalidCoupon'),
            isValidating: false
          }
        }));
      }
    } catch (error) {
      console.error('Error validating coupon:', error);
      setState(prev => ({
        ...prev,
        coupon: {
          ...prev.coupon,
          error: t('pages.payment.checkout.couponError'),
          isValidating: false
        }
      }));
    }
  };

  const removeCoupon = () => {
    setState(prev => ({
      ...prev,
      coupon: {
        code: '',
        discount: 0,
        discountType: 'percentage',
        isValid: false,
        percentApplied: 0,
        error: '',
        isValidating: false
      }
    }));
  };

  const setProcessing = (processing: boolean) => {
    setState(prev => ({ ...prev, isProcessing: processing }));
  };

  return {
    state,
    updateSelectedMonths,
    updateCouponCode,
    validateCouponCode,
    removeCoupon,
    setProcessing,
    recalculateCouponForNewDuration
  };
};

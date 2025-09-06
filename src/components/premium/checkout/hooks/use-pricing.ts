/**
 * Custom hook for pricing calculations
 */

import { PricingDetails, DurationOption } from '../types';

export const usePricing = (
  billingPeriod: 'monthly' | 'yearly',
  selectedMonths: number,
  couponDiscount: number,
  couponDiscountType: 'percentage' | 'fixed',
  durationOptions: DurationOption[]
) => {
  const basePrice = 2.49; // $2.49 USD per month
  const yearlyPrice = 24.99; // $24.99 USD per year (save ~17%)

  const getPrice = () => {
    if (billingPeriod === 'yearly') {
      return yearlyPrice;
    }
    return basePrice * selectedMonths;
  };

  const getMonthlyEquivalent = () => {
    if (billingPeriod === 'yearly') {
      return Math.round(yearlyPrice / 12);
    }
    return basePrice;
  };

  const getDurationDiscount = () => {
    const option = durationOptions.find(opt => opt.months === selectedMonths);
    return option?.discount || 0;
  };

  const calculatePrice = (): PricingDetails => {
    const baseSubtotal = getPrice();
    
    // Apply duration discount first
    const durationDiscountPercent = getDurationDiscount();
    const durationDiscountAmount = baseSubtotal * (durationDiscountPercent / 100);
    const afterDurationDiscount = baseSubtotal - durationDiscountAmount;
    
    // Then apply coupon discount on the already discounted price
    const couponDiscountAmount = couponDiscountType === 'percentage' 
      ? afterDurationDiscount * (couponDiscount / 100)
      : Math.min(couponDiscount, afterDurationDiscount); // Fixed discount can't exceed total
    const total = afterDurationDiscount - couponDiscountAmount;
    
    return {
      subtotal: baseSubtotal,
      durationDiscountAmount,
      durationDiscountPercent,
      couponDiscountAmount,
      total: Math.max(total, 0),
      monthlyEquivalent: getMonthlyEquivalent()
    };
  };

  return {
    pricing: calculatePrice(),
    basePrice,
    yearlyPrice
  };
};

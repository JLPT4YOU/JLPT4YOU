/**
 * Shared types for checkout components
 */

export interface PricingDetails {
  subtotal: number;
  durationDiscountAmount: number;
  durationDiscountPercent: number;
  couponDiscountAmount: number;
  total: number;
  monthlyEquivalent: number;
}

export interface DurationOption {
  months: number;
  label: string;
  discount: number;
  badge?: string;
}

export interface CouponState {
  code: string;
  discount: number;
  discountType: 'percentage' | 'fixed';
  id?: string;
  isValid: boolean;
  percentApplied: number;
  error: string;
  isValidating: boolean;
}

export interface CheckoutState {
  selectedMonths: number;
  coupon: CouponState;
  isProcessing: boolean;
  userBalance: number;
  balanceLoading: boolean;
}

export interface PurchaseData {
  userId: string;
  months: number;
  couponCode?: string;
  couponId?: string;
  amount: number;
  originalAmount: number;
  discountAmount: number;
}

/**
 * Types for Coupon Management components
 */

export interface CouponFormData {
  code: string;
  description: string;
  discount_type: 'percentage' | 'fixed_amount';
  discount_value: string;
  min_purchase_amount: string;
  max_discount_amount: string;
  usage_limit: string;
  valid_from: string;
  valid_until: string;
  is_active: boolean;
}

export interface CouponStatistics {
  total: number;
  active: number;
  totalUsage: number;
  validCount: number;
}

export interface CouponDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: () => void;
  formData: CouponFormData;
  onFormChange: (data: Partial<CouponFormData>) => void;
  title: string;
  description: string;
  submitLabel: string;
}

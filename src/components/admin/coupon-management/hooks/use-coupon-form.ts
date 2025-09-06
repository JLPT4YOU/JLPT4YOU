/**
 * Hook for managing coupon form state and validation
 */

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { Coupon } from '@/lib/coupon-service';
import { CouponFormData } from '../types';

const DEFAULT_FORM_DATA: CouponFormData = {
  code: '',
  description: '',
  discount_type: 'percentage',
  discount_value: '',
  min_purchase_amount: '0',
  max_discount_amount: '',
  usage_limit: '',
  valid_from: new Date().toISOString().split('T')[0],
  valid_until: '',
  is_active: true
};

export function useCouponForm() {
  const [formData, setFormData] = useState<CouponFormData>(DEFAULT_FORM_DATA);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const updateFormData = useCallback((updates: Partial<CouponFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  }, []);

  const resetForm = useCallback(() => {
    setFormData(DEFAULT_FORM_DATA);
  }, []);

  const loadCouponToForm = useCallback((coupon: Coupon) => {
    setFormData({
      code: coupon.code,
      description: coupon.description || '',
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value.toString(),
      min_purchase_amount: coupon.min_purchase_amount.toString(),
      max_discount_amount: coupon.max_discount_amount?.toString() || '',
      usage_limit: coupon.usage_limit?.toString() || '',
      valid_from: coupon.valid_from.split('T')[0],
      valid_until: coupon.valid_until ? coupon.valid_until.split('T')[0] : '',
      is_active: coupon.is_active
    });
  }, []);

  const handleCopyCode = useCallback((code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success('Đã sao chép mã giảm giá');
    setTimeout(() => setCopiedCode(null), 2000);
  }, []);

  const validateForm = useCallback(() => {
    if (!formData.code || !formData.discount_value) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      return false;
    }
    return true;
  }, [formData]);

  return {
    formData,
    updateFormData,
    resetForm,
    loadCouponToForm,
    handleCopyCode,
    copiedCode,
    validateForm,
  };
}

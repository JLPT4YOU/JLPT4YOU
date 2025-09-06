/**
 * Hook for managing coupon data and operations
 */

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  Coupon,
  getAllCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
} from '@/lib/coupon-service';
import { CouponFormData } from '../types';

export function useCouponData() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCoupons = useCallback(async () => {
    setLoading(true);
    const data = await getAllCoupons();
    setCoupons(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadCoupons();
  }, [loadCoupons]);

  const handleCreateCoupon = useCallback(async (formData: CouponFormData) => {
    if (!formData.code || !formData.discount_value) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      return false;
    }

    const newCoupon = {
      code: formData.code,
      description: formData.description || undefined,
      discount_type: formData.discount_type,
      discount_value: parseFloat(formData.discount_value),
      min_purchase_amount: parseFloat(formData.min_purchase_amount) || 0,
      max_discount_amount: formData.max_discount_amount ? parseFloat(formData.max_discount_amount) : null,
      usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
      valid_from: formData.valid_from,
      valid_until: formData.valid_until || null,
      is_active: formData.is_active
    };

    const created = await createCoupon(newCoupon);
    if (created) {
      toast.success('Tạo mã giảm giá thành công');
      loadCoupons();
      return true;
    } else {
      toast.error('Lỗi khi tạo mã giảm giá');
      return false;
    }
  }, [loadCoupons]);

  const handleUpdateCoupon = useCallback(async (couponId: string, formData: CouponFormData) => {
    const updates = {
      code: formData.code,
      description: formData.description || undefined,
      discount_type: formData.discount_type,
      discount_value: parseFloat(formData.discount_value),
      min_purchase_amount: parseFloat(formData.min_purchase_amount) || 0,
      max_discount_amount: formData.max_discount_amount ? parseFloat(formData.max_discount_amount) : null,
      usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
      valid_from: formData.valid_from,
      valid_until: formData.valid_until || null,
      is_active: formData.is_active
    };

    const success = await updateCoupon(couponId, updates);
    if (success) {
      toast.success('Cập nhật mã giảm giá thành công');
      loadCoupons();
      return true;
    } else {
      toast.error('Lỗi khi cập nhật mã giảm giá');
      return false;
    }
  }, [loadCoupons]);

  const handleDeleteCoupon = useCallback(async (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa mã giảm giá này?')) {
      const success = await deleteCoupon(id);
      if (success) {
        toast.success('Xóa mã giảm giá thành công');
        loadCoupons();
        return true;
      } else {
        toast.error('Lỗi khi xóa mã giảm giá');
        return false;
      }
    }
    return false;
  }, [loadCoupons]);

  return {
    coupons,
    loading,
    loadCoupons,
    handleCreateCoupon,
    handleUpdateCoupon,
    handleDeleteCoupon,
  };
}

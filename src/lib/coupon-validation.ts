/**
 * Coupon Validation Service
 * Validates and applies coupon codes during checkout
 */

import { createClient } from '@/utils/supabase/client'

export interface CouponValidationResult {
  valid: boolean
  discount_type?: 'percentage' | 'fixed'
  discount_value?: number
  message?: string
  coupon_id?: string
}

/**
 * Validate a coupon code
 * @param code - The coupon code to validate
 * @param amount - The order amount to validate against minimum requirements
 * @returns Validation result with discount details
 */
export async function validateCoupon(
  code: string,
  amount: number
): Promise<CouponValidationResult> {
  try {
    if (!code || code.trim() === '') {
      return {
        valid: false,
        message: 'Vui lòng nhập mã giảm giá'
      }
    }

    const supabase = createClient()
    
    // Fetch coupon from database
    const { data: coupon, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('is_active', true)
      .single()

    if (error || !coupon) {
      return {
        valid: false,
        message: 'Mã giảm giá không tồn tại hoặc đã hết hạn'
      }
    }

    // Check expiry date (schema: valid_until)
    if (coupon.valid_until) {
      const expiryDate = new Date(coupon.valid_until)
      if (expiryDate < new Date()) {
        return {
          valid: false,
          message: 'Mã giảm giá đã hết hạn sử dụng'
        }
      }
    }

    // Check usage limit (schema: usage_limit, usage_count)
    if (coupon.usage_limit !== null && coupon.usage_limit !== undefined && coupon.usage_count >= coupon.usage_limit) {
      return {
        valid: false,
        message: 'Mã giảm giá đã hết lượt sử dụng'
      }
    }

    // Check minimum amount requirement (schema: min_purchase_amount)
    if (coupon.min_purchase_amount !== null && coupon.min_purchase_amount !== undefined && amount < Number(coupon.min_purchase_amount)) {
      return {
        valid: false,
        message: `Đơn hàng tối thiểu $${Number(coupon.min_purchase_amount).toFixed(2)} để sử dụng mã này`
      }
    }

    // Calculate actual discount
    let actualDiscountValue: number
    const isPercentage = coupon.discount_type === 'percentage'
    if (isPercentage) {
      const percentageDiscount = amount * (Number(coupon.discount_value) / 100)
      if (
        coupon.max_discount_amount !== null &&
        coupon.max_discount_amount !== undefined &&
        percentageDiscount > Number(coupon.max_discount_amount)
      ) {
        actualDiscountValue = Number(coupon.max_discount_amount)
      } else {
        actualDiscountValue = percentageDiscount
      }
    } else {
      // fixed_amount
      actualDiscountValue = Math.min(Number(coupon.discount_value), amount)
    }

    return {
      valid: true,
      // normalize discount_type to 'percentage' | 'fixed'
      discount_type: isPercentage ? 'percentage' : 'fixed',
      discount_value: actualDiscountValue,
      coupon_id: coupon.id,
      message: 'Áp dụng mã giảm giá thành công!'
    }
  } catch (error) {
    console.error('Error validating coupon:', error)
    return {
      valid: false,
      message: 'Có lỗi xảy ra khi kiểm tra mã giảm giá'
    }
  }
}

/**
 * Record coupon usage after successful purchase
 * @param couponId - The coupon ID that was used
 * @param userId - The user ID who used the coupon
 * @param orderId - The order ID where coupon was applied
 */
export async function recordCouponUsage(
  couponId: string,
  userId: string,
  orderId?: string,
  amountDiscounted?: number
): Promise<boolean> {
  try {
    const supabase = createClient()
    
    // Increment usage count (schema: usage_count)
    const { data: coupon, error: fetchError } = await supabase
      .from('coupons')
      .select('usage_count')
      .eq('id', couponId)
      .single()

    if (fetchError || !coupon) {
      console.error('Error fetching coupon for usage update:', fetchError)
      return false
    }

    const { error: updateError } = await supabase
      .from('coupons')
      .update({ 
        usage_count: (coupon.usage_count || 0) + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', couponId)

    if (updateError) {
      console.error('Error updating coupon usage:', updateError)
      return false
    }

    // Optionally record usage history (if you have a coupon_usage table)
    // This can be useful for tracking who used what coupon and when
    const { error: historyError } = await supabase
      .from('coupon_usage')
      .insert({
        coupon_id: couponId,
        user_id: userId,
        order_id: orderId,
        used_at: new Date().toISOString(),
        amount_discounted: amountDiscounted
      })

    // Don't fail if history recording fails (it's optional)
    if (historyError) {
      console.error('Error recording coupon usage history:', historyError)
    }

    return true
  } catch (error) {
    console.error('Error recording coupon usage:', error)
    return false
  }
}

/**
 * Calculate discount amount based on coupon type
 * @param baseAmount - The base amount before discount
 * @param discountType - Type of discount (percentage or fixed)
 * @param discountValue - The discount value
 * @returns The discount amount in dollars
 */
export function calculateDiscountAmount(
  baseAmount: number,
  discountType: 'percentage' | 'fixed',
  discountValue: number
): number {
  if (discountType === 'percentage') {
    return baseAmount * (discountValue / 100)
  } else {
    // Fixed discount cannot exceed the base amount
    return Math.min(discountValue, baseAmount)
  }
}

/**
 * Format discount display text
 * @param discountType - Type of discount
 * @param discountValue - The discount value
 * @returns Formatted discount text
 */
export function formatDiscountText(
  discountType: 'percentage' | 'fixed',
  discountValue: number
): string {
  if (discountType === 'percentage') {
    return `-${discountValue}%`
  } else {
    return `-$${discountValue.toFixed(2)}`
  }
}

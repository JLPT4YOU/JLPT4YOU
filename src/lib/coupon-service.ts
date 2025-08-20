/**
 * Coupon Service
 * Service xử lý logic liên quan đến coupon giảm giá
 */

import { createClient } from '@/utils/supabase/client'

export interface Coupon {
  id: string
  code: string
  description?: string
  discount_type: 'percentage' | 'fixed_amount'
  discount_value: number
  min_purchase_amount: number
  max_discount_amount?: number | null
  usage_limit?: number | null
  usage_count: number
  valid_from: string
  valid_until?: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  created_by?: string
}

export interface CouponUsage {
  id: string
  coupon_id: string
  user_id: string
  used_at: string
  order_amount: number
  discount_applied: number
  transaction_id?: string
}

export interface CouponValidationResult {
  is_valid: boolean
  discount_type?: 'percentage' | 'fixed_amount'
  discount_value?: number
  max_discount_amount?: number | null
  message: string
  final_discount?: number
}

/**
 * Validate a coupon code
 */
export async function validateCoupon(
  code: string,
  userId: string,
  amount: number
): Promise<CouponValidationResult> {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase.rpc('validate_coupon', {
      p_code: code,
      p_user_id: userId,
      p_amount: amount
    })

    if (error) {
      console.error('Error validating coupon:', error)
      return {
        is_valid: false,
        message: 'Lỗi khi kiểm tra mã giảm giá'
      }
    }

    if (!data || data.length === 0) {
      return {
        is_valid: false,
        message: 'Mã giảm giá không hợp lệ'
      }
    }

    const result = data[0]
    
    // Calculate final discount amount
    let finalDiscount = 0
    if (result.is_valid) {
      if (result.discount_type === 'fixed_amount') {
        finalDiscount = result.discount_value
      } else if (result.discount_type === 'percentage') {
        finalDiscount = (amount * result.discount_value) / 100
        
        // Apply max discount cap if exists
        if (result.max_discount_amount && finalDiscount > result.max_discount_amount) {
          finalDiscount = result.max_discount_amount
        }
      }
    }

    return {
      is_valid: result.is_valid,
      discount_type: result.discount_type,
      discount_value: result.discount_value,
      max_discount_amount: result.max_discount_amount,
      message: result.message,
      final_discount: finalDiscount
    }
  } catch (error) {
    console.error('Error in validateCoupon:', error)
    return {
      is_valid: false,
      message: 'Lỗi hệ thống khi kiểm tra mã giảm giá'
    }
  }
}

/**
 * Apply coupon usage (record that a coupon was used)
 */
export async function applyCouponUsage(
  couponCode: string,
  userId: string,
  orderAmount: number,
  discountApplied: number,
  transactionId?: string
): Promise<boolean> {
  try {
    const supabase = createClient()
    
    // Get coupon by code
    const { data: coupon, error: couponError } = await supabase
      .from('coupons')
      .select('id, usage_count')
      .eq('code', couponCode.toUpperCase())
      .single()

    if (couponError || !coupon) {
      console.error('Error getting coupon:', couponError)
      return false
    }

    // Record usage
    const { error: usageError } = await supabase
      .from('coupon_usage')
      .insert({
        coupon_id: coupon.id,
        user_id: userId,
        order_amount: orderAmount,
        discount_applied: discountApplied,
        transaction_id: transactionId
      })

    if (usageError) {
      console.error('Error recording coupon usage:', usageError)
      return false
    }

    // Update usage count
    const { error: updateError } = await supabase
      .from('coupons')
      .update({ usage_count: (coupon.usage_count || 0) + 1 })
      .eq('id', coupon.id)

    if (updateError) {
      console.error('Error updating usage count:', updateError)
      return false
    }

    return true
  } catch (error) {
    console.error('Error in applyCouponUsage:', error)
    return false
  }
}

/**
 * Get all coupons (for admin)
 */
export async function getAllCoupons(): Promise<Coupon[]> {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error getting coupons:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getAllCoupons:', error)
    return []
  }
}

/**
 * Create a new coupon (for admin)
 */
export async function createCoupon(coupon: Omit<Coupon, 'id' | 'created_at' | 'updated_at' | 'usage_count'>): Promise<Coupon | null> {
  try {
    const supabase = createClient()
    
    // Get current user ID for created_by
    const { data: { user } } = await supabase.auth.getUser()
    
    const { data, error } = await supabase
      .from('coupons')
      .insert({
        ...coupon,
        code: coupon.code.toUpperCase(),
        created_by: user?.id
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating coupon:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in createCoupon:', error)
    return null
  }
}

/**
 * Update a coupon (for admin)
 */
export async function updateCoupon(id: string, updates: Partial<Coupon>): Promise<boolean> {
  try {
    const supabase = createClient()
    
    const { error } = await supabase
      .from('coupons')
      .update({
        ...updates,
        code: updates.code?.toUpperCase()
      })
      .eq('id', id)

    if (error) {
      console.error('Error updating coupon:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error in updateCoupon:', error)
    return false
  }
}

/**
 * Delete a coupon (for admin)
 */
export async function deleteCoupon(id: string): Promise<boolean> {
  try {
    const supabase = createClient()
    
    const { error } = await supabase
      .from('coupons')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting coupon:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error in deleteCoupon:', error)
    return false
  }
}

/**
 * Get coupon usage history (for admin)
 */
export async function getCouponUsageHistory(couponId?: string): Promise<CouponUsage[]> {
  try {
    const supabase = createClient()
    
    let query = supabase
      .from('coupon_usage')
      .select('*')
      .order('used_at', { ascending: false })

    if (couponId) {
      query = query.eq('coupon_id', couponId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error getting coupon usage history:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getCouponUsageHistory:', error)
    return []
  }
}

/**
 * Format discount display
 */
export function formatDiscount(type: 'percentage' | 'fixed_amount', value: number): string {
  if (type === 'percentage') {
    return `${value}%`
  } else {
    return `$${(value / 1000).toFixed(2)}`
  }
}

/**
 * Calculate discount amount
 */
export function calculateDiscountAmount(
  amount: number,
  type: 'percentage' | 'fixed_amount',
  value: number,
  maxDiscount?: number | null
): number {
  if (type === 'fixed_amount') {
    return Math.min(value, amount)
  } else {
    const discount = (amount * value) / 100
    if (maxDiscount) {
      return Math.min(discount, maxDiscount)
    }
    return discount
  }
}

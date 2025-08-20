/**
 * Premium Service
 * Xử lý logic mua premium, validate coupon và cập nhật database
 */

import { createSupabaseBrowserClient } from '@/lib/auth/supabase-ssr'
import { getUserBalance, deductBalance } from '@/lib/balance-utils'
import { recordCouponUsage } from '@/lib/coupon-validation'
import { notificationService } from '@/services/notification-service'

// Translation function type
type TranslationFunction = (key: string, params?: Record<string, any>) => string

const supabase = createSupabaseBrowserClient()

export interface CouponValidationResult {
  valid: boolean
  discount: number
  message?: string
  code?: string
}

export interface PremiumPurchaseData {
  userId: string
  months: number
  amount: number
  originalAmount?: number
  discountAmount?: number
  couponCode?: string
  couponId?: string
}

export interface PremiumPurchaseResult {
  success: boolean
  transactionId?: string
  newExpiryDate?: string
  months?: number
  amount?: number
  couponUsed?: string
  error?: string
}

class PremiumService {
  // Predefined coupon codes cho demo
  private readonly COUPON_CODES = {
    'NEWUSER10': { discount: 10, active: true, description: 'Người dùng mới -10%' },
    'SAVE15': { discount: 15, active: true, description: 'Tiết kiệm -15%' },
    'STUDENT20': { discount: 20, active: true, description: 'Học sinh -20%' },
    'WELCOME25': { discount: 25, active: true, description: 'Chào mừng -25%' },
    'PREMIUM30': { discount: 30, active: false, description: 'Premium -30% (hết hạn)' }
  }

  /**
   * Validate coupon code
   */
  async validateCoupon(code: string): Promise<CouponValidationResult> {
    if (!code || !code.trim()) {
      return {
        valid: false,
        discount: 0,
        message: 'Vui lòng nhập mã giảm giá'
      }
    }

    const upperCode = code.toUpperCase().trim()
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800))

    const coupon = this.COUPON_CODES[upperCode as keyof typeof this.COUPON_CODES]
    
    if (!coupon) {
      return {
        valid: false,
        discount: 0,
        message: 'Mã giảm giá không tồn tại'
      }
    }

    if (!coupon.active) {
      return {
        valid: false,
        discount: 0,
        message: 'Mã giảm giá đã hết hạn'
      }
    }

    return {
      valid: true,
      discount: coupon.discount,
      code: upperCode,
      message: `Áp dụng thành công! Giảm ${coupon.discount}%`
    }
  }

  /**
   * Purchase premium subscription
   */
  async purchasePremium(data: PremiumPurchaseData, t?: TranslationFunction): Promise<PremiumPurchaseResult> {
    try {
      // Validate input
      if (!data.userId || data.months <= 0 || data.amount <= 0) {
        return {
          success: false,
          error: t?.('premium.errors.invalidData') || 'Dữ liệu không hợp lệ'
        }
      }

      // Check user balance first
      const currentBalance = await getUserBalance(data.userId)
      if (currentBalance < data.amount) {
        const errorMessage = t?.('premium.errors.insufficientBalance', {
          amount: data.amount.toFixed(2),
          balance: currentBalance.toFixed(2)
        }) || `Số dư không đủ. Bạn cần $${data.amount.toFixed(2)} nhưng chỉ có $${currentBalance.toFixed(2)}`

        return {
          success: false,
          error: errorMessage
        }
      }

      // Deduct balance for premium purchase
      const deductResult = await deductBalance(data.userId, data.amount)
      if (!deductResult.success) {
        return {
          success: false,
          error: deductResult.error || t?.('premium.errors.deductFailed') || 'Không thể trừ tiền từ tài khoản'
        }
      }

      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Calculate new expiry date
      const currentDate = new Date()
      
      // Get current user's expiry date if they already have premium
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('subscription_expires_at')
        .eq('id', data.userId)
        .single()

      if (userError && userError.code !== 'PGRST116') {
        console.error('Error fetching user:', userError)
        return {
          success: false,
          error: 'Lỗi khi lấy thông tin người dùng'
        }
      }

      // Calculate start date (either now or current expiry date if still valid)
      let startDate = currentDate
      if (userData?.subscription_expires_at) {
        const currentExpiry = new Date(userData.subscription_expires_at)
        if (currentExpiry > currentDate) {
          startDate = currentExpiry // Extend from current expiry
        }
      }

      // Calculate new expiry date
      const newExpiryDate = new Date(startDate)
      newExpiryDate.setMonth(newExpiryDate.getMonth() + data.months)

      // Generate transaction ID
      const transactionId = `JLPT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      // Update user's subscription in database
      const { error: updateError } = await supabase
        .from('users')
        .update({
          role: 'Premium',
          subscription_expires_at: newExpiryDate.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', data.userId)

      if (updateError) {
        console.error('Error updating user subscription:', updateError)
        return {
          success: false,
          error: t?.('premium.errors.updateFailed') || 'Lỗi khi cập nhật thông tin premium'
        }
      }

      // Record transaction (optional - could create a transactions table)
      const transactionRecord = {
        id: transactionId,
        user_id: data.userId,
        type: 'premium_subscription',
        months: data.months,
        amount: data.amount,
        coupon_code: data.couponCode,
        created_at: new Date().toISOString(),
        status: 'completed'
      }

      // Log transaction for debugging
      console.log('Premium purchase completed:', transactionRecord)

      // Record coupon usage if a coupon was used
      if (data.couponId) {
        // Calculate discount amount if not provided
        const discountAmount = data.discountAmount ||
          (data.originalAmount ? data.originalAmount - data.amount : 0)

        await recordCouponUsage(
          data.couponId,
          data.userId,
          transactionId,
          discountAmount > 0 ? discountAmount : undefined
        )
      }

      // Send premium upgrade notification (client-side insert allowed by user policy)
      await notificationService.sendPremiumUpgradeNotification(
        data.userId,
        data.months >= 12 ? 'yearly' : 'monthly',
        newExpiryDate.toISOString()
      )

      return {
        success: true,
        transactionId,
        newExpiryDate: newExpiryDate.toISOString(),
        months: data.months,
        amount: data.amount,
        couponUsed: data.couponCode
      }

    } catch (error) {
      console.error('Premium purchase error:', error)
      return {
        success: false,
        error: 'Có lỗi xảy ra khi xử lý thanh toán'
      }
    }
  }

  /**
   * Get available coupon codes (for demo purposes)
   */
  getAvailableCoupons() {
    return Object.entries(this.COUPON_CODES)
      .filter(([_, coupon]) => coupon.active)
      .map(([code, coupon]) => ({
        code,
        discount: coupon.discount,
        description: coupon.description
      }))
  }

  /**
   * Calculate pricing with discounts
   */
  calculatePricing(months: number, couponDiscount: number = 0, basePrice: number = 99000) {
    // Tier discounts based on duration
    const tierDiscounts = [
      { months: 1, discount: 0 },
      { months: 3, discount: 0.05 },
      { months: 6, discount: 0.10 },
      { months: 12, discount: 0.15 }
    ]

    const tier = tierDiscounts.reverse().find(t => months >= t.months) || tierDiscounts[0]
    const subtotal = basePrice * months
    const tierDiscount = subtotal * tier.discount
    const couponDiscountAmount = (subtotal - tierDiscount) * (couponDiscount / 100)
    const total = Math.max(subtotal - tierDiscount - couponDiscountAmount, 0)

    return {
      subtotal,
      tierDiscount,
      couponDiscountAmount,
      total,
      discountPercent: tier.discount * 100,
      perMonth: Math.round(total / months)
    }
  }
}

export const premiumService = new PremiumService()

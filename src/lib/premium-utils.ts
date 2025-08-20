/**
 * Premium Utilities
 * Các utility functions để xử lý thông tin premium
 */

import { formatDateYMD } from './role-utils'

// Translation function type
type TranslationFunction = (key: string, params?: Record<string, any>) => string

/**
 * Tính số ngày premium còn lại
 * @param expiryDate - Ngày hết hạn premium (ISO string)
 * @returns Số ngày còn lại (âm nếu đã hết hạn)
 */

export function calculatePremiumDaysLeft(expiryDate: string | undefined): number | null {
  if (!expiryDate) return null
  
  const expiry = new Date(expiryDate)
  const now = new Date()
  
  // Reset time to start of day for accurate day calculation
  expiry.setHours(23, 59, 59, 999)
  now.setHours(0, 0, 0, 0)
  
  const diffTime = expiry.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  return diffDays
}

/**
 * Kiểm tra xem user có premium active không
 * @param expiryDate - Ngày hết hạn premium
 * @returns true nếu premium còn hiệu lực
 */
export function isPremiumActive(expiryDate: string | undefined): boolean {
  if (!expiryDate) return false
  
  const daysLeft = calculatePremiumDaysLeft(expiryDate)
  return daysLeft !== null && daysLeft > 0
}

/**
 * Format hiển thị thông tin premium
 * @param expiryDate - Ngày hết hạn premium
 * @param t - Translation function (optional)
 * @returns Object chứa thông tin hiển thị
 */
export function formatPremiumInfo(
  expiryDate: string | undefined,
  t?: TranslationFunction
): {
  status: 'active' | 'expired' | 'none'
  message: string
  daysLeft: number | null
  className: string
} {
  if (!expiryDate) {
    return {
      status: 'none',
      message: t?.('premium.noSubscription') || 'Chưa có gói Premium',
      daysLeft: null,
      className: 'text-muted-foreground'
    }
  }

  const daysLeft = calculatePremiumDaysLeft(expiryDate)

  if (daysLeft === null) {
    return {
      status: 'none',
      message: t?.('premium.noSubscription') || 'Chưa có gói Premium',
      daysLeft: null,
      className: 'text-muted-foreground'
    }
  }

  if (daysLeft > 0) {
    const formatted = formatDateYMD(expiryDate, t)
    const expiryLabel = t?.('premium.expiryLabel') || 'Hạn sử dụng'
    return {
      status: 'active',
      message: `${expiryLabel}: ${formatted}`,
      daysLeft,
      className: 'text-green-600'
    }
  } else {
    return {
      status: 'expired',
      message: t?.('premium.expired') || 'Premium đã hết hạn',
      daysLeft,
      className: 'text-red-600'
    }
  }
}

/**
 * Format ngày hết hạn premium để hiển thị
 * @param expiryDate - Ngày hết hạn premium
 * @param locale - Locale for date formatting (default: 'vi-VN')
 * @param t - Translation function (optional)
 * @returns Chuỗi ngày đã format
 */
export function formatExpiryDate(
  expiryDate: string | undefined,
  locale: string = 'vi-VN',
  t?: TranslationFunction
): string {
  if (!expiryDate) return t?.('premium.undefinedDate') || 'Không xác định'

  try {
    const date = new Date(expiryDate)
    return date.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  } catch {
    return t?.('premium.invalidDate') || 'Không hợp lệ'
  }
}

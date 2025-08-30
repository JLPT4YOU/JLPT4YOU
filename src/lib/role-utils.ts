/**
 * Role Utilities
 * Xử lý màu sắc role và tính toán hạn sử dụng
 */

import { Database } from '@/types/supabase'
import { getBalanceDisplayInfo } from '@/lib/balance-utils'

export type UserRole = 'Free' | 'Premium' | 'Admin'

// Translation function type
type TranslationFunction = (key: string, params?: Record<string, any>) => string

/**
 * Cấu hình màu sắc cho từng role - Pure monochrome system
 */
export const ROLE_COLORS = {
  Free: {
    bg: 'bg-muted',
    text: 'text-foreground',
    border: 'border-border',
    ring: 'ring-ring'
  },
  Premium: {
    bg: 'bg-secondary/20',
    text: 'text-foreground',
    border: 'border-secondary/40',
    ring: 'ring-secondary/60'
  },
  Admin: {
    bg: 'bg-primary/10',
    text: 'text-foreground',
    border: 'border-primary/20',
    ring: 'ring-primary/30'
  }
} as const

/**
 * Lấy class CSS cho role badge
 */
export function getRoleClasses(role: UserRole | undefined): string {
  // Default to 'Free' if role is undefined or invalid
  const safeRole = role && role in ROLE_COLORS ? role : 'Free'
  const colors = ROLE_COLORS[safeRole]
  return `inline-flex items-center app-px-xs app-py-xs rounded-full text-sm font-medium ${colors.bg} ${colors.text} ${colors.border} border`
}

/**
 * Tính toán hạn sử dụng cho tài khoản Free
 * Free account có hạn sử dụng 30 ngày từ ngày tạo tài khoản
 */
export function calculateFreeAccountExpiry(createdAt: string, locale: string = 'vi-VN'): string {
  const created = new Date(createdAt)
  const expiry = new Date(created)
  expiry.setDate(expiry.getDate() + 30) // 30 ngày từ ngày tạo

  return expiry.toLocaleDateString(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

/**
 * Kiểm tra xem tài khoản có hết hạn không
 */
export function isAccountExpired(expiryDate: string | undefined): boolean {
  if (!expiryDate) return false
  
  const expiry = new Date(expiryDate)
  const now = new Date()
  
  return expiry < now
}

/**
 * Tính số ngày còn lại
 */
/**
 * Định dạng ngày yyyy/mm/dd
 */
export function formatDateYMD(dateInput: string, t?: TranslationFunction): string {
  try {
    const date = new Date(dateInput)
    const yyyy = date.getFullYear()
    const mm = String(date.getMonth() + 1).padStart(2, '0')
    const dd = String(date.getDate()).padStart(2, '0')
    return `${yyyy}/${mm}/${dd}`
  } catch {
    return t?.('premium.undefinedDate') || 'Không xác định'
  }
}

export function getDaysRemaining(expiryDate: string | undefined): number {
  if (!expiryDate) return 0
  
  const expiry = new Date(expiryDate)
  const now = new Date()
  const diffTime = expiry.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  return Math.max(0, diffDays)
}

/**
 * Lấy text hiển thị cho hạn sử dụng
 */
export function getExpiryDisplayText(role: UserRole, expiryDate: string | undefined, t?: TranslationFunction): string {
  if (role === 'Admin') {
    return 'unlimited' // Trả về 'unlimited' để component biết hiển thị icon
  }

  if (role === 'Free') {
    return 'unlimited' // Trả về 'unlimited' để component biết hiển thị icon
  }

  if (role === 'Premium') {
    if (!expiryDate) {
      return t?.('premium.undefinedExpiry') || 'Premium không xác định hạn'
    }

    const daysRemaining = getDaysRemaining(expiryDate)
    if (daysRemaining <= 0) {
      return t?.('premium.expired') || 'Premium đã hết hạn'
    }
    const formatted = formatDateYMD(expiryDate, t)
    const expiryLabel = t?.('premium.expiryLabel') || 'Hạn sử dụng'
    return `${expiryLabel}: ${formatted}`
  }

  return ''
}

/**
 * Lấy thông tin hiển thị balance cho user dropdown
 */
export async function getUserBalanceDisplay(userId: string, t?: TranslationFunction): Promise<string> {
  try {
    const balanceInfo = await getBalanceDisplayInfo(userId)
    const balanceLabel = t?.('balance.label') || 'Số dư'
    return `${balanceLabel}: ${balanceInfo.formattedBalance}`
  } catch (error) {
    console.error('Error getting user balance display:', error)
    const balanceLabel = t?.('balance.label') || 'Số dư'
    return `${balanceLabel}: 0 ₫`
  }
}

/**
 * Lấy màu text cho hạn sử dụng dựa trên số ngày còn lại
 */
export function getExpiryTextColor(role: UserRole, expiryDate: string | undefined): string {
  if (role === 'Admin' || role === 'Free') {
    return 'text-muted-foreground'
  }

  const daysRemaining = getDaysRemaining(expiryDate)

  if (daysRemaining <= 0) {
    return 'text-red-600 dark:text-red-400'
  }

  if (daysRemaining <= 7) {
    return 'text-orange-600 dark:text-orange-400'
  }

  return 'text-muted-foreground'
}

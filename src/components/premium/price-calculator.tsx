/**
 * Price Calculator Component
 * Component hiển thị tính toán giá và tóm tắt đơn hàng
 */

"use client"

import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Gift, Tag, Calculator, Crown } from 'lucide-react'

interface PricingDetails {
  subtotal: number
  tierDiscount: number
  couponDiscountAmount: number
  total: number
  discountPercent: number
}

interface PriceCalculatorProps {
  selectedMonths: number
  pricing: PricingDetails
  couponCode: string
  isValidCoupon: boolean
}

export function PriceCalculator({ 
  selectedMonths, 
  pricing, 
  couponCode, 
  isValidCoupon 
}: PriceCalculatorProps) {
  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('vi-VN') + '₫'
  }

  const perMonthPrice = Math.round(pricing.total / selectedMonths)

  return (
    <div className="space-y-4">
      {/* Package Info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Crown className="w-4 h-4 text-primary" />
          <span className="font-medium">Premium {selectedMonths} tháng</span>
        </div>
        <span className="font-semibold">{formatCurrency(pricing.subtotal)}</span>
      </div>

      {/* Discounts */}
      {pricing.tierDiscount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between text-green-600"
        >
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4" />
            <span className="text-sm">Giảm giá gói ({pricing.discountPercent}%)</span>
          </div>
          <span className="text-sm font-medium">-{formatCurrency(pricing.tierDiscount)}</span>
        </motion.div>
      )}

      {isValidCoupon && pricing.couponDiscountAmount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between text-green-600"
        >
          <div className="flex items-center gap-2">
            <Gift className="w-4 h-4" />
            <span className="text-sm">Mã giảm giá: {couponCode}</span>
          </div>
          <span className="text-sm font-medium">-{formatCurrency(pricing.couponDiscountAmount)}</span>
        </motion.div>
      )}

      <Separator />

      {/* Total */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-lg font-bold">
          <span>Tổng cộng</span>
          <span className="text-primary">{formatCurrency(pricing.total)}</span>
        </div>
        
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Trung bình/tháng</span>
          <span>{formatCurrency(perMonthPrice)}</span>
        </div>
      </div>

      {/* Savings Summary */}
      {(pricing.tierDiscount > 0 || pricing.couponDiscountAmount > 0) && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-3 bg-green-50 border border-green-200 rounded-lg"
        >
          <div className="flex items-center gap-2 mb-1">
            <Calculator className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-700">
              Bạn đã tiết kiệm
            </span>
          </div>
          <div className="text-lg font-bold text-green-700">
            {formatCurrency(pricing.tierDiscount + pricing.couponDiscountAmount)}
          </div>
          {pricing.tierDiscount + pricing.couponDiscountAmount > 0 && (
            <div className="text-xs text-green-600 mt-1">
              So với giá gốc {formatCurrency(pricing.subtotal)}
            </div>
          )}
        </motion.div>
      )}

      {/* Premium Benefits Reminder */}
      <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
        <div className="text-sm">
          <div className="font-medium text-primary mb-1">✨ Bao gồm:</div>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Truy cập không giới hạn tất cả đề thi</li>
            <li>• AI trợ giúp cá nhân hóa</li>
            <li>• Tải PDF đề thi và đáp án</li>
            <li>• Phân tích chi tiết kết quả</li>
          </ul>
        </div>
      </div>

      {/* Payment Security */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span>Thanh toán an toàn & bảo mật</span>
        </div>
      </div>
    </div>
  )
}

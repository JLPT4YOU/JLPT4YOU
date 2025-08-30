/**
 * Coupon Input Component
 * Component nhập và validate mã giảm giá
 */

"use client"

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Gift, Check, X, Loader2 } from 'lucide-react'

interface CouponInputProps {
  couponCode: string
  onCouponApply: (code: string) => Promise<void>
  isValid: boolean
  discount: number
}

export function CouponInput({ couponCode, onCouponApply, isValid, discount }: CouponInputProps) {
  const [inputValue, setInputValue] = useState(couponCode)
  const [isApplying, setIsApplying] = useState(false)
  const [hasApplied, setHasApplied] = useState(false)

  const handleApply = async () => {
    if (!inputValue.trim()) return
    
    setIsApplying(true)
    setHasApplied(true)
    
    try {
      await onCouponApply(inputValue.trim().toUpperCase())
    } finally {
      setIsApplying(false)
    }
  }

  const handleRemove = () => {
    setInputValue('')
    setHasApplied(false)
    onCouponApply('')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleApply()
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            placeholder="Nhập mã giảm giá..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value.toUpperCase())}
            onKeyPress={handleKeyPress}
            disabled={isApplying}
            className="pr-10"
          />
          
          {/* Status Icon */}
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {isApplying ? (
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            ) : hasApplied && inputValue ? (
              isValid ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <X className="w-4 h-4 text-red-500" />
              )
            ) : (
              <Gift className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
        </div>
        
        {inputValue && !isValid ? (
          <Button
            onClick={handleApply}
            disabled={isApplying || !inputValue.trim()}
            variant="outline"
          >
            {isApplying ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Áp dụng'
            )}
          </Button>
        ) : isValid ? (
          <Button
            onClick={handleRemove}
            variant="outline"
            size="sm"
          >
            <X className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            onClick={handleApply}
            disabled={isApplying || !inputValue.trim()}
            variant="outline"
          >
            {isApplying ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Áp dụng'
            )}
          </Button>
        )}
      </div>

      {/* Status Messages */}
      <AnimatePresence mode="wait">
        {hasApplied && inputValue && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            {isValid ? (
              <div className="flex items-center justify-between p-3 bg-success/10 border border-success/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-success" />
                  <span className="text-sm text-success">
                    Mã giảm giá hợp lệ!
                  </span>
                </div>
                <Badge variant="secondary" className="bg-success/20 text-success">
                  -{discount}%
                </Badge>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <X className="w-4 h-4 text-red-600" />
                <span className="text-sm text-red-700">
                  Mã giảm giá không hợp lệ hoặc đã hết hạn
                </span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Popular Coupons */}
      {!isValid && (
        <div className="space-y-2">
          <div className="text-sm font-medium text-muted-foreground">
            Mã giảm giá phổ biến:
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { code: 'NEWUSER10', label: 'Người dùng mới -10%' },
              { code: 'SAVE15', label: 'Tiết kiệm -15%' },
              { code: 'STUDENT20', label: 'Học sinh -20%' }
            ].map((coupon) => (
              <Button
                key={coupon.code}
                variant="outline"
                size="sm"
                onClick={() => {
                  setInputValue(coupon.code)
                  handleApply()
                }}
                className="text-xs"
                disabled={isApplying}
              >
                {coupon.code}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Month Selector Component
 * Component cho phép user chọn số tháng premium
 */

"use client"

import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Check, Crown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DiscountTier {
  months: number
  discount: number
  label: string
  badge?: string
}

interface MonthSelectorProps {
  selectedMonths: number
  onMonthChange: (months: number) => void
  discountTiers: DiscountTier[]
}

export function MonthSelector({ selectedMonths, onMonthChange, discountTiers }: MonthSelectorProps) {
  // Popular month options
  const monthOptions = [1, 3, 6, 12]

  const formatPrice = (months: number, basePrice = 99000) => {
    const tier = discountTiers.find(t => t.months <= months) || discountTiers[0]
    const subtotal = basePrice * months
    const discount = subtotal * tier.discount
    const total = subtotal - discount
    
    return {
      subtotal,
      total,
      perMonth: Math.round(total / months),
      discount: tier.discount * 100
    }
  }

  return (
    <div className="space-y-4">
      {/* Quick Selection */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {monthOptions.map((months) => {
          const pricing = formatPrice(months)
          const tier = discountTiers.find(t => t.months === months)
          const isSelected = selectedMonths === months
          
          return (
            <motion.div
              key={months}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div
                className={cn(
                  "cursor-pointer transition-all duration-200 bg-background rounded-2xl p-4 text-center relative border",
                  isSelected
                    ? "border-2 border-foreground bg-muted/5 shadow-lg"
                    : "border-border/50 hover:border-border"
                )}
                onClick={() => onMonthChange(months)}
              >
                  {/* Popular Badge */}
                  {tier?.badge && (
                    <Badge 
                      variant="secondary" 
                      className="absolute -top-2 left-1/2 transform -translate-x-1/2 text-xs"
                    >
                      {tier.badge}
                    </Badge>
                  )}
                  
                  {/* Selected Indicator */}
                  {isSelected && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-foreground rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-background" />
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="text-lg font-bold text-foreground">
                      {months} tháng
                    </div>

                    {tier?.label && (
                      <div className="text-xs text-muted-foreground">
                        {tier.label}
                      </div>
                    )}

                    <div className="space-y-1">
                      <div className="text-xl font-bold text-foreground">
                        {pricing.total.toLocaleString('vi-VN')}₫
                      </div>

                      {pricing.discount > 0 && (
                        <div className="text-xs text-muted-foreground line-through">
                          {pricing.subtotal.toLocaleString('vi-VN')}₫
                        </div>
                      )}

                      <div className="text-xs text-muted-foreground">
                        {pricing.perMonth.toLocaleString('vi-VN')}₫/tháng
                      </div>
                    </div>
                  </div>
                </div>
            </motion.div>
          )
        })}
      </div>

      {/* Custom Month Input */}
      <div className="border-t pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4 text-primary" />
            <span className="font-medium">Gói tùy chỉnh</span>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => onMonthChange(Math.max(1, selectedMonths - 1))}
              className="w-8 h-8 rounded-full border border-muted-foreground/20 hover:bg-muted flex items-center justify-center text-sm font-medium"
              disabled={selectedMonths <= 1}
            >
              -
            </button>
            
            <div className="min-w-[60px] text-center">
              <input
                type="number"
                min="1"
                max="24"
                value={selectedMonths}
                onChange={(e) => onMonthChange(Math.max(1, Math.min(24, parseInt(e.target.value) || 1)))}
                className="w-16 text-center border border-muted-foreground/20 rounded px-2 py-1 text-sm"
              />
              <div className="text-xs text-muted-foreground mt-1">tháng</div>
            </div>
            
            <button
              onClick={() => onMonthChange(Math.min(24, selectedMonths + 1))}
              className="w-8 h-8 rounded-full border border-muted-foreground/20 hover:bg-muted flex items-center justify-center text-sm font-medium"
              disabled={selectedMonths >= 24}
            >
              +
            </button>
          </div>
        </div>
        
        {!monthOptions.includes(selectedMonths) && (
          <div className="mt-3 p-3 bg-muted/50 rounded-lg">
            <div className="text-sm">
              <strong>{selectedMonths} tháng:</strong>
              <span className="ml-2 text-primary font-semibold">
                {formatPrice(selectedMonths).total.toLocaleString('vi-VN')}₫
              </span>
              <span className="ml-2 text-muted-foreground">
                ({formatPrice(selectedMonths).perMonth.toLocaleString('vi-VN')}₫/tháng)
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

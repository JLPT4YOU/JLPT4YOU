/**
 * Redeem Code Section Component
 * Allows users to redeem premium codes
 */

"use client"

import { useState } from 'react'
import { useAuth } from '@/contexts/auth-context-simple'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Gift, CheckCircle, XCircle, Crown, Calendar } from 'lucide-react'
import { useTranslations } from '@/hooks/use-translations'
import { formatPremiumInfo, formatExpiryDate } from '@/lib/premium-utils'
import { redeemService } from '@/services/redeem-service'
import { formatRedeemCode } from '@/utils/redeem-utils'
import { toast } from 'sonner'

interface RedeemCodeSectionProps {
  className?: string
}

export function RedeemCodeSection({ className }: RedeemCodeSectionProps) {
  const { user, refreshUser } = useAuth()
  const { t } = useTranslations()
  
  const [redeemCode, setRedeemCode] = useState('')
  const [isRedeeming, setIsRedeeming] = useState(false)
  const [redeemMessage, setRedeemMessage] = useState<{ 
    type: 'success' | 'error', 
    text: string,
    premiumInfo?: {
      expiryDate: string
      accountType: string
    }
  } | null>(null)

  const handleRedeemCode = async () => {
    if (!redeemCode.trim()) return

    setIsRedeeming(true)
    setRedeemMessage(null)

    try {
      // Use the redeem service
      const result = await redeemService.redeemCode(redeemCode.trim())

      if (result.success) {
        // Success case
        await refreshUser() // Refresh user data to get updated premium status
        
        setRedeemMessage({
          type: 'success',
          text: result.message || `Đã kích hoạt thành công ${result.premium_days_added} ngày Premium!`,
          premiumInfo: {
            expiryDate: result.new_expiry || (user as any)?.expiryDate,
            accountType: 'Premium'
          }
        })
        setRedeemCode('') // Clear the input
        
        // Show success toast
        toast.success(`Đã thêm ${result.premium_days_added} ngày Premium vào tài khoản của bạn!`)
      } else {
        // Error case
        setRedeemMessage({
          type: 'error',
          text: result.error || 'Code không hợp lệ hoặc đã được sử dụng'
        })
        
        // Show error toast
        toast.error(result.error || 'Không thể kích hoạt code')
      }
    } catch (error) {
      // Network or other errors
      setRedeemMessage({
        type: 'error',
        text: 'Đã xảy ra lỗi khi kích hoạt code'
      })
      toast.error('Đã xảy ra lỗi khi kích hoạt code')
    }

    setIsRedeeming(false)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRedeemCode()
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="w-5 h-5 text-primary" />
          {t ? t('pages.settings.profile.redeemCode.title') : 'Kích hoạt Premium'}
        </CardTitle>
        <CardDescription>
          {t ? t('pages.settings.profile.redeemCode.description') : 'Nhập mã code để nâng cấp tài khoản lên Premium'}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Redeem Code Input */}
        <div className="space-y-2">
          <Label htmlFor="redeemCode">
            {t ? t('pages.settings.profile.redeemCode.codeLabel') : 'Mã code Premium'}
          </Label>
          <div className="flex gap-2">
            <Input
              id="redeemCode"
              type="text"
              value={redeemCode}
              onChange={(e) => setRedeemCode(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={t ? t('pages.settings.profile.redeemCode.placeholder') : 'Nhập mã code...'}
              disabled={isRedeeming}
              className="flex-1"
            />
            <Button 
              onClick={handleRedeemCode}
              disabled={isRedeeming || !redeemCode.trim()}
              className="min-w-[100px]"
            >
              {isRedeeming ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t ? t('pages.settings.profile.redeemCode.redeeming') : 'Đang xử lý...'}
                </>
              ) : (
                <>
                  <Gift className="w-4 h-4 mr-2" />
                  {t ? t('pages.settings.profile.redeemCode.redeemButton') : 'Kích hoạt'}
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Result Message */}
        {redeemMessage && (
          <div className={`p-4 rounded-lg border ${
            redeemMessage.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-950 dark:border-green-800 dark:text-green-200'
              : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950 dark:border-red-800 dark:text-red-200'
          }`}>
            <div className="flex items-start gap-3">
              {redeemMessage.type === 'success' ? (
                <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              ) : (
                <XCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              )}
              
              <div className="flex-1 space-y-2">
                <p className="font-medium">
                  {redeemMessage.text}
                </p>
                
                {/* Success details */}
                {redeemMessage.type === 'success' && redeemMessage.premiumInfo && (
                  <div className="space-y-3 pt-2 border-t border-current/20">
                    {/* Account Type */}
                    <div className="flex items-center gap-2">
                      <Crown className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        {t ? t('pages.settings.profile.redeemCode.accountType') : 'Loại tài khoản'}: {redeemMessage.premiumInfo.accountType}
                      </span>
                    </div>
                    
                    {/* Premium Expiry */}
                    {redeemMessage.premiumInfo.expiryDate && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm">
                          {t ? t('pages.settings.profile.redeemCode.expiryDate') : 'Hạn Premium'}: {formatExpiryDate(redeemMessage.premiumInfo.expiryDate)}
                        </span>
                      </div>
                    )}
                    
                    {/* Thank you message */}
                    <div className="text-sm font-medium pt-1">
                      {t ? t('pages.settings.profile.redeemCode.thankYou') : 'Cảm ơn bạn đã sử dụng dịch vụ Premium của chúng tôi! 🎉'}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

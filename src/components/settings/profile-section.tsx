/**
 * Profile Section Component
 * Manages user personal information
 */

"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context-simple'
import { useUserData } from '@/hooks/use-user-data' // ✅ ADDED: Import user data hook
import { userSettingsService } from '@/lib/user-settings-service'
import { IconSelector, getIconComponent } from './icon-selector'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Save, User, Mail, Calendar, Crown } from 'lucide-react'
import { useTranslations } from '@/hooks/use-translations'
import { getRoleClasses } from '@/lib/role-utils'
import { formatPremiumInfo, formatExpiryDate } from '@/lib/premium-utils'
import { useRouter } from 'next/navigation'

interface ProfileSectionProps {
  className?: string
}

export function ProfileSection({ className }: ProfileSectionProps) {
  const { user, updateUser, refreshUser } = useAuth()
  const { userData, loading: userDataLoading } = useUserData() // ✅ ADDED: Get user data
  const { t } = useTranslations()
  const router = useRouter()

  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // ✅ FIXED: Use userData for profile information
  const displayUser = {
    name: userData?.name || user?.user_metadata?.name || '',
    email: user?.email || '',
    avatarIcon: userData?.avatar_icon || 'User',
    role: userData?.role || 'Free',
    expiryDate: userData?.subscription_expires_at || null
  };

  // Form state
  const [formData, setFormData] = useState({
    name: displayUser.name,
    email: displayUser.email,
    avatarIcon: displayUser.avatarIcon
  })

  // Load user profile data
  useEffect(() => {
    if (user && !userDataLoading) {
      setFormData({
        name: displayUser.name,
        email: displayUser.email,
        avatarIcon: displayUser.avatarIcon
      })
    }
  }, [user, userData, userDataLoading]) // ✅ FIXED: Updated dependencies

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleIconSelect = (iconName: string) => {
    setFormData(prev => ({
      ...prev,
      avatarIcon: iconName
    }))
  }

  const handleSave = async () => {
    if (!user) return

    setIsSaving(true)
    setMessage(null)

    try {
// Update profile
      const result = await userSettingsService.updateUserProfile(user.id, {
        name: formData.name,
        avatar_icon: formData.avatarIcon
      })

      if (result.success) {
        // ✅ FIXED: Update local user state using user_metadata
        updateUser({
          user_metadata: {
            name: formData.name,
            avatar_icon: formData.avatarIcon
          }
        })

        // Refresh user data from database to ensure consistency
        await refreshUser()

        setMessage({
          type: 'success',
          text: t ? t('pages.settings.profile.updateSuccess') : 'Cập nhật thông tin thành công!'
        })

        // Clear message after 3 seconds
        setTimeout(() => setMessage(null), 3000)
      } else {
        setMessage({
          type: 'error',
          text: result.error || (t ? t('pages.settings.profile.updateError') : 'Có lỗi xảy ra khi cập nhật')
        })
      }
    } catch (error) {
      console.error('Save profile error:', error)
      setMessage({
        type: 'error',
        text: t ? t('pages.settings.profile.unexpectedError') : 'Đã xảy ra lỗi không mong muốn'
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Get current avatar icon component
  const AvatarIconComponent = getIconComponent(formData.avatarIcon)

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5" />
          {t ? t('pages.settings.profile.title') : 'Thông tin cá nhân'}
        </CardTitle>
        <CardDescription>
          {t ? t('pages.settings.profile.description') : 'Quản lý thông tin hiển thị và avatar của bạn'}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Avatar Section */}
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-center gap-2">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/20">
              <AvatarIconComponent className="w-10 h-10 text-primary" />
            </div>
            <span className="text-xs text-muted-foreground">{formData.avatarIcon}</span>
          </div>
          
          <div className="flex-1">
            <Label className="text-sm font-medium">
              {t ? t('pages.settings.profile.avatar') : 'Avatar Icon'}
            </Label>
            <p className="text-sm text-muted-foreground mb-2">
              {t ? t('pages.settings.profile.avatarDescription') : 'Chọn icon để làm avatar hiển thị'}
            </p>
            <IconSelector
              selectedIcon={formData.avatarIcon}
              onIconSelect={handleIconSelect}
            />
          </div>
        </div>

        {/* Basic Info */}
        <div className="space-y-4">
          <div className="space-y-2">
<Label htmlFor="name">
              {t ? t('pages.settings.profile.name') : 'Tên'}
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder={t ? t('pages.settings.profile.namePlaceholder') : 'Nhập tên'}
            />
            <p className="text-xs text-muted-foreground">
              {t ? t('pages.settings.profile.nameDescription') : 'Tên này sẽ được hiển thị trong ứng dụng'}
            </p>
          </div>
        </div>

        {/* Email (readonly) */}
        <div className="space-y-2">
          <Label htmlFor="email">
            {t ? t('pages.settings.profile.email') : 'Email'}
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="email"
              value={formData.email}
              readOnly
              className="pl-10 bg-muted/50"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {t ? t('pages.settings.profile.emailReadonly') : 'Email không thể thay đổi'}
          </p>
        </div>

        {/* Account Info */}
        <div className="space-y-4">
          {/* Account Type */}
          <div className="flex items-center justify-between p-4 bg-muted/20 rounded-lg">
            <div className="flex items-center gap-3">
              <Crown className="w-5 h-5 text-primary" />
              <div>
                <p className="font-medium">
                  {t ? t('pages.settings.profile.accountType') : 'Loại tài khoản'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {displayUser.role === 'Premium' // ✅ FIXED
                    ? (t ? t('pages.settings.profile.accountTypePremium') : 'Tài khoản Premium')
                    : (t ? t('pages.settings.profile.accountTypeFree') : 'Tài khoản miễn phí')
                  }
                </p>
              </div>
            </div>
            <span className={getRoleClasses(displayUser.role as any)}> {/* ✅ FIXED */}
              {displayUser.role} {/* ✅ FIXED */}
            </span>
          </div>

          {/* Premium Status */}
          {(() => {
            const premiumInfo = formatPremiumInfo(displayUser.expiryDate || undefined, t) // ✅ FIXED
            return (
              <div className="flex items-center justify-between p-4 bg-muted/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium">
                      {t ? t('pages.settings.profile.premiumStatus') : 'Trạng thái Premium'}
                    </p>
                    <p className={`text-sm ${premiumInfo.className}`}>
                      {premiumInfo.message}
                    </p>
                    {displayUser.expiryDate && ( // ✅ FIXED
                      <p className="text-xs text-muted-foreground mt-1">
                        {t ? t('pages.settings.profile.expiryDate') : 'Hết hạn'}: {formatExpiryDate(displayUser.expiryDate)} {/* ✅ FIXED */}
                      </p>
                    )}
                  </div>
                </div>

                {/* Upgrade Button for Free Users */}
                {displayUser.role === 'Free' && ( // ✅ FIXED
                  <Button
                    onClick={() => router.push('/premium')}
                    size="sm"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    <Crown className="w-4 h-4 mr-2" />
                    Nâng cấp Premium
                  </Button>
                )}
              </div>
            )
          })()}
        </div>

        {/* Message */}
        {message && (
          <div className={`p-3 rounded-lg text-sm ${
            message.type === 'success'
              ? 'alert-success-soft'
              : 'alert-error-soft'
          }`}>
            {message.text}
          </div>
        )}

        {/* Save Button */}
        <div className="flex justify-end">
          <Button 
            onClick={handleSave}
            disabled={isSaving}
            className="min-w-[120px]"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t ? t('pages.settings.profile.saving') : 'Đang lưu...'}
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {t ? t('pages.settings.profile.saveChanges') : 'Lưu thay đổi'}
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

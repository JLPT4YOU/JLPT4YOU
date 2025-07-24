/**
 * Profile Section Component
 * Quản lý thông tin cá nhân của user
 */

"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { userSettingsService } from '@/lib/user-settings-service'
import { IconSelector, getIconComponent } from './icon-selector'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Save, User, Mail, Calendar, Crown } from 'lucide-react'
import { useTranslations } from '@/hooks/use-translations'

interface ProfileSectionProps {
  className?: string
}

export function ProfileSection({ className }: ProfileSectionProps) {
  const { user, updateUser, refreshUser } = useAuth()
  const { t } = useTranslations()
  
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  
// Form state
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    avatarIcon: user?.avatarIcon || 'User'
  })

  // Load user profile data
  useEffect(() => {
if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        avatarIcon: user.avatarIcon || 'User'
      })
    }
  }, [user])

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
// Update local user state
        updateUser({
          name: formData.name,
          avatarIcon: formData.avatarIcon
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
        text: 'Đã xảy ra lỗi không mong muốn'
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
              placeholder={t ? t('pages.settings.profile.name') : 'Nhập tên'}
            />
            <p className="text-xs text-muted-foreground">
              Tên này sẽ được hiển thị trong ứng dụng
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
        <div className="flex items-center justify-between p-4 bg-muted/20 rounded-lg">
          <div className="flex items-center gap-3">
            <Crown className="w-5 h-5 text-primary" />
            <div>
              <p className="font-medium">
                {t ? t('pages.settings.profile.accountType') : 'Loại tài khoản'}
              </p>
              <p className="text-sm text-muted-foreground">
                {t ? t('pages.settings.profile.createdDate') : 'Ngày tạo'}: {user?.expiryDate || 'Không xác định'}
              </p>
            </div>
          </div>
          <Badge variant={user?.role === 'Premium' ? 'default' : 'secondary'}>
            {user?.role || 'Free'}
          </Badge>
        </div>

        {/* Message */}
        {message && (
          <div className={`p-3 rounded-lg text-sm ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : 'bg-red-50 text-red-700 border border-red-200'
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

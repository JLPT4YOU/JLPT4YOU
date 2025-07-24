/**
 * Security Section Component
 * Quản lý bảo mật tài khoản: đổi mật khẩu
 */

"use client"

import { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { userSettingsService } from '@/lib/user-settings-service'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Save, Shield, Eye, EyeOff, Lock, Calendar } from 'lucide-react'
import { useTranslations } from '@/hooks/use-translations'

interface SecuritySectionProps {
  className?: string
}

export function SecuritySection({ className }: SecuritySectionProps) {
  const { user } = useAuth()
  const { t } = useTranslations()
  
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })
  
  // Form state
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }))
  }

  const handleChangePassword = async () => {
    setIsSaving(true)
    setMessage(null)

    try {
      const result = await userSettingsService.changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword
      })

      if (result.success) {
        setMessage({
          type: 'success',
          text: 'Đổi mật khẩu thành công!'
        })

        // Clear form
        setFormData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })

        // Clear message after 3 seconds
        setTimeout(() => setMessage(null), 3000)
      } else {
        setMessage({
          type: 'error',
          text: result.error || 'Có lỗi xảy ra khi đổi mật khẩu'
        })
      }
    } catch (error) {
      console.error('Change password error:', error)
      setMessage({
        type: 'error',
        text: 'Đã xảy ra lỗi không mong muốn'
      })
    } finally {
      setIsSaving(false)
    }
  }

  const isFormValid = formData.currentPassword && 
                     formData.newPassword && 
                     formData.confirmPassword &&
                     formData.newPassword === formData.confirmPassword &&
                     formData.newPassword.length >= 6 &&
                     formData.newPassword.length <= 8

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Bảo mật tài khoản
        </CardTitle>
        <CardDescription>
          Quản lý mật khẩu và bảo mật tài khoản của bạn
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Password Info */}
        <div className="flex items-center justify-between p-4 bg-muted/20 rounded-lg">
          <div className="flex items-center gap-3">
            <Lock className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="font-medium">Mật khẩu</p>
              <p className="text-sm text-muted-foreground">
                {user?.passwordUpdatedAt 
                  ? `Đổi lần cuối: ${new Date(user.passwordUpdatedAt).toLocaleDateString('vi-VN')}`
                  : 'Chưa từng đổi mật khẩu'
                }
              </p>
            </div>
          </div>
          <Calendar className="w-5 h-5 text-muted-foreground" />
        </div>

        {/* Change Password Form */}
        <div className="space-y-4">
          <h4 className="font-medium">Đổi mật khẩu</h4>
          
          {/* Current Password */}
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Mật khẩu hiện tại</Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showPasswords.current ? "text" : "password"}
                value={formData.currentPassword}
                onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                placeholder="Nhập mật khẩu hiện tại"
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => togglePasswordVisibility('current')}
              >
                {showPasswords.current ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* New Password */}
          <div className="space-y-2">
            <Label htmlFor="newPassword">Mật khẩu mới</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showPasswords.new ? "text" : "password"}
                value={formData.newPassword}
                onChange={(e) => handleInputChange('newPassword', e.target.value)}
                placeholder="Nhập mật khẩu mới (6-8 ký tự)"
                className="pr-10"
                maxLength={8}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => togglePasswordVisibility('new')}
              >
                {showPasswords.new ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Mật khẩu phải có từ 6-8 ký tự
            </p>
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Xác nhận mật khẩu mới</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showPasswords.confirm ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                placeholder="Nhập lại mật khẩu mới"
                className="pr-10"
                maxLength={8}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => togglePasswordVisibility('confirm')}
              >
                {showPasswords.confirm ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            {formData.confirmPassword && formData.newPassword !== formData.confirmPassword && (
              <p className="text-xs text-red-600">
                Mật khẩu xác nhận không khớp
              </p>
            )}
          </div>
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
            onClick={handleChangePassword}
            disabled={!isFormValid || isSaving}
            className="min-w-[120px]"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Đang lưu...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Đổi mật khẩu
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

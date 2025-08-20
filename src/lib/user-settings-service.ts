/**
 * User Settings Service
 * Xử lý các thao tác CRUD cho user profile và settings
 */

import { createClient } from '@/utils/supabase/client'
import { supabaseAdmin } from '@/utils/supabase/admin'
import type { User, UserUpdate } from '@/types/supabase'

// ✅ FIXED: Create supabase client instance
const supabase = createClient()

// Types cho user settings
export interface UserProfileUpdate {
  name?: string
  avatar_icon?: string
  role?: 'Free' | 'Premium' | 'Admin'
  subscription_expires_at?: string
}

export interface PasswordChangeData {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export interface UserSettingsResult {
  success: boolean
  data?: any
  error?: string
}

export class UserSettingsService {
  /**
   * Lấy thông tin profile của user
   */
  async getUserProfile(userId: string): Promise<UserSettingsResult> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId as any)
        .single()

      if (error) {
        return {
          success: false,
          error: 'Không thể tải thông tin người dùng'
        }
      }

      return {
        success: true,
        data
      }
    } catch (error) {
      console.error('Get user profile error:', error)
      return {
        success: false,
        error: 'Đã xảy ra lỗi khi tải thông tin người dùng'
      }
    }
  }

  /**
   * Cập nhật thông tin profile
   */
  async updateUserProfile(userId: string, updates: UserProfileUpdate): Promise<UserSettingsResult> {
    try {
      console.log('🔄 Starting updateUserProfile:', { userId, updates })

      // Validate input
      if (!userId) {
        console.error('❌ Invalid user ID:', userId)
        return {
          success: false,
          error: 'ID người dùng không hợp lệ'
        }
      }

      // Validate updates object
      if (!updates || Object.keys(updates).length === 0) {
        console.error('❌ No updates provided:', updates)
        return {
          success: false,
          error: 'Không có thông tin cần cập nhật'
        }
      }

      // Prepare update data
      const updateData: UserUpdate = {
        ...updates,
        updated_at: new Date().toISOString()
      }

      console.log('📝 Prepared update data:', updateData)

      // Check if user exists first
      const { data: existingUser, error: getUserError } = await supabase
        .from('users')
.select('id, email, name, avatar_icon')
        .eq('id', userId as any)
        .single()

      if (getUserError) {
        console.error('❌ Failed to get existing user:', getUserError)

        // Specific error handling for missing columns
        if (getUserError.message?.includes('does not exist')) {
          return {
            success: false,
            error: `Database schema chưa được cập nhật. Vui lòng chạy migration script trong Supabase SQL Editor. Chi tiết: ${getUserError.message}`
          }
        }

        return {
          success: false,
          error: `Không tìm thấy người dùng: ${getUserError.message}`
        }
      }

      console.log('👤 Existing user found:', existingUser)

      // Update in database
      const { data, error } = await supabase
        .from('users')
        .update(updateData as any)
        .eq('id', userId as any)
        .select()
        .single()

      if (error) {
        console.error('❌ Database update error:', error)
        console.error('Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        })

        // Specific error handling
        if (error.message?.includes('does not exist')) {
          return {
            success: false,
            error: `Database schema chưa được cập nhật. Vui lòng chạy migration script. Chi tiết: ${error.message}`
          }
        }

        if (error.message?.includes('permission') || error.message?.includes('policy')) {
          return {
            success: false,
            error: `Lỗi phân quyền. Vui lòng kiểm tra RLS policies. Chi tiết: ${error.message}`
          }
        }

        return {
          success: false,
          error: `Không thể cập nhật thông tin người dùng: ${error.message}`
        }
      }

      console.log('✅ Update successful:', data)

      // Also update user metadata in Supabase Auth
      if (updates.name || updates.avatar_icon) {
        const authUpdateData: any = {}
        if (updates.name) authUpdateData.name = updates.name
        if (updates.avatar_icon) authUpdateData.avatar_icon = updates.avatar_icon
        
        const { error: authError } = await supabase.auth.updateUser({
          data: authUpdateData
        })
        
        if (authError) {
          console.error('⚠️ Failed to update auth metadata:', authError)
          // Still return success since database update worked
        } else {
          console.log('✅ Auth metadata updated successfully')
        }
      }

      return {
        success: true,
        data
      }
    } catch (error) {
      console.error('💥 Unexpected error in updateUserProfile:', error)
      return {
        success: false,
        error: `Đã xảy ra lỗi khi cập nhật thông tin: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  /**
   * Đổi mật khẩu
   */
  async changePassword(passwordData: PasswordChangeData): Promise<UserSettingsResult> {
    try {
      // Validate input
      if (!passwordData.currentPassword || !passwordData.newPassword) {
        return {
          success: false,
          error: 'Vui lòng nhập đầy đủ thông tin'
        }
      }

      if (passwordData.newPassword !== passwordData.confirmPassword) {
        return {
          success: false,
          error: 'Mật khẩu xác nhận không khớp'
        }
      }

      if (passwordData.newPassword.length < 6 || passwordData.newPassword.length > 8) {
        return {
          success: false,
          error: 'Mật khẩu phải có từ 6-8 ký tự'
        }
      }

      // Update password using Supabase Auth
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      })

      if (error) {
        return {
          success: false,
          error: 'Không thể đổi mật khẩu. Vui lòng thử lại.'
        }
      }

      // Update password_updated_at in users table
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase
          .from('users')
          .update({
            password_updated_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          } as any)
          .eq('id', user.id as any)
      }

      return {
        success: true,
        data: { message: 'Đổi mật khẩu thành công' }
      }
    } catch (error) {
      console.error('Change password error:', error)
      return {
        success: false,
        error: 'Đã xảy ra lỗi khi đổi mật khẩu'
      }
    }
  }

  /**
   * Cập nhật avatar icon
   */
  async updateAvatarIcon(userId: string, iconName: string): Promise<UserSettingsResult> {
    try {
      if (!userId || !iconName) {
        return {
          success: false,
          error: 'Thông tin không hợp lệ'
        }
      }

      const { data, error } = await supabase
        .from('users')
        .update({
          avatar_icon: iconName,
          updated_at: new Date().toISOString()
        } as any)
        .eq('id', userId as any)
        .select()
        .single()

      if (error) {
        return {
          success: false,
          error: 'Không thể cập nhật avatar'
        }
      }

      return {
        success: true,
        data
      }
    } catch (error) {
      console.error('Update avatar icon error:', error)
      return {
        success: false,
        error: 'Đã xảy ra lỗi khi cập nhật avatar'
      }
    }
  }

  /**
   * Xóa avatar (đặt về null)
   */
  async removeAvatar(userId: string): Promise<UserSettingsResult> {
    try {
      const { data, error } = await supabase
        .from('users')
.update({
          avatar_icon: null,
          updated_at: new Date().toISOString()
        } as any)
        .eq('id', userId as any)
        .select()
        .single()

      if (error) {
        return {
          success: false,
          error: 'Không thể xóa avatar'
        }
      }

      return {
        success: true,
        data
      }
    } catch (error) {
      console.error('Remove avatar error:', error)
      return {
        success: false,
        error: 'Đã xảy ra lỗi khi xóa avatar'
      }
    }
  }

  /**
   * Lấy thống kê tài khoản
   */
  async getAccountStats(userId: string): Promise<UserSettingsResult> {
    try {
      // Lấy thông tin user progress
      const { data: progress, error: progressError } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', userId as any)
        .single()

      if (progressError) {
        return {
          success: false,
          error: 'Không thể tải thống kê tài khoản'
        }
      }

      // Lấy số lượng bài thi đã làm
      const { count: examCount, error: examError } = await supabase
        .from('exam_results')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId as any)

      if (examError) {
        console.warn('Could not load exam count:', examError)
      }

      return {
        success: true,
        data: {
          progress,
          examCount: examCount || 0
        }
      }
    } catch (error) {
      console.error('Get account stats error:', error)
      return {
        success: false,
        error: 'Đã xảy ra lỗi khi tải thống kê'
      }
    }
  }
}

// Export singleton instance
export const userSettingsService = new UserSettingsService()

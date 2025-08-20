'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

// ✅ FIXED: Create supabase client instance
const supabase = createClient()

interface MissingUserNotificationProps {
  userId?: string
  onClose?: () => void
}

export function MissingUserNotification({ userId, onClose }: MissingUserNotificationProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isFixing, setIsFixing] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (userId) {
      setIsVisible(true)
    }
  }, [userId])

  const handleClose = () => {
    setIsVisible(false)
    onClose?.()
  }

  const handleAutoFix = async () => {
    setIsFixing(true)
    
    try {
      // Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session?.user) {
        console.error('No valid session for auto-fix')
        return
      }

      // Call user creation API
      const response = await fetch('/api/users/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
          role: 'Free'
        })
      })

      const result = await response.json()

      if (response.ok && result.success) {

        // Refresh the page to reload auth context
        window.location.reload()
      } else {
        console.error('❌ Failed to create user record:', result.error)
        // Redirect to test page for manual fix
        router.push('/test-auth-fix')
      }
    } catch (error) {
      console.error('💥 Error in auto-fix:', error)
      // Redirect to test page for manual fix
      router.push('/test-auth-fix')
    } finally {
      setIsFixing(false)
    }
  }

  const handleManualFix = () => {
    router.push('/test-auth-fix')
  }

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center mb-4">
          <div className="flex-shrink-0">
            <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-medium text-gray-900">
              Tài khoản cần được thiết lập
            </h3>
          </div>
        </div>

        {/* Content */}
        <div className="mb-6">
          <p className="text-sm text-gray-600 mb-3">
            Tài khoản của bạn đã được xác thực thành công, nhưng cần thiết lập thêm thông tin trong hệ thống.
          </p>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  Đây có thể xảy ra nếu quá trình đăng ký bị gián đoạn hoặc có lỗi đồng bộ dữ liệu.
                </p>
              </div>
            </div>
          </div>

          {userId && (
            <div className="text-xs text-gray-500 font-mono bg-gray-50 p-2 rounded">
              User ID: {userId}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col space-y-3">
          <button
            onClick={handleAutoFix}
            disabled={isFixing}
            className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isFixing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Đang thiết lập...
              </>
            ) : (
              <>
                <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Tự động thiết lập
              </>
            )}
          </button>

          <button
            onClick={handleManualFix}
            disabled={isFixing}
            className="w-full flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
          >
            <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Thiết lập thủ công
          </button>

          <button
            onClick={handleClose}
            disabled={isFixing}
            className="w-full px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
          >
            Đóng
          </button>
        </div>

        {/* Help text */}
        <div className="mt-4 text-xs text-gray-500 text-center">
          Nếu vấn đề vẫn tiếp tục, vui lòng liên hệ hỗ trợ kỹ thuật
        </div>
      </div>
    </div>
  )
}

/**
 * Hook to detect and show missing user notification
 */
export function useMissingUserDetection() {
  const [showNotification, setShowNotification] = useState(false)
  const [userId, setUserId] = useState<string>()

  useEffect(() => {
    // Listen for missing user errors in console
    const originalError = console.error
    
    console.error = (...args) => {
      const message = args.join(' ')
      
      if (message.includes('User record missing') || message.includes('User not found')) {
        // Extract user ID if possible
        const userIdMatch = message.match(/User ID: ([a-f0-9-]+)/)
        if (userIdMatch) {
          setUserId(userIdMatch[1])
          setShowNotification(true)
        }
      }
      
      // Call original console.error
      originalError.apply(console, args)
    }

    return () => {
      console.error = originalError
    }
  }, [])

  return {
    showNotification,
    userId,
    hideNotification: () => setShowNotification(false)
  }
}

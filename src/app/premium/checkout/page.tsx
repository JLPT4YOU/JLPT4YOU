/**
 * Premium Checkout Page
 * Trang thanh toán premium với lựa chọn gói và coupon
 */

"use client"

import { Suspense } from 'react'
import { ModernCheckout } from '@/components/premium/modern-checkout'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { LanguagePageWrapper } from '@/components/language-page-wrapper'

export default function PremiumCheckoutPage() {
  return (
    <LanguagePageWrapper>
      {(translations) => (
        <ProtectedRoute>
          <div className="min-h-screen bg-background">
            <div className="app-container app-py-lg">
              <Suspense fallback={
                <div className="flex items-center justify-center min-h-[400px]">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              }>
                <ModernCheckout translations={translations as any} />
              </Suspense>
            </div>
          </div>
        </ProtectedRoute>
      )}
    </LanguagePageWrapper>
  )
}

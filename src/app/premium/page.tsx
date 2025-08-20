/**
 * Premium Pricing Page
 * Trang hiển thị bảng giá Premium với 2 gói: Free và Premium
 */

"use client"

import { Suspense } from 'react'
import { ModernPricingPage } from '@/components/premium/modern-pricing-page'
import { LanguagePageWrapper } from '@/components/language-page-wrapper'

export default function PremiumPage() {
  return (
    <LanguagePageWrapper>
      {(translations) => (
        <div className="min-h-screen bg-background">
          <div className="app-container app-py-lg">
            <Suspense fallback={
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            }>
              <ModernPricingPage translations={translations as any} />
            </Suspense>
          </div>
        </div>
      )}
    </LanguagePageWrapper>
  )
}

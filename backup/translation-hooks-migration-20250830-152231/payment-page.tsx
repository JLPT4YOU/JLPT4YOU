"use client"

import { useState } from 'react'
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Crown, Check, Star, DollarSign } from "lucide-react"
import { useTranslations } from "@/hooks/use-translations"
import { useAuth } from "@/contexts/auth-context-simple"
import { deductBalance } from "@/lib/balance-utils"
import { logTransaction } from "@/lib/transaction-utils"
import { userSettingsService } from "@/lib/user-settings-service"

export default function PaymentPage() {
  const { t } = useLanguageContext()
  const { user, updateUser } = useAuth()
  const [purchaseLoading, setPurchaseLoading] = useState(false)
  const [userBalance, setUserBalance] = useState<number>(0)

  // Premium price constant
  const PREMIUM_PRICE = 1.99

  // Free plan features
  const freeFeatures = [
    t?.('pages.payment.freeFeature1') || 'Limited practice tests',
    t?.('pages.payment.freeFeature2') || 'Basic vocabulary lists',
    t?.('pages.payment.freeFeature3') || 'Community support',
  ]

  // Premium plan features
  const premiumFeatures = [
    t?.('pages.payment.premiumFeature1') || 'Unlimited practice tests',
    t?.('pages.payment.premiumFeature2') || 'Full vocabulary & grammar database',
    t?.('pages.payment.premiumFeature3') || 'AI-powered explanations',
    t?.('pages.payment.premiumFeature4') || 'Progress tracking & analytics',
    t?.('pages.payment.premiumFeature5') || 'Priority customer support',
    t?.('pages.payment.premiumFeature6') || 'Offline access to materials',
  ]

  // Handle premium purchase
  const handlePremiumPurchase = async () => {
    if (!user) {
      alert('Vui lòng đăng nhập để mua Premium')
      return
    }

    // Check if user already has premium
    if (user.role === 'Premium') {
      alert('Bạn đã có gói Premium rồi!')
      return
    }

    setPurchaseLoading(true)
    try {
      // Step 1: Deduct balance
      const deductResult = await deductBalance(user.id, PREMIUM_PRICE)
      
      if (!deductResult.success) {
        alert(`Không thể mua Premium: ${deductResult.error}`)
        return
      }

      // Step 2: Calculate new expiry date (1 month from now)
      const newExpiryDate = new Date()
      newExpiryDate.setMonth(newExpiryDate.getMonth() + 1)
      const expiryDateString = newExpiryDate.toISOString()

      // Step 3: Update user subscription
      const updateResult = await userSettingsService.updateUserProfile(user.id, {
        role: 'Premium',
        subscription_expires_at: expiryDateString
      })

      if (!updateResult.success) {
        alert(`Lỗi cập nhật subscription: ${updateResult.error}`)
        return
      }

      // Step 4: Log transaction
      await logTransaction({
        user_id: user.id,
        type: 'purchase',
        amount: PREMIUM_PRICE,
        description: 'Premium subscription purchase',
        metadata: {
          product: 'premium_monthly',
          duration: '1_month',
          expires_at: expiryDateString
        }
      })

      // Step 5: Update local user state (using user_metadata)
      updateUser({
        user_metadata: {
          role: 'Premium',
          subscription_expires_at: expiryDateString
        }
      }) // ✅ FIXED: Use user_metadata structure

      alert('🎉 Mua Premium thành công! Chào mừng bạn đến với JLPT4You Premium!')
      
    } catch (error) {
      console.error('Premium purchase error:', error)
      alert('Đã xảy ra lỗi khi mua Premium. Vui lòng thử lại.')
    } finally {
      setPurchaseLoading(false)
    }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <div className="app-container app-section">
          <div className="app-content">
            <div className="text-center mb-12">
              <Crown className="w-16 h-16 mx-auto mb-4 text-primary" />
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {t ? t('pages.payment.title') : 'Upgrade Your Account'}
              </h1>
              <p className="text-muted-foreground">
                {t ? t('pages.payment.description') : 'Choose the plan that best fits your learning needs'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Free Plan */}
              <Card className="card-elevated">
                <CardHeader>
                  <CardTitle className="text-2xl">
                    {t ? t('pages.payment.freePlan') : 'Free Plan'}
                  </CardTitle>
                  <CardDescription>
                    {t ? t('pages.payment.freeDescription') : 'Perfect for getting started'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="text-center">
                      <span className="text-4xl font-bold text-foreground">$</span>
                      <span className="text-4xl font-bold text-foreground">0</span>
                      <p className="text-sm text-muted-foreground mt-1">
                        {t ? t('pages.payment.foreverFree') : 'Forever free'}
                      </p>
                    </div>
                    
                    <ul className="space-y-3">
                      {freeFeatures.map((feature, index) => (
                        <li key={index} className="flex items-center">
                          <Check className="w-5 h-5 text-primary mr-2" />
                          <span className="text-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    
                    <Button variant="outline" className="w-full" disabled>
                      Current Plan
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Premium Plan */}
              <Card className="card-elevated border-primary shadow-lg">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-2xl">
                        {t ? t('pages.payment.premiumPlan') : 'Premium Plan'}
                      </CardTitle>
                      <CardDescription>
                        {t ? t('pages.payment.premiumDescription') : 'Unlock all features'}
                      </CardDescription>
                    </div>
                    <div className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
                      Popular
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="text-center">
                      <span className="text-4xl font-bold text-foreground">$</span>
                      <span className="text-4xl font-bold text-foreground">1</span>
                      <span className="text-4xl font-bold text-foreground">.</span>
                      <span className="text-4xl font-bold text-foreground">99</span>
                      <p className="text-sm text-muted-foreground mt-1">
                        {t ? t('pages.payment.oneTimePayment') : 'One-time payment'}
                      </p>
                    </div>
                    
                    <ul className="space-y-3">
                      {premiumFeatures.map((feature, index) => (
                        <li key={index} className="flex items-center">
                          <Check className="w-5 h-5 text-primary mr-2" />
                          <span className="text-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    
                    <Button 
                      className="w-full" 
                      onClick={handlePremiumPurchase}
                      disabled={purchaseLoading || user?.role === 'Premium'}
                    >
                      <DollarSign className="w-4 h-4 mr-2" />
                      {purchaseLoading 
                        ? 'Đang xử lý...' 
                        : user?.role === 'Premium' 
                        ? 'Đã có Premium' 
                        : (t ? t('pages.payment.upgradeNow') : 'Upgrade Now')
                      }
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="mt-12 text-center">
              <h2 className="text-2xl font-bold text-foreground mb-6">
                {t ? t('pages.payment.whyUpgrade') : 'Why Upgrade to Premium?'}
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
                <div className="bg-muted/20 p-6 rounded-2xl">
                  <Star className="w-10 h-10 text-primary mx-auto mb-4" />
                  <h3 className="font-bold text-lg mb-2">
                    {t ? t('pages.payment.benefit1Title') : 'Comprehensive Learning'}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {t ? t('pages.payment.benefit1Description') : 'Access to all JLPT levels and extensive study materials'}
                  </p>
                </div>
                
                <div className="bg-muted/20 p-6 rounded-2xl">
                  <Star className="w-10 h-10 text-primary mx-auto mb-4" />
                  <h3 className="font-bold text-lg mb-2">
                    {t ? t('pages.payment.benefit2Title') : 'AI-Powered Assistance'}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {t ? t('pages.payment.benefit2Description') : 'Get detailed explanations for every question'}
                  </p>
                </div>
                
                <div className="bg-muted/20 p-6 rounded-2xl">
                  <Star className="w-10 h-10 text-primary mx-auto mb-4" />
                  <h3 className="font-bold text-lg mb-2">
                    {t ? t('pages.payment.benefit3Title') : 'Progress Tracking'}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {t ? t('pages.payment.benefit3Description') : 'Monitor your improvement with detailed analytics'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}

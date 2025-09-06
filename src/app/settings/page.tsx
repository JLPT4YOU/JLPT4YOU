"use client"

import { useState, Suspense, lazy } from 'react'
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Settings, User, Shield, Gift } from "lucide-react"
import { useTranslations } from "@/hooks/use-translations"
import { cn } from "@/lib/utils"

import { Card } from "@/components/ui/card";
// Dynamic imports for settings sections to reduce initial bundle size
const ProfileSection = lazy(() => import("@/components/settings/profile-section").then(module => ({
  default: module.ProfileSection
})))

const SecuritySection = lazy(() => import("@/components/settings/security-section").then(module => ({
  default: module.SecuritySection
})))

const RedeemCodeSection = lazy(() => import("@/components/settings/redeem-code-section").then(module => ({
  default: module.RedeemCodeSection
})))

// Loading fallback component for settings sections
function SettingsSectionLoader() {
  return (
    <div className="space-y-6">
      <div className="animate-pulse">
        <div className="h-8 bg-muted/20 rounded-lg mb-4"></div>
        <div className="space-y-4">
          <div className="h-4 bg-muted/20 rounded w-3/4"></div>
          <div className="h-4 bg-muted/20 rounded w-1/2"></div>
          <div className="h-12 bg-muted/20 rounded"></div>
          <div className="h-12 bg-muted/20 rounded"></div>
        </div>
      </div>
    </div>
  )
}

export default function SettingsPage() {
  const { t } = useTranslations()
  const [activeSection, setActiveSection] = useState('profile')

  const sidebarItems = [
    {
      id: 'profile',
      label: t ? t('pages.settings.profile.title') : 'Thông tin cá nhân',
      icon: User,
      description: t ? t('pages.settings.profile.description') : 'Quản lý thông tin hiển thị và avatar'
    },
    {
      id: 'security',
      label: t ? t('pages.settings.security.title') : 'Bảo mật tài khoản',
      icon: Shield,
      description: t ? t('pages.settings.security.description') : 'Quản lý mật khẩu và bảo mật'
    },
    {
      id: 'redeem',
      label: t ? t('pages.settings.profile.redeemCode.title') : 'Kích hoạt Premium',
      icon: Gift,
      description: t ? t('pages.settings.profile.redeemCode.description') : 'Nhập mã code để nâng cấp tài khoản lên Premium'
    }
  ]

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <div className="app-container app-section">
          <div className="app-content">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <Settings className="w-8 h-8 text-primary" />
                <h1 className="text-3xl font-bold text-foreground">
                  {t ? t('pages.settings.title') : 'Cài đặt tài khoản'}
                </h1>
              </div>
              <p className="text-muted-foreground">
                {t ? t('pages.settings.description') : 'Quản lý thông tin cá nhân và bảo mật tài khoản của bạn'}
              </p>
            </div>

            {/* Settings Layout with Sidebar */}
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Sidebar */}
              <div className="lg:w-80 flex-shrink-0">
                <Card size="md" radius="2xl" elevation="sm" className="bg-muted/20">
                  <h3 className="font-semibold text-foreground mb-4">
                    {t ? t('pages.settings.sidebar.title') : 'Cài đặt'}
                  </h3>
                  <nav className="space-y-2">
                    {sidebarItems.map((item) => {
                      const IconComponent = item.icon
                      const isActive = activeSection === item.id

                      return (
                        <button
                          key={item.id}
                          onClick={() => setActiveSection(item.id)}
                          className={cn(
                            "w-full text-left p-4 rounded-xl transition-all duration-200 group",
                            isActive
                              ? "bg-primary text-primary-foreground shadow-sm"
                              : "text-foreground hover:bg-muted/30 hover:text-foreground"
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <IconComponent className={cn(
                              "w-5 h-5 mt-0.5 flex-shrink-0",
                              isActive ? "text-primary-foreground" : "text-muted-foreground"
                            )} />
                            <div className="flex-1 min-w-0">
                              <div className={cn(
                                "font-medium text-sm",
                                isActive ? "text-primary-foreground" : "text-foreground"
                              )}>
                                {item.label}
                              </div>
                              <div className={cn(
                                "text-xs mt-1 line-clamp-2",
                                isActive ? "text-primary-foreground/80" : "text-muted-foreground"
                              )}>
                                {item.description}
                              </div>
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </nav>
                </Card>
              </div>

              {/* Main Content */}
              <div className="flex-1 min-w-0">
                <Suspense fallback={<SettingsSectionLoader />}>
                  {activeSection === 'profile' && <ProfileSection />}
                  {activeSection === 'security' && <SecuritySection />}
                  {activeSection === 'redeem' && <RedeemCodeSection />}
                </Suspense>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}

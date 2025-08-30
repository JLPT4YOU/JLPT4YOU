"use client"

import { useState } from 'react'
import { AdminProtectedRoute } from '@/components/auth/admin-protected-route'
import { AdminSidebar, type AdminSection } from '@/components/admin/admin-sidebar'
import { AdminHeader } from '@/components/admin/admin-header'
import { UserManagement } from '@/components/admin/user-management'
import { LibraryManagement } from '@/components/admin/library-management'
import { CouponManagement } from '@/components/admin/coupon-management'
import { RedeemCodeManager } from '@/components/admin/redeem-code-manager'
import { NotificationsManagement } from '@/components/admin/notifications-management'
import { useAdminSidebarState } from '@/hooks/use-admin-sidebar-state'
import { cn } from '@/lib/utils'

// AdminSection type is imported from AdminSidebar to keep a single source of truth

export default function AdminDashboard() {
  const [activeSection, setActiveSection] = useState<AdminSection>('users')
  const sidebarState = useAdminSidebarState()

  const renderContent = () => {
    switch (activeSection) {
      case 'users':
        return <UserManagement />
      case 'library':
        return <LibraryManagement />
      case 'coupons':
        return <CouponManagement />
      case 'redeem':
        return <RedeemCodeManager />
      case 'notifications':
        return <NotificationsManagement />
      default:
        return <UserManagement />
    }
  }

  const getSectionTitle = () => {
    switch (activeSection) {
      case 'users':
        return 'Quản lý User'
      case 'library':
        return 'Quản lý Thư viện'
      case 'coupons':
        return 'Quản lý Mã giảm giá'
      case 'redeem':
        return 'Quản lý Redeem Code'
      case 'notifications':
        return 'Quản lý Thông báo'
      default:
        return 'Quản lý User'
    }
  }

  const getBreadcrumb = () => {
    switch (activeSection) {
      case 'users':
        return ['Admin Dashboard', 'Quản lý User']
      case 'library':
        return ['Admin Dashboard', 'Quản lý Thư viện']
      case 'coupons':
        return ['Admin Dashboard', 'Quản lý Mã giảm giá']
      case 'redeem':
        return ['Admin Dashboard', 'Quản lý Redeem Code']
      case 'notifications':
        return ['Admin Dashboard', 'Quản lý Thông báo']
      default:
        return ['Admin Dashboard', 'Quản lý User']
    }
  }

  return (
    <AdminProtectedRoute>
      <div className="min-h-screen bg-background">
        {/* Sidebar - Always render for mobile overlay, conditionally for desktop */}
        <AdminSidebar
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          isOpen={sidebarState.isSidebarOpen}
          onToggle={sidebarState.handleSidebarToggle}
          isLargeScreen={sidebarState.isLargeScreen}
        />

        {/* Main Content Area with responsive margin */}
        <div className={cn(
          "min-h-screen transition-all duration-300 ease-in-out",
          // Desktop: Add left margin when sidebar is open
          sidebarState.isLargeScreen && sidebarState.isSidebarOpen ? "ml-80" : "ml-0",
          // Mobile: No margin (overlay mode)
          !sidebarState.isLargeScreen ? "ml-0" : ""
        )}>
          <div className="app-container app-section">
            <div className="app-content">
              {/* Main Content */}
              <div className="w-full">
                <AdminHeader
                  title={getSectionTitle()}
                  breadcrumb={getBreadcrumb()}
                  onToggleSidebar={sidebarState.handleSidebarToggle}
                  isSidebarOpen={sidebarState.isSidebarOpen}
                  isLargeScreen={sidebarState.isLargeScreen}
                />

                <div className="mt-6">
                  {renderContent()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminProtectedRoute>
  )
}

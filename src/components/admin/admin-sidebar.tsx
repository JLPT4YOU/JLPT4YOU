"use client"

import { Users, Shield, Library, PanelLeft, Ticket, Gift, Bell } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

export type AdminSection = 'users' | 'library' | 'coupons' | 'redeem' | 'notifications'

interface AdminSidebarProps {
  activeSection: AdminSection
  onSectionChange: (section: AdminSection) => void
  isOpen: boolean
  onToggle: () => void
  isLargeScreen?: boolean
}

interface SidebarItem {
  id: AdminSection
  label: string
  icon: React.ComponentType<{ className?: string }>
  description: string
}

const sidebarItems: SidebarItem[] = [
  {
    id: 'users',
    label: 'Quản lý User',
    icon: Users,
    description: 'Quản lý tài khoản người dùng, phân quyền và trạng thái'
  },
  {
    id: 'library',
    label: 'Quản lý Thư viện',
    icon: Library,
    description: 'Upload và quản lý PDF, sách trong thư viện'
  },
  {
    id: 'coupons',
    label: 'Quản lý Mã giảm giá',
    icon: Ticket,
    description: 'Tạo và quản lý mã giảm giá, khuyến mãi'
  },
  {
    id: 'redeem',
    label: 'Quản lý Redeem Code',
    icon: Gift,
    description: 'Tạo và quản lý mã redeem Premium cho người dùng'
  },
  {
    id: 'notifications',
    label: 'Thông báo',
    icon: Shield, // keep monochrome icons set; using Shield to match admin theme
    description: 'Gửi thông báo và quản lý danh sách đã gửi'
  }
]

export function AdminSidebar({
  activeSection,
  onSectionChange,
  isOpen,
  onToggle,
  isLargeScreen = false
}: AdminSidebarProps) {
  return (
    <>
      {/* Backdrop for mobile overlay mode - below header */}
      {isOpen && !isLargeScreen && (
        <div
          className="fixed left-0 right-0 bottom-0 top-16 bg-black/50 z-[90]"
          onClick={onToggle}
        />
      )}

      {/* Sidebar Container - Fixed positioned below header, lower z-index than header */}
      <div className={cn(
        "fixed left-0 z-[90] w-80 bg-background border-r border-border flex flex-col",
        "transition-transform duration-300 ease-in-out",
        // Start below header - header is sticky with h-12 + padding ≈ 64px
        "top-16 bottom-0",
        // Desktop mode: subtle shadow
        isLargeScreen ? [
          "shadow-sm",
          isOpen ? "translate-x-0" : "-translate-x-full"
        ] : [
          // Mobile mode: overlay with strong shadow
          "shadow-lg",
          isOpen ? "translate-x-0" : "-translate-x-full"
        ]
      )}>
        <div className="bg-muted/20 rounded-2xl p-6 m-4 flex-1 overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-foreground" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">Admin Dashboard</h2>
                <p className="text-xs text-muted-foreground">Quản trị hệ thống</p>
              </div>
            </div>

            {/* Toggle Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              className="text-foreground hover:bg-muted/50 transition-colors duration-200 flex items-center justify-center w-10 h-10 p-0 m-0 rounded-md"
              title={isLargeScreen ? 'Đóng sidebar' : 'Đóng'}
            >
              <PanelLeft className="w-4 h-4" />
            </Button>
          </div>

      {/* Navigation */}
      <nav className="space-y-2">
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
          Quản lý
        </h3>
        
        {sidebarItems.map((item) => {
          const IconComponent = item.icon
          const isActive = activeSection === item.id
          
          return (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={cn(
                "w-full text-left p-4 rounded-xl transition-all duration-200 group",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "hover:bg-muted/50 text-foreground"
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

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-border/50">
            <div className="text-xs text-muted-foreground">
              <p className="font-medium mb-1">JLPT4YOU Admin</p>
              <p>Phiên bản 1.0.0</p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

"use client"

import { ChevronRight, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AdminHeaderProps {
  title: string
  breadcrumb: string[]
  onToggleSidebar?: () => void
  isSidebarOpen?: boolean
  isLargeScreen?: boolean
}

export function AdminHeader({
  title,
  breadcrumb,
  onToggleSidebar,
  isSidebarOpen = false,
  isLargeScreen = false
}: AdminHeaderProps) {
  return (
    <div className="bg-background border-b border-border/50 pb-6">
      {/* Top bar with toggle button and breadcrumb */}
      <div className="flex items-center justify-between mb-4">
        {/* Left side: Toggle button + Breadcrumb */}
        <div className="flex items-center gap-4">
          {/* Toggle Button - Show when sidebar is closed or on mobile */}
          {onToggleSidebar && (!isSidebarOpen || !isLargeScreen) && (
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleSidebar}
              className="bg-muted/30 focus-ring"
              title="Mở sidebar"
            >
              <Menu className="w-4 h-4 text-foreground" />
            </Button>
          )}

          {/* Breadcrumb */}
          <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
            {breadcrumb.map((item, index) => (
              <div key={index} className="flex items-center">
                {index > 0 && <ChevronRight className="w-4 h-4 mx-2" />}
                <span className={index === breadcrumb.length - 1 ? 'text-foreground font-medium' : ''}>
                  {item}
                </span>
              </div>
            ))}
          </nav>
        </div>
      </div>

      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          <p className="text-muted-foreground mt-1">
            Quản lý và theo dõi thông tin hệ thống
          </p>
        </div>
      </div>
    </div>
  )
}

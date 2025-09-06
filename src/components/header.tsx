"use client"

import { GraduationCap, LogOut, Settings, BarChart3, Home, Infinity, Shield } from "lucide-react"
import { getIconComponent } from "@/components/settings/icon-selector"
import { getRoleClasses, getExpiryDisplayText, getExpiryTextColor, getUserBalanceDisplay } from '@/lib/role-utils'
import { useAuth } from "@/contexts/auth-context"
import { useUserData } from '@/hooks/use-user-data' // ✅ ADDED: Import user data hook
import { useEffect, useState } from 'react'
import { useRouter } from "next/navigation"
import { getLoginUrl } from '@/lib/auth-utils'
import { ThemeToggle } from "@/components/theme-toggle"
import { LanguageSwitcher } from "@/components/language-switcher"
import { Button } from "@/components/ui/button"
import { useNavigationProtection } from "@/components/anti-cheat-system"
import NotificationButton from "@/components/notifications/NotificationButton"

import { useTranslations } from "@/hooks/use-translations"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Protected Link Component that respects navigation protection
interface ProtectedLinkProps {
  href: string
  children: React.ReactNode
  className?: string
}

function ProtectedLink({ href, children, className }: ProtectedLinkProps) {
  const router = useRouter()
  const { interceptNavigation } = useNavigationProtection()

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    interceptNavigation(() => {
      router.push(href)
    })
  }

  return (
    <a href={href} onClick={handleClick} className={className}>
      {children}
    </a>
  )
}

export function Header() {
  const { user, signOut } = useAuth() // Auth user (basic info)
  const { userData, loading: userDataLoading } = useUserData() // Full user data from public.users
  const [balanceDisplay, setBalanceDisplay] = useState<string>('')

  // Fetch user balance for display
  useEffect(() => {
    if (user?.id) {
      getUserBalanceDisplay(user.id).then(setBalanceDisplay)
    }
  }, [user?.id])

  const router = useRouter()

  // Use language context for consistent translations
  const { translations, t, language } = useTranslations()

  const handleLogout = async () => {
    await signOut() // ✅ FIXED: Use signOut instead of logout
    router.push(getLoginUrl()) // Use dynamic language-aware auth URL
  }

  const handleGoHome = () => {
    router.push(homeUrl)
  }

  const handleGoSettings = () => {
    router.push('/settings')
  }

  const handleGoAdmin = () => {
    router.push('/admin')
  }

  // Use clean URL for authenticated users
  const homeUrl = `/home`

  // Helper function for getting text with fallback
  const getText = (key: string, fallback: string) => t ? t(key) : fallback

  return (
    <header className="sticky top-0 z-[100] w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="app-container app-py-sm">
        <div className="app-content max-w-6xl">
          <div className="flex h-12 items-center justify-between">
            {/* Logo và tên ứng dụng */}
            <ProtectedLink href={homeUrl} className="flex items-center gap-2 hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-md">
              <div className="flex items-center justify-center w-8 h-8 rounded-md bg-muted">
                <GraduationCap className="h-5 w-5 text-foreground" />
              </div>
              <div className="flex items-center gap-1">
                <h1 className="text-xl font-bold primary text-foreground">JLPT4YOU</h1>
              </div>
            </ProtectedLink>

            {/* Language Switcher, Theme toggle và User menu */}
            <nav className="hidden md:flex items-center gap-4">
              {/* Language Switcher */}
              {translations && (
                <LanguageSwitcher
                  variant="compact"
                />
              )}

              {/* Theme Toggle */}
              <ThemeToggle />

              {/* Notification Button - Only show if user is authenticated */}
              {user && <NotificationButton />}

              {/* User Dropdown Menu - Only show if user is authenticated */}
              {user && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 bg-background/80 border border-border/50 text-foreground hover-brightness-light focus-button"
                    >
                      {(() => {
                        const AvatarIcon = getIconComponent(userData?.avatar_icon || undefined)
                        return <AvatarIcon className="h-5 w-5 text-foreground" />
                      })()}
                      <span className="sr-only">{getText('header.userMenu.screenReader', 'Menu người dùng')}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        <p className="font-medium">{userData?.name || user?.email?.split('@')[0] || 'User'}</p>
                        <p className="w-[200px] truncate text-sm text-muted-foreground">
                          {user?.email}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          <span className={getRoleClasses(userData?.role as any)}>
                            {userData?.role || 'Free'}
                          </span>
                          {(() => {
                            const expiryText = getExpiryDisplayText(userData?.role as any, userData?.subscription_expires_at)
                            const expiryColor = getExpiryTextColor(userData?.role as any, userData?.subscription_expires_at)

                            if (expiryText === 'unlimited') {
                              return (
                                <div className={`flex items-center gap-2 text-sm ${expiryColor}`}>
                                  <span>{getText('header.userMenu.expiryDate', 'Hạn sử dụng')}:</span>
                                  <Infinity className="w-5 h-5 flex-shrink-0 mt-1" />
                                </div>
                              )
                            }

                            if (expiryText) {
                              return (
                                <span className={`text-sm ${expiryColor}`}>
                                  {expiryText}
                                </span>
                              )
                            }
                            return null
                          })()}
                        </div>
                        {balanceDisplay && (
                          <div className="text-sm text-green-600 font-bold mt-2">
                            {balanceDisplay}
                          </div>
                        )}
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    {userData?.role === 'Admin' && ( // Only Admin users have admin access
                      <DropdownMenuItem onClick={handleGoAdmin}>
                        <Shield className="mr-2 h-4 w-4" />
                        Admin Dashboard
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={handleGoHome}>
                      <Home className="mr-2 h-4 w-4" />
                      {getText('header.userMenu.home', 'Home')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleGoSettings}>
                      <Settings className="mr-2 h-4 w-4" />
                      {getText('header.userMenu.settings', 'Cài đặt')}
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <BarChart3 className="mr-2 h-4 w-4" />
                      {getText('header.userMenu.statistics', 'Thống kê học tập')}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={handleLogout}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      {getText('header.userMenu.logout', 'Đăng xuất')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </nav>

            {/* Mobile menu */}
            <div className="flex md:hidden items-center gap-2">
              {translations && (
                <LanguageSwitcher
                  variant="compact"
                />
              )}
              <ThemeToggle />
              {user && <NotificationButton />}

              {/* User Dropdown Menu - Mobile version */}
              {user && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 bg-background/80 border border-border/50 text-foreground hover-brightness-light focus-button"
                    >
                      {(() => {
                        const AvatarIcon = getIconComponent(userData?.avatar_icon || undefined)
                        return <AvatarIcon className="h-5 w-5 text-foreground" />
                      })()}
                      <span className="sr-only">{getText('header.userMenu.screenReader', 'Menu người dùng')}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        <p className="font-medium">{userData?.name || user?.email?.split('@')[0] || 'User'}</p>
                        <p className="w-[200px] truncate text-sm text-muted-foreground">
                          {user?.email}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          <span className={getRoleClasses(userData?.role as any)}>
                            {userData?.role || 'Free'}
                          </span>
                          {(() => {
                            const expiryText = getExpiryDisplayText(userData?.role as any, userData?.subscription_expires_at)
                            const expiryColor = getExpiryTextColor(userData?.role as any, userData?.subscription_expires_at)

                            if (expiryText === 'unlimited') {
                              return (
                                <div className={`flex items-center gap-2 text-sm ${expiryColor}`}>
                                  <span>{getText('header.userMenu.expiryDate', 'Hạn sử dụng')}:</span>
                                  <Infinity className="w-5 h-5 flex-shrink-0 mt-1" />
                                </div>
                              )
                            }

                            if (expiryText) {
                              return (
                                <span className={`text-sm ${expiryColor}`}>
                                  {expiryText}
                                </span>
                              )
                            }
                            return null
                          })()}
                        </div>
                        {balanceDisplay && (
                          <div className="text-sm text-green-600 font-bold mt-2">
                            {balanceDisplay}
                          </div>
                        )}
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    {userData?.role === 'Admin' && ( // Only Admin users have admin access
                      <DropdownMenuItem onClick={handleGoAdmin}>
                        <Shield className="mr-2 h-4 w-4" />
                        Admin Dashboard
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={handleGoHome}>
                      <Home className="mr-2 h-4 w-4" />
                      {getText('header.userMenu.home', 'Home')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleGoSettings}>
                      <Settings className="mr-2 h-4 w-4" />
                      {getText('header.userMenu.settings', 'Cài đặt')}
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <BarChart3 className="mr-2 h-4 w-4" />
                      {getText('header.userMenu.statistics', 'Thống kê học tập')}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={handleLogout}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      {getText('header.userMenu.logout', 'Đăng xuất')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

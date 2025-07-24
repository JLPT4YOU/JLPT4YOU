"use client"

import { GraduationCap, User, LogOut, Settings, BarChart3 } from "lucide-react"
import { getIconComponent } from "@/components/settings/icon-selector"

import { useRouter, usePathname } from "next/navigation"
import { ThemeToggle } from "@/components/theme-toggle"
import { LanguageSwitcher } from "@/components/language-switcher"
import { Button } from "@/components/ui/button"
import { useNavigationProtection } from "@/components/anti-cheat-system"
import { useAuth } from "@/contexts/auth-context"
import { getLanguageFromPath, DEFAULT_LANGUAGE } from "@/lib/i18n"
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
  const { user, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  
  // Use the new enhanced translations hook
  const { translations, t, language, isLoading } = useTranslations()

  const handleLogout = () => {
    logout()
    router.push('/auth/vn/login')
  }

  // Get current language for dynamic links
  const currentLanguage = language
  const homeUrl = `/${currentLanguage}/home`

  // Helper function for getting text with fallback
  const getText = (key: string, fallback: string) => t ? t(key) : fallback

  return (
    <header className="sticky top-0 z-[100] w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="app-container app-py-md">
        <div className="app-content">
          <div className="flex h-12 items-center justify-between">
            {/* Logo và tên ứng dụng */}
            <ProtectedLink href={homeUrl} className="flex items-center app-gap-sm hover-opacity focus-ring rounded-md">
              <div className="flex items-center justify-center w-8 h-8 rounded-md bg-muted">
                <GraduationCap className="h-5 w-5 text-foreground" />
              </div>
              <h1 className="text-xl heading-primary text-foreground">JLPT4YOU</h1>
            </ProtectedLink>

            {/* Language Switcher, Theme toggle và User menu */}
            <div className="flex items-center app-gap-xs">
              {/* Language Switcher */}
              {translations && (
                <LanguageSwitcher
                  translations={translations}
                  variant="compact"
                />
              )}

              {/* Theme Toggle */}
              <ThemeToggle />

              {/* User Dropdown Menu - Only show if user is authenticated */}
              {user && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 bg-background/80 border border-border/50 text-foreground hover-brightness-light focus-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      {(() => {
                        const AvatarIcon = getIconComponent(user.avatarIcon || undefined)
                        return <AvatarIcon className="h-5 w-5 text-foreground" />
                      })()}
                      <span className="sr-only">Menu người dùng</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="flex items-center justify-start gap-2 app-p-sm">
                      <div className="flex flex-col app-space-xs leading-none">
<p className="font-medium">{user.name}</p>
                        <p className="w-[200px] truncate text-sm text-muted-foreground">
                          {user.email}
                        </p>
                        <div className="flex items-center app-gap-xs mt-1">
                          <span className="inline-flex items-center app-px-xs app-py-xs rounded-full text-xs font-medium bg-primary/10 text-primary">
                            {user.role}
                          </span>
                          {user.expiryDate && (
                            <span className="text-xs text-muted-foreground">
                              {getText('header.userMenu.expiryDate', 'đến')} {user.expiryDate}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <Settings className="mr-2 h-4 w-4" />
                      {getText('header.userMenu.profile', 'Hồ sơ cá nhân')}
                    </DropdownMenuItem>
                    <DropdownMenuItem>
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

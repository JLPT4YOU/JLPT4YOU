/**
 * Chat Header Component
 * Handles navigation, user dropdown, and header actions
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Menu, User, Home, Settings } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useTranslations } from '@/hooks/use-translations';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface ChatHeaderProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  onShowSettings: () => void;
  className?: string;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  isSidebarOpen,
  onToggleSidebar,
  onShowSettings,
  className
}) => {
  // Dependencies
  const { user, logout } = useAuth();
  const router = useRouter();
  const { t } = useTranslations();

  // Navigation handlers
  const handleGoHome = () => {
    router.push('/home');
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/auth/vn');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <header className={cn(
      "sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
      className
    )}>
      <div className="app-container flex h-14 items-center">
        {/* Left side - Menu toggle */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleSidebar}
            className="h-9 w-9 p-0"
            aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
          >
            <Menu className="h-4 w-4" />
          </Button>
          
          {/* Logo/Title */}
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold">iRIN Sensei</h1>
          </div>
        </div>

        {/* Right side - User dropdown */}
        <div className="ml-auto flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                <User className="h-4 w-4" />
                <span className="sr-only">User menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {/* User info */}
              {user && (
                <>
                  <div className="px-2 py-1.5 text-sm">
                    <div className="font-medium">{user.email}</div>
                    <div className="text-muted-foreground text-xs">
                      {user.displayName || 'User'}
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                </>
              )}
              
              {/* Navigation items */}
              <DropdownMenuItem onClick={handleGoHome}>
                <Home className="mr-2 h-4 w-4" />
                {t ? t('chat.navigation.home') : 'Home'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onShowSettings}>
                <Settings className="mr-2 h-4 w-4" />
                {t ? t('chat.navigation.settings') : 'Settings'}
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              {/* Logout */}
              <DropdownMenuItem onClick={handleLogout}>
                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                {t ? t('auth.logout') : 'Logout'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

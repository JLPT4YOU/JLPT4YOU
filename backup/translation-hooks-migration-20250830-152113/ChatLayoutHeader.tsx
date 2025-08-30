import React, { memo, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { PanelRight, Edit, User, Home, Settings } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context-simple';
import { useUserData } from '@/hooks/use-user-data'; // ✅ ADDED: Import user data hook
import { useRouter } from 'next/navigation';
import { useTranslations } from '@/hooks/use-translations';
import { HeaderModelSelector } from './HeaderModelSelector';
import { ProviderSelector } from './ProviderSelector';
import { type ProviderType } from '@/lib/ai-provider-manager';
import { getIconComponent } from '@/components/settings/icon-selector';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface AIModel {
  id: string;
  name: string;
  description: string;
  color: string;
  provider: string;
  category: string;
  supportsStreaming: boolean;
  supportsFiles: boolean;
  supportsTTS: boolean;
}

interface ChatLayoutHeaderProps {
  // Sidebar state
  isSidebarOpen: boolean;
  isLargeScreen: boolean;
  onSidebarToggle: () => void;
  
  // Provider and model state
  currentProvider: ProviderType;
  selectedModel: string;
  aiModels: AIModel[];
  onProviderChange: (provider: ProviderType) => void;
  onModelChange: (model: string) => void;
  onConfigureProvider: () => void;
  
  // Navigation
  onNewChat: () => void;
  onGoHome: () => void;
  onShowSettings: () => void;
}

const ChatLayoutHeaderComponent: React.FC<ChatLayoutHeaderProps> = ({
  isSidebarOpen,
  isLargeScreen,
  onSidebarToggle,
  currentProvider,
  selectedModel,
  aiModels,
  onProviderChange,
  onModelChange,
  onConfigureProvider,
  onNewChat,
  onGoHome,
  onShowSettings
}) => {
  const { user } = useAuth();
  const { userData } = useUserData(); // ✅ ADDED: Get user data
  const { t } = useTranslations();

  // ✅ FIXED: Use userData for profile information
  const displayUser = {
    name: userData?.name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'User',
    email: user?.email || '',
    avatarIcon: userData?.avatar_icon || 'User'
  };

  // Memoize menu button visibility
  const showMenuButton = useMemo(() => {
    return !isSidebarOpen || !isLargeScreen;
  }, [isSidebarOpen, isLargeScreen]);

  return (
    <div className="flex items-center justify-between px-4 sm:px-6 py-5 bg-background/95 backdrop-blur-sm">
      <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
        {/* Sidebar Toggle & New Chat - Close together */}
        <div className="flex items-center gap-0">
          {/* Menu Button - Only show when sidebar is closed on desktop, always show on mobile */}
          {showMenuButton && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onSidebarToggle}
              className="h-10 w-10 p-0 text-foreground hover:bg-accent transition-opacity duration-300 translate-y-[-1px]"
            >
              <PanelRight className="w-4 h-4" />
            </Button>
          )}

          {/* New Chat Button - Only show when sidebar is closed on desktop, always show on mobile */}
          {showMenuButton && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onNewChat}
              className="h-10 w-10 p-0 text-foreground hover:bg-accent transition-opacity duration-300"
              aria-label="New Chat"
            >
              <Edit className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Provider & Model Selection - Constrained width */}
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          <ProviderSelector
            onProviderChange={onProviderChange}
            onConfigureProvider={onConfigureProvider}
          />

          <HeaderModelSelector
            selectedModel={selectedModel}
            availableModels={aiModels}
            onModelChange={onModelChange}
            className="max-w-[100px] sm:max-w-[140px] md:max-w-none"
          />
        </div>
      </div>

      {/* User Dropdown - Always visible */}
      {user && (
        <div className="flex-shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <User className="h-5 w-5" />
                <span className="sr-only">User menu</span>
              </Button>
            </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            {/* User Info */}
            <div className="flex items-center justify-start gap-3 p-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                {(() => {
                  const AvatarIcon = getIconComponent(displayUser.avatarIcon || undefined) // ✅ FIXED
                  return <AvatarIcon className="w-5 h-5 text-primary" />
                })()}
              </div>
              <div className="flex flex-col space-y-1 leading-none">
                <p className="font-medium text-sm">{displayUser.name}</p> {/* ✅ FIXED */}
                <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                  {displayUser.email} {/* ✅ FIXED */}
                </p>
              </div>
            </div>
            <DropdownMenuSeparator />

            {/* Navigation Items */}
            <DropdownMenuItem onClick={onGoHome}>
              <Home className="mr-2 h-4 w-4" />
              {t ? t('chat.navigation.home') : 'Home'}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onShowSettings}>
              <Settings className="mr-2 h-4 w-4" />
              {t ? t('chat.navigation.settings') : 'Settings'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        </div>
      )}
    </div>
  );
};

// Memoize the component to prevent unnecessary re-renders
export const ChatLayoutHeader = memo(ChatLayoutHeaderComponent, (prevProps, nextProps) => {
  // Only re-render when these props change
  return (
    prevProps.isSidebarOpen === nextProps.isSidebarOpen &&
    prevProps.isLargeScreen === nextProps.isLargeScreen &&
    prevProps.currentProvider === nextProps.currentProvider &&
    prevProps.selectedModel === nextProps.selectedModel &&
    // For aiModels, we only care if the array reference changed
    prevProps.aiModels === nextProps.aiModels
  );
});

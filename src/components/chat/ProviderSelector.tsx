"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Bot, 
  ChevronDown, 
  Check, 
  Zap, 
  Brain,
  Settings,
  Key
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getAIProviderManager, type ProviderType, type ProviderConfig } from '@/lib/ai-provider-manager';
import { useTranslations } from '@/hooks/use-translations';

interface ProviderSelectorProps {
  className?: string;
  onProviderChange?: (provider: ProviderType) => void;
  onConfigureProvider?: (provider: ProviderType) => void;
  showConfigButton?: boolean;
}

export const ProviderSelector: React.FC<ProviderSelectorProps> = ({
  className,
  onProviderChange,
  onConfigureProvider,
  showConfigButton = true
}) => {
  const { t } = useTranslations();
  const [currentProvider, setCurrentProvider] = useState<ProviderType>('gemini');
  const [providerConfigs, setProviderConfigs] = useState<ProviderConfig[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const aiProviderManager = getAIProviderManager();

  // Load current provider and configs
  useEffect(() => {
    const loadProviderData = () => {
      const current = aiProviderManager.getCurrentProvider();
      const configs = aiProviderManager.getProviderConfigs();
      
      setCurrentProvider(current);
      setProviderConfigs(configs);
    };

    loadProviderData();

    // Re-load configs whenever a provider gets configured from settings
    window.addEventListener('ai-provider-config-changed', loadProviderData);
    return () => {
      window.removeEventListener('ai-provider-config-changed', loadProviderData);
    };
  }, []);

  const handleProviderSwitch = (provider: ProviderType) => {
    try {
      aiProviderManager.switchProvider(provider);
      setCurrentProvider(provider);
      onProviderChange?.(provider);
      setIsOpen(false);
      // Remove focus from button after selection
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    } catch (error) {
      console.error('Failed to switch provider:', error);
    }
  };

  const handleConfigureProvider = (provider: ProviderType, event: React.MouseEvent) => {
    event.stopPropagation();
    // Close dropdown immediately before triggering popup
    setIsOpen(false);
    // Use setTimeout to ensure dropdown closes before popup opens
    setTimeout(() => {
      try {
        onConfigureProvider?.(provider);
      } catch (error) {
        console.error('Error configuring provider:', error);
        // Dropdown is already closed, so error won't affect UI state
      }
    }, 100);
  };

  const getProviderIcon = (provider: ProviderType) => {
    switch (provider) {
      case 'gemini':
        return <Brain className="h-4 w-4" />;
      case 'groq':
        return <Zap className="h-4 w-4" />;
      default:
        return <Bot className="h-4 w-4" />;
    }
  };

  const getProviderDisplayName = (provider: ProviderType) => {
    switch (provider) {
      case 'gemini':
        return 'Google Gemini';
      case 'groq':
        return 'Groq (Llama)';
      default:
        return provider;
    }
  };

  const getProviderShortName = (provider: ProviderType) => {
    switch (provider) {
      case 'gemini':
        return 'Google';
      case 'groq':
        return 'Groq';
      default:
        return provider;
    }
  };

  const getProviderDescription = (provider: ProviderType) => {
    switch (provider) {
      case 'gemini':
        return 'Advanced AI with thinking mode, file support';
      case 'groq':
        return 'Ultra-fast inference, cost-effective';
      default:
        return '';
    }
  };

  const currentConfig = providerConfigs.find(config => config.type === currentProvider);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-2 px-3 text-xs font-medium text-foreground"
          >
            {getProviderIcon(currentProvider)}
            <span className="sm:hidden truncate">
              {getProviderShortName(currentProvider)}
            </span>
            <span className="hidden sm:inline truncate">
              {getProviderDisplayName(currentProvider)}
            </span>
            {/* Status badge - only show on desktop */}
            {currentConfig?.isConfigured ? (
              <Badge variant="secondary" className="hidden sm:inline-flex h-4 px-1 text-[10px]">
                Ready
              </Badge>
            ) : (
              <Badge variant="destructive" className="hidden sm:inline-flex h-4 px-1 text-[10px]">
                Setup
              </Badge>
            )}
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="w-72 sm:w-80 max-w-[90vw]">
          <div className="p-2">
            <div className="text-sm font-medium mb-2">AI Providers</div>
            <div className="text-xs text-muted-foreground mb-3">
              Choose your preferred AI provider
            </div>
          </div>

          {providerConfigs.map((config) => (
            <DropdownMenuItem
              key={config.type}
              className="flex items-center justify-between p-3 cursor-pointer"
              onClick={() => handleProviderSwitch(config.type)}
            >
              <div className="flex items-center gap-3 flex-1">
                {getProviderIcon(config.type)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-xs sm:text-sm leading-tight break-words flex-1">
                      {getProviderDisplayName(config.type)}
                    </span>
                    {currentProvider === config.type && (
                      <Check className="h-4 w-4 text-primary flex-shrink-0" />
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground leading-relaxed whitespace-normal break-words">
                    {getProviderDescription(config.type)}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {config.isConfigured ? (
                  <Badge variant="secondary" className="h-5 px-2 text-[10px]">
                    Ready
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="h-5 px-2 text-[10px]">
                    Setup Required
                  </Badge>
                )}

                {showConfigButton && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={(e) => handleConfigureProvider(config.type, e)}
                  >
                    {config.isConfigured ? (
                      <Settings className="h-3 w-3" />
                    ) : (
                      <Key className="h-3 w-3" />
                    )}
                  </Button>
                )}
              </div>
            </DropdownMenuItem>
          ))}

          <DropdownMenuSeparator />
          
          <div className="p-2">
            <div className="text-xs text-muted-foreground">
              💡 Tip: Each provider has different strengths. Gemini supports files and thinking mode, while Groq offers ultra-fast responses.
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

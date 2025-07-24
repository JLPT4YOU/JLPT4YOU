"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Settings,
  Moon,
  Sun,
  MessageSquare,
  Trash2,
  Key,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  AlertCircle,
  Wand2
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useTranslations } from '@/hooks/use-translations';
import { getGeminiService } from '@/lib/gemini-service';
import { getAIProviderManager, type ProviderType } from '@/lib/ai-provider-manager';
import { PromptSettings } from './PromptSettings';
import { hasCustomPrompt } from '@/lib/prompt-storage';
import { getAvailableModels, GEMINI_MODEL_INFO } from '@/lib/gemini-config';
import { cn } from '@/lib/utils';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';

interface UnifiedSettingsProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onClearHistory?: () => void;
  selectedModel?: string;
  onModelChange?: (model: string) => void;
  defaultTab?: string;
}

export const UnifiedSettings: React.FC<UnifiedSettingsProps> = ({
  isOpen,
  onOpenChange,
  onClearHistory,
  selectedModel,
  onModelChange,
  defaultTab = "general"
}) => {
  // Multi-provider API key states
  const [apiKeys, setApiKeys] = useState<Record<ProviderType, string>>({
    gemini: '',
    groq: ''
  });
  const [showApiKeys, setShowApiKeys] = useState<Record<ProviderType, boolean>>({
    gemini: false,
    groq: false
  });
  const [isValidatingKeys, setIsValidatingKeys] = useState<Record<ProviderType, boolean>>({
    gemini: false,
    groq: false
  });
  const [keyValidationStatus, setKeyValidationStatus] = useState<Record<ProviderType, 'idle' | 'valid' | 'invalid'>>({
    gemini: 'idle',
    groq: 'idle'
  });

  const [isSaving, setIsSaving] = useState(false);
  const [showSavedMessage, setShowSavedMessage] = useState(false);
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large' | 'extraLarge'>('medium');
  const { theme, setTheme } = useTheme();
  const { t } = useTranslations();
  const [mounted, setMounted] = useState(false);
  const [showClearHistoryDialog, setShowClearHistoryDialog] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
    // Load saved settings
    const savedGeminiKey = localStorage.getItem('gemini_api_key') || '';
    const savedGroqKey = localStorage.getItem('groq_api_key') || '';
    const savedFontSize = localStorage.getItem('chat_font_size') as 'small' | 'medium' | 'large' | 'extraLarge';

    setApiKeys({
      gemini: savedGeminiKey,
      groq: savedGroqKey
    });

    if (savedFontSize && ['small', 'medium', 'large', 'extraLarge'].includes(savedFontSize)) {
      setFontSize(savedFontSize);
    }

    // Note: Removed automatic API key validation on mount to prevent unnecessary network requests
    // API keys will be validated only when user manually tests them or when actually needed
  }, []);

  // Apply font size when component mounts or fontSize changes
  useEffect(() => {
    if (mounted) {
      const fontSizeMap = {
        small: '14px',
        medium: '16px',
        large: '18px',
        extraLarge: '20px'
      };
      const root = document.documentElement;
      root.style.setProperty('--chat-font-size', fontSizeMap[fontSize]);
    }
  }, [mounted, fontSize]);



  const handleApiKeyChange = (provider: ProviderType, key: string) => {
    setApiKeys(prev => ({ ...prev, [provider]: key }));
    setKeyValidationStatus(prev => ({ ...prev, [provider]: 'idle' }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Save all API keys to localStorage
      localStorage.setItem('gemini_api_key', apiKeys.gemini);
      localStorage.setItem('groq_api_key', apiKeys.groq);

      // Configure providers with API keys
      const aiProviderManager = getAIProviderManager();

      if (apiKeys.gemini.trim()) {
        aiProviderManager.configureProvider('gemini', apiKeys.gemini);
      }

      if (apiKeys.groq.trim()) {
        aiProviderManager.configureProvider('groq', apiKeys.groq);
      }

      // Show success message
      setShowSavedMessage(true);
      setTimeout(() => setShowSavedMessage(false), 2000);
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const validateApiKey = async (provider: ProviderType, key: string) => {
    if (!key.trim()) {
      setKeyValidationStatus(prev => ({ ...prev, [provider]: 'idle' }));
      return;
    }

    setIsValidatingKeys(prev => ({ ...prev, [provider]: true }));
    try {
      const aiProviderManager = getAIProviderManager();
      const isValid = await aiProviderManager.validateApiKey(provider, key);
      setKeyValidationStatus(prev => ({ ...prev, [provider]: isValid ? 'valid' : 'invalid' }));
    } catch (error) {
      console.error(`${provider} API key validation error:`, error);
      setKeyValidationStatus(prev => ({ ...prev, [provider]: 'invalid' }));
    } finally {
      setIsValidatingKeys(prev => ({ ...prev, [provider]: false }));
    }
  };

  const handleValidateKey = (provider: ProviderType) => {
    validateApiKey(provider, apiKeys[provider]);
  };

  const handleClearHistory = () => {
    setShowClearHistoryDialog(true);
  };

  const handleConfirmClearHistory = () => {
    localStorage.removeItem('chat_history');
    onClearHistory?.();
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const handleFontSizeChange = (newSize: 'small' | 'medium' | 'large' | 'extraLarge') => {
    setFontSize(newSize);
    localStorage.setItem('chat_font_size', newSize);

    // Apply font size to chat messages immediately
    const root = document.documentElement;
    const fontSizeMap = {
      small: '14px',
      medium: '16px',
      large: '18px',
      extraLarge: '20px'
    };
    root.style.setProperty('--chat-font-size', fontSizeMap[newSize]);
  };

  const getKeyValidationIcon = (provider: ProviderType) => {
    if (isValidatingKeys[provider]) {
      return <AlertCircle className="h-4 w-4 text-yellow-500 animate-spin" />;
    }
    switch (keyValidationStatus[provider]) {
      case 'valid':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'invalid':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getKeyValidationMessage = (provider: ProviderType) => {
    if (isValidatingKeys[provider]) return 'Validating API key...';
    switch (keyValidationStatus[provider]) {
      case 'valid':
        return 'API key is valid';
      case 'invalid':
        return 'Invalid API key';
      default:
        return '';
    }
  };

  const getProviderInfo = (provider: ProviderType) => {
    switch (provider) {
      case 'gemini':
        return {
          name: 'Google Gemini',
          description: 'Advanced AI with thinking mode, file support',
          placeholder: 'Enter your Gemini API key (AIza...)',
          getKeyUrl: 'https://aistudio.google.com/app/apikey',
          icon: '🧠'
        };
      case 'groq':
        return {
          name: 'Groq (Llama)',
          description: 'Ultra-fast inference, cost-effective',
          placeholder: 'Enter your Groq API key (gsk_...)',
          getKeyUrl: 'https://console.groq.com/keys',
          icon: '⚡'
        };
      default:
        return null;
    }
  };

  if (!mounted) {
    return null;
  }

  const availableModels = getAvailableModels();

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-2xl max-h-[80vh] overflow-y-auto"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            {t ? t('chat.settings.title') : 'iRIN Settings'}
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">{t ? t('settings.tabs.general') : 'Chung'}</TabsTrigger>
            <TabsTrigger value="prompts" className="relative">
              {t ? t('settings.tabs.prompts') : 'Prompts'}
              {hasCustomPrompt() && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full" />
              )}
            </TabsTrigger>
            <TabsTrigger value="api">{t ? t('settings.tabs.api') : 'API Keys'}</TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t ? t('settings.appearance.title') : 'Giao diện'}</CardTitle>
                <CardDescription>{t ? t('settings.appearance.description') : 'Tùy chỉnh giao diện của iRIN'}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Theme Toggle */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {theme === 'dark' ? (
                      <Moon className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Sun className="h-4 w-4 text-muted-foreground" />
                    )}
                    <Label htmlFor="theme-toggle" className="text-sm font-medium">
                      {t ? t('chat.settings.darkMode') : 'Dark Mode'}
                    </Label>
                  </div>
                  <Switch
                    id="theme-toggle"
                    checked={theme === 'dark'}
                    onCheckedChange={toggleTheme}
                  />
                </div>

                {/* Font Size Control */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    {t ? t('settings.fontSize.title') : 'Kích thước chữ'}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {t ? t('settings.fontSize.description') : 'Điều chỉnh kích thước chữ trong tin nhắn chat'}
                  </p>
                  <Select value={fontSize} onValueChange={handleFontSizeChange}>
                    <SelectTrigger className="w-full rounded-2xl border-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-0">
                      <SelectItem value="small">
                        {t ? t('settings.fontSize.options.small') : 'Nhỏ'}
                      </SelectItem>
                      <SelectItem value="medium">
                        {t ? t('settings.fontSize.options.medium') : 'Vừa'}
                      </SelectItem>
                      <SelectItem value="large">
                        {t ? t('settings.fontSize.options.large') : 'Lớn'}
                      </SelectItem>
                      <SelectItem value="extraLarge">
                        {t ? t('settings.fontSize.options.extraLarge') : 'Rất lớn'}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t ? t('settings.chatHistory.title') : 'Lịch sử trò chuyện'}</CardTitle>
                <CardDescription>{t ? t('settings.chatHistory.description') : 'Quản lý lịch sử cuộc trò chuyện'}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleClearHistory}
                  className="w-full"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t ? t('chat.settings.clearHistory') : 'Clear All Chat History'}
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  {t ? t('chat.settings.clearHistoryWarning') : 'This will permanently delete all your chat conversations'}
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Prompt Settings */}
          <TabsContent value="prompts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Wand2 className="h-5 w-5" />
                  Tuỳ chỉnh iRIN Sensei
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PromptSettings />
              </CardContent>
            </Card>
          </TabsContent>



          {/* API Keys */}
          <TabsContent value="api" className="space-y-4">
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">AI Provider Configuration</h3>
                <p className="text-sm text-muted-foreground">
                  Configure API keys for different AI providers. Each provider offers unique capabilities.
                </p>
              </div>

              {/* Render API key cards for each provider */}
              {(['gemini', 'groq'] as ProviderType[]).map((provider) => {
                const info = getProviderInfo(provider);
                if (!info) return null;

                return (
                  <Card key={provider}>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <span className="text-xl">{info.icon}</span>
                        {info.name}
                        {keyValidationStatus[provider] === 'valid' && (
                          <Badge variant="secondary" className="text-xs">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Configured
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription>
                        {info.description}
                        <br />
                        <a
                          href={info.getKeyUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline inline-flex items-center gap-1 mt-1"
                        >
                          Get API key from {provider === 'gemini' ? 'Google AI Studio' : 'Groq Console'}
                          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor={`${provider}-api-key`} className="flex items-center gap-2 text-sm font-medium">
                          <Key className="h-4 w-4 text-muted-foreground" />
                          {info.name} API Key
                        </Label>
                        <div className="relative">
                          <Input
                            id={`${provider}-api-key`}
                            type={showApiKeys[provider] ? "text" : "password"}
                            value={apiKeys[provider]}
                            onChange={(e) => handleApiKeyChange(provider, e.target.value)}
                            placeholder={info.placeholder}
                            className="pr-20"
                          />
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                            {getKeyValidationIcon(provider)}
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setShowApiKeys(prev => ({ ...prev, [provider]: !prev[provider] }))}
                              className="h-8 w-8 p-0"
                            >
                              {showApiKeys[provider] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>
                        {getKeyValidationMessage(provider) && (
                          <p className={cn(
                            "text-xs",
                            keyValidationStatus[provider] === 'valid' ? "text-green-600" :
                            keyValidationStatus[provider] === 'invalid' ? "text-red-600" :
                            "text-yellow-600"
                          )}>
                            {getKeyValidationMessage(provider)}
                          </p>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleValidateKey(provider)}
                          disabled={!apiKeys[provider].trim() || isValidatingKeys[provider]}
                          variant="outline"
                          size="sm"
                        >
                          {isValidatingKeys[provider] ? 'Validating...' : 'Validate Key'}
                        </Button>
                        <Button
                          onClick={() => {
                            setApiKeys(prev => ({ ...prev, [provider]: '' }));
                            localStorage.removeItem(`${provider}_api_key`);
                            setKeyValidationStatus(prev => ({ ...prev, [provider]: 'idle' }));
                          }}
                          variant="outline"
                          size="sm"
                        >
                          Clear
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground">
                  <strong>Note:</strong> API keys are stored locally in your browser. Each provider offers different capabilities:
                  <br />• <strong>Gemini:</strong> Thinking mode, file upload, Google Search
                  <br />• <strong>Groq:</strong> Ultra-fast responses, cost-effective
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t">
          {/* Save Success Message */}
          {showSavedMessage && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <div className="w-2 h-2 bg-green-600 rounded-full"></div>
              {t ? t('chat.settings.saved') : 'Đã lưu'}
            </div>
          )}

          <div className="flex gap-2 ml-auto">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="min-w-[80px]"
            >
              {isSaving ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {t ? t('chat.settings.saving') : 'Đang lưu...'}
                </div>
              ) : (
                t ? t('chat.settings.save') : 'Lưu'
              )}
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t ? t('chat.settings.close') : 'Đóng'}
            </Button>
          </div>
        </div>
      </DialogContent>

      {/* Clear History Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showClearHistoryDialog}
        onOpenChange={setShowClearHistoryDialog}
        onConfirm={handleConfirmClearHistory}
        title={t ? t('chat.settings.confirmClearTitle') : 'Xóa toàn bộ lịch sử chat'}
        description={t ? t('chat.settings.confirmClear') : 'Bạn có chắc chắn muốn xóa toàn bộ lịch sử trò chuyện? Hành động này không thể hoàn tác.'}
        confirmText={t ? t('chat.settings.clearHistory') : 'Xóa lịch sử'}
        cancelText={t ? t('common.cancel') : 'Hủy'}
        variant="destructive"
      />
    </Dialog>
  );
};

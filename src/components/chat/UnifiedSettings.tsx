"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Settings,
  Moon,
  Sun,
  Trash2,
  Key,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  AlertCircle,
  Wand2,
  Globe
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useTranslations } from '@/hooks/use-translations';
import { getAIProviderManager, type ProviderType } from '@/lib/ai-provider-manager';
import { PromptSettings } from './PromptSettings';
import { hasCustomPrompt } from '@/lib/prompt-storage';
import { cn } from '@/lib/utils';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { createClient } from '@/utils/supabase/client';
import { UserStorage } from '@/lib/user-storage';
import { useAuth } from '@/contexts/auth-context';


// ✅ FIXED: Create supabase client instance
const supabase = createClient();

interface UnifiedSettingsProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onClearHistory?: () => void;
  defaultTab?: string;
}

export const UnifiedSettings: React.FC<UnifiedSettingsProps> = ({
  isOpen,
  onOpenChange,
  onClearHistory,
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


  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large' | 'extraLarge'>('medium');
  const [aiLanguage, setAiLanguage] = useState('auto');
  const [customLanguage, setCustomLanguage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showSavedMessage, setShowSavedMessage] = useState(false);
  const { theme, setTheme } = useTheme();
  const { t } = useTranslations();
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [showClearHistoryDialog, setShowClearHistoryDialog] = useState(false);

  // Prevent hydration mismatch and load user-scoped settings
  useEffect(() => {
    setMounted(true);
    // Load saved settings
    const savedFontSize = localStorage.getItem('chat_font_size') as 'small' | 'medium' | 'large' | 'extraLarge';

    if (savedFontSize && ['small', 'medium', 'large', 'extraLarge'].includes(savedFontSize)) {
      setFontSize(savedFontSize);
    }

    if (user?.id) {
      // Load user-scoped AI language settings
      const savedLanguage = UserStorage.getItem('ai_language') || 'auto';
      const savedCustomLanguage = UserStorage.getItem('ai_custom_language') || '';
      setAiLanguage(savedLanguage);
      setCustomLanguage(savedCustomLanguage);
    } else {
      // Reset to defaults when no user
      setAiLanguage('auto');
      setCustomLanguage('');
    }

    // Load API key status from server
    loadKeyStatus();
  }, [user?.id]);

  const loadKeyStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const res = await fetch('/api/user/keys', { headers });
      if (res.ok) {
        const status: { gemini: boolean; groq: boolean } = await res.json();

        // Update validation status first
        const newValidation: Record<ProviderType, 'idle' | 'valid' | 'invalid'> = {
          gemini: status.gemini ? 'valid' : 'idle',
          groq: status.groq ? 'valid' : 'idle'
        };
        setKeyValidationStatus(newValidation);

        // ✅ SECURITY FIX: Do NOT fetch decrypted keys on page load
        // This was causing API keys to appear in network traffic
        // Instead, we only load the status (whether keys exist or not)


      }
    } catch (error) {
      console.error('Failed to load key status:', error);
    }
  };

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



  // Delete key from server
  const deleteApiKey = async (provider: ProviderType) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
      await fetch(`/api/user/keys/${provider}`, {
        method: 'DELETE',
        headers
      });
    } catch (err) {
      console.error(`Failed to delete ${provider} key:`, err);
    }
  };

  const handleApiKeyChange = (provider: ProviderType, key: string) => {
    setApiKeys(prev => ({ ...prev, [provider]: key }));
    setKeyValidationStatus(prev => ({ ...prev, [provider]: 'idle' }));
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
      
      if (isValid) {
        // Save to server if validation succeeds
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.user) {
          setKeyValidationStatus(prev => ({ ...prev, [provider]: 'invalid' }));
          return;
        }

        const headers: HeadersInit = {
          'Content-Type': 'application/json'
        };

        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
        }

        const requestBody = { key: key.trim() };

        const res = await fetch(`/api/user/keys/${provider}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(requestBody)
        });

        if (res.ok) {
          // ✅ SECURITY: Do NOT configure provider with API key here
          // This would store the key in memory. Instead, just mark as valid.
          setKeyValidationStatus(prev => ({ ...prev, [provider]: 'valid' }));

          // ✅ FIX: Re-configure provider with the new key
          const aiProviderManager = getAIProviderManager();
          aiProviderManager.configureProvider(provider, key);

        } else {
          const errorData = await res.text();
          console.error(`API Error (${res.status}):`, errorData);
          setKeyValidationStatus(prev => ({ ...prev, [provider]: 'invalid' }));
        }
      } else {
        setKeyValidationStatus(prev => ({ ...prev, [provider]: 'invalid' }));
      }
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
    if (user?.id) {
      // Clear user-scoped chat history
      UserStorage.removeItem('chat_history');
      UserStorage.removeItem('current_chat_id');
    } else {
      // Fallback to localStorage for guests
      localStorage.removeItem('chat_history');
    }
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

  const handleLanguageChange = (language: string) => {
    setAiLanguage(language);
  };

  const handleCustomLanguageChange = (language: string) => {
    setCustomLanguage(language);
  };

  const handleSaveLanguageSettings = async () => {
    if (!user?.id) return;

    setIsSaving(true);
    try {
      // Save settings to user-scoped storage
      UserStorage.setItem('ai_language', aiLanguage);
      UserStorage.setItem('ai_custom_language', customLanguage);

      // Show success message
      setShowSavedMessage(true);
      setTimeout(() => setShowSavedMessage(false), 2000);
    } catch (error) {
      console.error('Failed to save language settings:', error);
    } finally {
      setIsSaving(false);
    }
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
          <DialogDescription>
            {t ? t('settings.main.description') : 'Customize iRIN’s appearance, behavior, and API configurations.'}
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">{t ? t('settings.tabs.general') : 'Chung'}</TabsTrigger>
            <TabsTrigger value="prompts" className="relative">
              {t ? t('settings.tabs.prompts') : 'Prompts'}
              {hasCustomPrompt() && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full" />
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

                {/* AI Language Selection */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm font-medium">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    {t ? t('chat.settings.aiLanguage') : 'AI Communication Language'}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {t ? t('chat.settings.aiLanguageDescription') : 'Choose the language for AI responses and communication style'}
                  </p>
                  <Select value={aiLanguage} onValueChange={handleLanguageChange}>
                    <SelectTrigger className="rounded-2xl border-0">
                      <SelectValue placeholder={t ? t('chat.settings.selectLanguage') : 'Select language'} />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-0">
                      <SelectItem value="auto">{t ? t('chat.languages.auto') : 'Tự động dò ngôn ngữ (Auto Detect)'}</SelectItem>
                      <SelectItem value="vietnamese">{t ? t('chat.languages.vietnamese') : 'Tiếng Việt'}</SelectItem>
                      <SelectItem value="english">{t ? t('chat.languages.english') : 'English'}</SelectItem>
                      <SelectItem value="japanese">{t ? t('chat.languages.japanese') : '日本語'}</SelectItem>
                      <SelectItem value="custom">{t ? t('chat.languages.custom') : 'Tùy chọn (Custom)'}</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Custom Language Input */}
                  {aiLanguage === 'custom' && (
                    <div className="mt-2">
                      <Input
                        placeholder={t ? t('chat.settings.customLanguagePlaceholder') : 'Nhập ngôn ngữ mong muốn (ví dụ: Tiếng Hàn, Français, Español...)'}
                        value={customLanguage}
                        onChange={(e) => handleCustomLanguageChange(e.target.value)}
                        className="text-sm"
                      />
                    </div>
                  )}

                  {/* Save Language Settings Button */}
                  {user?.id && (
                    <div className="flex items-center justify-between pt-2">
                      {showSavedMessage && (
                        <div className="flex items-center gap-2 text-sm text-green-600">
                          <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                          {t ? t('chat.settings.saved') : 'Đã lưu'}
                        </div>
                      )}
                      <Button
                        onClick={handleSaveLanguageSettings}
                        disabled={isSaving}
                        size="sm"
                        className="ml-auto"
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
                    </div>
                  )}
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
                          onClick={async () => {
                            setApiKeys(prev => ({ ...prev, [provider]: '' }));
                            setKeyValidationStatus(prev => ({ ...prev, [provider]: 'idle' }));
                            await deleteApiKey(provider);
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

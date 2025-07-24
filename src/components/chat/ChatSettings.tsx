"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Settings, Moon, Sun, MessageSquare, Trash2, Globe } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useTranslations } from '@/hooks/use-translations';
import { cn } from '@/lib/utils';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';

interface ChatSettingsProps {
  onClearHistory?: () => void;
}

export const ChatSettings: React.FC<ChatSettingsProps> = ({ onClearHistory }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [aiLanguage, setAiLanguage] = useState('auto');
  const [customLanguage, setCustomLanguage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showSavedMessage, setShowSavedMessage] = useState(false);
  const { theme, setTheme } = useTheme();
  const { t } = useTranslations();
  const [mounted, setMounted] = useState(false);
  const [showClearHistoryDialog, setShowClearHistoryDialog] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
    // Load saved settings
    const savedLanguage = localStorage.getItem('ai_language') || 'auto';
    const savedCustomLanguage = localStorage.getItem('ai_custom_language') || '';
    setAiLanguage(savedLanguage);
    setCustomLanguage(savedCustomLanguage);
  }, []);

  const handleLanguageChange = (language: string) => {
    setAiLanguage(language);
  };

  const handleCustomLanguageChange = (language: string) => {
    setCustomLanguage(language);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Save settings to localStorage
      localStorage.setItem('ai_language', aiLanguage);
      localStorage.setItem('ai_custom_language', customLanguage);

      // Show success message
      setShowSavedMessage(true);
      setTimeout(() => setShowSavedMessage(false), 2000);
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearHistory = () => {
    setShowClearHistoryDialog(true);
  };

  const handleConfirmClearHistory = () => {
    localStorage.removeItem('chat_history');
    onClearHistory?.();
    setIsOpen(false);
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  if (!mounted) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" className="w-full justify-start">
          <Settings className="mr-2 h-4 w-4" />
          {t ? t('chat.settings.title') : 'AI Chat Settings'}
        </Button>
      </DialogTrigger>
      <DialogContent
        className="sm:max-w-md"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            {t ? t('chat.settings.title') : 'AI Chat Settings'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
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

          {/* AI Language Selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <Globe className="h-4 w-4 text-muted-foreground" />
              {t ? t('chat.settings.aiLanguage') : 'AI Communication Language'}
            </Label>
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
          </div>

          {/* Clear History */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              {t ? t('chat.settings.chatHistory') : 'Chat History'}
            </Label>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleClearHistory}
              className="w-full"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {t ? t('chat.settings.clearHistory') : 'Clear All Chat History'}
            </Button>
            <p className="text-xs text-muted-foreground">
              {t ? t('chat.settings.clearHistoryWarning') : 'This will permanently delete all your chat conversations'}
            </p>
          </div>
        </div>

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
            <Button variant="outline" onClick={() => setIsOpen(false)}>
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

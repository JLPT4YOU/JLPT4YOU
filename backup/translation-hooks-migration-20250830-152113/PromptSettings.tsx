"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useTranslations } from '@/hooks/use-translations';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import {
  RotateCcw,
  Save,
  Check,
  Lightbulb,
  BookOpen,
  MessageSquare,
  Settings2,
  Globe
} from 'lucide-react';
import {
  getCustomPromptConfig,
  saveCustomPromptConfig,
  resetToDefaultPrompt,
  type CustomPromptConfig
} from '@/lib/prompt-storage';
import { UserStorage } from '@/lib/user-storage';
import { useAuth } from '@/contexts/auth-context-simple';
import { generateUserPrompt, clearUserPromptConfig } from '@/lib/user-prompt-generator';

interface PromptSettingsProps {
  onClose?: () => void;
  className?: string;
}

const DEFAULT_CONFIG: CustomPromptConfig = {
  preferredName: '',
  desiredTraits: '',
  personalInfo: '',
  additionalRequests: '',
  generatedPrompt: ''
};



export const PromptSettings: React.FC<PromptSettingsProps> = ({
  onClose,
  className
}) => {
  const { t } = useTranslations();
  const { user } = useAuth();
  const [config, setConfig] = useState<CustomPromptConfig>(DEFAULT_CONFIG);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // AI Language settings
  const [aiLanguage, setAiLanguage] = useState('auto');
  const [customLanguage, setCustomLanguage] = useState('');
  const [showResetDialog, setShowResetDialog] = useState(false);

  // Load saved configuration on mount and when user changes
  useEffect(() => {
    const savedConfig = getCustomPromptConfig();
    if (savedConfig) {
      setConfig(savedConfig);
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
  }, [user?.id]);

  const handleGeneratePrompt = async () => {
    setIsGenerating(true);
    try {
      const generatedPrompt = await generateUserPrompt({
        preferredName: config.preferredName,
        desiredTraits: config.desiredTraits,
        personalInfo: config.personalInfo,
        additionalRequests: config.additionalRequests
      });

      setConfig(prev => ({
        ...prev,
        generatedPrompt
      }));
    } catch (error) {
      console.error('Failed to generate prompt:', error);
      // Show error feedback to user
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!user?.id) return;

    setIsSaving(true);
    setIsSaved(false);
    try {
      await saveCustomPromptConfig(config);

      // Save AI language settings to user-scoped storage
      UserStorage.setItem('ai_language', aiLanguage);
      UserStorage.setItem('ai_custom_language', customLanguage);

      // Show success feedback
      setIsSaving(false);
      setIsSaved(true);

      // Hide success message after 2 seconds
      setTimeout(() => setIsSaved(false), 2000);
    } catch (error) {
      console.error('Failed to save prompt config:', error);
      setIsSaving(false);
      setIsSaved(false);
    }
  };



  const handleResetAllPrompts = () => {
    setShowResetDialog(true);
  };

  const handleConfirmReset = () => {
    // Reset current form (bao gồm chức năng của handleReset cũ)
    setConfig(DEFAULT_CONFIG);

    // Clear all prompt-related localStorage (except core)
    resetToDefaultPrompt(); // Clear old system prompt
    clearUserPromptConfig(); // Clear new system prompt

    // Reset AI language settings
    setAiLanguage('auto');
    setCustomLanguage('');
    if (user?.id) {
      UserStorage.removeItem('ai_language');
      UserStorage.removeItem('ai_custom_language');
    }

    // Show success message (có thể thay bằng toast notification sau)
    setTimeout(() => {
      alert('✅ Đã reset toàn bộ thành công!\n\n• Prompt tùy chỉnh: Đã xóa\n• Cài đặt ngôn ngữ: Đã reset\n• Core iRIN: Vẫn được giữ nguyên');
    }, 100);
  };

  const handleLanguageChange = (language: string) => {
    setAiLanguage(language);
  };

  const handleCustomLanguageChange = (language: string) => {
    setCustomLanguage(language);
  };



  return (
    <div className={cn("space-y-6", className)}>




      {/* AI Communication Language */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2 text-muted-foreground">
            <Globe className="h-4 w-4 text-muted-foreground" />
            iRIN nên giao tiếp với bạn bằng ngôn ngữ gì?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Select value={aiLanguage} onValueChange={handleLanguageChange}>
            <SelectTrigger className="rounded-2xl border-0">
              <SelectValue placeholder={t('prompts.aiLanguage.placeholder') || 'Chọn ngôn ngữ'} />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-0">
              <SelectItem value="auto">
                {t('prompts.aiLanguage.options.auto') || 'Tự động dò ngôn ngữ (Auto Detect)'}
              </SelectItem>
              <SelectItem value="vietnamese">
                {t('prompts.aiLanguage.options.vietnamese') || 'Tiếng Việt'}
              </SelectItem>
              <SelectItem value="english">
                {t('prompts.aiLanguage.options.english') || 'English'}
              </SelectItem>
              <SelectItem value="japanese">
                {t('prompts.aiLanguage.options.japanese') || '日本語'}
              </SelectItem>
              <SelectItem value="custom">
                {t('prompts.aiLanguage.options.custom') || 'Tùy chọn (Custom)'}
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Custom Language Input */}
          {aiLanguage === 'custom' && (
            <Input
              placeholder={t('prompts.aiLanguage.customPlaceholder') || 'Nhập ngôn ngữ mong muốn (ví dụ: Tiếng Hàn, Français, Español...)'}
              value={customLanguage}
              onChange={(e) => handleCustomLanguageChange(e.target.value)}
              className="mt-2"
            />
          )}
        </CardContent>
      </Card>

      {/* Personalization Form */}
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium mb-4 text-muted-foreground">Tùy chỉnh cá nhân hóa</h3>
        </div>

        {/* Preferred Name */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-muted-foreground">iRIN nên gọi bạn là gì?</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              value={config.preferredName}
              onChange={(e) => setConfig(prev => ({ ...prev, preferredName: e.target.value }))}
              placeholder="Tên hoặc cách gọi mà bạn muốn iRIN sử dụng"
              className="rounded-2xl border-0"
              maxLength={50}
            />
          </CardContent>
        </Card>

        {/* Desired Traits */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-muted-foreground">Bạn muốn iRIN có những đặc điểm gì?</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={config.desiredTraits}
              onChange={(e) => setConfig(prev => ({ ...prev, desiredTraits: e.target.value }))}
              placeholder="Mô tả tính cách và đặc điểm mà bạn mong muốn ở iRIN"
              className="min-h-[80px] rounded-2xl border-0"
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground mt-2">
              {config.desiredTraits.length}/200 ký tự
            </p>
          </CardContent>
        </Card>

        {/* Personal Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-muted-foreground">Bạn muốn iRIN biết thêm gì về bạn không?</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={config.personalInfo}
              onChange={(e) => setConfig(prev => ({ ...prev, personalInfo: e.target.value }))}
              placeholder="Thông tin cá nhân để iRIN có thể hỗ trợ bạn tốt hơn (tùy chọn)"
              className="min-h-[80px] rounded-2xl border-0"
              maxLength={300}
            />
            <p className="text-xs text-muted-foreground mt-2">
              {config.personalInfo.length}/300 ký tự
            </p>
          </CardContent>
        </Card>

        {/* Additional Requests */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-muted-foreground">Yêu cầu bổ sung</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={config.additionalRequests}
              onChange={(e) => setConfig(prev => ({ ...prev, additionalRequests: e.target.value }))}
              placeholder="Có điều gì khác bạn muốn iRIN lưu ý không? (tùy chọn)"
              className="min-h-[80px] rounded-2xl border-0"
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground mt-2">
              {config.additionalRequests.length}/200 ký tự
            </p>
          </CardContent>
        </Card>

        {/* Generate Prompt Button */}
        <Card className="interactive-success">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-success">Tạo Prompt Tùy Chỉnh</p>
                <p className="text-sm text-success/80 mt-1">
                  Sử dụng AI để tạo prompt phù hợp dựa trên thông tin bạn đã nhập
                </p>
              </div>
              <Button
                onClick={handleGeneratePrompt}
                disabled={isGenerating || !config.preferredName.trim()}
                className="status-correct-solid"
              >
                {isGenerating ? 'Đang tạo...' : 'Tạo Prompt'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Generated Prompt Display */}
        {config.generatedPrompt && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Prompt đã tạo</CardTitle>
              <CardDescription>
                Đây là prompt tùy chỉnh được tạo cho bạn
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm whitespace-pre-wrap">{config.generatedPrompt}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>





      {/* Actions */}
      <div className="flex justify-between items-center pt-4 border-t">
        <p className="text-xs text-muted-foreground">
          {t ? t('prompts.footer.note') : 'Cài đặt được lưu cục bộ và sẽ tồn tại qua các phiên'}
        </p>
        <div className="flex gap-3">
          {onClose && (
            <Button variant="outline" onClick={onClose}>
              {t ? t('common.cancel') : 'Hủy'}
            </Button>
          )}
          <Button
            variant="destructive"
            onClick={handleResetAllPrompts}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className={isSaved ? 'bg-green-600 hover:bg-green-700' : ''}
          >
            {isSaved ? (
              <>
                <Check className="w-4 h-4 mr-2 text-white" />
                <span className="text-white">Saved</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? 'Đang lưu...' : 'Save'}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Reset Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showResetDialog}
        onOpenChange={setShowResetDialog}
        onConfirm={handleConfirmReset}
        title="Reset toàn bộ prompt và cài đặt"
        description="Bạn có chắc muốn reset toàn bộ prompt và cài đặt? Hành động này sẽ: Xóa toàn bộ prompt tùy chỉnh, Reset cài đặt ngôn ngữ AI, Đặt lại form về mặc định. Core prompt của iRIN sẽ được giữ nguyên."
        confirmText="Reset toàn bộ"
        cancelText="Hủy"
        variant="destructive"
      />
    </div>
  );
};

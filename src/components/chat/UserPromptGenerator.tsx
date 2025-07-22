"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Wand2,
  Save,
  RotateCcw,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import {
  type UserPromptInputs,
  type UserPromptConfig,
  createAndSaveUserPrompt,
  getUserPromptConfig,
  clearUserPromptConfig
} from '@/lib/user-prompt-generator';

interface UserPromptGeneratorProps {
  onClose?: () => void;
  className?: string;
}

const DEFAULT_INPUTS: UserPromptInputs = {
  preferredName: '',
  desiredTraits: '',
  personalInfo: '',
  additionalRequests: ''
};

export const UserPromptGenerator: React.FC<UserPromptGeneratorProps> = ({
  onClose,
  className
}) => {
  const [inputs, setInputs] = useState<UserPromptInputs>(DEFAULT_INPUTS);
  const [config, setConfig] = useState<UserPromptConfig | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Load existing config on mount
  useEffect(() => {
    const existingConfig = getUserPromptConfig();
    if (existingConfig) {
      setConfig(existingConfig);
      setInputs(existingConfig.inputs);
    }
  }, []);

  const handleGeneratePrompt = async () => {
    setIsGenerating(true);
    setError('');
    setSuccess('');

    try {
      const newConfig = await createAndSaveUserPrompt(inputs);
      setConfig(newConfig);
      setSuccess('Đã tạo prompt thành công!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra');
    } finally {
      setIsGenerating(false);
    }
  };



  const handleResetAllPrompts = () => {
    const confirmMessage = 'Bạn có chắc muốn reset toàn bộ prompt và cài đặt? Hành động này sẽ:\n\n• Xóa toàn bộ prompt tùy chỉnh\n• Reset form về mặc định\n• Xóa cài đặt ngôn ngữ AI\n\nCore prompt của iRIN sẽ được giữ nguyên.';
    if (window.confirm(confirmMessage)) {
      // Reset current form (bao gồm chức năng của handleReset cũ)
      setInputs(DEFAULT_INPUTS);
      setConfig(null);

      // Clear all prompt-related localStorage (except core)
      clearUserPromptConfig(); // Clear new system prompt

      // Also clear old system if exists
      try {
        localStorage.removeItem('irin_sensei_custom_prompt');
        localStorage.removeItem('ai_language');
        localStorage.removeItem('ai_custom_language');
      } catch (error) {
        console.error('Error clearing old prompt data:', error);
      }

      setError('');
      setSuccess('✅ Đã reset toàn bộ thành công! Core prompt của iRIN vẫn được giữ nguyên.');
      setTimeout(() => setSuccess(''), 3000);
    }
  };



  const canGenerate = inputs.preferredName.trim().length > 0;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Tạo User Prompt Riêng Biệt</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Tạo prompt cho cách giao tiếp cá nhân (UI chỉ hiển thị user prompt, không hiển thị core)
          </p>
        </div>

      </div>

      {/* Status Messages */}
      {error && (
        <Card className="border-red-200 bg-red-50/50">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <p className="text-sm text-red-900">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {success && (
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
              <p className="text-sm text-green-900">{success}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Input Form */}
      <div className="space-y-6">
        {/* Preferred Name */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Bạn muốn được gọi là gì?</CardTitle>
            <CardDescription>
              Tên hoặc cách gọi mà bạn muốn AI sử dụng
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              value={inputs.preferredName}
              onChange={(e) => setInputs(prev => ({ ...prev, preferredName: e.target.value }))}
              placeholder="Ví dụ: Long, Anh Nam, Chị Linh, bạn..."
              className="rounded-2xl border-0"
              maxLength={50}
            />
            <p className="text-xs text-muted-foreground mt-2">
              {inputs.preferredName.length}/50 ký tự
            </p>
          </CardContent>
        </Card>

        {/* Desired Traits */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Bạn muốn AI có đặc điểm gì?</CardTitle>
            <CardDescription>
              Mô tả tính cách và cách giao tiếp mà bạn mong muốn
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={inputs.desiredTraits}
              onChange={(e) => setInputs(prev => ({ ...prev, desiredTraits: e.target.value }))}
              placeholder="Ví dụ: vui vẻ, hài hước, kiên nhẫn, nhiệt tình, giải thích dễ hiểu..."
              className="min-h-[80px] rounded-2xl border-0"
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground mt-2">
              {inputs.desiredTraits.length}/200 ký tự
            </p>
          </CardContent>
        </Card>

        {/* Personal Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Thông tin về bạn</CardTitle>
            <CardDescription>
              Thông tin cá nhân để AI hiểu bạn hơn (tùy chọn)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={inputs.personalInfo}
              onChange={(e) => setInputs(prev => ({ ...prev, personalInfo: e.target.value }))}
              placeholder="Ví dụ: Tôi là sinh viên, đang học tiếng Nhật, thích anime..."
              className="min-h-[80px] rounded-2xl border-0"
              maxLength={300}
            />
            <p className="text-xs text-muted-foreground mt-2">
              {inputs.personalInfo.length}/300 ký tự
            </p>
          </CardContent>
        </Card>

        {/* Additional Requests */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Yêu cầu đặc biệt</CardTitle>
            <CardDescription>
              Có điều gì khác bạn muốn AI lưu ý không? (tùy chọn)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={inputs.additionalRequests}
              onChange={(e) => setInputs(prev => ({ ...prev, additionalRequests: e.target.value }))}
              placeholder="Ví dụ: Luôn đưa ví dụ cụ thể, sử dụng emoji, giải thích từ khó..."
              className="min-h-[80px] rounded-2xl border-0"
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground mt-2">
              {inputs.additionalRequests.length}/200 ký tự
            </p>
          </CardContent>
        </Card>

        {/* Generate Button */}
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-blue-900">Tạo User Prompt</p>
                <p className="text-sm text-blue-700 mt-1">
                  Sử dụng AI để tạo prompt giao tiếp phù hợp với bạn
                </p>
              </div>
              <Button
                onClick={handleGeneratePrompt}
                disabled={isGenerating || !canGenerate}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Đang tạo...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4 mr-2" />
                    Tạo Prompt
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Generated User Prompt Display */}
        {config?.generatedUserPrompt && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">User Prompt đã tạo</CardTitle>
              <CardDescription>
                Prompt tùy chỉnh cho cách giao tiếp (không bao gồm core iRIN)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm whitespace-pre-wrap">{config.generatedUserPrompt}</p>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <Badge variant="secondary">User Prompt Only</Badge>
                <span className="text-xs text-muted-foreground">
                  Tạo lúc: {new Date(config.createdAt).toLocaleString('vi-VN')}
                </span>
              </div>
              <div className="mt-2 p-2 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-700">
                  💡 Prompt này sẽ được tự động kết hợp với core iRIN khi bạn chat
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>



      {/* Actions */}
      <div className="flex justify-between items-center pt-4 border-t">
        <div className="text-xs text-muted-foreground">
          <p>✨ UI chỉ hiển thị user prompt (không hiển thị core iRIN)</p>
          <p>🔗 Hệ thống tự động kết hợp: Core iRIN + User Prompt khi chat</p>
        </div>
        <div className="flex gap-3">
          {onClose && (
            <Button variant="outline" onClick={onClose}>
              Đóng
            </Button>
          )}
          <Button
            variant="destructive"
            onClick={handleResetAllPrompts}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
        </div>
      </div>
    </div>
  );
};

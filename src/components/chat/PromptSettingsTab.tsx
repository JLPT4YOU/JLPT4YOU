"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import {
  Settings2,
  Wand2,
  Info,
  Zap
} from 'lucide-react';
import { PromptSettings } from './PromptSettings';
import { UserPromptGenerator } from './UserPromptGenerator';
import { hasUserPromptConfig, getUserPromptConfig } from '@/lib/user-prompt-generator';
import { hasCustomPrompt } from '@/lib/prompt-storage';

interface PromptSettingsTabProps {
  onClose?: () => void;
  className?: string;
}

export const PromptSettingsTab: React.FC<PromptSettingsTabProps> = ({
  onClose,
  className
}) => {
  const [activeTab, setActiveTab] = useState<string>('user-prompt');
  
  // Check if configs exist
  const hasUserPrompt = hasUserPromptConfig();
  const hasOldPrompt = hasCustomPrompt();
  const userConfig = getUserPromptConfig();

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Cài đặt AI Prompt</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Tùy chỉnh cách iRIN giao tiếp với bạn
          </p>
        </div>
      </div>

      {/* Status Overview */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900">
                Trạng thái Prompt hiện tại
              </p>
              <div className="flex items-center gap-2 mt-2">
                {hasUserPrompt ? (
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    ✓ User Prompt: Đã cấu hình
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-gray-300">
                    User Prompt: Chưa cấu hình
                  </Badge>
                )}
                
                {hasOldPrompt ? (
                  <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                    ⚠ Old System: Đang dùng
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-gray-300">
                    Old System: Không dùng
                  </Badge>
                )}
              </div>
              
              {hasUserPrompt && userConfig && (
                <p className="text-xs text-blue-700 mt-2">
                  User prompt được tạo lúc: {new Date(userConfig.createdAt).toLocaleString('vi-VN')}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="user-prompt" className="flex items-center gap-2">
            <Wand2 className="w-4 h-4" />
            User Prompt (Mới)
            {hasUserPrompt && (
              <Badge variant="secondary" className="ml-1 text-xs">
                Đã cấu hình
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="old-system" className="flex items-center gap-2">
            <Settings2 className="w-4 h-4" />
            Hệ thống cũ
            {hasOldPrompt && (
              <Badge variant="secondary" className="ml-1 text-xs">
                Đang dùng
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* User Prompt Generator Tab */}
        <TabsContent value="user-prompt" className="space-y-6">
          <Card className="border-green-200 bg-green-50/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="w-5 h-5 text-green-600" />
                Hệ thống User Prompt (Khuyến nghị)
              </CardTitle>
              <CardDescription>
                Tạo prompt riêng biệt cho cách giao tiếp, sau đó kết hợp với core iRIN
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Tách biệt hoàn toàn: User prompt không ảnh hưởng Core</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">An toàn: Core identity luôn được bảo vệ</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Linh hoạt: Dễ tạo và chỉnh sửa</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <UserPromptGenerator onClose={onClose} />
        </TabsContent>

        {/* Old System Tab */}
        <TabsContent value="old-system" className="space-y-6">
          <Card className="border-yellow-200 bg-yellow-50/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-yellow-600" />
                Hệ thống cũ (Không khuyến nghị)
              </CardTitle>
              <CardDescription>
                Hệ thống prompt cũ với dropdown options cố định
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm">Có thể ảnh hưởng đến việc tạo prompt</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm">Ít linh hoạt hơn</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm">Chỉ dùng khi cần thiết</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <PromptSettings onClose={onClose} />
        </TabsContent>
      </Tabs>

      {/* Actions */}
      <div className="flex justify-between items-center pt-4 border-t">
        <p className="text-xs text-muted-foreground">
          Khuyến nghị sử dụng User Prompt để có trải nghiệm tốt nhất
        </p>
        <div className="flex gap-3">
          {onClose && (
            <Button variant="outline" onClick={onClose}>
              Đóng
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

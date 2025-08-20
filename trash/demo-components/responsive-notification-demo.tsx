'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Monitor, Tablet, Smartphone, Menu, X, Eye } from 'lucide-react';

/**
 * Demo component to showcase responsive notification inbox design
 */
const ResponsiveNotificationDemo: React.FC = () => {
  const [currentView, setCurrentView] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  const getViewportClass = () => {
    switch (currentView) {
      case 'desktop':
        return 'w-full max-w-6xl mx-auto';
      case 'tablet':
        return 'w-full max-w-3xl mx-auto';
      case 'mobile':
        return 'w-full max-w-sm mx-auto';
      default:
        return 'w-full max-w-6xl mx-auto';
    }
  };

  const features = {
    desktop: [
      'Sidebar luôn hiển thị',
      'Message list và detail cùng lúc',
      'Hover effects đầy đủ',
      'Keyboard shortcuts',
    ],
    tablet: [
      'Sidebar có thể đóng/mở',
      'Message list ưu tiên',
      'Touch-friendly buttons',
      'Swipe gestures',
    ],
    mobile: [
      'Sidebar overlay',
      'Modal cho message detail',
      'Bottom sheet design',
      'One-handed operation',
    ],
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Demo: Responsive Notification Inbox</h2>
        <p className="text-muted-foreground">
          Giao diện thích ứng với mọi kích thước màn hình
        </p>
      </div>

      {/* Viewport Selector */}
      <div className="flex justify-center gap-2">
        <Button
          variant={currentView === 'desktop' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setCurrentView('desktop')}
          className="flex items-center gap-2"
        >
          <Monitor className="w-4 h-4" />
          Desktop
        </Button>
        <Button
          variant={currentView === 'tablet' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setCurrentView('tablet')}
          className="flex items-center gap-2"
        >
          <Tablet className="w-4 h-4" />
          Tablet
        </Button>
        <Button
          variant={currentView === 'mobile' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setCurrentView('mobile')}
          className="flex items-center gap-2"
        >
          <Smartphone className="w-4 h-4" />
          Mobile
        </Button>
      </div>

      {/* Responsive Preview */}
      <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
        <div className={getViewportClass()}>
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg overflow-hidden border">
            {/* Mock Notification Inbox */}
            <div className="flex h-[400px]">
              {/* Sidebar - Desktop always visible, tablet/mobile toggleable */}
              <div className={`
                bg-gray-50 dark:bg-gray-800 border-r flex flex-col
                ${currentView === 'desktop' ? 'w-56' : 'w-48'}
                ${currentView === 'mobile' ? 'hidden' : 'block'}
              `}>
                <div className="p-3 border-b flex items-center justify-between">
                  <h3 className="font-semibold text-sm">Hộp thư đến</h3>
                  {currentView !== 'desktop' && (
                    <Button variant="ghost" size="sm">
                      <X className="w-3 h-3" />
                    </Button>
                  )}
                </div>
                
                <div className="p-2 space-y-1">
                  <div className="flex items-center justify-between p-2 bg-blue-100 dark:bg-blue-900/20 rounded text-xs">
                    <span>Tất cả</span>
                    <Badge variant="secondary" className="text-xs">12</Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded text-xs hover:bg-gray-100 dark:hover:bg-gray-700">
                    <span>Chưa đọc</span>
                    <Badge variant="destructive" className="text-xs">3</Badge>
                  </div>
                  <div className="p-2 rounded text-xs hover:bg-gray-100 dark:hover:bg-gray-700">
                    Quan trọng
                  </div>
                </div>

                <div className="mt-auto p-2 border-t space-y-1">
                  <Button variant="outline" size="sm" className="w-full text-xs">
                    Cập nhật thông báo
                  </Button>
                  <Button variant="outline" size="sm" className="w-full text-xs">
                    Đánh dấu đã đọc
                  </Button>
                </div>
              </div>

              {/* Message List */}
              <div className={`
                border-r flex flex-col
                ${currentView === 'desktop' ? 'w-80' : 'flex-1'}
                ${currentView === 'mobile' ? 'w-full' : ''}
              `}>
                <div className="p-3 border-b">
                  <div className="flex items-center gap-2">
                    {currentView !== 'desktop' && (
                      <Button variant="ghost" size="sm">
                        <Menu className="w-4 h-4" />
                      </Button>
                    )}
                    <div className="flex-1 relative">
                      <input 
                        className="w-full px-3 py-1 text-xs border rounded"
                        placeholder="Tìm kiếm thông báo..."
                      />
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="p-3 border-b hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                      <div className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium truncate">
                            Thông báo {i}
                          </h4>
                          <p className="text-xs text-gray-500 truncate">
                            Nội dung thông báo mẫu...
                          </p>
                          <span className="text-xs text-gray-400">2 phút trước</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Message Detail - Only on desktop */}
              {currentView === 'desktop' && (
                <div className="flex-1 flex flex-col">
                  <div className="p-4 border-b">
                    <h3 className="font-semibold">Chi tiết thông báo</h3>
                  </div>
                  <div className="flex-1 p-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                          <Eye className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-sm">Thông báo mẫu</h4>
                          <p className="text-xs text-gray-500">Hôm nay, 14:30</p>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        Đây là nội dung chi tiết của thông báo. Trên desktop, 
                        user có thể xem đồng thời danh sách và chi tiết.
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Features Comparison */}
      <div className="grid md:grid-cols-3 gap-4">
        {Object.entries(features).map(([device, featureList]) => (
          <Card key={device} className={currentView === device ? 'ring-2 ring-blue-500' : ''}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                {device === 'desktop' && <Monitor className="w-4 h-4" />}
                {device === 'tablet' && <Tablet className="w-4 h-4" />}
                {device === 'mobile' && <Smartphone className="w-4 h-4" />}
                {device.charAt(0).toUpperCase() + device.slice(1)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {featureList.map((feature, index) => (
                  <li key={index} className="text-sm flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Implementation Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Tính năng Responsive</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">Desktop (≥1024px)</h4>
              <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-300">
                <li>• Sidebar luôn hiển thị (w-56)</li>
                <li>• Message list cố định (w-[350px])</li>
                <li>• Detail panel bên phải</li>
                <li>• Hover effects đầy đủ</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Mobile/Tablet (&lt;1024px)</h4>
              <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-300">
                <li>• Sidebar overlay với backdrop</li>
                <li>• Toggle button trong search bar</li>
                <li>• Modal cho notification detail</li>
                <li>• Touch-friendly button sizes</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResponsiveNotificationDemo;

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Clock, Zap, CheckCircle } from 'lucide-react';

/**
 * Demo component to showcase the notification refresh feature
 * This demonstrates the difference between automatic polling and manual refresh
 */
const NotificationRefreshDemo: React.FC = () => {
  const [lastAutoCheck, setLastAutoCheck] = useState(new Date(Date.now() - 8 * 60 * 60 * 1000)); // 8 hours ago
  const [lastManualRefresh, setLastManualRefresh] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setLastManualRefresh(new Date());
    setIsRefreshing(false);
  };

  const getTimeUntilNextAutoCheck = () => {
    const nextCheck = new Date(lastAutoCheck.getTime() + 12 * 60 * 60 * 1000); // 12 hours later
    const now = new Date();
    const diff = nextCheck.getTime() - now.getTime();
    
    if (diff <= 0) return "Sẵn sàng kiểm tra";
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m nữa`;
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Demo: Tính năng Cập nhật Thông báo</h2>
        <p className="text-muted-foreground">
          So sánh giữa kiểm tra tự động (12 tiếng/lần) và cập nhật thủ công
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Automatic Polling */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-500" />
              Kiểm tra Tự động
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Lần kiểm tra cuối:</span>
                <Badge variant="outline">{formatTime(lastAutoCheck)}</Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Kiểm tra tiếp theo:</span>
                <Badge variant="secondary">{getTimeUntilNextAutoCheck()}</Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Tần suất:</span>
                <Badge>Mỗi 12 tiếng</Badge>
              </div>
            </div>

            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-blue-500 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-700 dark:text-blue-300">Tiết kiệm tài nguyên</p>
                  <p className="text-blue-600 dark:text-blue-400">
                    Giảm 99.9% API calls so với trước đây
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Manual Refresh */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-green-500" />
              Cập nhật Thủ công
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Lần cập nhật cuối:</span>
                <Badge variant="outline">
                  {lastManualRefresh ? formatTime(lastManualRefresh) : 'Chưa có'}
                </Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Thời gian phản hồi:</span>
                <Badge variant="secondary">~1-2 giây</Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Kiểm soát:</span>
                <Badge>Theo ý muốn</Badge>
              </div>
            </div>

            <Button 
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="w-full"
              variant="default"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Đang cập nhật...' : 'Cập nhật ngay'}
            </Button>

            <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-green-700 dark:text-green-300">Kiểm soát hoàn toàn</p>
                  <p className="text-green-600 dark:text-green-400">
                    Nhận thông báo ngay khi muốn, không cần đợi
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Feature Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>So sánh Tính năng</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Tính năng</th>
                  <th className="text-center p-2">Kiểm tra Tự động</th>
                  <th className="text-center p-2">Cập nhật Thủ công</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr>
                  <td className="p-2 font-medium">Tần suất cập nhật</td>
                  <td className="p-2 text-center">Mỗi 12 tiếng</td>
                  <td className="p-2 text-center">Theo yêu cầu</td>
                </tr>
                <tr>
                  <td className="p-2 font-medium">Tiêu thụ tài nguyên</td>
                  <td className="p-2 text-center">
                    <Badge variant="outline" className="text-green-600">Rất thấp</Badge>
                  </td>
                  <td className="p-2 text-center">
                    <Badge variant="outline" className="text-blue-600">Tối thiểu</Badge>
                  </td>
                </tr>
                <tr>
                  <td className="p-2 font-medium">Thời gian phản hồi</td>
                  <td className="p-2 text-center">Cache (tức thì)</td>
                  <td className="p-2 text-center">1-2 giây</td>
                </tr>
                <tr>
                  <td className="p-2 font-medium">Kiểm soát user</td>
                  <td className="p-2 text-center">Tự động</td>
                  <td className="p-2 text-center">
                    <Badge variant="outline" className="text-purple-600">Hoàn toàn</Badge>
                  </td>
                </tr>
                <tr>
                  <td className="p-2 font-medium">Thông báo quan trọng</td>
                  <td className="p-2 text-center">
                    <Badge variant="outline" className="text-orange-600">Real-time</Badge>
                  </td>
                  <td className="p-2 text-center">
                    <Badge variant="outline" className="text-orange-600">Real-time</Badge>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Usage Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Hướng dẫn Sử dụng</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">Khi nào dùng Cập nhật Thủ công:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Khi mong đợi có thông báo mới</li>
                <li>• Sau khi thực hiện hành động quan trọng</li>
                <li>• Khi muốn kiểm tra ngay lập tức</li>
                <li>• Trước khi thoát ứng dụng</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Lợi ích của Hệ thống Mới:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Giảm 99.9% tải server</li>
                <li>• Thông báo quan trọng vẫn real-time</li>
                <li>• User có quyền kiểm soát</li>
                <li>• Tiết kiệm pin và băng thông</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationRefreshDemo;

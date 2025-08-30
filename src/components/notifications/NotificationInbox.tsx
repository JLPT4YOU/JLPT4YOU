'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip } from '@/components/ui/tooltip';
import {
  Mail,
  Inbox,
  Star,
  Clock,
  Search,
  Filter,
  CheckCheck,
  Trash2,
  Archive,
  AlertCircle,
  DollarSign,
  Crown,
  Gift,
  MessageSquare,
  Bell,
  RefreshCw,
  Menu,
  X
} from 'lucide-react';
import { notificationService } from '@/services/notification-service';
import { Notification, NotificationType } from '@/types/notification';
import { useAuth } from '@/contexts/auth-context-simple';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

interface NotificationInboxProps {
  onClose?: () => void;
}

const NotificationInbox: React.FC<NotificationInboxProps> = ({ onClose }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'important'>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Icon mapping for notification types
  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'top_up_success':
        return <DollarSign className="w-5 h-5" />;
      case 'premium_upgrade':
        return <Crown className="w-5 h-5" />;
      case 'redeem_code':
        return <Gift className="w-5 h-5" />;
      case 'admin_message':
        return <MessageSquare className="w-5 h-5" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  // Type color mapping
  const getTypeColor = (type: NotificationType) => {
    switch (type) {
      case 'top_up_success':
        return 'text-green-600 bg-green-50';
      case 'premium_upgrade':
        return 'text-purple-600 bg-purple-50';
      case 'redeem_code':
        return 'text-blue-600 bg-blue-50';
      case 'admin_message':
        return 'text-orange-600 bg-orange-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  // Load notifications
  useEffect(() => {
    if (user?.id) {
      loadNotifications();
    }
  }, [user]);

  // Filter notifications
  useEffect(() => {
    let filtered = [...notifications];

    // Apply filter
    if (activeFilter === 'unread') {
      filtered = filtered.filter(n => !n.is_read);
    } else if (activeFilter === 'important') {
      filtered = filtered.filter(n => n.is_important);
    }

    // Apply search
    if (searchQuery) {
      filtered = filtered.filter(n => 
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredNotifications(filtered);
  }, [notifications, activeFilter, searchQuery]);

  const loadNotifications = async (isRefresh = false) => {
    if (!user?.id) return;

    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const data = await notificationService.getUserNotifications(user.id);
      setNotifications(data);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  const handleRefresh = async () => {
    await loadNotifications(true);

    // Also force refresh the notification count in the button
    if (user?.id) {
      // Clear cache to force fresh data
      const { NotificationPollingManager } = await import('@/utils/notification-polling');
      const pollingManager = NotificationPollingManager.getInstance();
      pollingManager.clearNotificationCache(user.id);

      // Trigger refresh on the notification button if available
      if ((window as any).refreshNotificationCount) {
        (window as any).refreshNotificationCount();
      }
    }
  };

  const handleMarkAsRead = async (notification: Notification) => {
    if (notification.is_read) return;
    
    const success = await notificationService.markAsRead(notification.id);
    if (success) {
      setNotifications(prev => 
        prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n)
      );
    }
  };

  const handleMarkAllAsRead = async () => {
    const count = await notificationService.markAllAsRead();
    if (count > 0) {
      setNotifications(prev => 
        prev.map(n => ({ ...n, is_read: true }))
      );
    }
  };

  const handleDelete = async (notificationId: string) => {
    const success = await notificationService.deleteNotification(notificationId);
    if (success) {
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      if (selectedNotification?.id === notificationId) {
        setSelectedNotification(null);
      }
    }
  };

  const selectNotification = (notification: Notification) => {
    setSelectedNotification(notification);
    handleMarkAsRead(notification);

    // Trên mobile, mở modal thay vì hiển thị trong sidebar
    if (window.innerWidth < 1024) {
      // Modal sẽ được handle bởi state selectedNotification
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="flex h-[700px] bg-background rounded-lg overflow-hidden border relative">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Outlook style navigation với toggle */}
      <div className={`
        w-56 bg-background border-r flex flex-col transition-transform duration-300 ease-in-out z-50
        ${sidebarOpen ? 'translate-x-0 shadow-lg' : '-translate-x-full'}
        lg:translate-x-0 lg:relative lg:z-auto lg:shadow-none
        fixed lg:static inset-y-0 left-0
      `}>
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <Inbox className="w-5 h-5" />
            Hộp thư đến
          </h2>
          {/* Close button for mobile */}
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="p-4 space-y-2">
          <Button
            variant={activeFilter === 'all' ? 'default' : 'ghost'}
            className="w-full justify-start text-sm"
            onClick={() => {
              setActiveFilter('all');
              // Đóng sidebar trên mobile sau khi chọn
              if (window.innerWidth < 1024) setSidebarOpen(false);
            }}
          >
            <Mail className="mr-2 h-4 w-4" />
            Tất cả
            {notifications.length > 0 && (
              <Badge variant="secondary" className="ml-auto">
                {notifications.length}
              </Badge>
            )}
          </Button>
          
          <Button
            variant={activeFilter === 'unread' ? 'default' : 'ghost'}
            className="w-full justify-start text-sm"
            onClick={() => {
              setActiveFilter('unread');
              if (window.innerWidth < 1024) setSidebarOpen(false);
            }}
          >
            <AlertCircle className="mr-2 h-4 w-4" />
            Chưa đọc
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-auto">
                {unreadCount}
              </Badge>
            )}
          </Button>

          <Button
            variant={activeFilter === 'important' ? 'default' : 'ghost'}
            className="w-full justify-start text-sm"
            onClick={() => {
              setActiveFilter('important');
              if (window.innerWidth < 1024) setSidebarOpen(false);
            }}
          >
            <Star className="mr-2 h-4 w-4" />
            Quan trọng
          </Button>
        </div>

        <div className="mt-auto p-4 border-t space-y-2">
          <Tooltip
            content="Kiểm tra thông báo mới ngay lập tức thay vì đợi 12 tiếng"
            side="top"
          >
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Đang cập nhật...' : 'Cập nhật thông báo'}
            </Button>
          </Tooltip>

          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={handleMarkAllAsRead}
            disabled={unreadCount === 0}
          >
            <CheckCheck className="mr-2 h-4 w-4" />
            Đánh dấu tất cả đã đọc
          </Button>
        </div>
      </div>

      {/* Message List - Outlook style */}
      <div className="flex-1 flex">
        <div className="w-full lg:w-[350px] border-r flex flex-col">
          {/* Search and Filter Bar với Toggle Button */}
          <div className="p-3 border-b space-y-2">
            <div className="flex items-center gap-2">
              {/* Toggle Sidebar Button - chỉ hiện trên mobile/tablet */}
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="w-4 h-4" />
              </Button>

              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Tìm kiếm thông báo..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>

          {/* Message List */}
          <ScrollArea className="flex-1">
            {loading ? (
              <div className="p-4 text-center text-muted-foreground">
                Đang tải...
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                Không có thông báo nào
              </div>
            ) : (
              <div className="divide-y">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => selectNotification(notification)}
                    className={`p-3 cursor-pointer hover:bg-muted/50 transition-colors ${
                      selectedNotification?.id === notification.id ? 'bg-muted' : ''
                    } ${!notification.is_read ? 'bg-blue-50/50' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${getTypeColor(notification.type)}`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className={`text-sm ${!notification.is_read ? 'font-semibold' : 'font-medium'} truncate`}>
                            {notification.title}
                          </h4>
                          {notification.is_important && (
                            <Star className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                          {notification.content}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Clock className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(notification.created_at), {
                              addSuffix: true,
                              locale: vi
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Message Preview - Outlook style với responsive */}
        <div className="hidden lg:flex flex-1 flex-col bg-background">
          {selectedNotification ? (
            <>
              {/* Message Header */}
              <div className="p-4 border-b">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${getTypeColor(selectedNotification.type)}`}>
                      {getNotificationIcon(selectedNotification.type)}
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold">{selectedNotification.title}</h2>
                      <p className="text-sm text-muted-foreground">
                        {new Date(selectedNotification.created_at).toLocaleString('vi-VN')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedNotification.is_important && (
                      <Badge variant="default">Quan trọng</Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(selectedNotification.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Message Content */}
              <ScrollArea className="flex-1">
                <div className="p-6">
                  <div className="prose prose-sm max-w-none">
                    <p className="whitespace-pre-wrap">{selectedNotification.content}</p>
                  </div>

                  {/* Metadata Display */}
                  {selectedNotification.metadata && Object.keys(selectedNotification.metadata).length > 0 && (
                    <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                      <h3 className="text-sm font-semibold mb-2">Chi tiết</h3>
                      <dl className="space-y-1">
                        {selectedNotification.metadata.amount && (
                          <div className="flex justify-between text-sm">
                            <dt className="text-muted-foreground">Số tiền:</dt>
                            <dd className="font-medium">${selectedNotification.metadata.amount.toFixed(2)}</dd>
                          </div>
                        )}
                        {selectedNotification.metadata.plan_type && (
                          <div className="flex justify-between text-sm">
                            <dt className="text-muted-foreground">Gói:</dt>
                            <dd className="font-medium">
                              {selectedNotification.metadata.plan_type === 'monthly' ? 'Tháng' : 'Năm'}
                            </dd>
                          </div>
                        )}
                        {selectedNotification.metadata.code && (
                          <div className="flex justify-between text-sm">
                            <dt className="text-muted-foreground">Mã:</dt>
                            <dd className="font-mono font-medium">{selectedNotification.metadata.code}</dd>
                          </div>
                        )}
                      </dl>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Mail className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>Chọn một thông báo để xem chi tiết</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Modal cho Notification Detail */}
      {selectedNotification && (
        <div className="lg:hidden fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-background w-full max-h-[90vh] rounded-t-lg overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold">Chi tiết thông báo</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedNotification(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Modal Content */}
            <div className="p-4 max-h-[calc(90vh-80px)] overflow-y-auto">
              <div className="space-y-4">
                {/* Notification Header */}
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${getTypeColor(selectedNotification.type)}`}>
                    {getNotificationIcon(selectedNotification.type)}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold">{selectedNotification.title}</h2>
                    <p className="text-sm text-muted-foreground">
                      {new Date(selectedNotification.created_at).toLocaleString('vi-VN')}
                    </p>
                    {selectedNotification.is_important && (
                      <Badge variant="default" className="mt-2">Quan trọng</Badge>
                    )}
                  </div>
                </div>

                {/* Notification Content */}
                <div className="prose prose-sm max-w-none">
                  <p className="whitespace-pre-wrap">{selectedNotification.content}</p>
                </div>

                {/* Metadata Display */}
                {selectedNotification.metadata && Object.keys(selectedNotification.metadata).length > 0 && (
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h3 className="text-sm font-semibold mb-2">Chi tiết</h3>
                    <dl className="space-y-1">
                      {selectedNotification.metadata.amount && (
                        <div className="flex justify-between text-sm">
                          <dt>Số tiền:</dt>
                          <dd className="font-medium">{selectedNotification.metadata.amount}</dd>
                        </div>
                      )}
                      {selectedNotification.metadata.code && (
                        <div className="flex justify-between text-sm">
                          <dt>Mã:</dt>
                          <dd className="font-mono">{selectedNotification.metadata.code}</dd>
                        </div>
                      )}
                      {selectedNotification.metadata.status && (
                        <div className="flex justify-between text-sm">
                          <dt>Trạng thái:</dt>
                          <dd>{selectedNotification.metadata.status}</dd>
                        </div>
                      )}
                    </dl>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(selectedNotification.id)}
                    className="flex-1"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Xóa
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => setSelectedNotification(null)}
                    className="flex-1"
                  >
                    Đóng
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationInbox;

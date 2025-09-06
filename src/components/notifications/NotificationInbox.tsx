'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip } from '@/components/ui/tooltip';
import {
  Mail,
  Inbox,
  Star,
  Clock,
  Search,
  CheckCheck,
  Trash2,
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
import { useAuth } from '@/contexts/auth-context';
import { useTranslations } from '@/hooks/use-translations';
import { formatDistanceToNow } from 'date-fns';
import { vi, enUS, ja } from 'date-fns/locale';
import enTranslations from '@/translations/en.json';
import jpTranslations from '@/translations/jp.json';
import { useDebounce } from '@/hooks/use-debounce';
import { useToast } from '@/components/ui/toast';

interface NotificationInboxProps {
  onClose?: () => void;
}

const NotificationInbox: React.FC<NotificationInboxProps> = ({ onClose }) => {
  const { user } = useAuth();
  const { t, language } = useTranslations();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'important'>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const listRef = useRef<HTMLDivElement | null>(null);

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

  // Type color mapping - dark/light friendly
  const getTypeColor = (type: NotificationType) => {
    switch (type) {
      case 'top_up_success':
        return 'text-emerald-400 bg-emerald-500/10 ring-1 ring-inset ring-emerald-500/20';
      case 'premium_upgrade':
        return 'text-purple-400 bg-purple-500/10 ring-1 ring-inset ring-purple-500/20';
      case 'redeem_code':
        return 'text-blue-400 bg-blue-500/10 ring-1 ring-inset ring-blue-500/20';
      case 'admin_message':
        return 'text-amber-400 bg-amber-500/10 ring-1 ring-inset ring-amber-500/20';
      default:
        return 'text-slate-400 bg-slate-500/10 ring-1 ring-inset ring-slate-500/20';
    }
  };

  // Load notifications
  useEffect(() => {
    if (user?.id) {
      loadNotifications();
    }
  }, [user]);

  // Accessibility: announce updates
  const { info: toastInfo, success: toastSuccess } = useToast();
  const debouncedQuery = useDebounce(searchQuery, 250);

  const filteredNotifications = useMemo(() => {
    let filtered = [...notifications];

    if (activeFilter === 'unread') {
      filtered = filtered.filter((n) => !n.is_read);
    } else if (activeFilter === 'important') {
      filtered = filtered.filter((n) => n.is_important);
    }

    if (debouncedQuery) {
      const q = debouncedQuery.toLowerCase();
      filtered = filtered.filter(
        (n) => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)
      );
    }

    return filtered;
  }, [notifications, activeFilter, debouncedQuery]);

  const dfLocale = useMemo(() => (language === 'en' ? enUS : language === 'jp' ? ja : vi), [language]);

  const loadNotifications = useCallback(async (isRefresh = false) => {
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
  }, [user?.id]);

  const localeStr = useMemo(() => (language === 'en' ? 'en-US' : language === 'jp' ? 'ja-JP' : 'vi-VN'), [language]);

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

    // Announce refresh
    try { toastSuccess?.(t('notifications.inbox.actions.refreshDone') || 'Notifications refreshed'); } catch {}
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

    // Scroll into view
    const item = listRef.current?.querySelector(`[id="notif-item-${notification.id}"]`);
    item?.scrollIntoView({ block: 'nearest' });

    // {t('notifications.inbox.comments.mobileModal')}
    if (window.innerWidth < 1024) {
      // Modal will be handled by selectedNotification state
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  // Simple string formatter for {placeholders}
  const formatString = (template: string, params: Record<string, string>) => {
    return template.replace(/\{(\w+)\}/g, (_, key) => params[key] ?? '');
  };

  // Build additional EN/JP texts for known notification types
  const getAdditionalLanguageBlocks = (n: Notification) => {
    if (n.type === 'premium_upgrade') {
      const plan = n.metadata?.plan_type === 'yearly'
        ? (enTranslations as any).notifications?.templates?.premiumUpgrade?.planYearly || 'Yearly'
        : (enTranslations as any).notifications?.templates?.premiumUpgrade?.planMonthly || 'Monthly';
      const planJp = n.metadata?.plan_type === 'yearly'
        ? (jpTranslations as any).notifications?.templates?.premiumUpgrade?.planYearly || '年間'
        : (jpTranslations as any).notifications?.templates?.premiumUpgrade?.planMonthly || '月間';

      const dateEn = n.metadata?.expires_at && typeof n.metadata.expires_at === 'string' 
        ? new Date(n.metadata.expires_at).toLocaleDateString('en-US') : '';
      const dateJp = n.metadata?.expires_at && typeof n.metadata.expires_at === 'string' 
        ? new Date(n.metadata.expires_at).toLocaleDateString('ja-JP') : '';

      const enTitle = (enTranslations as any).notifications?.templates?.premiumUpgrade?.title || 'Premium upgraded successfully';
      const enContentTpl = (enTranslations as any).notifications?.templates?.premiumUpgrade?.content || 'Congratulations! You upgraded to Premium {plan}. Your Premium will expire on {date}.';
      const enContent = formatString(enContentTpl, { plan, date: dateEn });

      const jpTitle = (jpTranslations as any).notifications?.templates?.premiumUpgrade?.title || 'プレミアムのアップグレードに成功しました';
      const jpContentTpl = (jpTranslations as any).notifications?.templates?.premiumUpgrade?.content || 'おめでとうございます！プレミアム{plan}にアップグレードしました。プレミアムは{date}に失効します。';
      const jpContent = formatString(jpContentTpl, { plan: planJp, date: dateJp });

      return (
        <div className="mt-4 space-y-2 text-sm">
          <div className="opacity-70">
            <div className="font-medium">EN</div>
            <div>{enTitle}</div>
            <div className="whitespace-pre-wrap">{enContent}</div>
          </div>
          <div className="opacity-70">
            <div className="font-medium">日本語</div>
            <div>{jpTitle}</div>
            <div className="whitespace-pre-wrap">{jpContent}</div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex h-full bg-background rounded-lg overflow-hidden border relative">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed left-0 right-0 bottom-0 top-16 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Outlook style navigation với toggle */}
      <div className={`
        w-56 bg-background border-r flex flex-col transition-transform duration-300 ease-in-out z-50 overflow-y-auto
        ${sidebarOpen ? 'translate-x-0 shadow-lg' : '-translate-x-full'}
        lg:translate-x-0 lg:relative lg:z-auto lg:shadow-none
        fixed lg:static left-0 top-16 bottom-0
      `}>
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <Inbox className="w-5 h-5" />
            {t('notifications.inbox.title')}
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
        
        <div className="p-4 space-y-2 flex-1 overflow-y-auto">
          <Button
            variant={activeFilter === 'all' ? 'default' : 'ghost'}
            className="w-full justify-start text-sm"
            onClick={() => {
              setActiveFilter('all');
              // {t('notifications.inbox.comments.closeSidebarAfterSelect')}
              if (window.innerWidth < 1024) setSidebarOpen(false);
            }}
          >
            <Mail className="mr-2 h-4 w-4" />
            {t('notifications.inbox.filters.all')}
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
            {t('notifications.inbox.filters.unread')}
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
            {t('notifications.inbox.filters.important')}
          </Button>
        </div>

        <div className="mt-auto p-4 border-t space-y-2">
          <Tooltip
            content={t('notifications.inbox.comments.tooltipRefresh')}
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
              {refreshing ? t('notifications.inbox.actions.refreshing') : t('notifications.inbox.actions.refresh')}
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
            {t('notifications.inbox.actions.markAllRead')}
          </Button>
        </div>
      </div>

      {/* Message List - Outlook style */}
      <div className="flex-1 flex">
        <div className="w-full lg:w-[350px] border-r flex flex-col">
          {/* {t('notifications.inbox.comments.searchAndFilter')} */}
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
                  placeholder={t('notifications.inbox.search.placeholder')}
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
                {t('notifications.inbox.states.loading')}
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Mail className="w-8 h-8 mx-auto mb-3 opacity-30" />
                {t('notifications.inbox.states.noNotifications')}
              </div>
            ) : (
              <div
                ref={listRef}
                role="listbox"
                aria-label={t('notifications.inbox.title')}
                aria-activedescendant={`notif-item-${filteredNotifications[focusedIndex]?.id ?? ''}`}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setFocusedIndex((i) => Math.min(i + 1, filteredNotifications.length - 1));
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setFocusedIndex((i) => Math.max(i - 1, 0));
                  } else if (e.key === 'Enter') {
                    const n = filteredNotifications[focusedIndex];
                    if (n) selectNotification(n);
                  }
                }}
                className="divide-y outline-none"
              >
                {filteredNotifications.map((notification, idx) => (
                  <div
                    id={`notif-item-${notification.id}`}
                    data-item
                    role="option"
                    aria-selected={selectedNotification?.id === notification.id}
                    key={notification.id}
                    onClick={() => selectNotification(notification)}
                    className={`p-3 cursor-pointer hover:bg-muted/50 transition-colors ${
                      selectedNotification?.id === notification.id ? 'bg-muted' : ''
                    } ${!notification.is_read ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''} ${
                      idx === focusedIndex ? 'ring-2 ring-primary/50' : ''
                    }`}
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
                              locale: dfLocale
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

        {/* {t('notifications.inbox.comments.outlookStylePreview')} */}
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
                        {new Date(selectedNotification.created_at).toLocaleString(localeStr)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedNotification.is_important && (
                      <Badge variant="default">{t('notifications.inbox.details.important')}</Badge>
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
                      <h3 className="text-sm font-semibold mb-2">{t('notifications.inbox.details.metadata.title')}</h3>
                      <dl className="space-y-1">
                        {(selectedNotification.metadata.amount && typeof selectedNotification.metadata.amount === 'number') ? (
                          <div className="flex justify-between text-sm">
                            <dt className="text-muted-foreground">{t('notifications.inbox.details.metadata.amount')}</dt>
                            <dd className="font-medium">${selectedNotification.metadata.amount.toFixed(2)}</dd>
                          </div>
                        ) : null}
                        {(selectedNotification.metadata.transaction_id && typeof selectedNotification.metadata.transaction_id === 'string') ? (
                          <div className="flex justify-between text-sm">
                            <dt className="text-muted-foreground">{t('notifications.inbox.details.metadata.orderId')}</dt>
                            <dd className="font-mono font-medium">{selectedNotification.metadata.transaction_id}</dd>
                          </div>
                        ) : null}
                        {(selectedNotification.metadata.code && typeof selectedNotification.metadata.code === 'string') ? (
                          <div className="flex justify-between text-sm">
                            <dt className="text-muted-foreground">{t('notifications.inbox.details.metadata.code')}</dt>
                            <dd className="font-mono font-medium">{selectedNotification.metadata.code}</dd>
                          </div>
                        ) : null}
                      </dl>
                    </div>
                  )}
                  {getAdditionalLanguageBlocks(selectedNotification)}
                </div>
              </ScrollArea>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Mail className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>{t('notifications.inbox.states.selectNotification')}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Modal cho Notification Detail */}
      {selectedNotification && (
        <div className="lg:hidden fixed left-0 right-0 bottom-0 top-16 bg-black/50 z-50 flex items-end">
          <div className="bg-background w-full max-h-[90vh] rounded-t-lg overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold">{t('notifications.inbox.details.title')}</h3>
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
                      <Badge variant="default" className="mt-2">{t('notifications.inbox.details.important')}</Badge>
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
                    <h3 className="text-sm font-semibold mb-2">{t('notifications.inbox.details.metadata.title')}</h3>
                    <dl className="space-y-1">
                      {(selectedNotification.metadata.amount && (typeof selectedNotification.metadata.amount === 'string' || typeof selectedNotification.metadata.amount === 'number')) ? (
                        <div className="flex justify-between text-sm">
                          <dt>{t('notifications.inbox.details.metadata.amount')}</dt>
                          <dd className="font-medium">{String(selectedNotification.metadata.amount)}</dd>
                        </div>
                      ) : null}
                      {(selectedNotification.metadata.transaction_id && typeof selectedNotification.metadata.transaction_id === 'string') ? (
                        <div className="flex justify-between text-sm">
                          <dt>{t('notifications.inbox.details.metadata.orderId')}</dt>
                          <dd className="font-mono">{selectedNotification.metadata.transaction_id}</dd>
                        </div>
                      ) : null}
                      {(selectedNotification.metadata.code && typeof selectedNotification.metadata.code === 'string') ? (
                        <div className="flex justify-between text-sm">
                          <dt>{t('notifications.inbox.details.metadata.code')}</dt>
                          <dd className="font-mono">{selectedNotification.metadata.code}</dd>
                        </div>
                      ) : null}
                      {(selectedNotification.metadata.status && typeof selectedNotification.metadata.status === 'string') ? (
                        <div className="flex justify-between text-sm">
                          <dt>{t('notifications.inbox.details.metadata.status')}</dt>
                          <dd>{selectedNotification.metadata.status}</dd>
                        </div>
                      ) : null}
                    </dl>
                  </div>
                )}
                {getAdditionalLanguageBlocks(selectedNotification)}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(selectedNotification.id)}
                    className="flex-1"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    {t('notifications.inbox.actions.delete')}
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => setSelectedNotification(null)}
                    className="flex-1"
                  >
                    {t('notifications.inbox.actions.close')}
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

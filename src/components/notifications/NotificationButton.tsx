'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

import { Bell, BellDot } from 'lucide-react';
import { notificationService } from '@/services/notification-service';
import { useAuth } from '@/contexts/auth-context';
import { useTranslations } from '@/hooks/use-translations';
import NotificationInbox from './NotificationInbox';
import { NotificationPollingManager, createPollingConfig } from '@/utils/notification-polling';



const NotificationButton: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslations();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showInbox, setShowInbox] = useState(false);

  useEffect(() => {
    if (user?.id) {
      const pollingManager = NotificationPollingManager.getInstance();

      const load = async (forceRefresh = false) => {
        // Check cache first (unless force refresh)
        if (!forceRefresh) {
          const cachedCount = pollingManager.getCachedNotificationCount(user.id);
          if (cachedCount !== null) {
            setUnreadCount(cachedCount);
            return;
          }
        }

        // Fetch from server
        const count = await notificationService.getUnreadCount(user.id);
        setUnreadCount(count);
        pollingManager.cacheNotificationCount(user.id, count);
      };

      // Expose refresh function globally for inbox to use
      (window as any).refreshNotificationCount = () => load(true);

      // Load immediately on mount
      load();

      // Set up polling with the manager
      const config = createPollingConfig(user.id);
      pollingManager.startPolling(config, load);

      // Set up real-time listener for important notifications
      const channel = notificationService.subscribeToImportantNotifications(user.id, (notification) => {
        console.log('Received important notification:', notification.type);
        // Clear cache and reload immediately for important notifications
        pollingManager.clearNotificationCache(user.id);
        load();
      });

      if (channel) {
        pollingManager.addSubscription(user.id, channel);
      }

      return () => {
        pollingManager.cleanup(user.id);
        if (channel) {
          notificationService.unsubscribeFromNotifications(channel);
        }
      };
    }
  }, [user])

  const handleOpenInbox = () => setShowInbox(true)

  const handleCloseInbox = () => {
    setShowInbox(false)
  }

  return (
    <>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 bg-background/80 border border-border/50 text-foreground hover-brightness-light focus-button relative"
            aria-label={t('notifications.button.ariaLabel')}
            onClick={handleOpenInbox}
          >
            {unreadCount > 0 ? (
              <>
                <BellDot className="h-5 w-5" />
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Badge>
              </>
            ) : (
              <Bell className="h-5 w-5" />
            )}
          </Button>

      <Dialog open={showInbox} onOpenChange={setShowInbox}>
        <DialogContent className="max-w-[1200px] h-[80vh] p-0 flex flex-col">
          <DialogHeader className="px-4 py-2 border-b">
            <DialogTitle className="text-base">{t('notifications.button.dialogTitle')}</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {t('notifications.button.dialogDescription') || 'View and manage your notifications'}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            <NotificationInbox onClose={handleCloseInbox} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default NotificationButton;

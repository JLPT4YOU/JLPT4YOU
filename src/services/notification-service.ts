import { createClient } from '@/utils/supabase/client';
import { CreateNotificationDto, Notification } from "@/types/notification";

class NotificationService {
  private supabase = createClient();

  /**
   * Create a new notification
   */
  async createNotification(data: CreateNotificationDto): Promise<Notification | null> {
    try {
      const { data: notification, error } = await this.supabase
        .from('notifications')
        .insert([data] as any)
        .select()
        .single();

      if (error) {
        console.error('Error creating notification:', error);
        return null;
      }

      return notification as any;
    } catch (error) {
      console.error('Error in createNotification:', error);
      return null;
    }
  }

  /**
   * Get all notifications for a user
   */
  async getUserNotifications(userId: string): Promise<Notification[]> {
    try {
      const { data, error } = await this.supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId as any)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching notifications:', error);
        return [];
      }

      return (data as any) || [];
    } catch (error) {
      console.error('Error in getUserNotifications:', error);
      return [];
    }
  }

  /**
   * Get unread notifications count with caching
   */
  async getUnreadCount(userId: string, forceRefresh = false): Promise<number> {
    try {
      // Check cache first (valid for 5 minutes for regular checks)
      const cacheKey = `unread_count_${userId}`
      const cached = localStorage.getItem(cacheKey)
      const cacheTime = localStorage.getItem(`${cacheKey}_time`)

      if (!forceRefresh && cached && cacheTime) {
        const cacheAge = Date.now() - parseInt(cacheTime)
        const fiveMinutes = 5 * 60 * 1000

        if (cacheAge < fiveMinutes) {
          return parseInt(cached)
        }
      }

      const { data, error } = await this.supabase
        .rpc('get_unread_notification_count', { p_user_id: userId });

      if (error) {
        console.error('Error getting unread count:', error);
        return 0;
      }

      const count = data || 0

      // Cache the result
      localStorage.setItem(cacheKey, count.toString())
      localStorage.setItem(`${cacheKey}_time`, Date.now().toString())

      return count as number;
    } catch (error) {
      console.error('Error in getUnreadCount:', error);
      return 0;
    }
  }

  /**
   * Force refresh unread count (bypass cache)
   */
  async forceRefreshUnreadCount(userId: string): Promise<number> {
    return this.getUnreadCount(userId, true);
  }

  /**
   * Subscribe to important notifications (admin_message, premium_upgrade, etc.)
   * These should be delivered immediately
   */
  subscribeToImportantNotifications(userId: string, callback: (notification: Notification) => void) {
    try {
      const channel = this.supabase
        .channel(`important_notifications_${userId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            const notification = payload.new as Notification

            // Only trigger for important notifications or admin messages
            if (notification.is_important ||
                notification.type === 'admin_message' ||
                notification.type === 'premium_upgrade' ||
                notification.type === 'system') {

              // Clear cache to force refresh
              const cacheKey = `unread_count_${userId}`
              localStorage.removeItem(cacheKey)
              localStorage.removeItem(`${cacheKey}_time`)

              callback(notification)
            }
          }
        )
        .subscribe()

      return channel
    } catch (error) {
      console.error('Error subscribing to notifications:', error)
      return null
    }
  }

  /**
   * Unsubscribe from notifications
   */
  unsubscribeFromNotifications(channel: any) {
    try {
      if (channel) {
        this.supabase.removeChannel(channel)
      }
    } catch (error) {
      console.error('Error unsubscribing from notifications:', error)
    }
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .rpc('mark_notification_read', { p_notification_id: notificationId });

      if (error) {
        console.error('Error marking notification as read:', error);
        return false;
      }

      return (data as any) || false;
    } catch (error) {
      console.error('Error in markAsRead:', error);
      return false;
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<number> {
    try {
      const { data, error } = await this.supabase
        .rpc('mark_all_notifications_read');

      if (error) {
        console.error('Error marking all as read:', error);
        return 0;
      }

      return (data as any) || 0;
    } catch (error) {
      console.error('Error in markAllAsRead:', error);
      return 0;
    }
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId as any);

      if (error) {
        console.error('Error deleting notification:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteNotification:', error);
      return false;
    }
  }

  /**
   * Send notification for successful top-up
   */
  async sendTopUpNotification(userId: string, amount: number, transactionId?: string): Promise<void> {
    await this.createNotification({
      user_id: userId,
      type: 'top_up_success',
      title: 'Nạp tiền thành công',
      content: `Bạn đã nạp thành công $${amount.toFixed(2)} vào tài khoản.`,
      metadata: {
        amount,
        transaction_id: transactionId
      },
      is_important: true
    });
  }

  /**
   * Send notification for premium upgrade
   */
  async sendPremiumUpgradeNotification(userId: string, planType: 'monthly' | 'yearly', expiresAt: string): Promise<void> {
    const planName = planType === 'monthly' ? 'tháng' : 'năm';
    await this.createNotification({
      user_id: userId,
      type: 'premium_upgrade',
      title: 'Nâng cấp Premium thành công',
      content: `Chúc mừng! Bạn đã nâng cấp lên gói Premium ${planName}. Tài khoản Premium của bạn sẽ hết hạn vào ${new Date(expiresAt).toLocaleDateString('vi-VN')}.`,
      metadata: {
        plan_type: planType,
        expires_at: expiresAt
      },
      is_important: true
    });
  }

  /**
   * Send notification for redeem code
   */
  async sendRedeemCodeNotification(userId: string, code: string, rewardType: string, rewardValue: any): Promise<void> {
    let content = `Bạn đã nhận được mã quà tặng ${code}.`;
    
    if (rewardType === 'premium_days') {
      content += ` Bạn được tặng ${rewardValue} ngày Premium!`;
    } else if (rewardType === 'balance') {
      content += ` Bạn được tặng $${rewardValue} vào tài khoản!`;
    }

    await this.createNotification({
      user_id: userId,
      type: 'redeem_code',
      title: 'Nhận mã quà tặng',
      content,
      metadata: {
        code,
        reward_type: rewardType,
        reward_value: rewardValue
      },
      is_important: true
    });
  }

  /**
   * Send admin message notification
   */
  async sendAdminMessage(userId: string, title: string, content: string, priority: 'low' | 'normal' | 'high' = 'normal'): Promise<void> {
    await this.createNotification({
      user_id: userId,
      type: 'admin_message',
      title,
      content,
      metadata: {
        priority
      },
      is_important: priority === 'high'
    });
  }

  /**
   * Send broadcast notification to all users
   */
  async sendBroadcastNotification(title: string, content: string, priority: 'low' | 'normal' | 'high' = 'normal'): Promise<void> {
    // Get all user IDs
    const { data: users, error } = await this.supabase
      .from('users')
      .select('id');

    if (error || !users) {
      console.error('Error fetching users for broadcast:', error);
      return;
    }

    // Create notifications for all users
    const notifications = users.map((user: any) => ({
      user_id: user.id,
      type: 'admin_message' as const,
      title,
      content,
      metadata: { priority },
      is_important: priority === 'high'
    }));

    const { error: insertError } = await this.supabase
      .from('notifications')
        .insert(notifications as any);

    if (insertError) {
      console.error('Error sending broadcast notification:', insertError);
    }
  }
}

export const notificationService = new NotificationService();

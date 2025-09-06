/**
 * Notification Polling Strategy
 * 
 * This utility manages notification checking to prevent server overload:
 * - Regular notifications: Check every 12 hours
 * - Important notifications: Real-time via Supabase subscriptions
 * - Cache results to avoid unnecessary API calls
 */

export interface NotificationPollingConfig {
  userId: string;
  regularCheckInterval: number; // milliseconds
  cacheTimeout: number; // milliseconds
}

export class NotificationPollingManager {
  private static instance: NotificationPollingManager;
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private subscriptions: Map<string, unknown> = new Map();

  private constructor() {}

  static getInstance(): NotificationPollingManager {
    if (!NotificationPollingManager.instance) {
      NotificationPollingManager.instance = new NotificationPollingManager();
    }
    return NotificationPollingManager.instance;
  }

  /**
   * Check if regular notification polling is needed
   */
  shouldPollRegularNotifications(userId: string): boolean {
    const lastCheck = localStorage.getItem(`notification_last_check_${userId}`);
    if (!lastCheck) return true;

    const lastCheckTime = new Date(lastCheck).getTime();
    const now = new Date().getTime();
    const twelveHours = 12 * 60 * 60 * 1000; // 12 hours in milliseconds

    return (now - lastCheckTime) >= twelveHours;
  }

  /**
   * Update last check timestamp
   */
  updateLastCheckTime(userId: string): void {
    localStorage.setItem(`notification_last_check_${userId}`, new Date().toISOString());
  }

  /**
   * Get cached notification count
   */
  getCachedNotificationCount(userId: string): number | null {
    const cacheKey = `unread_count_${userId}`;
    const cached = localStorage.getItem(cacheKey);
    const cacheTime = localStorage.getItem(`${cacheKey}_time`);

    if (cached && cacheTime) {
      const cacheAge = Date.now() - parseInt(cacheTime);
      const fiveMinutes = 5 * 60 * 1000;

      if (cacheAge < fiveMinutes) {
        return parseInt(cached);
      }
    }

    return null;
  }

  /**
   * Cache notification count
   */
  cacheNotificationCount(userId: string, count: number): void {
    const cacheKey = `unread_count_${userId}`;
    localStorage.setItem(cacheKey, count.toString());
    localStorage.setItem(`${cacheKey}_time`, Date.now().toString());
  }

  /**
   * Clear notification cache
   */
  clearNotificationCache(userId: string): void {
    const cacheKey = `unread_count_${userId}`;
    localStorage.removeItem(cacheKey);
    localStorage.removeItem(`${cacheKey}_time`);
  }

  /**
   * Start polling for a user
   */
  startPolling(config: NotificationPollingConfig, onUpdate: () => void): void {
    this.stopPolling(config.userId);

    const interval = setInterval(() => {
      if (this.shouldPollRegularNotifications(config.userId)) {
        onUpdate();
        this.updateLastCheckTime(config.userId);
      }
    }, config.regularCheckInterval);

    this.intervals.set(config.userId, interval);
  }

  /**
   * Stop polling for a user
   */
  stopPolling(userId: string): void {
    const interval = this.intervals.get(userId);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(userId);
    }
  }

  /**
   * Add real-time subscription
   */
  addSubscription(userId: string, subscription: unknown): void {
    this.removeSubscription(userId);
    this.subscriptions.set(userId, subscription);
  }

  /**
   * Remove real-time subscription
   */
  removeSubscription(userId: string): void {
    const subscription = this.subscriptions.get(userId);
    if (subscription) {
      // The actual unsubscribe logic should be handled by the service
      this.subscriptions.delete(userId);
    }
  }

  /**
   * Cleanup all resources for a user
   */
  cleanup(userId: string): void {
    this.stopPolling(userId);
    this.removeSubscription(userId);
  }

  /**
   * Cleanup all resources
   */
  cleanupAll(): void {
    this.intervals.forEach((interval) => clearInterval(interval));
    this.intervals.clear();
    this.subscriptions.clear();
  }

  /**
   * Get polling statistics for debugging
   */
  getStats(): {
    activePolling: number;
    activeSubscriptions: number;
    cachedUsers: string[];
  } {
    const cachedUsers: string[] = [];
    
    // Check localStorage for cached notification data
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('unread_count_') && !key.endsWith('_time')) {
        const userId = key.replace('unread_count_', '');
        cachedUsers.push(userId);
      }
    }

    return {
      activePolling: this.intervals.size,
      activeSubscriptions: this.subscriptions.size,
      cachedUsers
    };
  }
}

// Default configuration
export const DEFAULT_POLLING_CONFIG = {
  regularCheckInterval: 12 * 60 * 60 * 1000, // 12 hours
  cacheTimeout: 5 * 60 * 1000, // 5 minutes
};

// Utility functions
export const createPollingConfig = (userId: string, overrides?: Partial<NotificationPollingConfig>): NotificationPollingConfig => ({
  userId,
  ...DEFAULT_POLLING_CONFIG,
  ...overrides,
});

export const isImportantNotification = (type: string, isImportant: boolean): boolean => {
  return isImportant || ['admin_message', 'system', 'premium_upgrade'].includes(type);
};

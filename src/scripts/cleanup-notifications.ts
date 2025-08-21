/**
 * Notification Cleanup Script
 * 
 * This script helps maintain the notifications table by:
 * 1. Cleaning up old read notifications
 * 2. Removing expired notifications
 * 3. Optimizing database performance
 * 
 * Run this script periodically (e.g., daily via cron job)
 */

import { supabaseAdmin } from '@/utils/supabase/admin';

interface CleanupResult {
  deletedReadNotifications: number;
  deletedExpiredNotifications: number;
  totalDeleted: number;
  error?: string;
}

export async function cleanupNotifications(): Promise<CleanupResult> {
  const result: CleanupResult = {
    deletedReadNotifications: 0,
    deletedExpiredNotifications: 0,
    totalDeleted: 0
  };

  try {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not available');
    }


    // 1. Delete old read notifications (older than 30 days)
    // Keep admin and system messages longer
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    
    const { data: deletedRead, error: readError } = await supabaseAdmin
      .from('notifications')
      .delete()
      .eq('is_read', true)
      .lt('read_at', thirtyDaysAgo)
      .not('type', 'in', '(admin_message,system)')
      .select('id');

    if (readError) {
      console.error('Error deleting old read notifications:', readError);
    } else {
      result.deletedReadNotifications = deletedRead?.length || 0;
      console.log(`Deleted ${result.deletedReadNotifications} old read notifications`);
    }

    // 2. Delete expired notifications
    const now = new Date().toISOString();
    
    const { data: deletedExpired, error: expiredError } = await supabaseAdmin
      .from('notifications')
      .delete()
      .not('expires_at', 'is', null)
      .lt('expires_at', now)
      .select('id');

    if (expiredError) {
      console.error('Error deleting expired notifications:', expiredError);
    } else {
      result.deletedExpiredNotifications = deletedExpired?.length || 0;
      console.log(`Deleted ${result.deletedExpiredNotifications} expired notifications`);
    }

    // 3. Calculate total deleted
    result.totalDeleted = result.deletedReadNotifications + result.deletedExpiredNotifications;

    // 4. Vacuum analyze the table for better performance (PostgreSQL specific)
    // Note: This requires superuser privileges, so it might not work in hosted environments
    try {
      await supabaseAdmin.rpc('vacuum_analyze_notifications');
    } catch (vacuumError) {
    }

    
    return result;
  } catch (error) {
    console.error('Notification cleanup error:', error);
    result.error = error instanceof Error ? error.message : 'Unknown error';
    return result;
  }
}

export async function getNotificationStats() {
  try {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not available');
    }

    // Get total notifications
    const { count: totalCount } = await supabaseAdmin
      .from('notifications')
      .select('*', { count: 'exact', head: true });

    // Get unread notifications
    const { count: unreadCount } = await supabaseAdmin
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('is_read', false);

    // Get notifications by type
    const { data: typeData } = await supabaseAdmin
      .from('notifications')
      .select('type')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()); // Last 7 days

    const typeStats = typeData?.reduce((acc, notification) => {
      acc[notification.type] = (acc[notification.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    // Get old notifications that can be cleaned
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { count: cleanableCount } = await supabaseAdmin
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('is_read', true)
      .lt('read_at', thirtyDaysAgo)
      .not('type', 'in', '(admin_message,system)');

    return {
      total: totalCount || 0,
      unread: unreadCount || 0,
      readRate: totalCount ? Math.round(((totalCount - (unreadCount || 0)) / totalCount) * 100) : 0,
      typeStats,
      cleanable: cleanableCount || 0
    };
  } catch (error) {
    console.error('Error getting notification stats:', error);
    return null;
  }
}

// CLI interface for running the script
if (require.main === module) {
  async function main() {
    
    // Show current stats
    const stats = await getNotificationStats();
    if (stats) {
      Object.entries(stats.typeStats).forEach(([type, count]) => {
      });
    }

    // Run cleanup
    const result = await cleanupNotifications();
    
    if (result.error) {
      console.error('Cleanup failed:', result.error);
      process.exit(1);
    } else {
    }

    // Show updated stats
    const updatedStats = await getNotificationStats();
    if (updatedStats) {
    }
  }

  main().catch(console.error);
}

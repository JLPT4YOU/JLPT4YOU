/**
 * Admin Notifications Stats API
 * GET /api/admin/notifications/stats - get notification statistics
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/admin-auth';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminAuth(request);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const { supabaseAdmin } = await import('@/utils/supabase/admin');
    if (!supabaseAdmin) return NextResponse.json({ error: 'Server config error' }, { status: 500 });

    // Get notification statistics from the function
    const { data: stats, error: statsError } = await supabaseAdmin
      .rpc('get_notification_stats');

    if (statsError) {
      console.error('Error fetching notification stats:', statsError);
      return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
    }

    // Get additional metrics using the new function
    const { data: metrics, error: metricsError } = await supabaseAdmin
      .rpc('get_notification_metrics');

    if (metricsError) {
      console.error('Error fetching notification metrics:', metricsError);
      return NextResponse.json({ error: 'Failed to fetch metrics' }, { status: 500 });
    }

    // Get total users count
    const { count: totalUsers } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true });

    // Parse metrics from JSON
    const parsedMetrics = metrics || {};
    const readRate = parsedMetrics.total_notifications_24h
      ? Math.round(((parsedMetrics.total_notifications_24h - parsedMetrics.unread_notifications_24h) / parsedMetrics.total_notifications_24h) * 100)
      : 0;

    return NextResponse.json({
      success: true,
      stats: stats || [],
      metrics: {
        totalUsers: totalUsers || 0,
        totalNotifications24h: parsedMetrics.total_notifications_24h || 0,
        unreadNotifications24h: parsedMetrics.unread_notifications_24h || 0,
        importantNotifications24h: parsedMetrics.important_notifications_24h || 0,
        readRate,
        typeFrequency: parsedMetrics.type_frequency || {},
        serverLoad: {
          notificationsLastHour: parsedMetrics.notifications_last_hour || 0,
          averagePerMinute: parsedMetrics.notifications_last_hour
            ? Math.round(parsedMetrics.notifications_last_hour / 60)
            : 0,
        }
      }
    });
  } catch (err) {
    console.error('Admin notifications stats error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

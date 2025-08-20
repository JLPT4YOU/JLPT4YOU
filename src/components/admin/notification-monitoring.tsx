'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Activity, Users, Bell, AlertTriangle } from 'lucide-react';
import { NotificationPollingManager } from '@/utils/notification-polling';

interface NotificationStats {
  hour: string;
  type: string;
  count: number;
  read_count: number;
  important_count: number;
}

const NotificationMonitoring: React.FC = () => {
  const [stats, setStats] = useState<NotificationStats[]>([]);
  const [pollingStats, setPollingStats] = useState({
    activePolling: 0,
    activeSubscriptions: 0,
    cachedUsers: [] as string[]
  });
  const [loading, setLoading] = useState(false);

  const [metrics, setMetrics] = useState({
    totalUsers: 0,
    totalNotifications24h: 0,
    unreadNotifications24h: 0,
    importantNotifications24h: 0,
    readRate: 0,
    typeFrequency: {} as Record<string, number>,
    serverLoad: { notificationsLastHour: 0, averagePerMinute: 0 }
  });

  const loadStats = async () => {
    setLoading(true);
    try {
      // Load notification stats from database
      const response = await fetch('/api/admin/notifications/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats || []);
        setMetrics(data.metrics || {});
      }

      // Get client-side polling stats
      const manager = NotificationPollingManager.getInstance();
      setPollingStats(manager.getStats());
    } catch (error) {
      console.error('Error loading notification stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const getNotificationsByType = () => {
    return Object.entries(metrics.typeFrequency || {}).map(([type, count]) => ({
      type,
      count,
      read_count: 0, // Will be calculated from stats if needed
      important_count: 0 // Will be calculated from stats if needed
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Notification System Monitoring</h2>
        <Button onClick={loadStats} disabled={loading} size="sm">
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Notifications (24h)</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalNotifications24h}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Read Rate</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.readRate}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Important Notifications</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.importantNotifications24h}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalUsers}</div>
          </CardContent>
        </Card>
      </div>

      {/* Client-side Polling Status */}
      <Card>
        <CardHeader>
          <CardTitle>Client-side Polling Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Active Polling</div>
              <div className="text-lg font-semibold">{pollingStats.activePolling}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Real-time Subscriptions</div>
              <div className="text-lg font-semibold">{pollingStats.activeSubscriptions}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Cached Users</div>
              <div className="text-lg font-semibold">{pollingStats.cachedUsers.length}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications by Type */}
      <Card>
        <CardHeader>
          <CardTitle>Notifications by Type (24h)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {getNotificationsByType().map((data) => (
              <div key={data.type} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Badge variant="outline">{data.type}</Badge>
                  <div>
                    <div className="font-medium">{data.count} notifications</div>
                    <div className="text-sm text-muted-foreground">Last 24 hours</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Hourly Activity (Last 24h)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {stats.slice(0, 12).map((stat, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <span className="font-mono">{new Date(stat.hour).toLocaleTimeString()}</span>
                  <Badge variant="outline" className="text-xs">{stat.type}</Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <span>{stat.count} total</span>
                  <span className="text-muted-foreground">({stat.read_count} read)</span>
                  {stat.important_count > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {stat.important_count} important
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationMonitoring;

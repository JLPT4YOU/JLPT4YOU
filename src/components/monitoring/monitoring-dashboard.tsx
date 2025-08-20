'use client'

/**
 * 📊 MONITORING DASHBOARD COMPONENT
 * Real-time monitoring dashboard for authentication and system events
 */

import React, { useState, useEffect } from 'react'
import { getDashboardData, searchEvents, MonitoringEvent, SystemMetrics } from '@/lib/monitoring'

interface DashboardData {
  metrics: SystemMetrics
  recentEvents: MonitoringEvent[]
  alerts: any[]
}

export default function MonitoringDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [selectedTab, setSelectedTab] = useState<'overview' | 'events' | 'alerts'>('overview')
  const [eventFilter, setEventFilter] = useState<{
    type: string
    level: string
    timeRange: string
  }>({
    type: 'all',
    level: 'all',
    timeRange: '1h'
  })

  // Refresh dashboard data
  const refreshData = () => {
    try {
      const data = getDashboardData()
      setDashboardData(data)
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    }
  }

  // Auto-refresh every 30 seconds
  useEffect(() => {
    refreshData()
    const interval = setInterval(refreshData, 30000)
    return () => clearInterval(interval)
  }, [])

  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading monitoring data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Monitoring</h1>
          <p className="text-gray-600">Real-time authentication and security monitoring</p>
        </div>
        <button
          onClick={refreshData}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: '📊 Overview', count: null },
            { id: 'events', label: '📝 Events', count: dashboardData.recentEvents.length },
            { id: 'alerts', label: '🚨 Alerts', count: dashboardData.alerts.length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                selectedTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
              {tab.count !== null && (
                <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2 rounded-full text-xs">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      {selectedTab === 'overview' && (
        <OverviewTab metrics={dashboardData.metrics} />
      )}

      {selectedTab === 'events' && (
        <EventsTab 
          events={dashboardData.recentEvents}
          filter={eventFilter}
          onFilterChange={setEventFilter}
        />
      )}

      {selectedTab === 'alerts' && (
        <AlertsTab alerts={dashboardData.alerts} />
      )}
    </div>
  )
}

// Overview Tab Component
function OverviewTab({ metrics }: { metrics: SystemMetrics }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Authentication Metrics */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              🔐
            </div>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Auth Events</p>
            <p className="text-2xl font-semibold text-gray-900">{metrics.authEvents.total}</p>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex justify-between text-sm">
            <span className="text-green-600">✅ Success: {metrics.authEvents.successful}</span>
            <span className="text-red-600">❌ Failed: {metrics.authEvents.failed}</span>
          </div>
        </div>
      </div>

      {/* Security Events */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
              🛡️
            </div>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Security Events</p>
            <p className="text-2xl font-semibold text-gray-900">{metrics.securityEvents.violations}</p>
          </div>
        </div>
        <div className="mt-4">
          <div className="text-sm text-gray-600">
            Admin Access: {metrics.securityEvents.adminAccess}
          </div>
        </div>
      </div>

      {/* System Health */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              ⚡
            </div>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Response Time</p>
            <p className="text-2xl font-semibold text-gray-900">{Math.round(metrics.systemHealth.responseTime)}ms</p>
          </div>
        </div>
        <div className="mt-4">
          <div className="text-sm text-gray-600">
            Uptime: {Math.round(metrics.systemHealth.uptime / 3600)}h
          </div>
        </div>
      </div>

      {/* Migration Progress */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              🔄
            </div>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Migration</p>
            <p className="text-2xl font-semibold text-gray-900">
              {metrics.migrationProgress?.percentage || 0}%
            </p>
          </div>
        </div>
        <div className="mt-4">
          <div className="text-sm text-gray-600">
            Phase: {metrics.migrationProgress?.phase || 'Preparation'}
          </div>
        </div>
      </div>
    </div>
  )
}

// Events Tab Component
function EventsTab({ 
  events, 
  filter, 
  onFilterChange 
}: { 
  events: MonitoringEvent[]
  filter: any
  onFilterChange: (filter: any) => void
}) {
  const filteredEvents = events.filter(event => {
    if (filter.type !== 'all' && event.type !== filter.type) return false
    if (filter.level !== 'all' && event.level !== filter.level) return false
    return true
  })

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex space-x-4">
        <select
          value={filter.type}
          onChange={(e) => onFilterChange({ ...filter, type: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="all">All Types</option>
          <option value="auth">Authentication</option>
          <option value="security">Security</option>
          <option value="system">System</option>
          <option value="migration">Migration</option>
        </select>

        <select
          value={filter.level}
          onChange={(e) => onFilterChange({ ...filter, level: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="all">All Levels</option>
          <option value="info">Info</option>
          <option value="warn">Warning</option>
          <option value="error">Error</option>
          <option value="critical">Critical</option>
        </select>
      </div>

      {/* Events List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Events ({filteredEvents.length})</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {filteredEvents.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              No events found matching the current filters.
            </div>
          ) : (
            filteredEvents.map((event) => (
              <div key={event.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      event.level === 'critical' ? 'bg-red-100 text-red-800' :
                      event.level === 'error' ? 'bg-red-100 text-red-800' :
                      event.level === 'warn' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {event.type}
                    </span>
                    <span className="text-sm font-medium text-gray-900">{event.event}</span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                {event.userEmail && (
                  <div className="mt-1 text-sm text-gray-600">
                    User: {event.userEmail}
                  </div>
                )}
                {event.details && (
                  <div className="mt-2 text-xs text-gray-500 bg-gray-50 p-2 rounded">
                    {JSON.stringify(event.details, null, 2)}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

// Alerts Tab Component
function AlertsTab({ alerts }: { alerts: any[] }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Active Alerts</h3>
      </div>
      <div className="px-6 py-8 text-center text-gray-500">
        {alerts.length === 0 ? (
          <div>
            <div className="text-4xl mb-2">✅</div>
            <p>No active alerts. System is running normally.</p>
          </div>
        ) : (
          <div>
            <p>{alerts.length} active alerts</p>
            {/* TODO: Implement alert display */}
          </div>
        )}
      </div>
    </div>
  )
}

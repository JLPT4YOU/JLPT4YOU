/**
 * 📊 ENHANCED MONITORING SYSTEM
 * Comprehensive monitoring for authentication events and system health
 * Version: 1.0
 */

export interface MonitoringEvent {
  id: string
  timestamp: string
  type: 'auth' | 'security' | 'system' | 'migration' | 'error'
  level: 'info' | 'warn' | 'error' | 'critical'
  event: string
  userId?: string
  userEmail?: string
  ip?: string
  userAgent?: string
  details?: any
  metadata?: {
    source: string
    version: string
    environment: string
  }
}

export interface SystemMetrics {
  timestamp: string
  authEvents: {
    total: number
    successful: number
    failed: number
    rate: number
  }
  securityEvents: {
    violations: number
    adminAccess: number
    suspiciousActivity: number
  }
  systemHealth: {
    uptime: number
    responseTime: number
    errorRate: number
  }
  migrationProgress?: {
    phase: string
    percentage: number
    usersOnNewAuth: number
    totalUsers: number
  }
}

class MonitoringService {
  private events: MonitoringEvent[] = []
  private metrics: SystemMetrics | null = null
  private alertThresholds = {
    failedAuthRate: 0.1, // 10% failure rate
    securityViolations: 5, // per hour
    responseTime: 1000, // ms
    errorRate: 0.05 // 5% error rate
  }

  /**
   * 📝 LOG AUTHENTICATION EVENT
   */
  logAuthEvent(event: {
    event: string
    level: 'info' | 'warn' | 'error'
    userId?: string
    userEmail?: string
    ip?: string
    userAgent?: string
    details?: any
  }): void {
    const monitoringEvent: MonitoringEvent = {
      id: this.generateEventId(),
      timestamp: new Date().toISOString(),
      type: 'auth',
      level: event.level,
      event: event.event,
      userId: event.userId,
      userEmail: event.userEmail,
      ip: event.ip,
      userAgent: event.userAgent,
      details: event.details,
      metadata: {
        source: 'jlpt4you-auth',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development'
      }
    }

    this.addEvent(monitoringEvent)
    this.checkAlerts(monitoringEvent)
  }

  /**
   * 🚨 LOG SECURITY EVENT
   */
  logSecurityEvent(event: {
    event: string
    level: 'warn' | 'error' | 'critical'
    userId?: string
    userEmail?: string
    ip?: string
    userAgent?: string
    details?: any
  }): void {
    const monitoringEvent: MonitoringEvent = {
      id: this.generateEventId(),
      timestamp: new Date().toISOString(),
      type: 'security',
      level: event.level,
      event: event.event,
      userId: event.userId,
      userEmail: event.userEmail,
      ip: event.ip,
      userAgent: event.userAgent,
      details: event.details,
      metadata: {
        source: 'jlpt4you-security',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development'
      }
    }

    this.addEvent(monitoringEvent)
    this.checkAlerts(monitoringEvent)

    // Security events always get console output
    if (event.level === 'critical') {
      console.error('🚨 CRITICAL SECURITY EVENT:', monitoringEvent)
    } else if (event.level === 'error') {
      console.error('🔴 SECURITY ERROR:', monitoringEvent)
    } else {
      console.warn('⚠️ SECURITY WARNING:', monitoringEvent)
    }
  }

  /**
   * 🔄 LOG MIGRATION EVENT
   */
  logMigrationEvent(event: {
    event: string
    level: 'info' | 'warn' | 'error'
    phase?: string
    percentage?: number
    details?: any
  }): void {
    const monitoringEvent: MonitoringEvent = {
      id: this.generateEventId(),
      timestamp: new Date().toISOString(),
      type: 'migration',
      level: event.level,
      event: event.event,
      details: {
        ...event.details,
        phase: event.phase,
        percentage: event.percentage
      },
      metadata: {
        source: 'jlpt4you-migration',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development'
      }
    }

    this.addEvent(monitoringEvent)
    console.log(`🔄 MIGRATION: ${event.event}`, event.details)
  }

  /**
   * ⚙️ LOG SYSTEM EVENT
   */
  logSystemEvent(event: {
    event: string
    level: 'info' | 'warn' | 'error'
    details?: any
  }): void {
    const monitoringEvent: MonitoringEvent = {
      id: this.generateEventId(),
      timestamp: new Date().toISOString(),
      type: 'system',
      level: event.level,
      event: event.event,
      details: event.details,
      metadata: {
        source: 'jlpt4you-system',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development'
      }
    }

    this.addEvent(monitoringEvent)
  }

  /**
   * 📊 CALCULATE SYSTEM METRICS
   */
  calculateMetrics(): SystemMetrics {
    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)

    // Filter events from last hour
    const recentEvents = this.events.filter(
      event => new Date(event.timestamp) > oneHourAgo
    )

    const authEvents = recentEvents.filter(event => event.type === 'auth')
    const securityEvents = recentEvents.filter(event => event.type === 'security')

    const successfulAuth = authEvents.filter(
      event => event.event.includes('success') || event.level === 'info'
    ).length

    const failedAuth = authEvents.filter(
      event => event.event.includes('failed') || event.level === 'error'
    ).length

    const metrics: SystemMetrics = {
      timestamp: now.toISOString(),
      authEvents: {
        total: authEvents.length,
        successful: successfulAuth,
        failed: failedAuth,
        rate: authEvents.length / 60 // events per minute
      },
      securityEvents: {
        violations: securityEvents.filter(e => e.level === 'error').length,
        adminAccess: authEvents.filter(e => e.event.includes('admin')).length,
        suspiciousActivity: securityEvents.filter(e => e.level === 'warn').length
      },
      systemHealth: {
        uptime: 0, // Disabled for Edge Runtime compatibility
        responseTime: this.calculateAverageResponseTime(),
        errorRate: this.calculateErrorRate()
      }
    }

    this.metrics = metrics
    return metrics
  }

  /**
   * 🚨 CHECK FOR ALERTS
   */
  private checkAlerts(event: MonitoringEvent): void {
    const metrics = this.calculateMetrics()

    // Check failed auth rate
    if (metrics.authEvents.total > 0) {
      const failureRate = metrics.authEvents.failed / metrics.authEvents.total
      if (failureRate > this.alertThresholds.failedAuthRate) {
        this.sendAlert({
          type: 'high_auth_failure_rate',
          level: 'warn',
          message: `High authentication failure rate: ${(failureRate * 100).toFixed(1)}%`,
          metrics: metrics.authEvents
        })
      }
    }

    // Check security violations
    if (metrics.securityEvents.violations > this.alertThresholds.securityViolations) {
      this.sendAlert({
        type: 'security_violations',
        level: 'error',
        message: `High number of security violations: ${metrics.securityEvents.violations}`,
        metrics: metrics.securityEvents
      })
    }

    // Check critical security events
    if (event.type === 'security' && event.level === 'critical') {
      this.sendAlert({
        type: 'critical_security_event',
        level: 'critical',
        message: `Critical security event: ${event.event}`,
        event: event
      })
    }
  }

  /**
   * 📧 SEND ALERT
   */
  private sendAlert(alert: {
    type: string
    level: 'warn' | 'error' | 'critical'
    message: string
    event?: MonitoringEvent
    metrics?: any
  }): void {
    // In development, log to console
    if (process.env.NODE_ENV === 'development') {
      console.warn(`🚨 ALERT [${alert.level.toUpperCase()}]: ${alert.message}`, {
        type: alert.type,
        timestamp: new Date().toISOString(),
        event: alert.event,
        metrics: alert.metrics
      })
    }

    // In production, send to monitoring service
  }

  /**
   * 🔧 UTILITY METHODS
   */
  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private addEvent(event: MonitoringEvent): void {
    this.events.push(event)
    
    // Keep only last 1000 events in memory
    if (this.events.length > 1000) {
      this.events = this.events.slice(-1000)
    }
  }

  private calculateAverageResponseTime(): number {
    // Mock implementation - in production, track actual response times
    return Math.random() * 500 + 100 // 100-600ms
  }

  private calculateErrorRate(): number {
    const recentErrors = this.events.filter(
      event => event.level === 'error' && 
      new Date(event.timestamp) > new Date(Date.now() - 60 * 60 * 1000)
    ).length

    const totalEvents = this.events.filter(
      event => new Date(event.timestamp) > new Date(Date.now() - 60 * 60 * 1000)
    ).length

    return totalEvents > 0 ? recentErrors / totalEvents : 0
  }

  /**
   * 📊 GET DASHBOARD DATA
   */
  getDashboardData(): {
    metrics: SystemMetrics
    recentEvents: MonitoringEvent[]
    alerts: any[]
  } {
    const metrics = this.calculateMetrics()
    const recentEvents = this.events
      .slice(-50)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    return {
      metrics,
      recentEvents,
      alerts: []
    }
  }

  /**
   * 🔍 SEARCH EVENTS
   */
  searchEvents(filters: {
    type?: string
    level?: string
    userId?: string
    timeRange?: { start: string; end: string }
  }): MonitoringEvent[] {
    return this.events.filter(event => {
      if (filters.type && event.type !== filters.type) return false
      if (filters.level && event.level !== filters.level) return false
      if (filters.userId && event.userId !== filters.userId) return false
      if (filters.timeRange) {
        const eventTime = new Date(event.timestamp)
        const start = new Date(filters.timeRange.start)
        const end = new Date(filters.timeRange.end)
        if (eventTime < start || eventTime > end) return false
      }
      return true
    })
  }
}

// Singleton instance
export const monitoring = new MonitoringService()

// Convenience functions
export const logAuthEvent = (event: Parameters<typeof monitoring.logAuthEvent>[0]) => 
  monitoring.logAuthEvent(event)

export const logSecurityEvent = (event: Parameters<typeof monitoring.logSecurityEvent>[0]) => 
  monitoring.logSecurityEvent(event)

export const logMigrationEvent = (event: Parameters<typeof monitoring.logMigrationEvent>[0]) => 
  monitoring.logMigrationEvent(event)

export const logSystemEvent = (event: Parameters<typeof monitoring.logSystemEvent>[0]) => 
  monitoring.logSystemEvent(event)

export const getSystemMetrics = () => monitoring.calculateMetrics()
export const getDashboardData = () => monitoring.getDashboardData()
export const searchEvents = (filters: Parameters<typeof monitoring.searchEvents>[0]) => 
  monitoring.searchEvents(filters)

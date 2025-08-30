/**
 * 📊 AUTHENTICATION MIGRATION MONITORING
 * Real-time monitoring for migration metrics and health
 */

export interface MigrationMetrics {
  newAuthRequests: number
  legacyAuthRequests: number
  newAuthErrors: number
  legacyAuthErrors: number
  averageResponseTime: number
  rolloutPercentage: number
  startTime: number
  lastUpdated: number
}

export interface MigrationHealthCheck {
  status: 'healthy' | 'warning' | 'critical'
  errorRate: number
  responseTime: number
  uptime: number
  recommendedAction: string
}

/**
 * 📈 IN-MEMORY METRICS STORE
 * In production, this would be backed by Redis or a time-series database
 */
class MigrationMetricsStore {
  private metrics: MigrationMetrics = {
    newAuthRequests: 0,
    legacyAuthRequests: 0,
    newAuthErrors: 0,
    legacyAuthErrors: 0,
    averageResponseTime: 0,
    rolloutPercentage: 10,
    startTime: Date.now(),
    lastUpdated: Date.now()
  }

  private responseTimes: number[] = []
  private readonly maxResponseTimeEntries = 100

  /**
   * 📊 Record authentication request
   */
  recordAuthRequest(type: 'new' | 'legacy', responseTime: number, success: boolean): void {
    this.metrics.lastUpdated = Date.now()
    
    if (type === 'new') {
      this.metrics.newAuthRequests++
      if (!success) this.metrics.newAuthErrors++
    } else {
      this.metrics.legacyAuthRequests++
      if (!success) this.metrics.legacyAuthErrors++
    }

    // Track response times
    this.responseTimes.push(responseTime)
    if (this.responseTimes.length > this.maxResponseTimeEntries) {
      this.responseTimes.shift()
    }

    // Calculate average response time
    this.metrics.averageResponseTime = 
      this.responseTimes.reduce((sum, time) => sum + time, 0) / this.responseTimes.length
  }

  /**
   * 📊 Get current metrics
   */
  getMetrics(): MigrationMetrics {
    return { ...this.metrics }
  }

  /**
   * 🔄 Reset metrics
   */
  resetMetrics(): void {
    this.metrics = {
      newAuthRequests: 0,
      legacyAuthRequests: 0,
      newAuthErrors: 0,
      legacyAuthErrors: 0,
      averageResponseTime: 0,
      rolloutPercentage: this.metrics.rolloutPercentage,
      startTime: Date.now(),
      lastUpdated: Date.now()
    }
    this.responseTimes = []
  }

  /**
   * 📊 Update rollout percentage
   */
  updateRolloutPercentage(percentage: number): void {
    this.metrics.rolloutPercentage = percentage
    this.metrics.lastUpdated = Date.now()
  }
}

// Singleton instance
export const migrationMetrics = new MigrationMetricsStore()

/**
 * 🏥 HEALTH CHECK SYSTEM
 */
export function performHealthCheck(): MigrationHealthCheck {
  const metrics = migrationMetrics.getMetrics()
  const totalRequests = metrics.newAuthRequests + metrics.legacyAuthRequests
  const totalErrors = metrics.newAuthErrors + metrics.legacyAuthErrors
  
  // Calculate error rates
  const overallErrorRate = totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0
  const newAuthErrorRate = metrics.newAuthRequests > 0 ? 
    (metrics.newAuthErrors / metrics.newAuthRequests) * 100 : 0
  
  // Calculate uptime
  const uptime = Date.now() - metrics.startTime
  
  // Determine health status
  let status: 'healthy' | 'warning' | 'critical' = 'healthy'
  let recommendedAction = 'Continue monitoring'
  
  if (overallErrorRate > 5) {
    status = 'critical'
    recommendedAction = 'Emergency rollback recommended - error rate too high'
  } else if (overallErrorRate > 2) {
    status = 'warning'
    recommendedAction = 'Monitor closely - consider slowing rollout'
  } else if (metrics.averageResponseTime > 500) {
    status = 'warning'
    recommendedAction = 'Response time elevated - monitor performance'
  } else if (newAuthErrorRate > overallErrorRate * 1.5) {
    status = 'warning'
    recommendedAction = 'New auth system has higher error rate than legacy'
  }

  return {
    status,
    errorRate: overallErrorRate,
    responseTime: metrics.averageResponseTime,
    uptime,
    recommendedAction
  }
}

/**
 * 📊 MIGRATION DASHBOARD DATA
 */
export function getMigrationDashboard(): {
  metrics: MigrationMetrics
  health: MigrationHealthCheck
  comparison: {
    newAuthSuccess: number
    legacyAuthSuccess: number
    newAuthErrorRate: number
    legacyAuthErrorRate: number
  }
  recommendations: string[]
} {
  const metrics = migrationMetrics.getMetrics()
  const health = performHealthCheck()
  
  // Calculate success rates
  const newAuthSuccess = metrics.newAuthRequests > 0 ? 
    ((metrics.newAuthRequests - metrics.newAuthErrors) / metrics.newAuthRequests) * 100 : 100
  const legacyAuthSuccess = metrics.legacyAuthRequests > 0 ? 
    ((metrics.legacyAuthRequests - metrics.legacyAuthErrors) / metrics.legacyAuthRequests) * 100 : 100
  
  const newAuthErrorRate = metrics.newAuthRequests > 0 ? 
    (metrics.newAuthErrors / metrics.newAuthRequests) * 100 : 0
  const legacyAuthErrorRate = metrics.legacyAuthRequests > 0 ? 
    (metrics.legacyAuthErrors / metrics.legacyAuthRequests) * 100 : 0

  // Generate recommendations
  const recommendations: string[] = []
  
  if (health.status === 'healthy' && metrics.newAuthRequests > 100) {
    recommendations.push('✅ New auth system performing well - ready to increase rollout')
  }
  
  if (newAuthErrorRate < legacyAuthErrorRate) {
    recommendations.push('🎯 New auth has lower error rate than legacy - migration beneficial')
  }
  
  if (metrics.averageResponseTime < 200) {
    recommendations.push('⚡ Response times excellent - no performance concerns')
  }
  
  if (metrics.newAuthRequests < metrics.legacyAuthRequests * 0.05) {
    recommendations.push('📊 Low sample size for new auth - consider increasing rollout for better data')
  }

  return {
    metrics,
    health,
    comparison: {
      newAuthSuccess,
      legacyAuthSuccess,
      newAuthErrorRate,
      legacyAuthErrorRate
    },
    recommendations
  }
}

/**
 * 🚀 LOG MIGRATION STATUS
 */
export function logMigrationStatus(): void {
  const dashboard = getMigrationDashboard()
  
  console.log('🚀 Authentication Migration Status:')
  console.log('┌─────────────────────────────────────┐')
  console.log(`│ Health: ${dashboard.health.status.toUpperCase().padEnd(8)} │`)
  console.log(`│ Error Rate: ${dashboard.health.errorRate.toFixed(2)}%`.padEnd(37) + '│')
  console.log(`│ Avg Response: ${dashboard.health.responseTime.toFixed(0)}ms`.padEnd(37) + '│')
  console.log(`│ Rollout: ${dashboard.metrics.rolloutPercentage}%`.padEnd(37) + '│')
  console.log('├─────────────────────────────────────┤')
  console.log(`│ New Auth Requests: ${dashboard.metrics.newAuthRequests}`.padEnd(37) + '│')
  console.log(`│ Legacy Auth Requests: ${dashboard.metrics.legacyAuthRequests}`.padEnd(37) + '│')
  console.log(`│ New Auth Errors: ${dashboard.metrics.newAuthErrors}`.padEnd(37) + '│')
  console.log(`│ Legacy Auth Errors: ${dashboard.metrics.legacyAuthErrors}`.padEnd(37) + '│')
  console.log('└─────────────────────────────────────┘')
  
  if (dashboard.recommendations.length > 0) {
    console.log('\n🎯 Recommendations:')
    dashboard.recommendations.forEach(rec => console.log(`  ${rec}`))
  }
  
  console.log(`\n💡 Action: ${dashboard.health.recommendedAction}`)
}

/**
 * 🔄 AUTO-MONITORING INTERVALS
 */
let monitoringInterval: NodeJS.Timeout | null = null

export function startAutoMonitoring(intervalMs: number = 30000): void {
  if (monitoringInterval) {
    clearInterval(monitoringInterval)
  }
  
  monitoringInterval = setInterval(() => {
    logMigrationStatus()
  }, intervalMs)
  
  console.log(`📊 Auto-monitoring started (${intervalMs}ms intervals)`)
}

export function stopAutoMonitoring(): void {
  if (monitoringInterval) {
    clearInterval(monitoringInterval)
    monitoringInterval = null
    console.log('📊 Auto-monitoring stopped')
  }
}

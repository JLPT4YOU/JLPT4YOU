/**
 * 🚩 FEATURE FLAGS SYSTEM
 * Manages gradual rollout of new authentication system
 * Enables A/B testing and safe migration
 */

import { logMigrationEvent } from '@/lib/monitoring'

/**
 * 🏳️ FEATURE FLAG DEFINITIONS
 */
export enum FeatureFlag {
  NEW_AUTH_SYSTEM = 'NEW_AUTH_SYSTEM',
  NEW_MIDDLEWARE = 'NEW_MIDDLEWARE', 
  NEW_API_AUTH = 'NEW_API_AUTH',
  NEW_AUTH_CONTEXT = 'NEW_AUTH_CONTEXT',
  ENHANCED_MONITORING = 'ENHANCED_MONITORING',
  RBAC_SYSTEM = 'RBAC_SYSTEM'
}

/**
 * 🔧 FEATURE FLAG CONFIGURATION
 */
interface FeatureFlagConfig {
  enabled: boolean
  rolloutPercentage: number
  userGroups?: string[]
  description: string
  dependencies?: FeatureFlag[]
}

/**
 * 🗺️ FEATURE FLAG MAPPING
 */
const FEATURE_FLAGS: Record<FeatureFlag, FeatureFlagConfig> = {
  [FeatureFlag.NEW_AUTH_SYSTEM]: {
    enabled: process.env.NEXT_PUBLIC_USE_NEW_AUTH === 'true',
    rolloutPercentage: parseInt(process.env.NEXT_PUBLIC_ROLLOUT_PERCENTAGE || '0'),
    description: 'New Supabase SSR authentication system',
    dependencies: []
  },
  
  [FeatureFlag.NEW_MIDDLEWARE]: {
    enabled: process.env.NEXT_PUBLIC_USE_NEW_MIDDLEWARE === 'true',
    rolloutPercentage: parseInt(process.env.NEXT_PUBLIC_ROLLOUT_PERCENTAGE || '0'),
    description: 'New secure authentication middleware',
    dependencies: [FeatureFlag.NEW_AUTH_SYSTEM]
  },
  
  [FeatureFlag.NEW_API_AUTH]: {
    enabled: process.env.NEXT_PUBLIC_USE_NEW_API_AUTH === 'true',
    rolloutPercentage: parseInt(process.env.NEXT_PUBLIC_ROLLOUT_PERCENTAGE || '0'),
    description: 'New API authentication system',
    dependencies: [FeatureFlag.NEW_AUTH_SYSTEM]
  },
  
  [FeatureFlag.NEW_AUTH_CONTEXT]: {
    enabled: process.env.NEXT_PUBLIC_USE_NEW_AUTH_CONTEXT === 'true',
    rolloutPercentage: parseInt(process.env.NEXT_PUBLIC_ROLLOUT_PERCENTAGE || '0'),
    description: 'New React authentication context',
    dependencies: [FeatureFlag.NEW_AUTH_SYSTEM]
  },
  
  [FeatureFlag.ENHANCED_MONITORING]: {
    enabled: process.env.NEXT_PUBLIC_ENABLE_MONITORING === 'true',
    rolloutPercentage: 100, // Always enabled for migration monitoring
    description: 'Enhanced authentication monitoring and logging',
    dependencies: []
  },
  
  [FeatureFlag.RBAC_SYSTEM]: {
    enabled: process.env.NEXT_PUBLIC_USE_RBAC === 'true',
    rolloutPercentage: parseInt(process.env.NEXT_PUBLIC_ROLLOUT_PERCENTAGE || '0'),
    description: 'Role-based access control system',
    dependencies: [FeatureFlag.NEW_AUTH_SYSTEM]
  }
}

/**
 * ✅ CHECK FEATURE FLAG
 */
export function isFeatureEnabled(flag: FeatureFlag, userId?: string): boolean {
  const config = FEATURE_FLAGS[flag]
  
  if (!config) {
    console.warn(`Unknown feature flag: ${flag}`)
    return false
  }

  // Check if explicitly enabled
  if (config.enabled) {
    logMigrationEvent({
      event: 'feature_flag_enabled',
      level: 'info',
      details: { 
        flag,
        method: 'explicit',
        userId
      }
    })
    return true
  }

  // Check dependencies
  if (config.dependencies && config.dependencies.length > 0) {
    const dependenciesMet = config.dependencies.every(dep => isFeatureEnabled(dep, userId))
    if (!dependenciesMet) {
      return false
    }
  }

  // Check rollout percentage
  if (config.rolloutPercentage > 0) {
    const shouldEnable = shouldEnableForUser(flag, userId, config.rolloutPercentage)
    
    if (shouldEnable) {
      logMigrationEvent({
        event: 'feature_flag_enabled',
        level: 'info',
        details: { 
          flag,
          method: 'rollout',
          percentage: config.rolloutPercentage,
          userId
        }
      })
    }
    
    return shouldEnable
  }

  return false
}

/**
 * 🎲 DETERMINE IF USER SHOULD GET FEATURE
 */
function shouldEnableForUser(flag: FeatureFlag, userId: string | undefined, percentage: number): boolean {
  if (percentage >= 100) return true
  if (percentage <= 0) return false

  // Use consistent hashing for user-based rollout
  if (userId) {
    const hash = simpleHash(flag + userId)
    return (hash % 100) < percentage
  }

  // Fallback to random for anonymous users
  return Math.random() * 100 < percentage
}

/**
 * 🔢 SIMPLE HASH FUNCTION
 */
function simpleHash(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash)
}

/**
 * 🔄 MIGRATION PHASE MANAGEMENT
 */
export enum MigrationPhase {
  PREPARATION = 'preparation',
  PILOT = 'pilot',
  GRADUAL_ROLLOUT = 'gradual_rollout',
  FULL_MIGRATION = 'full_migration',
  CLEANUP = 'cleanup'
}

/**
 * 📊 GET CURRENT MIGRATION PHASE
 */
export function getCurrentMigrationPhase(): MigrationPhase {
  const newAuthEnabled = isFeatureEnabled(FeatureFlag.NEW_AUTH_SYSTEM)
  const rolloutPercentage = FEATURE_FLAGS[FeatureFlag.NEW_AUTH_SYSTEM].rolloutPercentage

  if (!newAuthEnabled && rolloutPercentage === 0) {
    return MigrationPhase.PREPARATION
  }

  if (rolloutPercentage > 0 && rolloutPercentage < 10) {
    return MigrationPhase.PILOT
  }

  if (rolloutPercentage >= 10 && rolloutPercentage < 100) {
    return MigrationPhase.GRADUAL_ROLLOUT
  }

  if (rolloutPercentage >= 100 || newAuthEnabled) {
    return MigrationPhase.FULL_MIGRATION
  }

  return MigrationPhase.PREPARATION
}

/**
 * 📈 GET MIGRATION PROGRESS
 */
export function getMigrationProgress(): {
  phase: MigrationPhase
  percentage: number
  enabledFeatures: FeatureFlag[]
  nextSteps: string[]
} {
  const phase = getCurrentMigrationPhase()
  const rolloutPercentage = FEATURE_FLAGS[FeatureFlag.NEW_AUTH_SYSTEM].rolloutPercentage
  
  const enabledFeatures = Object.values(FeatureFlag).filter(flag => 
    isFeatureEnabled(flag)
  )

  let nextSteps: string[] = []
  
  switch (phase) {
    case MigrationPhase.PREPARATION:
      nextSteps = [
        'Enable pilot testing (5% rollout)',
        'Monitor system health',
        'Validate new authentication flow'
      ]
      break
    case MigrationPhase.PILOT:
      nextSteps = [
        'Increase rollout to 25%',
        'Monitor error rates',
        'Collect user feedback'
      ]
      break
    case MigrationPhase.GRADUAL_ROLLOUT:
      nextSteps = [
        'Increase rollout to 50%, then 75%',
        'Monitor performance metrics',
        'Prepare for full migration'
      ]
      break
    case MigrationPhase.FULL_MIGRATION:
      nextSteps = [
        'Remove old authentication code',
        'Clean up feature flags',
        'Optimize new system'
      ]
      break
    case MigrationPhase.CLEANUP:
      nextSteps = [
        'Migration complete',
        'Monitor system stability',
        'Document lessons learned'
      ]
      break
  }

  return {
    phase,
    percentage: rolloutPercentage,
    enabledFeatures,
    nextSteps
  }
}

/**
 * 🔧 FEATURE FLAG UTILITIES
 */
export class FeatureFlagManager {
  /**
   * 📊 GET ALL FEATURE FLAGS STATUS
   */
  static getAllFlags(userId?: string): Record<FeatureFlag, boolean> {
    const result: Record<FeatureFlag, boolean> = {} as any
    
    Object.values(FeatureFlag).forEach(flag => {
      result[flag] = isFeatureEnabled(flag, userId)
    })
    
    return result
  }

  /**
   * 🔄 ENABLE FEATURE FLAG (for testing)
   */
  static enableFlag(flag: FeatureFlag, percentage = 100): void {
    FEATURE_FLAGS[flag].enabled = true
    FEATURE_FLAGS[flag].rolloutPercentage = percentage
    
    logMigrationEvent({
      event: 'feature_flag_manually_enabled',
      level: 'info',
      details: { flag, percentage }
    })
  }

  /**
   * 🔄 DISABLE FEATURE FLAG (for rollback)
   */
  static disableFlag(flag: FeatureFlag): void {
    FEATURE_FLAGS[flag].enabled = false
    FEATURE_FLAGS[flag].rolloutPercentage = 0
    
    logMigrationEvent({
      event: 'feature_flag_manually_disabled',
      level: 'warn',
      details: { flag }
    })
  }

  /**
   * 📈 UPDATE ROLLOUT PERCENTAGE
   */
  static updateRollout(flag: FeatureFlag, percentage: number): void {
    if (percentage < 0 || percentage > 100) {
      throw new Error('Rollout percentage must be between 0 and 100')
    }
    
    const oldPercentage = FEATURE_FLAGS[flag].rolloutPercentage
    FEATURE_FLAGS[flag].rolloutPercentage = percentage
    
    logMigrationEvent({
      event: 'feature_flag_rollout_updated',
      level: 'info',
      details: { 
        flag, 
        oldPercentage, 
        newPercentage: percentage 
      }
    })
  }

  /**
   * 📊 GET FEATURE FLAG STATS
   */
  static getStats(): {
    totalFlags: number
    enabledFlags: number
    rolloutFlags: number
    averageRollout: number
  } {
    const flags = Object.values(FEATURE_FLAGS)
    const enabledFlags = flags.filter(f => f.enabled).length
    const rolloutFlags = flags.filter(f => f.rolloutPercentage > 0).length
    const averageRollout = flags.reduce((sum, f) => sum + f.rolloutPercentage, 0) / flags.length

    return {
      totalFlags: flags.length,
      enabledFlags,
      rolloutFlags,
      averageRollout: Math.round(averageRollout)
    }
  }
}

/**
 * 🧪 A/B TESTING UTILITIES
 */
export function getABTestGroup(userId: string, testName: string): 'A' | 'B' {
  const hash = simpleHash(testName + userId)
  return (hash % 2) === 0 ? 'A' : 'B'
}

export function isInABTestGroup(userId: string, testName: string, group: 'A' | 'B'): boolean {
  return getABTestGroup(userId, testName) === group
}

/**
 * 🚨 EMERGENCY ROLLBACK
 */
export function emergencyRollback(): void {
  logMigrationEvent({
    event: 'emergency_rollback_initiated',
    level: 'error',
    details: { 
      timestamp: new Date().toISOString(),
      reason: 'Manual emergency rollback'
    }
  })

  // Disable all new features
  Object.values(FeatureFlag).forEach(flag => {
    FeatureFlagManager.disableFlag(flag)
  })

  console.error('🚨 EMERGENCY ROLLBACK: All new authentication features disabled')
}

// Export for use in components
export { FEATURE_FLAGS }

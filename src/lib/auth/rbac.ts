/**
 * 🛡️ ROLE-BASED ACCESS CONTROL (RBAC)
 * Comprehensive permission system for JLPT4YOU
 * Replaces basic role checking with granular permissions
 */

import { supabaseAdmin } from '@/utils/supabase/admin'
import { logSecurityEvent } from '@/lib/monitoring'

/**
 * 👤 USER ROLES
 */
export enum UserRole {
  FREE = 'Free',
  PREMIUM = 'Premium', 
  ADMIN = 'Admin'
}

/**
 * 🔐 PERMISSIONS
 */
export enum Permission {
  // Content Access
  VIEW_CONTENT = 'view_content',
  VIEW_PREMIUM_CONTENT = 'view_premium_content',
  
  // Features
  DOWNLOAD_PDF = 'download_pdf',
  USE_AI_FEATURES = 'use_ai_features',
  TAKE_CHALLENGE_MODE = 'take_challenge_mode',
  
  // Admin Features
  ACCESS_ADMIN = 'access_admin',
  MANAGE_USERS = 'manage_users',
  VIEW_ANALYTICS = 'view_analytics',
  MANAGE_CONTENT = 'manage_content',
  MANAGE_SYSTEM = 'manage_system',
  
  // API Access
  USE_PAYMENT_API = 'use_payment_api',
  USE_ADMIN_API = 'use_admin_api'
}

/**
 * 🗺️ ROLE PERMISSION MAPPING
 */
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.FREE]: [
    Permission.VIEW_CONTENT,
    Permission.TAKE_CHALLENGE_MODE
  ],
  [UserRole.PREMIUM]: [
    Permission.VIEW_CONTENT,
    Permission.VIEW_PREMIUM_CONTENT,
    Permission.DOWNLOAD_PDF,
    Permission.USE_AI_FEATURES,
    Permission.TAKE_CHALLENGE_MODE,
    Permission.USE_PAYMENT_API
  ],
  [UserRole.ADMIN]: [
    Permission.VIEW_CONTENT,
    Permission.VIEW_PREMIUM_CONTENT,
    Permission.DOWNLOAD_PDF,
    Permission.USE_AI_FEATURES,
    Permission.TAKE_CHALLENGE_MODE,
    Permission.USE_PAYMENT_API,
    Permission.ACCESS_ADMIN,
    Permission.MANAGE_USERS,
    Permission.VIEW_ANALYTICS,
    Permission.MANAGE_CONTENT,
    Permission.MANAGE_SYSTEM,
    Permission.USE_ADMIN_API
  ]
}

/**
 * ✅ CHECK PERMISSION
 */
export function hasPermission(userRole: UserRole, permission: Permission): boolean {
  const rolePermissions = ROLE_PERMISSIONS[userRole]
  return rolePermissions?.includes(permission) || false
}

/**
 * ✅ CHECK MULTIPLE PERMISSIONS (ALL required)
 */
export function hasAllPermissions(userRole: UserRole, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(userRole, permission))
}

/**
 * ✅ CHECK MULTIPLE PERMISSIONS (ANY required)
 */
export function hasAnyPermission(userRole: UserRole, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(userRole, permission))
}

/**
 * 🔍 GET USER ROLE FROM DATABASE
 */
export async function getUserRole(userId: string): Promise<UserRole | null> {
  try {
    if (!supabaseAdmin) {
      console.error('Supabase admin client not available')
      return null
    }

    const { data: userData, error } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', userId)
      .single()

    if (error) {
      logSecurityEvent({
        event: 'role_check_failed',
        level: 'warn',
        userId,
        details: { error: error.message }
      })
      return null
    }

    return userData?.role as UserRole || UserRole.FREE
  } catch (error) {
    logSecurityEvent({
      event: 'role_check_error',
      level: 'error',
      userId,
      details: { 
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    })
    return null
  }
}

/**
 * 🔒 CHECK USER ROLE (with caching)
 */
const roleCache = new Map<string, { role: UserRole; expires: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export async function checkUserRole(userId: string, requiredRole: UserRole): Promise<boolean> {
  try {
    // Check cache first
    const cached = roleCache.get(userId)
    if (cached && cached.expires > Date.now()) {
      return isRoleAuthorized(cached.role, requiredRole)
    }

    // Fetch from database
    const userRole = await getUserRole(userId)
    if (!userRole) return false

    // Cache the result
    roleCache.set(userId, {
      role: userRole,
      expires: Date.now() + CACHE_TTL
    })

    return isRoleAuthorized(userRole, requiredRole)
  } catch (error) {
    logSecurityEvent({
      event: 'role_authorization_error',
      level: 'error',
      userId,
      details: { 
        requiredRole,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    })
    return false
  }
}

/**
 * 🔐 CHECK ROLE AUTHORIZATION
 */
function isRoleAuthorized(userRole: UserRole, requiredRole: UserRole): boolean {
  // Admin can access everything
  if (userRole === UserRole.ADMIN) return true
  
  // Premium can access Free content
  if (requiredRole === UserRole.FREE && userRole === UserRole.PREMIUM) return true
  
  // Exact role match
  return userRole === requiredRole
}

/**
 * 🛣️ ROUTE PROTECTION CONFIGURATION
 */
export interface RouteProtection {
  requiresAuth: boolean
  requiredRole?: UserRole
  permissions?: Permission[]
  description?: string
}

/**
 * 🗺️ ROUTE PROTECTION MAPPING
 */
const ROUTE_PROTECTION: Record<string, RouteProtection> = {
  // Public routes
  '/': { requiresAuth: false, description: 'Landing page' },
  '/landing': { requiresAuth: false, description: 'Landing page' },
  '/auth/login': { requiresAuth: false, description: 'Login page' },
  '/auth/register': { requiresAuth: false, description: 'Register page' },
  '/auth/callback': { requiresAuth: false, description: 'OAuth callback' },
  
  // Free user routes
  '/home': { 
    requiresAuth: true, 
    requiredRole: UserRole.FREE,
    permissions: [Permission.VIEW_CONTENT],
    description: 'User dashboard'
  },
  '/jlpt': { 
    requiresAuth: true, 
    requiredRole: UserRole.FREE,
    permissions: [Permission.VIEW_CONTENT],
    description: 'JLPT tests'
  },
  '/challenge': { 
    requiresAuth: true, 
    requiredRole: UserRole.FREE,
    permissions: [Permission.TAKE_CHALLENGE_MODE],
    description: 'Challenge mode'
  },
  
  // Premium user routes
  '/library': { 
    requiresAuth: true, 
    requiredRole: UserRole.PREMIUM,
    permissions: [Permission.VIEW_PREMIUM_CONTENT, Permission.DOWNLOAD_PDF],
    description: 'PDF library'
  },
  '/ai': { 
    requiresAuth: true, 
    requiredRole: UserRole.PREMIUM,
    permissions: [Permission.USE_AI_FEATURES],
    description: 'AI features'
  },
  
  // Admin routes
  '/admin': { 
    requiresAuth: true, 
    requiredRole: UserRole.ADMIN,
    permissions: [Permission.ACCESS_ADMIN],
    description: 'Admin dashboard'
  },
  '/admin/users': { 
    requiresAuth: true, 
    requiredRole: UserRole.ADMIN,
    permissions: [Permission.MANAGE_USERS],
    description: 'User management'
  },
  '/admin/analytics': { 
    requiresAuth: true, 
    requiredRole: UserRole.ADMIN,
    permissions: [Permission.VIEW_ANALYTICS],
    description: 'Analytics dashboard'
  },
  
  // User settings
  '/settings': { 
    requiresAuth: true, 
    requiredRole: UserRole.FREE,
    description: 'User settings'
  }
}

/**
 * 🛡️ GET ROUTE PROTECTION
 */
export function getRouteProtection(pathname: string): RouteProtection {
  // Check exact match first
  if (ROUTE_PROTECTION[pathname]) {
    return ROUTE_PROTECTION[pathname]
  }

  // Check pattern matches
  for (const [pattern, protection] of Object.entries(ROUTE_PROTECTION)) {
    if (pathname.startsWith(pattern)) {
      return protection
    }
  }

  // Default: require authentication for unknown routes
  return {
    requiresAuth: true,
    requiredRole: UserRole.FREE,
    description: 'Protected route'
  }
}

/**
 * 🔐 PERMISSION GUARD COMPONENT HELPER
 */
export function createPermissionGuard(
  userRole: UserRole | null,
  requiredPermissions: Permission[]
): { hasAccess: boolean; missingPermissions: Permission[] } {
  if (!userRole) {
    return {
      hasAccess: false,
      missingPermissions: requiredPermissions
    }
  }

  const missingPermissions = requiredPermissions.filter(
    permission => !hasPermission(userRole, permission)
  )

  return {
    hasAccess: missingPermissions.length === 0,
    missingPermissions
  }
}

/**
 * 🔄 CLEAR ROLE CACHE (for testing or role updates)
 */
export function clearRoleCache(userId?: string): void {
  if (userId) {
    roleCache.delete(userId)
  } else {
    roleCache.clear()
  }
}

/**
 * 📊 GET ROLE STATISTICS
 */
export function getRoleStatistics(): {
  cacheSize: number
  permissions: Record<UserRole, number>
  routes: number
} {
  return {
    cacheSize: roleCache.size,
    permissions: {
      [UserRole.FREE]: ROLE_PERMISSIONS[UserRole.FREE].length,
      [UserRole.PREMIUM]: ROLE_PERMISSIONS[UserRole.PREMIUM].length,
      [UserRole.ADMIN]: ROLE_PERMISSIONS[UserRole.ADMIN].length
    },
    routes: Object.keys(ROUTE_PROTECTION).length
  }
}

/**
 * 🔍 VALIDATE PERMISSION ENUM
 */
export function isValidPermission(permission: string): permission is Permission {
  return Object.values(Permission).includes(permission as Permission)
}

/**
 * 🔍 VALIDATE ROLE ENUM
 */
export function isValidRole(role: string): role is UserRole {
  return Object.values(UserRole).includes(role as UserRole)
}

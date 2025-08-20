/**
 * 🧪 UNIT TESTS - Role-Based Access Control (RBAC)
 * Comprehensive testing for permission and role management
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals'
import {
  UserRole,
  Permission,
  hasPermission,
  hasAllPermissions,
  hasAnyPermission,
  checkUserRole,
  getRouteProtection,
  createPermissionGuard,
  clearRoleCache,
  isValidPermission,
  isValidRole
} from '@/lib/auth/rbac'

// Mock Supabase admin client
const mockSupabaseAdmin = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn()
      }))
    }))
  }))
}

jest.mock('@/lib/supabase', () => ({
  supabaseAdmin: mockSupabaseAdmin
}))

// Mock monitoring
jest.mock('@/lib/monitoring', () => ({
  logSecurityEvent: jest.fn()
}))

describe('RBAC Permission System', () => {
  beforeEach(() => {
    clearRoleCache()
    jest.clearAllMocks()
  })

  describe('hasPermission', () => {
    it('should grant Free user basic permissions', () => {
      expect(hasPermission(UserRole.FREE, Permission.VIEW_CONTENT)).toBe(true)
      expect(hasPermission(UserRole.FREE, Permission.TAKE_CHALLENGE_MODE)).toBe(true)
    })

    it('should deny Free user premium permissions', () => {
      expect(hasPermission(UserRole.FREE, Permission.VIEW_PREMIUM_CONTENT)).toBe(false)
      expect(hasPermission(UserRole.FREE, Permission.DOWNLOAD_PDF)).toBe(false)
      expect(hasPermission(UserRole.FREE, Permission.USE_AI_FEATURES)).toBe(false)
    })

    it('should grant Premium user all Free + Premium permissions', () => {
      // Free permissions
      expect(hasPermission(UserRole.PREMIUM, Permission.VIEW_CONTENT)).toBe(true)
      expect(hasPermission(UserRole.PREMIUM, Permission.TAKE_CHALLENGE_MODE)).toBe(true)
      
      // Premium permissions
      expect(hasPermission(UserRole.PREMIUM, Permission.VIEW_PREMIUM_CONTENT)).toBe(true)
      expect(hasPermission(UserRole.PREMIUM, Permission.DOWNLOAD_PDF)).toBe(true)
      expect(hasPermission(UserRole.PREMIUM, Permission.USE_AI_FEATURES)).toBe(true)
      expect(hasPermission(UserRole.PREMIUM, Permission.USE_PAYMENT_API)).toBe(true)
    })

    it('should deny Premium user admin permissions', () => {
      expect(hasPermission(UserRole.PREMIUM, Permission.ACCESS_ADMIN)).toBe(false)
      expect(hasPermission(UserRole.PREMIUM, Permission.MANAGE_USERS)).toBe(false)
      expect(hasPermission(UserRole.PREMIUM, Permission.USE_ADMIN_API)).toBe(false)
    })

    it('should grant Admin user all permissions', () => {
      // Test all permissions for Admin
      Object.values(Permission).forEach(permission => {
        expect(hasPermission(UserRole.ADMIN, permission)).toBe(true)
      })
    })
  })

  describe('hasAllPermissions', () => {
    it('should return true when user has all required permissions', () => {
      const permissions = [Permission.VIEW_CONTENT, Permission.TAKE_CHALLENGE_MODE]
      expect(hasAllPermissions(UserRole.FREE, permissions)).toBe(true)
    })

    it('should return false when user lacks any required permission', () => {
      const permissions = [Permission.VIEW_CONTENT, Permission.DOWNLOAD_PDF]
      expect(hasAllPermissions(UserRole.FREE, permissions)).toBe(false)
    })

    it('should handle empty permission array', () => {
      expect(hasAllPermissions(UserRole.FREE, [])).toBe(true)
    })
  })

  describe('hasAnyPermission', () => {
    it('should return true when user has at least one permission', () => {
      const permissions = [Permission.DOWNLOAD_PDF, Permission.VIEW_CONTENT]
      expect(hasAnyPermission(UserRole.FREE, permissions)).toBe(true)
    })

    it('should return false when user has none of the permissions', () => {
      const permissions = [Permission.DOWNLOAD_PDF, Permission.USE_AI_FEATURES]
      expect(hasAnyPermission(UserRole.FREE, permissions)).toBe(false)
    })

    it('should handle empty permission array', () => {
      expect(hasAnyPermission(UserRole.FREE, [])).toBe(false)
    })
  })

  describe('checkUserRole', () => {
    it('should return true for Admin accessing any role requirement', async () => {
      // Mock database response
      mockSupabaseAdmin.from().select().eq().single.mockResolvedValue({
        data: { role: UserRole.ADMIN },
        error: null
      })

      const result = await checkUserRole('admin-user-id', UserRole.FREE)
      expect(result).toBe(true)
    })

    it('should return true for Premium accessing Free content', async () => {
      mockSupabaseAdmin.from().select().eq().single.mockResolvedValue({
        data: { role: UserRole.PREMIUM },
        error: null
      })

      const result = await checkUserRole('premium-user-id', UserRole.FREE)
      expect(result).toBe(true)
    })

    it('should return false for Free user accessing Premium content', async () => {
      mockSupabaseAdmin.from().select().eq().single.mockResolvedValue({
        data: { role: UserRole.FREE },
        error: null
      })

      const result = await checkUserRole('free-user-id', UserRole.PREMIUM)
      expect(result).toBe(false)
    })

    it('should handle database errors gracefully', async () => {
      mockSupabaseAdmin.from().select().eq().single.mockResolvedValue({
        data: null,
        error: { message: 'Database error' }
      })

      const result = await checkUserRole('invalid-user-id', UserRole.FREE)
      expect(result).toBe(false)
    })

    it('should cache role lookups for performance', async () => {
      mockSupabaseAdmin.from().select().eq().single.mockResolvedValue({
        data: { role: UserRole.PREMIUM },
        error: null
      })

      // First call
      await checkUserRole('cached-user-id', UserRole.FREE)
      
      // Second call should use cache
      await checkUserRole('cached-user-id', UserRole.FREE)

      // Should only call database once
      expect(mockSupabaseAdmin.from).toHaveBeenCalledTimes(1)
    })
  })

  describe('getRouteProtection', () => {
    it('should return correct protection for public routes', () => {
      const protection = getRouteProtection('/')
      expect(protection.requiresAuth).toBe(false)
    })

    it('should return correct protection for auth routes', () => {
      const protection = getRouteProtection('/auth/login')
      expect(protection.requiresAuth).toBe(false)
    })

    it('should return correct protection for user routes', () => {
      const protection = getRouteProtection('/home')
      expect(protection.requiresAuth).toBe(true)
      expect(protection.requiredRole).toBe(UserRole.FREE)
    })

    it('should return correct protection for premium routes', () => {
      const protection = getRouteProtection('/library')
      expect(protection.requiresAuth).toBe(true)
      expect(protection.requiredRole).toBe(UserRole.PREMIUM)
    })

    it('should return correct protection for admin routes', () => {
      const protection = getRouteProtection('/admin')
      expect(protection.requiresAuth).toBe(true)
      expect(protection.requiredRole).toBe(UserRole.ADMIN)
    })

    it('should handle unknown routes with default protection', () => {
      const protection = getRouteProtection('/unknown-route')
      expect(protection.requiresAuth).toBe(true)
      expect(protection.requiredRole).toBe(UserRole.FREE)
    })
  })

  describe('createPermissionGuard', () => {
    it('should allow access when user has all required permissions', () => {
      const guard = createPermissionGuard(
        UserRole.PREMIUM,
        [Permission.VIEW_CONTENT, Permission.DOWNLOAD_PDF]
      )

      expect(guard.hasAccess).toBe(true)
      expect(guard.missingPermissions).toHaveLength(0)
    })

    it('should deny access when user lacks permissions', () => {
      const guard = createPermissionGuard(
        UserRole.FREE,
        [Permission.VIEW_CONTENT, Permission.DOWNLOAD_PDF]
      )

      expect(guard.hasAccess).toBe(false)
      expect(guard.missingPermissions).toContain(Permission.DOWNLOAD_PDF)
    })

    it('should deny access when user is null', () => {
      const guard = createPermissionGuard(
        null,
        [Permission.VIEW_CONTENT]
      )

      expect(guard.hasAccess).toBe(false)
      expect(guard.missingPermissions).toContain(Permission.VIEW_CONTENT)
    })
  })

  describe('Validation Functions', () => {
    it('should validate permission enums correctly', () => {
      expect(isValidPermission('view_content')).toBe(true)
      expect(isValidPermission('invalid_permission')).toBe(false)
      expect(isValidPermission('')).toBe(false)
    })

    it('should validate role enums correctly', () => {
      expect(isValidRole('Free')).toBe(true)
      expect(isValidRole('Premium')).toBe(true)
      expect(isValidRole('Admin')).toBe(true)
      expect(isValidRole('InvalidRole')).toBe(false)
      expect(isValidRole('')).toBe(false)
    })
  })
})

// Integration Tests
describe('RBAC Integration Tests', () => {
  beforeEach(() => {
    clearRoleCache()
    jest.clearAllMocks()
  })

  describe('Real-world Permission Scenarios', () => {
    it('should handle typical Free user workflow', () => {
      const userRole = UserRole.FREE

      // Can access basic content
      expect(hasPermission(userRole, Permission.VIEW_CONTENT)).toBe(true)
      
      // Can take challenge mode
      expect(hasPermission(userRole, Permission.TAKE_CHALLENGE_MODE)).toBe(true)
      
      // Cannot access premium features
      expect(hasPermission(userRole, Permission.DOWNLOAD_PDF)).toBe(false)
      expect(hasPermission(userRole, Permission.USE_AI_FEATURES)).toBe(false)
      
      // Cannot access admin features
      expect(hasPermission(userRole, Permission.ACCESS_ADMIN)).toBe(false)
    })

    it('should handle typical Premium user workflow', () => {
      const userRole = UserRole.PREMIUM

      // Can access all Free features
      expect(hasPermission(userRole, Permission.VIEW_CONTENT)).toBe(true)
      expect(hasPermission(userRole, Permission.TAKE_CHALLENGE_MODE)).toBe(true)
      
      // Can access Premium features
      expect(hasPermission(userRole, Permission.VIEW_PREMIUM_CONTENT)).toBe(true)
      expect(hasPermission(userRole, Permission.DOWNLOAD_PDF)).toBe(true)
      expect(hasPermission(userRole, Permission.USE_AI_FEATURES)).toBe(true)
      expect(hasPermission(userRole, Permission.USE_PAYMENT_API)).toBe(true)
      
      // Cannot access admin features
      expect(hasPermission(userRole, Permission.ACCESS_ADMIN)).toBe(false)
      expect(hasPermission(userRole, Permission.MANAGE_USERS)).toBe(false)
    })

    it('should handle typical Admin user workflow', () => {
      const userRole = UserRole.ADMIN

      // Can access all features
      expect(hasPermission(userRole, Permission.VIEW_CONTENT)).toBe(true)
      expect(hasPermission(userRole, Permission.VIEW_PREMIUM_CONTENT)).toBe(true)
      expect(hasPermission(userRole, Permission.ACCESS_ADMIN)).toBe(true)
      expect(hasPermission(userRole, Permission.MANAGE_USERS)).toBe(true)
      expect(hasPermission(userRole, Permission.MANAGE_SYSTEM)).toBe(true)
    })
  })

  describe('Route Protection Integration', () => {
    it('should protect routes correctly for different user roles', () => {
      const routes = [
        { path: '/', expectAuth: false },
        { path: '/home', expectAuth: true, expectRole: UserRole.FREE },
        { path: '/library', expectAuth: true, expectRole: UserRole.PREMIUM },
        { path: '/admin', expectAuth: true, expectRole: UserRole.ADMIN }
      ]

      routes.forEach(({ path, expectAuth, expectRole }) => {
        const protection = getRouteProtection(path)
        expect(protection.requiresAuth).toBe(expectAuth)
        if (expectRole) {
          expect(protection.requiredRole).toBe(expectRole)
        }
      })
    })
  })
})

// Performance Tests
describe('RBAC Performance Tests', () => {
  beforeEach(() => {
    clearRoleCache()
    jest.clearAllMocks()
  })

  it('should perform permission checks efficiently', () => {
    const startTime = performance.now()
    
    // Perform 1000 permission checks
    for (let i = 0; i < 1000; i++) {
      hasPermission(UserRole.PREMIUM, Permission.VIEW_CONTENT)
    }
    
    const endTime = performance.now()
    const duration = endTime - startTime
    
    // Should complete within 10ms
    expect(duration).toBeLessThan(10)
  })

  it('should handle concurrent permission checks', async () => {
    mockSupabaseAdmin.from().select().eq().single.mockResolvedValue({
      data: { role: UserRole.PREMIUM },
      error: null
    })

    const promises = Array.from({ length: 100 }, (_, i) => 
      checkUserRole(`user-${i}`, UserRole.FREE)
    )
    
    const startTime = performance.now()
    const results = await Promise.all(promises)
    const endTime = performance.now()
    
    expect(results).toHaveLength(100)
    expect(endTime - startTime).toBeLessThan(1000) // Should complete within 1 second
  })
})

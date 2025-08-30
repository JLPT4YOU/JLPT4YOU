# 📋 TECHNICAL SPECIFICATION - NEW AUTH SYSTEM

**Document Version:** 1.0  
**Date:** 2025-08-04  
**Project:** JLPT4YOU Authentication Migration  
**Phase:** Week 3 - Migration Phase  

## 🎯 **SPECIFICATION OVERVIEW**

### **Scope**
Complete migration from current custom authentication to modern Supabase SSR-based system with enhanced security, performance, and maintainability.

### **Technical Requirements**
- **Zero downtime migration**
- **Backward compatibility during transition**
- **100% security vulnerability elimination**
- **< 200ms authentication response time**
- **99.9% uptime SLA**

---

## 🏗️ **SYSTEM ARCHITECTURE**

### **Technology Stack**
```typescript
// Core Technologies
- Next.js 14+ (App Router)
- Supabase SSR (@supabase/ssr)
- TypeScript 5+
- React 18+
- Tailwind CSS

// Security & Validation
- Zod (input validation)
- @upstash/ratelimit (rate limiting)
- bcrypt (password hashing)

// Monitoring & Logging
- Custom monitoring system
- Supabase Analytics
- Error tracking
```

### **File Structure**
```
src/
├── lib/
│   ├── auth/
│   │   ├── supabase-ssr.ts          # SSR client setup
│   │   ├── middleware.ts            # Auth middleware
│   │   ├── rbac.ts                  # Role-based access control
│   │   ├── rate-limiting.ts         # Rate limiting
│   │   ├── validation.ts            # Input validation
│   │   └── types.ts                 # TypeScript interfaces
│   ├── database/
│   │   ├── schema.sql               # Database schema
│   │   ├── migrations/              # Migration scripts
│   │   └── seeds.sql                # Seed data
│   └── monitoring/
│       ├── auth-events.ts           # Auth event logging
│       └── metrics.ts               # Performance metrics
├── contexts/
│   └── auth-context-v2.tsx          # New auth context
├── components/
│   ├── auth/
│   │   ├── login-form-v2.tsx        # New login form
│   │   ├── register-form-v2.tsx     # New register form
│   │   └── auth-guard.tsx           # Route protection
│   └── admin/
│       └── user-management-v2.tsx   # Enhanced admin panel
├── app/
│   ├── auth/
│   │   ├── login/page.tsx           # Login page
│   │   ├── register/page.tsx        # Register page
│   │   └── callback/page.tsx        # OAuth callback
│   └── api/
│       ├── auth/
│       │   ├── login/route.ts       # Login API
│       │   ├── register/route.ts    # Register API
│       │   └── logout/route.ts      # Logout API
│       └── admin/
│           └── users/route.ts       # User management API
└── middleware.ts                    # Main middleware
```

---

## 🔧 **DETAILED IMPLEMENTATION SPECS**

### **1. SUPABASE SSR CLIENT**

#### **File:** `src/lib/auth/supabase-ssr.ts`
```typescript
import { createServerClient, createBrowserClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

// Server-side client for middleware and API routes
export function createSupabaseServerClient(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, {
              ...options,
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              path: '/',
              maxAge: 60 * 60 * 24 * 7 // 7 days
            })
          })
        },
      },
    }
  )

  return { supabase, response }
}

// Client-side client for React components
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

#### **Requirements:**
- ✅ Secure cookie configuration
- ✅ Environment-specific settings
- ✅ Proper TypeScript typing
- ✅ Error handling

### **2. AUTHENTICATION MIDDLEWARE**

#### **File:** `src/middleware.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/auth/supabase-ssr'
import { getRouteProtection } from '@/lib/auth/route-protection'
import { checkUserRole } from '@/lib/auth/rbac'
import { checkRateLimit } from '@/lib/auth/rate-limiting'
import { logAuthEvent } from '@/lib/monitoring'

export async function middleware(request: NextRequest) {
  const startTime = Date.now()
  const { supabase, response } = createSupabaseServerClient(request)
  
  try {
    // Rate limiting check
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown'
    const rateLimitOk = await checkRateLimit(`auth:${clientIP}`)
    
    if (!rateLimitOk) {
      logAuthEvent({
        event: 'rate_limit_exceeded',
        level: 'warn',
        ip: clientIP,
        details: { pathname: request.nextUrl.pathname }
      })
      
      return new NextResponse('Rate limit exceeded', { status: 429 })
    }

    // Get user session
    const { data: { user }, error } = await supabase.auth.getUser()
    
    // Route protection check
    const pathname = request.nextUrl.pathname
    const routeProtection = getRouteProtection(pathname)
    
    // Log access attempt
    logAuthEvent({
      event: 'route_access_attempt',
      level: 'info',
      userId: user?.id,
      userEmail: user?.email,
      ip: clientIP,
      details: { 
        pathname, 
        requiresAuth: routeProtection.requiresAuth,
        responseTime: Date.now() - startTime
      }
    })

    // Check authentication requirement
    if (routeProtection.requiresAuth && (!user || error)) {
      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('returnTo', pathname)
      
      logAuthEvent({
        event: 'unauthorized_access_blocked',
        level: 'warn',
        ip: clientIP,
        details: { pathname, error: error?.message }
      })
      
      return NextResponse.redirect(loginUrl)
    }

    // Role-based access control
    if (routeProtection.requiredRole && user) {
      const hasAccess = await checkUserRole(user.id, routeProtection.requiredRole)
      
      if (!hasAccess) {
        logAuthEvent({
          event: 'insufficient_permissions',
          level: 'warn',
          userId: user.id,
          userEmail: user.email,
          ip: clientIP,
          details: { pathname, requiredRole: routeProtection.requiredRole }
        })
        
        return NextResponse.redirect(new URL('/unauthorized', request.url))
      }
    }

    // Add user context to response headers for client-side access
    if (user) {
      response.headers.set('x-user-id', user.id)
      response.headers.set('x-user-role', user.user_metadata?.role || 'Free')
    }

    return response

  } catch (error) {
    logAuthEvent({
      event: 'middleware_error',
      level: 'error',
      ip: clientIP,
      details: { 
        pathname: request.nextUrl.pathname,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    })

    // Fail open for non-critical errors
    return response
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}
```

#### **Requirements:**
- ✅ Proper token verification
- ✅ Rate limiting integration
- ✅ Role-based access control
- ✅ Comprehensive logging
- ✅ Error handling
- ✅ Performance monitoring

### **3. ROLE-BASED ACCESS CONTROL**

#### **File:** `src/lib/auth/rbac.ts`
```typescript
export enum UserRole {
  FREE = 'Free',
  PREMIUM = 'Premium',
  ADMIN = 'Admin'
}

export enum Permission {
  VIEW_CONTENT = 'view_content',
  DOWNLOAD_PDF = 'download_pdf',
  USE_AI_FEATURES = 'use_ai_features',
  ACCESS_ADMIN = 'access_admin',
  MANAGE_USERS = 'manage_users',
  VIEW_ANALYTICS = 'view_analytics',
  MANAGE_CONTENT = 'manage_content'
}

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.FREE]: [
    Permission.VIEW_CONTENT
  ],
  [UserRole.PREMIUM]: [
    Permission.VIEW_CONTENT,
    Permission.DOWNLOAD_PDF,
    Permission.USE_AI_FEATURES
  ],
  [UserRole.ADMIN]: [
    Permission.VIEW_CONTENT,
    Permission.DOWNLOAD_PDF,
    Permission.USE_AI_FEATURES,
    Permission.ACCESS_ADMIN,
    Permission.MANAGE_USERS,
    Permission.VIEW_ANALYTICS,
    Permission.MANAGE_CONTENT
  ]
}

export function hasPermission(userRole: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[userRole]?.includes(permission) || false
}

export async function checkUserRole(userId: string, requiredRole: UserRole): Promise<boolean> {
  try {
    const { data: userData, error } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', userId)
      .single()

    if (error || !userData) return false

    const userRole = userData.role as UserRole
    
    // Admin can access everything
    if (userRole === UserRole.ADMIN) return true
    
    // Premium can access Free content
    if (requiredRole === UserRole.FREE && userRole === UserRole.PREMIUM) return true
    
    // Exact role match
    return userRole === requiredRole

  } catch (error) {
    console.error('Role check error:', error)
    return false
  }
}

export interface RouteProtection {
  requiresAuth: boolean
  requiredRole?: UserRole
  permissions?: Permission[]
}

export function getRouteProtection(pathname: string): RouteProtection {
  // Admin routes
  if (pathname.startsWith('/admin')) {
    return {
      requiresAuth: true,
      requiredRole: UserRole.ADMIN,
      permissions: [Permission.ACCESS_ADMIN]
    }
  }

  // Premium features
  if (pathname.includes('/pdf') || pathname.includes('/ai')) {
    return {
      requiresAuth: true,
      requiredRole: UserRole.PREMIUM,
      permissions: [Permission.DOWNLOAD_PDF, Permission.USE_AI_FEATURES]
    }
  }

  // Protected user areas
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/settings')) {
    return {
      requiresAuth: true,
      requiredRole: UserRole.FREE
    }
  }

  // Public routes
  if (pathname.startsWith('/auth') || pathname === '/' || pathname.startsWith('/landing')) {
    return { requiresAuth: false }
  }

  // Default: require authentication
  return {
    requiresAuth: true,
    requiredRole: UserRole.FREE
  }
}
```

#### **Requirements:**
- ✅ Type-safe role definitions
- ✅ Granular permission system
- ✅ Hierarchical role access
- ✅ Route-based protection
- ✅ Database integration

### **4. INPUT VALIDATION**

#### **File:** `src/lib/auth/validation.ts`
```typescript
import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string()
    .email('Invalid email format')
    .min(1, 'Email is required')
    .max(255, 'Email too long'),
  password: z.string()
    .min(1, 'Password is required')
    .max(128, 'Password too long')
})

export const registerSchema = z.object({
  email: z.string()
    .email('Invalid email format')
    .min(1, 'Email is required')
    .max(255, 'Email too long'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password too long')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  confirmPassword: z.string(),
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name too long')
    .optional()
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
})

export const updateProfileSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name too long'),
  email: z.string()
    .email('Invalid email format')
    .min(1, 'Email is required')
    .max(255, 'Email too long')
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>

// Validation helper
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: boolean
  data?: T
  errors?: Record<string, string>
} {
  try {
    const result = schema.parse(data)
    return { success: true, data: result }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {}
      error.errors.forEach(err => {
        if (err.path.length > 0) {
          errors[err.path[0].toString()] = err.message
        }
      })
      return { success: false, errors }
    }
    return { success: false, errors: { general: 'Validation failed' } }
  }
}
```

#### **Requirements:**
- ✅ Comprehensive input validation
- ✅ Type-safe schemas
- ✅ Password strength requirements
- ✅ Error message handling
- ✅ Reusable validation helpers

---

## 🗄️ **DATABASE SPECIFICATIONS**

### **Migration Scripts**
```sql
-- Migration 001: Enhanced Users Table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS subscription_type TEXT DEFAULT 'Free' CHECK (subscription_type IN ('Free', 'Premium')),
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS login_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS created_by_admin BOOLEAN DEFAULT FALSE;

-- Update role constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check 
CHECK (role IN ('Free', 'Premium', 'Admin'));

-- Migration 002: Session Tracking
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_token TEXT NOT NULL UNIQUE,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

-- Migration 003: Audit Trail
CREATE TABLE IF NOT EXISTS auth_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    event_type TEXT NOT NULL,
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN NOT NULL,
    error_message TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_auth_audit_user_id ON auth_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_audit_event_type ON auth_audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_auth_audit_created_at ON auth_audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
```

---

## 📊 **PERFORMANCE REQUIREMENTS**

### **Response Time Targets**
- Authentication check: < 50ms
- Login/logout: < 200ms
- Route protection: < 100ms
- Role verification: < 75ms

### **Scalability Targets**
- Support 10,000+ concurrent users
- Handle 1,000+ auth requests/second
- 99.9% uptime SLA
- < 1% error rate

### **Caching Strategy**
- Route protection rules: 5 minutes TTL
- User role data: 5 minutes TTL
- Session data: 1 hour TTL
- Rate limit counters: 1 minute TTL

---

## 🔒 **SECURITY SPECIFICATIONS**

### **Authentication Security**
- Supabase JWT token verification
- Secure httpOnly cookies
- CSRF protection via sameSite
- Rate limiting: 5 attempts/minute
- Password requirements: 8+ chars, mixed case, numbers

### **Session Security**
- Automatic session refresh
- Session invalidation on logout
- Concurrent session limits
- IP address tracking
- User agent validation

### **Data Protection**
- All sensitive data encrypted at rest
- TLS 1.3 for data in transit
- No sensitive data in localStorage
- Audit trail for all auth events
- GDPR compliance ready

---

## ✅ **ACCEPTANCE CRITERIA**

### **Functional Requirements**
- [ ] Users can login/logout securely
- [ ] Role-based access control works
- [ ] Session management is automatic
- [ ] Password reset functionality
- [ ] OAuth integration (Google)
- [ ] Admin user management

### **Security Requirements**
- [ ] All 7 current vulnerabilities eliminated
- [ ] CSRF protection active
- [ ] XSS protection via httpOnly cookies
- [ ] Rate limiting prevents brute force
- [ ] Input validation prevents injection
- [ ] Audit trail captures all events

### **Performance Requirements**
- [ ] < 200ms authentication response
- [ ] < 100ms route protection check
- [ ] 99.9% uptime during migration
- [ ] Zero data loss during migration
- [ ] Backward compatibility maintained

### **Monitoring Requirements**
- [ ] All auth events logged
- [ ] Performance metrics tracked
- [ ] Error rates monitored
- [ ] Security violations alerted
- [ ] Migration progress tracked

**Next Step: Plan database schema changes**

# 🚨 Phase 1: Session Persistence Fix - Implementation Guide

## 📋 Overview
**Objective:** Fix session persistence issues causing frequent re-login requirements  
**Timeline:** Week 1-2 (40 hours)  
**Priority:** CRITICAL  
**Impact:** User Experience & Security  

---

## 🔍 Task 1.1: Analyze Session Persistence Root Cause (8 hours)

### **Investigation Areas**

#### **1.1.1 Cookie Domain Analysis (2h)**
```typescript
// Current issue analysis
// Check: middleware.ts, auth-context-simple.tsx
// Look for: cookie domain configuration, SameSite settings

// Investigation checklist:
- [ ] Cookie domain matches application domain
- [ ] SameSite attribute properly configured
- [ ] Secure flag set for HTTPS
- [ ] HttpOnly flag preventing XSS
- [ ] Cookie expiration timing
```

#### **1.1.2 Token Refresh Timing (3h)**
```typescript
// Current Supabase configuration analysis
// File: src/utils/supabase/client.ts

// Check current settings:
const supabase = createClient(url, key, {
  auth: {
    autoRefreshToken: true,    // ✅ Should be true
    persistSession: true,      // ✅ Should be true  
    detectSessionInUrl: true,  // ✅ Should be true
    flowType: 'pkce'          // ✅ Should be 'pkce'
  }
})

// Investigation points:
- [ ] Token refresh interval (default: 30 minutes before expiry)
- [ ] Network connectivity during refresh
- [ ] Concurrent refresh requests
- [ ] Refresh token rotation
```

#### **1.1.3 Multiple Session Conflicts (2h)**
```typescript
// Check for session conflicts
// Files: middleware.ts, auth-context-simple.tsx

// Common issues:
- [ ] Multiple Supabase client instances
- [ ] Race conditions in session checks
- [ ] Conflicting cookie management
- [ ] Browser tab synchronization
```

#### **1.1.4 Documentation & Root Cause Report (1h)**
```markdown
# Session Persistence Analysis Report

## Findings
1. **Cookie Issues:** [List specific problems]
2. **Token Refresh Issues:** [List timing problems]  
3. **Session Conflicts:** [List race conditions]

## Root Causes
1. **Primary Cause:** [Most critical issue]
2. **Secondary Causes:** [Contributing factors]

## Recommended Solutions
1. **Immediate Fix:** [Quick solution]
2. **Long-term Solution:** [Comprehensive fix]
```

---

## 🔧 Task 1.2: Implement Enhanced Session Management (16 hours)

### **1.2.1 Upgrade Supabase Client Configuration (4h)**

**File:** `src/utils/supabase/client.ts`
```typescript
import { createBrowserClient } from '@supabase/ssr'

export const createClient = () => {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        // ✅ Enhanced session persistence
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
        
        // ✅ Improved token refresh
        refreshTokenRotationEnabled: true,
        refreshTokenRotationThreshold: 30, // seconds before expiry
        
        // ✅ Better error handling
        debug: process.env.NODE_ENV === 'development'
      },
      
      // ✅ Enhanced cookie configuration
      cookieOptions: {
        name: 'sb-auth-token',
        lifetime: 60 * 60 * 24 * 7, // 7 days
        domain: process.env.NODE_ENV === 'production' 
          ? '.your-domain.com' 
          : 'localhost',
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production'
      }
    }
  )
}
```

### **1.2.2 Enhanced Auth Context (6h)**

**File:** `src/contexts/auth-context-enhanced.tsx`
```typescript
'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { createClient } from '@/utils/supabase/client'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  updateUser: (updates: Partial<User>) => void
  refreshUser: () => Promise<void>
  // ✅ New session management methods
  refreshSession: () => Promise<void>
  isSessionValid: () => boolean
  sessionExpiresAt: Date | null
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [sessionExpiresAt, setSessionExpiresAt] = useState<Date | null>(null)
  
  const supabase = createClient()

  // ✅ Enhanced session validation
  const isSessionValid = useCallback(() => {
    if (!session || !sessionExpiresAt) return false
    return new Date() < sessionExpiresAt
  }, [session, sessionExpiresAt])

  // ✅ Proactive session refresh
  const refreshSession = useCallback(async () => {
    try {
      const { data: { session: newSession }, error } = await supabase.auth.refreshSession()
      
      if (error) {
        console.error('Session refresh failed:', error)
        return
      }

      if (newSession) {
        setSession(newSession)
        setUser(newSession.user)
        setSessionExpiresAt(new Date(newSession.expires_at! * 1000))
        
        console.log('✅ Session refreshed successfully')
      }
    } catch (error) {
      console.error('Session refresh error:', error)
    }
  }, [supabase])

  // ✅ Automatic session monitoring
  useEffect(() => {
    let refreshTimer: NodeJS.Timeout

    if (session && sessionExpiresAt) {
      const timeUntilExpiry = sessionExpiresAt.getTime() - Date.now()
      const refreshTime = Math.max(timeUntilExpiry - 5 * 60 * 1000, 60 * 1000) // 5 min before expiry, min 1 min

      refreshTimer = setTimeout(() => {
        refreshSession()
      }, refreshTime)

      console.log(`🔄 Session refresh scheduled in ${Math.round(refreshTime / 1000 / 60)} minutes`)
    }

    return () => {
      if (refreshTimer) clearTimeout(refreshTimer)
    }
  }, [session, sessionExpiresAt, refreshSession])

  // ✅ Enhanced session state management
  useEffect(() => {
    const getInitialSession = async () => {
      const { data: { session: initialSession } } = await supabase.auth.getSession()
      
      if (initialSession) {
        setSession(initialSession)
        setUser(initialSession.user)
        setSessionExpiresAt(new Date(initialSession.expires_at! * 1000))
      }
      
      setLoading(false)
    }

    getInitialSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log('🔍 [AuthContext] Auth state change:', event)
        
        if (currentSession) {
          setSession(currentSession)
          setUser(currentSession.user)
          setSessionExpiresAt(new Date(currentSession.expires_at! * 1000))
        } else {
          setSession(null)
          setUser(null)
          setSessionExpiresAt(null)
        }
        
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase])

  // ... rest of the implementation
}
```

### **1.2.3 Enhanced Middleware (4h)**

**File:** `middleware-enhanced.ts`
```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // ✅ Conditional logging based on environment
  const isDev = process.env.NODE_ENV === 'development'
  if (isDev) {
    console.log(`[Middleware] Processing: ${pathname}`)
  }

  // Allow public routes
  if (pathname.startsWith('/auth') || pathname === '/' || pathname.startsWith('/debug')) {
    return NextResponse.next()
  }

  let response = NextResponse.next({
    request: { headers: request.headers }
  })

  // ✅ Enhanced Supabase client with better error handling
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({ name, value, ...options })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          request.cookies.delete(name)
          response.cookies.delete(name)
        },
      },
    }
  )

  try {
    // ✅ Enhanced session validation with retry
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      if (isDev) {
        console.log(`[Middleware] Session error: ${error.message}`)
      }
      
      // ✅ Attempt session refresh on error
      const { data: { session: refreshedSession } } = await supabase.auth.refreshSession()
      
      if (!refreshedSession) {
        return redirectToLogin(request, pathname)
      }
    }

    if (!session) {
      return redirectToLogin(request, pathname)
    }

    // ✅ Session validity check
    const expiresAt = new Date(session.expires_at! * 1000)
    const now = new Date()
    const timeUntilExpiry = expiresAt.getTime() - now.getTime()

    // If session expires in less than 5 minutes, refresh it
    if (timeUntilExpiry < 5 * 60 * 1000) {
      await supabase.auth.refreshSession()
    }

    if (isDev) {
      console.log(`[Middleware] Valid session for: ${session.user.email}`)
    }

  } catch (error) {
    if (isDev) {
      console.error('[Middleware] Unexpected error:', error)
    }
    return redirectToLogin(request, pathname)
  }

  return response
}

function redirectToLogin(request: NextRequest, pathname: string) {
  const redirectUrl = new URL('/auth/login', request.url)
  redirectUrl.searchParams.set('redirectTo', pathname)
  return NextResponse.redirect(redirectUrl)
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|public).*)']
}
```

### **1.2.4 Session Storage Optimization (2h)**

**File:** `src/lib/session-storage.ts`
```typescript
// ✅ Enhanced session storage with fallbacks
export class SessionStorage {
  private static readonly SESSION_KEY = 'jlpt4you_session'
  private static readonly BACKUP_KEY = 'jlpt4you_session_backup'

  static saveSession(session: any) {
    try {
      const sessionData = {
        session,
        timestamp: Date.now(),
        expiresAt: session.expires_at
      }
      
      localStorage.setItem(this.SESSION_KEY, JSON.stringify(sessionData))
      sessionStorage.setItem(this.BACKUP_KEY, JSON.stringify(sessionData))
    } catch (error) {
      console.error('Failed to save session:', error)
    }
  }

  static getSession() {
    try {
      const stored = localStorage.getItem(this.SESSION_KEY) || 
                   sessionStorage.getItem(this.BACKUP_KEY)
      
      if (!stored) return null

      const sessionData = JSON.parse(stored)
      
      // Check if session is expired
      if (sessionData.expiresAt && new Date(sessionData.expiresAt * 1000) < new Date()) {
        this.clearSession()
        return null
      }

      return sessionData.session
    } catch (error) {
      console.error('Failed to get session:', error)
      return null
    }
  }

  static clearSession() {
    try {
      localStorage.removeItem(this.SESSION_KEY)
      sessionStorage.removeItem(this.BACKUP_KEY)
    } catch (error) {
      console.error('Failed to clear session:', error)
    }
  }
}
```

---

## 🔄 Task 1.3: Add Session Recovery Mechanism (12 hours)

### **1.3.1 Automatic Session Recovery (6h)**

**File:** `src/lib/session-recovery.ts`
```typescript
import { createClient } from '@/utils/supabase/client'
import { SessionStorage } from './session-storage'

export class SessionRecovery {
  private static supabase = createClient()
  private static maxRetries = 3
  private static retryDelay = 1000 // 1 second

  static async recoverSession(): Promise<{ success: boolean; session?: any; error?: string }> {
    console.log('🔄 Attempting session recovery...')

    // Try 1: Get session from Supabase
    try {
      const { data: { session }, error } = await this.supabase.auth.getSession()
      
      if (session && !error) {
        console.log('✅ Session recovered from Supabase')
        SessionStorage.saveSession(session)
        return { success: true, session }
      }
    } catch (error) {
      console.log('❌ Supabase session recovery failed:', error)
    }

    // Try 2: Refresh session with stored refresh token
    try {
      const { data: { session }, error } = await this.supabase.auth.refreshSession()
      
      if (session && !error) {
        console.log('✅ Session recovered via refresh')
        SessionStorage.saveSession(session)
        return { success: true, session }
      }
    } catch (error) {
      console.log('❌ Session refresh failed:', error)
    }

    // Try 3: Check local storage backup
    try {
      const storedSession = SessionStorage.getSession()
      
      if (storedSession) {
        console.log('✅ Session recovered from local storage')
        return { success: true, session: storedSession }
      }
    } catch (error) {
      console.log('❌ Local storage recovery failed:', error)
    }

    console.log('❌ All session recovery attempts failed')
    return { success: false, error: 'Session recovery failed' }
  }

  static async retryWithBackoff<T>(
    operation: () => Promise<T>,
    retries: number = this.maxRetries
  ): Promise<T> {
    try {
      return await operation()
    } catch (error) {
      if (retries > 0) {
        console.log(`🔄 Retrying operation, ${retries} attempts remaining`)
        await new Promise(resolve => setTimeout(resolve, this.retryDelay))
        return this.retryWithBackoff(operation, retries - 1)
      }
      throw error
    }
  }
}
```

### **1.3.2 Graceful Error Handling (4h)**

**File:** `src/components/auth/session-error-boundary.tsx`
```typescript
'use client'

import { Component, ReactNode } from 'react'
import { SessionRecovery } from '@/lib/session-recovery'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  isRecovering: boolean
  recoveryAttempts: number
}

export class SessionErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { 
      hasError: false, 
      isRecovering: false,
      recoveryAttempts: 0
    }
  }

  static getDerivedStateFromError(error: Error): State {
    if (error.message.includes('session') || error.message.includes('auth')) {
      return { hasError: true, isRecovering: false, recoveryAttempts: 0 }
    }
    return { hasError: false, isRecovering: false, recoveryAttempts: 0 }
  }

  async componentDidCatch(error: Error, errorInfo: any) {
    console.error('Session error caught:', error, errorInfo)
    
    if (this.state.recoveryAttempts < 3) {
      this.setState({ isRecovering: true })
      
      const recovery = await SessionRecovery.recoverSession()
      
      if (recovery.success) {
        this.setState({ 
          hasError: false, 
          isRecovering: false,
          recoveryAttempts: 0
        })
        window.location.reload()
      } else {
        this.setState({ 
          isRecovering: false,
          recoveryAttempts: this.state.recoveryAttempts + 1
        })
      }
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.state.isRecovering) {
        return (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Đang khôi phục phiên đăng nhập...</p>
            </div>
          </div>
        )
      }

      return this.props.fallback || (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-4">Phiên đăng nhập đã hết hạn</h2>
            <p className="mb-4">Vui lòng đăng nhập lại để tiếp tục</p>
            <button 
              onClick={() => window.location.href = '/auth/login'}
              className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
            >
              Đăng nhập lại
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
```

### **1.3.3 Session Validation Middleware (2h)**

**File:** `src/lib/session-validator.ts`
```typescript
import { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export class SessionValidator {
  static async validateSession(request: NextRequest) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set() {}, // No-op for validation
          remove() {} // No-op for validation
        }
      }
    )

    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        return { valid: false, error: error.message }
      }

      if (!session) {
        return { valid: false, error: 'No session found' }
      }

      // Check session expiry
      const expiresAt = new Date(session.expires_at! * 1000)
      const now = new Date()
      
      if (expiresAt <= now) {
        return { valid: false, error: 'Session expired' }
      }

      // Check if session expires soon (within 5 minutes)
      const timeUntilExpiry = expiresAt.getTime() - now.getTime()
      const needsRefresh = timeUntilExpiry < 5 * 60 * 1000

      return { 
        valid: true, 
        session, 
        needsRefresh,
        expiresAt,
        timeUntilExpiry
      }
    } catch (error) {
      return { valid: false, error: 'Session validation failed' }
    }
  }
}
```

---

## 🧪 Task 1.4: Test Session Stability (4 hours)

### **1.4.1 Automated Testing Suite (2h)**

**File:** `src/__tests__/session-persistence.test.ts`
```typescript
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { SessionStorage } from '@/lib/session-storage'
import { SessionRecovery } from '@/lib/session-recovery'

describe('Session Persistence', () => {
  beforeEach(() => {
    // Clear all storage before each test
    localStorage.clear()
    sessionStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  describe('SessionStorage', () => {
    it('should save and retrieve session data', () => {
      const mockSession = {
        access_token: 'test-token',
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        user: { id: 'test-user', email: 'test@example.com' }
      }

      SessionStorage.saveSession(mockSession)
      const retrieved = SessionStorage.getSession()

      expect(retrieved).toEqual(mockSession)
    })

    it('should handle expired sessions', () => {
      const expiredSession = {
        access_token: 'expired-token',
        expires_at: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
        user: { id: 'test-user', email: 'test@example.com' }
      }

      SessionStorage.saveSession(expiredSession)
      const retrieved = SessionStorage.getSession()

      expect(retrieved).toBeNull()
    })
  })

  describe('SessionRecovery', () => {
    it('should attempt multiple recovery methods', async () => {
      // Mock implementation would go here
      // Test recovery from Supabase, refresh token, and local storage
    })
  })
})
```

### **1.4.2 Manual Testing Checklist (2h)**

```markdown
# Session Persistence Testing Checklist

## Browser Testing
- [ ] Chrome (latest)
- [ ] Firefox (latest)  
- [ ] Safari (latest)
- [ ] Edge (latest)

## Session Duration Testing
- [ ] 1 hour session persistence
- [ ] 24 hour session persistence
- [ ] 7 day session persistence
- [ ] Cross-tab synchronization

## Network Conditions
- [ ] Stable connection
- [ ] Intermittent connection
- [ ] Offline/online transitions
- [ ] Slow network conditions

## Device Testing
- [ ] Desktop browsers
- [ ] Mobile browsers (iOS Safari, Android Chrome)
- [ ] Tablet browsers
- [ ] Different screen sizes

## Edge Cases
- [ ] Multiple tabs open
- [ ] Browser restart
- [ ] System restart
- [ ] Cookie clearing
- [ ] Local storage clearing

## Recovery Testing
- [ ] Automatic session recovery
- [ ] Manual session recovery
- [ ] Graceful error handling
- [ ] Fallback authentication
```

---

## 📊 Success Metrics

### **Quantitative Metrics**
- [ ] Session persistence > 24 hours (Target: 7 days)
- [ ] Login frequency reduced by 80%
- [ ] Session recovery success rate > 95%
- [ ] Cross-browser compatibility 100%

### **Qualitative Metrics**
- [ ] Zero session-related user complaints
- [ ] Improved user experience feedback
- [ ] Reduced support tickets
- [ ] Developer satisfaction with session handling

---

## 🚀 Deployment Strategy

### **Staging Deployment**
1. Deploy to staging environment
2. Run automated test suite
3. Perform manual testing
4. Load testing with multiple users
5. Security testing

### **Production Rollout**
1. **Phase 1:** 10% of users (A/B test)
2. **Phase 2:** 50% of users (if metrics good)
3. **Phase 3:** 100% rollout
4. **Monitoring:** Real-time session metrics
5. **Rollback:** Immediate if issues detected

---

**Implementation Status:** ✅ Ready to Begin  
**Next Step:** Start Task 1.1 - Root Cause Analysis

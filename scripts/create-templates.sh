#!/bin/bash

# 🔧 JLPT4YOU - CREATE MIGRATION TEMPLATES
# This script creates all template files needed for the authentication refactor

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 Creating migration templates...${NC}"

# Create directories
mkdir -p templates
mkdir -p src/lib/supabase
mkdir -p src/contexts
mkdir -p src/components/auth
mkdir -p src/lib
mkdir -p tests

# 1. Supabase Client Template
echo -e "${YELLOW}📝 Creating Supabase client template...${NC}"

cat > templates/supabase-client.ts << 'EOF'
import { createBrowserClient } from '@supabase/ssr'

export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
EOF

# 2. Supabase Server Template
echo -e "${YELLOW}📝 Creating Supabase server template...${NC}"

cat > templates/supabase-server.ts << 'EOF'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const createClient = async () => {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server component
          }
        },
      },
    }
  )
}
EOF

# 3. Auth Context V2 Template
echo -e "${YELLOW}📝 Creating Auth Context v2 template...${NC}"

cat > templates/auth-context-v2.tsx << 'EOF'
'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
})

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase])

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
EOF

# 4. Middleware V2 Template
echo -e "${YELLOW}📝 Creating Middleware v2 template...${NC}"

cat > templates/middleware-v2.ts << 'EOF'
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

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
            supabaseResponse.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Refresh session if expired
  const { data: { user } } = await supabase.auth.getUser()

  // Protected routes check
  const isProtectedRoute = ['/admin', '/settings', '/library', '/home'].some(route =>
    request.nextUrl.pathname.startsWith(route)
  )

  if (isProtectedRoute && !user) {
    const redirectUrl = new URL('/auth/1', request.url)
    redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Admin routes check
  if (request.nextUrl.pathname.startsWith('/admin') && user) {
    // Check if user is admin
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userData?.role !== 'Admin') {
      return NextResponse.redirect(new URL('/home', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
EOF

# 5. Feature Flags Template
echo -e "${YELLOW}📝 Creating Feature Flags template...${NC}"

cat > templates/feature-flags.ts << 'EOF'
export const FEATURE_FLAGS = {
  USE_NEW_AUTH: process.env.NEXT_PUBLIC_USE_NEW_AUTH === 'true',
  USE_NEW_MIDDLEWARE: process.env.NEXT_PUBLIC_USE_NEW_MIDDLEWARE === 'true',
  USE_NEW_API_AUTH: process.env.NEXT_PUBLIC_USE_NEW_API_AUTH === 'true',
  ROLLOUT_PERCENTAGE: parseInt(process.env.NEXT_PUBLIC_ROLLOUT_PERCENTAGE || '0'),
} as const

export function useFeatureFlag(flag: keyof typeof FEATURE_FLAGS): boolean {
  return FEATURE_FLAGS[flag]
}

export function isUserInRollout(userId: string): boolean {
  if (FEATURE_FLAGS.ROLLOUT_PERCENTAGE === 100) return true
  if (FEATURE_FLAGS.ROLLOUT_PERCENTAGE === 0) return false
  
  // Use user ID hash to determine rollout
  const hash = userId.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0)
    return a & a
  }, 0)
  
  return Math.abs(hash) % 100 < FEATURE_FLAGS.ROLLOUT_PERCENTAGE
}
EOF

# 6. Auth Utils V2 Template
echo -e "${YELLOW}📝 Creating Auth Utils v2 template...${NC}"

cat > templates/auth-utils-v2.ts << 'EOF'
import { createClient } from '@/lib/supabase/server'
import { FEATURE_FLAGS, isUserInRollout } from '@/lib/feature-flags'
import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'

export async function getAuthenticatedUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    throw new Error('Unauthorized')
  }

  return user
}

export async function getAuthenticatedUserWithFallback(request?: NextRequest) {
  if (!FEATURE_FLAGS.USE_NEW_API_AUTH) {
    return getAuthenticatedUserLegacy(request)
  }

  try {
    return await getAuthenticatedUser()
  } catch (error) {
    // Fallback to legacy if new auth fails
    return getAuthenticatedUserLegacy(request)
  }
}

// Legacy fallback for backward compatibility
async function getAuthenticatedUserLegacy(request?: NextRequest) {
  const cookieStore = await cookies()
  const authToken = cookieStore.get('jlpt4you_auth_token')?.value

  if (!authToken) {
    throw new Error('Unauthorized')
  }

  // Import legacy supabase client
  const { supabaseAdmin } = await import('@/lib/supabase')
  
  if (!supabaseAdmin) {
    throw new Error('Service unavailable')
  }

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(authToken)
  
  if (error || !user) {
    throw new Error('Unauthorized')
  }

  return user
}

export async function requireAdmin() {
  const user = await getAuthenticatedUser()
  
  const supabase = await createClient()
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (userData?.role !== 'Admin') {
    throw new Error('Forbidden')
  }

  return user
}
EOF

# 7. Protected Route Component Template
echo -e "${YELLOW}📝 Creating Protected Route component template...${NC}"

cat > templates/protected-route-v2.tsx << 'EOF'
'use client'

import { useAuth } from '@/contexts/auth-context-v2'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAdmin?: boolean
  fallbackUrl?: string
}

export function ProtectedRoute({ 
  children, 
  requireAdmin = false,
  fallbackUrl = '/auth/1'
}: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push(fallbackUrl)
    }
  }, [user, loading, router, fallbackUrl])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  // TODO: Add admin check if requireAdmin is true

  return <>{children}</>
}
EOF

# 8. Test Template
echo -e "${YELLOW}📝 Creating test template...${NC}"

cat > templates/auth-migration.test.ts << 'EOF'
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { createClient } from '@/lib/supabase/client'

describe('Auth Migration Tests', () => {
  beforeEach(() => {
    // Setup test environment
  })

  afterEach(() => {
    // Cleanup test environment
  })

  describe('Authentication Flow', () => {
    it('should authenticate users with new system', async () => {
      // Test new auth flow
      expect(true).toBe(true) // Placeholder
    })

    it('should handle logout correctly', async () => {
      // Test logout flow
      expect(true).toBe(true) // Placeholder
    })

    it('should refresh expired tokens', async () => {
      // Test token refresh
      expect(true).toBe(true) // Placeholder
    })
  })

  describe('Route Protection', () => {
    it('should protect admin routes', async () => {
      // Test admin protection
      expect(true).toBe(true) // Placeholder
    })

    it('should redirect unauthenticated users', async () => {
      // Test redirect logic
      expect(true).toBe(true) // Placeholder
    })
  })

  describe('API Authentication', () => {
    it('should handle PDF access correctly', async () => {
      // Test PDF proxy
      expect(true).toBe(true) // Placeholder
    })

    it('should validate API keys', async () => {
      // Test API key validation
      expect(true).toBe(true) // Placeholder
    })
  })

  describe('Backward Compatibility', () => {
    it('should fallback to legacy auth when needed', async () => {
      // Test fallback mechanism
      expect(true).toBe(true) // Placeholder
    })
  })
})
EOF

echo -e "${GREEN}✅ All templates created successfully!${NC}"

# Make scripts executable
chmod +x scripts/*.sh

echo -e "${BLUE}📋 Template files created:${NC}"
echo -e "${YELLOW}  - templates/supabase-client.ts${NC}"
echo -e "${YELLOW}  - templates/supabase-server.ts${NC}"
echo -e "${YELLOW}  - templates/auth-context-v2.tsx${NC}"
echo -e "${YELLOW}  - templates/middleware-v2.ts${NC}"
echo -e "${YELLOW}  - templates/feature-flags.ts${NC}"
echo -e "${YELLOW}  - templates/auth-utils-v2.ts${NC}"
echo -e "${YELLOW}  - templates/protected-route-v2.tsx${NC}"
echo -e "${YELLOW}  - templates/auth-migration.test.ts${NC}"

echo ""
echo -e "${GREEN}🎉 Ready to start migration! Run the following commands:${NC}"
echo -e "${YELLOW}1. ./scripts/backup-project.sh${NC}"
echo -e "${YELLOW}2. ./scripts/setup-migration.sh${NC}"
echo -e "${YELLOW}3. Follow the phases in instruc-refactor.md${NC}"

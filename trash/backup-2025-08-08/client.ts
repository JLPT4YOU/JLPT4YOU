/**
 * Enhanced Supabase Client for Browser
 * ✅ ENHANCED: Optimized session management and cookie handling
 * Features: Auto-refresh, persistent sessions, optimized cookies
 */

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/supabase'

// ✅ ENHANCED: Optimized client configuration
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        // ✅ Enhanced session persistence
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',

        // ✅ Better error handling - Disable debug logs completely
        debug: false
      },

      // ✅ Enhanced cookie configuration for better persistence
      cookieOptions: {
        name: 'jlpt4you-auth',
        domain: process.env.NODE_ENV === 'production'
          ? process.env.NEXT_PUBLIC_DOMAIN || 'localhost'
          : 'localhost',
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        httpOnly: false // Must be false for client-side access
      }
    }
  )
}

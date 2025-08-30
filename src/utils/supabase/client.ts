/**
 * Enhanced Supabase Client for Browser
 * ✅ ENHANCED: Optimized session management and cookie handling
 * Features: Auto-refresh, persistent sessions, optimized cookies
 */

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/supabase'

// Validate environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
}

if (!supabaseAnonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable')
}

// ✅ ENHANCED: Optimized client configuration
export function createClient() {
  return createBrowserClient<Database>(
    supabaseUrl!,
    supabaseAnonKey!,
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

      // ⚠️ Important: Rely on Supabase managed cookies (httpOnly on server)
      // Do NOT expose auth cookies to client-side JavaScript
      // Using default cookie options from @supabase/ssr
      // (No custom cookieOptions here to avoid insecure setups)
    }
  )
}

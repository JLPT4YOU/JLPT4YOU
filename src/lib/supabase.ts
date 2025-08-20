/**
 * Supabase Client Configuration
 * Exports admin client for server-side operations
 */

import { createClient } from '@supabase/supabase-js'

// Admin client with service role key for server-side operations only
// This file MUST NOT be imported in client-side code
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

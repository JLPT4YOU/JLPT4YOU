/**
 * Supabase Auth Callback Route
 * Handles OAuth callbacks (Google, etc.)
 */

import { NextRequest, NextResponse } from 'next/server'
// ✅ FIXED: Use server-side Supabase client for proper cookie handling
import { createClient } from '@/utils/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  // Handle OAuth errors
  if (error) {
    console.error('OAuth error:', error, errorDescription)
    const errorMessage = errorDescription || 'Authentication failed'
    return NextResponse.redirect(`${origin}/auth/error?message=${encodeURIComponent(errorMessage)}`)
  }

  if (code) {
    try {
      // ✅ FIXED: Use server-side client for proper cookie handling
      const supabase = await createClient()
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

      if (exchangeError) {
        console.error('Auth callback error:', exchangeError)
        return NextResponse.redirect(`${origin}/auth/error?message=${encodeURIComponent(exchangeError.message)}`)
      }

      if (data.session) {
        console.log('Auth callback successful:', data.user?.email)

        // Always redirect to clean URL /home after successful OAuth login
        // Language preference is preserved in cookies/localStorage for UI language
        return NextResponse.redirect(`${origin}/home`)
      } else {
        console.warn('Auth callback: No session created')
        return NextResponse.redirect(`${origin}/auth/error?message=No session created`)
      }
    } catch (error) {
      console.error('Auth callback exception:', error)
      return NextResponse.redirect(`${origin}/auth/error?message=Authentication failed`)
    }
  }

  // If no code, redirect to login with error
  console.warn('Auth callback: No authorization code provided')
  return NextResponse.redirect(`${origin}/auth/error?message=No authorization code provided`)
}

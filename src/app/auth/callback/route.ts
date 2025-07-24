/**
 * Supabase Auth Callback Route
 * Handles OAuth callbacks (Google, etc.)
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/test-auth'

  if (code) {
    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('Auth callback error:', error)
        return NextResponse.redirect(`${origin}/auth/error?message=${encodeURIComponent(error.message)}`)
      }

      if (data.session) {
        console.log('Auth callback successful:', data.user?.email)
        return NextResponse.redirect(`${origin}${next}`)
      }
    } catch (error) {
      console.error('Auth callback exception:', error)
      return NextResponse.redirect(`${origin}/auth/error?message=Authentication failed`)
    }
  }

  // If no code or session, redirect to login
  return NextResponse.redirect(`${origin}/test-auth`)
}

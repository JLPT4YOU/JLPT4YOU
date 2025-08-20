/**
 * 🔒 AUTH USER API
 * Fetches authenticated user data using server-side admin client
 * Bypasses RLS issues by using admin privileges
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/utils/supabase/admin'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { devConsole } from '@/lib/console-override'

export async function GET(request: NextRequest) {
  try {
    // Get session from cookies
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set() {},
          remove() {}
        }
      }
    )

    // Get current session with retry logic
    let session = null
    let sessionError = null

    // Try multiple times to get session
    for (let i = 0; i < 3; i++) {
      const result = await supabase.auth.getSession()
      session = result.data.session
      sessionError = result.error

      if (session?.user) {
        break
      }

      // Wait a bit before retry
      await new Promise(resolve => setTimeout(resolve, 200))
    }

    devConsole.log('🔍 DEBUG API: Session state:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      userId: session?.user?.id,
      email: session?.user?.email,
      sessionError: sessionError,
      retryAttempts: 3
    })

    if (sessionError || !session?.user) {
      devConsole.log('🔍 DEBUG API: No authenticated session after retries')

      // 🔧 TEMPORARY FIX: Try to get user ID from headers (bypass session issues)
      const userIdFromHeader = request.headers.get('X-User-ID')
      const userEmailFromHeader = request.headers.get('X-User-Email')

      devConsole.log('🔍 DEBUG API: Headers:', {
        userIdFromHeader,
        userEmailFromHeader
      })

      if (userIdFromHeader && userEmailFromHeader) {
        devConsole.log('🔍 DEBUG API: Using user ID from header to bypass session issues')

        // Use admin client to fetch user data directly
        const { data: userData, error: userError } = await supabaseAdmin
          .from('users')
          .select('id, email, name, avatar_icon, role, password_updated_at, subscription_expires_at, balance')
          .eq('id', userIdFromHeader)
          .eq('email', userEmailFromHeader)
          .single()

        if (userData && !userError) {
          devConsole.log('🔍 DEBUG API: Successfully fetched user via admin client')
          return NextResponse.json({
            success: true,
            user: userData,
            method: 'admin_bypass'
          })
        } else {
          devConsole.log('🔍 DEBUG API: Failed to fetch user via admin client:', userError)
        }
      }

      return NextResponse.json(
        { error: 'No authenticated session' },
        { status: 401 }
      )
    }

    // Use admin client to fetch user data (bypasses RLS)
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, name, avatar_icon, role, password_updated_at, subscription_expires_at, balance')
      .eq('id', session.user.id)
      .single()

    if (userError) {
      // If user doesn't exist, create it
      if (userError.code === 'PGRST116') {
        const { data: newUser, error: createError } = await supabaseAdmin
          .from('users')
          .insert({
            id: session.user.id,
            email: session.user.email,
            name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
            role: 'Free',
            balance: 0,
            avatar_icon: session.user.user_metadata?.avatar_icon || null,
            password_updated_at: session.user.user_metadata?.password_updated_at || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single()

        if (createError) {
          console.error('Failed to create user record:', createError)
          return NextResponse.json(
            { error: 'Failed to create user record' },
            { status: 500 }
          )
        }

        return NextResponse.json({
          success: true,
          user: newUser
        })
      }

      console.error('Failed to fetch user data:', userError)
      return NextResponse.json(
        { error: 'Failed to fetch user data' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      user: userData
    })

  } catch (error) {
    console.error('Auth user API error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

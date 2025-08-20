/**
 * Debug API for Session Validation
 * Kiểm tra SessionValidator hoạt động như thế nào trên production
 */

import { NextRequest, NextResponse } from 'next/server'
import { SessionValidator } from '@/lib/session-validator'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    const debugInfo: any = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      checks: {}
    };

    // 1. Kiểm tra cookies
    const cookies = request.cookies.getAll()
    debugInfo.checks.cookies = {
      count: cookies.length,
      names: cookies.map(c => c.name),
      hasSupabaseAuth: cookies.some(c => c.name.includes('supabase')),
      authCookies: cookies.filter(c => c.name.includes('supabase')).map(c => ({
        name: c.name,
        hasValue: !!c.value,
        valueLength: c.value?.length || 0
      }))
    };

    // 2. Kiểm tra headers
    debugInfo.checks.headers = {
      authorization: !!request.headers.get('authorization'),
      userAgent: request.headers.get('user-agent')?.substring(0, 50) + '...',
      referer: request.headers.get('referer'),
      origin: request.headers.get('origin'),
      xRequestedWith: request.headers.get('x-requested-with')
    };

    // 3. Test SessionValidator với logging enabled
    try {
      const validationResult = await SessionValidator.validateSession(request, {
        enableRefresh: true,
        refreshThreshold: 5,
        enableUserValidation: true,
        logValidation: true, // Force logging
        securityChecks: false // Disable security checks for debug
      });

      debugInfo.checks.sessionValidation = {
        valid: validationResult.valid,
        error: validationResult.error,
        validationMethod: validationResult.validationMethod,
        hasUser: !!validationResult.user,
        hasSession: !!validationResult.session,
        userEmail: validationResult.user?.email,
        sessionExpiry: validationResult.session?.expires_at
      };
    } catch (err) {
      debugInfo.checks.sessionValidation = {
        valid: false,
        error: err instanceof Error ? err.message : 'Unknown error',
        exception: true
      };
    }

    // 4. Test direct Supabase client
    try {
      const supabase = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      // Try to get session from cookies
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      debugInfo.checks.directSupabase = {
        hasSession: !!session,
        sessionError: sessionError?.message,
        userEmail: session?.user?.email,
        expiresAt: session?.expires_at,
        accessToken: session?.access_token ? 'present' : 'missing'
      };

      // Try to get user
      if (session) {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        debugInfo.checks.directSupabase.userCheck = {
          hasUser: !!user,
          userError: userError?.message,
          userId: user?.id
        };
      }
    } catch (err) {
      debugInfo.checks.directSupabase = {
        error: err instanceof Error ? err.message : 'Unknown error',
        exception: true
      };
    }

    // 5. Environment variables check
    debugInfo.checks.environment = {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV
    };

    return NextResponse.json(debugInfo);

  } catch (error) {
    console.error('Debug session API error:', error);
    return NextResponse.json(
      { 
        error: 'Debug session API failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

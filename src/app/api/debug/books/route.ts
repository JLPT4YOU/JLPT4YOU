/**
 * Debug API for Books - Kiểm tra vấn đề production
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    const debugInfo: any = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      checks: {}
    };

    // 1. Kiểm tra environment variables
    debugInfo.checks.envVars = {
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      urls: {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...',
        anonKeyPrefix: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20) + '...',
        serviceKeyPrefix: process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20) + '...'
      }
    };

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      debugInfo.error = 'Missing required environment variables';
      return NextResponse.json(debugInfo, { status: 500 });
    }

    // 2. Test anon key connection
    const supabaseAnon = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    try {
      const { data: anonBooks, error: anonError } = await supabaseAnon
        .from('books')
        .select('id, title, category, status')
        .eq('status', 'published')
        .limit(5);

      debugInfo.checks.anonConnection = {
        success: !anonError,
        error: anonError?.message,
        booksCount: anonBooks?.length || 0,
        sampleBooks: anonBooks?.map(b => ({ id: b.id, title: b.title, category: b.category })) || []
      };
    } catch (err) {
      debugInfo.checks.anonConnection = {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error'
      };
    }

    // 3. Test service role key connection
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const supabaseAdmin = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      try {
        const { data: adminBooks, error: adminError } = await supabaseAdmin
          .from('books')
          .select('id, title, category, status')
          .limit(10);

        debugInfo.checks.serviceRoleConnection = {
          success: !adminError,
          error: adminError?.message,
          totalBooksCount: adminBooks?.length || 0,
          statusBreakdown: adminBooks?.reduce((acc: any, book: any) => {
            acc[book.status] = (acc[book.status] || 0) + 1;
            return acc;
          }, {}) || {},
          categoryBreakdown: adminBooks?.reduce((acc: any, book: any) => {
            acc[book.category] = (acc[book.category] || 0) + 1;
            return acc;
          }, {}) || {}
        };
      } catch (err) {
        debugInfo.checks.serviceRoleConnection = {
          success: false,
          error: err instanceof Error ? err.message : 'Unknown error'
        };
      }
    } else {
      debugInfo.checks.serviceRoleConnection = {
        success: false,
        error: 'SUPABASE_SERVICE_ROLE_KEY not set'
      };
    }

    // 4. Test actual API call
    try {
      const apiUrl = new URL('/api/books', request.url);
      apiUrl.searchParams.set('status', 'published');
      apiUrl.searchParams.set('limit', '5');

      const apiResponse = await fetch(apiUrl.toString(), {
        headers: {
          'User-Agent': 'Debug-Script'
        }
      });

      if (apiResponse.ok) {
        const apiData = await apiResponse.json();
        debugInfo.checks.apiEndpoint = {
          success: true,
          status: apiResponse.status,
          booksCount: apiData.books?.length || 0,
          total: apiData.total || 0,
          hasMore: apiData.hasMore || false
        };
      } else {
        debugInfo.checks.apiEndpoint = {
          success: false,
          status: apiResponse.status,
          statusText: apiResponse.statusText
        };
      }
    } catch (err) {
      debugInfo.checks.apiEndpoint = {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error'
      };
    }

    return NextResponse.json(debugInfo);

  } catch (error) {
    console.error('Debug API error:', error);
    return NextResponse.json(
      { 
        error: 'Debug API failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

/**
 * 🔒 ADMIN BALANCE API
 * Admin-only balance fetch endpoint with proper authentication
 * 🔒 SECURITY: Requires admin authentication
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/utils/supabase/admin'
import { requireAdminAuth } from '@/lib/admin-auth'

export async function GET(request: NextRequest) {
  try {
    // 🔒 STEP 1: VERIFY ADMIN AUTHENTICATION
    const authResult = await requireAdminAuth(request)
    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      )
    }

    // Admin user verified by auth check above
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    // Validate required fields
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId parameter required' },
        { status: 400 }
      )
    }

    // Check if admin client is available
    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, error: 'Server configuration error' },
        { status: 500 }
      )
    }

    // Get user balance
    const { data: userData, error } = await supabaseAdmin
      .from('users')
      .select('id, email, balance')
      .eq('id', userId)
      .single()

    if (error || !userData) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'User not found',
          details: error?.message 
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      balance: userData.balance || 0,
      user: {
        id: userData.id,
        email: userData.email
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Admin balance fetch error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

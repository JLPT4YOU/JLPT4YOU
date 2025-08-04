/**
 * Admin Users API Route
 * GET /api/admin/users
 * Returns full list of users. Requires caller to be authenticated as Admin.
 * 🔒 SECURITY: Implements proper authentication and admin role verification
 */

import { NextResponse, NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
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

    const adminUser = authResult.user!

    // 🔒 STEP 2: FETCH USERS WITH ADMIN PRIVILEGES
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Service role client unavailable' }, { status: 500 })
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching users (admin):', error)
      return NextResponse.json({ error: 'Error fetching users' }, { status: 500 })
    }

    // 🔒 STEP 3: RETURN SECURE RESPONSE
    return NextResponse.json({
      users: data,
      requestedBy: {
        id: adminUser.id,
        email: adminUser.email,
        role: adminUser.role
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Admin users API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

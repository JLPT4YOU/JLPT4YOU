/**
 * Top-up API Route
 * Handles user balance top-up operations
 * 🔒 SECURITY: Requires authentication and user verification
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { addBalance } from '@/lib/balance-utils'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

// Type definitions
interface TopUpRequestBody {
  userId: string
  amount: number
  paymentMethod: string
  transactionId?: string
}

// TopUpResponse interface removed - using inline response types

/**
 * 🔒 AUTHENTICATION HELPER
 * Verifies user authentication and returns authenticated user
 */
async function getAuthenticatedUser(_request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const authToken = cookieStore.get('jlpt4you_auth_token')?.value

    if (!authToken) {
      return { error: 'Authentication required', status: 401 }
    }

    // Create Supabase client with auth token
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        },
      }
    )

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { error: 'Invalid authentication', status: 401 }
    }

    return { user, error: null }
  } catch (error) {
    console.error('Authentication error:', error)
    return { error: 'Authentication failed', status: 500 }
  }
}

export async function POST(request: NextRequest) {
  try {
    // 🔒 STEP 1: AUTHENTICATE USER
    const authResult = await getAuthenticatedUser(request)
    if (authResult.error) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      )
    }

    const authenticatedUser = authResult.user!

    // Parse request body
    const body: TopUpRequestBody = await request.json()

    // 🔒 STEP 2: VALIDATE USER AUTHORIZATION
    // User can only top-up their own account (unless admin)
    if (body.userId !== authenticatedUser.id) {
      // Check if user is admin
      if (!supabaseAdmin) {
        return NextResponse.json(
          { success: false, error: 'Server configuration error' },
          { status: 500 }
        )
      }

      const { data: userData } = await supabaseAdmin
        .from('users')
        .select('role')
        .eq('id', authenticatedUser.id)
        .single()

      if (userData?.role !== 'Admin') {
        return NextResponse.json(
          {
            success: false,
            error: 'Unauthorized: You can only top-up your own account'
          },
          { status: 403 }
        )
      }
    }

    // Validate required fields
    if (!body.userId || !body.amount || !body.paymentMethod) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: userId, amount, or paymentMethod'
        },
        { status: 400 }
      )
    }
    
    // Validate amount
    if (body.amount <= 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Amount must be positive' 
        },
        { status: 400 }
      )
    }
    
    // Add balance to user account
    const result = await addBalance(body.userId, body.amount)
    
    if (!result.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: result.error 
        },
        { status: 400 }
      )
    }
    
    // 🔒 STEP 3: LOG SECURE TRANSACTION
    console.log(`🔒 SECURE Top-up: User ${authenticatedUser.id} (${authenticatedUser.email}) topped up ${body.amount} VND for user ${body.userId}`)

    // Return success response
    return NextResponse.json({
      success: true,
      newBalance: result.newBalance,
      message: 'Top-up successful',
      transactionId: `txn_${Date.now()}_${body.userId}` // Add transaction tracking
    })
    
  } catch (error) {
    console.error('Top-up API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // 🔒 STEP 1: AUTHENTICATE USER
    const authResult = await getAuthenticatedUser(request)
    if (authResult.error) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      )
    }

    const authenticatedUser = authResult.user!
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    // 🔒 STEP 2: VALIDATE USER AUTHORIZATION
    // If no userId provided, return authenticated user's balance
    const targetUserId = userId || authenticatedUser.id

    // User can only view their own balance (unless admin)
    if (targetUserId !== authenticatedUser.id) {
      // Check if user is admin
      if (!supabaseAdmin) {
        return NextResponse.json(
          { success: false, error: 'Server configuration error' },
          { status: 500 }
        )
      }

      const { data: userData } = await supabaseAdmin
        .from('users')
        .select('role')
        .eq('id', authenticatedUser.id)
        .single()

      if (userData?.role !== 'Admin') {
        return NextResponse.json(
          {
            success: false,
            error: 'Unauthorized: You can only view your own balance'
          },
          { status: 403 }
        )
      }
    }
    
    // Get user's current balance
    const client = supabaseAdmin
    if (!client) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Server-side Supabase client not available' 
        },
        { status: 500 }
      )
    }
    
    const { data, error } = await client
      .from('users')
      .select('balance')
      .eq('id', targetUserId)
      .single()
    
    if (error) {
      console.error('Error fetching user balance:', error)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to fetch balance' 
        },
        { status: 400 }
      )
    }
    
    return NextResponse.json({
      success: true,
      balance: data?.balance || 0
    })
    
  } catch (error) {
    console.error('Balance fetch API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    )
  }
}

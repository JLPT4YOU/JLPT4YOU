/**
 * Top-up API Route
 * Handles user balance top-up operations
 * 🔒 SECURITY: Requires authentication and user verification
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/utils/supabase/admin'
import { addBalanceServer } from '@/lib/balance-utils-server'
import { requireAdminAuth } from '@/lib/admin-auth'
import { SessionValidator } from '@/lib/session-validator' // ✅ ADDED: Session validator
import { sendTopUpSuccessAdmin } from '@/lib/notifications-server'
import { devConsole } from '@/lib/console-override'

// Type definitions
interface TopUpRequestBody {
  userId: string
  amount: number
  paymentMethod: string
  transactionId?: string
}

// TopUpResponse interface removed - using inline response types

// Minimal internal user type for GET route (admin or regular)
type SafeUser = { id: string; email?: string; role?: string }

/**
 * ✅ ENHANCED AUTHENTICATION HELPER
 * Uses SessionValidator for comprehensive authentication
 */
async function getAuthenticatedUser(request: NextRequest) {
  try {
    devConsole.log('[Topup API] Validating session...')

    const validationResult = await SessionValidator.validateSession(request, {
      enableRefresh: true,
      refreshThreshold: 5,
      enableUserValidation: true,
      logValidation: process.env.NODE_ENV === 'development',
      securityChecks: true
    })

    if (!validationResult.valid) {
      devConsole.log(`[Topup API] Session validation failed: ${validationResult.error}`)
      return {
        user: null,
        error: validationResult.error || 'Authentication failed'
      }
    }

    const user = validationResult.user || validationResult.session?.user
    if (!user) {
      devConsole.log('[Topup API] No user found in validation result')
      return {
        user: null,
        error: 'User not found'
      }
    }

    devConsole.log(`[Topup API] Session validation successful for user: ${user.email}`)
    return { user, error: null }

  } catch (error) {
    console.error('[Topup API] Authentication error:', error)
    return {
      user: null,
      error: error instanceof Error ? error.message : 'Authentication failed'
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    // 🔒 STEP 1: AUTHENTICATE USER
    const authResult = await getAuthenticatedUser(request)
    if (authResult.error) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: 401 } // ✅ FIXED: Use fixed status code
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
    const result = await addBalanceServer(body.userId, body.amount)
    
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
    devConsole.log(`🔒 SECURE Top-up: User ${authenticatedUser.id} (${authenticatedUser.email}) topped up ${body.amount} VND for user ${body.userId}`)

    // 📣 STEP 4: SEND NOTIFICATION
    await sendTopUpSuccessAdmin(body.userId, body.amount)

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
    // 🔒 STEP 1: TRY ADMIN AUTHENTICATION FIRST
    const adminAuthResult = await requireAdminAuth(request)

    let authenticatedUser: SafeUser | null = null
    let isAdmin = false

    if (!adminAuthResult.error) {
      // Admin authentication successful
      authenticatedUser = adminAuthResult.user!
      isAdmin = true
    } else {
      // Fallback to regular user authentication
      const authResult = await getAuthenticatedUser(request)
      if (authResult.error) {
        return NextResponse.json(
          { success: false, error: 'Authentication required' },
          { status: 401 }
        )
      }
      authenticatedUser = { id: authResult.user!.id, email: authResult.user!.email }
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    // 🔒 STEP 2: VALIDATE USER AUTHORIZATION
    // If no userId provided, return authenticated user's balance
    const targetUserId = userId || authenticatedUser!.id

    // User can only view their own balance (unless admin)
    if (targetUserId !== authenticatedUser!.id && !isAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized: You can only view your own balance'
        },
        { status: 403 }
      )
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

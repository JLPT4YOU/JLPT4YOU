/**
 * Admin Top-up API Route
 * POST /api/admin/topup
 * Allows admins to top-up user balances
 * 🔒 SECURITY: Requires admin authentication and role verification
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/utils/supabase/admin'
import { addBalanceServer } from '@/lib/balance-utils-server'
import { logTransaction } from '@/lib/transaction-utils'
import { requireAdminAuth } from '@/lib/admin-auth'
// Note: Notification service and debug console not implemented yet
import { logAdminAction, extractRequestInfo, ADMIN_ACTIONS } from '@/lib/admin-logging'

export async function POST(request: NextRequest) {
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

    // 🔒 STEP 2: PARSE AND VALIDATE INPUT
    const { userId, amount, description } = await request.json()

    console.log('🔍 Topup request:', { userId, amount, description, adminUser: adminUser.email })

    // Validate input
    if (!userId || !amount || amount <= 0) {
      console.log('❌ Validation failed:', { userId, amount })
      return NextResponse.json(
        { error: 'User ID and positive amount are required' },
        { status: 400 }
      )
    }

    // Validate amount limits (prevent abuse)
    if (amount > 10000) {
      return NextResponse.json(
        { error: 'Amount exceeds maximum limit (10,000)' },
        { status: 400 }
      )
    }

    // 🔒 STEP 3: VERIFY TARGET USER EXISTS
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const { data: targetUser, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, balance')
      .eq('id', userId)
      .single()

    if (userError || !targetUser) {
      return NextResponse.json(
        { error: 'Target user not found' },
        { status: 404 }
      )
    }

    // 🔒 STEP 4: ADD BALANCE TO TARGET USER
    console.log('🔍 Adding balance:', { userId, amount })
    const result = await addBalanceServer(userId, amount)
    console.log('🔍 Add balance result:', result)

    if (!result.success) {
      console.log('❌ Add balance failed:', result.error)
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    // 🔒 STEP 5: LOG SECURE TRANSACTION
    await logTransaction({
      user_id: userId,
      type: 'topup',
      amount,
      description: description || `Admin top-up: ${amount} VND`,
      metadata: {
        admin_id: adminUser.id,
        admin_email: adminUser.email,
        admin_topup: true,
        target_user_email: targetUser.email,
        previous_balance: targetUser.balance,
        new_balance: result.newBalance,
        timestamp: new Date().toISOString()
      }
    })

    // 📣 STEP 6: SEND NOTIFICATION TO TARGET USER
    // Notification service will be implemented when needed

    // 🔒 STEP 6: LOG ADMIN ACTION
    const requestInfo = extractRequestInfo(request)
    await logAdminAction(
      {
        id: adminUser.id,
        email: adminUser.email
      },
      {
        action: ADMIN_ACTIONS.TOPUP_USER_BALANCE,
        targetUserId: userId,
        targetUserEmail: targetUser.email,
        details: {
          amount,
          previousBalance: targetUser.balance,
          newBalance: result.newBalance,
          description
        },
        ...requestInfo
      }
    )

    // 🔒 STEP 7: RETURN SECURE RESPONSE
    return NextResponse.json({
      success: true,
      newBalance: result.newBalance,
      message: 'Balance topped up successfully',
      transaction: {
        adminId: adminUser.id,
        adminEmail: adminUser.email,
        targetUserId: userId,
        targetUserEmail: targetUser.email,
        amount: amount,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Admin top-up error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

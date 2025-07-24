/**
 * Debug API Route - Test User Update
 * Test cập nhật thông tin user để debug lỗi
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import { userSettingsService } from '@/lib/user-settings-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, updates, useAdmin = false } = body

    if (!userId) {
      return NextResponse.json({
        error: 'User ID is required'
      }, { status: 400 })
    }

    console.log('Debug user update:', { userId, updates, useAdmin })

    // Test 1: Kiểm tra user có tồn tại không
    const client = useAdmin ? supabaseAdmin : supabase
    if (!client) {
      return NextResponse.json({
        error: 'Supabase client not available'
      }, { status: 500 })
    }

    const { data: existingUser, error: getUserError } = await client
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (getUserError) {
      console.error('Get user error:', getUserError)
      return NextResponse.json({
        error: 'Failed to get user',
        details: getUserError
      }, { status: 500 })
    }

    console.log('Existing user:', existingUser)

    // Test 2: Thử cập nhật trực tiếp với Supabase
    const { data: directUpdate, error: directError } = await client
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    if (directError) {
      console.error('❌ Direct update error:', directError)
      console.error('Error details:', {
        code: directError.code,
        message: directError.message,
        details: directError.details,
        hint: directError.hint
      })

      return NextResponse.json({
        error: 'Direct update failed',
        errorMessage: directError.message,
        errorCode: directError.code,
        errorDetails: directError.details,
        errorHint: directError.hint,
        fullError: directError,
        existingUser,
        attemptedUpdates: updates,
        diagnosis: directError.message?.includes('does not exist')
          ? 'Database schema missing columns - need to run migration'
          : directError.message?.includes('permission') || directError.message?.includes('policy')
          ? 'RLS policy issue - check Row Level Security'
          : 'Unknown database error'
      }, { status: 500 })
    }

    console.log('Direct update success:', directUpdate)

    // Test 3: Thử với user settings service
    let serviceResult = null
    let serviceError = null

    try {
      serviceResult = await userSettingsService.updateUserProfile(userId, updates)
      console.log('Service result:', serviceResult)
    } catch (error) {
      serviceError = error
      console.error('Service error:', error)
    }

    return NextResponse.json({
      success: true,
      data: {
        existingUser,
        directUpdate,
        serviceResult,
        serviceError: serviceError ? {
          message: serviceError instanceof Error ? serviceError.message : 'Unknown error',
          stack: serviceError instanceof Error ? serviceError.stack : null
        } : null
      }
    })

  } catch (error) {
    console.error('Debug user update error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

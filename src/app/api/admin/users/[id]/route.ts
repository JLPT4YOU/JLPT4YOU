/**
 * Admin User Update API Route
 * PUT /api/admin/users/{id}
 * Body: partial user record { name?, email?, avatar_icon?, role?, is_active? }
 */

import { NextResponse, NextRequest } from 'next/server'
import { supabaseAdmin } from '@/utils/supabase/admin'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const id = resolvedParams.id

  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Service role client unavailable' }, { status: 500 })
  }

  try {
    const updates = await request.json()

    const allowedFields = ['name', 'email', 'avatar_icon', 'role', 'is_active', 'subscription_expires_at']
    const payload: Record<string, unknown> = {}
    for (const key of allowedFields) {
      if (key in updates) {
        payload[key] = updates[key]
      }
    }
    // Support "expiryDate" alias from client side
    if ('expiryDate' in updates) {
      // Handle empty string as null for timestamp fields
      const expiryDate = updates.expiryDate
      if (expiryDate === '' || expiryDate === null || expiryDate === undefined) {
        payload['subscription_expires_at'] = null
      } else {
        // Validate date format
        const date = new Date(expiryDate)
        if (isNaN(date.getTime())) {
          return NextResponse.json({
            error: 'Invalid date format for expiryDate'
          }, { status: 400 })
        }
        payload['subscription_expires_at'] = date.toISOString()
      }
    }

    if (Object.keys(payload).length === 0) {
      return NextResponse.json({ error: 'No valid fields provided' }, { status: 400 })
    }

    // Add updated_at timestamp
    payload.updated_at = new Date().toISOString()

    const { data, error } = await supabaseAdmin
      .from('users')
      .update(payload)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating user:', error)
      return NextResponse.json({
        error: 'Error updating user',
        details: error.message
      }, { status: 500 })
    }

    return NextResponse.json({ user: data })
  } catch (error) {
    console.error('Unhandled error updating user:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

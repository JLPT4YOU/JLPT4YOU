/**
 * Admin User Update API Route
 * PUT /api/admin/users/{id}
 * Body: partial user record { name?, email?, avatar_icon?, role?, is_active? }
 */

import { NextResponse, NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const id = resolvedParams.id

  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Service role client unavailable' }, { status: 500 })
  }

  try {
    const updates = await request.json()

    const allowedFields = ['name', 'email', 'avatar_icon', 'role', 'is_active', 'subscription_expires_at']
    const payload: Record<string, any> = {}
    for (const key of allowedFields) {
      if (key in updates) {
        payload[key] = updates[key]
      }
    }
    // Support "expiryDate" alias from client side
    if ('expiryDate' in updates) {
      payload['subscription_expires_at'] = updates.expiryDate
    }
    if (Object.keys(payload).length === 0) {
      return NextResponse.json({ error: 'No valid fields provided' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .update(payload)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating user:', error)
      return NextResponse.json({ error: 'Error updating user' }, { status: 500 })
    }

    return NextResponse.json({ user: data })
  } catch (error) {
    console.error('Unhandled error updating user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * Admin Notifications API
 * POST /api/admin/notifications - send personal message to a user
 * POST /api/admin/notifications/broadcast - send system broadcast to all users
 * GET /api/admin/notifications - list sent notifications (filter by type/user)
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/admin-auth'
import { createNotificationAdmin, broadcastSystemNotificationAdmin } from '@/lib/notifications-server'
import { NotificationType } from '@/types/notification'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminAuth(request)
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') as NotificationType | null
    const userId = searchParams.get('userId')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 200)

    // Using service role to fetch
    const { supabaseAdmin } = await import('@/utils/supabase/admin')
    if (!supabaseAdmin) return NextResponse.json({ error: 'Server config error' }, { status: 500 })

    let query = supabaseAdmin.from('notifications').select('*').order('created_at', { ascending: false }).limit(limit)
    if (type) query = query.eq('type', type)
    if (userId) query = query.eq('user_id', userId)

    const { data, error } = await query
    if (error) return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })

    return NextResponse.json({ success: true, notifications: data })
  } catch (err) {
    console.error('Admin notifications GET error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdminAuth(request)
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

    const body = await request.json()
    const { userId, title, content, priority = 'normal' } = body as { userId: string; title: string; content: string; priority?: 'low'|'normal'|'high' }

    if (!userId || !title || !content) {
      return NextResponse.json({ error: 'userId, title, content are required' }, { status: 400 })
    }

    const created = await createNotificationAdmin({
      user_id: userId,
      type: 'admin_message',
      title,
      content,
      metadata: { priority },
      is_important: priority === 'high'
    })

    if (!created) return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 })
    return NextResponse.json({ success: true, notification: created })
  } catch (err) {
    console.error('Admin notifications POST error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  // Broadcast endpoint using PUT for idempotence
  try {
    const auth = await requireAdminAuth(request)
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

    const body = await request.json()
    const { title, content, priority = 'normal' } = body as { title: string; content: string; priority?: 'low'|'normal'|'high' }

    if (!title || !content) {
      return NextResponse.json({ error: 'title and content are required' }, { status: 400 })
    }

    await broadcastSystemNotificationAdmin(title, content, priority)
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Admin notifications broadcast error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


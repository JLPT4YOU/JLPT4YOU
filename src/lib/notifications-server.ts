/**
 * Server-side Notifications Utilities
 * IMPORTANT: Use only in server-side code (API routes, server components)
 */

import { supabaseAdmin } from '@/utils/supabase/admin'
import { CreateNotificationDto, Notification } from '@/types/notification'

export async function createNotificationAdmin(data: CreateNotificationDto): Promise<Notification | null> {
  try {
    if (!supabaseAdmin) {
      console.error('notifications-server: supabaseAdmin not available')
      return null
    }

    const { data: inserted, error } = await supabaseAdmin
      .from('notifications')
      .insert([data as any])
      .select('*')
      .single()

    if (error) {
      console.error('notifications-server: createNotificationAdmin error', error)
      return null
    }

    return inserted as unknown as Notification
  } catch (err) {
    console.error('notifications-server: createNotificationAdmin exception', err)
    return null
  }
}

export async function sendTopUpSuccessAdmin(userId: string, amount: number, transactionId?: string) {
  await createNotificationAdmin({
    user_id: userId,
    type: 'top_up_success',
    title: 'Nạp tiền thành công',
    content: `Bạn đã nạp thành công ${amount} VND vào tài khoản.`,
    metadata: { amount, transaction_id: transactionId },
    is_important: true,
  })
}

export async function sendPremiumUpgradeAdmin(userId: string, planType: 'monthly' | 'yearly' | 'code', expiresAtISO: string) {
  const planLabel = planType === 'monthly' ? 'tháng' : planType === 'yearly' ? 'năm' : 'qua mã kích hoạt'
  await createNotificationAdmin({
    user_id: userId,
    type: 'premium_upgrade',
    title: 'Nâng cấp Premium thành công',
    content: `Chúc mừng! Tài khoản của bạn đã được nâng cấp Premium (${planLabel}). Hết hạn vào ${new Date(expiresAtISO).toLocaleDateString('vi-VN')}.`,
    metadata: { plan_type: planType === 'code' ? 'monthly' : planType, expires_at: expiresAtISO },
    is_important: true,
  })
}

export async function sendRedeemCodeAdmin(userId: string, code: string, rewardType: string, rewardValue: any) {
  let content = `Bạn đã sử dụng mã ${code}.`
  if (rewardType === 'premium_days') {
    content += ` Bạn được tặng ${rewardValue} ngày Premium!`
  }
  await createNotificationAdmin({
    user_id: userId,
    type: 'redeem_code',
    title: 'Sử dụng mã quà tặng',
    content,
    metadata: { code, reward_type: rewardType, reward_value: rewardValue },
    is_important: true,
  })
}

export async function broadcastSystemNotificationAdmin(title: string, content: string, priority: 'low' | 'normal' | 'high' = 'normal') {
  try {
    if (!supabaseAdmin) return
    const { data: users, error } = await supabaseAdmin.from('users').select('id')
    if (error || !users) {
      console.error('notifications-server: broadcast fetch users error', error)
      return
    }
    const notifications = users.map(u => ({
      user_id: u.id,
      type: 'system' as const,
      title,
      content,
      metadata: { priority },
      is_important: priority === 'high',
    }))
    const { error: insertError } = await supabaseAdmin.from('notifications').insert(notifications as any)
    if (insertError) {
      console.error('notifications-server: broadcast insert error', insertError)
    }
  } catch (err) {
    console.error('notifications-server: broadcast exception', err)
  }
}


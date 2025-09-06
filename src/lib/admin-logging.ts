/**
 * Admin action logging utilities
 */
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

interface AdminActionDetails {
  action: string
  targetUserId?: string
  targetUserEmail?: string
  details?: Record<string, any>
  ipAddress?: string
  userAgent?: string
}

interface AdminUser {
  id: string
  email: string
}

/**
 * Log admin action to database for audit trail
 */
export async function logAdminAction(
  adminUser: AdminUser,
  actionDetails: AdminActionDetails
): Promise<string | null> {
  try {
    const { data, error } = await supabaseAdmin.rpc('log_admin_action', {
      p_admin_id: adminUser.id,
      p_admin_email: adminUser.email,
      p_action: actionDetails.action,
      p_target_user_id: actionDetails.targetUserId || null,
      p_target_user_email: actionDetails.targetUserEmail || null,
      p_details: actionDetails.details || {},
      p_ip_address: actionDetails.ipAddress || null,
      p_user_agent: actionDetails.userAgent || null
    })

    if (error) {
      console.error('Failed to log admin action:', error)
      return null
    }

    return data as string
  } catch (error) {
    console.error('Error logging admin action:', error)
    return null
  }
}

/**
 * Helper to extract IP and User-Agent from Request
 */
export function extractRequestInfo(request: Request): { ipAddress?: string, userAgent?: string } {
  return {
    ipAddress: request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               undefined,
    userAgent: request.headers.get('user-agent') || undefined
  }
}

/**
 * Common admin action types
 */
export const ADMIN_ACTIONS = {
  TOPUP_USER_BALANCE: 'topup_user_balance',
  CREATE_REDEEM_CODE: 'create_redeem_code',
  DELETE_USER: 'delete_user',
  UPDATE_USER_ROLE: 'update_user_role',
  VIEW_ADMIN_DASHBOARD: 'view_admin_dashboard',
  EXPORT_USER_DATA: 'export_user_data',
  SEND_NOTIFICATION: 'send_notification'
} as const

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/utils/supabase/admin'
import { sendPremiumUpgradeAdmin, sendRedeemCodeAdmin } from '@/lib/notifications-server'

interface RedeemCodeRequest {
  code: string
}

interface RedeemCodeResponse {
  success: boolean
  message: string
  expiryDate?: string
}

function getAccessToken(req: NextRequest): string | null {
  const authHeader = req.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.replace('Bearer ', '').trim()
  }
  const cookieToken = req.cookies.get('sb-access-token')?.value
  return cookieToken || null
}

export async function POST(request: NextRequest): Promise<NextResponse<RedeemCodeResponse>> {
  try {
    const body: RedeemCodeRequest = await request.json()
    const { code } = body

    if (!code || !code.trim()) {
      return NextResponse.json({
        success: false,
        message: 'Mã code không được để trống'
      }, { status: 400 })
    }

    if (!supabaseAdmin) {
      return NextResponse.json({
        success: false,
        message: 'Dịch vụ tạm thời không khả dụng'
      }, { status: 500 })
    }

    const accessToken = getAccessToken(request)
    if (!accessToken) {
      return NextResponse.json({
        success: false,
        message: 'Người dùng chưa đăng nhập'
      }, { status: 401 })
    }

    // Get current user
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(accessToken)
    
    if (authError || !user) {
      return NextResponse.json({
        success: false,
        message: 'Người dùng chưa đăng nhập'
      }, { status: 401 })
    }

    // TODO: Replace with actual code validation logic
    // For now, we'll use some demo codes for testing
    const validCodes = {
      'PREMIUM30': { days: 30, type: 'Premium' },
      'PREMIUM90': { days: 90, type: 'Premium' },
      'PREMIUM365': { days: 365, type: 'Premium' },
      'TEST30': { days: 30, type: 'Premium' }
    }

    const trimmedCode = code.trim().toUpperCase()
    const codeInfo = validCodes[trimmedCode as keyof typeof validCodes]

    if (!codeInfo) {
      return NextResponse.json({
        success: false,
        message: 'Code không hợp lệ hoặc đã hết hạn'
      }, { status: 400 })
    }

    // Calculate new expiry date
    const now = new Date()
    const expiryDate = new Date(now.getTime() + (codeInfo.days * 24 * 60 * 60 * 1000))

    // Update user's premium status
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        role: codeInfo.type as 'Premium',
        subscription_expires_at: expiryDate.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Error updating user premium status:', updateError)
      return NextResponse.json({
        success: false,
        message: 'Có lỗi xảy ra khi kích hoạt code'
      }, { status: 500 })
    }

    // 📣 Send notifications
    await sendPremiumUpgradeAdmin(user.id, 'code', expiryDate.toISOString())
    await sendRedeemCodeAdmin(user.id, trimmedCode, 'premium_days', codeInfo.days)

    return NextResponse.json({
      success: true,
      message: 'Kích hoạt Premium thành công!',
      expiryDate: expiryDate.toISOString()
    })

  } catch (error) {
    console.error('Error processing redeem code:', error)
    return NextResponse.json({
      success: false,
      message: 'Có lỗi xảy ra khi xử lý code'
    }, { status: 500 })
  }
}

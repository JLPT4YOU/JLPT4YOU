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

    // Use database function to redeem code
    const { data: redeemResult, error: redeemError } = await supabaseAdmin
      .rpc('redeem_code', {
        p_code: code,
        p_user_id: user.id
      })

    if (redeemError) {
      console.error('Error calling redeem_code function:', redeemError)
      return NextResponse.json({
        success: false,
        message: 'Có lỗi xảy ra khi xử lý mã'
      }, { status: 500 })
    }

    if (!redeemResult.success) {
      return NextResponse.json({
        success: false,
        message: redeemResult.error === 'Invalid code' ? 'Mã không hợp lệ' :
                redeemResult.error === 'Code has already been redeemed or expired' ? 'Mã đã được sử dụng hoặc đã hết hạn' :
                redeemResult.error === 'Code has expired' ? 'Mã đã hết hạn' :
                'Mã không hợp lệ'
      }, { status: 400 })
    }

    // 📣 Send notifications
    await sendPremiumUpgradeAdmin(user.id, 'code', redeemResult.new_expiry)
    await sendRedeemCodeAdmin(user.id, code, 'premium_days', redeemResult.premium_days_added)

    return NextResponse.json({
      success: true,
      message: 'Kích hoạt Premium thành công!',
      expiryDate: redeemResult.new_expiry
    })

  } catch (error) {
    console.error('Error processing redeem code:', error)
    return NextResponse.json({
      success: false,
      message: 'Có lỗi xảy ra khi xử lý code'
    }, { status: 500 })
  }
}

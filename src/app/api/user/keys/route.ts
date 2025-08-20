import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/utils/supabase/admin'

function getAccessToken(req: NextRequest): string | null {
  const authHeader = req.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.replace('Bearer ', '').trim()
  }
  const cookieToken = req.cookies.get('sb-access-token')?.value
  return cookieToken || null
}

// GET /api/user/keys -> { gemini: boolean, groq: boolean }
export async function GET(request: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Service role unavailable' }, { status: 500 })
  }

    const accessToken = getAccessToken(request)
  if (!accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(accessToken)
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await (supabaseAdmin as any)
    .from('user_api_keys')
    .select('provider, key_encrypted')
    .eq('user_id', user.id)

  if (error) {
    console.error('Error fetching keys:', error)
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  }

  const providers: Record<string, boolean> = {
    gemini: false,
    groq: false
  }
  data.forEach((row: any) => {
    providers[row.provider as string] = true
  })

  return NextResponse.json(providers)
}

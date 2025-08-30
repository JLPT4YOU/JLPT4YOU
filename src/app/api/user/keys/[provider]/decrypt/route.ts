import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/utils/supabase/admin'
import { decrypt } from '@/lib/crypto-utils'

const VALID_PROVIDERS = ['gemini', 'groq']
const SECRET = process.env.APP_ENCRYPT_SECRET || ''

function getAccessToken(req: NextRequest): string | null {
  const authHeader = req.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.replace('Bearer ', '').trim()
  }
  const cookieToken = req.cookies.get('sb-access-token')?.value
  return cookieToken || null
}

// Note: Now using centralized APP_ENCRYPT_SECRET instead of user-specific secrets

// GET /api/user/keys/[provider]/decrypt  ->  { key: string }
// Returns decrypted API key for authenticated user (server-side decrypt)
export async function GET(request: NextRequest, { params }: { params: Promise<{ provider: string }> }) {
  const resolvedParams = await params
  const provider = resolvedParams.provider
  if (!VALID_PROVIDERS.includes(provider)) {
    return NextResponse.json({ error: 'Invalid provider' }, { status: 400 })
  }

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

  // TODO: Fix database schema - user_api_keys table not in types
  const { data: row, error } = await (supabaseAdmin as any)
    .from('user_api_keys')
    .select('key_encrypted')
    .eq('user_id', user.id)
    .eq('provider', provider)
    .single()

  if (error || !row) {
    return NextResponse.json({ error: 'Key not found' }, { status: 404 })
  }

  if (!SECRET) {
    return NextResponse.json({ error: 'Encryption secret not configured' }, { status: 500 })
  }

  // Decrypt using AES-256-GCM
  let decryptedKey: string
  try {
    decryptedKey = decrypt(row.key_encrypted, SECRET)
  } catch (error) {
    console.error('AES decryption error:', error)
    return NextResponse.json({ error: 'Decryption failed' }, { status: 500 })
  }

  return NextResponse.json({ key: decryptedKey })
}

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/utils/supabase/admin'
import { encrypt, decrypt } from '@/lib/crypto-utils'

const VALID_PROVIDERS = ['gemini', 'groq']
const SECRET = process.env.APP_ENCRYPT_SECRET || ''

// Helper: extract JWT from Authorization header or auth cookies
function getAccessToken(req: NextRequest): string | null {
  const authHeader = req.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.replace('Bearer ', '').trim()
  }
  const cookieToken = req.cookies.get('sb-access-token')?.value
  return cookieToken || null
}

// Helper: Decrypt client-encrypted API key
async function decryptClientEncryptedKey(
  encryptedData: string,
  userId: string,
  email: string
): Promise<string> {
  // Import client crypto utils for server-side decryption
  const { decryptApiKeyFromTransport } = await import('@/lib/client-crypto-utils')
  return await decryptApiKeyFromTransport(encryptedData, userId, email)
}

// Note: Now using centralized APP_ENCRYPT_SECRET instead of user-specific secrets

// PUT /api/user/keys/[provider]
// Body: { encryptedKey: string, checksum: string, timestamp: number } | { key: string } (fallback)
export async function PUT(request: NextRequest, { params }: { params: Promise<{ provider: string }> }) {
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

  let body: { encryptedKey?: string; checksum?: string; timestamp?: number; key?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  let apiKey: string

  // Check if client sent encrypted data (new secure method)
  if (body.encryptedKey && body.checksum) {
    try {
      // Verify timestamp (không quá 5 phút)
      if (body.timestamp && Date.now() - body.timestamp > 5 * 60 * 1000) {
        return NextResponse.json({ error: 'Request expired' }, { status: 400 })
      }

      // Decrypt client-encrypted API key
      apiKey = await decryptClientEncryptedKey(body.encryptedKey, user.id, user.email || '')

      if (!apiKey) {
        return NextResponse.json({ error: 'Failed to decrypt API key' }, { status: 400 })
      }
    } catch (error) {
      console.error('Client decryption failed:', error)
      return NextResponse.json({ error: 'Invalid encrypted data' }, { status: 400 })
    }
  }
  // Fallback: Accept plaintext (for backward compatibility)
  else if (body.key) {
    apiKey = body.key.trim()
  }
  else {
    return NextResponse.json({ error: 'API key required (encryptedKey or key)' }, { status: 400 })
  }

  if (!apiKey) {
    return NextResponse.json({ error: 'API key cannot be empty' }, { status: 400 })
  }

  if (!SECRET) {
    return NextResponse.json({ error: 'Encryption secret not configured' }, { status: 500 })
  }

  // 1. Encrypt the key using AES-256-GCM
  let encrypted: string
  try {
    encrypted = encrypt(apiKey, SECRET)
  } catch (error) {
    console.error('AES encryption error:', error)
    return NextResponse.json({ error: 'Encryption failed' }, { status: 500 })
  }

  // 2. Upsert the encrypted key
  // TODO: Fix database schema - user_api_keys table not in types
  const { error: upsertError } = await (supabaseAdmin as any)
    .from('user_api_keys')
    .upsert({
      user_id: user.id,
      provider,
      key_encrypted: encrypted
    })

  if (upsertError) {
    console.error('Upsert error:', upsertError)
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

// DELETE /api/user/keys/[provider]
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ provider: string }> }) {
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

  // Note: user_api_keys table not in current types, using safe assertion
  const { error: deleteError } = await (supabaseAdmin as any)
    .from('user_api_keys')
    .delete()
    .eq('user_id', user.id)
    .eq('provider', provider)

  if (deleteError) {
    console.error('Delete key error:', deleteError)
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

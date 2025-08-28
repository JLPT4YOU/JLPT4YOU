import { NextRequest, NextResponse } from 'next/server';
import { getGeminiService } from '@/lib/gemini-service';
import { supabaseAdmin } from '@/utils/supabase/admin';
import { decrypt } from '@/lib/crypto-utils';

const SECRET = process.env.APP_ENCRYPT_SECRET || '';

function getAccessToken(req: NextRequest): string | null {
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.replace('Bearer ', '').trim();
  }
  const cookieToken = req.cookies.get('sb-access-token')?.value;
  return cookieToken || null;
}

export async function POST(request: NextRequest) {
  try {
    const accessToken = getAccessToken(request);
    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(accessToken);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: row, error: dbError } = await (supabaseAdmin as any)
      .from('user_api_keys')
      .select('key_encrypted')
      .eq('user_id', user.id)
      .eq('provider', 'gemini')
      .single();

    if (dbError || !row) {
      return NextResponse.json({ error: 'Gemini API key not found' }, { status: 404 });
    }

    if (!SECRET) {
      return NextResponse.json({ error: 'Server encryption secret not configured' }, { status: 500 });
    }

    const decryptedKey = decrypt(row.key_encrypted, SECRET);
    const { firstMessage } = await request.json();

    if (!firstMessage) {
      return NextResponse.json({ error: 'firstMessage is required' }, { status: 400 });
    }

    const geminiService = getGeminiService(decryptedKey);
    const title = await geminiService.generateChatTitle(firstMessage);

    return NextResponse.json({ title });

  } catch (error) {
    console.error('Generate title error:', error);
    return NextResponse.json({ error: 'Failed to generate title' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('user_api_keys')
      .select('provider')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching API key status:', error);
      throw new Error('Failed to fetch key status from database.');
    }

    const configuredProviders = data?.map(item => item.provider) || [];

    const status = {
      gemini: configuredProviders.includes('gemini'),
      groq: configuredProviders.includes('groq'),
    };

    return NextResponse.json(status);

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
    console.error('GET /api/user/keys Error:', errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}


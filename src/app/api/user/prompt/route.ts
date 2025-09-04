import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('users')
      .select('metadata')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error fetching user metadata:', error);
      return NextResponse.json({ error: 'Failed to fetch user data' }, { status: 500 });
    }

    const metadata = data?.metadata || {};
    const promptConfig = metadata?.promptConfig || null;
    const customPrompt = metadata?.customPrompt || promptConfig?.generatedPrompt || null;
    const aiLanguage = metadata?.aiLanguage || 'auto';
    const customAiLanguage = metadata?.customAiLanguage || '';

    return NextResponse.json({ promptConfig, customPrompt, aiLanguage, customAiLanguage });

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
    console.error('[GET /api/user/prompt] Error:', errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { promptConfig, aiLanguage, customAiLanguage } = await request.json();

    // Fetch existing metadata to merge
    const { data: existing, error: fetchError } = await supabase
      .from('users')
      .select('metadata')
      .eq('id', user.id)
      .single();

    if (fetchError) {
      console.error('Error fetching existing metadata:', fetchError);
      return NextResponse.json({ error: 'Failed to load current user data' }, { status: 500 });
    }

    const newMetadata = {
      ...(existing?.metadata || {}),
      // Full form config from /irin settings
      promptConfig,
      // Keep backward-compat field for existing consumers
      customPrompt: (promptConfig?.generatedPrompt ?? (existing?.metadata?.customPrompt ?? '')),
      // Language preferences
      aiLanguage,
      customAiLanguage
    };

    const { error } = await supabase
      .from('users')
      .update({ metadata: newMetadata })
      .eq('id', user.id);

    if (error) {
      console.error('Error updating user metadata:', error);
      return NextResponse.json({ error: 'Failed to save prompt' }, { status: 500 });
    }

    return NextResponse.json({ success: true, promptConfig, aiLanguage, customAiLanguage });

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
    console.error('[PUT /api/user/prompt] Error:', errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}


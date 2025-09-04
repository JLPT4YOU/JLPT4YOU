import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// GET user settings (including language)
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
      console.error('Error fetching user settings:', error);
      return NextResponse.json({ error: 'Failed to fetch user settings' }, { status: 500 });
    }

    const settings = data.metadata?.settings || {};
    return NextResponse.json({ settings });

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
    console.error('[GET /api/user/settings] Error:', errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// PUT (update) user settings
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const newSettings = await request.json();

    // Fetch existing metadata to merge with new settings
    const { data: existing, error: fetchError } = await supabase
      .from('users')
      .select('metadata')
      .eq('id', user.id)
      .single();

    if (fetchError) {
      console.error('Error fetching existing metadata for settings update:', fetchError);
      return NextResponse.json({ error: 'Failed to load current user data' }, { status: 500 });
    }

    const mergedMetadata = {
      ...(existing?.metadata || {}),
      settings: { ...(existing?.metadata?.settings || {}), ...newSettings }
    };

    const { error } = await supabase
      .from('users')
      .update({ metadata: mergedMetadata })
      .eq('id', user.id);

    if (error) {
      console.error('Error updating user settings:', error);
      return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
    }

    return NextResponse.json({ success: true, settings: mergedMetadata.settings });

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
    console.error('[PUT /api/user/settings] Error:', errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}


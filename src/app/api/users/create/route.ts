import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { devConsole } from '@/lib/console-override'

// Create admin client with service role key
const supabaseAdmin = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    global: {
      headers: {
        'X-Client-Info': 'jlpt4you-admin-user-creation'
      }
    }
  }
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, email, name, role, avatar_icon } = body

    // Validate required fields
    if (!id || !email) {
      console.error('❌ Missing required fields:', { id: !!id, email: !!email })
      return NextResponse.json(
        { error: 'Missing required fields: id, email' },
        { status: 400 }
      )
    }

    devConsole.log('🔍 Creating user record:', { id, email, name, role })

    // First check if user already exists
    const { data: existingUser, error: checkError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', id)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ Error checking existing user:', checkError)
      return NextResponse.json(
        { error: 'Database error while checking user', details: checkError.message },
        { status: 500 }
      )
    }

    if (existingUser) {
      devConsole.log('✅ User already exists, returning existing user:', email)
      return NextResponse.json({ success: true, user: existingUser })
    }

    // Create user record using admin client (bypasses RLS)
    const userData = {
      id,
      email,
      name: name || email.split('@')[0] || 'User',
      role: role || 'Free',
      avatar_icon: avatar_icon || null,
      balance: 0.00,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    devConsole.log('🔍 Inserting user data:', userData)

    const { data, error } = await supabaseAdmin
      .from('users')
      .insert(userData)
      .select()
      .single()

    if (error) {
      console.error('❌ Failed to create user record:', error)

      // Provide more specific error messages
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'User already exists with this email or ID' },
          { status: 409 }
        )
      }

      return NextResponse.json(
        { error: 'Failed to create user record', details: error.message, code: error.code },
        { status: 500 }
      )
    }

    devConsole.log('✅ Successfully created user record for:', email)
    return NextResponse.json({ success: true, user: data })

  } catch (error) {
    console.error('💥 Error in user creation API:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

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
    }
  }
)

export async function POST(_request: NextRequest) {
  try {
    devConsole.log('🔧 Starting RLS policy fix...')

    // Step 1: Drop existing policies to avoid conflicts
    const dropPolicies = [
      'DROP POLICY IF EXISTS "users_select_own" ON public.users',
      'DROP POLICY IF EXISTS "users_update_own" ON public.users', 
      'DROP POLICY IF EXISTS "users_insert_own" ON public.users',
      'DROP POLICY IF EXISTS "Users can view own profile" ON public.users',
      'DROP POLICY IF EXISTS "Users can update own profile" ON public.users',
      'DROP POLICY IF EXISTS "Users can insert own profile" ON public.users',
      'DROP POLICY IF EXISTS "Admins can view all users" ON public.users'
    ]

    for (const sql of dropPolicies) {
      const { error } = await supabaseAdmin.rpc('exec_sql', { sql })
      if (error) {
        console.warn('Warning dropping policy:', error.message)
      }
    }

    // Step 2: Enable RLS
    const { error: rlsError } = await supabaseAdmin.rpc('exec_sql', {
      sql: 'ALTER TABLE public.users ENABLE ROW LEVEL SECURITY'
    })
    if (rlsError) {
      console.warn('RLS already enabled:', rlsError.message)
    }

    // Step 3: Create new policies
    const policies = [
      // Allow users to select their own record
      `CREATE POLICY "Users can view own profile" ON public.users
       FOR SELECT USING (auth.uid() = id)`,
      
      // Allow users to update their own record  
      `CREATE POLICY "Users can update own profile" ON public.users
       FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id)`,
      
      // Allow users to insert their own record (THE KEY FIX!)
      `CREATE POLICY "Users can insert own profile" ON public.users
       FOR INSERT WITH CHECK (auth.uid() = id)`,
       
      // Allow admins to view all users
      `CREATE POLICY "Admins can view all users" ON public.users
       FOR SELECT USING (
         EXISTS (
           SELECT 1 FROM public.users 
           WHERE id = auth.uid() AND role = 'Admin'
         )
       )`
    ]

    for (const policy of policies) {
      const { error } = await supabaseAdmin.rpc('exec_sql', { sql: policy })
      if (error) {
        console.error('Failed to create policy:', error)
        return NextResponse.json(
          { error: 'Failed to create policy', details: error.message },
          { status: 500 }
        )
      }
    }

    // Step 4: Grant permissions
    const grants = [
      'GRANT SELECT, UPDATE, INSERT ON public.users TO authenticated',
      'GRANT USAGE ON SCHEMA public TO authenticated'
    ]

    for (const grant of grants) {
      const { error } = await supabaseAdmin.rpc('exec_sql', { sql: grant })
      if (error) {
        console.warn('Grant warning:', error.message)
      }
    }

    devConsole.log('✅ RLS policies fixed successfully!')
    
    return NextResponse.json({ 
      success: true, 
      message: 'RLS policies fixed successfully',
      details: 'Users can now create, read, and update their own records'
    })

  } catch (error) {
    console.error('Error fixing RLS policies:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error },
      { status: 500 }
    )
  }
}

// Helper function to execute raw SQL (currently unused but kept for future use)
// async function execSQL(sql: string) {
//   const { error } = await supabaseAdmin.rpc('exec_sql', { sql })
//   return { error }
// }

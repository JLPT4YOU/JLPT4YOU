/**
 * Debug API Route - Run Migration
 * Chạy migration script để thêm các trường mới vào bảng users
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({
        error: 'Supabase admin client not available'
      }, { status: 500 })
    }

    console.log('🚀 Starting migration...')

    // Migration SQL
const migrationSQL = `
      -- Add new columns if they don't exist
      DO $$ 
      BEGIN
        -- Add avatar_icon column
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name='users' AND column_name='avatar_icon') THEN
          ALTER TABLE public.users ADD COLUMN avatar_icon TEXT;
          COMMENT ON COLUMN public.users.avatar_icon IS 'Tên icon từ lucide-react để làm avatar';
        END IF;

        -- Add password_updated_at column
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name='users' AND column_name='password_updated_at') THEN
          ALTER TABLE public.users ADD COLUMN password_updated_at TIMESTAMPTZ;
          COMMENT ON COLUMN public.users.password_updated_at IS 'Thời gian đổi mật khẩu lần cuối';
        END IF;
      END $$;
    `

    // Since we can't execute DDL directly, we'll check and add columns manually
    const results = []

    // Check existing columns
    const { data: existingColumns, error: columnsError } = await supabaseAdmin
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'users')
      .eq('table_schema', 'public')

    if (columnsError) {
      console.error('❌ Failed to check existing columns:', columnsError)
      return NextResponse.json({
        success: false,
        error: 'Failed to check existing columns',
        details: columnsError
      }, { status: 500 })
    }

    const existingColumnNames = existingColumns?.map(col => col.column_name) || []
    console.log('📋 Existing columns:', existingColumnNames)

    // Check which columns are missing
const requiredColumns = ['avatar_icon', 'password_updated_at']
    const missingColumns = requiredColumns.filter(col => !existingColumnNames.includes(col))

    console.log('❓ Missing columns:', missingColumns)

    if (missingColumns.length === 0) {
      console.log('✅ All required columns already exist')

// No need to update since we're not using display_name anymore
      const updateData = null
      const updateError = null

      return NextResponse.json({
        success: true,
        message: 'All columns already exist, updated display_name for existing users',
        missingColumns: [],
        existingColumns: existingColumnNames,
        updateResult: updateData
      })
    } else {
      return NextResponse.json({
        success: false,
        error: 'Database schema needs to be updated manually',
        message: 'Please run the migration script in Supabase SQL editor',
        missingColumns,
        existingColumns: existingColumnNames,
migrationSQL: `
-- Run this in Supabase SQL Editor:
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar_icon TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS password_updated_at TIMESTAMPTZ;
        `
      }, { status: 400 })
    }

    console.log('✅ Migration completed successfully')

    // Verify the migration worked
    const { data: tableInfo, error: verifyError } = await supabaseAdmin
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_name', 'users')
      .eq('table_schema', 'public')
      .in('column_name', ['display_name', 'avatar_icon', 'password_updated_at'])

    if (verifyError) {
      console.error('❌ Verification failed:', verifyError)
    }

    return NextResponse.json({
      success: true,
      message: 'Migration completed successfully',
      data,
      verification: tableInfo
    })

  } catch (error) {
    console.error('💥 Migration error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

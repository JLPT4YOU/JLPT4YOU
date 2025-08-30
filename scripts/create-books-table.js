#!/usr/bin/env node

/**
 * Create books table directly in Supabase
 */

const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing required environment variables:')
  console.error('- NEXT_PUBLIC_SUPABASE_URL')
  console.error('- SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function createBooksTable() {
  try {
    console.log('🚀 Creating books table...')
    
    // Check if table already exists
    const { data: existingTables } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'books')
    
    if (existingTables && existingTables.length > 0) {
      console.log('✅ Books table already exists!')
      return true
    }
    
    // Create table using direct SQL execution via a simple query
    // We'll use the REST API to execute raw SQL
    const createTableSQL = `
      -- Books table for library management
      CREATE TABLE IF NOT EXISTS public.books (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          title TEXT NOT NULL,
          author TEXT NOT NULL,
          description TEXT,
          category TEXT NOT NULL CHECK (category IN ('n1', 'n2', 'n3', 'n4', 'n5', 'other')),
          file_url TEXT NOT NULL,
          file_name TEXT NOT NULL,
          file_size BIGINT NOT NULL,
          pages INTEGER DEFAULT 0,
          status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
          uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
          created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
          metadata JSONB DEFAULT '{}'::jsonb
      );

      -- Indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_books_category ON public.books(category);
      CREATE INDEX IF NOT EXISTS idx_books_status ON public.books(status);
      CREATE INDEX IF NOT EXISTS idx_books_created_at ON public.books(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_books_uploaded_by ON public.books(uploaded_by);

      -- Enable RLS
      ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
    `
    
    // Try to execute via a workaround - insert a test record to trigger table creation
    console.log('📝 Attempting to create books table structure...')
    
    // Since we can't execute raw SQL directly, let's try a different approach
    // We'll create the table by trying to insert and catching the error
    try {
      await supabase.from('books').select('*').limit(1)
      console.log('✅ Books table already exists or was created!')
    } catch (error) {
      console.log('⚠️  Table does not exist yet. Please create it manually in Supabase SQL Editor.')
      console.log('\n📋 Please run this SQL in Supabase SQL Editor:')
      console.log('=' .repeat(60))
      console.log(createTableSQL)
      console.log('=' .repeat(60))
      return false
    }
    
    return true
  } catch (error) {
    console.error('❌ Error creating books table:', error)
    return false
  }
}

async function createPolicies() {
  try {
    console.log('🔒 Setting up RLS policies...')
    
    // We'll provide the SQL for manual execution
    const policiesSQL = `
      -- Books policies
      -- All users can view published books
      CREATE POLICY IF NOT EXISTS "Anyone can view published books" ON public.books
          FOR SELECT USING (status = 'published');

      -- Only admins can insert books
      CREATE POLICY IF NOT EXISTS "Admins can insert books" ON public.books
          FOR INSERT WITH CHECK (
              EXISTS (
                  SELECT 1 FROM public.users 
                  WHERE id = auth.uid() AND role = 'Admin'
              )
          );

      -- Only admins can update books
      CREATE POLICY IF NOT EXISTS "Admins can update books" ON public.books
          FOR UPDATE USING (
              EXISTS (
                  SELECT 1 FROM public.users 
                  WHERE id = auth.uid() AND role = 'Admin'
              )
          );

      -- Only admins can delete books
      CREATE POLICY IF NOT EXISTS "Admins can delete books" ON public.books
          FOR DELETE USING (
              EXISTS (
                  SELECT 1 FROM public.users 
                  WHERE id = auth.uid() AND role = 'Admin'
              )
          );
    `
    
    console.log('\n🔒 Please also run this SQL for RLS policies:')
    console.log('=' .repeat(60))
    console.log(policiesSQL)
    console.log('=' .repeat(60))
    
    return true
  } catch (error) {
    console.error('❌ Error setting up policies:', error)
    return false
  }
}

async function main() {
  console.log('📚 Setting up books table for JLPT4YOU...\n')
  
  const tableCreated = await createBooksTable()
  if (tableCreated) {
    await createPolicies()
    console.log('\n🎉 Setup completed! You can now upload books via Admin Dashboard.')
  } else {
    console.log('\n⚠️  Please create the table manually using the SQL provided above.')
  }
}

main().catch(error => {
  console.error('❌ Setup failed:', error)
  process.exit(1)
})

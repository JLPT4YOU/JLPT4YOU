#!/usr/bin/env node

/**
 * Debug script for Books API
 * Kiểm tra kết nối database và truy vấn books
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables manually
const NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://prrizpzrdepnjjkyrimh.supabase.co';
const NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBycml6cHpyZGVwbmpqa3lyaW1oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzMTU1MjIsImV4cCI6MjA2ODg5MTUyMn0.fuV8_STGu2AE0gyFWwgT68nyn4Il7Fb112bBAX741aU';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBycml6cHpyZGVwbmpqa3lyaW1oIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzMxNTUyMiwiZXhwIjoyMDY4ODkxNTIyfQ._7XRuH7UQKcF0n7nzvBj1UOi4oJGhcaFjmWrKC5mWos';

async function debugBooksAPI() {
  console.log('🔍 Debug Books API');
  console.log('==================');

  // 1. Kiểm tra environment variables
  console.log('\n1. Environment Variables:');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing');
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing');
  console.log('SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing');

  if (!NEXT_PUBLIC_SUPABASE_URL || !NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('❌ Missing required Supabase environment variables');
    return;
  }

  // 2. Test connection với anon key
  console.log('\n2. Testing Anon Key Connection:');
  const supabaseAnon = createClient(
    NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  try {
    const { data, error } = await supabaseAnon
      .from('books')
      .select('count(*)')
      .eq('status', 'published');
    
    if (error) {
      console.log('❌ Anon key error:', error.message);
    } else {
      console.log('✅ Anon key works, published books count:', data);
    }
  } catch (err) {
    console.log('❌ Anon key connection failed:', err.message);
  }

  // 3. Test connection với service role key
  if (SUPABASE_SERVICE_ROLE_KEY) {
    console.log('\n3. Testing Service Role Key Connection:');
    const supabaseAdmin = createClient(
      NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY
    );

    try {
      const { data, error } = await supabaseAdmin
        .from('books')
        .select('count(*)');
      
      if (error) {
        console.log('❌ Service role error:', error.message);
      } else {
        console.log('✅ Service role works, total books count:', data);
      }
    } catch (err) {
      console.log('❌ Service role connection failed:', err.message);
    }

    // 4. Kiểm tra dữ liệu books chi tiết
    console.log('\n4. Books Data Analysis:');
    try {
      const { data: allBooks, error: allError } = await supabaseAdmin
        .from('books')
        .select('id, title, author, category, status, created_at')
        .order('created_at', { ascending: false });

      if (allError) {
        console.log('❌ Error fetching books:', allError.message);
      } else {
        console.log(`📚 Total books in database: ${allBooks.length}`);
        
        // Group by status
        const statusGroups = allBooks.reduce((acc, book) => {
          acc[book.status] = (acc[book.status] || 0) + 1;
          return acc;
        }, {});
        
        console.log('📊 Books by status:', statusGroups);
        
        // Group by category
        const categoryGroups = allBooks.reduce((acc, book) => {
          acc[book.category] = (acc[book.category] || 0) + 1;
          return acc;
        }, {});
        
        console.log('📊 Books by category:', categoryGroups);

        // Show first 5 books
        if (allBooks.length > 0) {
          console.log('\n📖 Sample books:');
          allBooks.slice(0, 5).forEach((book, index) => {
            console.log(`${index + 1}. ${book.title} (${book.category}, ${book.status})`);
          });
        }
      }
    } catch (err) {
      console.log('❌ Error analyzing books data:', err.message);
    }
  } else {
    console.log('\n3. ❌ SUPABASE_SERVICE_ROLE_KEY not set - skipping service role tests');
  }

  // 5. Test API endpoint locally
  console.log('\n5. Testing API Endpoint:');
  try {
    const response = await fetch('http://localhost:3000/api/books?status=published&limit=5');
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API endpoint works:', {
        booksCount: data.books?.length || 0,
        total: data.total || 0,
        hasMore: data.hasMore || false
      });
    } else {
      console.log('❌ API endpoint error:', response.status, response.statusText);
    }
  } catch (err) {
    console.log('❌ API endpoint test failed (server might not be running):', err.message);
  }

  console.log('\n🏁 Debug completed!');
}

// Run the debug
debugBooksAPI().catch(console.error);

#!/usr/bin/env node

/**
 * Test Library với authentication
 * Kiểm tra xem library có hoạt động sau khi đăng nhập không
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables manually
const NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://prrizpzrdepnjjkyrimh.supabase.co';
const NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBycml6cHpyZGVwbmpqa3lyaW1oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzMTU1MjIsImV4cCI6MjA2ODg5MTUyMn0.fuV8_STGu2AE0gyFWwgT68nyn4Il7Fb112bBAX741aU';

async function testLibraryWithAuth() {
  console.log('🔐 Test Library với Authentication');
  console.log('===================================');

  const supabase = createClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY);

  try {
    // 1. Test đăng nhập
    console.log('\n1. Testing Login...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'chaulenba02@gmail.com',
      password: 'matkhau123'
    });

    if (authError) {
      console.log('❌ Login failed:', authError.message);
      return;
    }

    console.log('✅ Login successful');
    console.log('User ID:', authData.user?.id);
    console.log('Email:', authData.user?.email);

    // 2. Test truy cập books với session
    console.log('\n2. Testing Books API with Authentication...');
    
    const { data: booksData, error: booksError } = await supabase
      .from('books')
      .select('id, title, author, category, status')
      .eq('status', 'published')
      .limit(5);

    if (booksError) {
      console.log('❌ Books API error:', booksError.message);
    } else {
      console.log('✅ Books API works with auth');
      console.log('Books found:', booksData.length);
      booksData.forEach((book, index) => {
        console.log(`${index + 1}. ${book.title} (${book.category})`);
      });
    }

    // 3. Test user profile
    console.log('\n3. Testing User Profile...');
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, role, created_at')
      .eq('id', authData.user.id)
      .single();

    if (userError) {
      console.log('❌ User profile error:', userError.message);
    } else {
      console.log('✅ User profile found');
      console.log('Role:', userData.role);
      console.log('Created:', userData.created_at);
    }

    // 4. Test API endpoint với session
    console.log('\n4. Testing API Endpoint with Session...');
    
    // Get session token
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      try {
        const response = await fetch('http://localhost:3001/api/books?status=published&limit=5', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const apiData = await response.json();
          console.log('✅ API endpoint works with auth:', {
            booksCount: apiData.books?.length || 0,
            total: apiData.total || 0
          });
        } else {
          console.log('❌ API endpoint error:', response.status, response.statusText);
        }
      } catch (err) {
        console.log('❌ API endpoint test failed (server might not be running):', err.message);
      }
    }

    // 5. Logout
    console.log('\n5. Logging out...');
    await supabase.auth.signOut();
    console.log('✅ Logged out successfully');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }

  console.log('\n🏁 Test completed!');
}

// Run the test
testLibraryWithAuth().catch(console.error);

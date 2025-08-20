#!/usr/bin/env node

/**
 * Debug script để kiểm tra vấn đề login
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function debugLogin() {
  console.log('🔍 Debug Login Issues\n');

  const testEmail = 'test@jlpt4you.com';
  const testPassword = 'password123';

  try {
    // 1. Check if user exists in auth.users
    console.log('1️⃣ Checking auth.users table...');
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (authError) {
      console.log('❌ Error listing auth users:', authError.message);
    } else {
      console.log(`✅ Found ${authUsers.users.length} users in auth.users`);
      const testUser = authUsers.users.find(u => u.email === testEmail);
      if (testUser) {
        console.log(`✅ Test user found in auth.users:`, {
          id: testUser.id,
          email: testUser.email,
          email_confirmed_at: testUser.email_confirmed_at,
          created_at: testUser.created_at
        });
      } else {
        console.log('❌ Test user NOT found in auth.users');
      }
    }

    // 2. Check if user exists in public.users
    console.log('\n2️⃣ Checking public.users table...');
    const { data: publicUsers, error: publicError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', testEmail);
    
    if (publicError) {
      console.log('❌ Error checking public.users:', publicError.message);
    } else {
      if (publicUsers.length > 0) {
        console.log('✅ Test user found in public.users:', publicUsers[0]);
      } else {
        console.log('❌ Test user NOT found in public.users');
      }
    }

    // 3. Try to create user if not exists
    console.log('\n3️⃣ Attempting to create test user...');
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          name: 'Test User'
        }
      }
    });

    if (signUpError) {
      if (signUpError.message.includes('already registered')) {
        console.log('✅ User already exists (expected)');
      } else {
        console.log('❌ Sign up error:', signUpError.message);
      }
    } else {
      console.log('✅ User created successfully:', {
        user: signUpData.user?.email,
        session: !!signUpData.session
      });
    }

    // 4. Try to sign in
    console.log('\n4️⃣ Attempting to sign in...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });

    if (signInError) {
      console.log('❌ Sign in failed:', signInError.message);
      
      // Try with different password
      console.log('\n5️⃣ Trying with different password...');
      const { data: signInData2, error: signInError2 } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: 'password'
      });

      if (signInError2) {
        console.log('❌ Sign in with "password" also failed:', signInError2.message);
      } else {
        console.log('✅ Sign in successful with "password"!');
      }
    } else {
      console.log('✅ Sign in successful!', {
        user: signInData.user?.email,
        session: !!signInData.session
      });
    }

    // 5. Check Supabase auth settings
    console.log('\n6️⃣ Checking auth configuration...');
    console.log('Supabase URL:', supabaseUrl);
    console.log('Anon Key present:', !!supabaseAnonKey);
    console.log('Service Key present:', !!supabaseServiceKey);

  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

debugLogin().catch(console.error);

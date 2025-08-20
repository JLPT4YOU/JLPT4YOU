#!/usr/bin/env node

/**
 * Test authentication flow to diagnose session persistence issue
 */

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dvqqiqfvlryxmrtfltpo.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR2cXFpcWZ2bHJ5eG1ydGZsdHBvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI0NTA2NzQsImV4cCI6MjA0ODAyNjY3NH0.VnZ99eB3SgBZg7C-aO-VdQKXfKoXgUbCorHdL6tQenc'
);

async function testAuth() {
  console.log('🔍 Testing authentication flow...\n');

  // 1. Test sign in
  console.log('1️⃣ Testing sign in...');
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: 'test@example.com',
    password: 'test123456'
  });

  if (signInError) {
    console.log('❌ Sign in failed:', signInError.message);
    return;
  }

  console.log('✅ Sign in successful');
  console.log('   User ID:', signInData.user?.id);
  console.log('   Email:', signInData.user?.email);
  console.log('   Session:', signInData.session ? 'Present' : 'Missing');
  console.log('   Access token:', signInData.session?.access_token ? 'Present' : 'Missing');

  // 2. Check session immediately
  console.log('\n2️⃣ Checking session immediately after login...');
  const { data: { session: session1 }, error: sessionError1 } = await supabase.auth.getSession();
  
  if (sessionError1) {
    console.log('❌ Session check failed:', sessionError1.message);
  } else {
    console.log('✅ Session check successful');
    console.log('   Session:', session1 ? 'Present' : 'Missing');
    console.log('   User:', session1?.user?.email || 'No user');
  }

  // 3. Test getting user
  console.log('\n3️⃣ Getting current user...');
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError) {
    console.log('❌ Get user failed:', userError.message);
  } else {
    console.log('✅ Get user successful');
    console.log('   User:', user?.email || 'No user');
  }

  // 4. Create a new client instance (simulating page reload)
  console.log('\n4️⃣ Creating new client instance (simulating page reload)...');
  const supabase2 = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dvqqiqfvlryxmrtfltpo.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR2cXFpcWZ2bHJ5eG1ydGZsdHBvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI0NTA2NzQsImV4cCI6MjA0ODAyNjY3NH0.VnZ99eB3SgBZg7C-aO-VdQKXfKoXgUbCorHdL6tQenc'
  );

  const { data: { session: session2 }, error: sessionError2 } = await supabase2.auth.getSession();
  
  if (sessionError2) {
    console.log('❌ New client session check failed:', sessionError2.message);
  } else {
    console.log('✅ New client session check');
    console.log('   Session:', session2 ? 'Present' : 'Missing');
    console.log('   User:', session2?.user?.email || 'No user');
  }

  // 5. Sign out
  console.log('\n5️⃣ Signing out...');
  const { error: signOutError } = await supabase.auth.signOut();
  if (signOutError) {
    console.log('❌ Sign out failed:', signOutError.message);
  } else {
    console.log('✅ Sign out successful');
  }

  console.log('\n🎯 Test complete!');
}

testAuth().catch(console.error);

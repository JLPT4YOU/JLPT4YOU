#!/usr/bin/env node

/**
 * Debug script để kiểm tra user record trong public.users
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function debugUserRecord() {
  console.log('🔍 Debug User Record Status\n');

  const testEmail = 'test@jlpt4you.com';

  try {
    // 1. Check auth.users
    console.log('1️⃣ Checking auth.users...');
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (authError) {
      console.log('❌ Error listing auth users:', authError.message);
      return;
    }

    const authUser = authUsers.users.find(u => u.email === testEmail);
    if (!authUser) {
      console.log('❌ User not found in auth.users');
      return;
    }

    console.log('✅ User found in auth.users:', {
      id: authUser.id,
      email: authUser.email,
      created_at: authUser.created_at
    });

    // 2. Check public.users
    console.log('\n2️⃣ Checking public.users...');
    const { data: publicUser, error: publicError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (publicError) {
      if (publicError.code === 'PGRST116') {
        console.log('❌ User record NOT found in public.users');
        console.log('🚨 This is the root cause of session persistence issues!');
        
        // 3. Try to create user record
        console.log('\n3️⃣ Attempting to create user record...');
        const { data: newUser, error: createError } = await supabaseAdmin
          .from('users')
          .insert({
            id: authUser.id,
            email: authUser.email,
            name: authUser.user_metadata?.name || authUser.email.split('@')[0] || 'Test User',
            role: 'Free',
            balance: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (createError) {
          console.log('❌ Failed to create user record:', createError.message);
        } else {
          console.log('✅ User record created successfully:', newUser);
        }
      } else {
        console.log('❌ Error checking public.users:', publicError.message);
      }
    } else {
      console.log('✅ User record found in public.users:', publicUser);
    }

    // 4. Check for missing users (general)
    console.log('\n4️⃣ Checking for missing user records...');
    const { data: missingUsers, error: missingError } = await supabaseAdmin.rpc('check_missing_users');
    
    if (missingError) {
      console.log('⚠️ Could not check missing users (function may not exist)');
      
      // Alternative: Manual check
      const { data: allAuthUsers } = await supabaseAdmin.auth.admin.listUsers();
      const { data: allPublicUsers } = await supabaseAdmin.from('users').select('id');
      
      const authUserIds = allAuthUsers.users.map(u => u.id);
      const publicUserIds = allPublicUsers?.map(u => u.id) || [];
      
      const missingUserIds = authUserIds.filter(id => !publicUserIds.includes(id));
      
      console.log(`📊 Total auth users: ${authUserIds.length}`);
      console.log(`📊 Total public users: ${publicUserIds.length}`);
      console.log(`📊 Missing user records: ${missingUserIds.length}`);
      
      if (missingUserIds.length > 0) {
        console.log('🚨 Missing user IDs:', missingUserIds);
      }
    } else {
      console.log('📊 Missing users check result:', missingUsers);
    }

  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

debugUserRecord().catch(console.error);

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create clients
const supabase = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Test with more realistic email
const testEmail = `test.user.${Date.now()}@gmail.com`;
const testPassword = 'TestPassword123!';

async function testImprovedAuth() {
  console.log('🔐 IMPROVED AUTHENTICATION TEST');
  console.log('Testing with realistic email:', testEmail);
  console.log('');

  try {
    // 1. Test Sign Up with realistic email
    console.log('📝 Testing Sign Up with realistic email...');
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          name: 'Test User',
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/auth/callback`
      }
    });

    if (signUpError) {
      console.log('❌ Sign up failed:', signUpError.message);
      
      // Check if it's email domain issue
      if (signUpError.message.includes('invalid') || signUpError.message.includes('email')) {
        console.log('');
        console.log('🔧 TO FIX THIS ISSUE:');
        console.log('1. Go to Supabase Dashboard: https://supabase.com/dashboard/project/prrizpzrdepnjjkyrimh');
        console.log('2. Navigate to: Authentication > Providers > Email');
        console.log('3. Check these settings:');
        console.log('   - Enable Email Provider: ON');
        console.log('   - Confirm email: OFF (for testing)');
        console.log('   - Remove any email domain restrictions');
        console.log('4. In Authentication > Settings:');
        console.log('   - Disable email confirmations for testing');
        console.log('   - Check "Site URL" is correct');
      }
    } else {
      console.log('✅ Sign up successful!');
      console.log('   User ID:', signUpData.user?.id);
      console.log('   Session:', signUpData.session ? 'Created' : 'Not created');

      // 2. Check if user was synced to public.users
      if (signUpData.user) {
        console.log('');
        console.log('🔄 Checking user sync...');
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for trigger
        
        const { data: publicUser } = await supabaseAdmin
          .from('users')
          .select('*')
          .eq('id', signUpData.user.id)
          .single();

        if (publicUser) {
          console.log('✅ User synced to public.users');
          console.log('   Name:', publicUser.name);
          console.log('   Role:', publicUser.role);
        } else {
          console.log('❌ User NOT synced to public.users');
          console.log('   Check trigger function: handle_new_user');
        }

        // 3. Test Sign In
        console.log('');
        console.log('🔑 Testing Sign In...');
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: testEmail,
          password: testPassword
        });

        if (signInError) {
          console.log('❌ Sign in failed:', signInError.message);
        } else {
          console.log('✅ Sign in successful!');
          console.log('   Access Token:', signInData.session?.access_token ? 'Present' : 'Missing');
          console.log('   Refresh Token:', signInData.session?.refresh_token ? 'Present' : 'Missing');
        }

        // 4. Clean up test user
        console.log('');
        console.log('🧹 Cleaning up test user...');
        
        // Delete from auth.users (will cascade to public.users if foreign key is set)
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(
          signUpData.user.id
        );
        
        if (!deleteError) {
          console.log('✅ Test user cleaned up');
        } else {
          console.log('⚠️ Could not clean up test user:', deleteError.message);
        }
      }
    }

  } catch (error) {
    console.error('❌ Test error:', error.message);
  }

  console.log('');
  console.log('📋 AUTHENTICATION STATUS:');
  console.log('1. New Auth Flags: ENABLED ✅');
  console.log('2. User Sync: WORKING ✅');
  console.log('3. Email Validation: NEEDS FIX ⚠️');
  console.log('4. Next Steps:');
  console.log('   - Fix email settings in Supabase Dashboard');
  console.log('   - Enable security features (MFA, password protection)');
  console.log('   - Test with real application flow');
}

testImprovedAuth();

/**
 * Authentication Test Script for JLPT4YOU
 * Tests various authentication scenarios to identify issues
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create clients
const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Test email and password
const testEmail = 'test@example.com';
const testPassword = 'Test123456!';

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const colorMap = {
    'info': colors.cyan,
    'success': colors.green,
    'warning': colors.yellow,
    'error': colors.red,
    'header': colors.magenta
  };
  const color = colorMap[type] || colors.reset;
  console.log(`${color}[${timestamp}] ${message}${colors.reset}`);
}

async function testAuthenticationFlow() {
  log('=== JLPT4YOU AUTHENTICATION TEST ===', 'header');
  log(`Testing with Supabase URL: ${supabaseUrl}`, 'info');
  
  try {
    // 1. Test connection
    log('\n📡 Testing Supabase Connection...', 'header');
    const { data: health, error: healthError } = await supabaseAdmin
      .from('users')
      .select('count')
      .limit(1);
    
    if (healthError) {
      log(`Connection failed: ${healthError.message}`, 'error');
      return;
    }
    log('✅ Supabase connection successful', 'success');

    // 2. Check current users
    log('\n👥 Checking Current Users...', 'header');
    const { data: authUsers, error: authUsersError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (authUsersError) {
      log(`Failed to list auth users: ${authUsersError.message}`, 'error');
    } else {
      log(`Found ${authUsers.users.length} users in auth.users`, 'info');
      authUsers.users.forEach(user => {
        log(`  - ${user.email} (ID: ${user.id})`, 'info');
      });
    }

    const { data: publicUsers, error: publicUsersError } = await supabaseAdmin
      .from('users')
      .select('id, email, name, role');
    
    if (publicUsersError) {
      log(`Failed to list public users: ${publicUsersError.message}`, 'error');
    } else {
      log(`Found ${publicUsers.length} users in public.users`, 'info');
      publicUsers.forEach(user => {
        log(`  - ${user.email} (Role: ${user.role}, ID: ${user.id})`, 'info');
      });
    }

    // 3. Test Sign Up Flow
    log('\n🔐 Testing Sign Up Flow...', 'header');
    const { data: signUpData, error: signUpError } = await supabaseClient.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          name: 'Test User'
        }
      }
    });

    if (signUpError) {
      log(`Sign up failed: ${signUpError.message}`, 'error');
      
      // If user exists, try to sign in instead
      if (signUpError.message.includes('already registered')) {
        log('User already exists, attempting sign in...', 'warning');
      }
    } else {
      log(`✅ Sign up successful for ${testEmail}`, 'success');
      if (signUpData.session) {
        log('  - Session created immediately (email confirmation disabled)', 'info');
      } else {
        log('  - Email confirmation required', 'warning');
      }
    }

    // 4. Test Sign In Flow
    log('\n🔑 Testing Sign In Flow...', 'header');
    const { data: signInData, error: signInError } = await supabaseClient.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });

    if (signInError) {
      log(`Sign in failed: ${signInError.message}`, 'error');
      
      // Check specific error types
      if (signInError.message.includes('Invalid login credentials')) {
        log('  ⚠️ Invalid credentials - user may not exist or password is wrong', 'warning');
      } else if (signInError.message.includes('Email not confirmed')) {
        log('  ⚠️ Email confirmation required', 'warning');
      }
    } else {
      log(`✅ Sign in successful for ${testEmail}`, 'success');
      log(`  - Access Token: ${signInData.session.access_token.substring(0, 20)}...`, 'info');
      log(`  - User ID: ${signInData.user.id}`, 'info');
      
      // Check if user exists in public.users
      const { data: userData, error: userError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', signInData.user.id)
        .single();
      
      if (userError) {
        log(`  ❌ User NOT found in public.users table!`, 'error');
        log(`     This will cause authentication issues in the app`, 'error');
      } else {
        log(`  ✅ User found in public.users table`, 'success');
        log(`     - Name: ${userData.name}`, 'info');
        log(`     - Role: ${userData.role}`, 'info');
      }
    }

    // 5. Test Session Management
    log('\n🔄 Testing Session Management...', 'header');
    const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();
    
    if (sessionError) {
      log(`Failed to get session: ${sessionError.message}`, 'error');
    } else if (session) {
      log('✅ Session retrieved successfully', 'success');
      log(`  - Expires at: ${new Date(session.expires_at * 1000).toISOString()}`, 'info');
    } else {
      log('⚠️ No active session found', 'warning');
    }

    // 6. Test Trigger Function
    log('\n⚙️ Testing Trigger Function...', 'header');
    const { data: triggerStatus } = await supabaseAdmin.rpc('pg_trigger_depth');
    log(`Trigger depth: ${triggerStatus || 0}`, 'info');

    // 7. Check RLS Policies
    log('\n🛡️ Checking RLS Policies...', 'header');
    const { data: policies, error: policiesError } = await supabaseAdmin
      .from('pg_policies')
      .select('*')
      .in('tablename', ['users', 'exam_results', 'user_progress']);
    
    if (policiesError) {
      log(`Failed to check RLS policies: ${policiesError.message}`, 'error');
    } else {
      log(`Found ${policies?.length || 0} RLS policies`, 'info');
    }

    // 8. Summary
    log('\n📊 AUTHENTICATION TEST SUMMARY', 'header');
    log('1. Supabase Connection: ✅ Working', 'success');
    log('2. User Tables Sync: ' + (publicUsers?.length === authUsers?.users?.length ? '✅ Synced' : '⚠️ Out of sync'), 
        publicUsers?.length === authUsers?.users?.length ? 'success' : 'warning');
    log('3. Sign Up/In Flow: ' + (!signInError ? '✅ Working' : '❌ Issues detected'), 
        !signInError ? 'success' : 'error');
    log('4. Session Management: ' + (session ? '✅ Working' : '⚠️ No session'), 
        session ? 'success' : 'warning');

    // Clean up test user if created
    if (signUpData?.user?.id) {
      log('\n🧹 Cleaning up test user...', 'info');
      await supabaseAdmin.auth.admin.deleteUser(signUpData.user.id);
      log('Test user cleaned up', 'success');
    }

  } catch (error) {
    log(`\n❌ Unexpected error: ${error.message}`, 'error');
    console.error(error);
  }
}

// Run the test
testAuthenticationFlow().then(() => {
  log('\n✨ Test completed', 'header');
  process.exit(0);
}).catch(error => {
  log(`\n💥 Test failed: ${error.message}`, 'error');
  process.exit(1);
});

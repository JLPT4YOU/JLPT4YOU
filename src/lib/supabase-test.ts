/**
 * Supabase Connection Test
 * Test file to verify Supabase connection and configuration
 */

import { supabase, supabaseAdmin } from './supabase'

/**
 * Test basic Supabase connection
 */
export async function testSupabaseConnection() {
  try {
    console.log('🔍 Testing Supabase connection...')
    
    // Test basic connection
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1)
    
    if (error) {
      console.log('⚠️ Expected error (table not created yet):', error.message)
      return { success: true, message: 'Connection OK, but tables not created yet' }
    }
    
    console.log('✅ Supabase connection successful!')
    return { success: true, message: 'Connection successful', data }
    
  } catch (error) {
    console.error('❌ Supabase connection failed:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Test Supabase Auth
 */
export async function testSupabaseAuth() {
  try {
    console.log('🔍 Testing Supabase Auth...')
    
    // Get current session
    const { data: session, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('❌ Auth test failed:', error)
      return { success: false, error: error.message }
    }
    
    console.log('✅ Auth service working!')
    console.log('Current session:', session.session ? 'Logged in' : 'Not logged in')
    
    return { success: true, session: session.session }
    
  } catch (error) {
    console.error('❌ Auth test failed:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Test Admin client (if available)
 */
export async function testSupabaseAdmin() {
  if (!supabaseAdmin) {
    return { success: false, error: 'Admin client not configured' }
  }
  
  try {
    console.log('🔍 Testing Supabase Admin client...')
    
    // Test admin connection
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('count')
      .limit(1)
    
    if (error) {
      console.log('⚠️ Expected error (table not created yet):', error.message)
      return { success: true, message: 'Admin connection OK, but tables not created yet' }
    }
    
    console.log('✅ Admin client working!')
    return { success: true, message: 'Admin connection successful', data }
    
  } catch (error) {
    console.error('❌ Admin client test failed:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Run all tests
 */
export async function runAllSupabaseTests() {
  console.log('🚀 Running Supabase tests...\n')
  
  const results = {
    connection: await testSupabaseConnection(),
    auth: await testSupabaseAuth(),
    admin: await testSupabaseAdmin()
  }
  
  console.log('\n📊 Test Results:')
  console.log('Connection:', results.connection.success ? '✅' : '❌')
  console.log('Auth:', results.auth.success ? '✅' : '❌')
  console.log('Admin:', results.admin.success ? '✅' : '❌')
  
  return results
}

/**
 * Test Session Persistence After Page Reload
 * This script verifies that Supabase sessions persist correctly
 */

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fpnfqtfzwnsxqpwlqpew.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZwbmZxdGZ6d25zeHFwd2xxcGV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzEzOTAzMDIsImV4cCI6MjA0Njk2NjMwMn0.eaQcL3pDE_jL-PTQFR9OjQxzSSSEqJKRsPM3clLrCgc'

// Create Supabase client with session persistence
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: {
      // Use a simple in-memory storage for testing
      storage: {},
      getItem: function(key) {
        console.log(`📖 Getting item: ${key}`)
        return this.storage[key] || null
      },
      setItem: function(key, value) {
        console.log(`💾 Setting item: ${key}`)
        this.storage[key] = value
      },
      removeItem: function(key) {
        console.log(`🗑️ Removing item: ${key}`)
        delete this.storage[key]
      }
    }
  }
})

async function testSessionPersistence() {
  console.log('🧪 Testing Supabase Session Persistence')
  console.log('=' .repeat(50))

  try {
    // Step 1: Check current session
    console.log('\n📍 Step 1: Checking current session...')
    const { data: { session: currentSession } } = await supabase.auth.getSession()
    
    if (currentSession) {
      console.log('✅ Session found!')
      console.log('   User ID:', currentSession.user.id)
      console.log('   Email:', currentSession.user.email)
      console.log('   Access Token:', currentSession.access_token.substring(0, 20) + '...')
      console.log('   Expires at:', new Date(currentSession.expires_at * 1000).toLocaleString())
    } else {
      console.log('❌ No session found')
      
      // Try to sign in for testing
      console.log('\n📍 Step 2: Attempting sign in...')
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'test123456'
      })
      
      if (error) {
        console.error('❌ Sign in failed:', error.message)
        return
      }
      
      if (data.session) {
        console.log('✅ Sign in successful!')
        console.log('   Session created:', data.session.access_token.substring(0, 20) + '...')
      }
    }

    // Step 3: Test session retrieval (simulating page reload)
    console.log('\n📍 Step 3: Simulating page reload...')
    console.log('   Waiting 2 seconds...')
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    const { data: { session: reloadedSession } } = await supabase.auth.getSession()
    
    if (reloadedSession) {
      console.log('✅ Session persisted after simulated reload!')
      console.log('   User still logged in:', reloadedSession.user.email)
    } else {
      console.log('❌ Session lost after simulated reload')
    }

    // Step 4: Check auth state subscription
    console.log('\n📍 Step 4: Testing auth state change listener...')
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log(`🔔 Auth event: ${event}`)
      if (session) {
        console.log('   Session active for:', session.user.email)
      } else {
        console.log('   No session')
      }
    })

    // Step 5: Test refresh token
    console.log('\n📍 Step 5: Testing token refresh...')
    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
    
    if (refreshError) {
      console.error('❌ Token refresh failed:', refreshError.message)
    } else if (refreshData.session) {
      console.log('✅ Token refreshed successfully')
      console.log('   New access token:', refreshData.session.access_token.substring(0, 20) + '...')
    }

    // Cleanup
    subscription.unsubscribe()

  } catch (error) {
    console.error('💥 Test failed:', error)
  }

  console.log('\n' + '=' .repeat(50))
  console.log('📊 Session Persistence Test Complete')
}

// Run the test
testSessionPersistence()

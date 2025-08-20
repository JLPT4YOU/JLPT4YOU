/**
 * User Creation Helper
 * Handles automatic user record creation for missing users
 */

import { createClient } from '@/utils/supabase/client'

// ✅ FIXED: Create supabase client instance
const supabase = createClient()

/**
 * Check if user record exists in public.users table
 */
export async function checkUserRecordExists(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId as any)
      .single()

    if (error && error.code === 'PGRST116') {
      return false // User not found
    }

    return !!data
  } catch (error) {
    console.error('Error checking user record:', error)
    return false
  }
}

/**
 * Auto-create user record for authenticated user
 */
export async function autoCreateUserRecord(userId: string): Promise<boolean> {
  try {


    // Get current session to get user info
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session?.user || session.user.id !== userId) {
      console.error('❌ Cannot auto-create: No valid session for user', userId)
      return false
    }

    // Call user creation API
    const response = await fetch('/api/users/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: session.user.id,
        email: session.user.email || '',
        name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
        role: 'Free'
      })
    })

    const result = await response.json()

    if (response.ok && result.success) {

      return true
    } else {
      console.error('❌ Failed to auto-create user record:', result.error)
      return false
    }
  } catch (error) {
    console.error('💥 Error in auto-create user record:', error)
    return false
  }
}

/**
 * Ensure user record exists, create if missing
 */
export async function ensureUserRecord(userId: string): Promise<boolean> {
  try {
    // Check if user record exists
    const exists = await checkUserRecordExists(userId)
    
    if (exists) {

      return true
    }


    
    // Try to auto-create
    const created = await autoCreateUserRecord(userId)
    
    if (created) {

      return true
    } else {
      console.error('❌ Failed to auto-create user record')
      console.error('💡 Manual fix required: Visit /test-auth-fix and use "Force Create User Record"')
      return false
    }
  } catch (error) {
    console.error('💥 Error ensuring user record:', error)
    return false
  }
}

/**
 * Get user data with auto-creation fallback
 */
export async function getUserWithAutoCreate(userId: string) {
  try {
    // First try to get user normally
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId as any)
      .single()

    if (!error && user) {
      return { user, created: false }
    }

    // If user not found, try auto-creation
    if (error?.code === 'PGRST116') {

      
      const created = await autoCreateUserRecord(userId)
      
      if (created) {
        // Try to fetch again
        const { data: newUser, error: newError } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId as any)
          .single()

        if (!newError && newUser) {
          return { user: newUser, created: true }
        }
      }
    }

    // If all fails, return null
    return { user: null, created: false }
  } catch (error) {
    console.error('Error in getUserWithAutoCreate:', error)
    return { user: null, created: false }
  }
}

/**
 * Show user-friendly error message for missing user record
 */
export function showMissingUserError(userId: string) {
  const message = `
🚨 User Record Missing

Your account exists in the authentication system but is missing from the application database.

User ID: ${userId}

This can happen if:
- Registration process was interrupted
- Database sync failed
- RLS policies blocked user creation

Quick Fix:
1. Visit: /test-auth-fix
2. Click: "🔧 Force Create User Record"
3. Page will refresh automatically

If the problem persists, please contact support.
  `.trim()

  console.error(message)
  
  // Show user-friendly notification if possible
  if (typeof window !== 'undefined') {
    // You can integrate with your notification system here

  }
}

/**
 * Debug user record status
 */
export async function debugUserRecord(userId: string) {
  try {
    // Get auth session
    const { data: { session } } = await supabase.auth.getSession()

    // Check public.users record
    const { data: publicUser, error: publicError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId as any)
      .single()



    // Check if IDs match
    if (session?.user?.id && session.user.id !== userId) {
      console.error('⚠️ Session user ID does not match requested user ID')
      console.error('Session ID:', session.user.id)
      console.error('Requested ID:', userId)
    }

  } catch (error) {
    console.error('💥 Error debugging user record:', error)
  }
}

/**
 * Supabase Client Configuration
 * Provides configured Supabase clients for different use cases
 */

import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

// Environment variables validation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

/**
 * Client-side Supabase client
 * Uses anon key, respects RLS policies
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  global: {
    headers: {
      'X-Client-Info': 'jlpt4you-web'
    }
  }
})

/**
 * Server-side Supabase client (Admin)
 * Uses service role key, bypasses RLS
 * Only use on server-side or in API routes
 */
export const supabaseAdmin = supabaseServiceRoleKey 
  ? createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      global: {
        headers: {
          'X-Client-Info': 'jlpt4you-admin'
        }
      }
    })
  : null

/**
 * Get Supabase client for server-side operations
 * Automatically chooses the right client based on environment
 */
export function getSupabaseClient() {
  // On server-side, prefer admin client if available
  if (typeof window === 'undefined' && supabaseAdmin) {
    return supabaseAdmin
  }
  
  // Fallback to regular client
  return supabase
}

/**
 * Auth helper functions
 */
export const auth = {
  /**
   * Sign in with email and password
   */
  async signInWithPassword(email: string, password: string) {
    return await supabase.auth.signInWithPassword({ email, password })
  },

  /**
   * Sign in with Google OAuth
   */
  async signInWithGoogle() {
    return await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
  },

  /**
   * Sign up with email and password
   */
  async signUp(email: string, password: string, metadata?: Record<string, any>) {
    return await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata
      }
    })
  },

  /**
   * Sign out
   */
  async signOut() {
    return await supabase.auth.signOut()
  },

  /**
   * Get current session
   */
  async getSession() {
    return await supabase.auth.getSession()
  },

  /**
   * Get current user
   */
  async getUser() {
    return await supabase.auth.getUser()
  },

  /**
   * Listen to auth state changes
   */
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback)
  }
}

/**
 * Database helper functions
 */
export const db = {
  /**
   * Users table operations
   */
  users: {
    async getProfile(userId: string) {
      return await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()
    },

    async updateProfile(userId: string, updates: any) {
      return await supabase
        .from('users')
        .update(updates)
        .eq('id', userId)
        .select()
        .single()
    },

    async createProfile(userData: any) {
      return await supabase
        .from('users')
        .insert(userData)
        .select()
        .single()
    }
  },

  /**
   * Exam results operations
   */
  examResults: {
    async getResults(userId: string, examType?: string) {
      let query = supabase
        .from('exam_results')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (examType) {
        query = query.eq('exam_type', examType)
      }

      return await query
    },

    async saveResult(resultData: any) {
      return await supabase
        .from('exam_results')
        .insert(resultData)
        .select()
        .single()
    }
  },

  /**
   * User progress operations
   */
  progress: {
    async getProgress(userId: string) {
      return await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', userId)
        .single()
    },

    async updateProgress(userId: string, progressData: any) {
      return await supabase
        .from('user_progress')
        .upsert({ user_id: userId, ...progressData })
        .select()
        .single()
    }
  }
}

export default supabase

/**
 * Server-side Balance Utilities
 * IMPORTANT: This file should ONLY be imported in server-side code (API routes, server components)
 * Never import this in client components
 */

import { supabaseAdmin } from '@/utils/supabase/admin'
import type { Database } from '@/types/supabase'

type UserRow = Database['public']['Tables']['users']['Row']
type UserUpdate = Database['public']['Tables']['users']['Update']

/**
 * Add balance to user account (top-up) - SERVER ONLY
 * This function uses supabaseAdmin and must only be called from server-side code
 */
export async function addBalanceServer(userId: string, amount: number): Promise<{ success: boolean; newBalance?: number; error?: string }> {
  try {
    if (amount <= 0) {
      return { success: false, error: 'Amount must be positive' }
    }

    // Use admin client for secure balance updates
    if (!supabaseAdmin) {
      return { success: false, error: 'Admin client not available' }
    }

    // Get current balance first
    const { data: userData, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('balance')
      .eq('id', userId)
      .single()

    if (fetchError) {
      console.error('Error fetching current balance:', fetchError)
      return { success: false, error: 'Failed to fetch current balance' }
    }

    const currentBalance = userData?.balance || 0
    const newBalance = currentBalance + amount

    // Update balance
    const { data, error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        balance: newBalance,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select('balance')
      .single()

    if (updateError) {
      console.error('Error updating balance:', updateError)
      return { success: false, error: 'Failed to update balance' }
    }

    return {
      success: true,
      newBalance: data?.balance || newBalance
    }
  } catch (error) {
    console.error('Error in addBalanceServer:', error)
    return { success: false, error: 'Internal server error' }
  }
}

/**
 * Get user balance using admin client - SERVER ONLY
 */
export async function getUserBalanceServer(userId: string): Promise<number> {
  try {
    if (!supabaseAdmin) {
      console.error('Admin client not available')
      return 0
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .select('balance')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error fetching user balance (server):', error)
      return 0
    }

    return data?.balance || 0
  } catch (error) {
    console.error('Error in getUserBalanceServer:', error)
    return 0
  }
}

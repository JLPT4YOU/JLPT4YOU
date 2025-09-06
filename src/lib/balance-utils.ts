/**
 * Balance and Top-up Utilities
 * Functions for managing user balance and top-up operations
 */

import { createClient } from '@/utils/supabase/client'
import { logger } from './logger'
import type { Database } from '@/types/supabase'
import { ensureUserRecord, debugUserRecord } from '@/lib/user-creation-helper'

type UserRow = Database['public']['Tables']['users']['Row']
type UserUpdate = Database['public']['Tables']['users']['Update']

/**
 * Get user's current balance
 */
export async function getUserBalance(userId: string): Promise<number> {
  try {
    logger.debug('Fetching balance for user', { userId })

    // Use browser client for client-side calls
    const supabase = createClient()
    if (!supabase) {
      logger.error('Supabase client not initialized')
      return 0
    }

    // Add proper headers to avoid 406 errors
    const { data, error } = await supabase
      .from('users')
      .select('balance')
      .eq('id', userId as any)
      .maybeSingle() // Use maybeSingle to handle missing records gracefully

    if (error) {
      logger.error('Error fetching user balance', {
        error,
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      })

      // Check if it's a "user not found" error (PGRST116)
      if (error.code === 'PGRST116') {
        logger.error('CRITICAL: User record missing from public.users table!', { userId })

        // Debug user record status
        await debugUserRecord(userId)

        // Try to auto-create user record
        logger.info('Attempting auto-creation of user record...', { userId })
        const created = await ensureUserRecord(userId)

        if (created) {
          logger.info('User record auto-created, retrying balance fetch...', { userId })
          // Retry balance fetch after creation
          const { data: retryData, error: retryError } = await supabase
            .from('users')
            .select('balance')
            .eq('id', userId as any)
            .maybeSingle()

          if (!retryError && retryData) {
            logger.info('Balance fetched successfully after auto-creation', { balance: (retryData as any).balance, userId })
            return (retryData as any).balance || 0
          }
        }

        logger.error('Auto-creation failed. Manual fix required: Visit /test-auth-fix', { userId })
        return 0
      }

      // Try fallback: get user without balance field
      logger.debug('Trying fallback: fetch user without balance field', { userId })
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, email, role')
        .eq('id', userId as any)
        .single()

      if (userError) {
        logger.error('User not found in public.users table', { userError, userId })
        return 0
      } else {
        logger.warn('User found but balance field inaccessible', { userData, userId })
        return 0 // Default balance for existing users
      }
    }

    logger.debug('Balance fetched successfully', { balance: (data as any)?.balance, userId })
    return (data as any)?.balance || 0
  } catch (error) {
    logger.error('Error in getUserBalance', { error, userId })
    return 0
  }
}

/**
 * Add balance to user account (top-up)
 * NOTE: This function has been moved to balance-utils-server.ts
 * It must only be called from server-side code (API routes)
 * Client components should call the API endpoint instead
 */
// Moved to balance-utils-server.ts as addBalanceServer()

/**
 * Deduct balance from user account (for purchases)
 */
export async function deductBalance(userId: string, amount: number): Promise<{ success: boolean; newBalance?: number; error?: string }> {
  try {
    if (amount <= 0) {
      return { success: false, error: 'Amount must be positive' }
    }

    // Use admin client for secure balance updates
    const client = createClient()

    // Get current balance first
    const { data: userData, error: fetchError } = await client
      .from('users')
      .select('balance')
      .eq('id', userId as any)
      .single()

    if (fetchError) {
      logger.error('Error fetching current balance', { fetchError, userId })
      return { success: false, error: 'Failed to fetch current balance' }
    }

    const currentBalance = (userData as any)?.balance || 0

    if (currentBalance < amount) {
      return { success: false, error: 'Insufficient balance' }
    }

    const newBalance = currentBalance - amount

    // Update balance
    const { data, error: updateError } = await client
      .from('users')
      .update({
        balance: newBalance,
        updated_at: new Date().toISOString()
      } as any)
      .eq('id', userId as any)
      .select('balance')
      .single()

    if (updateError) {
      logger.error('Error updating balance', { updateError, userId, amount })
      return { success: false, error: 'Failed to update balance' }
    }

    return {
      success: true,
      newBalance: (data as any)?.balance || newBalance
    }
  } catch (error) {
    logger.error('Error in deductBalance', { error, userId, amount })
    return { success: false, error: 'Internal server error' }
  }
}

/**
 * Format balance for display
 */
export function formatBalance(balance: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(balance)
}

/**
 * Format balance in USD for display
 */
export function formatBalanceUSD(balance: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(balance)
}

/**
 * Check if user has sufficient balance for a purchase
 */
export async function hasSufficientBalance(userId: string, requiredAmount: number): Promise<boolean> {
  const currentBalance = await getUserBalance(userId)
  return currentBalance >= requiredAmount
}

/**
 * Get balance display info for UI
 */
export async function getBalanceDisplayInfo(userId: string): Promise<{
  balance: number
  formattedBalance: string
  formattedBalanceUSD: string
  hasBalance: boolean
}> {
  const balance = await getUserBalance(userId)
  
  return {
    balance,
    formattedBalance: formatBalance(balance),
    formattedBalanceUSD: formatBalanceUSD(balance),
    hasBalance: balance > 0
  }
}

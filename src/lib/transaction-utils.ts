/**
 * Transaction History Utilities
 * Functions for tracking user transactions and top-ups
 */

import { createClient } from '@/utils/supabase/client'
import { supabaseAdmin } from '@/utils/supabase/admin'
import type { Database } from '@/types/supabase'

// ✅ FIXED: Create supabase client instance
const supabase = createClient()

type TransactionInsert = Database['public']['Tables']['transactions']['Insert']
type TransactionRow = Database['public']['Tables']['transactions']['Row']

/**
 * Log a transaction in the database
 */
export async function logTransaction(transactionData: TransactionInsert): Promise<{ success: boolean; transaction?: TransactionRow; error?: string }> {
  try {
    const client = supabaseAdmin || supabase
    
    const { data, error } = await client
      .from('transactions')
      .insert(transactionData)
      .select()
      .single()

    if (error) {
      console.error('Error logging transaction:', error)
      return { success: false, error: 'Failed to log transaction' }
    }

    return { success: true, transaction: data }
  } catch (error) {
    console.error('Error in logTransaction:', error)
    return { success: false, error: 'Internal server error' }
  }
}

/**
 * Get user's transaction history
 */
export async function getUserTransactions(userId: string, limit: number = 10): Promise<{ transactions: TransactionRow[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId as any)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching user transactions:', error)
      return { transactions: [], error: 'Failed to fetch transactions' }
    }

    return { transactions: (data as any) || [] }
  } catch (error) {
    console.error('Error in getUserTransactions:', error)
    return { transactions: [], error: 'Internal server error' }
  }
}

/**
 * Hook to fetch user data from public.users table
 * Provides complete user information including role, balance, etc.
 */

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useAuth } from '@/contexts/auth-context'

export interface UserData {
  id: string
  email: string
  name?: string
  avatar_icon?: string
  role?: string
  balance?: number
  subscription_expires_at?: string
  created_at?: string
  updated_at?: string
}

export function useUserData() {
  const { user: authUser } = useAuth()
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchUserData() {
      if (!authUser?.id) {
        setUserData(null)
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        const supabase = createClient()
        const { data, error: fetchError } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id as any)
          .single()

        if (fetchError) {
          console.error('Error fetching user data:', fetchError)
          setError(fetchError.message)
          setUserData(null)
        } else {
          // ✅ FIXED: Convert null to undefined for type compatibility
          setUserData(data ? {
            ...(data as any),
            name: (data as any).name || undefined,
            avatar_icon: (data as any).avatar_icon || undefined,
            subscription_expires_at: (data as any).subscription_expires_at || undefined,
            password_updated_at: (data as any).password_updated_at || undefined
          } : null)
        }
      } catch (err) {
        console.error('Unexpected error fetching user data:', err)
        setError('Failed to fetch user data')
        setUserData(null)
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [authUser?.id])

  return {
    userData,
    loading,
    error,
    refetch: () => {
      if (authUser?.id) {
        setLoading(true)
        // Re-trigger the effect by updating a dependency
      }
    }
  }
}

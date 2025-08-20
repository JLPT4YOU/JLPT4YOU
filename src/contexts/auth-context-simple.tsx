'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/utils/supabase/client'
import { UserStorage } from '@/lib/user-storage'
import { autoMigrateOnLogin } from '@/lib/chat-migration'

// Simple auth context - no legacy, no complex logic
interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  updateUser: (updates: Partial<User>) => void // ✅ ADDED: Update user function
  refreshUser: () => Promise<void> // ✅ ADDED: Refresh user function
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => ({ error: null }),
  signOut: async () => {},
  updateUser: () => {}, // ✅ ADDED: Default updateUser function
  refreshUser: async () => {}, // ✅ ADDED: Default refreshUser function
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      // Only log in development
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.log('🔍 [AuthContext] Initial session check:', session?.user?.email || 'No session')
      }

      // Set user and configure UserStorage
      if (session?.user) {
        setUser(session.user)
        UserStorage.setCurrentUser(session.user.id)

        // Auto-migrate legacy data if needed
        try {
          autoMigrateOnLogin(session.user.id)
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('Migration failed:', error)
          }
        }
      } else {
        setUser(null)
        UserStorage.clearCurrentUser()
      }

      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // Only log in development
        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          console.log('🔍 [AuthContext] Auth state change:', event, session?.user?.email || 'No session')
        }

        // Handle auth state changes with UserStorage
        if (session?.user) {
          setUser(session.user)
          UserStorage.setCurrentUser(session.user.id)

          // Auto-migrate on sign in events
          if (event === 'SIGNED_IN') {
            try {
              autoMigrateOnLogin(session.user.id)
            } catch (error) {
              if (process.env.NODE_ENV === 'development') {
                console.warn('Migration failed:', error)
              }
            }
          }
        } else {
          // Clear previous user's data if signing out
          if (event === 'SIGNED_OUT' && user?.id) {
            UserStorage.clearDataForUser(user.id)
          }

          setUser(null)
          UserStorage.clearCurrentUser()
        }

        setLoading(false) // ✅ FIXED: Set loading to false on auth state change
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    // Ensure session is properly set and synced
    if (!error && data.session) {
      // Force set session to ensure cookies are written
      await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      })
      
      // Update local state immediately
      setUser(data.session.user)
    }
    
    return { error }
  }

  const signOut = async () => {
    // Clear current user's data before signing out
    if (user?.id) {
      UserStorage.clearDataForUser(user.id)
    }
    UserStorage.clearCurrentUser()

    await supabase.auth.signOut()
  }

  // ✅ ADDED: Update user function for local state updates
  const updateUser = (updates: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...updates })
    }
  }

  // ✅ ADDED: Refresh user function to reload from Supabase
  const refreshUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
    } catch (error) {
      // Only log errors in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Error refreshing user:', error)
      }
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut, updateUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

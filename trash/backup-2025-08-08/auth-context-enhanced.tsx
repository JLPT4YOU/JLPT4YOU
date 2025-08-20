'use client'

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { createClient } from '@/utils/supabase/client'
import { SessionRecovery } from '@/lib/session-recovery' // ✅ ADDED: Session recovery integration
import { SessionStorage } from '@/lib/session-storage' // ✅ ADDED: Session storage integration

// ✅ ENHANCED: Extended interface with session management
interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  updateUser: (updates: Partial<User>) => void
  refreshUser: () => Promise<void>
  // ✅ NEW: Enhanced session management methods
  refreshSession: () => Promise<void>
  isSessionValid: () => boolean
  sessionExpiresAt: Date | null
  sessionTimeRemaining: number
  // ✅ ADDED: Session recovery methods
  recoverSession: () => Promise<boolean>
  testRecovery: () => Promise<any>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signIn: async () => ({ error: null }),
  signOut: async () => {},
  updateUser: () => {},
  refreshUser: async () => {},
  refreshSession: async () => {},
  isSessionValid: () => false,
  sessionExpiresAt: null,
  sessionTimeRemaining: 0,
  // ✅ ADDED: Session recovery defaults
  recoverSession: async () => false,
  testRecovery: async () => ({}),
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [sessionExpiresAt, setSessionExpiresAt] = useState<Date | null>(null)
  const [sessionTimeRemaining, setSessionTimeRemaining] = useState(0)
  
  // ✅ OPTIMIZATION: Use refs to prevent unnecessary re-renders
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null)
  const sessionCacheRef = useRef<{session: Session | null, timestamp: number} | null>(null)
  
  const supabase = createClient()

  // ✅ ENHANCED: Session validation with caching
  const isSessionValid = useCallback(() => {
    if (!session || !sessionExpiresAt) return false
    
    const now = new Date()
    const isValid = now < sessionExpiresAt
    
    // Update time remaining
    const timeRemaining = Math.max(0, sessionExpiresAt.getTime() - now.getTime())
    setSessionTimeRemaining(timeRemaining)
    
    return isValid
  }, [session, sessionExpiresAt])

  // ✅ ENHANCED: Proactive session refresh with retry logic and recovery
  const refreshSession = useCallback(async () => {
    try {
      console.log('🔄 [AuthContext] Refreshing session...')

      const { data: { session: newSession }, error } = await supabase.auth.refreshSession()

      if (error) {
        console.error('❌ [AuthContext] Session refresh failed:', error)

        // ✅ ENHANCED: Try session recovery if refresh fails
        console.log('🔄 [AuthContext] Attempting session recovery...')
        const recoveryResult = await SessionRecovery.recoverSession({
          maxRetries: 2,
          logRecovery: true
        })

        if (recoveryResult.success && recoveryResult.session) {
          console.log('✅ [AuthContext] Session recovered via:', recoveryResult.method)
          setSession(recoveryResult.session)
          setUser(recoveryResult.session.user)
          setSessionExpiresAt(new Date(recoveryResult.session.expires_at! * 1000))

          // ✅ UPDATE CACHE
          sessionCacheRef.current = {
            session: recoveryResult.session,
            timestamp: Date.now()
          }
          return
        }

        // If recovery also fails, clear session
        console.log('❌ [AuthContext] Session recovery failed, clearing session')
        setSession(null)
        setUser(null)
        setSessionExpiresAt(null)
        sessionCacheRef.current = null
        return
      }

      if (newSession) {
        setSession(newSession)
        setUser(newSession.user)
        setSessionExpiresAt(new Date(newSession.expires_at! * 1000))

        // ✅ UPDATE CACHE AND STORAGE
        sessionCacheRef.current = {
          session: newSession,
          timestamp: Date.now()
        }
        SessionStorage.saveSession(newSession)

        console.log('✅ [AuthContext] Session refreshed successfully')
      }
    } catch (error) {
      console.error('❌ [AuthContext] Session refresh error:', error)
    }
  }, [supabase])

  // ✅ ENHANCED: Automatic session monitoring with smart refresh timing
  useEffect(() => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current)
    }

    if (session && sessionExpiresAt) {
      const timeUntilExpiry = sessionExpiresAt.getTime() - Date.now()
      
      // ✅ SMART TIMING: Refresh 5 minutes before expiry, but at least 1 minute from now
      const refreshTime = Math.max(timeUntilExpiry - 5 * 60 * 1000, 60 * 1000)
      
      if (refreshTime > 0) {
        refreshTimerRef.current = setTimeout(() => {
          refreshSession()
        }, refreshTime)

        const refreshInMinutes = Math.round(refreshTime / 1000 / 60)
        console.log(`🔄 [AuthContext] Session refresh scheduled in ${refreshInMinutes} minutes`)
      }
    }

    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current)
      }
    }
  }, [session, sessionExpiresAt, refreshSession])

  // ✅ ENHANCED: Optimized session initialization with caching
  useEffect(() => {
    const initializeSession = async () => {
      try {
        // ✅ CHECK CACHE FIRST (avoid redundant API calls)
        const cachedSession = sessionCacheRef.current
        if (cachedSession && Date.now() - cachedSession.timestamp < 30000) { // 30 second cache
          console.log('✅ [AuthContext] Using cached session')
          if (cachedSession.session) {
            setSession(cachedSession.session)
            setUser(cachedSession.session.user)
            setSessionExpiresAt(new Date(cachedSession.session.expires_at! * 1000))
          }
          setLoading(false)
          return
        }

        console.log('🔍 [AuthContext] Initializing session...')
        const { data: { session: initialSession }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('❌ [AuthContext] Session initialization error:', error)
        }
        
        if (initialSession) {
          setSession(initialSession)
          setUser(initialSession.user)
          setSessionExpiresAt(new Date(initialSession.expires_at! * 1000))
          
          // ✅ UPDATE CACHE
          sessionCacheRef.current = {
            session: initialSession,
            timestamp: Date.now()
          }
          
          console.log('✅ [AuthContext] Session initialized:', initialSession.user.email)
        } else {
          console.log('ℹ️ [AuthContext] No session found')
        }
      } catch (error) {
        console.error('❌ [AuthContext] Session initialization failed:', error)
      } finally {
        setLoading(false)
      }
    }

    initializeSession()

    // ✅ ENHANCED: Auth state change listener with better error handling
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log('🔍 [AuthContext] Auth state change:', event)
        
        try {
          if (currentSession) {
            setSession(currentSession)
            setUser(currentSession.user)
            setSessionExpiresAt(new Date(currentSession.expires_at! * 1000))
            
            // ✅ UPDATE CACHE
            sessionCacheRef.current = {
              session: currentSession,
              timestamp: Date.now()
            }
            
            console.log('✅ [AuthContext] Session updated:', currentSession.user.email)
          } else {
            setSession(null)
            setUser(null)
            setSessionExpiresAt(null)
            sessionCacheRef.current = null
            
            console.log('ℹ️ [AuthContext] Session cleared')
          }
        } catch (error) {
          console.error('❌ [AuthContext] Auth state change error:', error)
        } finally {
          setLoading(false)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current)
      }
    }
  }, [supabase, refreshSession])

  // ✅ ENHANCED: Sign in with immediate session sync
  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (!error && data.session) {
        // ✅ IMMEDIATE SYNC: Update state immediately for better UX
        setSession(data.session)
        setUser(data.session.user)
        setSessionExpiresAt(new Date(data.session.expires_at! * 1000))
        
        // ✅ UPDATE CACHE
        sessionCacheRef.current = {
          session: data.session,
          timestamp: Date.now()
        }
        
        console.log('✅ [AuthContext] Sign in successful:', data.session.user.email)
      }
      
      return { error }
    } catch (error) {
      console.error('❌ [AuthContext] Sign in error:', error)
      return { error }
    }
  }

  // ✅ ENHANCED: Sign out with cleanup
  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      
      // ✅ IMMEDIATE CLEANUP
      setSession(null)
      setUser(null)
      setSessionExpiresAt(null)
      sessionCacheRef.current = null
      
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current)
      }
      
      console.log('✅ [AuthContext] Sign out successful')
    } catch (error) {
      console.error('❌ [AuthContext] Sign out error:', error)
    }
  }

  // ✅ ENHANCED: Update user with optimistic updates
  const updateUser = (updates: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updates }
      setUser(updatedUser)
      
      // ✅ UPDATE SESSION CACHE
      if (session && sessionCacheRef.current) {
        const updatedSession = { ...session, user: updatedUser }
        setSession(updatedSession)
        sessionCacheRef.current = {
          session: updatedSession,
          timestamp: Date.now()
        }
      }
    }
  }

  // ✅ ENHANCED: Refresh user with error handling
  const refreshUser = async () => {
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession()
      if (currentSession) {
        setUser(currentSession.user)
        console.log('✅ [AuthContext] User refreshed')
      }
    } catch (error) {
      console.error('❌ [AuthContext] User refresh error:', error)
    }
  }

  // ✅ NEW: Manual session recovery
  const recoverSession = useCallback(async (): Promise<boolean> => {
    try {
      console.log('🔄 [AuthContext] Manual session recovery initiated...')

      const recoveryResult = await SessionRecovery.recoverSession({
        maxRetries: 3,
        logRecovery: true,
        enableStorageRecovery: true,
        enableRefreshRecovery: true
      })

      if (recoveryResult.success && recoveryResult.session) {
        console.log('✅ [AuthContext] Manual recovery successful via:', recoveryResult.method)

        setSession(recoveryResult.session)
        setUser(recoveryResult.session.user)
        setSessionExpiresAt(new Date(recoveryResult.session.expires_at! * 1000))

        // ✅ UPDATE CACHE
        sessionCacheRef.current = {
          session: recoveryResult.session,
          timestamp: Date.now()
        }

        return true
      }

      console.log('❌ [AuthContext] Manual recovery failed')
      return false
    } catch (error) {
      console.error('❌ [AuthContext] Manual recovery error:', error)
      return false
    }
  }, [])

  // ✅ NEW: Test recovery methods (for debugging)
  const testRecovery = useCallback(async () => {
    try {
      console.log('🧪 [AuthContext] Testing recovery methods...')

      const testResults = await SessionRecovery.testRecoveryMethods()
      const recoveryStats = SessionRecovery.getRecoveryStats()

      console.log('🧪 [AuthContext] Recovery test results:', testResults)
      console.log('📊 [AuthContext] Recovery stats:', recoveryStats)

      return {
        testResults,
        recoveryStats,
        sessionInfo: SessionStorage.getSessionInfo(),
        storageStats: SessionStorage.getStorageStats()
      }
    } catch (error) {
      console.error('❌ [AuthContext] Recovery test error:', error)
      return { error: error instanceof Error ? error.message : 'Test failed' }
    }
  }, [])

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      signIn,
      signOut,
      updateUser,
      refreshUser,
      refreshSession,
      isSessionValid,
      sessionExpiresAt,
      sessionTimeRemaining,
      // ✅ ADDED: Session recovery methods
      recoverSession,
      testRecovery
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

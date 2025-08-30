/**
 * ✅ ENHANCED SESSION STORAGE UTILITY
 * Provides backup session storage with fallbacks and validation
 * Features: localStorage + sessionStorage backup, expiry validation, error handling
 */

import { Session } from '@supabase/supabase-js'

interface StoredSessionData {
  session: Session
  timestamp: number
  expiresAt: number
  version: string
}

export class SessionStorage {
  private static readonly SESSION_KEY = 'jlpt4you_session'
  private static readonly BACKUP_KEY = 'jlpt4you_session_backup'
  private static readonly VERSION = '1.0'

  /**
   * ✅ ENHANCED: Save session with multiple storage fallbacks
   */
  static saveSession(session: Session): boolean {
    try {
      const sessionData: StoredSessionData = {
        session,
        timestamp: Date.now(),
        expiresAt: session.expires_at || 0,
        version: this.VERSION
      }
      
      const serialized = JSON.stringify(sessionData)
      
      // ✅ PRIMARY: Save to localStorage
      try {
        localStorage.setItem(this.SESSION_KEY, serialized)
        console.log('✅ [SessionStorage] Session saved to localStorage')
      } catch (error) {
        console.warn('⚠️ [SessionStorage] localStorage save failed:', error)
      }
      
      // ✅ BACKUP: Save to sessionStorage
      try {
        sessionStorage.setItem(this.BACKUP_KEY, serialized)
        console.log('✅ [SessionStorage] Session backup saved to sessionStorage')
      } catch (error) {
        console.warn('⚠️ [SessionStorage] sessionStorage save failed:', error)
      }
      
      return true
    } catch (error) {
      console.error('❌ [SessionStorage] Failed to save session:', error)
      return false
    }
  }

  /**
   * ✅ ENHANCED: Get session with validation and fallbacks
   */
  static getSession(): Session | null {
    try {
      // ✅ TRY PRIMARY: localStorage first
      let stored = this.getFromStorage(localStorage, this.SESSION_KEY)
      
      // ✅ TRY BACKUP: sessionStorage if localStorage fails
      if (!stored) {
        stored = this.getFromStorage(sessionStorage, this.BACKUP_KEY)
      }
      
      if (!stored) {
        console.log('ℹ️ [SessionStorage] No stored session found')
        return null
      }

      const sessionData: StoredSessionData = JSON.parse(stored)
      
      // ✅ VALIDATE: Check version compatibility
      if (sessionData.version !== this.VERSION) {
        console.warn('⚠️ [SessionStorage] Session version mismatch, clearing')
        this.clearSession()
        return null
      }

      // ✅ VALIDATE: Check if session is expired
      if (sessionData.expiresAt && new Date(sessionData.expiresAt * 1000) < new Date()) {
        console.log('ℹ️ [SessionStorage] Stored session expired, clearing')
        this.clearSession()
        return null
      }

      // ✅ VALIDATE: Check if stored data is too old (24 hours)
      const maxAge = 24 * 60 * 60 * 1000 // 24 hours
      if (Date.now() - sessionData.timestamp > maxAge) {
        console.log('ℹ️ [SessionStorage] Stored session too old, clearing')
        this.clearSession()
        return null
      }

      console.log('✅ [SessionStorage] Valid session retrieved from storage')
      return sessionData.session
    } catch (error) {
      console.error('❌ [SessionStorage] Failed to get session:', error)
      this.clearSession() // Clear corrupted data
      return null
    }
  }

  /**
   * ✅ HELPER: Get data from specific storage with error handling
   */
  private static getFromStorage(storage: Storage, key: string): string | null {
    try {
      return storage.getItem(key)
    } catch (error) {
      console.warn(`⚠️ [SessionStorage] Failed to read from ${storage === localStorage ? 'localStorage' : 'sessionStorage'}:`, error)
      return null
    }
  }

  /**
   * ✅ ENHANCED: Clear session from all storage locations
   */
  static clearSession(): void {
    try {
      // Clear from localStorage
      try {
        localStorage.removeItem(this.SESSION_KEY)
        console.log('✅ [SessionStorage] Cleared from localStorage')
      } catch (error) {
        console.warn('⚠️ [SessionStorage] Failed to clear localStorage:', error)
      }
      
      // Clear from sessionStorage
      try {
        sessionStorage.removeItem(this.BACKUP_KEY)
        console.log('✅ [SessionStorage] Cleared from sessionStorage')
      } catch (error) {
        console.warn('⚠️ [SessionStorage] Failed to clear sessionStorage:', error)
      }
    } catch (error) {
      console.error('❌ [SessionStorage] Failed to clear session:', error)
    }
  }

  /**
   * ✅ UTILITY: Check if session storage is available
   */
  static isStorageAvailable(): { localStorage: boolean; sessionStorage: boolean } {
    return {
      localStorage: this.testStorage(localStorage),
      sessionStorage: this.testStorage(sessionStorage)
    }
  }

  /**
   * ✅ HELPER: Test if storage is available and working
   */
  private static testStorage(storage: Storage): boolean {
    try {
      const testKey = '__storage_test__'
      storage.setItem(testKey, 'test')
      storage.removeItem(testKey)
      return true
    } catch (error) {
      return false
    }
  }

  /**
   * ✅ UTILITY: Get session info without returning the actual session
   */
  static getSessionInfo(): {
    hasSession: boolean
    expiresAt: Date | null
    timeRemaining: number
    isExpired: boolean
  } {
    try {
      const stored = this.getFromStorage(localStorage, this.SESSION_KEY) || 
                    this.getFromStorage(sessionStorage, this.BACKUP_KEY)
      
      if (!stored) {
        return {
          hasSession: false,
          expiresAt: null,
          timeRemaining: 0,
          isExpired: false
        }
      }

      const sessionData: StoredSessionData = JSON.parse(stored)
      const expiresAt = sessionData.expiresAt ? new Date(sessionData.expiresAt * 1000) : null
      const now = new Date()
      const isExpired = expiresAt ? now >= expiresAt : false
      const timeRemaining = expiresAt ? Math.max(0, expiresAt.getTime() - now.getTime()) : 0

      return {
        hasSession: true,
        expiresAt,
        timeRemaining,
        isExpired
      }
    } catch (error) {
      console.error('❌ [SessionStorage] Failed to get session info:', error)
      return {
        hasSession: false,
        expiresAt: null,
        timeRemaining: 0,
        isExpired: false
      }
    }
  }

  /**
   * ✅ UTILITY: Validate stored session without side effects
   */
  static validateStoredSession(): {
    isValid: boolean
    reason?: string
    expiresAt?: Date
  } {
    try {
      const stored = this.getFromStorage(localStorage, this.SESSION_KEY) || 
                    this.getFromStorage(sessionStorage, this.BACKUP_KEY)
      
      if (!stored) {
        return { isValid: false, reason: 'No stored session' }
      }

      const sessionData: StoredSessionData = JSON.parse(stored)
      
      // Check version
      if (sessionData.version !== this.VERSION) {
        return { isValid: false, reason: 'Version mismatch' }
      }

      // Check expiry
      const expiresAt = new Date(sessionData.expiresAt * 1000)
      if (expiresAt < new Date()) {
        return { isValid: false, reason: 'Session expired', expiresAt }
      }

      // Check age
      const maxAge = 24 * 60 * 60 * 1000 // 24 hours
      if (Date.now() - sessionData.timestamp > maxAge) {
        return { isValid: false, reason: 'Session too old' }
      }

      return { isValid: true, expiresAt }
    } catch (error) {
      return { isValid: false, reason: 'Parse error' }
    }
  }

  /**
   * ✅ DEBUG: Get storage statistics
   */
  static getStorageStats(): {
    localStorage: { available: boolean; hasSession: boolean; size?: number }
    sessionStorage: { available: boolean; hasSession: boolean; size?: number }
  } {
    const getStorageInfo = (storage: Storage, key: string) => {
      const available = this.testStorage(storage)
      if (!available) return { available: false, hasSession: false }
      
      try {
        const data = storage.getItem(key)
        return {
          available: true,
          hasSession: !!data,
          size: data ? data.length : 0
        }
      } catch {
        return { available: false, hasSession: false }
      }
    }

    return {
      localStorage: getStorageInfo(localStorage, this.SESSION_KEY),
      sessionStorage: getStorageInfo(sessionStorage, this.BACKUP_KEY)
    }
  }
}

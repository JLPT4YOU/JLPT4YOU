/**
 * ✅ ENHANCED SESSION STORAGE UTILITY
 * Provides backup session storage with fallbacks and validation
 * Features: localStorage + sessionStorage backup, expiry validation, error handling
 */

import { Session } from '@supabase/supabase-js'
import { logger } from './logger'

interface SessionStorageData {
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
      const sessionData: SessionStorageData = {
        session,
        timestamp: Date.now(),
        expiresAt: session.expires_at || 0,
        version: this.VERSION
      }
      
      const serialized = JSON.stringify(sessionData)
      
      // ✅ PRIMARY: Save to localStorage
      try {
        localStorage.setItem(this.SESSION_KEY, serialized)
      } catch (error) {
        logger.warn('localStorage save failed', error, 'SESSION')
      }
      
      // ✅ BACKUP: Save to sessionStorage
      try {
        sessionStorage.setItem(this.BACKUP_KEY, serialized)
      } catch (error) {
        logger.warn('sessionStorage save failed', error, 'SESSION')
      }
      
      return true
    } catch (error) {
      logger.error('Failed to save session', error, 'SESSION')
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
        return null
      }

      const sessionData: SessionStorageData = JSON.parse(stored)
      
      // ✅ VALIDATE: Check version compatibility
      if (sessionData.version !== this.VERSION) {
        logger.warn('Session version mismatch, clearing', null, 'SESSION')
        this.clearSession()
        return null
      }

      // ✅ VALIDATE: Check if session is expired
      if (sessionData.expiresAt && new Date(sessionData.expiresAt * 1000) < new Date()) {
        this.clearSession()
        return null
      }

      // ✅ VALIDATE: Check if stored data is too old (24 hours)
      const maxAge = 24 * 60 * 60 * 1000 // 24 hours
      if (Date.now() - sessionData.timestamp > maxAge) {
        this.clearSession()
        return null
      }

      return sessionData.session
    } catch (error) {
      logger.error('Failed to get session', error, 'SESSION')
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
      logger.warn(`Failed to read from ${storage === localStorage ? 'localStorage' : 'sessionStorage'}`, error, 'SESSION')
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
        logger.debug('Cleared from localStorage')
      } catch (error) {
        logger.warn('Failed to clear localStorage', error, 'SESSION')
      }
      
      // Clear from sessionStorage
      try {
        sessionStorage.removeItem(this.BACKUP_KEY)
        logger.debug('Cleared from sessionStorage')
      } catch (error) {
        logger.warn('Failed to clear sessionStorage', error, 'SESSION')
      }
    } catch (error) {
      logger.error('Failed to clear session', error, 'SESSION')
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

      const sessionData: SessionStorageData = JSON.parse(stored)
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
      logger.error('Failed to get session info', error, 'SESSION')
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

      const sessionData: SessionStorageData = JSON.parse(stored)
      
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

/**
 * User-specific localStorage management
 * Prevents data conflicts between different user accounts
 */

import { STORAGE_KEYS } from '@/lib/constants'

export class UserStorage {
  private static currentUserId: string | null = null

  /**
   * Set current user ID for scoped storage
   */
  static setCurrentUser(userId: string) {
    this.currentUserId = userId
  }

  /**
   * Clear current user
   */
  static clearCurrentUser() {
    this.currentUserId = null
  }

  /**
   * Get user-scoped storage key
   */
  private static getUserKey(key: string): string {
    if (!this.currentUserId) {
      return key // Fallback to global key if no user set
    }
    return `${key}_user_${this.currentUserId}`
  }

  /**
   * Set user-scoped localStorage item
   */
  static setItem(key: string, value: string): void {
    try {
      const userKey = this.getUserKey(key)
      localStorage.setItem(userKey, value)
    } catch (error) {
      console.error('Failed to set localStorage item:', error)
    }
  }

  /**
   * Get user-scoped localStorage item
   */
  static getItem(key: string): string | null {
    try {
      const userKey = this.getUserKey(key)
      return localStorage.getItem(userKey)
    } catch (error) {
      console.error('Failed to get localStorage item:', error)
      return null
    }
  }

  /**
   * Remove user-scoped localStorage item
   */
  static removeItem(key: string): void {
    try {
      const userKey = this.getUserKey(key)
      localStorage.removeItem(userKey)
    } catch (error) {
      console.error('Failed to remove localStorage item:', error)
    }
  }

  /**
   * Set user-scoped JSON data
   */
  static setJSON<T>(key: string, data: T): void {
    try {
      const jsonString = JSON.stringify(data)
      this.setItem(key, jsonString)
    } catch (error) {
      console.error('Failed to set JSON data:', error)
    }
  }

  /**
   * Get user-scoped JSON data
   */
  static getJSON<T>(key: string, defaultValue?: T): T | null {
    try {
      const jsonString = this.getItem(key)
      if (jsonString === null) {
        return defaultValue || null
      }
      return JSON.parse(jsonString)
    } catch (error) {
      console.error('Failed to get JSON data:', error)
      return defaultValue || null
    }
  }

  /**
   * Clear all data for current user
   */
  static clearUserData(): void {
    if (!this.currentUserId) {
      console.warn('No current user set, cannot clear user data')
      return
    }

    try {
      const userPrefix = `_user_${this.currentUserId}`
      const keysToRemove: string[] = []

      // Find all keys belonging to current user
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.includes(userPrefix)) {
          keysToRemove.push(key)
        }
      }

      // Remove all user-specific keys
      keysToRemove.forEach(key => {
        localStorage.removeItem(key)
      })


    } catch (error) {
      console.error('Failed to clear user data:', error)
    }
  }

  /**
   * Clear data for specific user (useful for logout)
   */
  static clearDataForUser(userId: string): void {
    try {
      const userPrefix = `_user_${userId}`
      const keysToRemove: string[] = []

      // Find all keys belonging to specified user
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.includes(userPrefix)) {
          keysToRemove.push(key)
        }
      }

      // Remove all user-specific keys
      keysToRemove.forEach(key => {
        localStorage.removeItem(key)
      })


    } catch (error) {
      console.error(`Failed to clear data for user ${userId}:`, error)
    }
  }

  /**
   * Clear all app data (for logout)
   */
  static clearAllAppData(): void {
    try {
      const appPrefixes = [
        'jlpt4you_',
        'exam-state-',
        'timer-state-',
        'violations-',
        'irin_sensei_',
        'landing-scroll-position',
        'fullscreen-state',
        'anti-cheat-warnings',
        'chat_history_user_',
        'current_chat_id_user_',
        'selected_model_user_',
        'enable_thinking_user_',
        'ai_language_user_',
        'ai_custom_language_user_',
        'chat_backup_'
      ]

      const keysToRemove: string[] = []

      // Find all app-related keys (including user-scoped keys)
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && (
          appPrefixes.some(prefix => key.startsWith(prefix)) ||
          key.includes('_user_') // Catch any user-scoped keys
        )) {
          keysToRemove.push(key)
        }
      }

      // Remove all app-related keys
      keysToRemove.forEach(key => {
        localStorage.removeItem(key)
      })



    } catch (error) {
      console.error('Failed to clear app data:', error)
      // Fallback: clear everything
      try {
        localStorage.clear()

      } catch (clearError) {
        console.error('Failed to force clear localStorage:', clearError)
      }
    }
  }

  /**
   * Get storage usage info
   */
  static getStorageInfo(): {
    totalKeys: number
    userKeys: number
    appKeys: number
    otherKeys: number
  } {
    const info = {
      totalKeys: localStorage.length,
      userKeys: 0,
      appKeys: 0,
      otherKeys: 0
    }

    try {
      const userPrefix = this.currentUserId ? `_user_${this.currentUserId}` : null
      const appPrefixes = ['jlpt4you_', 'exam-state-', 'timer-state-', 'violations-', 'irin_sensei_']

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (!key) continue

        if (userPrefix && key.includes(userPrefix)) {
          info.userKeys++
        } else if (appPrefixes.some(prefix => key.startsWith(prefix))) {
          info.appKeys++
        } else {
          info.otherKeys++
        }
      }
    } catch (error) {
      console.error('Failed to get storage info:', error)
    }

    return info
  }
}

/**
 * Convenience functions for common storage operations
 */
export const userStorage = {
  // User progress
  setUserProgress: (progress: any) => UserStorage.setJSON(STORAGE_KEYS.USER_PROGRESS, progress),
  getUserProgress: () => UserStorage.getJSON(STORAGE_KEYS.USER_PROGRESS),
  
  // Study settings
  setStudySettings: (settings: any) => UserStorage.setJSON(STORAGE_KEYS.STUDY_SETTINGS, settings),
  getStudySettings: () => UserStorage.getJSON(STORAGE_KEYS.STUDY_SETTINGS),
  
  // Theme (global, not user-specific)
  setTheme: (theme: string) => localStorage.setItem(STORAGE_KEYS.THEME, theme),
  getTheme: () => localStorage.getItem(STORAGE_KEYS.THEME),
  
  // User data (auth-related)
  setUserData: (userData: any) => localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData)),
  getUserData: () => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USER_DATA)
      return data ? JSON.parse(data) : null
    } catch {
      return null
    }
  }
}

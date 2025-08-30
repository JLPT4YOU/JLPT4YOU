/**
 * API Key Service - Server-side encrypted key management
 * Provides methods to retrieve API keys from server for AI providers
 */

import { decrypt } from './crypto-utils'

const SECRET = process.env.APP_ENCRYPT_SECRET || ''

// Type definitions
type Provider = 'gemini' | 'groq'

interface CachedKey {
  key: string
  timestamp: number
}

interface KeyCache {
  [userId: string]: {
    [provider in Provider]?: CachedKey
  }
}

interface UserApiKeyRow {
  key_encrypted: string  // Sửa từ key_cipher thành key_encrypted
}

interface ApiKeyResponse {
  key: string
}

// In-memory cache for decrypted keys (5 minute TTL)
const keyCache: KeyCache = {}
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export class ApiKeyService {
  /**
   * Get decrypted API key for a user and provider
   * Uses caching to avoid repeated decryption
   */
  static async getApiKey(userId: string, provider: Provider): Promise<string | null> {
    // Check cache first
    const cached = keyCache[userId]?.[provider]
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.key
    }

    try {
      // Import supabaseAdmin here to avoid circular dependencies
      const { supabaseAdmin } = await import('@/utils/supabase/admin')

      if (!supabaseAdmin) {
        console.error('Supabase admin client not available')
        return null
      }

      // Query user_api_keys table (table not in current types, using safe assertion)
      const result = await (supabaseAdmin as any)
        .from('user_api_keys')
        .select('key_encrypted')
        .eq('user_id', userId)
        .eq('provider', provider)
        .single()

      const { data, error } = result as { data: UserApiKeyRow | null; error: any }

      if (error || !data) {
        return null
      }

      // Decrypt the key using AES-256-GCM
      const decryptedKey = decrypt(data.key_encrypted, SECRET)

      // Cache the result
      if (!keyCache[userId]) {
        keyCache[userId] = {}
      }
      keyCache[userId][provider] = {
        key: decryptedKey,
        timestamp: Date.now()
      }

      return decryptedKey
    } catch (error) {
      console.error('Error retrieving API key:', error)
      return null
    }
  }

  /**
   * Clear cache for a user (useful after key updates)
   */
  static clearCache(userId: string, provider?: Provider) {
    if (provider && keyCache[userId]) {
      delete keyCache[userId][provider]
    } else {
      delete keyCache[userId]
    }
  }

  /**
   * Get API key for current authenticated user (client-side helper)
   */
  static async getClientApiKey(provider: Provider): Promise<string | null> {
    try {
      const res = await fetch(`/api/user/keys/${provider}/decrypt`)
      if (res.ok) {
        const data = await res.json() as ApiKeyResponse
        return data.key
      }
      return null
    } catch (error) {
      console.error('Error fetching client API key:', error)
      return null
    }
  }
}

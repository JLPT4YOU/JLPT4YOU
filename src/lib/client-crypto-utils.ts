/**
 * Client-side Crypto Utilities
 * Mã hóa API keys ở phía client trước khi gửi lên server
 * Sử dụng Web Crypto API để đảm bảo API key không bao giờ visible trong network
 */

// Constants for encryption
const ALGORITHM = 'AES-GCM'
const KEY_LENGTH = 256
const IV_LENGTH = 12
const ITERATIONS = 100000
const SALT = 'jlpt4you_client_encryption_salt_2025'

/**
 * Derive encryption key từ user context
 */
async function deriveUserKey(userId: string, email: string): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  
  // Combine user factors để tạo unique key
  const keyMaterial = userId + '|' + email + '|' + SALT
  const keyData = encoder.encode(keyMaterial)
  
  // Import key material
  const importedKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  )
  
  // Derive actual encryption key
  const derivedKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode(SALT),
      iterations: ITERATIONS,
      hash: 'SHA-256'
    },
    importedKey,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  )
  
  return derivedKey
}

/**
 * Encrypt API key ở client-side trước khi gửi lên server
 */
export async function encryptApiKeyForTransport(
  apiKey: string, 
  userId: string, 
  email: string
): Promise<string> {
  try {
    const encoder = new TextEncoder()
    const key = await deriveUserKey(userId, email)
    
    // Generate random IV
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))
    
    // Encrypt the API key
    const encrypted = await crypto.subtle.encrypt(
      { name: ALGORITHM, iv },
      key,
      encoder.encode(apiKey)
    )
    
    // Combine IV + encrypted data
    const combined = new Uint8Array(iv.length + encrypted.byteLength)
    combined.set(iv)
    combined.set(new Uint8Array(encrypted), iv.length)
    
    // Return base64 encoded result
    return btoa(String.fromCharCode(...combined))
  } catch (error) {
    console.error('Client-side encryption failed:', error)
    throw new Error('Failed to encrypt API key')
  }
}

/**
 * Decrypt API key ở server-side (để verify hoặc re-encrypt)
 */
export async function decryptApiKeyFromTransport(
  encryptedData: string,
  userId: string,
  email: string
): Promise<string> {
  try {
    const decoder = new TextDecoder()
    const key = await deriveUserKey(userId, email)
    
    // Decode base64
    const combined = new Uint8Array(
      atob(encryptedData).split('').map(char => char.charCodeAt(0))
    )
    
    // Extract IV and encrypted data
    const iv = combined.slice(0, IV_LENGTH)
    const encrypted = combined.slice(IV_LENGTH)
    
    // Decrypt
    const decrypted = await crypto.subtle.decrypt(
      { name: ALGORITHM, iv },
      key,
      encrypted
    )
    
    return decoder.decode(decrypted)
  } catch (error) {
    console.error('Client-side decryption failed:', error)
    throw new Error('Failed to decrypt API key')
  }
}

/**
 * Check if Web Crypto API is available
 */
export function isWebCryptoSupported(): boolean {
  return typeof crypto !== 'undefined' && 
         typeof crypto.subtle !== 'undefined' &&
         typeof crypto.subtle.encrypt === 'function'
}

/**
 * Generate a secure random string for fallback scenarios
 */
export function generateSecureToken(length: number = 32): string {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint8Array(length)
    crypto.getRandomValues(array)
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
  }
  
  // Fallback for environments without crypto
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15)
}

/**
 * Validate API key format before encryption
 */
export function validateApiKeyFormat(apiKey: string, provider: 'gemini' | 'groq'): boolean {
  if (!apiKey || typeof apiKey !== 'string') {
    return false
  }
  
  switch (provider) {
    case 'gemini':
      return apiKey.startsWith('AIza') && apiKey.length > 20
    case 'groq':
      return apiKey.startsWith('gsk_') && apiKey.length > 20
    default:
      return false
  }
}

/**
 * Secure memory cleanup (best effort)
 */
export function secureCleanup(sensitiveString: string): void {
  // Note: JavaScript không có true secure memory cleanup
  // Nhưng chúng ta có thể overwrite variable
  if (typeof sensitiveString === 'string') {
    // Overwrite với random data
    const randomData = generateSecureToken(sensitiveString.length)
    // This is symbolic - JS strings are immutable
    console.debug('Secure cleanup attempted for sensitive data')
  }
}

/**
 * Create encrypted payload for API transmission
 */
export async function createSecureApiPayload(
  apiKey: string,
  provider: 'gemini' | 'groq',
  userId: string,
  email: string
): Promise<{
  encryptedKey: string
  provider: string
  timestamp: number
  checksum: string
}> {
  // Validate input
  if (!validateApiKeyFormat(apiKey, provider)) {
    throw new Error(`Invalid ${provider} API key format`)
  }
  
  if (!isWebCryptoSupported()) {
    throw new Error('Web Crypto API not supported in this environment')
  }
  
  // Encrypt the API key
  const encryptedKey = await encryptApiKeyForTransport(apiKey, userId, email)
  
  // Create timestamp
  const timestamp = Date.now()
  
  // Create checksum để verify integrity
  const checksumData = `${provider}|${userId}|${timestamp}|${encryptedKey.substring(0, 20)}`
  const checksumBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(checksumData))
  const checksum = btoa(String.fromCharCode(...new Uint8Array(checksumBuffer))).substring(0, 16)
  
  return {
    encryptedKey,
    provider,
    timestamp,
    checksum
  }
}

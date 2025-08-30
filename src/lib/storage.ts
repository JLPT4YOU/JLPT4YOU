/**
 * Supabase Storage utilities for file management
 */

import { createClient } from '@/utils/supabase/client'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// ✅ FIXED: Create supabase client instance
const supabase = createClient()

export interface UploadResult {
  url: string
  path: string
  size: number
}

export interface UploadError {
  message: string
  code?: string
}

/**
 * Upload file to Supabase Storage
 */
export async function uploadFile(
  bucket: string,
  file: File,
  path?: string
): Promise<UploadResult> {
  try {
    // Generate unique filename if path not provided
    const fileName = path || `${Date.now()}-${file.name}`
    
    // Upload file
    await supabase.storage
      .from(bucket)
      .upload(fileName, file, {
        upsert: true,
        contentType: file.type
      });

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName)

    return {
      url: urlData.publicUrl,
      path: fileName,
      size: file.size
    }
  } catch (error) {
    console.error('File upload error:', error)
    throw error
  }
}

/**
 * Upload PDF file specifically for books using service role
 */
export async function uploadBookPDF(file: File): Promise<UploadResult> {
  // Validate file type
  if (file.type !== 'application/pdf') {
    throw new Error('Only PDF files are allowed')
  }

  // Validate file size (max 50MB)
  const maxSize = 50 * 1024 * 1024 // 50MB
  if (file.size > maxSize) {
    throw new Error('File size must be less than 50MB')
  }

  // Generate path with timestamp and sanitized filename
  const timestamp = Date.now()
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
  const path = `books/${timestamp}-${sanitizedName}`

  // Use service role client for upload to bypass RLS
  const supabaseAdmin = createSupabaseClient( // ✅ FIXED: Use imported createSupabaseClient
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    // Upload file using service role
    await supabaseAdmin.storage
      .from('books')
      .upload(path, file, {
        upsert: true,
        contentType: file.type
      });

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('books')
      .getPublicUrl(path)

    return {
      url: urlData.publicUrl,
      path: path,
      size: file.size
    }
  } catch (error) {
    console.error('File upload error:', error)
    throw error
  }
}

/**
 * Delete file from Supabase Storage using service role
 */
export async function deleteFile(bucket: string, path: string): Promise<void> {
  try {
    // Use service role client for deletion to bypass RLS
    const supabaseAdmin = createSupabaseClient( // ✅ FIXED: Use imported createSupabaseClient
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .remove([path])

    if (error) {
      throw new Error(`Delete failed: ${error.message}`)
    }
  } catch (error) {
    console.error('File delete error:', error)
    throw error
  }
}

/**
 * Get file URL from Supabase Storage
 */
export function getFileUrl(bucket: string, path: string): string {
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path)

  return data.publicUrl
}

/**
 * Extract file path from Supabase Storage URL
 */
export function extractPathFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url)
    const pathParts = urlObj.pathname.split('/')
    const bucketIndex = pathParts.findIndex(part => part === 'books')
    
    if (bucketIndex !== -1 && bucketIndex < pathParts.length - 1) {
      return pathParts.slice(bucketIndex + 1).join('/')
    }
    
    return null
  } catch {
    return null
  }
}

/**
 * Validate file before upload
 */
export function validateFile(file: File, options: {
  maxSize?: number
  allowedTypes?: string[]
} = {}): { valid: boolean; error?: string } {
  const { maxSize = 50 * 1024 * 1024, allowedTypes = ['application/pdf'] } = options

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} is not allowed. Allowed types: ${allowedTypes.join(', ')}`
    }
  }

  if (file.size > maxSize) {
    const maxSizeMB = Math.round(maxSize / (1024 * 1024))
    return {
      valid: false,
      error: `File size must be less than ${maxSizeMB}MB`
    }
  }

  return { valid: true }
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

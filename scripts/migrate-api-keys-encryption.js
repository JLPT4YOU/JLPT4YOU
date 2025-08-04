#!/usr/bin/env node

/**
 * Migration Script: Convert API Keys from PGP to AES-256-GCM
 * 
 * This script migrates existing API keys from Supabase PGP encryption
 * to centralized AES-256-GCM encryption using APP_ENCRYPT_SECRET
 */

const { createClient } = require('@supabase/supabase-js')
const crypto = require('crypto')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const APP_ENCRYPT_SECRET = process.env.APP_ENCRYPT_SECRET

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !APP_ENCRYPT_SECRET) {
  console.error('❌ Missing required environment variables:')
  console.error('- NEXT_PUBLIC_SUPABASE_URL')
  console.error('- SUPABASE_SERVICE_ROLE_KEY') 
  console.error('- APP_ENCRYPT_SECRET')
  process.exit(1)
}

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// AES-256-GCM encryption functions
const ALGO = 'aes-256-gcm'
const IV_LENGTH = 12

function encrypt(text, secret) {
  const iv = crypto.randomBytes(IV_LENGTH)
  const key = Buffer.from(secret, 'utf-8').subarray(0, 32)
  
  const cipher = crypto.createCipheriv(ALGO, key, iv)
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  
  return Buffer.concat([iv, tag, encrypted]).toString('base64')
}

function decrypt(enc, secret) {
  const buf = Buffer.from(enc, 'base64')
  const iv = buf.subarray(0, IV_LENGTH)
  const tag = buf.subarray(IV_LENGTH, IV_LENGTH + 16)
  const encryptedText = buf.subarray(IV_LENGTH + 16)
  const key = Buffer.from(secret, 'utf-8').subarray(0, 32)
  
  const decipher = crypto.createDecipheriv(ALGO, key, iv)
  decipher.setAuthTag(tag)
  const decrypted = Buffer.concat([decipher.update(encryptedText), decipher.final()])
  return decrypted.toString('utf8')
}

async function migrateApiKeys() {
  console.log('🔄 Starting API Keys encryption migration...')
  console.log('📋 Converting from PGP to AES-256-GCM encryption\n')

  try {
    // 1. Get all existing API keys
    const { data: apiKeys, error: fetchError } = await supabase
      .from('user_api_keys')
      .select('id, user_id, provider, key_encrypted')

    if (fetchError) {
      throw new Error(`Failed to fetch API keys: ${fetchError.message}`)
    }

    if (!apiKeys || apiKeys.length === 0) {
      console.log('✅ No API keys found to migrate')
      return
    }

    console.log(`📊 Found ${apiKeys.length} API keys to migrate`)

    let successCount = 0
    let errorCount = 0

    // 2. Process each API key
    for (const apiKey of apiKeys) {
      try {
        console.log(`🔄 Processing ${apiKey.provider} key for user ${apiKey.user_id.substring(0, 8)}...`)

        // Generate user-specific secret (old method)
        const userSecret = `jlpt4you_${apiKey.user_id}_api_key_secret`

        // Decrypt using PGP (old method)
        const { data: decryptedKey, error: decryptError } = await supabase.rpc(
          'decrypt_api_key',
          {
            encrypted_key: apiKey.key_encrypted,
            user_secret: userSecret
          }
        )

        if (decryptError || !decryptedKey) {
          console.error(`❌ Failed to decrypt ${apiKey.provider} key: ${decryptError?.message || 'No data returned'}`)
          errorCount++
          continue
        }

        // Encrypt using AES-256-GCM (new method)
        const newEncryptedKey = encrypt(decryptedKey, APP_ENCRYPT_SECRET)

        // Update the record
        const { error: updateError } = await supabase
          .from('user_api_keys')
          .update({ key_encrypted: newEncryptedKey })
          .eq('id', apiKey.id)

        if (updateError) {
          console.error(`❌ Failed to update ${apiKey.provider} key: ${updateError.message}`)
          errorCount++
          continue
        }

        console.log(`✅ Successfully migrated ${apiKey.provider} key`)
        successCount++

      } catch (error) {
        console.error(`❌ Error processing key ${apiKey.id}: ${error.message}`)
        errorCount++
      }
    }

    // 3. Summary
    console.log('\n📊 Migration Summary:')
    console.log(`✅ Successfully migrated: ${successCount} keys`)
    console.log(`❌ Failed to migrate: ${errorCount} keys`)
    console.log(`📋 Total processed: ${apiKeys.length} keys`)

    if (errorCount === 0) {
      console.log('\n🎉 Migration completed successfully!')
      console.log('🔐 All API keys are now encrypted with AES-256-GCM')
    } else {
      console.log('\n⚠️  Migration completed with some errors')
      console.log('Please check the error messages above and retry if needed')
    }

  } catch (error) {
    console.error('💥 Migration failed:', error.message)
    process.exit(1)
  }
}

// Run migration
migrateApiKeys()

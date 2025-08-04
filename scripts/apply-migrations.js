#!/usr/bin/env node

/**
 * Apply database migrations to Supabase
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing required environment variables:')
  console.error('- NEXT_PUBLIC_SUPABASE_URL')
  console.error('- SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function applyMigration(migrationPath) {
  try {
    console.log(`📄 Applying migration: ${path.basename(migrationPath)}`)
    
    const sql = fs.readFileSync(migrationPath, 'utf8')
    
    // Split SQL by semicolons and execute each statement
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0)
    
    for (const statement of statements) {
      if (statement.trim()) {
        const { error } = await supabase.rpc('exec_sql', { sql: statement })
        if (error) {
          console.error(`❌ Error executing statement: ${statement.substring(0, 100)}...`)
          console.error(error)
          throw error
        }
      }
    }
    
    console.log(`✅ Migration applied successfully: ${path.basename(migrationPath)}`)
    return true
  } catch (error) {
    console.error(`❌ Failed to apply migration: ${path.basename(migrationPath)}`)
    console.error(error)
    return false
  }
}

async function main() {
  console.log('🚀 Starting database migration...')
  
  const migrationsDir = path.join(__dirname, '../database/migrations')
  
  if (!fs.existsSync(migrationsDir)) {
    console.error('❌ Migrations directory not found:', migrationsDir)
    process.exit(1)
  }
  
  const migrationFiles = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort()
  
  if (migrationFiles.length === 0) {
    console.log('📝 No migration files found')
    return
  }
  
  console.log(`📋 Found ${migrationFiles.length} migration(s):`)
  migrationFiles.forEach(file => console.log(`   - ${file}`))
  console.log('')
  
  let successCount = 0
  
  for (const file of migrationFiles) {
    const migrationPath = path.join(migrationsDir, file)
    const success = await applyMigration(migrationPath)
    if (success) {
      successCount++
    } else {
      console.log('❌ Stopping migration process due to error')
      break
    }
  }
  
  console.log('')
  console.log(`📊 Migration Summary:`)
  console.log(`   ✅ Successful: ${successCount}`)
  console.log(`   ❌ Failed: ${migrationFiles.length - successCount}`)
  
  if (successCount === migrationFiles.length) {
    console.log('🎉 All migrations applied successfully!')
  } else {
    console.log('⚠️  Some migrations failed. Please check the errors above.')
    process.exit(1)
  }
}

// Create exec_sql function if it doesn't exist
async function createExecSqlFunction() {
  const functionSql = `
    CREATE OR REPLACE FUNCTION exec_sql(sql text)
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN
      EXECUTE sql;
    END;
    $$;
  `
  
  try {
    const { error } = await supabase.rpc('exec_sql', { sql: functionSql })
    if (error && !error.message.includes('already exists')) {
      // Try direct execution
      const { error: directError } = await supabase.from('_').select('*').limit(0)
      // This will fail, but we can use the connection to execute raw SQL
    }
  } catch (err) {
    // Function creation might fail, but that's okay for now
    console.log('⚠️  Note: exec_sql function creation skipped')
  }
}

// Run the migration
main().catch(error => {
  console.error('❌ Migration failed:', error)
  process.exit(1)
})

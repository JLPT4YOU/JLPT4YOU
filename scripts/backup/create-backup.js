#!/usr/bin/env node

/**
 * JLPT4YOU Supabase SQL Backup Tool
 * Tạo backup SQL cho database Supabase
 *
 * Usage:
 * npm run backup:create
 * npm run backup:create -- --schema-only
 * npm run backup:create -- --data-only
 * npm run backup:create -- --tables=users,exam_results
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs').promises
const path = require('path')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

class SupabaseBackupTool {
  constructor() {
    this.supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    this.supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!this.supabaseUrl || !this.supabaseServiceKey) {
      throw new Error('❌ Missing Supabase environment variables')
    }
    
    this.supabase = createClient(this.supabaseUrl, this.supabaseServiceKey)
    this.backupDir = path.join(process.cwd(), 'backups')
    this.timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + '_' + 
                     new Date().toISOString().replace(/[:.]/g, '-').split('T')[1].split('.')[0]
  }

  /**
   * Tạo thư mục backup nếu chưa tồn tại
   */
  async ensureBackupDir() {
    try {
      await fs.access(this.backupDir)
    } catch {
      await fs.mkdir(this.backupDir, { recursive: true })
      console.log(`📁 Created backup directory: ${this.backupDir}`)
    }
  }

  /**
   * Lấy danh sách tất cả tables trong public schema
   */
  async getTables() {
    try {
      // Try using RPC function first
      const { data: rpcData, error: rpcError } = await this.supabase.rpc('get_table_names')

      if (!rpcError && rpcData) {
        return rpcData
      }
    } catch (error) {
      // RPC function doesn't exist, continue with fallback
    }

    try {
      // Fallback: Use information_schema via raw SQL
      const { data, error } = await this.supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .eq('table_type', 'BASE TABLE')

      if (!error && data) {
        return data.map(row => row.table_name)
      }
    } catch (error) {
      // information_schema might not be accessible
    }

    // Final fallback: Use known table names from schema
    const knownTables = ['users', 'exam_results', 'user_progress', 'study_sessions', 'user_api_keys', 'ai_models']
    console.log('⚠️ Using fallback table list:', knownTables.join(', '))

    // Verify which tables actually exist
    const existingTables = []
    for (const tableName of knownTables) {
      try {
        const { error } = await this.supabase
          .from(tableName)
          .select('*')
          .limit(1)

        if (!error) {
          existingTables.push(tableName)
        }
      } catch (error) {
        // Table doesn't exist or no access
      }
    }

    return existingTables
  }

  /**
   * Backup schema (structure only)
   */
  async backupSchema(format = 'sql') {
    console.log('📋 Backing up database schema...')

    try {
      const tableNames = await this.getTables()
      return await this.backupSchemaSQL(tableNames)

    } catch (error) {
      console.error('❌ Schema backup failed:', error.message)
      throw error
    }
  }

  /**
   * Backup schema as SQL
   */
  async backupSchemaSQL(tableNames) {
    console.log('🔧 Generating SQL schema backup...')

    let sqlContent = `-- JLPT4YOU Database Schema Backup
-- Generated: ${new Date().toISOString()}
-- Tables: ${tableNames.join(', ')}

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE user_role AS ENUM ('Free', 'Premium', 'Admin');
CREATE TYPE exam_type AS ENUM ('JLPT', 'CHALLENGE', 'DRIVING');
CREATE TYPE exam_mode AS ENUM ('practice', 'challenge', 'official');

`

    // Add table structures (basic recreation)
    for (const tableName of tableNames) {
      try {
        const tableSQL = await this.generateTableSQL(tableName)
        sqlContent += tableSQL + '\n\n'
      } catch (error) {
        console.warn(`⚠️ Could not generate SQL for table ${tableName}: ${error.message}`)
        sqlContent += `-- Could not generate structure for table: ${tableName}\n-- Error: ${error.message}\n\n`
      }
    }

    // Add common functions and triggers
    sqlContent += this.getCommonFunctionsSQL()

    const schemaFile = path.join(this.backupDir, `schema_${this.timestamp}.sql`)
    await fs.writeFile(schemaFile, sqlContent)
    console.log(`✅ SQL Schema backup saved: ${schemaFile}`)
    return schemaFile
  }

  /**
   * Generate SQL for a specific table
   */
  async generateTableSQL(tableName) {
    // Get sample data to infer column types
    const { data: sampleData, error } = await this.supabase
      .from(tableName)
      .select('*')
      .limit(1)

    if (error) {
      throw new Error(`Cannot access table ${tableName}: ${error.message}`)
    }

    if (!sampleData || sampleData.length === 0) {
      return `-- Table ${tableName} is empty, cannot infer structure
-- CREATE TABLE ${tableName} (...);`
    }

    const sample = sampleData[0]
    const columns = Object.keys(sample).map(col => {
      const value = sample[col]
      const sqlType = this.inferSQLType(value, col)
      return `    ${col} ${sqlType}`
    }).join(',\n')

    return `-- Table: ${tableName}
CREATE TABLE IF NOT EXISTS public.${tableName} (
${columns}
);`
  }

  /**
   * Infer SQL type from JavaScript value
   */
  inferSQLType(value, columnName) {
    if (value === null || value === undefined) {
      // Common column patterns
      if (columnName.includes('id')) return 'UUID'
      if (columnName.includes('email')) return 'TEXT'
      if (columnName.includes('created_at') || columnName.includes('updated_at')) return 'TIMESTAMPTZ'
      if (columnName.includes('progress')) return 'INTEGER'
      return 'TEXT'
    }

    if (typeof value === 'string') {
      if (value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) return 'TIMESTAMPTZ'
      if (value.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) return 'UUID'
      if (value.includes('@')) return 'TEXT' // Email
      return 'TEXT'
    }

    if (typeof value === 'number') {
      if (Number.isInteger(value)) return 'INTEGER'
      return 'DECIMAL(10,2)'
    }

    if (typeof value === 'boolean') return 'BOOLEAN'
    if (Array.isArray(value)) return 'JSONB'
    if (typeof value === 'object') return 'JSONB'

    return 'TEXT'
  }

  /**
   * Get common functions and triggers SQL
   */
  getCommonFunctionsSQL() {
    return `-- Common functions and triggers

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, name, display_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name'),
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name'),
        NEW.raw_user_meta_data->>'avatar_url'
    );

    -- Create initial progress record
    INSERT INTO public.user_progress (user_id)
    VALUES (NEW.id);

    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers (add these manually after table creation)
-- CREATE TRIGGER on_auth_user_created
--     AFTER INSERT ON auth.users
--     FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- CREATE TRIGGER update_users_updated_at
--     BEFORE UPDATE ON public.users
--     FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Row Level Security policies (add these manually)
-- ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Users can view own profile" ON public.users FOR SELECT USING (auth.uid() = id);
-- CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

`
  }



  /**
   * Backup tất cả data
   */
  async backupData(specificTables = null, format = 'sql') {
    console.log('💾 Backing up database data...')

    try {
      const tables = specificTables || await this.getTables()
      return await this.backupDataSQL(tables)

    } catch (error) {
      console.error('❌ Data backup failed:', error.message)
      throw error
    }
  }

  /**
   * Backup data as SQL INSERT statements
   */
  async backupDataSQL(tables) {
    console.log('🔧 Generating SQL data backup...')

    let sqlContent = `-- JLPT4YOU Database Data Backup
-- Generated: ${new Date().toISOString()}
-- Tables: ${tables.join(', ')}

-- Disable triggers during import (optional)
-- SET session_replication_role = replica;

`

    let totalRows = 0

    for (const tableName of tables) {
      try {
        const { data, error } = await this.supabase
          .from(tableName)
          .select('*')

        if (error) {
          console.warn(`⚠️ Could not backup table ${tableName}: ${error.message}`)
          sqlContent += `-- Could not backup table: ${tableName}\n-- Error: ${error.message}\n\n`
          continue
        }

        if (!data || data.length === 0) {
          sqlContent += `-- Table ${tableName} is empty\n\n`
          continue
        }

        console.log(`📊 Converting table ${tableName} to SQL (${data.length} rows)`)

        // Generate INSERT statements
        sqlContent += `-- Data for table: ${tableName}\n`
        sqlContent += `DELETE FROM public.${tableName}; -- Clear existing data\n`

        const columns = Object.keys(data[0])
        const columnsList = columns.join(', ')

        // Split into batches to avoid huge INSERT statements
        const batchSize = 50
        for (let i = 0; i < data.length; i += batchSize) {
          const batch = data.slice(i, i + batchSize)

          sqlContent += `INSERT INTO public.${tableName} (${columnsList}) VALUES\n`

          const values = batch.map(row => {
            const rowValues = columns.map(col => this.formatSQLValue(row[col])).join(', ')
            return `    (${rowValues})`
          }).join(',\n')

          sqlContent += values + ';\n\n'
        }

        totalRows += data.length

      } catch (error) {
        console.warn(`⚠️ Error backing up table ${tableName}: ${error.message}`)
        sqlContent += `-- Error backing up table: ${tableName}\n-- ${error.message}\n\n`
      }
    }

    sqlContent += `-- Re-enable triggers (optional)
-- SET session_replication_role = DEFAULT;

-- Backup completed
-- Total rows: ${totalRows}
-- Generated: ${new Date().toISOString()}
`

    const dataFile = path.join(this.backupDir, `data_${this.timestamp}.sql`)
    await fs.writeFile(dataFile, sqlContent)

    console.log(`✅ SQL Data backup saved: ${dataFile}`)
    console.log(`📊 Total tables: ${tables.length}, Total rows: ${totalRows}`)

    return dataFile
  }

  /**
   * Format JavaScript value for SQL
   */
  formatSQLValue(value) {
    if (value === null || value === undefined) {
      return 'NULL'
    }

    if (typeof value === 'string') {
      // Escape single quotes and wrap in quotes
      return `'${value.replace(/'/g, "''")}'`
    }

    if (typeof value === 'number') {
      return value.toString()
    }

    if (typeof value === 'boolean') {
      return value ? 'true' : 'false'
    }

    if (Array.isArray(value) || typeof value === 'object') {
      // Convert to JSON string
      return `'${JSON.stringify(value).replace(/'/g, "''")}'`
    }

    return `'${String(value).replace(/'/g, "''")}'`
  }

  /**
   * Tạo backup hoàn chỉnh
   */
  async createFullBackup(options = {}) {
    const {
      schemaOnly = false,
      dataOnly = false,
      tables = null,
      format = 'sql'
    } = options

    console.log('🚀 Starting Supabase SQL backup...')
    console.log(`📅 Timestamp: ${this.timestamp}`)

    await this.ensureBackupDir()

    const results = {
      timestamp: this.timestamp,
      format: 'sql',
      files: []
    }

    try {
      if (!dataOnly) {
        const schemaFile = await this.backupSchema(format)
        results.files.push(schemaFile)
      }

      if (!schemaOnly) {
        const specificTables = tables ? tables.split(',').map(t => t.trim()) : null
        const dataFile = await this.backupData(specificTables, format)
        results.files.push(dataFile)
      }

      // Tạo manifest file (luôn là JSON)
      const manifestFile = path.join(this.backupDir, `manifest_${this.timestamp}.json`)
      await fs.writeFile(manifestFile, JSON.stringify(results, null, 2))
      results.files.push(manifestFile)

      console.log('\n🎉 SQL Backup completed successfully!')
      console.log('📁 Files created:')
      results.files.forEach(file => console.log(`   - ${path.basename(file)}`))

      console.log('\n💡 SQL Backup Notes:')
      console.log('   - Schema file contains CREATE TABLE statements')
      console.log('   - Data file contains INSERT statements')
      console.log('   - Run schema file first, then data file')
      console.log('   - Review and modify as needed before executing')

      return results

    } catch (error) {
      console.error('\n❌ Backup failed:', error.message)
      throw error
    }
  }
}

// CLI execution
async function main() {
  try {
    const args = process.argv.slice(2)
    const options = {}

    // Parse command line arguments
    args.forEach(arg => {
      if (arg === '--schema-only') options.schemaOnly = true
      if (arg === '--data-only') options.dataOnly = true
      if (arg.startsWith('--tables=')) options.tables = arg.split('=')[1]
    })

    // Always use SQL format
    options.format = 'sql'

    const backupTool = new SupabaseBackupTool()
    await backupTool.createFullBackup(options)

  } catch (error) {
    console.error('❌ Backup tool error:', error.message)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  main()
}

module.exports = { SupabaseBackupTool }

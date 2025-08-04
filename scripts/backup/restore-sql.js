#!/usr/bin/env node

/**
 * JLPT4YOU SQL Restore Tool
 * Hiển thị và hướng dẫn restore từ SQL backup files
 *
 * Usage:
 * npm run backup:restore -- --schema=schema_2025-01-24_10-30-00.sql
 * npm run backup:restore -- --data=data_2025-01-24_10-30-00.sql
 * npm run backup:restore -- --full=2025-01-24_10-30-00
 * npm run backup:restore -- --show=schema_2025-01-24_10-30-00.sql
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs').promises
const path = require('path')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

class SQLRestoreTool {
  constructor() {
    this.supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    this.supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!this.supabaseUrl || !this.supabaseServiceKey) {
      throw new Error('❌ Missing Supabase environment variables')
    }
    
    this.supabase = createClient(this.supabaseUrl, this.supabaseServiceKey)
    this.backupDir = path.join(process.cwd(), 'backups')
  }

  /**
   * Đọc và parse SQL file
   */
  async readSQLFile(filename) {
    const filePath = path.join(this.backupDir, filename)
    
    try {
      const content = await fs.readFile(filePath, 'utf8')
      return content
    } catch (error) {
      throw new Error(`Cannot read SQL file: ${error.message}`)
    }
  }

  /**
   * Tách SQL content thành các statements riêng biệt
   */
  parseSQLStatements(sqlContent) {
    // Remove comments and split by semicolon
    const statements = sqlContent
      .split('\n')
      .filter(line => !line.trim().startsWith('--') && line.trim() !== '')
      .join('\n')
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0)

    return statements
  }

  /**
   * Execute một SQL statement
   */
  async executeSQLStatement(statement) {
    try {
      const { data, error } = await this.supabase.rpc('exec_sql', { 
        sql_query: statement 
      })
      
      if (error) {
        // Fallback: try direct execution for simple statements
        if (statement.toUpperCase().startsWith('INSERT INTO')) {
          return await this.executeInsertStatement(statement)
        }
        throw new Error(error.message)
      }
      
      return { success: true, data }
    } catch (error) {
      throw new Error(`SQL execution failed: ${error.message}`)
    }
  }

  /**
   * Execute INSERT statement using Supabase client
   */
  async executeInsertStatement(statement) {
    try {
      // Parse INSERT statement to extract table and values
      const insertMatch = statement.match(/INSERT INTO (?:public\.)?(\w+)\s*\((.*?)\)\s*VALUES\s*(.*)/is)
      
      if (!insertMatch) {
        throw new Error('Cannot parse INSERT statement')
      }

      const tableName = insertMatch[1]
      const columns = insertMatch[2].split(',').map(col => col.trim())
      const valuesSection = insertMatch[3]

      // Parse values (simplified - may need more robust parsing)
      const valueRows = this.parseInsertValues(valuesSection)
      
      // Convert to objects
      const records = valueRows.map(row => {
        const record = {}
        columns.forEach((col, index) => {
          record[col] = this.parseSQLValue(row[index])
        })
        return record
      })

      // Insert using Supabase client
      const { data, error } = await this.supabase
        .from(tableName)
        .insert(records)

      if (error) {
        throw new Error(error.message)
      }

      return { success: true, data, rowCount: records.length }
    } catch (error) {
      throw new Error(`INSERT execution failed: ${error.message}`)
    }
  }

  /**
   * Parse INSERT VALUES section
   */
  parseInsertValues(valuesSection) {
    // This is a simplified parser - may need enhancement for complex cases
    const rows = []
    let currentRow = []
    let inQuotes = false
    let currentValue = ''
    let parenLevel = 0

    for (let i = 0; i < valuesSection.length; i++) {
      const char = valuesSection[i]
      
      if (char === "'" && valuesSection[i-1] !== '\\') {
        inQuotes = !inQuotes
        currentValue += char
      } else if (!inQuotes) {
        if (char === '(') {
          parenLevel++
          if (parenLevel === 1) continue // Skip opening paren
        } else if (char === ')') {
          parenLevel--
          if (parenLevel === 0) {
            // End of row
            if (currentValue.trim()) {
              currentRow.push(currentValue.trim())
            }
            rows.push(currentRow)
            currentRow = []
            currentValue = ''
            continue
          }
        } else if (char === ',' && parenLevel === 1) {
          // End of value
          currentRow.push(currentValue.trim())
          currentValue = ''
          continue
        }
        currentValue += char
      } else {
        currentValue += char
      }
    }

    return rows
  }

  /**
   * Parse SQL value to JavaScript value
   */
  parseSQLValue(sqlValue) {
    const trimmed = sqlValue.trim()
    
    if (trimmed === 'NULL') return null
    if (trimmed === 'true') return true
    if (trimmed === 'false') return false
    
    // String value
    if (trimmed.startsWith("'") && trimmed.endsWith("'")) {
      return trimmed.slice(1, -1).replace(/''/g, "'")
    }
    
    // Number
    if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
      return parseFloat(trimmed)
    }
    
    return trimmed
  }

  /**
   * Hiển thị SQL content và hướng dẫn restore
   */
  async showSQLContent(filename) {
    console.log(`📄 SQL Content: ${filename}`)

    try {
      const sqlContent = await this.readSQLFile(filename)
      const statements = this.parseSQLStatements(sqlContent)

      console.log(`📋 Found ${statements.length} SQL statements`)
      console.log('\n📄 SQL Content:')
      console.log('=' * 80)
      console.log(sqlContent)
      console.log('=' * 80)

      console.log('\n💡 Manual Restore Instructions:')
      console.log('1. Copy the SQL content above')
      console.log('2. Go to Supabase Dashboard > SQL Editor')
      console.log('3. Paste and execute the SQL statements')
      console.log('4. Review any errors and fix manually')

      return { success: true, statements: statements.length }

    } catch (error) {
      console.error('❌ Failed to read SQL file:', error.message)
      throw error
    }
  }

  /**
   * Restore schema từ SQL file (manual instructions)
   */
  async restoreSchema(filename) {
    console.log(`🏗️ Schema Restore Instructions: ${filename}`)

    try {
      const sqlContent = await this.readSQLFile(filename)
      const statements = this.parseSQLStatements(sqlContent)

      console.log(`📋 Found ${statements.length} SQL statements`)

      console.log('\n🔧 Manual Schema Restore Steps:')
      console.log('1. Open Supabase Dashboard')
      console.log('2. Go to SQL Editor')
      console.log('3. Copy and paste the following SQL:')
      console.log('\n' + '='.repeat(80))
      console.log(sqlContent)
      console.log('='.repeat(80))

      console.log('\n4. Execute the SQL statements')
      console.log('5. Check for any errors and resolve manually')
      console.log('\n⚠️ Note: Review the SQL before executing!')

      return { success: true, statements: statements.length }

    } catch (error) {
      console.error('❌ Schema restore failed:', error.message)
      throw error
    }
  }

  /**
   * Restore data từ SQL file (manual instructions)
   */
  async restoreData(filename) {
    console.log(`💾 Data Restore Instructions: ${filename}`)

    try {
      const sqlContent = await this.readSQLFile(filename)
      const statements = this.parseSQLStatements(sqlContent)

      // Filter only INSERT and DELETE statements
      const dataStatements = statements.filter(stmt => {
        const upper = stmt.toUpperCase()
        return upper.startsWith('INSERT') || upper.startsWith('DELETE')
      })

      console.log(`📊 Found ${dataStatements.length} data statements`)

      console.log('\n💾 Manual Data Restore Steps:')
      console.log('1. Open Supabase Dashboard')
      console.log('2. Go to SQL Editor')
      console.log('3. Copy and paste the following SQL:')
      console.log('\n' + '='.repeat(80))
      console.log(sqlContent)
      console.log('='.repeat(80))

      console.log('\n4. Execute the SQL statements')
      console.log('5. Check for any errors and resolve manually')
      console.log('\n⚠️ Warning: This will DELETE existing data first!')
      console.log('💡 Tip: Review the DELETE statements before executing')

      return { success: true, statements: dataStatements.length }

    } catch (error) {
      console.error('❌ Data restore failed:', error.message)
      throw error
    }
  }

  /**
   * Restore toàn bộ từ timestamp
   */
  async restoreFull(timestamp) {
    console.log(`🔄 Full restore from timestamp: ${timestamp}`)
    
    const schemaFile = `schema_${timestamp}.sql`
    const dataFile = `data_${timestamp}.sql`
    
    try {
      // Check if files exist
      const schemaPath = path.join(this.backupDir, schemaFile)
      const dataPath = path.join(this.backupDir, dataFile)
      
      try {
        await fs.access(schemaPath)
      } catch {
        throw new Error(`Schema file not found: ${schemaFile}`)
      }
      
      try {
        await fs.access(dataPath)
      } catch {
        throw new Error(`Data file not found: ${dataFile}`)
      }
      
      // Restore schema first
      console.log('📋 Step 1: Restoring schema...')
      const schemaResult = await this.restoreSchema(schemaFile)
      
      // Then restore data
      console.log('\n💾 Step 2: Restoring data...')
      const dataResult = await this.restoreData(dataFile)
      
      console.log('\n🎉 Full restore completed!')
      console.log(`📊 Summary:`)
      console.log(`   Schema: ${schemaResult.successCount} success, ${schemaResult.errorCount} errors`)
      console.log(`   Data: ${dataResult.successCount} success, ${dataResult.errorCount} errors, ${dataResult.totalRows} rows`)
      
      return {
        success: true,
        schema: schemaResult,
        data: dataResult
      }
      
    } catch (error) {
      console.error('❌ Full restore failed:', error.message)
      throw error
    }
  }
}

// CLI execution
async function main() {
  try {
    const args = process.argv.slice(2)
    let schemaFile = null
    let dataFile = null
    let timestamp = null
    let showFile = null

    // Parse command line arguments
    args.forEach(arg => {
      if (arg.startsWith('--schema=')) schemaFile = arg.split('=')[1]
      if (arg.startsWith('--data=')) dataFile = arg.split('=')[1]
      if (arg.startsWith('--full=')) timestamp = arg.split('=')[1]
      if (arg.startsWith('--show=')) showFile = arg.split('=')[1]
    })

    const restoreTool = new SQLRestoreTool()

    if (showFile) {
      await restoreTool.showSQLContent(showFile)
    } else if (timestamp) {
      await restoreTool.restoreFull(timestamp)
    } else if (schemaFile) {
      await restoreTool.restoreSchema(schemaFile)
    } else if (dataFile) {
      await restoreTool.restoreData(dataFile)
    } else {
      console.log('🗃️ JLPT4YOU SQL Restore Tool\n')
      console.log('Usage:')
      console.log('  npm run backup:restore -- --schema=schema_2025-01-24_10-30-00.sql')
      console.log('  npm run backup:restore -- --data=data_2025-01-24_10-30-00.sql')
      console.log('  npm run backup:restore -- --full=2025-01-24_10-30-00')
      console.log('  npm run backup:restore -- --show=schema_2025-01-24_10-30-00.sql')
      console.log('\n💡 Note: This tool provides manual restore instructions')
      console.log('   SQL files need to be executed manually in Supabase Dashboard')
    }

  } catch (error) {
    console.error('❌ SQL restore tool error:', error.message)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  main()
}

module.exports = { SQLRestoreTool }

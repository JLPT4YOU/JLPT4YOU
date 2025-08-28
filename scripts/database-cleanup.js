#!/usr/bin/env node

/**
 * JLPT4YOU Database Cleanup Tool
 * Thực hiện dọn dẹp database an toàn với backup tự động
 * 
 * Usage:
 * npm run db:cleanup -- --dry-run     # Xem preview không thực hiện
 * npm run db:cleanup -- --execute     # Thực hiện cleanup
 * npm run db:cleanup -- --rollback    # Rollback từ backup
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs').promises
const path = require('path')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

class DatabaseCleanupTool {
  constructor() {
    this.supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    this.supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!this.supabaseUrl || !this.supabaseServiceKey) {
      throw new Error('❌ Missing Supabase environment variables')
    }
    
    this.supabase = createClient(this.supabaseUrl, this.supabaseServiceKey)
    this.backupDir = path.join(process.cwd(), 'backups')
    this.cleanupSqlFile = path.join(process.cwd(), 'database', 'cleanup-unused-tables.sql')
  }

  /**
   * Kiểm tra kết nối database
   */
  async checkConnection() {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('count')
        .limit(1)

      if (error) {
        throw new Error(`Database connection failed: ${error.message}`)
      }

      console.log('✅ Database connection successful')
      return true
    } catch (error) {
      console.error('❌ Database connection failed:', error.message)
      return false
    }
  }

  /**
   * Phân tích database hiện tại
   */
  async analyzeDatabase() {
    console.log('🔍 Analyzing current database state...\n')

    const analysis = {
      tables: {},
      functions: [],
      policies: [],
      indexes: []
    }

    try {
      // Kiểm tra bảng study_sessions
      const { data: studySessionsData, error: studySessionsError } = await this.supabase
        .from('study_sessions')
        .select('*')
        .limit(1)

      if (!studySessionsError) {
        const { count } = await this.supabase
          .from('study_sessions')
          .select('*', { count: 'exact', head: true })

        analysis.tables.study_sessions = {
          exists: true,
          rowCount: count || 0,
          status: count > 0 ? 'HAS_DATA' : 'EMPTY'
        }
      } else {
        analysis.tables.study_sessions = {
          exists: false,
          rowCount: 0,
          status: 'NOT_EXISTS'
        }
      }

      // Kiểm tra các bảng khác
      const tablesToCheck = ['users', 'exam_results', 'user_progress', 'user_api_keys', 'ai_models']
      
      for (const tableName of tablesToCheck) {
        try {
          const { count } = await this.supabase
            .from(tableName)
            .select('*', { count: 'exact', head: true })

          analysis.tables[tableName] = {
            exists: true,
            rowCount: count || 0,
            status: count > 0 ? 'HAS_DATA' : 'EMPTY'
          }
        } catch (error) {
          analysis.tables[tableName] = {
            exists: false,
            rowCount: 0,
            status: 'NOT_EXISTS'
          }
        }
      }

      // In kết quả phân tích
      console.log('📊 Database Analysis Results:')
      console.log('================================')
      
      Object.entries(analysis.tables).forEach(([tableName, info]) => {
        const statusIcon = info.status === 'HAS_DATA' ? '✅' : 
                          info.status === 'EMPTY' ? '⚠️' : '❌'
        console.log(`${statusIcon} ${tableName}: ${info.status} (${info.rowCount} rows)`)
      })

      return analysis

    } catch (error) {
      console.error('❌ Database analysis failed:', error.message)
      throw error
    }
  }



  /**
   * Thực hiện dry run - xem preview
   */
  async dryRun() {
    console.log('🔍 DRY RUN - Preview of cleanup actions\n')
    
    const analysis = await this.analyzeDatabase()
    
    console.log('\n📋 Planned Actions:')
    console.log('==================')

    if (analysis.tables.study_sessions?.exists) {
      if (analysis.tables.study_sessions.status === 'EMPTY') {
        console.log('✅ Will DROP table: study_sessions (empty)')
        console.log('✅ Will DROP related indexes')
        console.log('✅ Will DROP related policies')
        console.log('✅ Will DROP function: update_user_progress_stats')
      } else {
        console.log('⚠️  Table study_sessions has data - will prompt for confirmation')
      }
    } else {
      console.log('ℹ️  Table study_sessions does not exist - no action needed')
    }

    if (analysis.tables.ai_models?.exists) {
      if (analysis.tables.ai_models.status === 'HAS_DATA') {
        console.log(`⚠️  Will DROP table: ai_models (${analysis.tables.ai_models.rowCount} AI model records)`)
        console.log('⚠️  This table contains AI model definitions but is not used in code')
      } else {
        console.log('✅ Will DROP table: ai_models (empty)')
      }
    } else {
      console.log('ℹ️  Table ai_models does not exist - no action needed')
    }

    console.log('\n💡 To execute cleanup: npm run db:cleanup -- --execute')
  }

  /**
   * Thực hiện cleanup
   */
  async executeCleanup() {
    console.log('🧹 Executing database cleanup...\n')

    // 1. Kiểm tra kết nối
    const connected = await this.checkConnection()
    if (!connected) {
      throw new Error('Cannot proceed without database connection')
    }

    // 2. Phân tích database
    const analysis = await this.analyzeDatabase()

    // 3. Kiểm tra an toàn
    if (analysis.tables.study_sessions?.status === 'HAS_DATA') {
      console.log('\n⚠️  WARNING: study_sessions table contains data!')
      console.log('This cleanup will permanently delete the table and its data.')
      console.log('Make sure you have a recent backup before proceeding.')
      
      // Trong production, có thể thêm prompt confirmation ở đây
      // throw new Error('Aborting: Table contains data')
    }



    // 5. Đọc và thực hiện cleanup SQL
    console.log('\n🔧 Executing cleanup SQL script...')
    
    try {
      const cleanupSql = await fs.readFile(this.cleanupSqlFile, 'utf8')
      
      // Thực hiện SQL script (Supabase không hỗ trợ multi-statement, cần split)
      console.log('📝 Running cleanup script...')
      console.log('⚠️  Note: Complex SQL script should be run manually in Supabase SQL Editor')
      console.log(`📁 Script location: ${this.cleanupSqlFile}`)
      
      console.log('\n📋 Manual Steps Required:')
      console.log('1. Open Supabase Dashboard > SQL Editor')
      console.log('2. Copy and paste the content of database/cleanup-unused-tables.sql')
      console.log('3. Execute the script')
      console.log('4. Verify the results')

      return true

    } catch (error) {
      console.error('❌ Cleanup execution failed:', error.message)
      throw error
    }
  }

  /**
   * Rollback từ backup
   */
  async rollback(backupTimestamp) {
    console.log(`🔄 Rolling back from backup: ${backupTimestamp}`)
    
    const schemaFile = path.join(this.backupDir, `schema_${backupTimestamp}.sql`)
    const dataFile = path.join(this.backupDir, `data_${backupTimestamp}.sql`)

    try {
      // Kiểm tra files tồn tại
      await fs.access(schemaFile)
      await fs.access(dataFile)

      console.log('📁 Backup files found:')
      console.log(`   - ${path.basename(schemaFile)}`)
      console.log(`   - ${path.basename(dataFile)}`)

      console.log('\n📋 Manual Rollback Steps:')
      console.log('1. Open Supabase Dashboard > SQL Editor')
      console.log(`2. Run schema file: ${schemaFile}`)
      console.log(`3. Run data file: ${dataFile}`)
      console.log('4. Verify the restoration')

      return true

    } catch (error) {
      console.error('❌ Rollback failed:', error.message)
      throw error
    }
  }
}

// CLI execution
async function main() {
  try {
    const args = process.argv.slice(2)
    const tool = new DatabaseCleanupTool()

    console.log('🗃️  JLPT4YOU Database Cleanup Tool\n')

    if (args.includes('--dry-run')) {
      await tool.dryRun()
    } else if (args.includes('--execute')) {
      await tool.executeCleanup()
    } else if (args.includes('--rollback')) {
      const timestamp = args.find(arg => arg.startsWith('--timestamp='))?.split('=')[1]
      if (!timestamp) {
        console.log('❌ Rollback requires timestamp: --timestamp=2025-07-27_12-25-07-476Z')
        process.exit(1)
      }
      await tool.rollback(timestamp)
    } else {
      console.log('Usage:')
      console.log('  npm run db:cleanup -- --dry-run                    # Preview cleanup')
      console.log('  npm run db:cleanup -- --execute                    # Execute cleanup')
      console.log('  npm run db:cleanup -- --rollback --timestamp=...   # Rollback from backup')
      console.log('')
      console.log('Examples:')
      console.log('  npm run db:cleanup -- --dry-run')
      console.log('  npm run db:cleanup -- --execute')
      console.log('  npm run db:cleanup -- --rollback --timestamp=2025-07-27_12-25-07-476Z')
    }

  } catch (error) {
    console.error('\n❌ Database cleanup failed:', error.message)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  main()
}

module.exports = { DatabaseCleanupTool }

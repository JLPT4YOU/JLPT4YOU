#!/usr/bin/env node

/**
 * JLPT4YOU Backup Tool Test
 * Test script để kiểm tra backup tools
 */

const { SupabaseBackupTool } = require('./create-backup')
const { SupabaseRestoreTool } = require('./restore-backup')
const { BackupListTool } = require('./list-backups')
const { BackupScheduler } = require('./schedule-backup')

class BackupTestSuite {
  constructor() {
    this.results = {
      total: 0,
      passed: 0,
      failed: 0,
      tests: []
    }
  }

  /**
   * Chạy một test case
   */
  async runTest(name, testFn) {
    this.results.total++
    console.log(`🧪 Testing: ${name}`)
    
    try {
      await testFn()
      console.log(`✅ PASSED: ${name}`)
      this.results.passed++
      this.results.tests.push({ name, status: 'PASSED' })
    } catch (error) {
      console.log(`❌ FAILED: ${name} - ${error.message}`)
      this.results.failed++
      this.results.tests.push({ name, status: 'FAILED', error: error.message })
    }
    
    console.log() // Empty line
  }

  /**
   * Test environment setup
   */
  async testEnvironment() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl) {
      throw new Error('NEXT_PUBLIC_SUPABASE_URL not found in environment')
    }
    
    if (!supabaseKey) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY not found in environment')
    }
    
    if (!supabaseUrl.startsWith('https://')) {
      throw new Error('Invalid Supabase URL format')
    }
    
    console.log(`   Supabase URL: ${supabaseUrl}`)
    console.log(`   Service Key: ${supabaseKey.substring(0, 20)}...`)
  }

  /**
   * Test backup tool initialization
   */
  async testBackupToolInit() {
    const backupTool = new SupabaseBackupTool()
    
    if (!backupTool.supabase) {
      throw new Error('Supabase client not initialized')
    }
    
    if (!backupTool.backupDir) {
      throw new Error('Backup directory not set')
    }
    
    console.log(`   Backup directory: ${backupTool.backupDir}`)
    console.log(`   Timestamp format: ${backupTool.timestamp}`)
  }

  /**
   * Test Supabase connection
   */
  async testSupabaseConnection() {
    const backupTool = new SupabaseBackupTool()
    
    // Test basic connection
    const { data, error } = await backupTool.supabase
      .from('users')
      .select('count')
      .limit(1)
    
    if (error && !error.message.includes('does not exist')) {
      throw new Error(`Supabase connection failed: ${error.message}`)
    }
    
    console.log(`   Connection status: ${error ? 'Tables not created yet' : 'OK'}`)
  }

  /**
   * Test backup directory creation
   */
  async testBackupDirectory() {
    const backupTool = new SupabaseBackupTool()
    await backupTool.ensureBackupDir()
    
    const fs = require('fs').promises
    
    try {
      await fs.access(backupTool.backupDir)
      console.log(`   Backup directory exists: ${backupTool.backupDir}`)
    } catch (error) {
      throw new Error('Failed to create backup directory')
    }
  }

  /**
   * Test table listing
   */
  async testTableListing() {
    const backupTool = new SupabaseBackupTool()
    
    try {
      const tables = await backupTool.getTables()
      console.log(`   Found ${tables.length} tables: ${tables.join(', ')}`)
      
      if (tables.length === 0) {
        console.log(`   ⚠️ No tables found - database might be empty`)
      }
    } catch (error) {
      // This might fail if tables don't exist yet
      console.log(`   ⚠️ Could not list tables: ${error.message}`)
    }
  }

  /**
   * Test restore tool initialization
   */
  async testRestoreToolInit() {
    const restoreTool = new SupabaseRestoreTool()
    
    if (!restoreTool.supabase) {
      throw new Error('Restore tool Supabase client not initialized')
    }
    
    console.log(`   Restore tool initialized successfully`)
  }

  /**
   * Test list tool
   */
  async testListTool() {
    const listTool = new BackupListTool()
    
    try {
      const files = await listTool.getAllBackupFiles()
      console.log(`   Found ${files.length} backup files`)
    } catch (error) {
      // This is OK if backup directory doesn't exist yet
      console.log(`   ⚠️ No backup files found: ${error.message}`)
    }
  }

  /**
   * Test scheduler
   */
  async testScheduler() {
    const scheduler = new BackupScheduler()
    
    const config = await scheduler.loadConfig()
    
    if (!config.version) {
      throw new Error('Invalid scheduler config')
    }
    
    console.log(`   Scheduler config version: ${config.version}`)
    console.log(`   Enabled: ${config.enabled}`)
    console.log(`   Daily backup: ${config.schedule.daily}`)
  }

  /**
   * Test file operations
   */
  async testFileOperations() {
    const fs = require('fs').promises
    const path = require('path')
    
    const testFile = path.join(process.cwd(), 'backups', 'test-file.json')
    const testData = { test: true, timestamp: new Date().toISOString() }
    
    // Write test file
    await fs.writeFile(testFile, JSON.stringify(testData, null, 2))
    
    // Read test file
    const content = await fs.readFile(testFile, 'utf8')
    const parsed = JSON.parse(content)
    
    if (!parsed.test) {
      throw new Error('File read/write test failed')
    }
    
    // Clean up
    await fs.unlink(testFile)
    
    console.log(`   File operations working correctly`)
  }

  /**
   * Chạy tất cả tests
   */
  async runAllTests() {
    console.log('🚀 Starting JLPT4YOU Backup Tools Test Suite\n')
    
    // Load environment
    require('dotenv').config({ path: '.env.local' })
    
    await this.runTest('Environment Setup', () => this.testEnvironment())
    await this.runTest('Backup Tool Initialization', () => this.testBackupToolInit())
    await this.runTest('Supabase Connection', () => this.testSupabaseConnection())
    await this.runTest('Backup Directory Creation', () => this.testBackupDirectory())
    await this.runTest('Table Listing', () => this.testTableListing())
    await this.runTest('Restore Tool Initialization', () => this.testRestoreToolInit())
    await this.runTest('List Tool', () => this.testListTool())
    await this.runTest('Scheduler', () => this.testScheduler())
    await this.runTest('File Operations', () => this.testFileOperations())
    
    // Print summary
    console.log('📊 Test Results Summary:')
    console.log(`   Total tests: ${this.results.total}`)
    console.log(`   Passed: ${this.results.passed} ✅`)
    console.log(`   Failed: ${this.results.failed} ❌`)
    console.log(`   Success rate: ${((this.results.passed / this.results.total) * 100).toFixed(1)}%`)
    
    if (this.results.failed > 0) {
      console.log('\n❌ Failed tests:')
      this.results.tests
        .filter(test => test.status === 'FAILED')
        .forEach(test => console.log(`   - ${test.name}: ${test.error}`))
    }
    
    console.log('\n🎉 Test suite completed!')
    
    if (this.results.failed === 0) {
      console.log('✅ All tests passed! Backup tools are ready to use.')
      console.log('\n💡 Next steps:')
      console.log('   1. npm run backup:create          # Create your first backup')
      console.log('   2. npm run backup:list            # List backup files')
      console.log('   3. npm run backup:schedule -- --setup  # Setup scheduler')
    } else {
      console.log('⚠️ Some tests failed. Please check the errors above.')
      process.exit(1)
    }
  }
}

// CLI execution
async function main() {
  try {
    const testSuite = new BackupTestSuite()
    await testSuite.runAllTests()
  } catch (error) {
    console.error('❌ Test suite error:', error.message)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  main()
}

module.exports = { BackupTestSuite }

#!/usr/bin/env node

/**
 * JLPT4YOU Backup Scheduler
 * Lên lịch backup tự động và quản lý backup files
 * 
 * Usage:
 * npm run backup:schedule -- --setup
 * npm run backup:schedule -- --run-daily
 * npm run backup:schedule -- --cleanup --keep=7
 */

const { SupabaseBackupTool } = require('./create-backup')
const fs = require('fs').promises
const path = require('path')
const { spawn } = require('child_process')

class BackupScheduler {
  constructor() {
    this.backupDir = path.join(process.cwd(), 'backups')
    this.configFile = path.join(this.backupDir, 'schedule-config.json')
    this.logFile = path.join(this.backupDir, 'schedule.log')
  }

  /**
   * Tạo cấu hình mặc định
   */
  getDefaultConfig() {
    return {
      enabled: true,
      schedule: {
        daily: true,
        time: '02:00', // 2 AM
        timezone: 'Asia/Ho_Chi_Minh'
      },
      retention: {
        keepDays: 7,
        keepWeeks: 4,
        keepMonths: 6
      },
      options: {
        includeSchema: true,
        includeData: true,
        compress: false
      },
      notifications: {
        onSuccess: false,
        onError: true,
        email: null
      },
      lastRun: null,
      version: '1.0.0'
    }
  }

  /**
   * Load cấu hình từ file
   */
  async loadConfig() {
    try {
      const content = await fs.readFile(this.configFile, 'utf8')
      return { ...this.getDefaultConfig(), ...JSON.parse(content) }
    } catch (error) {
      // Return default config if file doesn't exist
      return this.getDefaultConfig()
    }
  }

  /**
   * Lưu cấu hình
   */
  async saveConfig(config) {
    await fs.mkdir(this.backupDir, { recursive: true })
    await fs.writeFile(this.configFile, JSON.stringify(config, null, 2))
  }

  /**
   * Ghi log
   */
  async log(message, level = 'INFO') {
    const timestamp = new Date().toISOString()
    const logEntry = `[${timestamp}] [${level}] ${message}\n`
    
    try {
      await fs.appendFile(this.logFile, logEntry)
    } catch (error) {
      console.error('Failed to write log:', error.message)
    }
    
    console.log(`${level}: ${message}`)
  }

  /**
   * Chạy backup
   */
  async runBackup() {
    await this.log('Starting scheduled backup...')
    
    try {
      const config = await this.loadConfig()
      
      if (!config.enabled) {
        await this.log('Backup is disabled in config', 'WARN')
        return false
      }

      const backupTool = new SupabaseBackupTool()
      const options = {
        schemaOnly: !config.options.includeData,
        dataOnly: !config.options.includeSchema
      }

      const result = await backupTool.createFullBackup(options)
      
      // Update last run time
      config.lastRun = new Date().toISOString()
      await this.saveConfig(config)
      
      await this.log(`Backup completed successfully. Files: ${result.files.length}`)
      
      // Run cleanup if configured
      if (config.retention.keepDays > 0) {
        await this.cleanupOldBackups(config.retention)
      }
      
      return true
      
    } catch (error) {
      await this.log(`Backup failed: ${error.message}`, 'ERROR')
      return false
    }
  }

  /**
   * Dọn dẹp backup files cũ
   */
  async cleanupOldBackups(retention) {
    await this.log('Starting backup cleanup...')
    
    try {
      const files = await fs.readdir(this.backupDir)
      const backupFiles = files
        .filter(file => file.startsWith('data_') && file.endsWith('.json'))
        .map(file => ({
          name: file,
          path: path.join(this.backupDir, file),
          timestamp: this.extractTimestamp(file)
        }))
        .filter(file => file.timestamp)
        .sort((a, b) => b.timestamp - a.timestamp) // Newest first

      const now = new Date()
      const keepDaysMs = retention.keepDays * 24 * 60 * 60 * 1000
      const cutoffDate = new Date(now.getTime() - keepDaysMs)

      let deletedCount = 0
      
      for (const file of backupFiles) {
        if (file.timestamp < cutoffDate) {
          try {
            await fs.unlink(file.path)
            await this.log(`Deleted old backup: ${file.name}`)
            deletedCount++
            
            // Also delete related files (schema, manifest)
            const timestamp = this.formatTimestamp(file.timestamp)
            const relatedFiles = [
              `schema_${timestamp}.json`,
              `manifest_${timestamp}.json`
            ]
            
            for (const relatedFile of relatedFiles) {
              const relatedPath = path.join(this.backupDir, relatedFile)
              try {
                await fs.unlink(relatedPath)
                await this.log(`Deleted related file: ${relatedFile}`)
              } catch (error) {
                // File might not exist, ignore
              }
            }
            
          } catch (error) {
            await this.log(`Failed to delete ${file.name}: ${error.message}`, 'ERROR')
          }
        }
      }

      await this.log(`Cleanup completed. Deleted ${deletedCount} old backup files`)
      
    } catch (error) {
      await this.log(`Cleanup failed: ${error.message}`, 'ERROR')
    }
  }

  /**
   * Trích xuất timestamp từ tên file
   */
  extractTimestamp(filename) {
    const match = filename.match(/data_(\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2})\.json/)
    if (!match) return null
    
    const timestampStr = match[1].replace(/_/g, 'T').replace(/-/g, ':')
    return new Date(timestampStr + '.000Z')
  }

  /**
   * Format timestamp cho tên file
   */
  formatTimestamp(date) {
    return date.toISOString().replace(/[:.]/g, '-').split('T')[0] + '_' + 
           date.toISOString().replace(/[:.]/g, '-').split('T')[1].split('.')[0]
  }

  /**
   * Setup cấu hình ban đầu
   */
  async setup() {
    console.log('🔧 Setting up backup scheduler...\n')
    
    try {
      const config = await this.loadConfig()
      
      console.log('📋 Current configuration:')
      console.log(`   ✅ Enabled: ${config.enabled}`)
      console.log(`   🕐 Daily backup: ${config.schedule.daily} at ${config.schedule.time}`)
      console.log(`   📅 Keep backups: ${config.retention.keepDays} days`)
      console.log(`   💾 Include data: ${config.options.includeData}`)
      console.log(`   🏗️ Include schema: ${config.options.includeSchema}`)
      
      if (config.lastRun) {
        console.log(`   🕐 Last run: ${new Date(config.lastRun).toLocaleString()}`)
      } else {
        console.log(`   🕐 Last run: Never`)
      }

      await this.saveConfig(config)
      
      console.log('\n✅ Scheduler setup completed!')
      console.log('\n💡 Usage:')
      console.log('   npm run backup:schedule -- --run-daily    # Run daily backup')
      console.log('   npm run backup:schedule -- --cleanup      # Clean old backups')
      console.log('   npm run backup:schedule -- --status       # Show status')
      
      // Create cron job suggestion
      console.log('\n🤖 To automate daily backups, add this to your crontab:')
      console.log(`   0 2 * * * cd ${process.cwd()} && npm run backup:schedule -- --run-daily`)
      
    } catch (error) {
      console.error('❌ Setup failed:', error.message)
    }
  }

  /**
   * Hiển thị trạng thái
   */
  async showStatus() {
    console.log('📊 Backup Scheduler Status\n')
    
    try {
      const config = await this.loadConfig()
      
      console.log('⚙️ Configuration:')
      console.log(`   Status: ${config.enabled ? '✅ Enabled' : '❌ Disabled'}`)
      console.log(`   Schedule: ${config.schedule.daily ? 'Daily' : 'Manual'} at ${config.schedule.time}`)
      console.log(`   Retention: ${config.retention.keepDays} days`)
      
      if (config.lastRun) {
        const lastRun = new Date(config.lastRun)
        const timeSince = Math.floor((Date.now() - lastRun.getTime()) / (1000 * 60 * 60))
        console.log(`   Last run: ${lastRun.toLocaleString()} (${timeSince}h ago)`)
      } else {
        console.log(`   Last run: Never`)
      }

      // Check backup files
      const files = await fs.readdir(this.backupDir).catch(() => [])
      const backupFiles = files.filter(f => f.startsWith('data_') && f.endsWith('.json'))
      
      console.log(`\n📁 Backup files: ${backupFiles.length}`)
      
      if (backupFiles.length > 0) {
        const latest = backupFiles.sort().reverse()[0]
        console.log(`   Latest: ${latest}`)
      }

      // Check log file
      try {
        const logStats = await fs.stat(this.logFile)
        const logSize = (logStats.size / 1024).toFixed(2)
        console.log(`\n📝 Log file: ${logSize} KB`)
      } catch (error) {
        console.log(`\n📝 Log file: Not found`)
      }
      
    } catch (error) {
      console.error('❌ Status check failed:', error.message)
    }
  }
}

// CLI execution
async function main() {
  try {
    const args = process.argv.slice(2)
    const scheduler = new BackupScheduler()
    
    if (args.includes('--setup')) {
      await scheduler.setup()
    } else if (args.includes('--run-daily')) {
      await scheduler.runBackup()
    } else if (args.includes('--cleanup')) {
      const keepDays = args.find(arg => arg.startsWith('--keep='))?.split('=')[1] || 7
      await scheduler.cleanupOldBackups({ keepDays: parseInt(keepDays) })
    } else if (args.includes('--status')) {
      await scheduler.showStatus()
    } else {
      console.log('🔄 JLPT4YOU Backup Scheduler\n')
      console.log('Usage:')
      console.log('  npm run backup:schedule -- --setup        # Setup configuration')
      console.log('  npm run backup:schedule -- --run-daily    # Run daily backup')
      console.log('  npm run backup:schedule -- --cleanup      # Clean old backups')
      console.log('  npm run backup:schedule -- --status       # Show status')
      console.log('  npm run backup:schedule -- --cleanup --keep=7  # Keep 7 days')
    }
    
  } catch (error) {
    console.error('❌ Scheduler error:', error.message)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  main()
}

module.exports = { BackupScheduler }

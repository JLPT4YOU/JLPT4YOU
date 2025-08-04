#!/usr/bin/env node

/**
 * JLPT4YOU Backup Cleanup Tool
 * Di chuyển backup files cũ vào thư mục trash thay vì xóa
 * 
 * Usage:
 * node scripts/cleanup-old-backups.js --days=7    # Keep last 7 days
 * node scripts/cleanup-old-backups.js --keep=5    # Keep last 5 backups
 * node scripts/cleanup-old-backups.js --dry-run   # Preview only
 */

const fs = require('fs').promises
const path = require('path')

class BackupCleanupTool {
  constructor() {
    this.backupDir = path.join(process.cwd(), 'backups')
    this.trashDir = path.join(process.cwd(), 'trash', 'backups')
    this.dryRun = process.argv.includes('--dry-run')
    
    // Parse command line arguments
    this.daysToKeep = this.getArgValue('--days') || 30
    this.backupsToKeep = this.getArgValue('--keep') || 10
  }

  getArgValue(argName) {
    const arg = process.argv.find(arg => arg.startsWith(argName + '='))
    return arg ? parseInt(arg.split('=')[1]) : null
  }

  async run() {
    console.log('🗃️  JLPT4YOU Backup Cleanup Tool')
    console.log('=====================================')
    
    if (this.dryRun) {
      console.log('🔍 DRY RUN - Preview mode only\n')
    }

    try {
      await this.ensureTrashDir()
      const backupFiles = await this.getBackupFiles()
      const filesToMove = await this.identifyOldBackups(backupFiles)
      
      if (filesToMove.length === 0) {
        console.log('✅ No old backup files to cleanup')
        return
      }

      await this.moveToTrash(filesToMove)
      console.log('\n🎉 Backup cleanup completed successfully!')
      
    } catch (error) {
      console.error('❌ Cleanup failed:', error.message)
      process.exit(1)
    }
  }

  async ensureTrashDir() {
    try {
      await fs.access(this.trashDir)
    } catch {
      await fs.mkdir(this.trashDir, { recursive: true })
      console.log(`📁 Created trash directory: ${this.trashDir}`)
    }
  }

  async getBackupFiles() {
    try {
      const files = await fs.readdir(this.backupDir)
      
      // Group files by timestamp
      const backupGroups = {}
      
      for (const file of files) {
        const match = file.match(/^(schema|data|manifest)_(\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}-\d{3}Z)\.(sql|json)$/)
        if (match) {
          const [, type, timestamp, ext] = match
          if (!backupGroups[timestamp]) {
            backupGroups[timestamp] = []
          }
          backupGroups[timestamp].push({
            filename: file,
            type,
            timestamp,
            ext,
            fullPath: path.join(this.backupDir, file)
          })
        }
      }

      return backupGroups
    } catch (error) {
      throw new Error(`Failed to read backup directory: ${error.message}`)
    }
  }

  async identifyOldBackups(backupGroups) {
    const timestamps = Object.keys(backupGroups).sort().reverse()
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - this.daysToKeep)

    console.log(`📊 Found ${timestamps.length} backup sets`)
    console.log(`🗓️  Keeping backups newer than: ${cutoffDate.toISOString().split('T')[0]}`)
    console.log(`📦 Keeping last ${this.backupsToKeep} backup sets\n`)

    const filesToMove = []
    
    for (let i = 0; i < timestamps.length; i++) {
      const timestamp = timestamps[i]
      const backupDate = new Date(timestamp.replace(/_/g, ':').replace('Z', ''))
      const isOldByDate = backupDate < cutoffDate
      const isOldByCount = i >= this.backupsToKeep
      
      if (isOldByDate || isOldByCount) {
        const files = backupGroups[timestamp]
        filesToMove.push(...files)
        
        console.log(`🗑️  Will move backup set: ${timestamp}`)
        files.forEach(file => {
          console.log(`   - ${file.filename}`)
        })
      } else {
        console.log(`✅ Keeping backup set: ${timestamp}`)
      }
    }

    return filesToMove
  }

  async moveToTrash(filesToMove) {
    if (this.dryRun) {
      console.log(`\n🔍 DRY RUN: Would move ${filesToMove.length} files to trash`)
      return
    }

    console.log(`\n🗑️  Moving ${filesToMove.length} files to trash...`)
    
    for (const file of filesToMove) {
      try {
        const trashPath = path.join(this.trashDir, file.filename)
        await fs.rename(file.fullPath, trashPath)
        console.log(`   ✅ Moved: ${file.filename}`)
      } catch (error) {
        console.error(`   ❌ Failed to move ${file.filename}: ${error.message}`)
      }
    }
  }
}

// Show usage if no arguments
if (process.argv.length === 2) {
  console.log(`
🗃️  JLPT4YOU Backup Cleanup Tool

Usage:
  node scripts/cleanup-old-backups.js [options]

Options:
  --days=N      Keep backups from last N days (default: 30)
  --keep=N      Keep last N backup sets (default: 10)
  --dry-run     Preview mode - don't actually move files

Examples:
  node scripts/cleanup-old-backups.js --days=7
  node scripts/cleanup-old-backups.js --keep=5
  node scripts/cleanup-old-backups.js --dry-run
  node scripts/cleanup-old-backups.js --days=14 --keep=5 --dry-run
`)
  process.exit(0)
}

// Run the cleanup tool
const cleanup = new BackupCleanupTool()
cleanup.run()

#!/usr/bin/env node

/**
 * JLPT4YOU SQL Backup List Tool
 * Hiển thị danh sách và thông tin chi tiết về SQL backup files
 *
 * Usage:
 * npm run backup:list
 * npm run backup:list -- --detailed
 * npm run backup:list -- --file=data_2025-01-24_10-30-00.sql
 */

const fs = require('fs').promises
const path = require('path')

class BackupListTool {
  constructor() {
    this.backupDir = path.join(process.cwd(), 'backups')
  }

  /**
   * Lấy danh sách tất cả SQL backup files
   */
  async getAllBackupFiles() {
    try {
      const files = await fs.readdir(this.backupDir)
      return files
        .filter(file => file.endsWith('.sql') || file.startsWith('manifest_') || file === 'schedule-config.json')
        .sort()
        .reverse() // Latest first
    } catch (error) {
      throw new Error(`Cannot read backup directory: ${error.message}`)
    }
  }

  /**
   * Lấy thông tin chi tiết của một backup file
   */
  async getBackupInfo(filename) {
    const filePath = path.join(this.backupDir, filename)
    
    try {
      const stats = await fs.stat(filePath)
      const content = await fs.readFile(filePath, 'utf8')
      
      let info = {
        filename,
        size: stats.size,
        sizeFormatted: this.formatFileSize(stats.size),
        created: stats.mtime.toISOString(),
        type: this.getFileType(filename)
      }

      // Parse JSON content if possible
      try {
        const data = JSON.parse(content)
        
        if (data.metadata) {
          // Data backup file
          info.metadata = data.metadata
          info.tables = Object.keys(data.data || {})
          info.totalRows = Object.values(data.data || {})
            .reduce((sum, table) => sum + (table.rowCount || 0), 0)
        } else if (data.timestamp) {
          // Manifest file
          info.manifest = data
        } else if (Array.isArray(data) || data.tables) {
          // Schema file
          info.schema = data
        }
      } catch (parseError) {
        info.parseError = parseError.message
      }

      return info
    } catch (error) {
      return {
        filename,
        error: error.message
      }
    }
  }

  /**
   * Xác định loại file backup
   */
  getFileType(filename) {
    if (filename.startsWith('data_') && filename.endsWith('.sql')) return 'data_sql'
    if (filename.startsWith('schema_') && filename.endsWith('.sql')) return 'schema_sql'
    if (filename.startsWith('manifest_')) return 'manifest'
    if (filename.startsWith('restore_log_')) return 'restore_log'
    if (filename === 'schedule-config.json') return 'config'
    return 'unknown'
  }

  /**
   * Format file size
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  /**
   * Hiển thị danh sách backup files
   */
  async listBackups(detailed = false) {
    console.log('📋 JLPT4YOU Backup Files\n')
    
    try {
      const files = await this.getAllBackupFiles()
      
      if (files.length === 0) {
        console.log('   📁 No backup files found in ./backups/')
        console.log('   💡 Run "npm run backup:create" to create your first backup')
        return
      }

      console.log(`📊 Found ${files.length} backup files:\n`)

      for (const file of files) {
        const info = await this.getBackupInfo(file)
        
        if (info.error) {
          console.log(`❌ ${file} - Error: ${info.error}`)
          continue
        }

        // Basic info
        const typeIcon = this.getTypeIcon(info.type)
        console.log(`${typeIcon} ${info.filename}`)
        console.log(`   📏 Size: ${info.sizeFormatted}`)
        console.log(`   📅 Created: ${new Date(info.created).toLocaleString()}`)

        if (detailed) {
          // Detailed info
          if (info.metadata) {
            console.log(`   🗄️ Tables: ${info.tables.length} (${info.totalRows} total rows)`)
            console.log(`   📋 Tables: ${info.tables.join(', ')}`)
            console.log(`   🕐 Backup time: ${new Date(info.metadata.timestamp).toLocaleString()}`)
          }
          
          if (info.manifest) {
            console.log(`   📦 Manifest: ${info.manifest.files?.length || 0} files`)
          }
          
          if (info.schema) {
            const tableCount = Array.isArray(info.schema) ? 
              info.schema.length : 
              (info.schema.tables?.length || 'unknown')
            console.log(`   🏗️ Schema: ${tableCount} tables`)
          }
        }

        console.log() // Empty line
      }

      // Summary
      const summary = this.generateSummary(files)
      console.log('📊 Summary:')
      Object.entries(summary).forEach(([type, count]) => {
        if (count > 0) {
          const icon = this.getTypeIcon(type)
          console.log(`   ${icon} ${type}: ${count} files`)
        }
      })

    } catch (error) {
      console.error('❌ Error listing backups:', error.message)
    }
  }

  /**
   * Hiển thị thông tin chi tiết của một file cụ thể
   */
  async showFileDetails(filename) {
    console.log(`📄 Backup File Details: ${filename}\n`)
    
    try {
      const info = await this.getBackupInfo(filename)
      
      if (info.error) {
        console.log(`❌ Error: ${info.error}`)
        return
      }

      console.log(`📁 File: ${info.filename}`)
      console.log(`📏 Size: ${info.sizeFormatted} (${info.size} bytes)`)
      console.log(`📅 Created: ${new Date(info.created).toLocaleString()}`)
      console.log(`🏷️ Type: ${info.type}`)

      if (info.metadata) {
        console.log('\n💾 Data Backup Details:')
        console.log(`   🕐 Backup timestamp: ${new Date(info.metadata.timestamp).toLocaleString()}`)
        console.log(`   🌐 Supabase URL: ${info.metadata.supabaseUrl}`)
        console.log(`   📊 Total tables: ${info.tables.length}`)
        console.log(`   📈 Total rows: ${info.totalRows}`)
        console.log('\n📋 Tables:')
        
        info.tables.forEach(tableName => {
          const tableData = info.metadata.tables?.includes(tableName) ? '✅' : '❓'
          console.log(`   ${tableData} ${tableName}`)
        })
      }

      if (info.manifest) {
        console.log('\n📦 Manifest Details:')
        console.log(`   🕐 Created: ${new Date(info.manifest.timestamp).toLocaleString()}`)
        console.log(`   📁 Files: ${info.manifest.files?.length || 0}`)
        
        if (info.manifest.files) {
          console.log('\n📄 Included files:')
          info.manifest.files.forEach(file => {
            console.log(`   📄 ${path.basename(file)}`)
          })
        }
      }

      if (info.schema) {
        console.log('\n🏗️ Schema Details:')
        if (Array.isArray(info.schema)) {
          console.log(`   📊 Tables: ${info.schema.length}`)
        } else if (info.schema.tables) {
          console.log(`   📊 Tables: ${info.schema.tables.length}`)
          console.log(`   📝 Note: ${info.schema.note || 'Full schema backup'}`)
        }
      }

    } catch (error) {
      console.error('❌ Error showing file details:', error.message)
    }
  }

  /**
   * Tạo summary thống kê
   */
  generateSummary(files) {
    const summary = {
      data_sql: 0,
      schema_sql: 0,
      manifest: 0,
      restore_log: 0,
      config: 0,
      unknown: 0
    }

    files.forEach(file => {
      const type = this.getFileType(file)
      summary[type] = (summary[type] || 0) + 1
    })

    return summary
  }

  /**
   * Lấy icon cho từng loại file
   */
  getTypeIcon(type) {
    const icons = {
      data_sql: '🗃️',
      schema_sql: '🔧',
      manifest: '📦',
      restore_log: '📝',
      config: '⚙️',
      unknown: '❓'
    }
    return icons[type] || '📄'
  }
}

// CLI execution
async function main() {
  try {
    const args = process.argv.slice(2)
    let detailed = false
    let specificFile = null
    
    // Parse command line arguments
    args.forEach(arg => {
      if (arg === '--detailed') detailed = true
      if (arg.startsWith('--file=')) specificFile = arg.split('=')[1]
    })

    const listTool = new BackupListTool()
    
    if (specificFile) {
      await listTool.showFileDetails(specificFile)
    } else {
      await listTool.listBackups(detailed)
    }
    
  } catch (error) {
    console.error('❌ List tool error:', error.message)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  main()
}

module.exports = { BackupListTool }

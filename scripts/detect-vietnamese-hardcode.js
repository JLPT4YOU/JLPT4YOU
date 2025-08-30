#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Tool to detect hardcoded Vietnamese text in JLPT4YOU project
 * Scans TypeScript, TSX, and JavaScript files for Vietnamese strings
 */

// Vietnamese character patterns
const VIETNAMESE_PATTERNS = [
  // Vietnamese diacritics
  /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/gi,
  // Common Vietnamese words
  /\b(và|của|trong|với|để|cho|từ|về|theo|như|được|có|là|này|đó|các|một|những|không|tất|cả|thì|sẽ|đã|đang|bạn|tôi|chúng|họ|nó|việc|làm|xem|biết|nói|đi|đến|ra|vào|lên|xuống|qua|lại|rồi|mà|nhưng|hoặc|nếu|khi|bởi|vì|nên|phải|cần|muốn|thích|yêu|ghét|tốt|xấu|lớn|nhỏ|cao|thấp|dài|ngắn|rộng|hẹp|nhanh|chậm|mới|cũ|trẻ|già|đẹp|xấu|giàu|nghèo|khỏe|yếu|thông|minh|ngu|ngốc)\b/gi
];

// File extensions to scan
const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];

// Directories to exclude
const EXCLUDE_DIRS = ['node_modules', '.git', '.next', 'dist', 'build', 'coverage', 'trash'];

// Files to exclude
const EXCLUDE_FILES = ['.min.js', '.bundle.js', 'package-lock.json', 'vn.json', 'en.json', 'ja.json'];

class VietnameseDetector {
  constructor(rootPath) {
    this.rootPath = rootPath;
    this.results = [];
  }

  shouldSkipPath(filePath) {
    const relativePath = path.relative(this.rootPath, filePath);
    
    // Skip excluded directories
    for (const dir of EXCLUDE_DIRS) {
      if (relativePath.includes(dir)) return true;
    }
    
    // Skip excluded files
    for (const file of EXCLUDE_FILES) {
      if (relativePath.includes(file)) return true;
    }
    
    return false;
  }

  isTargetFile(filePath) {
    const ext = path.extname(filePath);
    return EXTENSIONS.includes(ext);
  }

  detectVietnameseInContent(content, filePath) {
    const lines = content.split('\n');
    const matches = [];

    lines.forEach((line, lineIndex) => {
      // Skip comments and imports
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith('//') || 
          trimmedLine.startsWith('/*') || 
          trimmedLine.startsWith('*') ||
          trimmedLine.startsWith('import ') ||
          trimmedLine.startsWith('export ')) {
        return;
      }

      // Check for Vietnamese patterns
      VIETNAMESE_PATTERNS.forEach((pattern, patternIndex) => {
        const regexMatches = [...line.matchAll(pattern)];
        regexMatches.forEach(match => {
          // Skip if it's in a translation key (like t('key'))
          const beforeMatch = line.substring(0, match.index);
          if (beforeMatch.includes("t('") || beforeMatch.includes('t("') || 
              beforeMatch.includes("i18n.") || beforeMatch.includes("translate(")) {
            return;
          }

          matches.push({
            line: lineIndex + 1,
            column: match.index + 1,
            text: match[0],
            context: line.trim(),
            patternType: patternIndex === 0 ? 'diacritics' : 'common_words'
          });
        });
      });
    });

    return matches;
  }

  async scanFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const matches = this.detectVietnameseInContent(content, filePath);
      
      if (matches.length > 0) {
        const relativePath = path.relative(this.rootPath, filePath);
        this.results.push({
          file: relativePath,
          matches: matches,
          totalMatches: matches.length
        });
      }
    } catch (error) {
      console.error(`Error reading file ${filePath}:`, error.message);
    }
  }

  async scanDirectory(dirPath) {
    try {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        
        if (this.shouldSkipPath(fullPath)) continue;
        
        if (entry.isDirectory()) {
          await this.scanDirectory(fullPath);
        } else if (entry.isFile() && this.isTargetFile(fullPath)) {
          await this.scanFile(fullPath);
        }
      }
    } catch (error) {
      console.error(`Error scanning directory ${dirPath}:`, error.message);
    }
  }

  generateReport() {
    console.log('\n🔍 VIETNAMESE HARDCODE DETECTION REPORT');
    console.log('=====================================\n');

    if (this.results.length === 0) {
      console.log('✅ No hardcoded Vietnamese text found!');
      return;
    }

    console.log(`⚠️  Found ${this.results.length} files with potential hardcoded Vietnamese text:\n`);

    // Sort by number of matches (descending)
    this.results.sort((a, b) => b.totalMatches - a.totalMatches);

    this.results.forEach((result, index) => {
      console.log(`${index + 1}. ${result.file} (${result.totalMatches} matches)`);
      console.log('   ' + '─'.repeat(50));
      
      result.matches.forEach(match => {
        console.log(`   Line ${match.line}:${match.column} [${match.patternType}] "${match.text}"`);
        console.log(`   Context: ${match.context}`);
        console.log('');
      });
      console.log('');
    });

    // Summary
    const totalMatches = this.results.reduce((sum, result) => sum + result.totalMatches, 0);
    console.log(`📊 SUMMARY:`);
    console.log(`   Files with hardcoded Vietnamese: ${this.results.length}`);
    console.log(`   Total potential matches: ${totalMatches}`);
    console.log(`\n💡 RECOMMENDATIONS:`);
    console.log(`   1. Move hardcoded strings to translation files (src/translations/)`);
    console.log(`   2. Use translation functions like t('key') or i18n.t('key')`);
    console.log(`   3. Consider using constants for reusable strings`);
  }

  async scan() {
    console.log(`🚀 Scanning for hardcoded Vietnamese text in: ${this.rootPath}`);
    console.log(`📁 Extensions: ${EXTENSIONS.join(', ')}`);
    console.log(`🚫 Excluding: ${EXCLUDE_DIRS.join(', ')}\n`);

    await this.scanDirectory(this.rootPath);
    this.generateReport();
  }
}

// Main execution
async function main() {
  const projectRoot = process.argv[2] || process.cwd();
  
  if (!fs.existsSync(projectRoot)) {
    console.error(`❌ Directory not found: ${projectRoot}`);
    process.exit(1);
  }

  const detector = new VietnameseDetector(projectRoot);
  await detector.scan();
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { VietnameseDetector };

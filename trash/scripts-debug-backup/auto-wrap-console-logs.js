#!/usr/bin/env node

/**
 * Script để tự động wrap tất cả console.log với điều kiện development
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Patterns to wrap with development check
const CONSOLE_PATTERNS = [
  'console.log',
  'console.warn', 
  'console.info',
  'console.debug'
];

// Patterns to keep as-is (errors should stay for production debugging)
const KEEP_PATTERNS = [
  'console.error' // Keep errors for production debugging
];

// Files to exclude
const EXCLUDE_PATTERNS = [
  '**/node_modules/**',
  '**/trash/**',
  '**/__tests__/**',
  '**/*.test.ts',
  '**/*.test.tsx',
  '**/debug/**',
  '**/scripts/**'
];

function findFilesToProcess() {
  console.log('🔍 Finding TypeScript/React files to process...\n');
  
  const files = glob.sync('src/**/*.{ts,tsx}', { 
    ignore: EXCLUDE_PATTERNS
  });
  
  console.log(`📄 Found ${files.length} files to process\n`);
  return files;
}

function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    let newContent = content;
    
    // Process each console pattern
    CONSOLE_PATTERNS.forEach(pattern => {
      const regex = new RegExp(`^(\\s*)(${pattern.replace('.', '\\.')})\\(`, 'gm');
      
      newContent = newContent.replace(regex, (match, indent, consoleCall) => {
        // Skip if already wrapped
        if (newContent.includes(`if (process.env.NODE_ENV === 'development') {`) && 
            newContent.indexOf(match) > newContent.indexOf(`if (process.env.NODE_ENV === 'development') {`)) {
          return match;
        }
        
        modified = true;
        return `${indent}// Only log in development\n${indent}if (process.env.NODE_ENV === 'development') {\n${indent}  ${consoleCall}(`;
      });
      
      // Close the if statements
      if (modified) {
        // Find and close console statements
        const lines = newContent.split('\n');
        const newLines = [];
        let inConsoleBlock = false;
        let indentLevel = '';
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          
          if (line.includes('if (process.env.NODE_ENV === \'development\') {')) {
            newLines.push(line);
            inConsoleBlock = true;
            indentLevel = line.match(/^(\s*)/)[1];
          } else if (inConsoleBlock && line.trim().startsWith(pattern)) {
            newLines.push(line);
            // Add closing brace after console statement
            newLines.push(`${indentLevel}}`);
            inConsoleBlock = false;
          } else {
            newLines.push(line);
          }
        }
        
        newContent = newLines.join('\n');
      }
    });
    
    if (modified) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`✅ Processed: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

function main() {
  console.log('🚀 Auto-wrapping console.log statements with development checks...\n');
  
  const files = findFilesToProcess();
  let processedCount = 0;
  
  files.forEach(file => {
    if (processFile(file)) {
      processedCount++;
    }
  });
  
  console.log(`\n✅ Processing complete!`);
  console.log(`📊 Processed ${processedCount} files out of ${files.length} total files`);
  console.log(`💡 All console.log statements are now wrapped with development checks`);
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { processFile, findFilesToProcess };

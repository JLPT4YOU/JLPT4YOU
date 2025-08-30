#!/usr/bin/env node

/**
 * Script sửa các imports từ translation-compatibility sang i18n
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

function findFilesWithCompatibilityImports() {
  console.log('🔍 Tìm files có import từ translation-compatibility...\n');
  
  // Tìm tất cả file .tsx, .ts trong src/
  const files = glob.sync('src/**/*.{ts,tsx}', { 
    ignore: ['src/**/*.d.ts', 'src/**/*.test.ts', 'src/**/*.test.tsx']
  });
  
  const filesWithImports = [];
  
  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      
      if (content.includes('@/lib/translation-compatibility')) {
        filesWithImports.push({
          path: file,
          content: content
        });
        console.log(`📄 Found: ${file}`);
      }
    } catch (error) {
      console.error(`❌ Error reading ${file}:`, error.message);
    }
  }
  
  console.log(`\n✅ Found ${filesWithImports.length} files with compatibility imports\n`);
  return filesWithImports;
}

function fixImports(files) {
  console.log('🔧 Fixing imports...\n');
  
  let fixedFiles = 0;
  
  for (const file of files) {
    try {
      let content = file.content;
      let modified = false;
      
      // Replace import statement
      const oldImport = /import\s*{\s*loadTranslationLegacy\s+as\s+loadTranslation,\s*Language\s*}\s*from\s*['"`]@\/lib\/translation-compatibility['"`]/g;
      const newImport = "import { loadTranslation, Language } from '@/lib/i18n'";
      
      if (oldImport.test(content)) {
        content = content.replace(oldImport, newImport);
        modified = true;
        console.log(`✅ Fixed import in: ${file.path}`);
      }
      
      // Also handle other variations
      const variations = [
        {
          old: /import\s*{\s*loadTranslationLegacy\s*as\s*loadTranslation\s*,\s*Language\s*}\s*from\s*['"`]@\/lib\/translation-compatibility['"`]/g,
          new: "import { loadTranslation, Language } from '@/lib/i18n'"
        },
        {
          old: /import\s*{\s*loadTranslationLegacy,\s*Language\s*}\s*from\s*['"`]@\/lib\/translation-compatibility['"`]/g,
          new: "import { loadTranslation, Language } from '@/lib/i18n'"
        },
        {
          old: /from\s*['"`]@\/lib\/translation-compatibility['"`]/g,
          new: "from '@/lib/i18n'"
        }
      ];
      
      for (const variation of variations) {
        if (variation.old.test(content)) {
          content = content.replace(variation.old, variation.new);
          modified = true;
        }
      }
      
      // Replace loadTranslationLegacy function calls
      if (content.includes('loadTranslationLegacy')) {
        content = content.replace(/loadTranslationLegacy/g, 'loadTranslation');
        modified = true;
      }
      
      if (modified) {
        fs.writeFileSync(file.path, content);
        fixedFiles++;
        console.log(`💾 Updated: ${file.path}`);
      }
      
    } catch (error) {
      console.error(`❌ Error fixing ${file.path}:`, error.message);
    }
  }
  
  console.log(`\n✅ Fixed ${fixedFiles} files\n`);
  return fixedFiles;
}

function verifyFixes() {
  console.log('🔍 Verifying fixes...\n');
  
  const files = glob.sync('src/**/*.{ts,tsx}', { 
    ignore: ['src/**/*.d.ts', 'src/**/*.test.ts', 'src/**/*.test.tsx']
  });
  
  let remainingIssues = 0;
  
  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      
      if (content.includes('@/lib/translation-compatibility')) {
        console.log(`⚠️  Still has compatibility import: ${file}`);
        remainingIssues++;
      }
      
      if (content.includes('loadTranslationLegacy')) {
        console.log(`⚠️  Still has loadTranslationLegacy: ${file}`);
        remainingIssues++;
      }
    } catch (error) {
      console.error(`❌ Error verifying ${file}:`, error.message);
    }
  }
  
  if (remainingIssues === 0) {
    console.log('✅ All imports fixed successfully!\n');
  } else {
    console.log(`⚠️  ${remainingIssues} issues remaining\n`);
  }
  
  return remainingIssues;
}

function generateReport(filesFound, filesFixed, remainingIssues) {
  console.log('📊 IMPORT FIX REPORT\n');
  
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      filesFound: filesFound.length,
      filesFixed: filesFixed,
      remainingIssues: remainingIssues
    },
    actions: [
      `Scanned all TypeScript files in src/`,
      `Found ${filesFound.length} files with compatibility imports`,
      `Fixed ${filesFixed} files`,
      `${remainingIssues} issues remaining`
    ],
    fixedFiles: filesFound.map(f => f.path)
  };
  
  console.log('📈 Summary:');
  console.log(`  - Files scanned: All .ts/.tsx files in src/`);
  console.log(`  - Files with compatibility imports: ${filesFound.length}`);
  console.log(`  - Files fixed: ${filesFixed}`);
  console.log(`  - Remaining issues: ${remainingIssues}`);
  
  if (remainingIssues === 0) {
    console.log('\n✅ SUCCESS: All compatibility imports have been fixed!');
    console.log('Your application should now build without errors.');
  } else {
    console.log('\n⚠️  WARNING: Some issues remain. Please check the files listed above.');
  }
  
  // Save report
  const reportPath = 'import-fix-report.json';
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 Report saved: ${reportPath}`);
  
  return report;
}

// Main execution
function main() {
  console.log('🚀 FIXING TRANSLATION COMPATIBILITY IMPORTS\n');
  
  try {
    // Step 1: Find files with compatibility imports
    const filesFound = findFilesWithCompatibilityImports();
    
    if (filesFound.length === 0) {
      console.log('✅ No files found with compatibility imports. Nothing to fix!');
      return;
    }
    
    // Step 2: Fix the imports
    const filesFixed = fixImports(filesFound);
    
    // Step 3: Verify fixes
    const remainingIssues = verifyFixes();
    
    // Step 4: Generate report
    generateReport(filesFound, filesFixed, remainingIssues);
    
    if (remainingIssues === 0) {
      console.log('\n🎉 IMPORT FIX COMPLETED SUCCESSFULLY!');
      process.exit(0);
    } else {
      console.log('\n⚠️  IMPORT FIX COMPLETED WITH WARNINGS');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ FATAL ERROR:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main, findFilesWithCompatibilityImports, fixImports };

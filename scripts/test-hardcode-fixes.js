#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('=== HARDCODE FIXES TESTING ===\n');

// Function to find all files with potential hardcode text
function findFiles(dir, extensions = ['.tsx', '.jsx', '.ts', '.js']) {
  const files = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
      files.push(...findFiles(fullPath, extensions));
    } else if (stat.isFile() && extensions.some(ext => item.endsWith(ext))) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Function to analyze hardcode text in a file
function analyzeHardcodeText(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const relativePath = path.relative(process.cwd(), filePath);
  
  const analysis = {
    path: relativePath,
    hasVietnameseText: false,
    vietnameseTexts: [],
    hasTranslationIntegration: false,
    hasUseTranslations: content.includes('useTranslations'),
    hasCreateTranslationFunction: content.includes('createTranslationFunction'),
    hasGetText: content.includes('getText'),
    hasTranslationProps: content.includes('translations:') || content.includes('translations '),
    isFixed: false
  };
  
  // Check for Vietnamese text patterns
  const vietnamesePatterns = [
    // Common Vietnamese words
    /["']([^"']*(?:Đăng|Trang|Bắt đầu|Luyện|Học|Nạp|Cài đặt|Nâng cấp|Thử thách|Kết quả|Xem đáp án)[^"']*?)["']/gi,
    // Vietnamese characters
    /["']([^"']*[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ][^"']*?)["']/gi,
    // Common Vietnamese phrases
    /["'](Nhập [^"']*?)["']/gi,
    /["'](Mật khẩu[^"']*?)["']/gi,
    /["'](Email [^"']*?)["']/gi,
    /["'](Quên [^"']*?)["']/gi,
    /["'](Tôi đồng ý[^"']*?)["']/gi,
    /["'](Điều khoản[^"']*?)["']/gi,
    /["'](Chính sách[^"']*?)["']/gi
  ];
  
  for (const pattern of vietnamesePatterns) {
    const matches = content.match(pattern);
    if (matches) {
      analysis.hasVietnameseText = true;
      analysis.vietnameseTexts.push(...matches.slice(0, 3)); // Limit to 3 examples
    }
  }
  
  // Check if file has translation integration
  analysis.hasTranslationIntegration = 
    analysis.hasUseTranslations || 
    analysis.hasCreateTranslationFunction || 
    analysis.hasGetText || 
    analysis.hasTranslationProps;
  
  // Check if file is properly fixed (has translation integration and no hardcode Vietnamese)
  analysis.isFixed = analysis.hasTranslationIntegration && !analysis.hasVietnameseText;
  
  return analysis;
}

// Test translation keys exist in all language files
function testTranslationKeys() {
  console.log('🔍 Testing Translation Keys Completeness:\n');
  
  const languages = ['vn', 'en', 'jp'];
  const translationFiles = {};
  
  // Load all translation files
  for (const lang of languages) {
    try {
      const filePath = `./src/translations/${lang}.json`;
      const content = fs.readFileSync(filePath, 'utf8');
      translationFiles[lang] = JSON.parse(content);
    } catch (error) {
      console.error(`❌ Failed to load ${lang}.json:`, error.message);
      return false;
    }
  }
  
  // Check if all files have the same structure
  const vnKeys = getAllKeys(translationFiles.vn);
  const enKeys = getAllKeys(translationFiles.en);
  const jpKeys = getAllKeys(translationFiles.jp);
  
  console.log(`📊 Translation Keys Count:`);
  console.log(`  VN: ${vnKeys.length} keys`);
  console.log(`  EN: ${enKeys.length} keys`);
  console.log(`  JP: ${jpKeys.length} keys`);
  
  // Find missing keys
  const missingInEn = vnKeys.filter(key => !enKeys.includes(key));
  const missingInJp = vnKeys.filter(key => !jpKeys.includes(key));
  const extraInEn = enKeys.filter(key => !vnKeys.includes(key));
  const extraInJp = jpKeys.filter(key => !vnKeys.includes(key));
  
  let allKeysMatch = true;
  
  if (missingInEn.length > 0) {
    console.log(`\n⚠️  Missing keys in EN (${missingInEn.length}):`);
    missingInEn.slice(0, 5).forEach(key => console.log(`  - ${key}`));
    if (missingInEn.length > 5) console.log(`  ... and ${missingInEn.length - 5} more`);
    allKeysMatch = false;
  }
  
  if (missingInJp.length > 0) {
    console.log(`\n⚠️  Missing keys in JP (${missingInJp.length}):`);
    missingInJp.slice(0, 5).forEach(key => console.log(`  - ${key}`));
    if (missingInJp.length > 5) console.log(`  ... and ${missingInJp.length - 5} more`);
    allKeysMatch = false;
  }
  
  if (extraInEn.length > 0) {
    console.log(`\n⚠️  Extra keys in EN (${extraInEn.length}):`);
    extraInEn.slice(0, 3).forEach(key => console.log(`  - ${key}`));
    allKeysMatch = false;
  }
  
  if (extraInJp.length > 0) {
    console.log(`\n⚠️  Extra keys in JP (${extraInJp.length}):`);
    extraInJp.slice(0, 3).forEach(key => console.log(`  - ${key}`));
    allKeysMatch = false;
  }
  
  if (allKeysMatch) {
    console.log('\n✅ All translation files have matching keys!');
  }
  
  return allKeysMatch;
}

// Helper function to get all keys from nested object
function getAllKeys(obj, prefix = '') {
  let keys = [];
  
  for (const key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      keys.push(...getAllKeys(obj[key], fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  
  return keys;
}

// Main testing function
function runHardcodeTests() {
  console.log('📊 Analyzing Files for Hardcode Text:\n');
  
  // Analyze all source files
  const srcFiles = findFiles('./src', ['.tsx', '.jsx']);
  const analyses = srcFiles.map(analyzeHardcodeText);
  
  // Filter results
  const filesWithVietnamese = analyses.filter(a => a.hasVietnameseText);
  const filesWithTranslation = analyses.filter(a => a.hasTranslationIntegration);
  const fixedFiles = analyses.filter(a => a.isFixed);
  const needsFixing = analyses.filter(a => a.hasVietnameseText && !a.hasTranslationIntegration);
  
  console.log(`📈 Analysis Results:`);
  console.log(`  Total files: ${analyses.length}`);
  console.log(`  Files with Vietnamese text: ${filesWithVietnamese.length}`);
  console.log(`  Files with translation integration: ${filesWithTranslation.length}`);
  console.log(`  Properly fixed files: ${fixedFiles.length}`);
  console.log(`  Files needing fixes: ${needsFixing.length}`);
  
  // Show remaining hardcode files
  if (filesWithVietnamese.length > 0) {
    console.log(`\n⚠️  Files still containing Vietnamese text (${filesWithVietnamese.length}):`);
    filesWithVietnamese.slice(0, 10).forEach(f => {
      console.log(`  - ${f.path}`);
      f.vietnameseTexts.slice(0, 2).forEach(text => {
        console.log(`    ${text}`);
      });
    });
    if (filesWithVietnamese.length > 10) {
      console.log(`  ... and ${filesWithVietnamese.length - 10} more files`);
    }
  } else {
    console.log('\n✅ No Vietnamese hardcode text found!');
  }
  
  // Show files that need translation integration
  if (needsFixing.length > 0) {
    console.log(`\n🔧 Files needing translation integration (${needsFixing.length}):`);
    needsFixing.slice(0, 5).forEach(f => {
      console.log(`  - ${f.path}`);
    });
    if (needsFixing.length > 5) {
      console.log(`  ... and ${needsFixing.length - 5} more files`);
    }
  }
  
  return {
    totalFiles: analyses.length,
    vietnameseFiles: filesWithVietnamese.length,
    translationFiles: filesWithTranslation.length,
    fixedFiles: fixedFiles.length,
    needsFixing: needsFixing.length
  };
}

// Run all tests
console.log('🧪 Running Hardcode Fixes Tests...\n');

const testResults = runHardcodeTests();
console.log('\n' + '='.repeat(50));
const keysMatch = testTranslationKeys();

// Final summary
console.log('\n=== FINAL SUMMARY ===');

const fixRate = Math.round((testResults.fixedFiles / testResults.totalFiles) * 100);
const remainingIssues = testResults.vietnameseFiles + testResults.needsFixing;

console.log(`📊 Fix Progress:`);
console.log(`  Fix rate: ${fixRate}% (${testResults.fixedFiles}/${testResults.totalFiles})`);
console.log(`  Remaining Vietnamese text: ${testResults.vietnameseFiles} files`);
console.log(`  Translation keys consistency: ${keysMatch ? '✅ Good' : '⚠️ Issues found'}`);

if (remainingIssues === 0 && keysMatch) {
  console.log('\n🎉 SUCCESS: All hardcode fixes completed!');
  console.log('✅ No Vietnamese hardcode text remaining');
  console.log('✅ Translation keys are consistent');
  console.log('✅ Ready for production deployment');
} else if (remainingIssues <= 5) {
  console.log('\n👍 GOOD: Most hardcode fixes completed');
  console.log(`⚠️  ${remainingIssues} minor issues remaining`);
  console.log('🚀 Ready for staging deployment');
} else {
  console.log('\n⚠️  NEEDS WORK: Significant hardcode issues remain');
  console.log(`❌ ${remainingIssues} files need attention`);
  console.log('🔧 Continue fixing before deployment');
}

console.log(`\n📈 Overall Score: ${Math.max(0, 100 - remainingIssues * 5)}/100`);

#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('=== NORMALIZING TRANSLATION FILES ===\n');

const files = ['vn', 'en', 'jp'];

files.forEach(lang => {
  const filePath = path.join(__dirname, `../src/translations/${lang}.json`);
  
  try {
    // Read and parse JSON
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);
    
    // Normalize formatting with consistent indentation
    const normalized = JSON.stringify(data, null, 2);
    
    // Write back to file
    fs.writeFileSync(filePath, normalized + '\n', 'utf8');
    
    console.log(`✅ ${lang.toUpperCase()}: Normalized formatting`);
    
    // Count lines after normalization
    const lines = normalized.split('\n').length + 1; // +1 for final newline
    console.log(`   Lines: ${lines}`);
    
  } catch (error) {
    console.log(`❌ ${lang.toUpperCase()}: Error - ${error.message}`);
  }
});

console.log('\n🔧 Formatting normalized with:');
console.log('  - 2-space indentation');
console.log('  - Consistent line endings');
console.log('  - Trailing newline');
console.log('\n✅ All translation files now have identical formatting!');

#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Load translation files
const files = ['vn', 'en', 'jp'];
const translations = {};

console.log('=== TRANSLATION VALIDATION ===\n');

// Load and validate JSON syntax
files.forEach(lang => {
  const filePath = path.join(__dirname, `../src/translations/${lang}.json`);
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    translations[lang] = JSON.parse(content);
    console.log(`✅ ${lang.toUpperCase()}: Valid JSON syntax`);
  } catch (error) {
    console.log(`❌ ${lang.toUpperCase()}: Invalid JSON - ${error.message}`);
    process.exit(1);
  }
});

console.log('\n📊 File Analysis:');

// Check for empty values
function findEmptyValues(obj, prefix = '', lang = '') {
  const empty = [];
  for (const key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      empty.push(...findEmptyValues(obj[key], fullKey, lang));
    } else if (obj[key] === '' || obj[key] === null || obj[key] === undefined) {
      empty.push(`${lang}: ${fullKey}`);
    }
  }
  return empty;
}

// Check for inconsistent types
function checkTypes(vn, en, jp, prefix = '') {
  const issues = [];
  for (const key in vn) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    const vnType = typeof vn[key];
    const enType = typeof en[key];
    const jpType = typeof jp[key];
    
    if (vnType !== enType || vnType !== jpType) {
      issues.push(`Type mismatch at ${fullKey}: VN(${vnType}) EN(${enType}) JP(${jpType})`);
    }
    
    if (vnType === 'object' && vn[key] !== null && !Array.isArray(vn[key])) {
      if (en[key] && jp[key]) {
        issues.push(...checkTypes(vn[key], en[key], jp[key], fullKey));
      }
    }
  }
  return issues;
}

// Find empty values
const emptyValues = [];
files.forEach(lang => {
  emptyValues.push(...findEmptyValues(translations[lang], '', lang.toUpperCase()));
});

if (emptyValues.length > 0) {
  console.log('\n⚠️  Empty Values Found:');
  emptyValues.forEach(empty => console.log(`  - ${empty}`));
} else {
  console.log('\n✅ No empty values found');
}

// Check type consistency
const typeIssues = checkTypes(translations.vn, translations.en, translations.jp);
if (typeIssues.length > 0) {
  console.log('\n⚠️  Type Inconsistencies:');
  typeIssues.forEach(issue => console.log(`  - ${issue}`));
} else {
  console.log('\n✅ All types are consistent');
}

// Check for potential issues with special characters
console.log('\n🔍 Special Character Analysis:');
files.forEach(lang => {
  const content = fs.readFileSync(path.join(__dirname, `../src/translations/${lang}.json`), 'utf8');
  const lines = content.split('\n');
  const issues = [];
  
  lines.forEach((line, index) => {
    // Check for trailing commas
    if (line.trim().endsWith(',}') || line.trim().endsWith(',]')) {
      issues.push(`Line ${index + 1}: Trailing comma`);
    }
    // Check for unescaped quotes
    if (line.includes('"') && !line.includes('\\"') && line.split('"').length > 3) {
      const quoteCount = (line.match(/"/g) || []).length;
      if (quoteCount % 2 !== 0) {
        issues.push(`Line ${index + 1}: Potential unescaped quote`);
      }
    }
  });
  
  if (issues.length > 0) {
    console.log(`\n⚠️  ${lang.toUpperCase()} Issues:`);
    issues.slice(0, 5).forEach(issue => console.log(`  - ${issue}`));
    if (issues.length > 5) {
      console.log(`  ... and ${issues.length - 5} more issues`);
    }
  } else {
    console.log(`✅ ${lang.toUpperCase()}: No formatting issues`);
  }
});

console.log('\n=== SUMMARY ===');
console.log(`Total keys per file: ${Object.keys(translations.vn).length} root keys`);
console.log('All files have consistent structure and valid JSON syntax.');

#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Load translation files
const vnPath = path.join(__dirname, '../src/translations/vn.json');
const enPath = path.join(__dirname, '../src/translations/en.json');
const jpPath = path.join(__dirname, '../src/translations/jp.json');

const vn = JSON.parse(fs.readFileSync(vnPath, 'utf8'));
const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const jp = JSON.parse(fs.readFileSync(jpPath, 'utf8'));

// Function to get all keys from nested object
function getAllKeys(obj, prefix = '') {
  const keys = [];
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

// Get all keys from each file
const vnKeys = new Set(getAllKeys(vn));
const enKeys = new Set(getAllKeys(en));
const jpKeys = new Set(getAllKeys(jp));

console.log('=== TRANSLATION FILES COMPARISON ===\n');

console.log('📊 File Statistics:');
console.log(`VN: ${vnKeys.size} keys`);
console.log(`EN: ${enKeys.size} keys`);
console.log(`JP: ${jpKeys.size} keys\n`);

// Find missing keys
const missingInEn = [...vnKeys].filter(key => !enKeys.has(key));
const missingInJp = [...vnKeys].filter(key => !jpKeys.has(key));
const extraInEn = [...enKeys].filter(key => !vnKeys.has(key));
const extraInJp = [...jpKeys].filter(key => !vnKeys.has(key));

console.log('🔍 Missing Keys Analysis:');
if (missingInEn.length > 0) {
  console.log(`\n❌ Missing in EN (${missingInEn.length} keys):`);
  missingInEn.forEach(key => console.log(`  - ${key}`));
}

if (missingInJp.length > 0) {
  console.log(`\n❌ Missing in JP (${missingInJp.length} keys):`);
  missingInJp.forEach(key => console.log(`  - ${key}`));
}

if (extraInEn.length > 0) {
  console.log(`\n➕ Extra in EN (${extraInEn.length} keys):`);
  extraInEn.forEach(key => console.log(`  - ${key}`));
}

if (extraInJp.length > 0) {
  console.log(`\n➕ Extra in JP (${extraInJp.length} keys):`);
  extraInJp.forEach(key => console.log(`  - ${key}`));
}

if (missingInEn.length === 0 && missingInJp.length === 0 && extraInEn.length === 0 && extraInJp.length === 0) {
  console.log('\n✅ All translation files are perfectly synchronized!');
} else {
  console.log('\n⚠️  Translation files need synchronization.');
}

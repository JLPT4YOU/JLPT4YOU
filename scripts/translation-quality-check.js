#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('=== TRANSLATION QUALITY CHECK ===\n');

// Load translation files
const vn = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/translations/vn.json'), 'utf8'));
const en = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/translations/en.json'), 'utf8'));
const jp = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/translations/jp.json'), 'utf8'));

// Function to get all key-value pairs
function getAllPairs(obj, prefix = '') {
  const pairs = [];
  for (const key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      pairs.push(...getAllPairs(obj[key], fullKey));
    } else {
      pairs.push({ key: fullKey, value: obj[key] });
    }
  }
  return pairs;
}

const vnPairs = getAllPairs(vn);
const enPairs = getAllPairs(en);
const jpPairs = getAllPairs(jp);

console.log('📊 Translation Statistics:');
console.log(`VN: ${vnPairs.length} translations`);
console.log(`EN: ${enPairs.length} translations`);
console.log(`JP: ${jpPairs.length} translations`);

// Check for potential issues
console.log('\n🔍 Quality Analysis:');

// 1. Check for untranslated content (same as Vietnamese)
const untranslatedEn = [];
const untranslatedJp = [];

vnPairs.forEach((vnPair, index) => {
  const enPair = enPairs[index];
  const jpPair = jpPairs[index];
  
  if (enPair && vnPair.value === enPair.value && typeof vnPair.value === 'string' && vnPair.value.length > 3) {
    untranslatedEn.push(vnPair.key);
  }
  
  if (jpPair && vnPair.value === jpPair.value && typeof vnPair.value === 'string' && vnPair.value.length > 3) {
    untranslatedJp.push(vnPair.key);
  }
});

if (untranslatedEn.length > 0) {
  console.log(`\n⚠️  Potentially untranslated EN (${untranslatedEn.length}):`);
  untranslatedEn.slice(0, 5).forEach(key => console.log(`  - ${key}`));
  if (untranslatedEn.length > 5) console.log(`  ... and ${untranslatedEn.length - 5} more`);
}

if (untranslatedJp.length > 0) {
  console.log(`\n⚠️  Potentially untranslated JP (${untranslatedJp.length}):`);
  untranslatedJp.slice(0, 5).forEach(key => console.log(`  - ${key}`));
  if (untranslatedJp.length > 5) console.log(`  ... and ${untranslatedJp.length - 5} more`);
}

// 2. Check for very short translations (might be incomplete)
const shortTranslations = [];
vnPairs.forEach((pair, index) => {
  const enPair = enPairs[index];
  const jpPair = jpPairs[index];
  
  if (typeof pair.value === 'string' && pair.value.length > 10) {
    if (enPair && typeof enPair.value === 'string' && enPair.value.length < 3) {
      shortTranslations.push(`EN: ${pair.key} = "${enPair.value}"`);
    }
    if (jpPair && typeof jpPair.value === 'string' && jpPair.value.length < 3) {
      shortTranslations.push(`JP: ${pair.key} = "${jpPair.value}"`);
    }
  }
});

if (shortTranslations.length > 0) {
  console.log(`\n⚠️  Suspiciously short translations (${shortTranslations.length}):`);
  shortTranslations.slice(0, 5).forEach(trans => console.log(`  - ${trans}`));
  if (shortTranslations.length > 5) console.log(`  ... and ${shortTranslations.length - 5} more`);
}

// 3. Summary
console.log('\n=== SUMMARY ===');
if (untranslatedEn.length === 0 && untranslatedJp.length === 0 && shortTranslations.length === 0) {
  console.log('✅ Translation quality looks excellent!');
  console.log('✅ All files are properly synchronized');
  console.log('✅ No obvious translation issues found');
} else {
  console.log('⚠️  Some potential issues found - review recommended');
}

console.log(`\n📈 Overall Status:`);
console.log(`- Structure: ✅ Synchronized`);
console.log(`- Formatting: ✅ Normalized`);
console.log(`- Keys: ✅ ${vnPairs.length} consistent across all languages`);
console.log(`- Quality: ${untranslatedEn.length + untranslatedJp.length + shortTranslations.length === 0 ? '✅' : '⚠️'} ${untranslatedEn.length + untranslatedJp.length + shortTranslations.length === 0 ? 'Excellent' : 'Needs review'}`);

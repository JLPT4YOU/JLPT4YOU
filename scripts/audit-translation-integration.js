#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('=== TRANSLATION INTEGRATION AUDIT ===\n');

// Function to recursively find all TSX/JSX files
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

// Function to analyze file for translation usage
function analyzeFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const relativePath = path.relative(process.cwd(), filePath);
  
  const analysis = {
    path: relativePath,
    hasUseLanguageContext: content.includes('useLanguageContext'),
    hasUseTranslations: content.includes('useTranslations'),
    hasTranslationProps: content.includes('translations:') || content.includes('translations '),
    hasTranslationFunction: content.includes('t(') || content.includes('t '),
    hasCreateTranslationFunction: content.includes('createTranslationFunction'),
    hasLanguagePageWrapper: content.includes('LanguagePageWrapper'),
    hasHardcodedVietnamese: false,
    hardcodedTexts: [],
    isComponent: relativePath.includes('/components/'),
    isPage: relativePath.includes('/app/') && (relativePath.includes('/page.') || relativePath.includes('/layout.')),
    isClientComponent: content.includes('"use client"'),
    hasTranslationImport: content.includes('from "@/lib/i18n"') || content.includes('from "@/contexts/language-context"')
  };
  
  // Check for hardcoded Vietnamese text (basic patterns)
  const vietnamesePatterns = [
    /["']([^"']*[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ][^"']*?)["']/gi,
    /["'](Đăng [^"']*?)["']/gi,
    /["'](Trang [^"']*?)["']/gi,
    /["'](Bắt đầu[^"']*?)["']/gi,
    /["'](Luyện [^"']*?)["']/gi
  ];
  
  for (const pattern of vietnamesePatterns) {
    const matches = content.match(pattern);
    if (matches) {
      analysis.hasHardcodedVietnamese = true;
      analysis.hardcodedTexts.push(...matches.slice(0, 3)); // Limit to 3 examples
    }
  }
  
  return analysis;
}

// Analyze all relevant files
const srcFiles = findFiles('./src', ['.tsx', '.jsx']);
const analyses = srcFiles.map(analyzeFile);

// Categorize results
const components = analyses.filter(a => a.isComponent);
const pages = analyses.filter(a => a.isPage);
const others = analyses.filter(a => !a.isComponent && !a.isPage);

console.log('📊 File Analysis Summary:');
console.log(`Total files analyzed: ${analyses.length}`);
console.log(`- Components: ${components.length}`);
console.log(`- Pages: ${pages.length}`);
console.log(`- Other files: ${others.length}\n`);

// Check translation integration
console.log('🔍 Translation Integration Analysis:\n');

// 1. Components without translation integration
const componentsWithoutTranslation = components.filter(c =>
  !c.hasUseLanguageContext &&
  !c.hasUseTranslations &&
  !c.hasTranslationProps &&
  !c.hasCreateTranslationFunction &&
  !c.hasLanguagePageWrapper &&
  c.path.includes('/components/') &&
  !c.path.includes('/ui/') // Exclude UI components
);

if (componentsWithoutTranslation.length > 0) {
  console.log(`⚠️  Components without translation integration (${componentsWithoutTranslation.length}):`);
  componentsWithoutTranslation.slice(0, 10).forEach(c => {
    console.log(`  - ${c.path}`);
  });
  if (componentsWithoutTranslation.length > 10) {
    console.log(`  ... and ${componentsWithoutTranslation.length - 10} more`);
  }
  console.log();
}

// 2. Pages without translation integration
const pagesWithoutTranslation = pages.filter(p => 
  !p.hasLanguagePageWrapper && 
  !p.hasTranslationProps &&
  !p.hasCreateTranslationFunction
);

if (pagesWithoutTranslation.length > 0) {
  console.log(`⚠️  Pages without translation integration (${pagesWithoutTranslation.length}):`);
  pagesWithoutTranslation.forEach(p => {
    console.log(`  - ${p.path}`);
  });
  console.log();
}

// 3. Files with hardcoded Vietnamese text
const filesWithHardcodedText = analyses.filter(a => a.hasHardcodedVietnamese);

if (filesWithHardcodedText.length > 0) {
  console.log(`⚠️  Files with hardcoded Vietnamese text (${filesWithHardcodedText.length}):`);
  filesWithHardcodedText.slice(0, 5).forEach(f => {
    console.log(`  - ${f.path}`);
    f.hardcodedTexts.slice(0, 2).forEach(text => {
      console.log(`    ${text}`);
    });
  });
  if (filesWithHardcodedText.length > 5) {
    console.log(`  ... and ${filesWithHardcodedText.length - 5} more files`);
  }
  console.log();
}

// 4. Translation integration patterns
console.log('📈 Translation Integration Patterns:');
console.log(`useLanguageContext: ${analyses.filter(a => a.hasUseLanguageContext).length} files`);
console.log(`useTranslations: ${analyses.filter(a => a.hasUseTranslations).length} files`);
console.log(`LanguagePageWrapper: ${analyses.filter(a => a.hasLanguagePageWrapper).length} files`);
console.log(`createTranslationFunction: ${analyses.filter(a => a.hasCreateTranslationFunction).length} files`);
console.log(`Translation props: ${analyses.filter(a => a.hasTranslationProps).length} files`);

// Summary
console.log('\n=== SUMMARY ===');
const totalIssues = componentsWithoutTranslation.length + pagesWithoutTranslation.length + filesWithHardcodedText.length;

if (totalIssues === 0) {
  console.log('✅ Translation integration looks excellent!');
  console.log('✅ All components and pages properly integrated');
  console.log('✅ No hardcoded Vietnamese text found');
} else {
  console.log(`⚠️  Found ${totalIssues} integration issues that need attention`);
  console.log(`- Components without translation: ${componentsWithoutTranslation.length}`);
  console.log(`- Pages without translation: ${pagesWithoutTranslation.length}`);
  console.log(`- Files with hardcoded text: ${filesWithHardcodedText.length}`);
}

#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('=== SEO LINKS AND METADATA AUDIT ===\n');

// Function to find all relevant files
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

// Function to analyze SEO and links in a file
function analyzeSEOFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const relativePath = path.relative(process.cwd(), filePath);
  
  const analysis = {
    path: relativePath,
    hasHreflangTags: content.includes('hreflang') || content.includes('generateHreflangLinks'),
    hasStructuredData: content.includes('structuredData') || content.includes('application/ld+json'),
    hasMetadata: content.includes('generateMetadata') || content.includes('Metadata'),
    hasLanguageLinks: false,
    languageLinks: [],
    hasHardcodedUrls: false,
    hardcodedUrls: [],
    hasLocalizedPaths: content.includes('getLocalizedPath') || content.includes('removeLanguageFromPath'),
    isLandingPage: relativePath.includes('landing') || relativePath.includes('page.tsx'),
    isLayoutFile: relativePath.includes('layout.tsx')
  };
  
  // Check for language-specific links
  const languageLinkPatterns = [
    /href=["']\/[a-z]{2}\/[^"']*["']/gi,
    /href=["']\/auth\/[a-z]{2}\/[^"']*["']/gi,
    /href=["']\/[a-z]{2}["']/gi
  ];
  
  for (const pattern of languageLinkPatterns) {
    const matches = content.match(pattern);
    if (matches) {
      analysis.hasLanguageLinks = true;
      analysis.languageLinks.push(...matches.slice(0, 5)); // Limit to 5 examples
    }
  }
  
  // Check for hardcoded URLs
  const hardcodedUrlPatterns = [
    /href=["']https?:\/\/[^"']*["']/gi,
    /url=["']https?:\/\/[^"']*["']/gi,
    /src=["']https?:\/\/[^"']*["']/gi
  ];
  
  for (const pattern of hardcodedUrlPatterns) {
    const matches = content.match(pattern);
    if (matches) {
      analysis.hasHardcodedUrls = true;
      analysis.hardcodedUrls.push(...matches.slice(0, 3)); // Limit to 3 examples
    }
  }
  
  return analysis;
}

// Analyze all relevant files
const srcFiles = findFiles('./src', ['.tsx', '.jsx']);
const analyses = srcFiles.map(analyzeSEOFile);

// Filter for important files
const landingPages = analyses.filter(a => a.isLandingPage);
const layoutFiles = analyses.filter(a => a.isLayoutFile);
const seoFiles = analyses.filter(a => a.hasHreflangTags || a.hasStructuredData || a.hasMetadata);

console.log('📊 SEO Analysis Summary:');
console.log(`Total files analyzed: ${analyses.length}`);
console.log(`Landing pages: ${landingPages.length}`);
console.log(`Layout files: ${layoutFiles.length}`);
console.log(`Files with SEO features: ${seoFiles.length}\n`);

// Check hreflang implementation
console.log('🔍 Hreflang Tags Analysis:');
const filesWithHreflang = analyses.filter(a => a.hasHreflangTags);
if (filesWithHreflang.length > 0) {
  console.log(`✅ Found hreflang implementation in ${filesWithHreflang.length} files:`);
  filesWithHreflang.forEach(f => {
    console.log(`  - ${f.path}`);
  });
} else {
  console.log('⚠️  No hreflang implementation found');
}
console.log();

// Check structured data
console.log('📋 Structured Data Analysis:');
const filesWithStructuredData = analyses.filter(a => a.hasStructuredData);
if (filesWithStructuredData.length > 0) {
  console.log(`✅ Found structured data in ${filesWithStructuredData.length} files:`);
  filesWithStructuredData.forEach(f => {
    console.log(`  - ${f.path}`);
  });
} else {
  console.log('⚠️  No structured data implementation found');
}
console.log();

// Check metadata generation
console.log('🏷️  Metadata Generation Analysis:');
const filesWithMetadata = analyses.filter(a => a.hasMetadata);
if (filesWithMetadata.length > 0) {
  console.log(`✅ Found metadata generation in ${filesWithMetadata.length} files:`);
  filesWithMetadata.forEach(f => {
    console.log(`  - ${f.path}`);
  });
} else {
  console.log('⚠️  No metadata generation found');
}
console.log();

// Check language links
console.log('🌐 Language Links Analysis:');
const filesWithLanguageLinks = analyses.filter(a => a.hasLanguageLinks);
if (filesWithLanguageLinks.length > 0) {
  console.log(`✅ Found language-specific links in ${filesWithLanguageLinks.length} files:`);
  filesWithLanguageLinks.slice(0, 5).forEach(f => {
    console.log(`  - ${f.path}`);
    f.languageLinks.slice(0, 2).forEach(link => {
      console.log(`    ${link}`);
    });
  });
  if (filesWithLanguageLinks.length > 5) {
    console.log(`  ... and ${filesWithLanguageLinks.length - 5} more files`);
  }
} else {
  console.log('⚠️  No language-specific links found');
}
console.log();

// Check for hardcoded URLs
console.log('🔗 Hardcoded URLs Analysis:');
const filesWithHardcodedUrls = analyses.filter(a => a.hasHardcodedUrls);
if (filesWithHardcodedUrls.length > 0) {
  console.log(`⚠️  Found hardcoded URLs in ${filesWithHardcodedUrls.length} files:`);
  filesWithHardcodedUrls.slice(0, 5).forEach(f => {
    console.log(`  - ${f.path}`);
    f.hardcodedUrls.slice(0, 2).forEach(url => {
      console.log(`    ${url}`);
    });
  });
  if (filesWithHardcodedUrls.length > 5) {
    console.log(`  ... and ${filesWithHardcodedUrls.length - 5} more files`);
  }
} else {
  console.log('✅ No hardcoded URLs found');
}
console.log();

// Check localized path usage
console.log('🗺️  Localized Path Usage:');
const filesWithLocalizedPaths = analyses.filter(a => a.hasLocalizedPaths);
if (filesWithLocalizedPaths.length > 0) {
  console.log(`✅ Found localized path usage in ${filesWithLocalizedPaths.length} files:`);
  filesWithLocalizedPaths.slice(0, 10).forEach(f => {
    console.log(`  - ${f.path}`);
  });
  if (filesWithLocalizedPaths.length > 10) {
    console.log(`  ... and ${filesWithLocalizedPaths.length - 10} more files`);
  }
} else {
  console.log('⚠️  No localized path usage found');
}

// Summary and recommendations
console.log('\n=== SUMMARY & RECOMMENDATIONS ===');

const issues = [];
if (filesWithHreflang.length === 0) issues.push('Missing hreflang implementation');
if (filesWithStructuredData.length === 0) issues.push('Missing structured data');
if (filesWithMetadata.length === 0) issues.push('Missing metadata generation');
if (filesWithHardcodedUrls.length > 0) issues.push(`${filesWithHardcodedUrls.length} files with hardcoded URLs`);
if (filesWithLocalizedPaths.length === 0) issues.push('Missing localized path usage');

if (issues.length === 0) {
  console.log('✅ SEO implementation looks excellent!');
  console.log('✅ All major SEO features are properly implemented');
  console.log('✅ No critical issues found');
} else {
  console.log(`⚠️  Found ${issues.length} SEO issues that need attention:`);
  issues.forEach(issue => {
    console.log(`  - ${issue}`);
  });
}

console.log('\n📈 SEO Score:');
const maxScore = 5;
const currentScore = maxScore - Math.min(issues.length, maxScore);
console.log(`${currentScore}/${maxScore} (${Math.round((currentScore / maxScore) * 100)}%)`);

if (currentScore === maxScore) {
  console.log('🏆 Perfect SEO implementation!');
} else if (currentScore >= 3) {
  console.log('👍 Good SEO implementation with room for improvement');
} else {
  console.log('⚠️  SEO implementation needs significant improvement');
}

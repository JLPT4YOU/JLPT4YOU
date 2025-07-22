#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('=== POST-AUTH LANGUAGE SWITCHING TESTING ===\n');

// Function to find all protected pages
function findProtectedPages() {
  const protectedPagesDir = './src/app/[lang]';
  const pages = [];
  
  function scanDirectory(dir, basePath = '') {
    try {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          scanDirectory(fullPath, path.join(basePath, item));
        } else if (item === 'page.tsx') {
          pages.push({
            path: basePath || '/',
            filePath: fullPath,
            route: basePath ? `/${basePath}` : '/'
          });
        }
      }
    } catch (error) {
      // Directory might not exist
    }
  }
  
  scanDirectory(protectedPagesDir);
  return pages;
}

// Function to analyze a protected page for language switching support
function analyzeProtectedPage(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const relativePath = path.relative(process.cwd(), filePath);
  
  return {
    path: relativePath,
    hasLanguagePageWrapper: content.includes('LanguagePageWrapper'),
    hasUseLanguageContext: content.includes('useLanguageContext'),
    hasTranslationProps: content.includes('translations:') || content.includes('translations '),
    hasLanguageParam: content.includes('params') && content.includes('lang'),
    hasMetadataGeneration: content.includes('generateMetadata'),
    hasScrollPreservation: content.includes('useScrollPreservation') || content.includes('scroll'),
    hasLanguageSwitcher: content.includes('LanguageSwitcher'),
    isClientComponent: content.includes('"use client"'),
    hasErrorBoundary: content.includes('ErrorBoundary') || content.includes('error'),
    hasLoadingStates: content.includes('loading') || content.includes('isLoading'),
    hasFallbackHandling: content.includes('fallback') || content.includes('Suspense')
  };
}

// Find and analyze all protected pages
const protectedPages = findProtectedPages();
console.log(`📊 Found ${protectedPages.length} protected pages to analyze:\n`);

const analyses = protectedPages.map(page => ({
  ...page,
  analysis: analyzeProtectedPage(page.filePath)
}));

// Categorize pages by language switching support
const wellIntegratedPages = analyses.filter(p => 
  p.analysis.hasLanguagePageWrapper || 
  (p.analysis.hasUseLanguageContext && p.analysis.hasTranslationProps)
);

const partiallyIntegratedPages = analyses.filter(p => 
  !wellIntegratedPages.includes(p) && 
  (p.analysis.hasLanguageParam || p.analysis.hasTranslationProps)
);

const notIntegratedPages = analyses.filter(p => 
  !wellIntegratedPages.includes(p) && 
  !partiallyIntegratedPages.includes(p)
);

console.log('🔍 Language Switching Integration Analysis:\n');

console.log(`✅ Well Integrated Pages (${wellIntegratedPages.length}):`);
wellIntegratedPages.forEach(page => {
  console.log(`  - ${page.route} (${page.analysis.path})`);
});
console.log();

if (partiallyIntegratedPages.length > 0) {
  console.log(`⚠️  Partially Integrated Pages (${partiallyIntegratedPages.length}):`);
  partiallyIntegratedPages.forEach(page => {
    console.log(`  - ${page.route} (${page.analysis.path})`);
  });
  console.log();
}

if (notIntegratedPages.length > 0) {
  console.log(`❌ Not Integrated Pages (${notIntegratedPages.length}):`);
  notIntegratedPages.forEach(page => {
    console.log(`  - ${page.route} (${page.analysis.path})`);
  });
  console.log();
}

// Check for specific features
console.log('🔧 Feature Analysis:\n');

const featuresCheck = {
  'Language Page Wrapper': analyses.filter(p => p.analysis.hasLanguagePageWrapper).length,
  'Language Context Hook': analyses.filter(p => p.analysis.hasUseLanguageContext).length,
  'Translation Props': analyses.filter(p => p.analysis.hasTranslationProps).length,
  'Metadata Generation': analyses.filter(p => p.analysis.hasMetadataGeneration).length,
  'Scroll Preservation': analyses.filter(p => p.analysis.hasScrollPreservation).length,
  'Language Switcher': analyses.filter(p => p.analysis.hasLanguageSwitcher).length,
  'Error Boundaries': analyses.filter(p => p.analysis.hasErrorBoundary).length,
  'Loading States': analyses.filter(p => p.analysis.hasLoadingStates).length,
  'Fallback Handling': analyses.filter(p => p.analysis.hasFallbackHandling).length
};

Object.entries(featuresCheck).forEach(([feature, count]) => {
  const percentage = Math.round((count / protectedPages.length) * 100);
  const status = percentage >= 80 ? '✅' : percentage >= 50 ? '⚠️' : '❌';
  console.log(`${status} ${feature}: ${count}/${protectedPages.length} (${percentage}%)`);
});

// Test edge cases
console.log('\n🧪 Edge Cases Analysis:\n');

// Check for exam/test pages (critical for language switching)
const examPages = analyses.filter(p => 
  p.route.includes('test') || 
  p.route.includes('exam') || 
  p.route.includes('challenge')
);

console.log(`🎯 Exam/Test Pages (${examPages.length}):`);
examPages.forEach(page => {
  const integration = wellIntegratedPages.includes(page) ? '✅' : 
                     partiallyIntegratedPages.includes(page) ? '⚠️' : '❌';
  console.log(`  ${integration} ${page.route}`);
});
console.log();

// Check for results/review pages
const resultPages = analyses.filter(p => 
  p.route.includes('result') || 
  p.route.includes('review') || 
  p.route.includes('answer')
);

console.log(`📊 Results/Review Pages (${resultPages.length}):`);
resultPages.forEach(page => {
  const integration = wellIntegratedPages.includes(page) ? '✅' : 
                     partiallyIntegratedPages.includes(page) ? '⚠️' : '❌';
  console.log(`  ${integration} ${page.route}`);
});
console.log();

// Check for settings/profile pages
const settingsPages = analyses.filter(p => 
  p.route.includes('setting') || 
  p.route.includes('profile') || 
  p.route.includes('account')
);

console.log(`⚙️  Settings/Profile Pages (${settingsPages.length}):`);
settingsPages.forEach(page => {
  const integration = wellIntegratedPages.includes(page) ? '✅' : 
                     partiallyIntegratedPages.includes(page) ? '⚠️' : '❌';
  console.log(`  ${integration} ${page.route}`);
});

// Summary and recommendations
console.log('\n=== SUMMARY & RECOMMENDATIONS ===');

const integrationScore = Math.round((wellIntegratedPages.length / protectedPages.length) * 100);
const criticalPagesIntegrated = [...examPages, ...resultPages].filter(p => wellIntegratedPages.includes(p)).length;
const totalCriticalPages = [...examPages, ...resultPages].length;

console.log(`📈 Integration Score: ${integrationScore}% (${wellIntegratedPages.length}/${protectedPages.length})`);

if (totalCriticalPages > 0) {
  const criticalScore = Math.round((criticalPagesIntegrated / totalCriticalPages) * 100);
  console.log(`🎯 Critical Pages Score: ${criticalScore}% (${criticalPagesIntegrated}/${totalCriticalPages})`);
}

console.log('\n🔧 Recommendations:');

if (integrationScore >= 90) {
  console.log('✅ Excellent language switching integration!');
  console.log('✅ Most protected pages support language switching');
} else if (integrationScore >= 70) {
  console.log('👍 Good language switching integration');
  console.log('⚠️  Consider improving integration for remaining pages');
} else {
  console.log('⚠️  Language switching integration needs improvement');
  console.log('❌ Many protected pages lack proper language support');
}

if (notIntegratedPages.length > 0) {
  console.log(`\n🔨 Priority fixes needed for ${notIntegratedPages.length} pages:`);
  notIntegratedPages.slice(0, 5).forEach(page => {
    console.log(`  - Add LanguagePageWrapper to ${page.route}`);
  });
  if (notIntegratedPages.length > 5) {
    console.log(`  ... and ${notIntegratedPages.length - 5} more pages`);
  }
}

// Context maintenance check
console.log('\n🔄 Context Maintenance Features:');
const contextFeatures = [
  { name: 'Language Page Wrapper', count: featuresCheck['Language Page Wrapper'] },
  { name: 'Scroll Preservation', count: featuresCheck['Scroll Preservation'] },
  { name: 'Error Boundaries', count: featuresCheck['Error Boundaries'] },
  { name: 'Loading States', count: featuresCheck['Loading States'] }
];

contextFeatures.forEach(feature => {
  const percentage = Math.round((feature.count / protectedPages.length) * 100);
  const status = percentage >= 80 ? '✅' : percentage >= 50 ? '⚠️' : '❌';
  console.log(`${status} ${feature.name}: ${percentage}% coverage`);
});

console.log('\n🎯 Overall Status:');
if (integrationScore >= 90 && criticalScore >= 90) {
  console.log('🏆 Language switching is production-ready!');
} else if (integrationScore >= 70) {
  console.log('👍 Language switching is mostly ready with minor improvements needed');
} else {
  console.log('⚠️  Language switching needs significant improvements before production');
}

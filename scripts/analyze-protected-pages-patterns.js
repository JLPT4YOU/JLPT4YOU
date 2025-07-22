#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('=== PROTECTED PAGES PATTERNS ANALYSIS ===\n');

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

// Function to analyze translation pattern in a page
function analyzeTranslationPattern(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const relativePath = path.relative(process.cwd(), filePath);
  
  return {
    path: relativePath,
    
    // Server-side patterns
    hasLoadTranslation: content.includes('loadTranslation'),
    hasGenerateMetadata: content.includes('generateMetadata'),
    hasTranslationProps: content.includes('translations:') || content.includes('translations '),
    hasCreateTranslationFunction: content.includes('createTranslationFunction'),
    hasServerSideLoading: content.includes('await loadTranslation'),
    
    // Client-side patterns
    hasUseTranslations: content.includes('useTranslations'),
    hasUseLanguageContext: content.includes('useLanguageContext'),
    hasLanguagePageWrapper: content.includes('LanguagePageWrapper'),
    
    // Component patterns
    hasProtectedRoute: content.includes('ProtectedRoute'),
    hasClientDirective: content.includes('"use client"'),
    
    // Language switching support
    hasLanguageSwitcher: content.includes('LanguageSwitcher'),
    hasLanguageParam: content.includes('params') && content.includes('lang'),
    hasGetLanguageFromCode: content.includes('getLanguageFromCode'),
    
    // SEO and metadata
    hasAlternateLanguages: content.includes('alternates') && content.includes('languages'),
    hasHreflangLinks: content.includes('hreflang'),
    
    // Static generation
    hasGenerateStaticParams: content.includes('generateStaticParams'),
    hasDynamicConfig: content.includes('dynamic ='),
    
    // Error handling
    hasNotFound: content.includes('notFound'),
    hasErrorHandling: content.includes('try') && content.includes('catch'),
    
    // Content structure
    hasContentComponent: content.includes('Content'),
    passesLanguageToComponent: content.includes('language={') || content.includes('language:'),
    passesTranslationsToComponent: content.includes('translations={')
  };
}

// Categorize pages by pattern type
function categorizePages(analyses) {
  const categories = {
    serverSide: [],
    clientSide: [],
    hybrid: [],
    noTranslation: []
  };
  
  analyses.forEach(analysis => {
    const isServerSide = analysis.hasServerSideLoading || analysis.hasLoadTranslation;
    const isClientSide = analysis.hasUseTranslations || analysis.hasUseLanguageContext;
    
    if (isServerSide && isClientSide) {
      categories.hybrid.push(analysis);
    } else if (isServerSide) {
      categories.serverSide.push(analysis);
    } else if (isClientSide) {
      categories.clientSide.push(analysis);
    } else {
      categories.noTranslation.push(analysis);
    }
  });
  
  return categories;
}

// Analyze language switching capabilities
function analyzeLanguageSwitching(analyses) {
  const capabilities = {
    fullSupport: [],
    partialSupport: [],
    noSupport: []
  };
  
  analyses.forEach(analysis => {
    const hasTranslation = analysis.hasServerSideLoading || analysis.hasUseTranslations;
    const hasLanguageParam = analysis.hasLanguageParam;
    const hasMetadata = analysis.hasGenerateMetadata;
    
    const score = [hasTranslation, hasLanguageParam, hasMetadata].filter(Boolean).length;
    
    if (score >= 3) {
      capabilities.fullSupport.push(analysis);
    } else if (score >= 1) {
      capabilities.partialSupport.push(analysis);
    } else {
      capabilities.noSupport.push(analysis);
    }
  });
  
  return capabilities;
}

// Main analysis function
function runAnalysis() {
  console.log('📊 Finding and analyzing protected pages...\n');
  
  // Find all protected pages
  const protectedPages = findProtectedPages();
  console.log(`Found ${protectedPages.length} protected pages:\n`);
  
  // Analyze each page
  const analyses = protectedPages.map(page => ({
    ...page,
    analysis: analyzeTranslationPattern(page.filePath)
  }));
  
  // Show all pages
  analyses.forEach(page => {
    console.log(`  - ${page.route} (${page.analysis.path})`);
  });
  
  console.log('\n' + '='.repeat(60));
  
  // Categorize by pattern type
  const categories = categorizePages(analyses.map(p => p.analysis));
  
  console.log('\n🔍 Pattern Analysis:\n');
  
  console.log(`📄 Server-side Pattern (${categories.serverSide.length} pages):`);
  console.log('  - Uses loadTranslation() in page component');
  console.log('  - Passes translations as props to client components');
  console.log('  - Has generateMetadata() for SEO');
  console.log('  - Static generation with generateStaticParams()');
  if (categories.serverSide.length > 0) {
    console.log('  Examples:');
    categories.serverSide.slice(0, 3).forEach(p => {
      console.log(`    - ${p.path}`);
    });
  }
  
  console.log(`\n💻 Client-side Pattern (${categories.clientSide.length} pages):`);
  console.log('  - Uses useTranslations() or useLanguageContext()');
  console.log('  - Dynamic translation loading');
  console.log('  - Real-time language switching');
  console.log('  - May use LanguagePageWrapper');
  if (categories.clientSide.length > 0) {
    console.log('  Examples:');
    categories.clientSide.slice(0, 3).forEach(p => {
      console.log(`    - ${p.path}`);
    });
  }
  
  console.log(`\n🔄 Hybrid Pattern (${categories.hybrid.length} pages):`);
  console.log('  - Combines server-side and client-side approaches');
  console.log('  - Initial translations from server, dynamic switching on client');
  console.log('  - Best of both worlds for SEO and UX');
  if (categories.hybrid.length > 0) {
    console.log('  Examples:');
    categories.hybrid.slice(0, 3).forEach(p => {
      console.log(`    - ${p.path}`);
    });
  }
  
  console.log(`\n❌ No Translation (${categories.noTranslation.length} pages):`);
  console.log('  - No translation integration detected');
  console.log('  - Needs implementation');
  if (categories.noTranslation.length > 0) {
    console.log('  Examples:');
    categories.noTranslation.slice(0, 3).forEach(p => {
      console.log(`    - ${p.path}`);
    });
  }
  
  // Analyze language switching capabilities
  console.log('\n' + '='.repeat(60));
  const capabilities = analyzeLanguageSwitching(analyses.map(p => p.analysis));
  
  console.log('\n🌐 Language Switching Capabilities:\n');
  
  console.log(`✅ Full Support (${capabilities.fullSupport.length} pages):`);
  console.log('  - Translation loading ✓');
  console.log('  - Language parameter handling ✓');
  console.log('  - SEO metadata ✓');
  if (capabilities.fullSupport.length > 0) {
    capabilities.fullSupport.slice(0, 5).forEach(p => {
      console.log(`    - ${p.path}`);
    });
  }
  
  console.log(`\n⚠️  Partial Support (${capabilities.partialSupport.length} pages):`);
  console.log('  - Some language switching features missing');
  if (capabilities.partialSupport.length > 0) {
    capabilities.partialSupport.slice(0, 5).forEach(p => {
      console.log(`    - ${p.path}`);
    });
  }
  
  console.log(`\n❌ No Support (${capabilities.noSupport.length} pages):`);
  console.log('  - No language switching capabilities');
  if (capabilities.noSupport.length > 0) {
    capabilities.noSupport.slice(0, 5).forEach(p => {
      console.log(`    - ${p.path}`);
    });
  }
  
  // Feature analysis
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Feature Analysis:\n');
  
  const features = {
    'Server-side loading': analyses.filter(p => p.analysis.hasServerSideLoading).length,
    'Client-side hooks': analyses.filter(p => p.analysis.hasUseTranslations).length,
    'Metadata generation': analyses.filter(p => p.analysis.hasGenerateMetadata).length,
    'Protected routes': analyses.filter(p => p.analysis.hasProtectedRoute).length,
    'Language parameters': analyses.filter(p => p.analysis.hasLanguageParam).length,
    'Static generation': analyses.filter(p => p.analysis.hasGenerateStaticParams).length,
    'Error handling': analyses.filter(p => p.analysis.hasErrorHandling).length,
    'SEO alternates': analyses.filter(p => p.analysis.hasAlternateLanguages).length
  };
  
  Object.entries(features).forEach(([feature, count]) => {
    const percentage = Math.round((count / analyses.length) * 100);
    const status = percentage >= 80 ? '✅' : percentage >= 50 ? '⚠️' : '❌';
    console.log(`${status} ${feature}: ${count}/${analyses.length} (${percentage}%)`);
  });
  
  return {
    totalPages: analyses.length,
    categories,
    capabilities,
    features,
    analyses
  };
}

// Run the analysis
const results = runAnalysis();

// Recommendations
console.log('\n' + '='.repeat(60));
console.log('\n💡 RECOMMENDATIONS:\n');

const { categories, capabilities } = results;

if (categories.serverSide.length > categories.clientSide.length) {
  console.log('🎯 **Recommended Pattern: Enhanced Server-side**');
  console.log('  - Majority of pages use server-side pattern');
  console.log('  - Enhance with client-side language switching');
  console.log('  - Maintain SEO benefits while adding dynamic capabilities');
} else if (categories.clientSide.length > categories.serverSide.length) {
  console.log('🎯 **Recommended Pattern: Enhanced Client-side**');
  console.log('  - Majority of pages use client-side pattern');
  console.log('  - Add server-side rendering for SEO');
  console.log('  - Implement hybrid approach for best performance');
} else {
  console.log('🎯 **Recommended Pattern: Hybrid Approach**');
  console.log('  - Mixed patterns detected');
  console.log('  - Standardize on hybrid approach');
  console.log('  - Server-side initial load + client-side switching');
}

console.log('\n📋 Implementation Priority:');
console.log(`1. Fix ${capabilities.noSupport.length} pages with no language support`);
console.log(`2. Enhance ${capabilities.partialSupport.length} pages with partial support`);
console.log(`3. Standardize ${capabilities.fullSupport.length} pages with full support`);

console.log('\n🎯 Next Steps:');
console.log('1. Design unified pattern based on analysis');
console.log('2. Create reusable components/hooks');
console.log('3. Implement pattern in priority order');
console.log('4. Test language switching functionality');

console.log(`\n📈 Success Metrics:`);
console.log(`- Target: 100% pages with language switching support`);
console.log(`- Current: ${Math.round((capabilities.fullSupport.length / results.totalPages) * 100)}% full support`);
console.log(`- Gap: ${capabilities.noSupport.length + capabilities.partialSupport.length} pages need work`);

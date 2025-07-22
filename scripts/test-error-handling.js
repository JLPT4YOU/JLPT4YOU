#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('=== ERROR HANDLING & UX TESTING ===\n');

// Function to find all files with error handling
function findErrorHandlingFiles() {
  const files = [];
  
  function scanDirectory(dir) {
    try {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          scanDirectory(fullPath);
        } else if (item.endsWith('.tsx') || item.endsWith('.ts')) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Directory might not exist
    }
  }
  
  scanDirectory('./src');
  return files;
}

// Function to analyze error handling in a file
function analyzeErrorHandling(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const relativePath = path.relative(process.cwd(), filePath);
  
  return {
    path: relativePath,
    hasTryCatch: content.includes('try {') && content.includes('catch'),
    hasErrorBoundary: content.includes('ErrorBoundary') || content.includes('componentDidCatch'),
    hasErrorState: content.includes('error') && (content.includes('useState') || content.includes('setError')),
    hasLoadingState: content.includes('loading') && (content.includes('useState') || content.includes('isLoading')),
    hasRetryMechanism: content.includes('retry') || content.includes('Retry') || content.includes('refetch'),
    hasFallbackUI: content.includes('fallback') || content.includes('Fallback'),
    hasSuspense: content.includes('Suspense'),
    hasTranslationErrorHandling: content.includes('translation') && content.includes('error'),
    hasNetworkErrorHandling: content.includes('fetch') && content.includes('catch'),
    hasValidation: content.includes('validate') || content.includes('schema') || content.includes('zod'),
    hasUserFeedback: content.includes('toast') || content.includes('alert') || content.includes('notification'),
    isTranslationRelated: content.includes('translation') || content.includes('i18n') || content.includes('language'),
    isContextFile: relativePath.includes('context'),
    isHookFile: relativePath.includes('hook') || relativePath.includes('use-'),
    isComponentFile: relativePath.includes('component')
  };
}

// Analyze all files
const allFiles = findErrorHandlingFiles();
const analyses = allFiles.map(analyzeErrorHandling);

// Filter for relevant files
const translationFiles = analyses.filter(a => a.isTranslationRelated);
const contextFiles = analyses.filter(a => a.isContextFile);
const hookFiles = analyses.filter(a => a.isHookFile);
const componentFiles = analyses.filter(a => a.isComponentFile);

console.log('📊 Error Handling Analysis Summary:');
console.log(`Total files analyzed: ${analyses.length}`);
console.log(`Translation-related files: ${translationFiles.length}`);
console.log(`Context files: ${contextFiles.length}`);
console.log(`Hook files: ${hookFiles.length}`);
console.log(`Component files: ${componentFiles.length}\n`);

// Check error handling patterns
console.log('🔍 Error Handling Patterns:\n');

const errorHandlingFeatures = {
  'Try-Catch Blocks': analyses.filter(a => a.hasTryCatch).length,
  'Error Boundaries': analyses.filter(a => a.hasErrorBoundary).length,
  'Error States': analyses.filter(a => a.hasErrorState).length,
  'Loading States': analyses.filter(a => a.hasLoadingState).length,
  'Retry Mechanisms': analyses.filter(a => a.hasRetryMechanism).length,
  'Fallback UI': analyses.filter(a => a.hasFallbackUI).length,
  'Suspense': analyses.filter(a => a.hasSuspense).length,
  'Translation Error Handling': analyses.filter(a => a.hasTranslationErrorHandling).length,
  'Network Error Handling': analyses.filter(a => a.hasNetworkErrorHandling).length,
  'Validation': analyses.filter(a => a.hasValidation).length,
  'User Feedback': analyses.filter(a => a.hasUserFeedback).length
};

Object.entries(errorHandlingFeatures).forEach(([feature, count]) => {
  const percentage = Math.round((count / analyses.length) * 100);
  const status = percentage >= 10 ? '✅' : percentage >= 5 ? '⚠️' : '❌';
  console.log(`${status} ${feature}: ${count} files (${percentage}%)`);
});

// Focus on translation-related error handling
console.log('\n🌐 Translation Error Handling Analysis:\n');

if (translationFiles.length > 0) {
  console.log(`Found ${translationFiles.length} translation-related files:`);
  
  const translationErrorHandling = {
    'Try-Catch': translationFiles.filter(a => a.hasTryCatch).length,
    'Error States': translationFiles.filter(a => a.hasErrorState).length,
    'Loading States': translationFiles.filter(a => a.hasLoadingState).length,
    'Retry Mechanisms': translationFiles.filter(a => a.hasRetryMechanism).length,
    'Fallback UI': translationFiles.filter(a => a.hasFallbackUI).length
  };
  
  Object.entries(translationErrorHandling).forEach(([feature, count]) => {
    const percentage = Math.round((count / translationFiles.length) * 100);
    const status = percentage >= 80 ? '✅' : percentage >= 50 ? '⚠️' : '❌';
    console.log(`  ${status} ${feature}: ${count}/${translationFiles.length} (${percentage}%)`);
  });
  
  // Show files with good error handling
  const wellHandledFiles = translationFiles.filter(a => 
    a.hasTryCatch && a.hasErrorState && a.hasLoadingState
  );
  
  if (wellHandledFiles.length > 0) {
    console.log(`\n✅ Well-handled translation files (${wellHandledFiles.length}):`);
    wellHandledFiles.forEach(f => {
      console.log(`  - ${f.path}`);
    });
  }
  
  // Show files needing improvement
  const needsImprovementFiles = translationFiles.filter(a => 
    !a.hasTryCatch || !a.hasErrorState || !a.hasLoadingState
  );
  
  if (needsImprovementFiles.length > 0) {
    console.log(`\n⚠️  Translation files needing improvement (${needsImprovementFiles.length}):`);
    needsImprovementFiles.slice(0, 5).forEach(f => {
      const missing = [];
      if (!f.hasTryCatch) missing.push('try-catch');
      if (!f.hasErrorState) missing.push('error state');
      if (!f.hasLoadingState) missing.push('loading state');
      console.log(`  - ${f.path} (missing: ${missing.join(', ')})`);
    });
    if (needsImprovementFiles.length > 5) {
      console.log(`  ... and ${needsImprovementFiles.length - 5} more files`);
    }
  }
} else {
  console.log('⚠️  No translation-related files found');
}

// Check for error boundaries
console.log('\n🛡️  Error Boundary Analysis:\n');

const errorBoundaryFiles = analyses.filter(a => a.hasErrorBoundary);
if (errorBoundaryFiles.length > 0) {
  console.log(`✅ Found ${errorBoundaryFiles.length} files with error boundaries:`);
  errorBoundaryFiles.forEach(f => {
    console.log(`  - ${f.path}`);
  });
} else {
  console.log('⚠️  No error boundaries found');
}

// Check for loading states
console.log('\n⏳ Loading States Analysis:\n');

const loadingStateFiles = analyses.filter(a => a.hasLoadingState);
if (loadingStateFiles.length > 0) {
  console.log(`✅ Found ${loadingStateFiles.length} files with loading states:`);
  loadingStateFiles.slice(0, 10).forEach(f => {
    console.log(`  - ${f.path}`);
  });
  if (loadingStateFiles.length > 10) {
    console.log(`  ... and ${loadingStateFiles.length - 10} more files`);
  }
} else {
  console.log('⚠️  No loading states found');
}

// Check for user feedback mechanisms
console.log('\n📢 User Feedback Analysis:\n');

const userFeedbackFiles = analyses.filter(a => a.hasUserFeedback);
if (userFeedbackFiles.length > 0) {
  console.log(`✅ Found ${userFeedbackFiles.length} files with user feedback:`);
  userFeedbackFiles.slice(0, 5).forEach(f => {
    console.log(`  - ${f.path}`);
  });
  if (userFeedbackFiles.length > 5) {
    console.log(`  ... and ${userFeedbackFiles.length - 5} more files`);
  }
} else {
  console.log('⚠️  No user feedback mechanisms found');
}

// Summary and recommendations
console.log('\n=== SUMMARY & RECOMMENDATIONS ===');

const criticalFeatures = [
  'Try-Catch Blocks',
  'Error States', 
  'Loading States',
  'Translation Error Handling'
];

const criticalScore = criticalFeatures.reduce((score, feature) => {
  const count = errorHandlingFeatures[feature];
  const percentage = (count / analyses.length) * 100;
  return score + (percentage >= 10 ? 25 : percentage >= 5 ? 15 : 0);
}, 0);

console.log(`📈 Error Handling Score: ${criticalScore}/100`);

if (criticalScore >= 80) {
  console.log('✅ Excellent error handling implementation!');
  console.log('✅ Most critical error handling patterns are present');
} else if (criticalScore >= 60) {
  console.log('👍 Good error handling with room for improvement');
  console.log('⚠️  Some critical patterns could be enhanced');
} else {
  console.log('⚠️  Error handling needs significant improvement');
  console.log('❌ Many critical error handling patterns are missing');
}

console.log('\n🔧 Priority Recommendations:');

if (errorHandlingFeatures['Error Boundaries'] === 0) {
  console.log('  1. Implement error boundaries for better error isolation');
}

if (errorHandlingFeatures['Translation Error Handling'] < 3) {
  console.log('  2. Add comprehensive translation error handling');
}

if (errorHandlingFeatures['Loading States'] < analyses.length * 0.1) {
  console.log('  3. Implement loading states for better UX');
}

if (errorHandlingFeatures['User Feedback'] === 0) {
  console.log('  4. Add user feedback mechanisms (toasts, alerts)');
}

if (errorHandlingFeatures['Retry Mechanisms'] < 3) {
  console.log('  5. Implement retry mechanisms for failed operations');
}

console.log('\n🎯 Overall Status:');
if (criticalScore >= 80) {
  console.log('🏆 Error handling is production-ready!');
} else if (criticalScore >= 60) {
  console.log('👍 Error handling is mostly ready with minor improvements needed');
} else {
  console.log('⚠️  Error handling needs significant improvements before production');
}

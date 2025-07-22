#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('=== COMPONENTS TRANSLATION INTEGRATION AUDIT ===\n');

// Function to find all component files
function findComponentFiles() {
  const componentsDir = './src/components';
  const files = [];
  
  function scanDirectory(dir) {
    try {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          scanDirectory(fullPath);
        } else if (item.endsWith('.tsx') || item.endsWith('.ts')) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      console.error(`Error scanning ${dir}:`, error.message);
    }
  }
  
  scanDirectory(componentsDir);
  return files;
}

// Function to analyze component translation integration
function analyzeComponent(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const relativePath = path.relative(process.cwd(), filePath);
  const componentName = path.basename(filePath, path.extname(filePath));
  
  return {
    path: relativePath,
    name: componentName,
    
    // Translation integration patterns
    hasUseTranslations: content.includes('useTranslations'),
    hasUseLanguageContext: content.includes('useLanguageContext'),
    hasTranslationProps: content.includes('translations:') || content.includes('translations '),
    hasCreateTranslationFunction: content.includes('createTranslationFunction'),
    hasGetText: content.includes('getText'),
    hasLanguagePageWrapper: content.includes('LanguagePageWrapper'),
    
    // Component characteristics
    isClientComponent: content.includes('"use client"'),
    isUIComponent: relativePath.includes('/ui/'),
    isLayoutComponent: relativePath.includes('/layout/'),
    isAuthComponent: relativePath.includes('/auth/'),
    isChatComponent: relativePath.includes('/chat/'),
    isExamComponent: relativePath.includes('/exam') || relativePath.includes('/test'),
    
    // Text content analysis
    hasHardcodedText: false,
    hardcodedTexts: [],
    hasVietnameseText: false,
    vietnameseTexts: [],
    
    // Integration quality
    integrationLevel: 'none', // none, basic, good, excellent
    needsWork: false,
    priority: 'low' // low, medium, high, critical
  };
}

// Enhanced text analysis
function enhanceTextAnalysis(analysis, content) {
  // Check for hardcoded text patterns
  const hardcodedPatterns = [
    /["']([A-Z][a-z\s]{10,})["']/g, // English sentences
    /["']([^"']*(?:Login|Register|Password|Email|Submit|Cancel|Save|Delete|Edit|Create|Update)[^"']*)["']/gi,
    /placeholder=["']([^"']+)["']/gi,
    /title=["']([^"']+)["']/gi,
    /aria-label=["']([^"']+)["']/gi
  ];
  
  for (const pattern of hardcodedPatterns) {
    const matches = content.match(pattern);
    if (matches) {
      analysis.hasHardcodedText = true;
      analysis.hardcodedTexts.push(...matches.slice(0, 3));
    }
  }
  
  // Check for Vietnamese text
  const vietnamesePatterns = [
    /["']([^"']*[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ][^"']*)["']/gi,
    /["'](Đăng [^"']*|Nhập [^"']*|Mật khẩu[^"']*|Email [^"']*|Trang [^"']*|Bắt đầu[^"']*|Luyện [^"']*|Học [^"']*|Thi [^"']*|Kết quả[^"']*|Xem [^"']*)["']/gi
  ];
  
  for (const pattern of vietnamesePatterns) {
    const matches = content.match(pattern);
    if (matches) {
      analysis.hasVietnameseText = true;
      analysis.vietnameseTexts.push(...matches.slice(0, 3));
    }
  }
  
  return analysis;
}

// Determine integration level and priority
function determineIntegrationLevel(analysis) {
  const hasAnyIntegration = analysis.hasUseTranslations || 
                           analysis.hasUseLanguageContext || 
                           analysis.hasTranslationProps || 
                           analysis.hasCreateTranslationFunction ||
                           analysis.hasGetText;
  
  if (!hasAnyIntegration) {
    analysis.integrationLevel = 'none';
  } else if (analysis.hasUseTranslations || analysis.hasUseLanguageContext) {
    analysis.integrationLevel = 'excellent';
  } else if (analysis.hasTranslationProps || analysis.hasCreateTranslationFunction) {
    analysis.integrationLevel = 'good';
  } else {
    analysis.integrationLevel = 'basic';
  }
  
  // Determine priority
  if (analysis.hasVietnameseText) {
    analysis.priority = 'critical';
  } else if (analysis.hasHardcodedText && (analysis.isAuthComponent || analysis.isExamComponent)) {
    analysis.priority = 'high';
  } else if (analysis.hasHardcodedText) {
    analysis.priority = 'medium';
  } else if (analysis.integrationLevel === 'none' && !analysis.isUIComponent) {
    analysis.priority = 'medium';
  } else {
    analysis.priority = 'low';
  }
  
  analysis.needsWork = analysis.integrationLevel === 'none' || 
                      analysis.hasVietnameseText || 
                      analysis.hasHardcodedText;
  
  return analysis;
}

// Main analysis function
function runComponentsAudit() {
  console.log('📊 Finding and analyzing components...\n');
  
  // Find all component files
  const componentFiles = findComponentFiles();
  console.log(`Found ${componentFiles.length} component files\n`);
  
  // Analyze each component
  const analyses = componentFiles.map(filePath => {
    const content = fs.readFileSync(filePath, 'utf8');
    let analysis = analyzeComponent(filePath);
    analysis = enhanceTextAnalysis(analysis, content);
    analysis = determineIntegrationLevel(analysis);
    return analysis;
  });
  
  // Categorize components
  const categories = {
    excellent: analyses.filter(a => a.integrationLevel === 'excellent'),
    good: analyses.filter(a => a.integrationLevel === 'good'),
    basic: analyses.filter(a => a.integrationLevel === 'basic'),
    none: analyses.filter(a => a.integrationLevel === 'none')
  };
  
  const priorities = {
    critical: analyses.filter(a => a.priority === 'critical'),
    high: analyses.filter(a => a.priority === 'high'),
    medium: analyses.filter(a => a.priority === 'medium'),
    low: analyses.filter(a => a.priority === 'low')
  };
  
  // Report results
  console.log('🔍 Integration Level Analysis:\n');
  
  console.log(`✅ Excellent Integration (${categories.excellent.length} components):`);
  console.log('  - Uses useTranslations or useLanguageContext');
  console.log('  - Dynamic language switching support');
  if (categories.excellent.length > 0) {
    categories.excellent.slice(0, 5).forEach(c => {
      console.log(`    - ${c.name} (${c.path})`);
    });
    if (categories.excellent.length > 5) {
      console.log(`    ... and ${categories.excellent.length - 5} more`);
    }
  }
  
  console.log(`\n👍 Good Integration (${categories.good.length} components):`);
  console.log('  - Uses translation props or createTranslationFunction');
  console.log('  - Static translation support');
  if (categories.good.length > 0) {
    categories.good.slice(0, 5).forEach(c => {
      console.log(`    - ${c.name} (${c.path})`);
    });
    if (categories.good.length > 5) {
      console.log(`    ... and ${categories.good.length - 5} more`);
    }
  }
  
  console.log(`\n⚠️  Basic Integration (${categories.basic.length} components):`);
  console.log('  - Minimal translation support');
  console.log('  - Needs enhancement');
  if (categories.basic.length > 0) {
    categories.basic.slice(0, 5).forEach(c => {
      console.log(`    - ${c.name} (${c.path})`);
    });
  }
  
  console.log(`\n❌ No Integration (${categories.none.length} components):`);
  console.log('  - No translation support detected');
  console.log('  - Needs implementation');
  if (categories.none.length > 0) {
    categories.none.slice(0, 10).forEach(c => {
      console.log(`    - ${c.name} (${c.path})`);
    });
    if (categories.none.length > 10) {
      console.log(`    ... and ${categories.none.length - 10} more`);
    }
  }
  
  // Priority analysis
  console.log('\n🚨 Priority Analysis:\n');
  
  console.log(`🔥 Critical Priority (${priorities.critical.length} components):`);
  console.log('  - Contains Vietnamese hardcoded text');
  if (priorities.critical.length > 0) {
    priorities.critical.forEach(c => {
      console.log(`    - ${c.name}: ${c.vietnameseTexts.slice(0, 1).join(', ')}`);
    });
  }
  
  console.log(`\n⚡ High Priority (${priorities.high.length} components):`);
  console.log('  - Auth/Exam components with hardcoded text');
  if (priorities.high.length > 0) {
    priorities.high.slice(0, 5).forEach(c => {
      console.log(`    - ${c.name} (${c.path})`);
    });
  }
  
  console.log(`\n📋 Medium Priority (${priorities.medium.length} components):`);
  console.log('  - Components with hardcoded text or no integration');
  if (priorities.medium.length > 0) {
    priorities.medium.slice(0, 5).forEach(c => {
      console.log(`    - ${c.name} (${c.path})`);
    });
    if (priorities.medium.length > 5) {
      console.log(`    ... and ${priorities.medium.length - 5} more`);
    }
  }
  
  // Component type analysis
  console.log('\n📂 Component Type Analysis:\n');
  
  const types = {
    'UI Components': analyses.filter(a => a.isUIComponent),
    'Auth Components': analyses.filter(a => a.isAuthComponent),
    'Chat Components': analyses.filter(a => a.isChatComponent),
    'Exam Components': analyses.filter(a => a.isExamComponent),
    'Layout Components': analyses.filter(a => a.isLayoutComponent)
  };
  
  Object.entries(types).forEach(([type, components]) => {
    const needsWork = components.filter(c => c.needsWork).length;
    const percentage = components.length > 0 ? Math.round(((components.length - needsWork) / components.length) * 100) : 100;
    const status = percentage >= 80 ? '✅' : percentage >= 50 ? '⚠️' : '❌';
    console.log(`${status} ${type}: ${components.length - needsWork}/${components.length} integrated (${percentage}%)`);
  });
  
  return {
    total: analyses.length,
    categories,
    priorities,
    types,
    needsWork: analyses.filter(a => a.needsWork).length
  };
}

// Run the audit
const results = runComponentsAudit();

// Summary
console.log('\n=== SUMMARY ===');
console.log(`📊 Total Components: ${results.total}`);
console.log(`✅ Well Integrated: ${results.categories.excellent.length + results.categories.good.length}`);
console.log(`⚠️  Needs Work: ${results.needsWork}`);
console.log(`🔥 Critical Issues: ${results.priorities.critical.length}`);

const integrationRate = Math.round(((results.categories.excellent.length + results.categories.good.length) / results.total) * 100);
console.log(`\n📈 Integration Rate: ${integrationRate}%`);

if (integrationRate >= 80) {
  console.log('🏆 Excellent component integration!');
} else if (integrationRate >= 60) {
  console.log('👍 Good component integration with room for improvement');
} else {
  console.log('⚠️  Component integration needs significant work');
}

console.log('\n🎯 Next Steps:');
console.log(`1. Fix ${results.priorities.critical.length} critical components with Vietnamese text`);
console.log(`2. Enhance ${results.priorities.high.length} high-priority auth/exam components`);
console.log(`3. Improve ${results.priorities.medium.length} medium-priority components`);
console.log(`4. Standardize patterns across all component types`);

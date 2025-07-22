#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('=== LANGUAGE NAVIGATION TESTING ===\n');

// Mock URL generation functions (simulate the actual implementation)
function removeLanguageFromPath(pathname) {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length > 0 && ['vn', 'en', 'jp'].includes(segments[0])) {
    return '/' + segments.slice(1).join('/');
  }
  return pathname;
}

function getLocalizedPath(cleanPath, language) {
  // For auth pages, use language-prefixed URLs
  if (cleanPath === '' || cleanPath === '/' || 
      cleanPath === '/login' || cleanPath === '/register' || 
      cleanPath === '/forgot-password' || cleanPath === '/landing') {
    const authPath = cleanPath === '' || cleanPath === '/' ? '/login' : cleanPath;
    return `/auth/${language}${authPath}`;
  }
  
  // For other pages, use clean URLs for authenticated users
  return cleanPath;
}

function generateHreflangLinks(currentPath, baseUrl = 'https://jlpt4you.com') {
  const cleanPath = removeLanguageFromPath(currentPath);
  const languages = ['vn', 'en', 'jp'];
  const locales = {
    'vn': 'vi-VN',
    'en': 'en-US', 
    'jp': 'ja-JP'
  };
  
  return languages.map(lang => ({
    hreflang: locales[lang],
    href: `${baseUrl}${getLocalizedPath(cleanPath, lang)}`
  }));
}

// Test cases for different page types
const testCases = [
  {
    name: "Landing Page Navigation",
    currentPath: "/auth/vn/landing",
    expectedPaths: {
      vn: "/auth/vn/landing",
      en: "/auth/en/landing", 
      jp: "/auth/jp/landing"
    }
  },
  {
    name: "Login Page Navigation",
    currentPath: "/auth/jp/login",
    expectedPaths: {
      vn: "/auth/vn/login",
      en: "/auth/en/login",
      jp: "/auth/jp/login"
    }
  },
  {
    name: "Register Page Navigation", 
    currentPath: "/auth/en/register",
    expectedPaths: {
      vn: "/auth/vn/register",
      en: "/auth/en/register",
      jp: "/auth/jp/register"
    }
  },
  {
    name: "Home Page Navigation (Clean URL)",
    currentPath: "/home",
    expectedPaths: {
      vn: "/home",
      en: "/home",
      jp: "/home"
    }
  },
  {
    name: "JLPT Page Navigation (Clean URL)",
    currentPath: "/jlpt/custom/n3",
    expectedPaths: {
      vn: "/jlpt/custom/n3",
      en: "/jlpt/custom/n3", 
      jp: "/jlpt/custom/n3"
    }
  }
];

console.log('🧪 Testing Language Navigation:\n');

let passedTests = 0;
let totalTests = testCases.length;

testCases.forEach((testCase, index) => {
  console.log(`Test ${index + 1}: ${testCase.name}`);
  console.log(`Current Path: ${testCase.currentPath}`);
  
  const hreflangLinks = generateHreflangLinks(testCase.currentPath);
  let testPassed = true;
  
  // Check each language link
  ['vn', 'en', 'jp'].forEach(lang => {
    const expectedHref = `https://jlpt4you.com${testCase.expectedPaths[lang]}`;
    const actualLink = hreflangLinks.find(link => 
      link.hreflang === (lang === 'vn' ? 'vi-VN' : lang === 'en' ? 'en-US' : 'ja-JP')
    );
    
    if (!actualLink || actualLink.href !== expectedHref) {
      console.log(`  ❌ ${lang.toUpperCase()}: Expected "${expectedHref}", got "${actualLink?.href || 'undefined'}"`);
      testPassed = false;
    } else {
      console.log(`  ✅ ${lang.toUpperCase()}: ${actualLink.href}`);
    }
  });
  
  if (testPassed) {
    passedTests++;
    console.log(`  Status: ✅ PASS`);
  } else {
    console.log(`  Status: ❌ FAIL`);
  }
  
  console.log('---');
});

// Test hreflang attributes
console.log('\n🌐 Testing Hreflang Attributes:');

const samplePath = "/auth/vn/landing";
const hreflangLinks = generateHreflangLinks(samplePath);

console.log(`Sample path: ${samplePath}`);
console.log('Generated hreflang links:');

hreflangLinks.forEach(link => {
  console.log(`  hreflang="${link.hreflang}" href="${link.href}"`);
});

// Validate hreflang format
const validHreflangPattern = /^[a-z]{2}-[A-Z]{2}$/;
const invalidHreflang = hreflangLinks.filter(link => !validHreflangPattern.test(link.hreflang));

if (invalidHreflang.length === 0) {
  console.log('✅ All hreflang attributes have valid format');
} else {
  console.log('❌ Invalid hreflang attributes found:');
  invalidHreflang.forEach(link => {
    console.log(`  - ${link.hreflang}`);
  });
}

// Test URL structure consistency
console.log('\n🔗 Testing URL Structure Consistency:');

const urlTests = [
  { path: "/auth/vn/landing", shouldHaveLanguage: true },
  { path: "/auth/en/login", shouldHaveLanguage: true },
  { path: "/home", shouldHaveLanguage: false },
  { path: "/jlpt/custom/n3", shouldHaveLanguage: false }
];

urlTests.forEach(test => {
  const cleanPath = removeLanguageFromPath(test.path);
  const hasLanguageInOriginal = test.path !== cleanPath;
  
  if (test.shouldHaveLanguage === hasLanguageInOriginal) {
    console.log(`✅ ${test.path} - Correct structure`);
  } else {
    console.log(`❌ ${test.path} - Incorrect structure`);
  }
});

// Summary
console.log('\n=== SUMMARY ===');
console.log(`Navigation Tests: ${passedTests}/${totalTests} passed`);
console.log(`Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);

if (passedTests === totalTests) {
  console.log('\n✅ All navigation tests passed!');
  console.log('✅ Language switching works correctly');
  console.log('✅ URL structure is consistent');
  console.log('✅ Hreflang implementation is valid');
} else {
  console.log('\n⚠️  Some navigation tests failed');
  console.log('⚠️  Review the URL generation logic');
}

// Performance test
console.log('\n⚡ Performance Test:');
const startTime = Date.now();
const iterations = 1000;

for (let i = 0; i < iterations; i++) {
  generateHreflangLinks('/auth/vn/landing');
  generateHreflangLinks('/home');
  generateHreflangLinks('/jlpt/custom/n3');
}

const endTime = Date.now();
const avgTime = (endTime - startTime) / (iterations * 3);

console.log(`${iterations * 3} hreflang generations completed in ${endTime - startTime}ms`);
console.log(`Average time per generation: ${avgTime.toFixed(4)}ms`);

if (avgTime < 0.1) {
  console.log('✅ Performance is excellent!');
} else if (avgTime < 1) {
  console.log('✅ Performance is good.');
} else {
  console.log('⚠️  Performance might need optimization.');
}

#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('=== TRANSLATION FUNCTION TESTING ===\n');

// Mock translation data for testing
const mockVnTranslations = {
  common: {
    appName: "JLPT4YOU",
    loading: "Đang tải...",
    error: "Đã xảy ra lỗi"
  },
  auth: {
    login: "Đăng nhập",
    register: "Đăng ký"
  }
};

const mockEnTranslations = {
  common: {
    appName: "JLPT4YOU",
    loading: "Loading...",
    error: "An error occurred"
  },
  auth: {
    login: "Login"
    // Missing 'register' key to test fallback
  }
};

// Import the translation function (simulate)
function createTranslationFunction(translations, fallbackTranslations) {
  return function t(key) {
    const getValue = (translationsObj, translationKey) => {
      const keys = translationKey.split('.');
      let value = translationsObj;

      for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
          value = value[k];
        } else {
          return null;
        }
      }

      return value;
    };

    // Try primary translations first
    let value = getValue(translations, key);
    
    // If not found and fallback is available, try fallback
    if (value === null && fallbackTranslations) {
      value = getValue(fallbackTranslations, key);
      if (value !== null) {
        console.warn(`Translation key "${key}" not found in primary language, using fallback`);
      }
    }
    
    // If still not found, return the key as fallback
    if (value === null) {
      console.warn(`Translation key not found: ${key}`);
      return key;
    }

    return value;
  };
}

// Test cases
const testCases = [
  {
    name: "Valid key in primary language",
    key: "common.loading",
    expected: "Loading..."
  },
  {
    name: "Valid key missing in primary, exists in fallback",
    key: "auth.register",
    expected: "Đăng ký"
  },
  {
    name: "Invalid key (not in primary or fallback)",
    key: "nonexistent.key",
    expected: "nonexistent.key"
  },
  {
    name: "Nested key with partial path",
    key: "auth.nonexistent",
    expected: "auth.nonexistent"
  },
  {
    name: "Empty key",
    key: "",
    expected: ""
  },
  {
    name: "Key with dots but invalid structure",
    key: "common.loading.extra",
    expected: "common.loading.extra"
  }
];

console.log('🧪 Testing Translation Function:\n');

// Create translation function with fallback
const t = createTranslationFunction(mockEnTranslations, mockVnTranslations);

// Run tests
let passedTests = 0;
let totalTests = testCases.length;

testCases.forEach((testCase, index) => {
  console.log(`Test ${index + 1}: ${testCase.name}`);
  console.log(`Key: "${testCase.key}"`);
  
  const result = t(testCase.key);
  const passed = result === testCase.expected;
  
  console.log(`Expected: "${testCase.expected}"`);
  console.log(`Got: "${result}"`);
  console.log(`Status: ${passed ? '✅ PASS' : '❌ FAIL'}`);
  
  if (passed) {
    passedTests++;
  }
  
  console.log('---');
});

console.log('\n📊 Test Results:');
console.log(`Passed: ${passedTests}/${totalTests}`);
console.log(`Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);

if (passedTests === totalTests) {
  console.log('\n✅ All tests passed! Translation function works correctly.');
} else {
  console.log('\n⚠️  Some tests failed. Review the implementation.');
}

// Test performance with large number of translations
console.log('\n⚡ Performance Test:');
const startTime = Date.now();
const iterations = 10000;

for (let i = 0; i < iterations; i++) {
  t('common.loading');
  t('auth.register'); // Fallback case
  t('nonexistent.key'); // Missing key case
}

const endTime = Date.now();
const avgTime = (endTime - startTime) / iterations;

console.log(`${iterations} translation calls completed in ${endTime - startTime}ms`);
console.log(`Average time per translation: ${avgTime.toFixed(4)}ms`);

if (avgTime < 0.1) {
  console.log('✅ Performance is excellent!');
} else if (avgTime < 1) {
  console.log('✅ Performance is good.');
} else {
  console.log('⚠️  Performance might need optimization.');
}

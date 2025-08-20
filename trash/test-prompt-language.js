/**
 * Test script để kiểm tra prompt với các ngôn ngữ khác nhau
 */

// Mock localStorage cho testing
global.localStorage = {
  getItem: (key) => {
    const mockData = {
      'ai_language': 'english', // Test với English
      'ai_custom_language': ''
    };
    return mockData[key] || null;
  },
  setItem: () => {},
  removeItem: () => {}
};

// Mock window object
global.window = {};

// Import function (cần transpile ES6 modules)
const { generateExercisePrompt } = require('./src/lib/study/exercise-prompts.ts');

// Test data
const testParams = {
  level: 'n5',
  type: 'vocabulary',
  count: 3,
  difficulty: 'easy',
  materials: [
    { content: { word: '本', reading: 'ほん', meaning: 'book' } },
    { content: { word: '水', reading: 'みず', meaning: 'water' } }
  ],
  tags: ['basic']
};

console.log('🧪 Testing Exercise Prompt with Different Languages\n');

// Test 1: Default (should use English from localStorage)
console.log('📝 Test 1: Default language (English from settings)');
const prompt1 = generateExercisePrompt(testParams);
console.log('Language instruction found:', prompt1.includes('explanations in English'));
console.log('Contains English instruction:', prompt1.includes('explanations in English'));
console.log('---\n');

// Test 2: Override with Vietnamese
console.log('📝 Test 2: Override with Vietnamese');
const prompt2 = generateExercisePrompt({
  ...testParams,
  explanationLanguage: 'Tiếng Việt'
});
console.log('Contains Vietnamese instruction:', prompt2.includes('explanations in Vietnamese'));
console.log('---\n');

// Test 3: Override with Japanese
console.log('📝 Test 3: Override with Japanese');
const prompt3 = generateExercisePrompt({
  ...testParams,
  explanationLanguage: '日本語'
});
console.log('Contains Japanese instruction:', prompt3.includes('explanations in Japanese'));
console.log('---\n');

// Test 4: Custom language
console.log('📝 Test 4: Custom language (Korean)');
const prompt4 = generateExercisePrompt({
  ...testParams,
  explanationLanguage: 'Korean'
});
console.log('Contains Korean instruction:', prompt4.includes('explanations in Korean'));
console.log('---\n');

console.log('✅ All tests completed!');

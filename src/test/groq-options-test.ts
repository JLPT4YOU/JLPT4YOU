/**
 * Test script to verify Groq options conversion
 * This tests that our options are properly converted to Groq API format
 */

import { GroqService } from '../lib/groq-service';
import { createGroqConfig } from '../lib/groq-config';

// Test the options conversion
export function testGroqOptionsConversion() {
  console.log('🧪 Testing Groq Options Conversion...');
  
  // Test createGroqConfig with various options
  const testCases = [
    {
      name: 'Basic options',
      input: {
        model: 'llama-3.1-8b-instant',
        temperature: 0.7,
        maxTokens: 1000,
        topP: 0.9
      },
      expected: {
        model: 'llama-3.1-8b-instant',
        temperature: 0.7,
        max_completion_tokens: 1000,
        top_p: 0.9
      }
    },
    {
      name: 'Default config',
      input: {},
      expected: {
        temperature: 0.8,
        max_completion_tokens: 8192,
        model: 'llama-3.3-70b-versatile',
        top_p: 1,
        stream: true,
        stop: null
      }
    },
    {
      name: 'Partial options',
      input: {
        temperature: 0.5
      },
      expected: {
        temperature: 0.5,
        max_completion_tokens: 8192,
        model: 'llama-3.3-70b-versatile',
        top_p: 1,
        stream: true,
        stop: null
      }
    }
  ];
  
  testCases.forEach((testCase, index) => {
    console.log(`\n📝 Test ${index + 1}: ${testCase.name}`);
    console.log('Input:', testCase.input);
    
    const result = createGroqConfig(testCase.input);
    console.log('Output:', result);
    
    // Check if required fields are present and correctly formatted
    const hasCorrectTokenField = 'max_completion_tokens' in result && !('maxTokens' in result);
    const hasCorrectTopPField = 'top_p' in result && !('topP' in result);
    
    console.log(`✅ Correct token field: ${hasCorrectTokenField}`);
    console.log(`✅ Correct top_p field: ${hasCorrectTopPField}`);
    
    if (hasCorrectTokenField && hasCorrectTopPField) {
      console.log('✅ Test passed!');
    } else {
      console.log('❌ Test failed!');
    }
  });
  
  console.log('\n🎉 Options conversion test completed!');
}

// Test the service's convertOptions method
export function testServiceOptionsConversion() {
  console.log('\n🧪 Testing GroqService Options Conversion...');
  
  // Create a service instance (without API key for testing)
  const service = new (GroqService as any)();
  
  // Test the private convertOptions method
  const testOptions = {
    model: 'llama-3.1-8b-instant',
    temperature: 0.7,
    maxTokens: 1000,
    topP: 0.9,
    stop: ['<|end|>']
  };
  
  console.log('Input options:', testOptions);
  
  // Access private method for testing
  const convertedOptions = service.convertOptions(testOptions);
  console.log('Converted options:', convertedOptions);
  
  // Verify conversion
  const checks = [
    { name: 'maxTokens → max_completion_tokens', pass: convertedOptions.max_completion_tokens === 1000 },
    { name: 'topP → top_p', pass: convertedOptions.top_p === 0.9 },
    { name: 'temperature preserved', pass: convertedOptions.temperature === 0.7 },
    { name: 'model preserved', pass: convertedOptions.model === 'llama-3.1-8b-instant' },
    { name: 'stop preserved', pass: JSON.stringify(convertedOptions.stop) === JSON.stringify(['<|end|>']) },
    { name: 'no invalid fields', pass: !('maxTokens' in convertedOptions) && !('topP' in convertedOptions) }
  ];
  
  checks.forEach(check => {
    console.log(`${check.pass ? '✅' : '❌'} ${check.name}`);
  });
  
  const allPassed = checks.every(check => check.pass);
  console.log(`\n${allPassed ? '🎉' : '❌'} Service options conversion ${allPassed ? 'passed' : 'failed'}!`);
}

// Export for browser console testing
(window as any).testGroqOptions = testGroqOptionsConversion;
(window as any).testGroqServiceOptions = testServiceOptionsConversion;

console.log(`
🧪 Groq Options Test Script Loaded!

To test options conversion, run in console:
testGroqOptions()
testGroqServiceOptions()
`);

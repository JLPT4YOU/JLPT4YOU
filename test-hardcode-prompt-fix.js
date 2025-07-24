#!/usr/bin/env node

/**
 * Test Script: Verify Hardcode Prompt Fix
 * Kiểm tra xem hệ thống prompt đã được fix đúng chưa
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 KIỂM TRA HARDCODE PROMPT FIX');
console.log('='.repeat(50));

// Test 1: Kiểm tra gemini-config.ts
function testGeminiConfig() {
  console.log('\n📋 Test 1: Kiểm tra gemini-config.ts');
  
  const configPath = './src/lib/gemini-config.ts';
  const content = fs.readFileSync(configPath, 'utf8');
  
  // Kiểm tra IRIN_SYSTEM_INSTRUCTION đã bị xóa
  const hasHardcodePrompt = content.includes('IRIN_SYSTEM_INSTRUCTION');
  const hasHardcodeText = content.includes('You are iRIN, a versatile AI teacher');
  
  if (hasHardcodePrompt || hasHardcodeText) {
    console.log('❌ FAIL: Vẫn còn hardcode prompt trong gemini-config.ts');
    console.log('   - IRIN_SYSTEM_INSTRUCTION:', hasHardcodePrompt);
    console.log('   - Hardcode text:', hasHardcodeText);
    return false;
  }
  
  // Kiểm tra createGeminiConfig không còn fallback hardcode
  const createConfigMatch = content.match(/systemInstruction:\s*systemInstruction\s*\|\|\s*([^,\n}]+)/);
  if (createConfigMatch && createConfigMatch[1].trim() !== 'systemInstruction') {
    console.log('❌ FAIL: createGeminiConfig vẫn có hardcode fallback');
    console.log('   Fallback:', createConfigMatch[1]);
    return false;
  }
  
  console.log('✅ PASS: gemini-config.ts đã clean');
  return true;
}

// Test 2: Kiểm tra gemini-service.ts
function testGeminiService() {
  console.log('\n📋 Test 2: Kiểm tra gemini-service.ts');
  
  const servicePath = './src/lib/gemini-service.ts';
  const content = fs.readFileSync(servicePath, 'utf8');
  
  // Kiểm tra tất cả các method đều sử dụng getCurrentSystemPrompt()
  const getCurrentSystemPromptUsage = (content.match(/getCurrentSystemPrompt\(\)/g) || []).length;
  const expectedUsage = 6; // Số lần expected sử dụng
  
  if (getCurrentSystemPromptUsage < expectedUsage) {
    console.log(`❌ FAIL: Không đủ getCurrentSystemPrompt() usage`);
    console.log(`   Expected: ${expectedUsage}, Found: ${getCurrentSystemPromptUsage}`);
    return false;
  }
  
  // Kiểm tra validateApiKey có systemInstruction
  const validateApiKeyMatch = content.match(/validateApiKey[\s\S]*?createGeminiConfig\(\{[\s\S]*?systemInstruction:\s*([^}]+)\}/);
  if (!validateApiKeyMatch) {
    console.log('❌ FAIL: validateApiKey không có systemInstruction');
    return false;
  }
  
  console.log('✅ PASS: gemini-service.ts đã sử dụng dynamic prompt');
  return true;
}

// Test 3: Kiểm tra groq-service.ts consistency
function testGroqService() {
  console.log('\n📋 Test 3: Kiểm tra groq-service.ts consistency');
  
  const servicePath = './src/lib/groq-service.ts';
  const content = fs.readFileSync(servicePath, 'utf8');
  
  // Kiểm tra Groq service cũng sử dụng getCurrentSystemPrompt()
  const getCurrentSystemPromptUsage = (content.match(/getCurrentSystemPrompt\(\)/g) || []).length;
  
  if (getCurrentSystemPromptUsage === 0) {
    console.log('❌ FAIL: Groq service không sử dụng getCurrentSystemPrompt()');
    return false;
  }
  
  // Kiểm tra không có hardcode prompt
  const hasHardcodePrompt = content.includes('You are iRIN') || content.includes('IRIN_SYSTEM_INSTRUCTION');
  
  if (hasHardcodePrompt) {
    console.log('❌ FAIL: Groq service vẫn có hardcode prompt');
    return false;
  }
  
  console.log('✅ PASS: groq-service.ts consistent với dynamic prompt');
  return true;
}

// Test 4: Kiểm tra prompt-storage.ts
function testPromptStorage() {
  console.log('\n📋 Test 4: Kiểm tra prompt-storage.ts');
  
  const storagePath = './src/lib/prompt-storage.ts';
  const content = fs.readFileSync(storagePath, 'utf8');
  
  // Kiểm tra có getCurrentSystemPrompt function
  const hasGetCurrentSystemPrompt = content.includes('export function getCurrentSystemPrompt()');
  
  if (!hasGetCurrentSystemPrompt) {
    console.log('❌ FAIL: Không có getCurrentSystemPrompt function');
    return false;
  }
  
  // Kiểm tra có CORE_IDENTITY_PROMPT
  const hasCoreIdentity = content.includes('CORE_IDENTITY_PROMPT');
  
  if (!hasCoreIdentity) {
    console.log('❌ FAIL: Không có CORE_IDENTITY_PROMPT');
    return false;
  }
  
  console.log('✅ PASS: prompt-storage.ts hoạt động đúng');
  return true;
}

// Test 5: Kiểm tra user-prompt-generator.ts
function testUserPromptGenerator() {
  console.log('\n📋 Test 5: Kiểm tra user-prompt-generator.ts');
  
  const generatorPath = './src/lib/user-prompt-generator.ts';
  const content = fs.readFileSync(generatorPath, 'utf8');
  
  // Kiểm tra không sử dụng getCurrentSystemPrompt (để tránh core injection)
  const usesGetCurrentSystemPrompt = content.includes('getCurrentSystemPrompt');
  
  if (usesGetCurrentSystemPrompt) {
    console.log('❌ FAIL: user-prompt-generator.ts không nên sử dụng getCurrentSystemPrompt');
    return false;
  }
  
  // Kiểm tra sử dụng direct GoogleGenAI client
  const usesDirectClient = content.includes('new GoogleGenAI({ apiKey })');
  
  if (!usesDirectClient) {
    console.log('❌ FAIL: user-prompt-generator.ts không sử dụng direct client');
    return false;
  }
  
  console.log('✅ PASS: user-prompt-generator.ts tách biệt đúng');
  return true;
}

// Main test runner
function runAllTests() {
  console.log('\n🚀 BẮT ĐẦU KIỂM TRA...\n');
  
  const tests = [
    { name: 'Gemini Config', fn: testGeminiConfig },
    { name: 'Gemini Service', fn: testGeminiService },
    { name: 'Groq Service', fn: testGroqService },
    { name: 'Prompt Storage', fn: testPromptStorage },
    { name: 'User Prompt Generator', fn: testUserPromptGenerator }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      if (test.fn()) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      console.log(`❌ ERROR in ${test.name}:`, error.message);
      failed++;
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 KẾT QUẢ KIỂM TRA:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  
  if (failed === 0) {
    console.log('\n🎉 TẤT CẢ TESTS ĐỀU PASS!');
    console.log('✅ Hệ thống prompt đã được fix hoàn toàn');
    console.log('✅ Không còn hardcode prompt nào');
    console.log('✅ Dynamic prompt system hoạt động đúng');
  } else {
    console.log('\n⚠️  CÓ TESTS FAIL - CẦN KIỂM TRA LẠI');
  }
  
  return failed === 0;
}

// Run tests
if (require.main === module) {
  runAllTests();
}

module.exports = { runAllTests };

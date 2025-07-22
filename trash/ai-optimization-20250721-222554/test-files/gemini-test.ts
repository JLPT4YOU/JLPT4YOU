/**
 * Gemini Service Test Suite
 * Comprehensive tests for Gemini API integration
 */

import { getGeminiService, GeminiService } from './gemini-service';
import { createAIMessage } from './ai-service';
import { GEMINI_MODELS } from './gemini-config';

// Test configuration
const TEST_CONFIG = {
  apiKey: process.env.GEMINI_API_KEY || 'test-key',
  timeout: 30000, // 30 seconds
};

export class GeminiTester {
  private service: GeminiService;

  constructor(apiKey?: string) {
    this.service = getGeminiService(apiKey || TEST_CONFIG.apiKey);
  }

  /**
   * Test basic message sending
   */
  async testBasicMessage(): Promise<boolean> {
    try {
      console.log('🧪 Testing basic message...');
      
      const messages = [
        createAIMessage('Hello, can you help me learn Japanese?', 'user')
      ];

      const response = await this.service.sendMessage(messages, {
        model: GEMINI_MODELS.FLASH_2_5,
        temperature: 0.7
      });

      console.log('✅ Basic message test passed');
      console.log('Response:', response.substring(0, 100) + '...');
      return true;
    } catch (error) {
      console.error('❌ Basic message test failed:', error);
      return false;
    }
  }

  /**
   * Test streaming functionality
   */
  async testStreaming(): Promise<boolean> {
    try {
      console.log('🧪 Testing streaming...');
      
      const messages = [
        createAIMessage('Explain the difference between は and が particles in Japanese', 'user')
      ];

      const chunks: string[] = [];
      let fullResponse = '';

      await this.service.streamMessage(
        messages,
        (chunk: string) => {
          chunks.push(chunk);
          fullResponse += chunk;
        },
        {
          model: GEMINI_MODELS.FLASH_2_5,
          temperature: 0.7
        }
      );

      console.log('✅ Streaming test passed');
      console.log(`Received ${chunks.length} chunks`);
      console.log('Full response:', fullResponse.substring(0, 100) + '...');
      return true;
    } catch (error) {
      console.error('❌ Streaming test failed:', error);
      return false;
    }
  }

  /**
   * Test chat history functionality
   */
  async testChatHistory(): Promise<boolean> {
    try {
      console.log('🧪 Testing chat history...');
      
      const messages = [
        createAIMessage('What is JLPT?', 'user'),
        createAIMessage('JLPT stands for Japanese Language Proficiency Test. It is an international standardized test to evaluate and certify Japanese language proficiency for non-native speakers.', 'assistant'),
        createAIMessage('What are the different levels?', 'user')
      ];

      const response = await this.service.sendMessage(messages, {
        model: GEMINI_MODELS.FLASH_2_5,
        temperature: 0.7
      });

      console.log('✅ Chat history test passed');
      console.log('Response:', response.substring(0, 100) + '...');
      return true;
    } catch (error) {
      console.error('❌ Chat history test failed:', error);
      return false;
    }
  }

  /**
   * Test file upload functionality
   */
  async testFileUpload(): Promise<boolean> {
    try {
      console.log('🧪 Testing file upload...');
      
      // Create a simple test image (1x1 pixel PNG in base64)
      const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
      
      const messages = [
        createAIMessage('What do you see in this image?', 'user')
      ];

      const files = [{
        data: testImageBase64,
        mimeType: 'image/png'
      }];

      const response = await this.service.sendMessageWithFiles(
        messages,
        files,
        {
          model: GEMINI_MODELS.FLASH_2_5,
          temperature: 0.7
        }
      );

      console.log('✅ File upload test passed');
      console.log('Response:', response.substring(0, 100) + '...');
      return true;
    } catch (error) {
      console.error('❌ File upload test failed:', error);
      return false;
    }
  }

  /**
   * Test embedding generation (DEPRECATED)
   */
  async testEmbedding(): Promise<boolean> {
    console.log('🧪 Testing embedding generation...');
    console.log('⚠️  Embedding model has been removed from configuration');
    console.log('❌ Embedding test skipped');
    return false;
  }

  /**
   * Test API key validation
   */
  async testApiKeyValidation(): Promise<boolean> {
    try {
      console.log('🧪 Testing API key validation...');
      
      // Test with current key
      const validKey = await this.service.validateApiKey(TEST_CONFIG.apiKey);
      console.log('Current API key valid:', validKey);

      // Test with invalid key
      const invalidKey = await this.service.validateApiKey('invalid-key-123');
      console.log('Invalid API key valid:', invalidKey);

      console.log('✅ API key validation test passed');
      return true;
    } catch (error) {
      console.error('❌ API key validation test failed:', error);
      return false;
    }
  }

  /**
   * Test model configuration
   */
  async testModelConfiguration(): Promise<boolean> {
    try {
      console.log('🧪 Testing model configuration...');
      
      const availableModels = this.service.getAvailableModels();
      console.log(`Available models: ${availableModels.length}`);
      
      const defaultModel = this.service.getDefaultModel();
      console.log('Default model:', defaultModel);

      // Test setting different model
      this.service.setDefaultModel(GEMINI_MODELS.PRO_2_5);
      const newDefault = this.service.getDefaultModel();
      console.log('New default model:', newDefault);

      console.log('✅ Model configuration test passed');
      return true;
    } catch (error) {
      console.error('❌ Model configuration test failed:', error);
      return false;
    }
  }

  /**
   * Run all tests
   */
  async runAllTests(): Promise<void> {
    console.log('🚀 Starting Gemini Service Test Suite...\n');
    
    const tests = [
      { name: 'Basic Message', test: () => this.testBasicMessage() },
      { name: 'Streaming', test: () => this.testStreaming() },
      { name: 'Chat History', test: () => this.testChatHistory() },
      { name: 'File Upload', test: () => this.testFileUpload() },
      { name: 'Embedding', test: () => this.testEmbedding() },
      { name: 'API Key Validation', test: () => this.testApiKeyValidation() },
      { name: 'Model Configuration', test: () => this.testModelConfiguration() },
    ];

    const results: { name: string; passed: boolean }[] = [];

    for (const { name, test } of tests) {
      try {
        const passed = await test();
        results.push({ name, passed });
      } catch (error) {
        console.error(`Test "${name}" threw an error:`, error);
        results.push({ name, passed: false });
      }
      console.log(''); // Add spacing between tests
    }

    // Summary
    console.log('📊 Test Results Summary:');
    console.log('========================');
    
    const passed = results.filter(r => r.passed).length;
    const total = results.length;
    
    results.forEach(({ name, passed }) => {
      console.log(`${passed ? '✅' : '❌'} ${name}`);
    });
    
    console.log(`\n${passed}/${total} tests passed`);
    
    if (passed === total) {
      console.log('🎉 All tests passed! Gemini integration is ready.');
    } else {
      console.log('⚠️  Some tests failed. Please check the configuration and API key.');
    }
  }
}

// Export test runner function
export async function runGeminiTests(apiKey?: string): Promise<void> {
  const tester = new GeminiTester(apiKey);
  await tester.runAllTests();
}

// CLI runner (if called directly)
if (require.main === module) {
  runGeminiTests().catch(console.error);
}

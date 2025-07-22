/**
 * Test script to debug model loading issues
 */

import { getAIProviderManager } from '../lib/ai-provider-manager';
import { getAvailableModels } from '../lib/gemini-config';
import { getAvailableGroqModels } from '../lib/groq-config';

// Test function to check model loading
export function testModelLoading() {
  console.log('🧪 Testing Model Loading...');
  
  try {
    // Test AI Provider Manager
    const aiProviderManager = getAIProviderManager();
    console.log('✅ AI Provider Manager created');
    
    // Test current provider
    const currentProvider = aiProviderManager.getCurrentProvider();
    console.log('📍 Current provider:', currentProvider);
    
    // Test provider configs
    const providerConfigs = aiProviderManager.getProviderConfigs();
    console.log('⚙️ Provider configs:', providerConfigs);
    
    // Test Gemini models
    console.log('\n🧠 Testing Gemini Models...');
    const geminiModels = getAvailableModels();
    console.log(`📊 Found ${geminiModels.length} Gemini models:`);
    geminiModels.forEach((model, index) => {
      console.log(`  ${index + 1}. ${model.name} (${model.id})`);
    });
    
    // Test Groq models
    console.log('\n⚡ Testing Groq Models...');
    const groqModels = getAvailableGroqModels();
    console.log(`📊 Found ${groqModels.length} Groq models:`);
    groqModels.forEach((model, index) => {
      console.log(`  ${index + 1}. ${model.name} (${model.id})`);
    });
    
    // Test provider models via manager
    console.log('\n🔄 Testing Provider Models via Manager...');
    
    console.log('📋 Gemini models via manager:');
    const geminiViaManager = aiProviderManager.getProviderModels('gemini');
    console.log(`  Count: ${geminiViaManager.length}`);
    geminiViaManager.slice(0, 3).forEach((model, index) => {
      console.log(`  ${index + 1}. ${model.name} (${model.id})`);
    });
    
    console.log('📋 Groq models via manager:');
    const groqViaManager = aiProviderManager.getProviderModels('groq');
    console.log(`  Count: ${groqViaManager.length}`);
    groqViaManager.slice(0, 3).forEach((model, index) => {
      console.log(`  ${index + 1}. ${model.name} (${model.id})`);
    });
    
    // Test model formatting
    console.log('\n🎨 Testing Model Formatting...');
    const formatModelsForUI = (providerModels: any[], providerType: 'gemini' | 'groq') => {
      return providerModels.map(model => ({
        id: model.id,
        name: model.name,
        description: model.description,
        color: providerType === 'gemini' 
          ? (model.category === 'multimodal' ? 'bg-orange-500' :
             model.category === 'tts' ? 'bg-green-500' : 'bg-blue-500')
          : 'bg-purple-500',
        provider: providerType === 'gemini' ? 'Google Gemini' : 'Groq (Llama)',
        category: model.category || 'text',
        supportsStreaming: model.supportsStreaming,
        supportsFiles: model.supportsFiles || false,
        supportsTTS: model.supportsTTS || false
      }));
    };
    
    const formattedGemini = formatModelsForUI(geminiViaManager.slice(0, 2), 'gemini');
    const formattedGroq = formatModelsForUI(groqViaManager.slice(0, 2), 'groq');
    
    console.log('🎨 Formatted Gemini models:', formattedGemini);
    console.log('🎨 Formatted Groq models:', formattedGroq);
    
    // Test provider switching
    console.log('\n🔄 Testing Provider Switching...');
    
    console.log('Switching to Groq...');
    aiProviderManager.switchProvider('groq');
    console.log('Current provider after switch:', aiProviderManager.getCurrentProvider());
    
    console.log('Switching back to Gemini...');
    aiProviderManager.switchProvider('gemini');
    console.log('Current provider after switch:', aiProviderManager.getCurrentProvider());
    
    console.log('\n🎉 All model loading tests completed!');
    
    return {
      geminiCount: geminiModels.length,
      groqCount: groqModels.length,
      currentProvider,
      providerConfigs
    };
    
  } catch (error) {
    console.error('❌ Model loading test failed:', error);
    return null;
  }
}

// Test function for checking specific model groups
export function testModelGroups() {
  console.log('🧪 Testing Model Groups...');
  
  try {
    const groqModels = getAvailableGroqModels();
    
    // Group by provider
    const groupedByProvider = groqModels.reduce((groups, model) => {
      const provider = model.provider || 'unknown';
      if (!groups[provider]) {
        groups[provider] = [];
      }
      groups[provider].push(model);
      return groups;
    }, {} as Record<string, any[]>);
    
    console.log('📊 Groq models grouped by provider:');
    Object.entries(groupedByProvider).forEach(([provider, models]) => {
      console.log(`  ${provider}: ${models.length} models`);
      models.slice(0, 2).forEach(model => {
        console.log(`    - ${model.name} (${model.id})`);
      });
    });
    
    // Group by category
    const groupedByCategory = groqModels.reduce((groups, model) => {
      const category = model.category || 'unknown';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(model);
      return groups;
    }, {} as Record<string, any[]>);
    
    console.log('\n📊 Groq models grouped by category:');
    Object.entries(groupedByCategory).forEach(([category, models]) => {
      console.log(`  ${category}: ${models.length} models`);
    });
    
    return { groupedByProvider, groupedByCategory };
    
  } catch (error) {
    console.error('❌ Model groups test failed:', error);
    return null;
  }
}

// Export for browser console testing
(window as any).testModelLoading = testModelLoading;
(window as any).testModelGroups = testModelGroups;

console.log(`
🧪 Model Loading Test Script Loaded!

To test model loading, run in console:
testModelLoading()
testModelGroups()
`);

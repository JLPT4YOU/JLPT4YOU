/**
 * Groq Model Validation Script
 * Checks for mismatches between model keys and IDs
 */

// Import the models (simulated for testing)
const GROQ_MODELS = {
  // Meta Llama Models (Latest → Older)
  LLAMA_4_MAVERICK: 'meta-llama/llama-4-maverick-17b-128e-instruct',
  LLAMA_4_SCOUT: 'meta-llama/llama-4-scout-17b-16e-instruct',
  LLAMA_3_3_70B: 'llama-3.3-70b-versatile',
  LLAMA_3_70B: 'llama3-70b-8192',

  // Chinese AI Models
  KIMI_K2: 'moonshotai/kimi-k2-instruct',
  DEEPSEEK_R1: 'deepseek-r1-distill-llama-70b',
  QWEN_3_32B: 'qwen/qwen3-32b',

  // Compound AI Models
  COMPOUND_BETA: 'compound-beta',
  COMPOUND_MINI: 'compound-beta-mini',

  // Mistral Models
  MISTRAL_SABA: 'mistral-saba-24b'
};

const GROQ_MODEL_INFO = {
  [GROQ_MODELS.LLAMA_4_MAVERICK]: {
    id: GROQ_MODELS.LLAMA_4_MAVERICK,
    name: 'Llama 4 Maverick'
  },
  [GROQ_MODELS.LLAMA_4_SCOUT]: {
    id: GROQ_MODELS.LLAMA_4_SCOUT,
    name: 'Llama 4 Scout'
  },
  [GROQ_MODELS.LLAMA_3_3_70B]: {
    id: GROQ_MODELS.LLAMA_3_3_70B,
    name: 'Llama 3.3 70B'
  },
  [GROQ_MODELS.LLAMA_3_70B]: {
    id: GROQ_MODELS.LLAMA_3_70B,
    name: 'Llama 3 70B'
  },
  [GROQ_MODELS.KIMI_K2]: {
    id: GROQ_MODELS.KIMI_K2,
    name: 'Kimi K2'
  },
  [GROQ_MODELS.DEEPSEEK_R1]: {
    id: GROQ_MODELS.DEEPSEEK_R1,
    name: 'DeepSeek R1'
  },
  [GROQ_MODELS.QWEN_3_32B]: {
    id: GROQ_MODELS.QWEN_3_32B,
    name: 'Qwen 3 32B'
  },
  [GROQ_MODELS.COMPOUND_BETA]: {
    id: GROQ_MODELS.COMPOUND_BETA,
    name: 'Compound Beta'
  },
  [GROQ_MODELS.COMPOUND_MINI]: {
    id: GROQ_MODELS.COMPOUND_MINI,
    name: 'Compound Mini'
  },
  [GROQ_MODELS.MISTRAL_SABA]: {
    id: GROQ_MODELS.MISTRAL_SABA,
    name: 'Mistral Saba'
  }
};

function validateGroqModels() {
  console.log('🔍 Validating Groq Models...\n');
  
  let hasErrors = false;
  
  // Check 1: All GROQ_MODELS keys have corresponding GROQ_MODEL_INFO entries
  console.log('📋 Checking GROQ_MODELS → GROQ_MODEL_INFO mapping:');
  Object.entries(GROQ_MODELS).forEach(([key, modelId]) => {
    const modelInfo = GROQ_MODEL_INFO[modelId];
    if (!modelInfo) {
      console.log(`❌ Missing model info for ${key} (${modelId})`);
      hasErrors = true;
    } else if (modelInfo.id !== modelId) {
      console.log(`❌ ID mismatch for ${key}: expected "${modelId}", got "${modelInfo.id}"`);
      hasErrors = true;
    } else {
      console.log(`✅ ${key} → ${modelInfo.name} (${modelId})`);
    }
  });
  
  console.log('\n📋 Checking GROQ_MODEL_INFO → GROQ_MODELS mapping:');
  Object.entries(GROQ_MODEL_INFO).forEach(([modelId, modelInfo]) => {
    const modelKey = Object.keys(GROQ_MODELS).find(key => GROQ_MODELS[key] === modelId);
    if (!modelKey) {
      console.log(`❌ Orphaned model info: ${modelInfo.name} (${modelId})`);
      hasErrors = true;
    } else {
      console.log(`✅ ${modelInfo.name} ← ${modelKey}`);
    }
  });
  
  console.log('\n📊 Summary:');
  console.log(`Total GROQ_MODELS: ${Object.keys(GROQ_MODELS).length}`);
  console.log(`Total GROQ_MODEL_INFO: ${Object.keys(GROQ_MODEL_INFO).length}`);
  
  if (hasErrors) {
    console.log('\n❌ Validation FAILED - Found mismatches!');
  } else {
    console.log('\n✅ Validation PASSED - All models match correctly!');
  }
  
  return !hasErrors;
}

// Run validation
validateGroqModels();

// Export for browser console
if (typeof window !== 'undefined') {
  window.validateGroqModels = validateGroqModels;
  console.log('\n💡 Run validateGroqModels() in console to re-check');
}

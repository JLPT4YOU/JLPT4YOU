/**
 * Groq API Configuration
 * Centralized configuration for Groq models and settings
 */

// Groq Model Definitions - Organized by Provider
export const GROQ_MODELS = {
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
} as const;

export interface GroqModelInfo {
  id: string;
  name: string;
  description: string;
  supportsStreaming: boolean;
  supportsFiles: boolean;
  category: 'text' | 'reasoning';
}

export const GROQ_MODEL_INFO: Record<string, GroqModelInfo> = {
  // Meta Llama Models (Latest → Older)
  [GROQ_MODELS.LLAMA_4_MAVERICK]: {
    id: GROQ_MODELS.LLAMA_4_MAVERICK,
    name: 'Llama 4 Maverick',
    description: 'Experimental Llama 4 model with enhanced capabilities',
    supportsStreaming: true,
    supportsFiles: false,
    category: 'reasoning',
  },

  [GROQ_MODELS.LLAMA_4_SCOUT]: {
    id: GROQ_MODELS.LLAMA_4_SCOUT,
    name: 'Llama 4 Scout',
    description: 'Preview of next-gen Llama model',
    supportsStreaming: true,
    supportsFiles: false,
    category: 'text',
  },

  [GROQ_MODELS.LLAMA_3_3_70B]: {
    id: GROQ_MODELS.LLAMA_3_3_70B,
    name: 'Llama 3.3 70B',
    description: 'Latest Llama model with improved reasoning',
    supportsStreaming: true,
    supportsFiles: false,
    category: 'text',
  },

  [GROQ_MODELS.LLAMA_3_70B]: {
    id: GROQ_MODELS.LLAMA_3_70B,
    name: 'Llama 3 70B',
    description: 'Proven large model',
    supportsStreaming: true,
    supportsFiles: false,
    category: 'text',
  },

  // Chinese AI Models
  [GROQ_MODELS.KIMI_K2]: {
    id: GROQ_MODELS.KIMI_K2,
    name: 'Kimi K2',
    description: 'Moonshot AI instruction model',
    supportsStreaming: true,
    supportsFiles: false,
    category: 'text',
  },

  [GROQ_MODELS.DEEPSEEK_R1]: {
    id: GROQ_MODELS.DEEPSEEK_R1,
    name: 'DeepSeek R1',
    description: 'DeepSeek distilled 70B model',
    supportsStreaming: true,
    supportsFiles: false,
    category: 'reasoning',
  },

  [GROQ_MODELS.QWEN_3_32B]: {
    id: GROQ_MODELS.QWEN_3_32B,
    name: 'Qwen 3 32B',
    description: 'Alibaba Qwen 3 model',
    supportsStreaming: true,
    supportsFiles: false,
    category: 'text',
  },

  // Compound AI Models
  [GROQ_MODELS.COMPOUND_BETA]: {
    id: GROQ_MODELS.COMPOUND_BETA,
    name: 'Compound Beta',
    description: 'Compound AI beta model',
    supportsStreaming: true,
    supportsFiles: false,
    category: 'text',
  },

  [GROQ_MODELS.COMPOUND_MINI]: {
    id: GROQ_MODELS.COMPOUND_MINI,
    name: 'Compound Mini',
    description: 'Compact Compound model',
    supportsStreaming: true,
    supportsFiles: false,
    category: 'text',
  },

  // Mistral Models
  [GROQ_MODELS.MISTRAL_SABA]: {
    id: GROQ_MODELS.MISTRAL_SABA,
    name: 'Mistral Saba',
    description: 'Mistral 24B model',
    supportsStreaming: true,
    supportsFiles: false,
    category: 'text',
  }
};

// Default Configuration
export const DEFAULT_GROQ_CONFIG = {
  temperature: 0.8,
  max_completion_tokens: 8192,
  model: GROQ_MODELS.LLAMA_3_3_70B, // Default to latest Llama
  top_p: 1,
  stream: true,
  stop: null
};

// Helper functions
export function getGroqModelInfo(modelId: string): GroqModelInfo | undefined {
  return GROQ_MODEL_INFO[modelId];
}

export function getAvailableGroqModels(): GroqModelInfo[] {
  return Object.values(GROQ_MODEL_INFO);
}

export function getModelsByCategory(category: GroqModelInfo['category']): GroqModelInfo[] {
  return Object.values(GROQ_MODEL_INFO).filter(model => model.category === category);
}



// Configuration builder function
export function createGroqConfig(overrides?: any) {
  return {
    ...DEFAULT_GROQ_CONFIG,
    ...overrides
  };
}



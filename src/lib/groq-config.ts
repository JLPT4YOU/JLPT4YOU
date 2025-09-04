/**
 * Groq API Configuration
 * Centralized configuration for Groq models and settings
 */

// Groq Model Definitions - Organized by Provider
export const GROQ_MODELS = {
  // OpenAI GPT-OSS Models (New - with reasoning & tools)
  OPENAI_GPT_OSS_120B: 'openai/gpt-oss-120b',
  OPENAI_GPT_OSS_20B: 'openai/gpt-oss-20b',

  // Meta Llama Models (Latest → Older)
  LLAMA_4_MAVERICK: 'meta-llama/llama-4-maverick-17b-128e-instruct',
  LLAMA_4_SCOUT: 'meta-llama/llama-4-scout-17b-16e-instruct',
  LLAMA_3_3_70B: 'llama-3.3-70b-versatile',
  LLAMA_3_70B: 'llama3-70b-8192',
  LLAMA_3_1_8B_INSTANT: 'llama-3.1-8b-instant',

  // Chinese AI Models
  KIMI_K2: 'moonshotai/kimi-k2-instruct',
  DEEPSEEK_R1: 'deepseek-r1-distill-llama-70b',
  QWEN_3_32B: 'qwen/qwen3-32b',

  // Compound AI Models
  COMPOUND_BETA: 'compound-beta',
  COMPOUND_MINI: 'compound-beta-mini'
} as const;

export interface GroqModelInfo {
  id: string;
  name: string;
  description: string;
  supportsStreaming: boolean;
  supportsFiles: boolean;
  supportsReasoning: boolean;
  supportsThinking: boolean;
  supportsTools: boolean;
  category: 'text' | 'reasoning';
}

export const GROQ_MODEL_INFO: Record<string, GroqModelInfo> = {
  // OpenAI GPT-OSS Models (New - with reasoning & tools)
  [GROQ_MODELS.OPENAI_GPT_OSS_120B]: {
    id: GROQ_MODELS.OPENAI_GPT_OSS_120B,
    name: 'OpenAI GPT-OSS 120B',
    description: 'OpenAI open-weight 120B model with reasoning and code execution',
    supportsStreaming: true,
    supportsFiles: false,
    supportsReasoning: true,
    supportsThinking: true,
    supportsTools: true,
    category: 'reasoning',
  },

  [GROQ_MODELS.OPENAI_GPT_OSS_20B]: {
    id: GROQ_MODELS.OPENAI_GPT_OSS_20B,
    name: 'OpenAI GPT-OSS 20B',
    description: 'OpenAI open-weight 20B model with reasoning and code execution',
    supportsStreaming: true,
    supportsFiles: false,
    supportsReasoning: true,
    supportsThinking: true,
    supportsTools: true,
    category: 'reasoning',
  },

  // Meta Llama Models (Latest → Older)
  [GROQ_MODELS.LLAMA_4_MAVERICK]: {
    id: GROQ_MODELS.LLAMA_4_MAVERICK,
    name: 'Llama 4 Maverick',
    description: 'Experimental Llama 4 model with enhanced capabilities',
    supportsStreaming: true,
    supportsFiles: false,
    supportsReasoning: false,
    supportsThinking: false,
    supportsTools: false,
    category: 'reasoning',
  },

  [GROQ_MODELS.LLAMA_4_SCOUT]: {
    id: GROQ_MODELS.LLAMA_4_SCOUT,
    name: 'Llama 4 Scout',
    description: 'Preview of next-gen Llama model',
    supportsStreaming: true,
    supportsFiles: false,
    supportsReasoning: false,
    supportsThinking: false,
    supportsTools: false,
    category: 'text',
  },

  [GROQ_MODELS.LLAMA_3_3_70B]: {
    id: GROQ_MODELS.LLAMA_3_3_70B,
    name: 'Llama 3.3 70B',
    description: 'Latest Llama model with improved reasoning',
    supportsStreaming: true,
    supportsFiles: false,
    supportsReasoning: false,
    supportsThinking: false,
    supportsTools: false,
    category: 'text',
  },

  [GROQ_MODELS.LLAMA_3_70B]: {
    id: GROQ_MODELS.LLAMA_3_70B,
    name: 'Llama 3 70B',
    description: 'Proven large model',
    supportsStreaming: true,
    supportsFiles: false,
    supportsReasoning: false,
    supportsThinking: false,
    supportsTools: false,
    category: 'text',
  },

  [GROQ_MODELS.LLAMA_3_1_8B_INSTANT]: {
    id: GROQ_MODELS.LLAMA_3_1_8B_INSTANT,
    name: 'Llama 3.1 8B Instant',
    description: 'Fast and efficient 8B model for quick responses',
    supportsStreaming: true,
    supportsFiles: false,
    supportsReasoning: false,
    supportsThinking: false,
    supportsTools: false,
    category: 'text',
  },

  // Chinese AI Models
  [GROQ_MODELS.KIMI_K2]: {
    id: GROQ_MODELS.KIMI_K2,
    name: 'Kimi K2',
    description: 'Moonshot AI instruction model',
    supportsStreaming: true,
    supportsFiles: false,
    supportsReasoning: false,
    supportsThinking: false,
    supportsTools: false,
    category: 'text',
  },

  [GROQ_MODELS.DEEPSEEK_R1]: {
    id: GROQ_MODELS.DEEPSEEK_R1,
    name: 'DeepSeek R1',
    description: 'DeepSeek distilled 70B model with native thinking',
    supportsStreaming: true,
    supportsFiles: false,
    supportsReasoning: true,
    supportsThinking: true,
    supportsTools: false,
    category: 'reasoning',
  },

  [GROQ_MODELS.QWEN_3_32B]: {
    id: GROQ_MODELS.QWEN_3_32B,
    name: 'Qwen 3 32B',
    description: 'Alibaba Qwen 3 model with native thinking',
    supportsStreaming: true,
    supportsFiles: false,
    supportsReasoning: true,
    supportsThinking: true,
    supportsTools: false,
    category: 'reasoning',
  },

  // Compound AI Models
  [GROQ_MODELS.COMPOUND_BETA]: {
    id: GROQ_MODELS.COMPOUND_BETA,
    name: 'Compound Beta',
    description: 'Compound AI beta model with thinking capability',
    supportsStreaming: true,
    supportsFiles: false,
    supportsReasoning: true,
    supportsThinking: true,
    supportsTools: false,
    category: 'reasoning',
  },

  [GROQ_MODELS.COMPOUND_MINI]: {
    id: GROQ_MODELS.COMPOUND_MINI,
    name: 'Compound Mini',
    description: 'Compact Compound model',
    supportsStreaming: true,
    supportsFiles: false,
    supportsReasoning: false,
    supportsThinking: false,
    supportsTools: false,
    category: 'text',
  }
};

// Default Configuration
export const DEFAULT_GROQ_CONFIG = {
  temperature: 0.8,
  max_completion_tokens: 8192,
  model: GROQ_MODELS.OPENAI_GPT_OSS_20B, // Default to new OpenAI GPT-OSS model
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

export function getReasoningModels(): GroqModelInfo[] {
  return Object.values(GROQ_MODEL_INFO).filter(model => model.supportsReasoning);
}

export function getToolsModels(): GroqModelInfo[] {
  return Object.values(GROQ_MODEL_INFO).filter(model => model.supportsTools);
}

// Type definitions for advanced features
export type ReasoningEffort = 'low' | 'medium' | 'high';
export type ReasoningFormat = 'parsed' | 'raw' | 'hidden';
export type BuiltInTool = 'code_interpreter' | 'browser_search';

export interface GroqAdvancedOptions {
  reasoning_effort?: ReasoningEffort;
  reasoning_format?: ReasoningFormat;
  tools?: Array<{ type: BuiltInTool }>;
}

export interface ExecutedTool {
  name: string;
  index: number;
  type: string;
  arguments: string;
  output?: string;
  search_results?: { results: any[] };
  code_results?: Array<{ text: string }>;
}

export interface GroqAdvancedResponse {
  content: string;
  reasoning?: string;
  executed_tools?: ExecutedTool[];
}

// Configuration builder function
export function createGroqConfig(overrides?: any) {
  return {
    ...DEFAULT_GROQ_CONFIG,
    ...overrides
  };
}



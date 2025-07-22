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
  contextWindow: number;
  supportsStreaming: boolean;
  supportsFiles: boolean;
  supportsVision: boolean;
  supportsAudio: boolean;
  costTier: 'free' | 'low' | 'medium' | 'high';
  category: 'text' | 'vision' | 'audio' | 'reasoning';
  provider: 'meta' | 'mistral' | 'google' | 'moonshot' | 'deepseek' | 'alibaba' | 'compound';
}

export const GROQ_MODEL_INFO: Record<string, GroqModelInfo> = {
  // Meta Llama Models (Latest → Older)
  [GROQ_MODELS.LLAMA_4_MAVERICK]: {
    id: GROQ_MODELS.LLAMA_4_MAVERICK,
    name: 'Llama 4 Maverick',
    description: 'Experimental Llama 4 model with enhanced capabilities',
    contextWindow: 128000,
    supportsStreaming: true,
    supportsFiles: false,
    supportsVision: false,
    supportsAudio: false,
    costTier: 'medium',
    category: 'reasoning',
    provider: 'meta'
  },

  [GROQ_MODELS.LLAMA_4_SCOUT]: {
    id: GROQ_MODELS.LLAMA_4_SCOUT,
    name: 'Llama 4 Scout',
    description: 'Preview of next-gen Llama model',
    contextWindow: 16384,
    supportsStreaming: true,
    supportsFiles: false,
    supportsVision: false,
    supportsAudio: false,
    costTier: 'low',
    category: 'text',
    provider: 'meta'
  },

  [GROQ_MODELS.LLAMA_3_3_70B]: {
    id: GROQ_MODELS.LLAMA_3_3_70B,
    name: 'Llama 3.3 70B',
    description: 'Latest Llama model with improved reasoning',
    contextWindow: 131072,
    supportsStreaming: true,
    supportsFiles: false,
    supportsVision: false,
    supportsAudio: false,
    costTier: 'low',
    category: 'text',
    provider: 'meta'
  },

  [GROQ_MODELS.LLAMA_3_70B]: {
    id: GROQ_MODELS.LLAMA_3_70B,
    name: 'Llama 3 70B',
    description: 'Proven large model',
    contextWindow: 8192,
    supportsStreaming: true,
    supportsFiles: false,
    supportsVision: false,
    supportsAudio: false,
    costTier: 'medium',
    category: 'text',
    provider: 'meta'
  },

  // Chinese AI Models
  [GROQ_MODELS.KIMI_K2]: {
    id: GROQ_MODELS.KIMI_K2,
    name: 'Kimi K2',
    description: 'Moonshot AI instruction model',
    contextWindow: 128000,
    supportsStreaming: true,
    supportsFiles: false,
    supportsVision: false,
    supportsAudio: false,
    costTier: 'low',
    category: 'text',
    provider: 'moonshot'
  },

  [GROQ_MODELS.DEEPSEEK_R1]: {
    id: GROQ_MODELS.DEEPSEEK_R1,
    name: 'DeepSeek R1',
    description: 'DeepSeek distilled 70B model',
    contextWindow: 32768,
    supportsStreaming: true,
    supportsFiles: false,
    supportsVision: false,
    supportsAudio: false,
    costTier: 'low',
    category: 'reasoning',
    provider: 'deepseek'
  },

  [GROQ_MODELS.QWEN_3_32B]: {
    id: GROQ_MODELS.QWEN_3_32B,
    name: 'Qwen 3 32B',
    description: 'Alibaba Qwen 3 model',
    contextWindow: 32768,
    supportsStreaming: true,
    supportsFiles: false,
    supportsVision: false,
    supportsAudio: false,
    costTier: 'low',
    category: 'text',
    provider: 'alibaba'
  },

  // Compound AI Models
  [GROQ_MODELS.COMPOUND_BETA]: {
    id: GROQ_MODELS.COMPOUND_BETA,
    name: 'Compound Beta',
    description: 'Compound AI beta model',
    contextWindow: 32768,
    supportsStreaming: true,
    supportsFiles: false,
    supportsVision: false,
    supportsAudio: false,
    costTier: 'medium',
    category: 'text',
    provider: 'compound'
  },

  [GROQ_MODELS.COMPOUND_MINI]: {
    id: GROQ_MODELS.COMPOUND_MINI,
    name: 'Compound Mini',
    description: 'Compact Compound model',
    contextWindow: 16384,
    supportsStreaming: true,
    supportsFiles: false,
    supportsVision: false,
    supportsAudio: false,
    costTier: 'free',
    category: 'text',
    provider: 'compound'
  },

  // Mistral Models
  [GROQ_MODELS.MISTRAL_SABA]: {
    id: GROQ_MODELS.MISTRAL_SABA,
    name: 'Mistral Saba',
    description: 'Mistral 24B model',
    contextWindow: 32768,
    supportsStreaming: true,
    supportsFiles: false,
    supportsVision: false,
    supportsAudio: false,
    costTier: 'low',
    category: 'text',
    provider: 'mistral'
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

export function getModelsByProvider(provider: GroqModelInfo['provider']): GroqModelInfo[] {
  return Object.values(GROQ_MODEL_INFO).filter(model => model.provider === provider);
}

export function supportsVision(modelId: string): boolean {
  const modelInfo = getGroqModelInfo(modelId);
  return modelInfo?.supportsVision || false;
}

export function supportsAudio(modelId: string): boolean {
  const modelInfo = getGroqModelInfo(modelId);
  return modelInfo?.supportsAudio || false;
}

// Configuration builder function
export function createGroqConfig(overrides?: any) {
  return {
    ...DEFAULT_GROQ_CONFIG,
    ...overrides
  };
}

// iRIN versatile teacher system instruction
export const IRIN_GROQ_SYSTEM_INSTRUCTION = `Bạn là iRIN, một AI teacher đa năng từ nền tảng học tập JLPT4YOU.

Bản sắc cốt lõi của bạn:
- Bạn là iRIN, một giáo viên AI thông minh và linh hoạt có thể giúp đỡ bất kỳ môn học nào
- Bạn làm việc cho nền tảng JLPT4YOU, nhưng bạn là một nhà giáo đa ngành
- Bạn có thể thảo luận và dạy bất kỳ chủ đề nào mà học viên quan tâm
- Bạn luôn khuyến khích, kiên nhẫn và thích ứng với phong cách học tập của từng học viên
- Bạn luôn duy trì cách tiếp cận hữu ích, giáo dục và hấp dẫn

Khả năng của bạn bao gồm:
- Giáo dục và gia sư đa môn học (toán học, khoa học, văn học, lịch sử, v.v.)
- Học tiếng Nhật và chuẩn bị thi JLPT (một trong những chuyên môn của bạn)
- Kiến thức tổng quát và thảo luận về các chủ đề khác nhau
- Giải quyết vấn đề và tư duy sáng tạo
- Hỗ trợ học tập ở mọi cấp độ giáo dục
- Hướng dẫn cá nhân hóa dựa trên sở thích và mục tiêu học tập của học viên

Phong cách giao tiếp:
- Thân thiện, nhiệt tình và chuyên nghiệp
- Sử dụng tiếng Việt làm ngôn ngữ chính
- Giải thích rõ ràng với ví dụ cụ thể và ngữ cảnh
- Khuyến khích và động viên học viên trong mọi lĩnh vực học tập
- Thích ứng với nhu cầu và sở thích của từng học viên`;

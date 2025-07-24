/**
 * Google Gemini API Configuration
 * Centralized configuration for Gemini models, safety settings, and tools
 */

import {
  HarmBlockThreshold,
  HarmCategory,
} from '@google/genai';

// Gemini Model Definitions
export const GEMINI_MODELS = {
  // Gemini 2.5 Series (Support Google Search + Thinking)
  PRO_2_5: 'gemini-2.5-pro',
  FLASH_2_5: 'gemini-2.5-flash',
  FLASH_LITE_2_5: 'gemini-2.5-flash-lite-preview-06-17',
  FLASH_PREVIEW_2_5: 'gemini-2.5-flash-preview-05-20',

  // Gemini 2.0 Series (Support Google Search)
  FLASH_2_0: 'gemini-2.0-flash',
  FLASH_LITE_2_0: 'gemini-2.0-flash-lite',
  FLASH_EXP_2_0: 'gemini-2.0-flash-exp'
} as const;

// Model metadata for UI and selection
export interface GeminiModelInfo {
  id: string;
  name: string;
  description: string;
  supportsStreaming: boolean;
  supportsFiles: boolean;
  supportsAudio: boolean;
  supportsTTS: boolean;
  supportsGoogleSearch?: boolean;
  supportsThinking?: boolean;
  supportsCodeExecution?: boolean;
  costTier: 'free' | 'low' | 'medium' | 'high';
  category: 'text' | 'multimodal' | 'audio' | 'tts';
}

export const GEMINI_MODEL_INFO: Record<string, GeminiModelInfo> = {
  // Gemini 2.5 Series (Support Google Search + Thinking)
  [GEMINI_MODELS.PRO_2_5]: {
    id: GEMINI_MODELS.PRO_2_5,
    name: 'Gemini 2.5 Pro',
    description: 'Most capable model with thinking mode',
    supportsStreaming: true,
    supportsFiles: true,
    supportsAudio: false,
    supportsTTS: false,
    supportsGoogleSearch: true,
    supportsThinking: true,
    supportsCodeExecution: true,
    costTier: 'high',
    category: 'multimodal',
  },
  [GEMINI_MODELS.FLASH_2_5]: {
    id: GEMINI_MODELS.FLASH_2_5,
    name: 'Gemini 2.5 Flash',
    description: 'Fast with thinking mode',
    supportsStreaming: true,
    supportsFiles: true,
    supportsAudio: false,
    supportsTTS: false,
    supportsGoogleSearch: true,
    supportsThinking: true,
    supportsCodeExecution: true,
    costTier: 'medium',
    category: 'multimodal',
  },
  [GEMINI_MODELS.FLASH_LITE_2_5]: {
    id: GEMINI_MODELS.FLASH_LITE_2_5,
    name: 'Gemini 2.5 Flash-Lite Preview',
    description: 'Most cost-efficient with thinking',
    supportsStreaming: true,
    supportsFiles: true,
    supportsAudio: false,
    supportsTTS: false,
    supportsGoogleSearch: true,
    supportsThinking: true,
    supportsCodeExecution: true,
    costTier: 'low',
    category: 'multimodal',
  },
  [GEMINI_MODELS.FLASH_PREVIEW_2_5]: {
    id: GEMINI_MODELS.FLASH_PREVIEW_2_5,
    name: 'Gemini 2.5 Flash Preview',
    description: 'Preview version with latest features',
    supportsFiles: true,
    supportsStreaming: true,
    supportsAudio: false,
    supportsTTS: false,
    supportsGoogleSearch: true,
    supportsThinking: true,
    supportsCodeExecution: true,
    costTier: 'medium',
    category: 'multimodal',
  },

  // Gemini 2.0 Series (Support Google Search)
  [GEMINI_MODELS.FLASH_2_0]: {
    id: GEMINI_MODELS.FLASH_2_0,
    name: 'Gemini 2.0 Flash',
    description: 'Next-gen with search',
    supportsStreaming: true,
    supportsFiles: true,
    supportsAudio: false,
    supportsTTS: false,
    supportsGoogleSearch: true,
    supportsThinking: false,
    supportsCodeExecution: false,
    costTier: 'medium',
    category: 'multimodal',
  },
  [GEMINI_MODELS.FLASH_LITE_2_0]: {
    id: GEMINI_MODELS.FLASH_LITE_2_0,
    name: 'Gemini 2.0 Flash-Lite',
    description: 'Cost-efficient with search',
    supportsStreaming: true,
    supportsFiles: true,
    supportsAudio: false,
    supportsTTS: false,
    supportsGoogleSearch: true,
    supportsThinking: false,
    supportsCodeExecution: false,
    costTier: 'low',
    category: 'multimodal',
  },
  [GEMINI_MODELS.FLASH_EXP_2_0]: {
    id: GEMINI_MODELS.FLASH_EXP_2_0,
    name: 'Gemini 2.0 Flash Experimental',
    description: 'Experimental features and capabilities',
    supportsStreaming: true,
    supportsFiles: true,
    supportsAudio: false,
    supportsTTS: false,
    supportsGoogleSearch: true,
    supportsThinking: false,
    supportsCodeExecution: false,
    costTier: 'medium',
    category: 'multimodal',
  }
};

// Safety Settings - Block none for educational content
export const GEMINI_SAFETY_SETTINGS = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
];

// Tools Configuration for Grounding
export const GEMINI_TOOLS = [
  {
    googleSearch: {}
  }
];

// Alternative tools configuration
export const GEMINI_TOOLS_WITH_URL = [
  { urlContext: {} },
  { googleSearch: {} },
];

// URL Context only (without Google Search)
export const GEMINI_TOOLS_URL_ONLY = [
  { urlContext: {} }
];

// Code Execution only
export const GEMINI_TOOLS_CODE_EXECUTION = [
  { codeExecution: {} }
];

// All tools combined
export const GEMINI_TOOLS_ALL = [
  { urlContext: {} },
  { googleSearch: {} },
  { codeExecution: {} }
];

// Default Configuration
export const DEFAULT_GEMINI_CONFIG = {
  temperature: 0.8,
  model: GEMINI_MODELS.FLASH_2_5, // Default to Gemini 2.5 Flash (supports Google Search + Thinking)
  safetySettings: GEMINI_SAFETY_SETTINGS,
  tools: GEMINI_TOOLS,
  // Note: thinkingConfig is added conditionally in createGeminiConfig based on model support
  responseMimeType: 'text/plain'
};

// Note: System instructions are now handled dynamically through prompt-storage.ts
// This ensures proper integration with user customization and language switching

// Configuration builder function
export function createGeminiConfig(overrides?: any) {
  const { systemInstruction, model, thinkingConfig, ...configOverrides } = overrides || {};

  const finalModel = model || DEFAULT_GEMINI_CONFIG.model;
  const baseConfig: any = {
    ...DEFAULT_GEMINI_CONFIG,
    model: finalModel,
    // systemInstruction must be provided by the caller (usually from getCurrentSystemPrompt())
    // No fallback to ensure proper integration with dynamic prompt system
    systemInstruction: systemInstruction,
    ...configOverrides,
  };

  // Only add thinkingConfig for models that support thinking
  if (supportsThinking(finalModel) && thinkingConfig) {
    baseConfig.thinkingConfig = thinkingConfig;
  }

  return baseConfig;
}

// Model selection helpers
export function getModelsByCategory(category: GeminiModelInfo['category']): GeminiModelInfo[] {
  return Object.values(GEMINI_MODEL_INFO).filter(model => model.category === category);
}

export function getModelInfo(modelId: string): GeminiModelInfo | undefined {
  return GEMINI_MODEL_INFO[modelId];
}

// Helper functions to check model capabilities
export function supportsThinking(modelId: string): boolean {
  // Only 2.5 series models support thinking mode
  return modelId === GEMINI_MODELS.PRO_2_5 ||
         modelId === GEMINI_MODELS.FLASH_2_5 ||
         modelId === GEMINI_MODELS.FLASH_LITE_2_5 ||
         modelId === GEMINI_MODELS.FLASH_PREVIEW_2_5;
}

export function supportsGoogleSearch(modelId: string): boolean {
  // 2.5 and 2.0 series models support Google Search
  return supportsThinking(modelId) ||
         modelId === GEMINI_MODELS.FLASH_2_0 ||
         modelId === GEMINI_MODELS.FLASH_LITE_2_0 ||
         modelId === GEMINI_MODELS.FLASH_EXP_2_0;
}

export function supportsCodeExecution(modelId: string): boolean {
  // Only 2.5 series models support Code Execution, 2.0 models do not
  return modelId === GEMINI_MODELS.PRO_2_5 ||
         modelId === GEMINI_MODELS.FLASH_2_5 ||
         modelId === GEMINI_MODELS.FLASH_LITE_2_5 ||
         modelId === GEMINI_MODELS.FLASH_PREVIEW_2_5;
}

export function getAvailableModels(): GeminiModelInfo[] {
  return Object.values(GEMINI_MODEL_INFO);
}

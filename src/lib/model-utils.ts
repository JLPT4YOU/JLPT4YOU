/**
 * Model Utilities
 * Functions for AI model detection, feature checking, and configuration
 */

import { GEMINI_MODELS, supportsThinking as geminiSupportsThinking } from '@/lib/gemini-config';
import { isGroqModel } from '@/lib/chat-utils';

export interface ModelCapabilities {
  supportsThinking: boolean;
  supportsGoogleSearch: boolean;
  supportsCodeExecution: boolean;
  supportsFiles: boolean;
  supportsStreaming: boolean;
  supportsTTS: boolean;
  supportsUrlContext: boolean;
  maxTokens?: number;
  contextWindow?: number;
}

/**
 * Gets comprehensive capabilities for a model
 */
export function getModelCapabilities(modelId: string): ModelCapabilities {
  return {
    supportsThinking: supportsThinking(modelId),
    supportsGoogleSearch: supportsGoogleSearch(modelId),
    supportsCodeExecution: supportsCodeExecution(modelId),
    supportsFiles: supportsFiles(modelId),
    supportsStreaming: supportsStreaming(modelId),
    supportsTTS: supportsTTS(modelId),
    supportsUrlContext: supportsUrlContext(modelId),
    maxTokens: getMaxTokens(modelId),
    contextWindow: getContextWindow(modelId)
  };
}

/**
 * Checks if model supports thinking mode
 */
export function supportsThinking(modelId: string): boolean {
  // GPT-OSS models support reasoning thinking mode
  if (modelId.includes('openai/gpt-oss')) {
    return true;
  }

  // Other Groq models do not support thinking mode
  if (isGroqModel(modelId)) {
    return false;
  }

  return geminiSupportsThinking(modelId);
}

/**
 * Checks if model supports Google Search
 */
export function supportsGoogleSearch(modelId: string): boolean {
  // Groq models do not support Google Search
  if (isGroqModel(modelId)) {
    return false;
  }

  return modelId.includes('2.0') || modelId.includes('2.5');
}

/**
 * Checks if model supports code execution
 * Only 2.5 series models support code execution, 2.0 models do not
 */
export function supportsCodeExecution(modelId: string): boolean {
  // Groq models do not support code execution
  if (isGroqModel(modelId)) {
    return false;
  }

  return modelId.includes('2.5');
}

/**
 * Checks if model supports file uploads
 */
export function supportsFiles(modelId: string): boolean {
  // Groq models do not support file uploads
  if (isGroqModel(modelId)) {
    return false;
  }

  // Most modern Gemini models support files
  return !modelId.includes('text-only');
}

/**
 * Checks if model supports streaming
 */
export function supportsStreaming(modelId: string): boolean {
  // Most Gemini models support streaming
  return true;
}

/**
 * Checks if model supports text-to-speech
 */
export function supportsTTS(modelId: string): boolean {
  // TTS support varies by model
  return modelId.includes('pro') || modelId.includes('2.0') || modelId.includes('2.5');
}

/**
 * Checks if model supports URL context processing
 */
export function supportsUrlContext(modelId: string): boolean {
  return modelId.includes('2.0') || modelId.includes('2.5');
}

/**
 * Gets maximum tokens for a model
 */
export function getMaxTokens(modelId: string): number {
  if (modelId.includes('2.5')) return 8192;
  if (modelId.includes('2.0')) return 8192;
  if (modelId.includes('1.5')) return 2048;
  return 1024; // Default fallback
}

/**
 * Gets context window size for a model
 */
export function getContextWindow(modelId: string): number {
  if (modelId.includes('2.5')) return 2000000; // 2M tokens
  if (modelId.includes('2.0')) return 1000000; // 1M tokens
  if (modelId.includes('1.5')) return 128000;  // 128K tokens
  return 32000; // Default fallback
}

/**
 * Determines optimal model for a given task
 */
export function getOptimalModelForTask(
  task: 'chat' | 'code' | 'analysis' | 'creative' | 'search',
  availableModels: string[]
): string {
  const preferences = {
    chat: [GEMINI_MODELS.FLASH_2_0, GEMINI_MODELS.PRO_2_5],
    code: [GEMINI_MODELS.PRO_2_5, GEMINI_MODELS.FLASH_2_0],
    analysis: [GEMINI_MODELS.PRO_2_5, GEMINI_MODELS.PRO_2_5],
    creative: [GEMINI_MODELS.PRO_2_5, GEMINI_MODELS.FLASH_2_0],
    search: [GEMINI_MODELS.FLASH_2_0, GEMINI_MODELS.PRO_2_5]
  };

  const preferred = preferences[task];
  for (const model of preferred) {
    if (availableModels.includes(model)) {
      return model;
    }
  }

  // Fallback to first available model
  return availableModels[0] || GEMINI_MODELS.FLASH_2_0;
}

/**
 * Checks if model should auto-enable thinking mode
 * Only PRO_2_5 auto-enables, other 2.5 models let user decide
 */
export function shouldAutoEnableThinking(modelId: string): boolean {
  return modelId === GEMINI_MODELS.PRO_2_5;
}

/**
 * Gets model tier (free, pro, premium)
 */
export function getModelTier(modelId: string): 'free' | 'pro' | 'premium' {
  if (modelId.includes('2.5')) return 'premium';
  if (modelId.includes('pro')) return 'pro';
  return 'free';
}

/**
 * Checks if model has rate limits
 */
export function hasRateLimits(modelId: string): boolean {
  const tier = getModelTier(modelId);
  return tier === 'free'; // Free models typically have rate limits
}

/**
 * Gets estimated cost per 1K tokens (in credits/points)
 */
export function getEstimatedCost(modelId: string): number {
  const tier = getModelTier(modelId);
  switch (tier) {
    case 'premium': return 10;
    case 'pro': return 5;
    case 'free': return 1;
    default: return 1;
  }
}

/**
 * Validates model configuration
 */
export function validateModelConfig(config: {
  model: string;
  temperature?: number;
  maxTokens?: number;
  enableThinking?: boolean;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate model exists
  if (!config.model) {
    errors.push('Model is required');
  }

  // Validate temperature
  if (config.temperature !== undefined) {
    if (config.temperature < 0 || config.temperature > 2) {
      errors.push('Temperature must be between 0 and 2');
    }
  }

  // Validate max tokens
  if (config.maxTokens !== undefined) {
    const modelMaxTokens = getMaxTokens(config.model);
    if (config.maxTokens > modelMaxTokens) {
      errors.push(`Max tokens cannot exceed ${modelMaxTokens} for this model`);
    }
  }

  // Validate thinking mode
  if (config.enableThinking && !supportsThinking(config.model)) {
    errors.push('This model does not support thinking mode');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Gets recommended settings for a model
 */
export function getRecommendedSettings(modelId: string): {
  temperature: number;
  maxTokens: number;
  enableThinking: boolean;
  enableGoogleSearch: boolean;
  enableCodeExecution: boolean;
} {
  const capabilities = getModelCapabilities(modelId);
  
  return {
    temperature: 0.8, // Good balance for most tasks
    maxTokens: Math.min(2048, capabilities.maxTokens || 1024),
    enableThinking: capabilities.supportsThinking && shouldAutoEnableThinking(modelId),
    enableGoogleSearch: capabilities.supportsGoogleSearch,
    enableCodeExecution: capabilities.supportsCodeExecution
  };
}

/**
 * Formats model name for display
 */
export function formatModelName(modelId: string): string {
  return modelId
    .replace(/gemini-/g, 'Gemini ')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Gets model category for grouping
 */
export function getModelCategory(modelId: string): string {
  if (modelId.includes('flash')) return 'Fast Models';
  if (modelId.includes('pro')) return 'Pro Models';
  if (modelId.includes('2.5')) return 'Latest Models';
  return 'Standard Models';
}

/**
 * Compares two models by capability
 */
export function compareModels(modelA: string, modelB: string): {
  better: string;
  reasons: string[];
} {
  const capA = getModelCapabilities(modelA);
  const capB = getModelCapabilities(modelB);
  
  const reasons: string[] = [];
  let scoreA = 0;
  let scoreB = 0;

  // Compare capabilities
  if (capA.supportsThinking && !capB.supportsThinking) {
    scoreA++;
    reasons.push(`${modelA} supports thinking mode`);
  } else if (!capA.supportsThinking && capB.supportsThinking) {
    scoreB++;
    reasons.push(`${modelB} supports thinking mode`);
  }

  if ((capA.maxTokens || 0) > (capB.maxTokens || 0)) {
    scoreA++;
    reasons.push(`${modelA} has higher token limit`);
  } else if ((capA.maxTokens || 0) < (capB.maxTokens || 0)) {
    scoreB++;
    reasons.push(`${modelB} has higher token limit`);
  }

  if ((capA.contextWindow || 0) > (capB.contextWindow || 0)) {
    scoreA++;
    reasons.push(`${modelA} has larger context window`);
  } else if ((capA.contextWindow || 0) < (capB.contextWindow || 0)) {
    scoreB++;
    reasons.push(`${modelB} has larger context window`);
  }

  return {
    better: scoreA > scoreB ? modelA : scoreB > scoreA ? modelB : 'equal',
    reasons
  };
}

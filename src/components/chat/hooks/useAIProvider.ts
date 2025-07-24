import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { getAIProviderManager, type ProviderType } from '@/lib/ai-provider-manager';
import { getAvailableModels, GEMINI_MODELS } from '@/lib/gemini-config';

/**
 * Represents an AI model with its capabilities and metadata
 */
interface AIModel {
  id: string;
  name: string;
  description: string;
  color: string;
  provider: string;
  category: string;
  supportsStreaming: boolean;
  supportsFiles: boolean;
  supportsTTS: boolean;
}

/**
 * Return type for the useAIProvider hook
 */
interface UseAIProviderReturn {
  // State
  selectedModel: string;
  currentProvider: ProviderType;
  aiModels: AIModel[];

  // Actions
  setSelectedModel: (model: string) => void;
  switchProvider: (provider: ProviderType) => void;

  // Utilities
  getProviderColor: (providerType: ProviderType, category?: string) => string;
  formatModelsForUI: (providerModels: any[], providerType: ProviderType) => AIModel[];

  // Manager reference
  aiProviderManager: React.MutableRefObject<any>;
}

/**
 * Custom hook for managing AI provider switching, model selection, and provider-specific configurations.
 *
 * This hook handles:
 * - Provider switching between Gemini and Groq
 * - Model selection and validation
 * - Provider color formatting for UI
 * - Model capabilities detection
 *
 * @returns {UseAIProviderReturn} Object containing provider state and actions
 *
 * @example
 * ```typescript
 * const aiProvider = useAIProvider();
 *
 * // Switch to Groq provider
 * aiProvider.switchProvider('groq');
 *
 * // Select a specific model
 * aiProvider.setSelectedModel('gemini-2.5-pro');
 *
 * // Get available models
 * console.log(aiProvider.aiModels);
 * ```
 */
export const useAIProvider = (): UseAIProviderReturn => {
  // AI Provider Manager
  const aiProviderManager = useRef(getAIProviderManager());
  
  // State
  const [selectedModel, setSelectedModel] = useState<string>(GEMINI_MODELS.FLASH_2_0);
  const [currentProvider, setCurrentProvider] = useState<ProviderType>('gemini');
  
  // Helper function to get provider color based on category (monochrome system)
  const getProviderColor = useCallback((providerType: ProviderType, category?: string): string => {
    if (providerType === 'gemini') {
      switch (category) {
        case 'multimodal': return 'provider-primary';
        case 'tts': return 'provider-secondary';
        default: return 'provider-accent';
      }
    }
    return 'provider-secondary';
  }, []);

  // Helper function to format models for UI
  const formatModelsForUI = useCallback((providerModels: any[], providerType: ProviderType): AIModel[] => {
    return providerModels.map(model => ({
      id: model.id,
      name: model.name,
      description: model.description,
      color: getProviderColor(providerType, model.category),
      provider: providerType === 'gemini' ? 'Google Gemini' : 'Groq (Llama)',
      category: model.category || 'text',
      supportsStreaming: model.supportsStreaming,
      supportsFiles: model.supportsFiles || false,
      supportsTTS: false // Removed from GeminiModelInfo
    }));
  }, [getProviderColor]);

  // Available models state (will be updated based on current provider)
  const [aiModels, setAiModels] = useState<AIModel[]>(() => {
    // Initialize with Gemini models (default provider)
    return getAvailableModels().map(model => ({
      id: model.id,
      name: model.name,
      description: model.description,
      color: getProviderColor('gemini', model.category),
      provider: 'Google Gemini',
      category: model.category,
      supportsStreaming: model.supportsStreaming,
      supportsFiles: model.supportsFiles,
      supportsTTS: false // Removed from GeminiModelInfo
    }));
  });

  // Switch provider function
  const switchProvider = useCallback((provider: ProviderType) => {
    // Switch provider in manager first
    aiProviderManager.current.switchProvider(provider);
    setCurrentProvider(provider);

    // Update available models based on provider
    const providerModels = aiProviderManager.current.getProviderModels(provider);
    const formattedModels = formatModelsForUI(providerModels, provider);
    setAiModels(formattedModels);

    // Reset to first available model
    if (formattedModels.length > 0) {
      setSelectedModel(formattedModels[0].id);
    }
  }, [formatModelsForUI]);

  // Initialize provider and models on mount
  useEffect(() => {
    // Load current provider and update models
    const currentProviderType = aiProviderManager.current.getCurrentProvider();
    setCurrentProvider(currentProviderType);

    // Update models based on current provider
    const providerModels = aiProviderManager.current.getProviderModels(currentProviderType);
    const formattedModels = formatModelsForUI(providerModels, currentProviderType);
    setAiModels(formattedModels);
  }, []);

  return {
    // State
    selectedModel,
    currentProvider,
    aiModels,
    
    // Actions
    setSelectedModel,
    switchProvider,
    
    // Utilities
    getProviderColor,
    formatModelsForUI,
    
    // Manager reference
    aiProviderManager
  };
};

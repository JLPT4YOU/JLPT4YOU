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
  
  // Initialize selected model from localStorage or default
  const getInitialModel = () => {
    if (typeof window !== 'undefined') {
      const savedModel = localStorage.getItem('selected_model');
      const savedProvider = localStorage.getItem('selected_provider') as ProviderType;
      
      // If we have a saved model and provider, use them
      if (savedModel && savedProvider) {
        // Verify the model exists for the provider
        const providerModels = aiProviderManager.current.getProviderModels(savedProvider);
        const modelExists = providerModels.some((m: any) => m.id === savedModel);
        if (modelExists) {
          return { model: savedModel, provider: savedProvider };
        }
      }
    }
    // Default to Gemini Flash 2.0
    return { model: GEMINI_MODELS.FLASH_2_0, provider: 'gemini' as ProviderType };
  };
  
  const initial = getInitialModel();
  
  // State
  const [selectedModel, setSelectedModelState] = useState<string>(initial.model);
  const [currentProvider, setCurrentProvider] = useState<ProviderType>(initial.provider);
  
  // Wrapper to persist model selection
  const setSelectedModel = useCallback((model: string) => {
    setSelectedModelState(model);
    if (typeof window !== 'undefined') {
      localStorage.setItem('selected_model', model);
    }
  }, []);
  
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
      supportsThinking: model.supportsThinking || false,
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
      supportsThinking: model.supportsThinking || false,
      supportsTTS: false // Removed from GeminiModelInfo
    }));
  });

  // Switch provider function
  const switchProvider = useCallback((provider: ProviderType) => {
    // Switch provider in manager first
    aiProviderManager.current.switchProvider(provider);
    setCurrentProvider(provider);
    
    // Persist provider selection
    if (typeof window !== 'undefined') {
      localStorage.setItem('selected_provider', provider);
    }

    // Update available models based on provider
    const providerModels = aiProviderManager.current.getProviderModels(provider);
    const formattedModels = formatModelsForUI(providerModels, provider);
    setAiModels(formattedModels);

    // Reset to first available model
    if (formattedModels.length > 0) {
      setSelectedModel(formattedModels[0].id);
    }
  }, [formatModelsForUI, setSelectedModel]);

  // Initialize provider and models on mount
  useEffect(() => {
    // Switch to the initial provider (from localStorage or default)
    if (initial.provider !== aiProviderManager.current.getCurrentProvider()) {
      aiProviderManager.current.switchProvider(initial.provider);
    }

    // Update models based on initial provider
    const providerModels = aiProviderManager.current.getProviderModels(initial.provider);
    const formattedModels = formatModelsForUI(providerModels, initial.provider);
    setAiModels(formattedModels);
    
    // The state is already initialized with the correct provider and model from localStorage
    // This ensures the UI shows the correct state on first load
  }, [formatModelsForUI, initial.provider]);

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

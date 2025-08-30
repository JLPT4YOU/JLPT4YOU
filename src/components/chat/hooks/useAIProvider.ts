import { useState, useEffect, useRef, useCallback } from 'react';
import { getAIProviderManager, type ProviderType } from '@/lib/ai-provider-manager';
import { GEMINI_MODELS } from '@/lib/gemini-config';

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
  
  // Initialize selected model from localStorage or defaults (with robust fallbacks)
  const getInitialModel = () => {
    try {
      if (typeof window !== 'undefined') {
        // Prefer explicit selected_provider; fallback to manager's persisted provider
        const storedSelectedProvider = localStorage.getItem('selected_provider') as ProviderType | null;
        const managerPersistedProvider = localStorage.getItem('current_ai_provider') as ProviderType | null;
        const resolvedProvider: ProviderType = (storedSelectedProvider || managerPersistedProvider || 'gemini') as ProviderType;

        // Gather potential saved models
        const providerSpecificKey = `selected_model_${resolvedProvider}`;
        const providerSpecificModel = localStorage.getItem(providerSpecificKey);
        const genericSavedModel = localStorage.getItem('selected_model');

        // Verify model existence for the resolved provider
        const providerModels = aiProviderManager.current.getProviderModels(resolvedProvider);
        const isValidForProvider = (modelId: string | null | undefined) => !!modelId && providerModels.some((m: any) => m.id === modelId);

        if (isValidForProvider(providerSpecificModel)) {
          return { model: providerSpecificModel as string, provider: resolvedProvider };
        }

        if (isValidForProvider(genericSavedModel)) {
          return { model: genericSavedModel as string, provider: resolvedProvider };
        }

        // Fallback to provider's first available model
        if (providerModels.length > 0) {
          const firstModelId = (providerModels[0] as any).id as string;
          return { model: firstModelId, provider: resolvedProvider };
        }
      }
    } catch {
      // Ignore and fallback below
    }
    // Ultimate fallback to Gemini Flash 2.0
    return { model: GEMINI_MODELS.FLASH_2_0, provider: 'gemini' as ProviderType };
  };
  
  const initial = getInitialModel();
  
  // State
  const [selectedModel, setSelectedModelState] = useState<string>(initial.model);
  const [currentProvider, setCurrentProvider] = useState<ProviderType>(initial.provider);
  
  // Wrapper to persist model selection (also per-provider)
  const setSelectedModel = useCallback((model: string) => {
    setSelectedModelState(model);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('selected_model', model);
        localStorage.setItem(`selected_model_${currentProvider}`, model);
      } catch {
        // Ignore storage errors
      }
    }
  }, [currentProvider]);
  
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

  // Available models state (initialize based on initial provider to avoid flicker)
  const [aiModels, setAiModels] = useState<AIModel[]>(() => {
    const providerModels = aiProviderManager.current.getProviderModels(initial.provider);
    return providerModels.map((model: any) => ({
      id: model.id,
      name: model.name,
      description: model.description,
      color: getProviderColor(initial.provider, model.category),
      provider: initial.provider === 'gemini' ? 'Google Gemini' : 'Groq (Llama)',
      category: model.category || 'text',
      supportsStreaming: Boolean(model.supportsStreaming),
      supportsFiles: Boolean(model.supportsFiles),
      supportsThinking: Boolean(model.supportsThinking),
      supportsTTS: false
    }));
  });

  // Switch provider function
  const switchProvider = useCallback((provider: ProviderType) => {
    // Switch provider in manager first
    aiProviderManager.current.switchProvider(provider);
    setCurrentProvider(provider);

    // Persist provider selection (use both keys for consistency with manager)
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('selected_provider', provider);
        localStorage.setItem('current_ai_provider', provider);
      } catch {
        // Ignore storage errors
      }
    }

    // Update available models based on provider
    const providerModels = aiProviderManager.current.getProviderModels(provider);
    const formattedModels = formatModelsForUI(providerModels, provider);
    setAiModels(formattedModels);

    // Restore previously selected model for this provider if available
    let restoredModel: string | undefined;
    if (typeof window !== 'undefined') {
      const providerSpecific = localStorage.getItem(`selected_model_${provider}`);
      if (providerSpecific && providerModels.some((m: any) => m.id === providerSpecific)) {
        restoredModel = providerSpecific;
      }
    }

    if (restoredModel) {
      setSelectedModel(restoredModel);
    } else if (formattedModels.length > 0) {
      // Fall back to first available model
      setSelectedModel(formattedModels[0].id);
    }
  }, [formatModelsForUI, setSelectedModel]);

  // Initialize provider and models on mount (ensure manager uses resolved provider)
  useEffect(() => {
    if (initial.provider !== aiProviderManager.current.getCurrentProvider()) {
      aiProviderManager.current.switchProvider(initial.provider);
    }

    // Ensure localStorage has both keys for provider consistency
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('selected_provider', initial.provider);
        localStorage.setItem('current_ai_provider', initial.provider);
      } catch {
        // ignore
      }
    }

    // Models already initialized based on initial provider
  }, [initial.provider]);

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

/**
 * Model Context
 * Provides centralized model state management and configuration
 */

import React, { createContext, useContext, ReactNode } from 'react';
import { ModelInfo } from '@/components/chat/ModelSelector';

export interface ModelContextValue {
  // Model state
  selectedModel: string;
  availableModels: ModelInfo[];
  enableThinking: boolean;
  
  // Model operations
  setSelectedModel: (modelId: string) => void;
  setEnableThinking: (enabled: boolean) => void;
  
  // Model capabilities (computed)
  currentModelCapabilities: {
    supportsThinking: boolean;
    supportsGoogleSearch: boolean;
    supportsCodeExecution: boolean;
    supportsFiles: boolean;
    supportsStreaming: boolean;
    supportsTTS: boolean;
    supportsUrlContext: boolean;
  };
}

const ModelContext = createContext<ModelContextValue | undefined>(undefined);

export interface ModelProviderProps {
  children: ReactNode;
  value: ModelContextValue;
}

/**
 * Model Context Provider
 */
export const ModelProvider: React.FC<ModelProviderProps> = ({ children, value }) => {
  return (
    <ModelContext.Provider value={value}>
      {children}
    </ModelContext.Provider>
  );
};

/**
 * Hook to use model context
 */
export const useModelContext = (): ModelContextValue => {
  const context = useContext(ModelContext);
  if (context === undefined) {
    throw new Error('useModelContext must be used within a ModelProvider');
  }
  return context;
};

/**
 * Hook to use model state only
 */
export const useModelState = () => {
  const context = useModelContext();
  return {
    selectedModel: context.selectedModel,
    availableModels: context.availableModels,
    enableThinking: context.enableThinking,
    currentModelCapabilities: context.currentModelCapabilities,
  };
};

/**
 * Hook to use model operations only
 */
export const useModelOperations = () => {
  const context = useModelContext();
  return {
    setSelectedModel: context.setSelectedModel,
    setEnableThinking: context.setEnableThinking,
  };
};

/**
 * Hook for managing advanced features state (reasoning, tools)
 * Used for GPT-OSS models with reasoning and code interpreter capabilities
 */

import { useState, useEffect } from 'react';
import { SafeLocalStorage } from '@/lib/chat-error-handler';
import { getGroqModelInfo } from '@/lib/groq-config';
import type { ReasoningEffort } from '@/lib/groq-config';

interface UseAdvancedFeaturesReturn {
  // Reasoning features
  reasoningEffort: ReasoningEffort;
  setReasoningEffort: (effort: ReasoningEffort) => void;

  // Model support checks
  supportsAdvancedFeatures: boolean;
  supportsReasoning: boolean;
  supportsTools: boolean;

  // Auto-enabled tools (always on for GPT-OSS models)
  enableCodeInterpreter: boolean;
  enableBrowserSearch: boolean;

  // Handlers
  handleReasoningEffortChange: (effort: ReasoningEffort) => void;
}

export const useAdvancedFeatures = (selectedModel: string): UseAdvancedFeaturesReturn => {
  // State for reasoning effort only
  const [reasoningEffort, setReasoningEffort] = useState<ReasoningEffort>('medium');

  // Get model info to check capabilities
  const modelInfo = getGroqModelInfo(selectedModel);
  const supportsReasoning = modelInfo?.supportsReasoning || false;
  const supportsTools = modelInfo?.supportsTools || false;
  const supportsAdvancedFeatures = supportsReasoning || supportsTools;

  // Tools are always enabled for GPT-OSS models
  const enableCodeInterpreter = supportsTools;
  const enableBrowserSearch = supportsTools;

  // Load saved reasoning effort on mount
  useEffect(() => {
    const savedReasoningEffort = SafeLocalStorage.get('groq_reasoning_effort') as ReasoningEffort;

    if (savedReasoningEffort && ['low', 'medium', 'high'].includes(savedReasoningEffort)) {
      setReasoningEffort(savedReasoningEffort);
    }
  }, []);

  // Reset reasoning effort when switching to non-reasoning models
  useEffect(() => {
    if (!supportsReasoning) {
      setReasoningEffort('medium');
    }
  }, [selectedModel, supportsReasoning]);

  // Handler for reasoning effort
  const handleReasoningEffortChange = (effort: ReasoningEffort) => {
    setReasoningEffort(effort);
    SafeLocalStorage.set('groq_reasoning_effort', effort);
  };

  return {
    // State
    reasoningEffort,
    setReasoningEffort,

    // Model capabilities
    supportsAdvancedFeatures,
    supportsReasoning,
    supportsTools,

    // Auto-enabled tools (always on for GPT-OSS models)
    enableCodeInterpreter,
    enableBrowserSearch,

    // Handlers
    handleReasoningEffortChange
  };
};

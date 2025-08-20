/**
 * Header Model Selector Component
 * Compact model selector for use in chat header
 */

import React from 'react';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';

export interface ModelInfo {
  id: string;
  name: string;
  description: string;
  category: string;
  provider: string;
  supportsStreaming: boolean;
  supportsFiles: boolean;
  supportsTTS: boolean;
  supportsThinking?: boolean;
  supportsGoogleSearch?: boolean;
  supportsCodeExecution?: boolean;
  // New advanced features for GPT-OSS models
  supportsReasoning?: boolean;
  supportsTools?: boolean;
}

export interface HeaderModelSelectorProps {
  selectedModel: string;
  availableModels: ModelInfo[];
  onModelChange: (modelId: string) => void;
  className?: string;
}

export const HeaderModelSelector: React.FC<HeaderModelSelectorProps> = ({
  selectedModel,
  availableModels,
  onModelChange,
  className
}) => {
  const currentModel = availableModels.find(model => model.id === selectedModel) || availableModels[0];



  // Group models by provider
  const groupedModels = availableModels.reduce((groups, model) => {
    const provider = model.provider || 'Unknown';
    if (!groups[provider]) {
      groups[provider] = [];
    }
    groups[provider].push(model);
    return groups;
  }, {} as Record<string, ModelInfo[]>);



  // Get provider display names
  const getProviderDisplayName = (provider: string) => {
    const providerNames: Record<string, string> = {
      'Google Gemini': '🧠 Google Gemini',
      'Groq (Llama)': '⚡ Groq (Llama)',
      'meta': '🦙 Meta (Llama)',
      'mistral': '🌟 Mistral',
      'moonshot': '🌙 Moonshot AI',
      'deepseek': '🔍 DeepSeek',
      'alibaba': '☁️ Alibaba (Qwen)',
      'compound': '🧪 Compound AI'
    };
    return providerNames[provider] || `🤖 ${provider}`;
  };

  return (
    <Select value={selectedModel} onValueChange={onModelChange}>
      <SelectTrigger className={cn(
        "w-auto h-auto border-0 shadow-none p-0 focus:ring-0 bg-transparent hover:bg-accent/50 rounded-2xl transition-colors",
        className
      )}>
        <div className="flex items-center gap-1 py-2 px-2 sm:px-3">
          <span className="font-medium text-xs sm:text-sm truncate max-w-[80px] sm:max-w-[160px] md:max-w-none">
            {currentModel?.name || 'Select Model'}
          </span>
        </div>
      </SelectTrigger>
      <SelectContent className="max-h-80 overflow-y-auto w-72 sm:w-80 max-w-[90vw] rounded-2xl border-0">
        {Object.entries(groupedModels).map(([provider, models], groupIndex) => (
          <div key={`provider-${provider}-${groupIndex}`}>
            <div className="px-2 py-1 text-xs font-semibold text-muted-foreground border-b truncate">
              {getProviderDisplayName(provider)}
            </div>
            {models.map((model, modelIndex) => (
              <SelectItem key={`${provider}-${model.id}-${modelIndex}`} value={model.id}>
                <div className="flex flex-col w-full gap-1">
                  <span className="font-medium text-sm sm:text-base leading-tight">
                    {model.name}
                  </span>
                  <span className="text-xs text-muted-foreground leading-relaxed whitespace-normal break-words">
                    {model.description}
                  </span>
                </div>
              </SelectItem>
            ))}
          </div>
        ))}
      </SelectContent>
    </Select>
  );
};

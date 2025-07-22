/**
 * Model Selector Component
 * Handles AI model selection with features display
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { useTranslations } from '@/hooks/use-translations';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface ModelInfo {
  id: string;
  name: string;
  description: string;
  category: string;
  supportsStreaming: boolean;
  supportsFiles: boolean;
  supportsTTS: boolean;
  supportsThinking?: boolean;
  supportsGoogleSearch?: boolean;
  supportsCodeExecution?: boolean;
}

export interface ModelSelectorProps {
  selectedModel: string;
  availableModels: ModelInfo[];
  onModelChange: (modelId: string) => void;
  enableThinking: boolean;
  onToggleThinking: () => void;
  className?: string;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  selectedModel,
  availableModels,
  onModelChange,
  enableThinking,
  onToggleThinking,
  className
}) => {
  const { t } = useTranslations();

  // Get current model info
  const currentModel = availableModels.find(model => model.id === selectedModel);

  // Check if current model supports thinking
  const supportsThinking = currentModel?.supportsThinking || false;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Model Selection */}
      <div className="space-y-2">
        <label className="text-sm font-medium">
          {t ? t('chat.modelSelection') : 'AI Model'}
        </label>
        <Select value={selectedModel} onValueChange={onModelChange}>
          <SelectTrigger className="w-full rounded-2xl border-0">
            <SelectValue placeholder="Select a model" />
          </SelectTrigger>
          <SelectContent className="rounded-2xl border-0">
            {availableModels.map((model) => (
              <SelectItem key={model.id} value={model.id}>
                <div className="flex flex-col items-start">
                  <span className="font-medium">{model.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {model.description}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Current Model Features */}
      {currentModel && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium">
            {t ? t('chat.modelFeatures') : 'Model Features'}
          </h4>
          
          <div className="grid grid-cols-2 gap-2 text-xs">
            {/* Streaming */}
            <div className={cn(
              "flex items-center gap-2 p-2 rounded-md",
              currentModel.supportsStreaming 
                ? "bg-green-500/10 text-green-600" 
                : "bg-gray-500/10 text-gray-500"
            )}>
              <div className={cn(
                "w-2 h-2 rounded-full",
                currentModel.supportsStreaming ? "bg-green-500" : "bg-gray-400"
              )} />
              <span>Streaming</span>
            </div>

            {/* File Support */}
            <div className={cn(
              "flex items-center gap-2 p-2 rounded-md",
              currentModel.supportsFiles 
                ? "bg-green-500/10 text-green-600" 
                : "bg-gray-500/10 text-gray-500"
            )}>
              <div className={cn(
                "w-2 h-2 rounded-full",
                currentModel.supportsFiles ? "bg-green-500" : "bg-gray-400"
              )} />
              <span>Files</span>
            </div>

            {/* Google Search */}
            <div className={cn(
              "flex items-center gap-2 p-2 rounded-md",
              currentModel.supportsGoogleSearch 
                ? "bg-green-500/10 text-green-600" 
                : "bg-gray-500/10 text-gray-500"
            )}>
              <div className={cn(
                "w-2 h-2 rounded-full",
                currentModel.supportsGoogleSearch ? "bg-green-500" : "bg-gray-400"
              )} />
              <span>Search</span>
            </div>

            {/* Code Execution */}
            <div className={cn(
              "flex items-center gap-2 p-2 rounded-md",
              currentModel.supportsCodeExecution 
                ? "bg-green-500/10 text-green-600" 
                : "bg-gray-500/10 text-gray-500"
            )}>
              <div className={cn(
                "w-2 h-2 rounded-full",
                currentModel.supportsCodeExecution ? "bg-green-500" : "bg-gray-400"
              )} />
              <span>Code</span>
            </div>
          </div>

          {/* Thinking Mode Toggle */}
          {supportsThinking && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">
                  {t ? t('chat.thinkingMode') : 'Thinking Mode'}
                </label>
                <button
                  onClick={onToggleThinking}
                  className={cn(
                    "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
                    enableThinking ? "bg-blue-600" : "bg-gray-200"
                  )}
                >
                  <span
                    className={cn(
                      "inline-block h-3 w-3 transform rounded-full bg-white transition-transform",
                      enableThinking ? "translate-x-5" : "translate-x-1"
                    )}
                  />
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                {t ? t('chat.thinkingModeDescription') : 'Shows AI reasoning process'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Compact Model Selector for header/toolbar use
 */
export interface CompactModelSelectorProps {
  selectedModel: string;
  availableModels: ModelInfo[];
  onModelChange: (modelId: string) => void;
  className?: string;
}

export const CompactModelSelector: React.FC<CompactModelSelectorProps> = ({
  selectedModel,
  availableModels,
  onModelChange,
  className
}) => {
  const currentModel = availableModels.find(model => model.id === selectedModel);

  return (
    <Select value={selectedModel} onValueChange={onModelChange}>
      <SelectTrigger className={cn("w-auto min-w-[120px] rounded-2xl border-0", className)}>
        <SelectValue>
          <span className="truncate">
            {currentModel?.name || 'Select Model'}
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="rounded-2xl border-0">
        {availableModels.map((model) => (
          <SelectItem key={model.id} value={model.id}>
            <div className="flex items-center gap-2">
              <span className="font-medium">{model.name}</span>
              {/* Feature indicators */}
              <div className="flex gap-1">
                {model.supportsFiles && (
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" title="Supports files" />
                )}
                {model.supportsGoogleSearch && (
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full" title="Google Search" />
                )}
                {model.supportsCodeExecution && (
                  <div className="w-1.5 h-1.5 bg-purple-500 rounded-full" title="Code execution" />
                )}
              </div>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

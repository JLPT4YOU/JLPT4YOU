"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTranslations } from '@/hooks/use-translations';
import { Paperclip, ArrowUp, Lightbulb, Loader2, Square } from 'lucide-react';
import { GEMINI_MODELS } from '@/lib/gemini-config';
import { supportsThinking } from '@/lib/model-utils';
import { supportsFileUploads } from '@/lib/chat-utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface InputAreaProps {
  onSendMessage?: (message: string, files?: File[]) => void;
  onProcessMultiplePDFs?: (prompt: string, files: File[]) => void;
  onStopGeneration?: () => void;
  disabled?: boolean;
  isGenerating?: boolean;
  enableThinking?: boolean;
  onToggleThinking?: () => void;
  selectedModel?: string;
  currentProvider?: 'gemini' | 'groq';
  // Advanced features for GPT-OSS models
  reasoningEffort?: 'low' | 'medium' | 'high';
  onReasoningEffortChange?: (effort: 'low' | 'medium' | 'high') => void;
}

export const InputArea: React.FC<InputAreaProps> = ({
  onSendMessage,
  onProcessMultiplePDFs,
  onStopGeneration,
  disabled = false,
  isGenerating = false,
  enableThinking = false,
  onToggleThinking,
  selectedModel,
  currentProvider = 'gemini',
  reasoningEffort = 'medium',
  onReasoningEffortChange
}) => {
  const { t } = useTranslations();
  const [input, setInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [shouldFocusAfterResponse, setShouldFocusAfterResponse] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedInput = input.trim();
    if (trimmedInput && !isSubmitting && onSendMessage) {
      setIsSubmitting(true);
      setShouldFocusAfterResponse(true); // Set flag to focus after AI responds
      onSendMessage(trimmedInput, selectedFiles.length > 0 ? selectedFiles : undefined);
      setInput('');
      setSelectedFiles([]);

      // Reset submitting state after a short delay
      setTimeout(() => {
        setIsSubmitting(false);
      }, 500);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleFileSelect = () => {
    // Only allow file selection if current provider supports files
    if (supportsFileUploads(currentProvider, selectedModel) && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Auto-focus textarea after AI finishes responding
  useEffect(() => {
    if (!isGenerating && shouldFocusAfterResponse && textareaRef.current) {
      // Small delay to ensure DOM updates are complete
      setTimeout(() => {
        textareaRef.current?.focus();
        setShouldFocusAfterResponse(false); // Reset flag after focusing
      }, 100);
    }
  }, [isGenerating, shouldFocusAfterResponse]);

  // Enhanced auto-resize textarea with better UX
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      // Reset height to auto to get the correct scrollHeight
      textarea.style.height = 'auto';

      // Calculate new height with expanded limits since buttons are separate
      const lineHeight = 24; // Approximate line height
      const minHeight = 44; // Minimum comfortable height
      const maxHeight = 200; // Max height before scrolling

      const newHeight = Math.min(
        Math.max(textarea.scrollHeight, minHeight),
        maxHeight
      );

      textarea.style.height = `${newHeight}px`;
    }
  }, [input]);

  return (
    <div className="app-container app-section bg-background">
      <div className="max-w-4xl mx-auto">
        {/* Selected Files Preview */}
        {selectedFiles.length > 0 && (
          <div className="mb-3 sm:mb-4 flex flex-wrap gap-2">
            {selectedFiles.map((file, index) => (
              <div key={index} className="relative group">
                {/* Image Preview Only */}
                {file.type.startsWith('image/') ? (
                  <div className="relative">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="w-16 h-16 object-cover rounded-lg shadow-sm"
                    />
                    {/* Remove Button */}
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="w-20 h-16 bg-muted rounded-lg flex flex-col items-center justify-center p-1">
                      <Paperclip className="w-4 h-4 text-muted-foreground mb-1" />
                      <span className="text-xs text-muted-foreground text-center truncate w-full">
                        {file.name.length > 12 ? file.name.slice(0, 12) + '...' : file.name}
                      </span>
                    </div>
                    {/* Remove Button */}
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="flex items-end gap-3 sm:gap-4">
          {/* Text Input Container - Clean area without overlapping tools */}
          <form onSubmit={handleSubmit} className="flex-1">
            <div className="relative w-full">
              {/* Chat Input Container with buttons inside */}
              <div
                className="relative rounded-2xl overflow-hidden"
                style={{
                  backgroundColor: 'var(--chat-input-bg)'
                }}
              >
                {/* Scrollable textarea container with clip */}
                <div className="relative" style={{ height: 'auto', maxHeight: '200px' }}>
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={t ? t('chat.inputPlaceholder') : 'Message iRIN...'}
                    className={cn(
                      // Base styling with proper text alignment
                      "w-full resize-none bg-transparent text-left",
                      // Padding that reserves space for buttons - left for attachment, right for send, bottom for both
                      "pl-4 pr-16 pt-3",
                      // Typography improvements
                      "text-sm sm:text-base placeholder:text-muted-foreground",
                      // Focus state without white ring
                      "focus:outline-none",
                      "disabled:cursor-not-allowed disabled:opacity-50",
                      // Auto-expand with reasonable limits, accounting for button space
                      "min-h-[44px] overflow-y-auto",
                      // Better line height for readability
                      "leading-relaxed"
                    )}
                    style={{
                      '--tw-ring-color': 'var(--chat-input-focus)',
                      // Ensure text never overlaps with bottom buttons - critical for scroll
                      paddingBottom: '56px',
                      // Clip the scrollable area to not show behind buttons
                      maxHeight: '200px',
                      // Use clip-path to hide content behind buttons
                      clipPath: 'inset(0 0 48px 0)'
                    } as React.CSSProperties}
                    rows={1}
                    disabled={disabled}
                  />

                  {/* Overlay to hide scrolled text behind buttons */}
                  <div
                    className="absolute bottom-0 left-0 right-0 pointer-events-none"
                    style={{
                      height: '48px',
                      background: 'linear-gradient(to top, var(--chat-input-bg) 70%, transparent 100%)'
                    }}
                  />
                </div>

                {/* Left side buttons - positioned inside textarea */}
                <div className="absolute left-3 bottom-3 flex items-center gap-2">
                  {/* Attachment Button - Hidden for Groq provider */}
                  {supportsFileUploads(currentProvider, selectedModel) && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleFileSelect}
                      className={cn(
                        "h-7 w-7 rounded-lg hover:bg-accent/50 border-0",
                        "text-muted-foreground hover:text-foreground",
                        "flex items-center justify-center transition-colors"
                      )}
                      disabled={disabled}
                    >
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </Button>
                  )}

                  {/* Thinking Mode Button - Show for all thinking-capable models except Gemini Pro 2.5 (always on) */}
                  {selectedModel && supportsThinking(selectedModel) && selectedModel !== GEMINI_MODELS.PRO_2_5 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        onToggleThinking?.();
                        // Remove focus to update visual state immediately
                        (e.currentTarget as HTMLElement).blur();
                      }}
                      className={cn(
                        "h-7 w-7 rounded-lg hover:bg-accent/50 border-0 transition-colors",
                        "flex items-center justify-center",
                        enableThinking
                          ? "bg-yellow-500/20 text-yellow-600 hover:bg-yellow-500/30"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                      disabled={disabled}
                      title={enableThinking ? "Tắt chế độ nghiên cứu sâu" : "Bật chế độ nghiên cứu sâu"}
                    >
                      <Lightbulb className="w-4 h-4 flex-shrink-0" />
                    </Button>
                  )}

                  {/* Reasoning Effort Dropdown - Only show for OpenAI GPT-OSS models when thinking is enabled */}
                  {selectedModel && selectedModel.includes('openai/gpt-oss') && enableThinking && onReasoningEffortChange && (
                    <div className="flex items-center">
                      <Select value={reasoningEffort} onValueChange={onReasoningEffortChange}>
                        <SelectTrigger className="h-7 w-28 text-xs bg-muted/50 hover:bg-muted transition-colors border-0 focus:ring-0 focus:ring-offset-0 [&>svg]:hidden">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="min-w-[100px]">
                          <SelectItem value="low" className="text-xs">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-green-500"></div>
                              Low
                            </div>
                          </SelectItem>
                          <SelectItem value="medium" className="text-xs">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                              Medium
                            </div>
                          </SelectItem>
                          <SelectItem value="high" className="text-xs">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-red-500"></div>
                              High
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                {/* Right side buttons - positioned inside textarea */}
                <div className="absolute right-3 bottom-3 flex items-center">
                  {isGenerating ? (
                    // Stop Button when AI is generating - Monochrome design
                    <Button
                      type="button"
                      size="icon"
                      onClick={onStopGeneration}
                      className={cn(
                        "h-8 w-8 sm:h-9 sm:w-9 rounded-lg flex-shrink-0",
                        "bg-foreground hover:bg-foreground/90 text-background",
                        "transition-colors shadow-sm"
                      )}
                      title={t ? t('chat.stopGeneration') : 'Stop generation'}
                    >
                      <Square className="w-4 h-4 sm:w-5 sm:h-5" />
                    </Button>
                  ) : (
                    // Send Button when ready to send
                    <Button
                      type="submit"
                      size="icon"
                      className={cn(
                        "h-8 w-8 sm:h-9 sm:w-9 rounded-lg flex-shrink-0",
                        "bg-primary text-primary-foreground shadow-sm focus-ring",
                        (!input.trim() && selectedFiles.length === 0) && "opacity-50"
                      )}
                      disabled={disabled || isSubmitting || (!input.trim() && selectedFiles.length === 0)}
                    >
                      {isSubmitting ? (
                        <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                      ) : (
                        <ArrowUp className="w-4 h-4 sm:w-5 sm:h-5" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/heic,image/heif,application/pdf"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
};

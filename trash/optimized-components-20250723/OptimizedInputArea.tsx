/**
 * Optimized Input Area Component
 * Simplified props interface with better composition
 */

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useTranslations } from '@/hooks/use-translations';
import { Send, Paperclip, X } from 'lucide-react';
import { formatFileSize, validateFileType, isImageFile, isPdfFile } from '@/lib/chat-utils';

export interface ModelCapabilities {
  supportsFiles: boolean;
  supportsThinking: boolean;
  supportsGoogleSearch: boolean;
  supportsCodeExecution: boolean;
}

export interface OptimizedInputAreaProps {
  onSendMessage: (content: string, files?: File[]) => Promise<void>;
  onProcessMultiplePDFs?: (prompt: string, files: File[]) => Promise<void>;
  disabled?: boolean;
  selectedModel: string;
  enableThinking: boolean;
  modelCapabilities: ModelCapabilities;
  className?: string;
}

export const OptimizedInputArea: React.FC<OptimizedInputAreaProps> = ({
  onSendMessage,
  onProcessMultiplePDFs,
  disabled = false,
  selectedModel,
  enableThinking,
  modelCapabilities,
  className
}) => {
  // Dependencies
  const { t } = useTranslations();
  
  // Local state
  const [input, setInput] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  
  // Refs
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // File handling
  const allowedFileTypes = ['image/*', 'application/pdf', 'text/*'];
  const maxFileSize = 10 * 1024 * 1024; // 10MB

  const handleFileSelect = (files: FileList | null) => {
    if (!files || !modelCapabilities.supportsFiles) return;

    const validFiles: File[] = [];
    const errors: string[] = [];

    Array.from(files).forEach(file => {
      if (file.size > maxFileSize) {
        errors.push(`${file.name}: File too large (max 10MB)`);
        return;
      }

      if (!validateFileType(file, allowedFileTypes)) {
        errors.push(`${file.name}: Unsupported file type`);
        return;
      }

      validFiles.push(file);
    });

    if (errors.length > 0) {
      // Could show errors via toast or error handler
      console.warn('File validation errors:', errors);
    }

    setAttachedFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedInput = input.trim();
    if (!trimmedInput && attachedFiles.length === 0) return;
    if (disabled) return;

    try {
      // Check for PDF processing
      const pdfFiles = attachedFiles.filter(isPdfFile);
      if (pdfFiles.length > 0 && onProcessMultiplePDFs) {
        await onProcessMultiplePDFs(trimmedInput, pdfFiles);
      } else {
        await onSendMessage(trimmedInput, attachedFiles.length > 0 ? attachedFiles : undefined);
      }

      // Reset form
      setInput('');
      setAttachedFiles([]);
      textareaRef.current?.focus();
    } catch (error) {
      console.error('Send message error:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (modelCapabilities.supportsFiles) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (modelCapabilities.supportsFiles) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const canSend = (input.trim() || attachedFiles.length > 0) && !disabled;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Model Status Bar */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>Model: {selectedModel}</span>
          {enableThinking && (
            <span className="text-blue-600">Thinking Mode: ON</span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {modelCapabilities.supportsFiles && (
            <span className="text-green-600">Files</span>
          )}
          {modelCapabilities.supportsGoogleSearch && (
            <span className="text-green-600">Search</span>
          )}
          {modelCapabilities.supportsCodeExecution && (
            <span className="text-green-600">Code</span>
          )}
        </div>
      </div>

      {/* Attached Files */}
      {attachedFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">
            {t ? t('chat.attachedFiles') : 'Attached Files'} ({attachedFiles.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {attachedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-2 bg-muted px-3 py-2 rounded-lg text-sm"
              >
                <span className="truncate max-w-[200px]">{file.name}</span>
                <span className="text-muted-foreground">({formatFileSize(file.size)})</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                  className="h-auto p-1 hover:bg-destructive/10 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Chat Input Container with buttons inside */}
        <div
          className={cn(
            "relative border rounded-lg transition-colors overflow-hidden",
            isDragging && "border-primary bg-primary/5",
            disabled && "opacity-50"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {/* Scrollable textarea container with clip */}
          <div className="relative" style={{ height: 'auto', maxHeight: '200px' }}>
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t ? t('chat.inputPlaceholder') : 'Message iRIN Sensei...'}
              disabled={disabled}
              className="min-h-[80px] resize-none border-0 focus-visible:ring-0 pl-4 pr-16 pt-3 overflow-y-auto"
              style={{
                paddingBottom: '56px',
                // Clip the scrollable area to not show behind buttons
                maxHeight: '200px',
                // Use clip-path to hide content behind buttons
                clipPath: 'inset(0 0 48px 0)'
              } as React.CSSProperties}
            />

            {/* Overlay to hide scrolled text behind buttons */}
            <div
              className="absolute bottom-0 left-0 right-0 pointer-events-none"
              style={{
                height: '48px',
                background: 'linear-gradient(to top, rgba(255,255,255,0.95) 70%, transparent 100%)'
              }}
            />
          </div>

          {/* Left side buttons - positioned inside textarea */}
          <div className="absolute left-3 bottom-3 flex items-center gap-2">
            {/* File Attach Button */}
            {modelCapabilities.supportsFiles && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled}
                className="h-7 w-7 p-0 rounded-lg hover:bg-accent/50 border-0"
                title="Attach file"
              >
                <Paperclip className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Right side buttons - positioned inside textarea */}
          <div className="absolute right-3 bottom-3 flex items-center">
            {/* Send Button */}
            <Button
              type="submit"
              size="sm"
              disabled={!canSend}
              className="h-8 w-8 p-0 rounded-lg"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Character Count */}
        <div className="flex justify-between items-center text-xs text-muted-foreground">
          <span>
            {t ? t('chat.characterCount', { count: input.length }) : `${input.length} characters`}
          </span>
          
          {isDragging && (
            <span className="text-primary">
              {t ? t('chat.dropFiles') : 'Drop files here'}
            </span>
          )}
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={allowedFileTypes.join(',')}
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />
      </form>
    </div>
  );
};

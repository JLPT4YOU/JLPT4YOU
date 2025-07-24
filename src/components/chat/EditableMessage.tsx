/**
 * EditableMessage Component
 * Provides inline editing functionality for user messages
 */

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowUp, X, Loader2, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Message, FileAttachment } from './index';
import { supportsFileUploads } from '@/lib/chat-utils';
import { supportsThinking } from '@/lib/model-utils';
import { GEMINI_MODELS } from '@/lib/gemini-config';

interface EditableMessageProps {
  message: Message;
  onSave: (newContent: string, files?: File[]) => void;
  onCancel: () => void;
  className?: string;
  hasSubsequentMessages?: boolean;
  currentProvider?: 'gemini' | 'groq';
  selectedModel?: string;
  enableThinking?: boolean;
  onToggleThinking?: () => void;
}

export const EditableMessage: React.FC<EditableMessageProps> = ({
  message,
  onSave,
  onCancel,
  className,
  hasSubsequentMessages = false,
  currentProvider = 'gemini',
  selectedModel,
  enableThinking = false,
  onToggleThinking
}) => {
  const [content, setContent] = useState(message.content);
  const [files, setFiles] = useState<File[]>([]);
  const [existingFiles, setExistingFiles] = useState<FileAttachment[]>(message.files || []);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus and resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      // Set cursor to end
      const length = textareaRef.current.value.length;
      textareaRef.current.setSelectionRange(length, length);

      // Auto-resize with expanded limits since buttons are separate
      textareaRef.current.style.height = 'auto';
      const minHeight = 44; // Minimum comfortable height
      const maxHeight = 200; // Max height before scrolling
      const newHeight = Math.min(
        Math.max(textareaRef.current.scrollHeight, minHeight),
        maxHeight
      );
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, []);

  // Handle textarea auto-resize
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);

    // Auto-resize with expanded limits since buttons are separate
    e.target.style.height = 'auto';
    const minHeight = 44;
    const maxHeight = 200;
    const newHeight = Math.min(
      Math.max(e.target.scrollHeight, minHeight),
      maxHeight
    );
    e.target.style.height = `${newHeight}px`;
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles(selectedFiles);
  };

  // Convert FileAttachment to File object for sending
  const convertFileAttachmentToFile = async (fileAttachment: FileAttachment): Promise<File | null> => {
    try {
      if (fileAttachment.url.startsWith('blob:') || fileAttachment.url.startsWith('data:')) {
        const response = await fetch(fileAttachment.url);
        const blob = await response.blob();
        return new File([blob], fileAttachment.name, { type: fileAttachment.type });
      }
    } catch (error) {
      console.error('Error converting FileAttachment to File:', error);
    }
    return null;
  };

  // Handle send (save) - include both existing and new files
  const handleSend = async () => {
    const trimmedContent = content.trim();
    if (trimmedContent) {
      // Convert existing files to File objects
      const existingFileObjects: File[] = [];
      for (const fileAttachment of existingFiles) {
        const file = await convertFileAttachmentToFile(fileAttachment);
        if (file) {
          existingFileObjects.push(file);
        }
      }

      // Combine existing and new files
      const allFiles = [...existingFileObjects, ...files];
      onSave(trimmedContent, allFiles.length > 0 ? allFiles : undefined);
    }
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      handleSend();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  // Remove existing file attachment
  const removeExistingFile = (index: number) => {
    setExistingFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className={cn("space-y-3", className)}>

      {/* File Attachments Display - Above input like InputArea */}
      {(existingFiles.length > 0 || files.length > 0) && (
        <div className="mb-3 space-y-2">
          {/* Existing Files */}
          {existingFiles.length > 0 && (
            <div>
              <div className="text-xs text-muted-foreground mb-2">File hiện tại:</div>
              <div className="flex flex-wrap gap-2">
                {existingFiles.map((file, index) => (
                  <div key={index} className="relative group">
                    {/* Image Preview */}
                    {file.type.startsWith('image/') ? (
                      <div className="relative">
                        <img
                          src={file.url}
                          alt={file.name}
                          className="w-16 h-16 object-cover rounded-lg border shadow-sm"
                        />
                        {/* Remove Button */}
                        <button
                          type="button"
                          onClick={() => removeExistingFile(index)}
                          className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      /* PDF/Other Files */
                      <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg text-sm border">
                        <span className="truncate max-w-[150px]">{file.name}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeExistingFile(index)}
                          className="h-auto p-0.5 text-muted-foreground hover:text-destructive"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* New Files */}
          {files.length > 0 && (
            <div>
              <div className="text-xs text-muted-foreground mb-2">File mới:</div>
              <div className="flex flex-wrap gap-2">
                {files.map((file, index) => (
                  <div key={index} className="relative group">
                    {/* Image Preview */}
                    {file.type.startsWith('image/') ? (
                      <div className="relative">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={file.name}
                          className="w-16 h-16 object-cover rounded-lg border shadow-sm border-primary/20"
                        />
                        {/* Remove Button */}
                        <button
                          type="button"
                          onClick={() => setFiles(files.filter((_, i) => i !== index))}
                          className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      /* PDF/Other Files */
                      <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 border border-primary/20 rounded-lg text-sm">
                        <span className="truncate max-w-[150px]">{file.name}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setFiles(files.filter((_, i) => i !== index))}
                          className="h-auto p-0.5 text-primary hover:text-destructive"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Input Area - Exact copy of InputArea structure */}
      <div className="flex items-end gap-3 sm:gap-4">
        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex-1">
          <div className="relative w-full">
            {/* Textarea Container */}
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
                  value={content}
                  onChange={handleTextareaChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Chỉnh sửa tin nhắn của bạn..."
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
                    fontSize: 'var(--chat-font-size, 16px)',
                    // Ensure text never overlaps with bottom buttons - critical for scroll
                    paddingBottom: '56px',
                    // Clip the scrollable area to not show behind buttons
                    maxHeight: '200px',
                    // Use clip-path to hide content behind buttons
                    clipPath: 'inset(0 0 48px 0)'
                  } as React.CSSProperties}
                  rows={1}
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
                {supportsFileUploads(currentProvider) && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      "h-8 w-8 rounded-lg hover:bg-accent/50 border-0",
                      "text-muted-foreground hover:text-foreground",
                      "flex items-center justify-center transition-colors"
                    )}
                    title="Attach file"
                  >
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </Button>
                )}

                {/* Thinking Toggle Button - Only show for 2.5 models except PRO_2_5 (always on) */}
                {selectedModel && supportsThinking(selectedModel) && selectedModel !== GEMINI_MODELS.PRO_2_5 && onToggleThinking && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={onToggleThinking}
                    className={cn(
                      "h-8 w-8 rounded-lg hover:bg-accent/50 border-0 transition-colors",
                      "flex items-center justify-center",
                      enableThinking
                        ? "bg-yellow-500/20 text-yellow-600 hover:bg-yellow-500/30"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                    title={enableThinking ? "Tắt chế độ nghiên cứu sâu" : "Bật chế độ nghiên cứu sâu"}
                  >
                    <Lightbulb className="w-4 h-4 flex-shrink-0" />
                  </Button>
                )}

                {/* Cancel Button */}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onCancel}
                  className={cn(
                    "h-8 w-8 rounded-lg hover:bg-accent/50 border-0",
                    "text-muted-foreground hover:text-foreground",
                    "flex items-center justify-center transition-colors"
                  )}
                  title="Hủy chỉnh sửa (Esc)"
                >
                  <X className="w-4 h-4 flex-shrink-0" />
                </Button>
              </div>

              {/* Right side buttons - positioned inside textarea */}
              <div className="absolute right-3 bottom-3 flex items-center">
                <Button
                  type="submit"
                  size="icon"
                  className={cn(
                    "h-8 w-8 sm:h-9 sm:w-9 rounded-lg flex-shrink-0",
                    "bg-primary hover:bg-primary/90 text-primary-foreground",
                    "transition-colors shadow-sm",
                    !content.trim() && "opacity-50"
                  )}
                  disabled={!content.trim()}
                  title="Lưu thay đổi (Enter)"
                >
                  <ArrowUp className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
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
  );
};

/**
 * EditableMessage Component
 * Provides inline editing functionality for user messages
 */

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowUp, X, AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Message, FileAttachment } from './index';
import { supportsFileUploads } from '@/lib/chat-utils';

interface EditableMessageProps {
  message: Message;
  onSave: (newContent: string, files?: File[]) => void;
  onCancel: () => void;
  className?: string;
  hasSubsequentMessages?: boolean;
  currentProvider?: 'gemini' | 'groq';
}

export const EditableMessage: React.FC<EditableMessageProps> = ({
  message,
  onSave,
  onCancel,
  className,
  hasSubsequentMessages = false,
  currentProvider = 'gemini'
}) => {
  const [content, setContent] = useState(message.content);
  const [files, setFiles] = useState<File[]>([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
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

  // Handle send (save) with confirmation if needed
  const handleSend = () => {
    if (hasSubsequentMessages && !showConfirmation) {
      setShowConfirmation(true);
      return;
    }

    const trimmedContent = content.trim();
    if (trimmedContent) {
      onSave(trimmedContent, files.length > 0 ? files : undefined);
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
    // This would need to be implemented based on how file attachments are managed
    console.log('Remove existing file at index:', index);
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Confirmation Dialog */}
      {showConfirmation && (
        <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                Xác nhận chỉnh sửa
              </h4>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
                Việc chỉnh sửa tin nhắn này sẽ xóa tất cả tin nhắn phía sau (bao gồm cả phản hồi của AI).
                Bạn có chắc chắn muốn tiếp tục?
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => {
                    setShowConfirmation(false);
                    const trimmedContent = content.trim();
                    if (trimmedContent) {
                      onSave(trimmedContent, files.length > 0 ? files : undefined);
                    }
                  }}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white"
                >
                  Xác nhận
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowConfirmation(false)}
                >
                  Hủy
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* File Attachments Display - Above input like InputArea */}
      {((message.files && message.files.length > 0) || files.length > 0) && (
        <div className="mb-3 space-y-2">
          {/* Existing Files */}
          {message.files && message.files.length > 0 && (
            <div>
              <div className="text-xs text-muted-foreground mb-2">File hiện tại:</div>
              <div className="flex flex-wrap gap-2">
                {message.files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 px-2 py-1 bg-muted rounded-md text-xs"
                  >
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
                  <div
                    key={index}
                    className="flex items-center gap-2 px-2 py-1 bg-primary/10 border border-primary/20 rounded-md text-xs"
                  >
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

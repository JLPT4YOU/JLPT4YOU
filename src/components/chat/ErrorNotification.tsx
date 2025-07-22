/**
 * Error Notification Component
 * Displays error messages with retry functionality
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTranslations } from '@/hooks/use-translations';
import { ChatError } from '@/lib/chat-error-handler';

export interface ErrorNotificationProps {
  error: ChatError;
  onRetry?: () => void;
  onDismiss: () => void;
  showRetry?: boolean;
  className?: string;
}

export const ErrorNotification: React.FC<ErrorNotificationProps> = ({
  error,
  onRetry,
  onDismiss,
  showRetry = false,
  className
}) => {
  const { t } = useTranslations();

  return (
    <div className={cn(
      "fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-lg w-full mx-4",
      className
    )}>
      <div className="interactive-error rounded-lg p-4 backdrop-blur-sm">
        <div className="flex items-start gap-3">
          {/* Error icon */}
          <div className="flex-shrink-0 w-5 h-5 rounded-full bg-destructive/20 flex items-center justify-center mt-0.5">
            <svg className="w-3 h-3 text-destructive" fill="currentColor" viewBox="0 0 20 20">
              <path 
                fillRule="evenodd" 
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" 
                clipRule="evenodd" 
              />
            </svg>
          </div>
          
          {/* Error content */}
          <div className="flex-1 min-w-0">
            <p className="text-sm text-destructive font-medium mb-2">
              {error.message}
            </p>

            {/* Error details */}
            {error.type !== 'unknown' && (
              <p className="text-xs text-destructive/70 mb-2">
                Error type: {error.type}
              </p>
            )}
            
            {/* Retry button */}
            {error.retryable && showRetry && onRetry && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    onDismiss();
                    onRetry();
                  }}
                  className="h-7 text-xs border-destructive/30 text-destructive hover:bg-destructive/10"
                >
                  {t ? t('chat.retry') : 'Retry'}
                </Button>
              </div>
            )}
          </div>
          
          {/* Close button */}
          <button
            onClick={onDismiss}
            className="flex-shrink-0 text-red-500 hover:text-red-600 transition-colors"
            aria-label="Dismiss error"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M6 18L18 6M6 6l12 12" 
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Multiple Error Notifications Component
 * Displays multiple error notifications in a stack
 */
export interface ErrorNotificationStackProps {
  errors: Array<{
    id: string;
    error: ChatError;
    retryAction?: () => void;
  }>;
  onDismiss: (id: string) => void;
  maxVisible?: number;
  className?: string;
}

export const ErrorNotificationStack: React.FC<ErrorNotificationStackProps> = ({
  errors,
  onDismiss,
  maxVisible = 3,
  className
}) => {
  const visibleErrors = errors.slice(0, maxVisible);

  if (visibleErrors.length === 0) {
    return null;
  }

  return (
    <div className={cn("fixed top-4 left-1/2 transform -translate-x-1/2 z-50", className)}>
      <div className="flex flex-col gap-2 max-w-lg w-full mx-4">
        {visibleErrors.map((item, index) => (
          <div
            key={item.id}
            className="transform transition-all duration-200"
            style={{
              transform: `translateY(${index * 4}px) scale(${1 - index * 0.02})`,
              zIndex: 50 - index
            }}
          >
            <ErrorNotification
              error={item.error}
              onRetry={item.retryAction}
              onDismiss={() => onDismiss(item.id)}
              showRetry={!!item.retryAction}
            />
          </div>
        ))}
        
        {/* Show count if there are more errors */}
        {errors.length > maxVisible && (
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              +{errors.length - maxVisible} more error{errors.length - maxVisible !== 1 ? 's' : ''}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

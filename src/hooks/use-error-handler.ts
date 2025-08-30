/**
 * Custom hook for standardized error handling with notifications and retry functionality
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { createChatError, ChatError } from '@/lib/chat-error-handler';

export interface ErrorNotification {
  id: string;
  message: string;
  type: 'error' | 'warning' | 'info';
  retryable: boolean;
  retryAction?: () => void;
  autoHideMs?: number;
}

export interface UseErrorHandlerOptions {
  defaultAutoHideMs?: number;
  maxNotifications?: number;
  onError?: (error: ChatError) => void;
}

export interface UseErrorHandlerReturn {
  // Current error state
  currentError: ChatError | null;
  notifications: ErrorNotification[];
  
  // Error handling functions
  handleError: (error: unknown, type?: ChatError['type'], retryAction?: () => void) => void;
  clearError: () => void;
  clearNotification: (id: string) => void;
  clearAllNotifications: () => void;
  
  // Retry functionality
  retryLastAction: () => void;
  canRetry: boolean;
}

/**
 * Hook for managing errors with notifications and retry functionality
 */
export function useErrorHandler(options: UseErrorHandlerOptions = {}): UseErrorHandlerReturn {
  const {
    defaultAutoHideMs = 10000,
    maxNotifications = 3,
    onError
  } = options;

  const [currentError, setCurrentError] = useState<ChatError | null>(null);
  const [notifications, setNotifications] = useState<ErrorNotification[]>([]);
  
  // Refs for cleanup
  const timeoutRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const lastRetryAction = useRef<(() => void) | null>(null);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
      timeoutRefs.current.clear();
    };
  }, []);

  // Generate unique ID for notifications
  const generateId = useCallback(() => {
    return `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Clear notification by ID
  const clearNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
    
    // Clear associated timeout
    const timeout = timeoutRefs.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      timeoutRefs.current.delete(id);
    }
  }, []);

  // Clear all notifications
  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
    
    // Clear all timeouts
    timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
    timeoutRefs.current.clear();
  }, []);

  // Handle error function
  const handleError = useCallback((
    error: unknown,
    type: ChatError['type'] = 'unknown',
    retryAction?: () => void
  ) => {
    // Create standardized error
    const chatError = createChatError(error, type, {
      retryable: !!retryAction,
      logError: true
    });

    // Set current error
    setCurrentError(chatError);

    // Store retry action
    if (retryAction) {
      lastRetryAction.current = retryAction;
    }

    // Call custom error handler if provided
    if (onError) {
      onError(chatError);
    }

    // Create notification
    const notification: ErrorNotification = {
      id: generateId(),
      message: chatError.message,
      type: 'error',
      retryable: chatError.retryable,
      retryAction,
      autoHideMs: defaultAutoHideMs
    };

    // Add notification (limit max notifications)
    setNotifications(prev => {
      const newNotifications = [notification, ...prev];
      return newNotifications.slice(0, maxNotifications);
    });

    // Set auto-hide timeout
    if (defaultAutoHideMs > 0) {
      const timeout = setTimeout(() => {
        clearNotification(notification.id);
      }, defaultAutoHideMs);
      
      timeoutRefs.current.set(notification.id, timeout);
    }
  }, [defaultAutoHideMs, maxNotifications, onError, generateId, clearNotification]);

  // Clear current error
  const clearError = useCallback(() => {
    setCurrentError(null);
    lastRetryAction.current = null;
  }, []);

  // Retry last action
  const retryLastAction = useCallback(() => {
    if (lastRetryAction.current) {
      const action = lastRetryAction.current;
      clearError();
      clearAllNotifications();
      action();
    }
  }, [clearError, clearAllNotifications]);

  // Check if retry is available
  const canRetry = currentError?.retryable === true && lastRetryAction.current !== null;

  return {
    currentError,
    notifications,
    handleError,
    clearError,
    clearNotification,
    clearAllNotifications,
    retryLastAction,
    canRetry
  };
}

/**
 * Hook for handling async operations with error handling
 */
export function useAsyncError() {
  const { handleError } = useErrorHandler();

  const executeAsync = useCallback(async <T>(
    operation: () => Promise<T>,
    errorType: ChatError['type'] = 'unknown',
    retryAction?: () => void
  ): Promise<T | null> => {
    try {
      return await operation();
    } catch (error) {
      handleError(error, errorType, retryAction);
      return null;
    }
  }, [handleError]);

  return { executeAsync, handleError };
}

/**
 * Hook for handling form validation errors
 */
export function useFormErrorHandler() {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const setFieldError = useCallback((field: string, message: string) => {
    setFieldErrors(prev => ({ ...prev, [field]: message }));
  }, []);

  const clearFieldError = useCallback((field: string) => {
    setFieldErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  const clearAllFieldErrors = useCallback(() => {
    setFieldErrors({});
  }, []);

  const hasFieldError = useCallback((field: string) => {
    return field in fieldErrors;
  }, [fieldErrors]);

  const getFieldError = useCallback((field: string) => {
    return fieldErrors[field] || null;
  }, [fieldErrors]);

  return {
    fieldErrors,
    setFieldError,
    clearFieldError,
    clearAllFieldErrors,
    hasFieldError,
    getFieldError
  };
}

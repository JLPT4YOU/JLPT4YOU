/**
 * Standardized error handling utilities for chat components
 */

export interface ChatError {
  message: string;
  type: 'network' | 'api' | 'validation' | 'storage' | 'unknown';
  retryable: boolean;
  timestamp: Date;
  originalError?: Error;
}

export interface ErrorHandlerOptions {
  showNotification?: boolean;
  logError?: boolean;
  retryable?: boolean;
  fallbackMessage?: string;
}

/**
 * Creates a standardized ChatError from various error types
 */
export function createChatError(
  error: unknown,
  type: ChatError['type'] = 'unknown',
  options: ErrorHandlerOptions = {}
): ChatError {
  const {
    retryable = type === 'network' || type === 'api',
    fallbackMessage = 'An unexpected error occurred'
  } = options;

  let message = fallbackMessage;
  let originalError: Error | undefined;

  if (error instanceof Error) {
    originalError = error;
    message = error.message;
    
    // Detect specific error types from message content
    if (message.includes('quota') || message.includes('API quota')) {
      type = 'api';
      message = 'API quota exceeded. Please try a different model or try again later.';
    } else if (message.includes('network') || message.includes('fetch')) {
      type = 'network';
      message = 'Network connection error. Please check your internet connection.';
    } else if (message.includes('validation') || message.includes('invalid')) {
      type = 'validation';
      message = 'Invalid input provided. Please check your data and try again.';
    }
  } else if (typeof error === 'string') {
    message = error;
  }

  return {
    message,
    type,
    retryable,
    timestamp: new Date(),
    originalError
  };
}

/**
 * Handles localStorage operations with proper error handling
 */
export class SafeLocalStorage {
  static get(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error(`Failed to read from localStorage (${key}):`, error);
      return null;
    }
  }

  static set(key: string, value: string): boolean {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.error(`Failed to write to localStorage (${key}):`, error);
      // Handle quota exceeded
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        console.warn('localStorage quota exceeded, attempting cleanup...');
        // Could implement cleanup logic here
      }
      return false;
    }
  }

  static remove(key: string): boolean {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Failed to remove from localStorage (${key}):`, error);
      return false;
    }
  }

  static clear(): boolean {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
      return false;
    }
  }
}

/**
 * Validates and parses JSON data with type safety
 */
export function safeJsonParse<T>(
  jsonString: string,
  validator?: (data: unknown) => data is T
): T | null {
  try {
    const parsed = JSON.parse(jsonString);
    
    if (validator && !validator(parsed)) {
      console.warn('JSON data failed validation:', parsed);
      return null;
    }
    
    return parsed as T;
  } catch (error) {
    console.error('Failed to parse JSON:', error);
    return null;
  }
}

/**
 * Safely stringifies data for storage
 */
export function safeJsonStringify(data: unknown): string | null {
  try {
    return JSON.stringify(data);
  } catch (error) {
    console.error('Failed to stringify data:', error);
    return null;
  }
}

/**
 * Retry mechanism with exponential backoff
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      // Exponential backoff: 1s, 2s, 4s, etc.
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

/**
 * Error boundary helper for React components
 */
export function handleComponentError(
  error: Error,
  errorInfo: { componentStack: string }
): void {
  console.error('Component error:', error);
  console.error('Component stack:', errorInfo.componentStack);
  
  // Could send to error reporting service here
  // reportError(error, { context: 'component', ...errorInfo });
}

/**
 * Network error detection and handling
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    return (
      error.message.includes('fetch') ||
      error.message.includes('network') ||
      error.message.includes('connection') ||
      error.name === 'NetworkError' ||
      error.name === 'TypeError' // Often thrown by fetch failures
    );
  }
  return false;
}

/**
 * API error detection and handling
 */
export function isApiError(error: unknown): boolean {
  if (error instanceof Error) {
    return (
      error.message.includes('API') ||
      error.message.includes('quota') ||
      error.message.includes('rate limit') ||
      error.message.includes('unauthorized') ||
      error.message.includes('forbidden')
    );
  }
  return false;
}

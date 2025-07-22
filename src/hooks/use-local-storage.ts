/**
 * Custom hook for safe localStorage operations with TypeScript support
 * Provides reactive localStorage state management
 */

import { useState, useEffect, useCallback } from 'react';
import { SafeLocalStorage, safeJsonParse, safeJsonStringify } from '@/lib/chat-error-handler';

export interface UseLocalStorageOptions<T> {
  defaultValue: T;
  serializer?: {
    parse: (value: string) => T;
    stringify: (value: T) => string;
  };
  validator?: (value: unknown) => value is T;
}

export interface UseLocalStorageReturn<T> {
  value: T;
  setValue: (value: T | ((prev: T) => T)) => void;
  removeValue: () => void;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook for managing localStorage with reactive updates and type safety
 */
export function useLocalStorage<T>(
  key: string,
  options: UseLocalStorageOptions<T>
): UseLocalStorageReturn<T> {
  const { defaultValue, serializer, validator } = options;
  
  const [value, setValue] = useState<T>(defaultValue);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Default serializer for JSON
  const defaultSerializer = {
    parse: (value: string): T => {
      const parsed = safeJsonParse(value, validator);
      return parsed !== null ? parsed : defaultValue;
    },
    stringify: (value: T): string => {
      const stringified = safeJsonStringify(value);
      return stringified !== null ? stringified : JSON.stringify(defaultValue);
    }
  };

  const actualSerializer = serializer || defaultSerializer;

  // Load initial value
  useEffect(() => {
    try {
      setIsLoading(true);
      setError(null);
      
      const storedValue = SafeLocalStorage.get(key);
      
      if (storedValue !== null) {
        const parsedValue = actualSerializer.parse(storedValue);
        setValue(parsedValue);
      } else {
        setValue(defaultValue);
      }
    } catch (err) {
      console.error(`Error loading localStorage key "${key}":`, err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setValue(defaultValue);
    } finally {
      setIsLoading(false);
    }
  }, [key, defaultValue, actualSerializer]);

  // Update value function
  const updateValue = useCallback((newValue: T | ((prev: T) => T)) => {
    try {
      setError(null);
      
      const valueToStore = typeof newValue === 'function' 
        ? (newValue as (prev: T) => T)(value)
        : newValue;
      
      const serializedValue = actualSerializer.stringify(valueToStore);
      const success = SafeLocalStorage.set(key, serializedValue);
      
      if (success) {
        setValue(valueToStore);
      } else {
        throw new Error('Failed to save to localStorage');
      }
    } catch (err) {
      console.error(`Error saving localStorage key "${key}":`, err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [key, value, actualSerializer]);

  // Remove value function
  const removeValue = useCallback(() => {
    try {
      setError(null);
      const success = SafeLocalStorage.remove(key);
      
      if (success) {
        setValue(defaultValue);
      } else {
        throw new Error('Failed to remove from localStorage');
      }
    } catch (err) {
      console.error(`Error removing localStorage key "${key}":`, err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [key, defaultValue]);

  return {
    value,
    setValue: updateValue,
    removeValue,
    isLoading,
    error
  };
}

/**
 * Specialized hook for storing simple string values
 */
export function useLocalStorageString(
  key: string,
  defaultValue: string = ''
): UseLocalStorageReturn<string> {
  return useLocalStorage(key, {
    defaultValue,
    serializer: {
      parse: (value: string) => value,
      stringify: (value: string) => value
    }
  });
}

/**
 * Specialized hook for storing boolean values
 */
export function useLocalStorageBoolean(
  key: string,
  defaultValue: boolean = false
): UseLocalStorageReturn<boolean> {
  return useLocalStorage(key, {
    defaultValue,
    serializer: {
      parse: (value: string) => value === 'true',
      stringify: (value: boolean) => value.toString()
    }
  });
}

/**
 * Hook for managing multiple localStorage keys as a group
 */
export function useLocalStorageGroup<T extends Record<string, unknown>>(
  keys: { [K in keyof T]: { key: string; defaultValue: T[K] } }
): {
  values: T;
  updateValue: <K extends keyof T>(key: K, value: T[K]) => void;
  clearAll: () => void;
  isLoading: boolean;
} {
  const [values, setValues] = useState<T>(() => {
    const initial = {} as T;
    Object.entries(keys).forEach(([field, config]) => {
      initial[field as keyof T] = config.defaultValue;
    });
    return initial;
  });
  
  const [isLoading, setIsLoading] = useState(true);

  // Load all values on mount
  useEffect(() => {
    const loadedValues = {} as T;
    
    Object.entries(keys).forEach(([field, config]) => {
      const stored = SafeLocalStorage.get(config.key);
      if (stored !== null) {
        try {
          loadedValues[field as keyof T] = JSON.parse(stored);
        } catch {
          loadedValues[field as keyof T] = config.defaultValue;
        }
      } else {
        loadedValues[field as keyof T] = config.defaultValue;
      }
    });
    
    setValues(loadedValues);
    setIsLoading(false);
  }, []);

  const updateValue = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    const config = keys[key];
    if (config) {
      SafeLocalStorage.set(config.key, JSON.stringify(value));
      setValues(prev => ({ ...prev, [key]: value }));
    }
  }, [keys]);

  const clearAll = useCallback(() => {
    Object.values(keys).forEach(config => {
      SafeLocalStorage.remove(config.key);
    });
    
    const clearedValues = {} as T;
    Object.entries(keys).forEach(([field, config]) => {
      clearedValues[field as keyof T] = config.defaultValue;
    });
    setValues(clearedValues);
  }, [keys]);

  return {
    values,
    updateValue,
    clearAll,
    isLoading
  };
}

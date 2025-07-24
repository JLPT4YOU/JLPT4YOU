import { useState, useEffect, useCallback } from 'react';
import { SafeLocalStorage, safeJsonParse, safeJsonStringify } from '@/lib/chat-error-handler';

/**
 * Custom hook for type-safe localStorage operations with automatic serialization
 * @template T The type of data to store
 * @param key The localStorage key
 * @param defaultValue Default value if key doesn't exist
 * @returns [value, setValue, removeValue] tuple
 */
export function useLocalStorage<T>(
  key: string,
  defaultValue: T
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  // Initialize state with value from localStorage or default
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = SafeLocalStorage.get(key);
      if (item === null) return defaultValue;
      
      // Try to parse as JSON, fallback to string for primitive values
      const parsed = safeJsonParse<T>(item);
      return parsed !== null ? parsed : (item as unknown as T);
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return defaultValue;
    }
  });

  // Update localStorage when state changes
  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    try {
      setStoredValue(prevValue => {
        const newValue = typeof value === 'function' ? (value as (prev: T) => T)(prevValue) : value;
        
        // Serialize and store
        const serialized = safeJsonStringify(newValue);
        if (serialized !== null) {
          SafeLocalStorage.set(key, serialized);
        } else {
          // Fallback for primitive values
          SafeLocalStorage.set(key, String(newValue));
        }
        
        return newValue;
      });
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  }, [key]);

  // Remove value from localStorage
  const removeValue = useCallback(() => {
    try {
      SafeLocalStorage.remove(key);
      setStoredValue(defaultValue);
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, defaultValue]);

  return [storedValue, setValue, removeValue];
}

/**
 * Hook for boolean localStorage values with string conversion
 * @param key The localStorage key
 * @param defaultValue Default boolean value
 * @returns [value, setValue, removeValue] tuple
 */
export function useLocalStorageBoolean(
  key: string,
  defaultValue: boolean = false
): [boolean, (value: boolean) => void, () => void] {
  const [storedValue, setStoredValue] = useState<boolean>(() => {
    const item = SafeLocalStorage.get(key);
    if (item === null) return defaultValue;
    return item === 'true';
  });

  const setValue = useCallback((value: boolean) => {
    SafeLocalStorage.set(key, value.toString());
    setStoredValue(value);
  }, [key]);

  const removeValue = useCallback(() => {
    SafeLocalStorage.remove(key);
    setStoredValue(defaultValue);
  }, [key, defaultValue]);

  return [storedValue, setValue, removeValue];
}

/**
 * Hook for string localStorage values
 * @param key The localStorage key
 * @param defaultValue Default string value
 * @returns [value, setValue, removeValue] tuple
 */
export function useLocalStorageString(
  key: string,
  defaultValue: string = ''
): [string, (value: string) => void, () => void] {
  const [storedValue, setStoredValue] = useState<string>(() => {
    const item = SafeLocalStorage.get(key);
    return item !== null ? item : defaultValue;
  });

  const setValue = useCallback((value: string) => {
    SafeLocalStorage.set(key, value);
    setStoredValue(value);
  }, [key]);

  const removeValue = useCallback(() => {
    SafeLocalStorage.remove(key);
    setStoredValue(defaultValue);
  }, [key, defaultValue]);

  return [storedValue, setValue, removeValue];
}

/**
 * Hook for managing multiple related localStorage keys
 * @param keys Array of localStorage keys to manage
 * @returns Object with get, set, remove, and clear methods
 */
export function useLocalStorageManager(keys: string[]) {
  const get = useCallback(<T>(key: string, defaultValue?: T): T | null => {
    const item = SafeLocalStorage.get(key);
    if (item === null) return defaultValue || null;
    
    const parsed = safeJsonParse<T>(item);
    return parsed !== null ? parsed : (item as unknown as T);
  }, []);

  const set = useCallback(<T>(key: string, value: T): void => {
    const serialized = safeJsonStringify(value);
    if (serialized !== null) {
      SafeLocalStorage.set(key, serialized);
    } else {
      SafeLocalStorage.set(key, String(value));
    }
  }, []);

  const remove = useCallback((key: string): void => {
    SafeLocalStorage.remove(key);
  }, []);

  const clear = useCallback((): void => {
    keys.forEach(key => SafeLocalStorage.remove(key));
  }, [keys]);

  const exists = useCallback((key: string): boolean => {
    return SafeLocalStorage.get(key) !== null;
  }, []);

  return {
    get,
    set,
    remove,
    clear,
    exists
  };
}

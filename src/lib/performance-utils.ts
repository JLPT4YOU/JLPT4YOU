/**
 * Performance Utilities
 * Tools for monitoring and optimizing React component performance
 */

import { useRef, useEffect, useMemo, useCallback, useState } from 'react';

// Type definitions
type PropValue = string | number | boolean | object | null | undefined;
type PropsRecord = Record<string, PropValue>;
type ChangedProps = Record<string, { from: PropValue; to: PropValue }>;
type CallbackFunction = (...args: unknown[]) => unknown;

interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

interface PerformanceWithMemory extends Performance {
  memory?: MemoryInfo;
}

/**
 * Hook to measure component render time
 */
export function useRenderTime(componentName: string, enabled: boolean = false) {
  const renderStartTime = useRef<number>(0);

  useEffect(() => {
    if (!enabled) return;
    
    renderStartTime.current = performance.now();
    
    return () => {
      const renderTime = performance.now() - renderStartTime.current;
      console.log(`${componentName} render time: ${renderTime.toFixed(2)}ms`);
    };
  });
}

/**
 * Hook to detect unnecessary re-renders
 */
export function useWhyDidYouUpdate(name: string, props: PropsRecord, enabled: boolean = false) {
  const previousProps = useRef<PropsRecord>({});

  useEffect(() => {
    if (!enabled) return;

    if (previousProps.current) {
      const allKeys = Object.keys({ ...previousProps.current, ...props });
      const changedProps: ChangedProps = {};

      allKeys.forEach(key => {
        if (previousProps.current![key] !== props[key]) {
          changedProps[key] = {
            from: previousProps.current![key],
            to: props[key]
          };
        }
      });

      if (Object.keys(changedProps).length) {
        console.log('[why-did-you-update]', name, changedProps);
      }
    }

    previousProps.current = props;
  });
}

/**
 * Debounced value hook for performance optimization
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Throttled callback hook
 */
export function useThrottle<T extends CallbackFunction>(
  callback: T,
  delay: number
): T {
  const throttledCallback = useRef<T>(callback);
  const lastRan = useRef<number>(0);

  return useMemo(() => {
    return ((...args: Parameters<T>) => {
      if (Date.now() - lastRan.current >= delay) {
        callback(...args);
        lastRan.current = Date.now();
      }
    }) as T;
  }, [callback, delay]);
}

/**
 * Memoized callback with stable reference
 */
export function useStableCallback<T extends CallbackFunction>(callback: T): T {
  const callbackRef = useRef<T>(callback);

  useEffect(() => {
    callbackRef.current = callback;
  });

  return useCallback(((...args: Parameters<T>) => {
    return callbackRef.current(...args);
  }) as T, []);
}

/**
 * Virtual scrolling hook for large lists
 */
export interface VirtualScrollOptions {
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}

export function useVirtualScroll<T>(
  items: T[],
  options: VirtualScrollOptions
) {
  const { itemHeight, containerHeight, overscan = 5 } = options;
  const [scrollTop, setScrollTop] = useState(0);

  const visibleRange = useMemo(() => {
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + visibleCount + overscan,
      items.length - 1
    );

    return {
      startIndex: Math.max(0, startIndex - overscan),
      endIndex,
      visibleCount
    };
  }, [scrollTop, itemHeight, containerHeight, overscan, items.length]);

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.startIndex, visibleRange.endIndex + 1);
  }, [items, visibleRange.startIndex, visibleRange.endIndex]);

  const totalHeight = items.length * itemHeight;
  const offsetY = visibleRange.startIndex * itemHeight;

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return {
    visibleItems,
    totalHeight,
    offsetY,
    handleScroll,
    visibleRange
  };
}

/**
 * Intersection Observer hook for lazy loading
 */
export function useIntersectionObserver(
  options: IntersectionObserverInit = {}
) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);
  const elementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
        setEntry(entry);
      },
      options
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [options]);

  return { elementRef, isIntersecting, entry };
}

/**
 * Performance monitoring hook
 */
export function usePerformanceMonitor(componentName: string, enabled: boolean = false) {
  const renderCount = useRef(0);
  const mountTime = useRef<number>(0);

  useEffect(() => {
    if (!enabled) return;
    
    mountTime.current = performance.now();
    
    return () => {
      const totalTime = performance.now() - mountTime.current;
      console.log(`${componentName} was mounted for ${totalTime.toFixed(2)}ms with ${renderCount.current} renders`);
    };
  }, []);

  useEffect(() => {
    if (enabled) {
      renderCount.current++;
    }
  });

  return { renderCount: renderCount.current };
}

/**
 * Memory usage monitoring (experimental)
 */
export function useMemoryMonitor(enabled: boolean = false) {
  const [memoryInfo, setMemoryInfo] = useState<MemoryInfo | null>(null);

  useEffect(() => {
    const performanceWithMemory = performance as PerformanceWithMemory;
    if (!enabled || !performanceWithMemory.memory) return;

    const interval = setInterval(() => {
      const memory = performanceWithMemory.memory!;
      setMemoryInfo({
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [enabled]);

  return memoryInfo;
}

/**
 * Bundle size analyzer helper
 */
export function analyzeBundleSize() {
  if (typeof window !== 'undefined' && 'performance' in window) {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    return {
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
      totalTime: navigation.loadEventEnd - navigation.fetchStart
    };
  }
  
  return null;
}



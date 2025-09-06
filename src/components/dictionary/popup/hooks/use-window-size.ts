/**
 * Hook for managing window size with responsive positioning
 */

import { useState, useEffect, useMemo } from 'react';
import type { WindowSize, PopupStyle } from '../types';

export function useWindowSize() {
  const [windowSize, setWindowSize] = useState<WindowSize>({ width: 0, height: 0 });

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    const updateSize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setWindowSize({ width: window.innerWidth, height: window.innerHeight });
      }, 16); // ~60fps throttling
    };

    updateSize(); // Set initial size
    window.addEventListener('resize', updateSize);
    window.addEventListener('orientationchange', updateSize); // Mobile orientation
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', updateSize);
      window.removeEventListener('orientationchange', updateSize);
    };
  }, []);

  const style: PopupStyle = useMemo(() => {
    if (windowSize.width === 0) return { top: 0, left: 0, width: 0, height: 0 }; // Initial state

    // Responsive sizing with better mobile handling
    const minWidth = 320; // Minimum for mobile
    const maxWidth = 1000;
    const minHeight = 450;
    const maxHeight = Math.min(windowSize.height * 0.9, 700);

    const padding = windowSize.width < 768 ? 16 : 32;
    const width = Math.max(minWidth, Math.min(windowSize.width - padding, maxWidth));
    const height = Math.max(minHeight, Math.min(windowSize.height - padding, maxHeight));

    const top = Math.max(10, (windowSize.height - height) / 2); // Prevent negative positioning
    const left = Math.max(10, (windowSize.width - width) / 2);

    return { top, left, width, height } as const;
  }, [windowSize]);

  return { windowSize, style };
}

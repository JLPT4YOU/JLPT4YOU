/**
 * Custom hook for responsive screen size detection
 * Provides screen size state and breakpoint utilities
 */

import { useState, useEffect } from 'react';

export interface ScreenSize {
  width: number;
  height: number;
  isLargeScreen: boolean;
  isMediumScreen: boolean;
  isSmallScreen: boolean;
}

export interface UseScreenSizeReturn extends ScreenSize {
  checkBreakpoint: (breakpoint: 'sm' | 'md' | 'lg' | 'xl' | '2xl') => boolean;
}

// Breakpoint values (matching Tailwind CSS defaults)
const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

/**
 * Hook for detecting screen size and breakpoints
 * Returns current screen dimensions and breakpoint utilities
 */
export function useScreenSize(): UseScreenSizeReturn {
  const [screenSize, setScreenSize] = useState<ScreenSize>(() => {
    // Initialize with safe defaults for SSR
    if (typeof window === 'undefined') {
      return {
        width: 1024,
        height: 768,
        isLargeScreen: true,
        isMediumScreen: false,
        isSmallScreen: false,
      };
    }

    const width = window.innerWidth;
    const height = window.innerHeight;
    
    return {
      width,
      height,
      isLargeScreen: width >= BREAKPOINTS.lg,
      isMediumScreen: width >= BREAKPOINTS.md && width < BREAKPOINTS.lg,
      isSmallScreen: width < BREAKPOINTS.md,
    };
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setScreenSize({
        width,
        height,
        isLargeScreen: width >= BREAKPOINTS.lg,
        isMediumScreen: width >= BREAKPOINTS.md && width < BREAKPOINTS.lg,
        isSmallScreen: width < BREAKPOINTS.md,
      });
    };

    // Set initial size
    handleResize();

    // Add event listener
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const checkBreakpoint = (breakpoint: keyof typeof BREAKPOINTS): boolean => {
    return screenSize.width >= BREAKPOINTS[breakpoint];
  };

  return {
    ...screenSize,
    checkBreakpoint,
  };
}

/**
 * Hook for detecting if screen is at least a certain breakpoint
 * Useful for conditional rendering based on screen size
 */
export function useBreakpoint(breakpoint: keyof typeof BREAKPOINTS): boolean {
  const { checkBreakpoint } = useScreenSize();
  return checkBreakpoint(breakpoint);
}

/**
 * Hook specifically for sidebar responsive behavior
 * Returns whether sidebar should be open by default
 */
export function useSidebarResponsive(): {
  isLargeScreen: boolean;
  shouldSidebarBeOpen: boolean;
} {
  const { isLargeScreen } = useScreenSize();
  
  return {
    isLargeScreen,
    shouldSidebarBeOpen: isLargeScreen,
  };
}

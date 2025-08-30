/**
 * Custom hook for managing Admin Dashboard sidebar state
 * Handles toggle functionality, responsive behavior, and user intent tracking
 * Based on useUIState pattern from chat components
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useScreenSize } from '@/hooks/use-screen-size';
import { SafeLocalStorage } from '@/lib/chat-error-handler';

export interface UseAdminSidebarStateReturn {
  // Sidebar state
  isSidebarOpen: boolean;
  isLargeScreen: boolean;
  
  // Control functions
  handleSidebarToggle: () => void;
  openSidebar: () => void;
  closeSidebar: () => void;
  
  // State info
  userClosedSidebar: boolean;
}

/**
 * Custom hook for managing Admin Dashboard sidebar state
 * 
 * Features:
 * - Responsive behavior: auto-open on large screens, overlay on mobile
 * - User intent tracking: remembers if user manually closed sidebar
 * - Persistent state: saves sidebar preference to localStorage
 * - Smooth transitions: coordinates with CSS animations
 * 
 * @returns {UseAdminSidebarStateReturn} Sidebar state and control functions
 * 
 * @example
 * ```typescript
 * const sidebarState = useAdminSidebarState();
 * 
 * // Toggle sidebar
 * sidebarState.handleSidebarToggle();
 * 
 * // Check if sidebar is open
 * if (sidebarState.isSidebarOpen) {
 *   // Sidebar is visible
 * }
 * 
 * // Force open/close
 * sidebarState.openSidebar();
 * sidebarState.closeSidebar();
 * ```
 */
export const useAdminSidebarState = (): UseAdminSidebarStateReturn => {
  const { isLargeScreen } = useScreenSize();
  
  // Sidebar state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const userClosedSidebarRef = useRef<boolean>(false); // Track if user manually closed sidebar
  const previousIsLargeScreenRef = useRef<boolean>(isLargeScreen); // Track previous screen size
  
  // Storage keys
  const STORAGE_KEY = 'admin_sidebar_state';
  const USER_CLOSED_KEY = 'admin_sidebar_user_closed';

  // Load initial state from localStorage and set based on screen size
  useEffect(() => {
    // Load saved user preference
    const savedUserClosed = SafeLocalStorage.get(USER_CLOSED_KEY);
    if (savedUserClosed !== null) {
      userClosedSidebarRef.current = savedUserClosed === 'true';
    }
    
    // Set initial sidebar state based on screen size and user preference
    const shouldBeOpen = isLargeScreen && !userClosedSidebarRef.current;
    setIsSidebarOpen(shouldBeOpen);
    
    // Initialize previous screen size reference
    previousIsLargeScreenRef.current = isLargeScreen;
  }, []); // Only run on mount

  // Handle screen size changes
  useEffect(() => {
    const previousIsLargeScreen = previousIsLargeScreenRef.current;

    // Only auto-open sidebar when screen becomes large AND user hasn't manually closed it
    if (isLargeScreen && !previousIsLargeScreen && !userClosedSidebarRef.current) {
      setIsSidebarOpen(true);
    }

    // Auto-close sidebar when screen changes from large to small
    if (!isLargeScreen && previousIsLargeScreen) {
      setIsSidebarOpen(false);
      // Reset user closed flag for mobile (they can reopen on large screen)
      userClosedSidebarRef.current = false;
      SafeLocalStorage.set(USER_CLOSED_KEY, 'false');
    }

    // Update previous screen size reference
    previousIsLargeScreenRef.current = isLargeScreen;
  }, [isLargeScreen]);

  // Handle sidebar toggle with user intent tracking
  const handleSidebarToggle = useCallback(() => {
    const newState = !isSidebarOpen;
    setIsSidebarOpen(newState);
    
    // Track user intent: if closing on large screen, mark as user-closed
    if (!newState && isLargeScreen) {
      userClosedSidebarRef.current = true;
      SafeLocalStorage.set(USER_CLOSED_KEY, 'true');
    } else if (newState && isLargeScreen) {
      // If opening on large screen, clear user-closed flag
      userClosedSidebarRef.current = false;
      SafeLocalStorage.set(USER_CLOSED_KEY, 'false');
    }
    
    // Save current state
    SafeLocalStorage.set(STORAGE_KEY, newState.toString());
  }, [isSidebarOpen, isLargeScreen]);

  // Force open sidebar
  const openSidebar = useCallback(() => {
    setIsSidebarOpen(true);
    if (isLargeScreen) {
      userClosedSidebarRef.current = false;
      SafeLocalStorage.set(USER_CLOSED_KEY, 'false');
    }
    SafeLocalStorage.set(STORAGE_KEY, 'true');
  }, [isLargeScreen]);

  // Force close sidebar
  const closeSidebar = useCallback(() => {
    setIsSidebarOpen(false);
    if (isLargeScreen) {
      userClosedSidebarRef.current = true;
      SafeLocalStorage.set(USER_CLOSED_KEY, 'true');
    }
    SafeLocalStorage.set(STORAGE_KEY, 'false');
  }, [isLargeScreen]);

  return {
    // State
    isSidebarOpen,
    isLargeScreen,
    userClosedSidebar: userClosedSidebarRef.current,
    
    // Controls
    handleSidebarToggle,
    openSidebar,
    closeSidebar
  };
};

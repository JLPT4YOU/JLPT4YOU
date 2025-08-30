import { useState, useEffect, useRef } from 'react';
import { useScreenSize } from '@/hooks/use-screen-size';
import { SafeLocalStorage } from '@/lib/chat-error-handler';
import { supportsThinking, shouldAutoEnableThinking } from '@/lib/model-utils';

/**
 * Return type for the useUIState hook
 */
interface UseUIStateReturn {
  // Sidebar state
  isSidebarOpen: boolean;
  setIsSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  userClosedSidebarRef: React.MutableRefObject<boolean>;
  handleSidebarToggle: () => void;
  
  // Modal states
  showSettings: boolean;
  setShowSettings: React.Dispatch<React.SetStateAction<boolean>>;
  settingsDefaultTab: string;
  setSettingsDefaultTab: React.Dispatch<React.SetStateAction<string>>;
  showApiKeySetup: boolean;
  setShowApiKeySetup: React.Dispatch<React.SetStateAction<boolean>>;
  
  // Loading and error states
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  lastFailedMessage: string | null;
  setLastFailedMessage: React.Dispatch<React.SetStateAction<string | null>>;
  
  // Thinking mode
  enableThinking: boolean;
  setEnableThinking: React.Dispatch<React.SetStateAction<boolean>>;
  handleToggleThinking: () => void;
  
  // Cleanup refs
  errorTimeoutRef: React.MutableRefObject<NodeJS.Timeout | null>;
  abortControllerRef: React.MutableRefObject<AbortController | null>;
  
  // Screen size
  isLargeScreen: boolean;
}

/**
 * Custom hook for managing UI state including sidebar, modals, loading states, and user interactions.
 *
 * This hook handles:
 * - Sidebar open/close state with user intent tracking
 * - Modal visibility control (settings, API key setup)
 * - Loading and error states
 * - Thinking mode toggle with model-specific logic
 * - Screen size responsiveness
 *
 * @param {string} selectedModel - The currently selected AI model (affects thinking mode)
 * @returns {UseUIStateReturn} Object containing UI state and control functions
 *
 * @example
 * ```typescript
 * const uiState = useUIState('gemini-2.5-pro');
 *
 * // Toggle sidebar
 * uiState.handleSidebarToggle();
 *
 * // Show settings modal
 * uiState.setShowSettings(true);
 *
 * // Toggle thinking mode
 * uiState.handleToggleThinking();
 *
 * // Check loading state
 * if (uiState.isLoading) {
 *   // Show loading indicator
 * }
 * ```
 */
export const useUIState = (selectedModel: string): UseUIStateReturn => {
  const { isLargeScreen } = useScreenSize();
  
  // Sidebar state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const userClosedSidebarRef = useRef<boolean>(false); // Track if user manually closed sidebar
  const previousIsLargeScreenRef = useRef<boolean>(isLargeScreen); // Track previous screen size
  
  // Modal states
  const [showSettings, setShowSettings] = useState(false);
  const [settingsDefaultTab, setSettingsDefaultTab] = useState("general");
  const [showApiKeySetup, setShowApiKeySetup] = useState(false);
  
  // Loading and error states
  const [isLoading, setIsLoading] = useState(false);
  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(null);
  
  // Thinking mode
  const [enableThinking, setEnableThinking] = useState(false);
  
  // Cleanup refs
  const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Set initial sidebar state based on screen size and load settings (run only once on mount)
  useEffect(() => {
    // Set sidebar state based on screen size (only on initial mount)
    setIsSidebarOpen(isLargeScreen);
    // Initialize previous screen size reference
    previousIsLargeScreenRef.current = isLargeScreen;

    // Load thinking mode setting
    const savedThinking = SafeLocalStorage.get('enable_thinking');
    if (savedThinking !== null) {
      setEnableThinking(savedThinking === 'true');
    }
  }, []); // Only run on mount

  // Handle screen size changes separately to avoid interfering with user's sidebar state
  useEffect(() => {
    const previousIsLargeScreen = previousIsLargeScreenRef.current;

    // Only auto-open sidebar when screen becomes large AND user hasn't manually closed it
    if (isLargeScreen && !previousIsLargeScreen && !userClosedSidebarRef.current) {
      setIsSidebarOpen(true);
    }

    // Auto-close sidebar when screen changes from large to small
    if (!isLargeScreen && previousIsLargeScreen) {
      setIsSidebarOpen(false);
      userClosedSidebarRef.current = false; // Reset user closed flag for mobile
    }

    // Update previous screen size reference
    previousIsLargeScreenRef.current = isLargeScreen;
  }, [isLargeScreen]); // Only depend on screen size changes, not sidebar state

  // Handle thinking mode when model changes
  useEffect(() => {
    if (shouldAutoEnableThinking(selectedModel)) {
      // PRO_2_5 auto-enables thinking
      setEnableThinking(true);
      SafeLocalStorage.set('enable_thinking', 'true');
    } else if (supportsThinking(selectedModel)) {
      // Other 2.5 models default to OFF (reset to OFF when switching)
      setEnableThinking(false);
      SafeLocalStorage.set('enable_thinking', 'false');
    } else {
      // Non-thinking models disable thinking
      setEnableThinking(false);
      SafeLocalStorage.set('enable_thinking', 'false');
    }
  }, [selectedModel]); // Only depend on selectedModel to trigger on model change

  // Cleanup effect for memory leaks
  useEffect(() => {
    return () => {
      // Clear timeout on unmount
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }

      // Abort any ongoing requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Handle sidebar toggle with user intent tracking
  const handleSidebarToggle = () => {
    const newState = !isSidebarOpen;
    setIsSidebarOpen(newState);
    // Track user intent: if closing on large screen, mark as user-closed
    if (!newState && isLargeScreen) {
      userClosedSidebarRef.current = true;
    }
  };

  // Handle thinking toggle
  const handleToggleThinking = () => {
    const newThinkingState = !enableThinking;
    setEnableThinking(newThinkingState);
    // Save to localStorage for persistence
    SafeLocalStorage.set('enable_thinking', newThinkingState.toString());
  };

  return {
    // Sidebar state
    isSidebarOpen,
    setIsSidebarOpen,
    userClosedSidebarRef,
    handleSidebarToggle,
    
    // Modal states
    showSettings,
    setShowSettings,
    settingsDefaultTab,
    setSettingsDefaultTab,
    showApiKeySetup,
    setShowApiKeySetup,
    
    // Loading and error states
    isLoading,
    setIsLoading,
    lastFailedMessage,
    setLastFailedMessage,
    
    // Thinking mode
    enableThinking,
    setEnableThinking,
    handleToggleThinking,
    
    // Cleanup refs
    errorTimeoutRef,
    abortControllerRef,
    
    // Screen size
    isLargeScreen
  };
};

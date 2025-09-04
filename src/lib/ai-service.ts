/**
 * AI Service - Ready for integration with various AI providers
 * This is a placeholder service that can be easily extended
 */

import { AIMessage } from './ai-config';

// Re-export AIMessage for convenience
export type { AIMessage } from './ai-config';

// getLocalizedResponses function removed - was only used by PlaceholderAIService
// Moved to trash: trash/ai-optimization-20250721-222554/unused-code/

// PlaceholderAIService removed - not used in production
// Moved to trash: trash/ai-optimization-20250721-222554/unused-code/

// Re-export utility functions from ai-shared-utils to maintain backward compatibility
export { createAIMessage, formatMessagesForAPI } from './ai-shared-utils';

/**
 * Unified Gemini Service Implementation (Legacy Compatibility)
 * Re-exports the modular Gemini service for backward compatibility
 * 
 * REFACTORED: 2025-01-23 - Split into modular service pattern
 * Original: 641 lines → Modular: ~150 lines + separate handlers
 */

// Re-export everything from the modular service
export {
  GeminiService,
  getGeminiService,
  resetGeminiService,
  hasGeminiServiceInstance,
  GeminiClientHandler,
  GeminiServerHandler
} from './gemini-service';

export type {
  GeminiContent,
  UploadedFile,
  GeminiServiceOptions,
  StreamChunk,
  GeminiResponse,
  UseGeminiServiceOptions
} from './gemini-service';

// Default export for compatibility
export { GeminiService as default } from './gemini-service';

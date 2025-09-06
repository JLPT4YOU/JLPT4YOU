/**
 * Gemini Service Module Exports
 * Modular Gemini service with separated concerns
 */

// Main service class
export { GeminiService } from './service';

// Factory functions
export { getGeminiService, resetGeminiService, hasGeminiServiceInstance } from './factory';

// Handler classes (for advanced usage)
export { GeminiClientHandler } from './client-handler';
export { GeminiServerHandler } from './server-handler';

// Types
export type {
  GeminiContent,
  UploadedFile,
  GeminiServiceOptions,
  StreamChunk,
  GeminiResponse
} from './types';

// Re-export UseGeminiServiceOptions for compatibility
export type { UseGeminiServiceOptions } from '../gemini-helpers';

// Default export for compatibility
export { GeminiService as default } from './service';

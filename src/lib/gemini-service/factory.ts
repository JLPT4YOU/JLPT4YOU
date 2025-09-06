/**
 * Gemini Service Factory
 * Manages singleton instance and service creation
 */

import { GeminiService } from './service';

// Export singleton instance
let geminiServiceInstance: GeminiService | null = null;

export function getGeminiService(apiKey?: string): GeminiService {
  if (!geminiServiceInstance) {
    geminiServiceInstance = new GeminiService(apiKey);
  } else if (apiKey && !geminiServiceInstance.configured) {
    // Allow reconfiguration if service wasn't configured before
    geminiServiceInstance.configure(apiKey);
  }
  return geminiServiceInstance;
}

/**
 * Reset the singleton instance (useful for testing)
 */
export function resetGeminiService(): void {
  geminiServiceInstance = null;
}

/**
 * Check if service instance exists
 */
export function hasGeminiServiceInstance(): boolean {
  return geminiServiceInstance !== null;
}

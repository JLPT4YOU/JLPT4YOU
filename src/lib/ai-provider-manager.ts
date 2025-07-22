/**
 * AI Provider Manager
 * Manages multiple AI providers and provides unified interface
 */

import { AIService, AIMessage } from './ai-config';
import { getGeminiService } from './gemini-service';
import { getGroqService } from './groq-service';

export type ProviderType = 'gemini' | 'groq';

export interface ProviderConfig {
  type: ProviderType;
  name: string;
  apiKey?: string;
  isConfigured: boolean;
  defaultModel?: string;
}

export interface ChatMessage extends AIMessage {
  provider?: ProviderType;
  model?: string;
}

export class AIProviderManager {
  private providers: Map<ProviderType, AIService> = new Map();
  private currentProvider: ProviderType = 'gemini'; // Default provider
  
  constructor() {
    this.initializeProviders();
  }

  /**
   * Initialize all available providers
   */
  private initializeProviders(): void {
    // Initialize Gemini
    const geminiService = getGeminiService();
    this.providers.set('gemini', geminiService);

    // Initialize Groq
    const groqService = getGroqService();
    this.providers.set('groq', groqService);

    // Load current provider from localStorage
    const savedProvider = this.getSavedProvider();
    if (savedProvider && this.providers.has(savedProvider)) {
      this.currentProvider = savedProvider;
    }
  }

  /**
   * Get saved provider from localStorage
   */
  private getSavedProvider(): ProviderType | null {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('current_ai_provider') as ProviderType;
      return saved || null;
    }
    return null;
  }

  /**
   * Save current provider to localStorage
   */
  private saveCurrentProvider(): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('current_ai_provider', this.currentProvider);
    }
  }

  /**
   * Switch to a different provider
   */
  switchProvider(provider: ProviderType): void {
    if (!this.providers.has(provider)) {
      throw new Error(`Provider ${provider} is not available`);
    }
    
    this.currentProvider = provider;
    this.saveCurrentProvider();
  }

  /**
   * Get current active provider
   */
  getCurrentProvider(): ProviderType {
    return this.currentProvider;
  }

  /**
   * Get current active service
   */
  getCurrentService(): AIService {
    const service = this.providers.get(this.currentProvider);
    if (!service) {
      throw new Error(`Provider ${this.currentProvider} is not initialized`);
    }
    return service;
  }

  /**
   * Get specific provider service
   */
  getProviderService(provider: ProviderType): AIService {
    const service = this.providers.get(provider);
    if (!service) {
      throw new Error(`Provider ${provider} is not available`);
    }
    return service;
  }

  /**
   * Configure a provider with API key
   */
  configureProvider(provider: ProviderType, apiKey: string): void {
    const service = this.providers.get(provider);
    if (!service) {
      throw new Error(`Provider ${provider} is not available`);
    }

    if ('configure' in service && typeof service.configure === 'function') {
      service.configure(apiKey);
    }
  }

  /**
   * Check if a provider is configured
   */
  isProviderConfigured(provider: ProviderType): boolean {
    const service = this.providers.get(provider);
    if (!service) return false;

    if ('isConfigured' in service) {
      return Boolean(service.isConfigured);
    }
    return false;
  }

  /**
   * Get all provider configurations
   */
  getProviderConfigs(): ProviderConfig[] {
    const configs: ProviderConfig[] = [];

    this.providers.forEach((service, type) => {
      const isConfigured = this.isProviderConfigured(type);
      let defaultModel: string | undefined;

      // Get default model if service supports it
      if ('getDefaultModel' in service && typeof service.getDefaultModel === 'function') {
        try {
          defaultModel = service.getDefaultModel();
        } catch (error) {
          // Ignore error if method doesn't exist
        }
      }

      configs.push({
        type,
        name: this.getProviderDisplayName(type),
        isConfigured,
        defaultModel
      });
    });

    return configs;
  }

  /**
   * Get display name for provider
   */
  private getProviderDisplayName(provider: ProviderType): string {
    const names: Record<ProviderType, string> = {
      gemini: 'Google Gemini',
      groq: 'Groq (Llama)'
    };
    return names[provider] || provider;
  }

  /**
   * Send message using current provider
   */
  async sendMessage(messages: AIMessage[], options?: any): Promise<string> {
    const service = this.getCurrentService();
    return service.sendMessage(messages, options);
  }

  /**
   * Stream message using current provider
   */
  async streamMessage(
    messages: AIMessage[], 
    onChunk: (chunk: string) => void, 
    options?: any
  ): Promise<void> {
    const service = this.getCurrentService();
    return service.streamMessage(messages, onChunk, options);
  }

  /**
   * Generate chat title using current provider
   */
  async generateChatTitle(firstMessage: string): Promise<string> {
    const service = this.getCurrentService();
    
    // Check if service supports title generation
    if ('generateChatTitle' in service && typeof service.generateChatTitle === 'function') {
      return service.generateChatTitle(firstMessage);
    }

    // Fallback: create simple title from first message
    const words = firstMessage.trim().split(' ').slice(0, 4);
    return words.join(' ') || 'New Chat';
  }

  /**
   * Validate API key for a provider
   */
  async validateApiKey(provider: ProviderType, apiKey: string): Promise<boolean> {
    const service = this.providers.get(provider);
    if (!service) return false;

    return service.validateApiKey(apiKey);
  }

  /**
   * Get available models for current provider
   */
  getAvailableModels(): any[] {
    const service = this.getCurrentService();
    
    if ('getAvailableModels' in service && typeof service.getAvailableModels === 'function') {
      return service.getAvailableModels();
    }
    
    return [];
  }

  /**
   * Get available models for specific provider
   */
  getProviderModels(provider: ProviderType): any[] {
    const service = this.providers.get(provider);
    if (!service) return [];
    
    if ('getAvailableModels' in service && typeof service.getAvailableModels === 'function') {
      return service.getAvailableModels();
    }
    
    return [];
  }

  /**
   * Set default model for current provider
   */
  setDefaultModel(model: string): void {
    const service = this.getCurrentService();
    
    if ('setDefaultModel' in service && typeof service.setDefaultModel === 'function') {
      service.setDefaultModel(model);
    }
  }

  /**
   * Get current default model
   */
  getDefaultModel(): string | undefined {
    const service = this.getCurrentService();
    
    if ('getDefaultModel' in service && typeof service.getDefaultModel === 'function') {
      return service.getDefaultModel();
    }
    
    return undefined;
  }

  /**
   * Check if current provider supports a feature
   */
  supportsFeature(feature: 'streaming' | 'files' | 'vision' | 'thinking'): boolean {
    const service = this.getCurrentService();
    
    // This would need to be implemented based on provider capabilities
    // For now, return basic support
    switch (feature) {
      case 'streaming':
        return true; // Both providers support streaming
      case 'files':
        return this.currentProvider === 'gemini'; // Only Gemini supports files currently
      case 'vision':
        return this.currentProvider === 'groq'; // Groq has vision models
      case 'thinking':
        return this.currentProvider === 'gemini'; // Only Gemini has thinking mode
      default:
        return false;
    }
  }
}

// Export singleton instance
let aiProviderManagerInstance: AIProviderManager | null = null;

export function getAIProviderManager(): AIProviderManager {
  if (!aiProviderManagerInstance) {
    aiProviderManagerInstance = new AIProviderManager();
  }
  return aiProviderManagerInstance;
}

// Export class for custom instances
export { AIProviderManager as default };

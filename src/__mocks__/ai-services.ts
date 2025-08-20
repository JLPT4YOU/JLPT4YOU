/**
 * Mock AI Services for Testing
 * Provides mocks for Gemini and Groq services
 */

import type { AIMessage } from '@/lib/ai-config'

// Mock responses
export const MOCK_AI_RESPONSES = {
  simple: 'This is a test response from AI service.',
  title: 'Test Chat Title',
  error: 'Mock AI service error',
  streaming: ['Hello', ' world', ' from', ' AI', ' service!']
}

// Mock Gemini Service
export class MockGeminiService {
  public isConfigured = true
  public apiKey = 'mock-gemini-key'

  async sendMessage(messages: AIMessage[]): Promise<string> {
    if (messages.length === 0) {
      throw new Error('No messages provided')
    }
    return MOCK_AI_RESPONSES.simple
  }

  async streamMessage(
    messages: AIMessage[], 
    onChunk: (chunk: string) => void
  ): Promise<void> {
    for (const chunk of MOCK_AI_RESPONSES.streaming) {
      onChunk(chunk)
      await new Promise(resolve => setTimeout(resolve, 10))
    }
  }

  async generateChatTitle(_firstMessage: string): Promise<string> {
    return MOCK_AI_RESPONSES.title
  }

  async validateApiKey(apiKey: string): Promise<boolean> {
    return apiKey === 'valid-gemini-key'
  }

  configure(apiKey: string): void {
    this.apiKey = apiKey
    this.isConfigured = true
  }
}

// Mock Groq Service
export class MockGroqService {
  public isConfigured = true
  public apiKey = 'mock-groq-key'

  async sendMessage(messages: AIMessage[]): Promise<string> {
    if (messages.length === 0) {
      throw new Error('No messages provided')
    }
    return MOCK_AI_RESPONSES.simple
  }

  async streamMessage(
    messages: AIMessage[], 
    onChunk: (chunk: string) => void
  ): Promise<void> {
    for (const chunk of MOCK_AI_RESPONSES.streaming) {
      onChunk(chunk)
      await new Promise(resolve => setTimeout(resolve, 10))
    }
  }

  async generateChatTitle(_firstMessage: string): Promise<string> {
    return MOCK_AI_RESPONSES.title
  }

  async validateApiKey(apiKey: string): Promise<boolean> {
    return apiKey === 'valid-groq-key'
  }

  configure(apiKey: string): void {
    this.apiKey = apiKey
    this.isConfigured = true
  }
}

// Mock AI Provider Manager
export class MockAIProviderManager {
  private currentProvider = 'gemini'
  private services = {
    gemini: new MockGeminiService(),
    groq: new MockGroqService()
  }

  getCurrentService() {
    return this.services[this.currentProvider as keyof typeof this.services]
  }

  switchProvider(provider: 'gemini' | 'groq') {
    this.currentProvider = provider
  }

  async sendMessage(messages: AIMessage[]): Promise<string> {
    return this.getCurrentService().sendMessage(messages)
  }

  async streamMessage(
    messages: AIMessage[], 
    onChunk: (chunk: string) => void
  ): Promise<void> {
    return this.getCurrentService().streamMessage(messages, onChunk)
  }
}

// Test helpers
export function createMockAIMessage(content: string, role: 'user' | 'assistant' = 'user'): AIMessage {
  return {
    role,
    content,
    timestamp: Date.now()
  }
}

export function createMockConversation(): AIMessage[] {
  return [
    createMockAIMessage('Hello, how are you?', 'user'),
    createMockAIMessage('I am doing well, thank you!', 'assistant'),
    createMockAIMessage('Can you help me with JLPT?', 'user')
  ]
}

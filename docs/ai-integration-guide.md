# Multi-Provider AI Integration Guide

## Overview
This guide explains the multi-provider AI system in JLPT4YOU, supporting both Google Gemini and Groq (Llama) providers with shared chat history.

## Current Status
- ✅ Google Gemini fully integrated with advanced features
- ✅ Groq (Llama) integrated with ultra-fast inference
- ✅ Multi-provider architecture with unified interface
- ✅ Shared chat history across providers
- ✅ Provider-specific API key management
- ✅ Real-time provider switching

## Architecture

### Core Files
- `src/lib/ai-config.ts` - Base AI provider configurations and interfaces
- `src/lib/ai-provider-manager.ts` - Multi-provider management system
- `src/lib/gemini-service.ts` - Google Gemini implementation
- `src/lib/groq-service.ts` - Groq (Llama) implementation
- `src/components/chat/ChatLayout.tsx` - Chat UI with provider switching
- `src/components/chat/ProviderSelector.tsx` - Provider selection UI
- `src/components/multi-provider-api-key-modal.tsx` - API key management

### Key Interfaces
```typescript
interface AIService {
  sendMessage(messages: AIMessage[], options?: any): Promise<string>;
  streamMessage(messages: AIMessage[], onChunk: (chunk: string) => void, options?: any): Promise<void>;
  validateApiKey(apiKey: string): Promise<boolean>;
  generateChatTitle?(firstMessage: string): Promise<string>;
  configure?(apiKey: string): void;
  isConfigured?: boolean;
}

interface AIProviderManager {
  switchProvider(provider: ProviderType): void;
  getCurrentProvider(): ProviderType;
  getCurrentService(): AIService;
  configureProvider(provider: ProviderType, apiKey: string): void;
  isProviderConfigured(provider: ProviderType): boolean;
}
```

## Integration Steps

### 1. Choose Your AI Provider
Popular options:
- **OpenAI GPT** - Excellent for general chat and Japanese learning
- **Anthropic Claude** - Great for educational content and explanations
- **Google AI Studio** - Alternative to Gemini with similar features
- **Cohere** - Good for multilingual support
- **Local Models** - Ollama, LM Studio for privacy

### 2. Install Dependencies
```bash
# Example for OpenAI
npm install openai

# Example for Anthropic
npm install @anthropic-ai/sdk

# Example for Cohere
npm install cohere-ai
```

### 3. Update AI Configuration
Edit `src/lib/ai-config.ts`:
```typescript
export const AI_PROVIDERS: Record<string, AIProvider> = {
  openai: {
    name: 'OpenAI',
    baseURL: 'https://api.openai.com/v1',
    models: [
      {
        id: 'gpt-4',
        name: 'GPT-4',
        description: 'Most capable model',
        maxTokens: 8192,
        supportsStreaming: true,
        supportsFiles: false,
        costTier: 'high'
      }
    ]
  }
};
```

### 4. Implement AI Service
Replace the placeholder in `src/lib/ai-service.ts`:
```typescript
import OpenAI from 'openai';

class OpenAIService implements AIService {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async sendMessage(messages: AIMessage[]): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: 'gpt-4',
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      temperature: 0.7,
      max_tokens: 2048
    });

    return response.choices[0]?.message?.content || 'No response';
  }

  async streamMessage(messages: AIMessage[], onChunk: (chunk: string) => void): Promise<void> {
    const stream = await this.client.chat.completions.create({
      model: 'gpt-4',
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      stream: true,
      temperature: 0.7,
      max_tokens: 2048
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        onChunk(content);
      }
    }
  }

  async validateApiKey(apiKey: string): Promise<boolean> {
    try {
      const client = new OpenAI({ apiKey });
      await client.models.list();
      return true;
    } catch {
      return false;
    }
  }
}

export const aiService = new OpenAIService(process.env.OPENAI_API_KEY || '');
```

### 5. Environment Variables
Add to `.env.local`:
```env
OPENAI_API_KEY=your_api_key_here
# or
ANTHROPIC_API_KEY=your_api_key_here
# or
COHERE_API_KEY=your_api_key_here
```

### 6. Update System Prompt
Customize the system prompt in `ai-config.ts` for your specific needs:
```typescript
export const DEFAULT_AI_SETTINGS = {
  systemPrompt: `You are iRIN Sensei, an expert Japanese language tutor specializing in JLPT preparation.
  
Your expertise includes:
- Grammar explanations with clear examples
- Vocabulary building and mnemonics
- Kanji stroke order and readings
- Cultural context and usage patterns
- JLPT exam strategies and practice

Always respond in a supportive, educational manner. Use Vietnamese for explanations when helpful, but focus on Japanese learning content.`
};
```

## Testing

### 1. Basic Functionality
- Send a simple message: "Hello"
- Check for appropriate response
- Verify loading states work

### 2. Japanese Learning Features
- Ask about grammar: "Explain て-form"
- Request vocabulary help: "N3 vocabulary for food"
- Kanji questions: "How to write 学校"

### 3. Error Handling
- Test with invalid API key
- Test network failures
- Verify graceful degradation

## Advanced Features

### Streaming Support
The current implementation supports streaming responses for better UX. Enable in ChatLayout by updating the AI call.

### File Upload (Future)
The architecture is ready for file upload support. Implement in your chosen provider's service.

### Multi-language Support
The system supports Vietnamese, Japanese, and English responses based on user preference.

## Troubleshooting

### Common Issues
1. **API Key not working** - Check environment variables and provider dashboard
2. **Rate limiting** - Implement retry logic and user feedback
3. **Large responses** - Set appropriate token limits
4. **Streaming issues** - Ensure proper error handling in stream processing

### Debug Mode
Enable console logging in development:
```typescript
// In ai-service.ts
console.log('Sending to AI:', messages);
console.log('AI Response:', response);
```

## Next Steps
1. Choose and implement your preferred AI provider
2. Test thoroughly with Japanese learning scenarios
3. Add API key management UI (optional)
4. Implement usage tracking and limits
5. Add more specialized prompts for different JLPT levels

---

## Multi-Provider System (Current Implementation)

### Available Providers

#### Google Gemini
- **Models**: Gemini 2.5 Pro, Flash, Flash Lite, Gemini 2.0 Flash
- **Features**:
  - Thinking mode with thought summaries
  - File upload support (images, PDFs, documents)
  - Google Search integration
  - Code execution
  - URL context analysis
- **API Key**: Get from [Google AI Studio](https://aistudio.google.com/app/apikey)
- **Format**: `AIza...`

#### Groq (Llama)
- **Models**: Llama 3.3 70B, Llama 3.2 Vision, Llama 3.1 series, Mixtral 8x7B
- **Features**:
  - Ultra-fast inference (10x faster than traditional APIs)
  - Cost-effective pricing
  - High throughput
  - Streaming support
- **API Key**: Get from [Groq Console](https://console.groq.com/keys)
- **Format**: `gsk_...`

### Usage Guide

#### 1. Setup API Keys
1. Open the chat interface
2. Click on the provider selector in the header
3. Choose "Setup Required" provider
4. Enter your API key in the modal
5. Click "Configure" to validate and save

#### 2. Switch Between Providers
1. Click the provider selector in the header
2. Choose your preferred provider
3. Models will automatically update based on the selected provider
4. Chat history is shared across all providers

#### 3. Provider-Specific Features

**Using Gemini Thinking Mode:**
1. Switch to a Gemini provider
2. Select a model that supports thinking (2.5 Pro, 2.5 Flash)
3. Enable thinking mode in the input area
4. Send your message to see thought process + final answer

**Using Groq for Speed:**
1. Switch to Groq provider
2. Select Llama 3.1 8B Instant for fastest responses
3. Perfect for quick questions and rapid prototyping

**File Upload (Gemini Only):**
1. Switch to Gemini provider
2. Select a model that supports files (2.5 Pro, 2.5 Flash)
3. Drag and drop files or click the attachment button
4. Supported formats: images, PDFs, documents

### Testing Components

Use the `ProviderTestDemo` component to test both providers:

```typescript
import { ProviderTestDemo } from '@/components/chat/ProviderTestDemo';

// Add to your test page
<ProviderTestDemo />
```

This component allows you to:
- Test both providers with the same message
- Compare response times and quality
- Test streaming functionality
- Verify API key configuration

## Support
For questions about the multi-provider integration, check the existing chat components and follow the established patterns in the codebase.

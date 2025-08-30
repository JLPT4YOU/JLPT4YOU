# Multi-Provider AI Setup Guide

## Overview

JLPT4YOU now supports multiple AI providers with shared chat history. You can switch between Google Gemini and Groq (Llama) seamlessly while maintaining your conversation context.

## Quick Start

### 1. Get API Keys

#### Google Gemini
1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key (starts with `AIza...`)

#### Groq (Llama)
1. Visit [Groq Console](https://console.groq.com/keys)
2. Sign up for a free account
3. Click "Create API Key"
4. Copy the key (starts with `gsk_...`)

### 2. Configure in JLPT4YOU

1. Open the chat interface
2. Look for the provider selector in the header (next to model selector)
3. Click on a provider showing "Setup Required"
4. Enter your API key in the modal
5. Click "Configure" to validate and save

### 3. Start Chatting

- Switch between providers anytime using the provider selector
- Your chat history is preserved across all providers
- Each provider has different models and capabilities

## Provider Comparison

| Feature | Google Gemini | Groq (Llama) |
|---------|---------------|--------------|
| **Speed** | Standard | Ultra-fast (10x faster) |
| **Cost** | Medium | Low |
| **Thinking Mode** | ✅ Yes | ❌ No |
| **File Upload** | ✅ Yes | ❌ No |
| **Google Search** | ✅ Yes | ❌ No |
| **Code Execution** | ✅ Yes | ❌ No |
| **Streaming** | ✅ Yes | ✅ Yes |
| **Japanese Support** | ✅ Excellent | ✅ Good |
| **Context Window** | 128K tokens | 32K-128K tokens |

## When to Use Each Provider

### Use Google Gemini When:
- You need file analysis (images, PDFs, documents)
- You want thinking mode to see AI's reasoning process
- You need Google Search integration
- You're working with complex problems requiring deep analysis
- You need code execution capabilities

### Use Groq (Llama) When:
- You want the fastest possible responses
- You're doing rapid prototyping or quick Q&A
- Cost is a primary concern
- You need high throughput for many requests
- You're doing simple text-based conversations

## Available Models

### Google Gemini Models
- **Gemini 2.5 Pro**: Most capable, supports thinking mode
- **Gemini 2.5 Flash**: Balanced speed and capability
- **Gemini 2.5 Flash Lite**: Fastest Gemini model
- **Gemini 2.0 Flash**: Latest generation with Google Search

### Groq (Llama) Models
- **Llama 3.3 70B**: Latest and most capable
- **Llama 3.2 90B Vision**: Supports image analysis
- **Llama 3.1 405B**: Largest reasoning model
- **Llama 3.1 70B**: Versatile large model
- **Llama 3.1 8B Instant**: Fastest responses
- **Mixtral 8x7B**: Mixture of experts model

## Advanced Features

### Thinking Mode (Gemini Only)
1. Switch to Gemini provider
2. Select a 2.5 series model
3. Enable thinking toggle in input area
4. Send your message
5. See both the AI's thought process and final answer

### File Upload (Gemini Only)
1. Switch to Gemini provider
2. Select a model that supports files
3. Drag and drop files or use attachment button
4. Supported: images, PDFs, Word docs, text files

### Speed Optimization (Groq)
1. Switch to Groq provider
2. Select "Llama 3.1 8B Instant" for fastest responses
3. Perfect for quick questions and rapid iteration

## Troubleshooting

### API Key Issues
- **Invalid key**: Check the format (Gemini: `AIza...`, Groq: `gsk_...`)
- **No permissions**: Ensure your account has API access
- **Quota exceeded**: Check your usage limits in provider console

### Performance Issues
- **Slow responses**: Try switching to Groq for faster inference
- **Rate limits**: Wait a moment and try again
- **Large files**: Use smaller files or switch to text-only

### Feature Not Working
- **Thinking mode**: Only available on Gemini 2.5 models
- **File upload**: Only available on Gemini models
- **Google Search**: Only available on Gemini 2.0+ models

## Best Practices

### For Learning Japanese
1. **Grammar questions**: Use Gemini with thinking mode for detailed explanations
2. **Quick vocabulary**: Use Groq for fast lookups
3. **Document analysis**: Use Gemini for reading Japanese texts or images
4. **Practice conversations**: Switch between providers for variety

### For Development
1. **Code review**: Use Gemini with code execution
2. **Quick debugging**: Use Groq for fast responses
3. **Documentation**: Use Gemini with file upload for analyzing docs
4. **Rapid prototyping**: Use Groq for speed

### Cost Optimization
1. Use Groq for simple questions (cheaper)
2. Use Gemini only when you need advanced features
3. Monitor usage in provider consoles
4. Consider using smaller models for basic tasks

## API Limits and Pricing

### Google Gemini
- **Free tier**: 15 requests per minute
- **Paid tier**: Higher limits, pay per token
- **File uploads**: Count towards token usage

### Groq
- **Free tier**: 30 requests per minute
- **Very cost-effective**: Much cheaper than traditional APIs
- **High throughput**: Designed for speed

## Security Notes

- API keys are stored locally in your browser
- Keys are not sent to JLPT4YOU servers
- Each provider validates keys directly
- You can remove keys anytime in the settings

## Getting Help

1. **Provider Issues**: Check the provider's documentation
   - [Gemini API Docs](https://ai.google.dev/docs)
   - [Groq API Docs](https://console.groq.com/docs)

2. **JLPT4YOU Issues**: Use the test component to diagnose:
   ```typescript
   import { ProviderTestDemo } from '@/components/chat/ProviderTestDemo';
   ```

3. **Feature Requests**: The architecture supports adding more providers easily

## What's Next

The multi-provider system is designed to be extensible. Future providers that could be added:
- OpenAI GPT-4
- Anthropic Claude
- Cohere Command
- Local models via Ollama

Each provider can be added without affecting existing functionality or chat history.

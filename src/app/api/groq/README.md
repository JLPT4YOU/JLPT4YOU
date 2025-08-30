# Groq API Endpoints

## Overview

API endpoints for Groq chat completions with advanced features support for OpenAI GPT-OSS models.

## Endpoints

### `/api/groq/chat`

Main chat endpoint with auto-detection of advanced features.

#### GET Parameters
- `action=models` - Get all available models
- `action=validate&apiKey=xxx` - Validate API key
- `action=features&model=xxx` - Check model capabilities

#### POST Body
```json
{
  "messages": [
    {"role": "user", "content": "Hello"}
  ],
  "model": "openai/gpt-oss-20b",
  "temperature": 0.8,
  "stream": false,
  // Advanced features (GPT-OSS models only)
  "reasoning_effort": "medium",
  "reasoning_format": "parsed", 
  "enable_code_interpreter": true,
  "enable_browser_search": false
}
```

#### Response
For regular models:
```json
{
  "message": {
    "role": "assistant",
    "content": "Response text"
  },
  "model": "llama-3.3-70b-versatile",
  "advanced_features": false
}
```

For GPT-OSS models:
```json
{
  "message": {
    "role": "assistant", 
    "content": "Response text"
  },
  "reasoning": "AI thinking process...",
  "executed_tools": [
    {
      "name": "code_interpreter",
      "type": "code_interpreter",
      "output": "Execution result..."
    }
  ],
  "model": "openai/gpt-oss-20b",
  "advanced_features": true
}
```

### `/api/groq/advanced`

Dedicated endpoint for GPT-OSS models with advanced features.

#### GET Parameters
- `action=supported-models` - Get models with advanced features
- `action=reasoning-options` - Get reasoning configuration options
- `action=tools-options` - Get available tools
- `action=model-capabilities&model=xxx` - Get specific model capabilities

#### POST Body
```json
{
  "messages": [
    {"role": "user", "content": "Write Python code to calculate fibonacci"}
  ],
  "model": "openai/gpt-oss-120b",
  "reasoning_effort": "high",
  "reasoning_format": "parsed",
  "enable_code_interpreter": true,
  "enable_browser_search": true,
  "stream": false
}
```

#### Response
```json
{
  "message": {
    "role": "assistant",
    "content": "Here's the Fibonacci code..."
  },
  "reasoning": "I need to write a Python function...",
  "executed_tools": [
    {
      "name": "code_interpreter",
      "type": "code_interpreter", 
      "arguments": "def fibonacci(n):\n    if n <= 1:\n        return n\n    return fibonacci(n-1) + fibonacci(n-2)\n\nprint(fibonacci(10))",
      "code_results": [
        {"text": "55"}
      ]
    }
  ],
  "advanced_features": {
    "reasoning_effort": "high",
    "reasoning_format": "parsed",
    "code_interpreter_enabled": true,
    "browser_search_enabled": true
  }
}
```

## Advanced Features

### Reasoning Effort
- `low` - Fast responses with minimal thinking
- `medium` - Balanced thinking and speed (default)
- `high` - Deep thinking with detailed reasoning

### Reasoning Format
- `parsed` - Structured reasoning output (default)
- `raw` - Raw reasoning tokens
- `hidden` - Hide reasoning from response

### Tools
- `code_interpreter` - Execute Python code and return results
- `browser_search` - Search the web for current information

## Supported Models

### GPT-OSS Models (Advanced Features)
- `openai/gpt-oss-120b` - 120B parameter model
- `openai/gpt-oss-20b` - 20B parameter model (default)

### Regular Models
- `meta-llama/llama-4-maverick-17b-128e-instruct`
- `meta-llama/llama-4-scout-17b-16e-instruct`
- `llama-3.3-70b-versatile`
- `llama3-70b-8192`
- `llama-3.1-8b-instant`
- `moonshotai/kimi-k2-instruct`
- `deepseek-r1-distill-llama-70b`
- `qwen/qwen3-32b`
- `compound-beta`
- `compound-beta-mini`

## Error Handling

### Model Not Supported
```json
{
  "error": "Model openai/gpt-oss-20b does not support advanced features. Use GPT-OSS models instead.",
  "supportedModels": ["openai/gpt-oss-120b", "openai/gpt-oss-20b"]
}
```

### Invalid Parameters
```json
{
  "error": "Messages array is required"
}
```

### API Key Issues
```json
{
  "error": "Invalid API key or insufficient permissions"
}
```

## Streaming

Both endpoints support streaming responses:

```json
{
  "stream": true
}
```

Streaming response format:
```
data: {"content": "Hello", "type": "content"}

data: {"content": " world", "type": "content"}

data: {"done": true, "type": "complete"}
```

## Rate Limits

- Standard Groq API rate limits apply
- Advanced features may have additional usage limits
- Monitor your usage through Groq console

## Examples

### Basic Chat
```bash
curl -X POST http://localhost:3000/api/groq/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "Hello"}],
    "model": "llama-3.3-70b-versatile"
  }'
```

### Advanced Chat with Code Execution
```bash
curl -X POST http://localhost:3000/api/groq/advanced \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "Calculate 2+2 using Python"}],
    "model": "openai/gpt-oss-20b",
    "reasoning_effort": "medium",
    "enable_code_interpreter": true
  }'
```

### Get Available Models
```bash
curl -X GET "http://localhost:3000/api/groq/chat?action=models"
```

### Get Advanced Features Info
```bash
curl -X GET "http://localhost:3000/api/groq/advanced?action=reasoning-options"
```

# Design Document

## Overview

Dự án hiện tại có một hệ thống AI phức tạp với nhiều layer abstraction và code duplication. Design này sẽ tối ưu hóa toàn bộ architecture để tạo ra một hệ thống clean, maintainable và extensible.

### Current Issues Identified

1. **Code Duplication:**
   - `validateApiKey()` được implement riêng biệt trong mỗi service
   - `generateChatTitle()` có logic tương tự trong Gemini và Groq
   - `convertMessages()` có duplicate logic
   - Error handling patterns được repeat

2. **Unused Code:**
   - `PlaceholderAIService` trong `ai-service.ts` không được sử dụng
   - Một số utility functions trong `ai-shared-utils.ts` có thể không cần thiết
   - Multiple config interfaces có overlap

3. **Complex Architecture:**
   - Quá nhiều abstraction layers
   - Provider manager có thể được simplify
   - Type definitions scattered across multiple files

## Architecture

### New Simplified Structure

```
src/lib/ai/
├── core/
│   ├── types.ts           # Consolidated AI types
│   ├── base-service.ts    # Shared base functionality
│   └── errors.ts          # Centralized error handling
├── providers/
│   ├── gemini/
│   │   ├── service.ts     # Clean Gemini implementation
│   │   └── config.ts      # Gemini-specific config
│   └── groq/
│       ├── service.ts     # Clean Groq implementation
│       └── config.ts      # Groq-specific config
├── shared/
│   ├── utils.ts           # Common utilities
│   ├── message-converter.ts # Message format conversion
│   └── title-generator.ts  # Chat title generation
└── index.ts               # Main export file
```

### Key Design Principles

1. **Single Responsibility:** Mỗi file có một mục đích rõ ràng
2. **DRY (Don't Repeat Yourself):** Loại bỏ tất cả code duplication
3. **Composition over Inheritance:** Sử dụng composition thay vì complex inheritance
4. **Type Safety:** Consolidated type definitions với strict typing

## Components and Interfaces

### Core Types (src/lib/ai/core/types.ts)

```typescript
// Consolidated AI types
export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
}

export interface AIServiceOptions {
  model?: string;
  temperature?: number;
  enableThinking?: boolean;
  enableTools?: boolean;
}

export interface AIService {
  sendMessage(messages: AIMessage[], options?: AIServiceOptions): Promise<string>;
  streamMessage(messages: AIMessage[], onChunk: (chunk: string) => void, options?: AIServiceOptions): Promise<void>;
  validateApiKey(apiKey: string): Promise<boolean>;
  generateChatTitle(firstMessage: string): Promise<string>;
  configure(apiKey: string): void;
  isConfigured: boolean;
}

export type ProviderType = 'gemini' | 'groq';
```

### Base Service (src/lib/ai/core/base-service.ts)

```typescript
// Shared functionality for all AI services
export abstract class BaseAIService implements AIService {
  // Common methods like error handling, API key management
  // Abstract methods that must be implemented by providers
}
```

### Provider Services

Mỗi provider sẽ có implementation riêng nhưng follow chung interface:

```typescript
// src/lib/ai/providers/gemini/service.ts
export class GeminiService extends BaseAIService {
  // Gemini-specific implementation
}

// src/lib/ai/providers/groq/service.ts  
export class GroqService extends BaseAIService {
  // Groq-specific implementation
}
```

### Shared Utilities

```typescript
// src/lib/ai/shared/utils.ts
export const aiUtils = {
  validateApiKeyFormat,
  createFallbackTitle,
  detectTitleLanguage,
  // Other shared utilities
};

// src/lib/ai/shared/message-converter.ts
export const messageConverter = {
  toGemini: (messages: AIMessage[]) => ConvertedMessage[],
  toGroq: (messages: AIMessage[]) => ConvertedMessage[],
  // Centralized conversion logic
};
```

## Data Models

### Simplified Provider Manager

```typescript
export class AIProviderManager {
  private providers: Map<ProviderType, AIService>;
  private currentProvider: ProviderType;
  
  // Simplified interface
  switchProvider(provider: ProviderType): void;
  getCurrentService(): AIService;
  configureProvider(provider: ProviderType, apiKey: string): void;
}
```

### Configuration Consolidation

- Merge overlapping config interfaces
- Create shared configuration types
- Eliminate redundant model definitions

## Error Handling

### Centralized Error System

```typescript
// src/lib/ai/core/errors.ts
export class AIError extends Error {
  constructor(
    message: string,
    public code: string,
    public retryable: boolean = false
  ) {
    super(message);
  }
}

export const errorHandler = {
  handleApiError: (error: unknown, context: string) => AIError,
  isRetryableError: (error: Error) => boolean,
  // Standardized error handling
};
```

## Testing Strategy

### Unit Tests
- Test shared utilities independently
- Mock provider services for testing
- Test error handling scenarios

### Integration Tests  
- Test provider switching
- Test message flow end-to-end
- Test backup/restore functionality

### Performance Tests
- Measure bundle size reduction
- Test memory usage optimization
- Benchmark API response times

## Migration Strategy

### Phase 1: Backup Creation
- Create comprehensive backup system
- Backup all AI-related files with timestamps
- Implement rollback mechanism

### Phase 2: Core Infrastructure
- Create new directory structure
- Implement base types and interfaces
- Set up shared utilities

### Phase 3: Provider Migration
- Migrate Gemini service to new structure
- Migrate Groq service to new structure
- Update provider manager

### Phase 4: Integration & Cleanup
- Update all imports throughout codebase
- Remove old files
- Clean up unused dependencies

### Phase 5: Validation
- Run comprehensive tests
- Verify functionality parity
- Performance benchmarking

## Backup System Design

### Backup Structure
```
backup/
└── ai-optimization-{timestamp}/
    ├── metadata.json      # Backup info and file list
    ├── original/          # Original files
    │   ├── lib/
    │   ├── hooks/
    │   └── contexts/
    └── restore.sh         # Automated restore script
```

### Backup Metadata
```json
{
  "timestamp": "2025-01-21T10:30:00Z",
  "description": "AI Code Optimization Backup",
  "files": ["src/lib/ai-config.ts", "..."],
  "checksum": "sha256-hash",
  "version": "1.0.0"
}
```

## Expected Outcomes

### Code Reduction
- **Target:** 30-40% reduction in AI-related code
- **Method:** Eliminate duplication, unused code, and over-abstraction

### Bundle Size Optimization
- **Target:** 20-25% reduction in bundle size
- **Method:** Tree-shaking unused exports, consolidating imports

### Maintainability Improvements
- Single source of truth for types
- Consistent error handling patterns
- Clear separation of concerns
- Simplified provider management

### Performance Benefits
- Faster build times due to fewer files
- Better tree-shaking optimization
- Reduced memory footprint
- Cleaner dependency graph
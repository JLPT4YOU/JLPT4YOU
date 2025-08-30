# Chat Hooks Documentation

This folder contains custom React hooks that were extracted from the original `ChatLayout.tsx` component to improve maintainability, reusability, and follow the Single Responsibility Principle.

## 🎯 Refactoring Results

**Before:** 1364 lines in a single component
**After:** 157 lines in main component + 6 specialized hooks
**Reduction:** 88% code reduction in main component

## 📁 Hook Overview

### Core Hooks

#### `useAIProvider.ts`
**Purpose:** Manages AI provider switching, model selection, and provider-specific configurations.

**Key Features:**
- Provider switching (Gemini, Groq)
- Model selection and validation
- Provider color formatting
- Model capabilities detection

**Usage:**
```typescript
const aiProvider = useAIProvider();
// Access: selectedModel, currentProvider, aiModels
// Actions: setSelectedModel, switchProvider
```

#### `useChatManager.ts`
**Purpose:** Manages chat state, CRUD operations, and localStorage persistence.

**Key Features:**
- Chat creation, selection, deletion
- LocalStorage persistence
- Chat history management
- Message updates

**Usage:**
```typescript
const chatManager = useChatManager();
// Access: chats, currentChatId, currentChat
// Actions: handleNewChat, handleSelectChat, handleDeleteChat
```

#### `useUIState.ts`
**Purpose:** Manages UI state including sidebar, modals, loading states, and user interactions.

**Key Features:**
- Sidebar state management
- Modal visibility control
- Loading and error states
- Thinking mode toggle
- Screen size responsiveness

**Usage:**
```typescript
const uiState = useUIState(selectedModel);
// Access: isSidebarOpen, showSettings, isLoading, enableThinking
// Actions: handleSidebarToggle, setShowSettings, handleToggleThinking
```

#### `useMessageHandler.ts`
**Purpose:** Handles message sending, editing, AI response generation, and streaming.

**Key Features:**
- Message sending and editing
- AI response generation
- Streaming support
- File processing integration
- Error handling

**Usage:**
```typescript
const messageHandler = useMessageHandler(props);
// Actions: handleSendMessage, handleEditMessage, generateAIResponse
```

### Utility Hooks

#### `useLocalStorage.ts`
**Purpose:** Type-safe localStorage operations with automatic serialization.

**Key Features:**
- Generic type support
- Automatic JSON serialization
- Error handling
- Multiple value types (boolean, string, object)

**Usage:**
```typescript
const [value, setValue, removeValue] = useLocalStorage('key', defaultValue);
const [enabled, setEnabled] = useLocalStorageBoolean('feature', false);
```

#### `useStreamingResponse.ts`
**Purpose:** Manages streaming AI responses with thinking mode support.

**Key Features:**
- Throttled updates with requestAnimationFrame
- Thinking/answer separation
- Groq thinking signals handling
- Performance optimization

**Usage:**
```typescript
const streaming = useStreamingResponse({ chatId, setChats });
// Actions: createStreamingMessage, handleStreamChunk, handleThoughtChunk
```

#### `useFileHandler.ts`
**Purpose:** Handles file operations including PDF processing and image storage.

**Key Features:**
- File validation
- PDF processing
- Base64 conversion
- Image storage management

**Usage:**
```typescript
const fileHandler = useFileHandler(props);
// Actions: processMultiplePDFs, validateFileSupport, convertFilesToBase64
```

## 🏗️ Architecture Benefits

### 1. **Separation of Concerns**
Each hook has a single, well-defined responsibility:
- AI Provider management
- Chat state management
- UI state management
- Message handling
- File operations
- Local storage
- Streaming responses

### 2. **Reusability**
Hooks can be reused across different components:
```typescript
// Can be used in other chat-related components
const aiProvider = useAIProvider();
const chatManager = useChatManager();
```

### 3. **Testability**
Each hook can be tested independently:
```typescript
// Easy to unit test
import { renderHook } from '@testing-library/react-hooks';
import { useAIProvider } from './useAIProvider';

test('should switch provider correctly', () => {
  const { result } = renderHook(() => useAIProvider());
  // Test provider switching logic
});
```

### 4. **Performance Optimization**
- `useCallback` for stable function references
- `useMemo` for expensive computations
- `React.memo` for component memoization
- Throttled updates for streaming responses

### 5. **Type Safety**
All hooks are fully typed with TypeScript:
```typescript
interface UseAIProviderReturn {
  selectedModel: string;
  currentProvider: ProviderType;
  aiModels: AIModel[];
  // ... more typed properties
}
```

## 🔄 Data Flow

```
ChatLayout
├── useAIProvider (AI models & providers)
├── useChatManager (chat state & persistence)
├── useUIState (UI state & interactions)
└── useMessageHandler (message operations)
    ├── useStreamingResponse (streaming logic)
    ├── useFileHandler (file operations)
    └── useLocalStorage (storage operations)
```

## 📈 Performance Improvements

1. **Reduced Re-renders:** Memoized components and callbacks
2. **Optimized Updates:** RequestAnimationFrame for streaming
3. **Efficient Storage:** Batched localStorage operations
4. **Smart Dependencies:** Minimal dependency arrays

## 🛠️ Development Guidelines

### Adding New Hooks
1. Follow the naming convention: `use[Feature]Hook.ts`
2. Include comprehensive JSDoc comments
3. Add TypeScript interfaces for props and return values
4. Use `useCallback` and `useMemo` for performance
5. Handle errors gracefully
6. Update this README

### Hook Dependencies
- Keep dependency arrays minimal
- Use `useCallback` for functions passed as props
- Use `useMemo` for expensive computations
- Avoid circular dependencies between hooks

### Testing
- Write unit tests for each hook
- Test error scenarios
- Mock external dependencies
- Use React Testing Library hooks utilities

## 🔧 Maintenance

### Code Quality
- All hooks follow React hooks rules
- ESLint and TypeScript checks pass
- Consistent error handling patterns
- Comprehensive documentation

### Future Improvements
- [ ] Add more granular error types
- [ ] Implement hook composition patterns
- [ ] Add performance monitoring
- [ ] Create hook testing utilities

## 📚 Related Documentation

- [React Hooks Documentation](https://reactjs.org/docs/hooks-intro.html)
- [TypeScript React Hooks](https://react-typescript-cheatsheet.netlify.app/docs/basic/getting-started/hooks)
- [Testing React Hooks](https://react-hooks-testing-library.com/)

---

*This documentation is maintained as part of the ChatLayout refactoring project. Last updated: 2025-01-22*

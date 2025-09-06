/**
 * Shared types for Gemini service modules
 */

import { AIMessage } from '../ai-config';

export interface GeminiContent {
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
}

export interface UploadedFile {
  name: string;
  displayName: string;
  mimeType: string;
  sizeBytes: number;
  createTime: string;
  updateTime: string;
  expirationTime: string;
  sha256Hash: string;
  uri: string;
  state: string;
}

export interface GeminiServiceOptions {
  model?: string;
  temperature?: number;
  systemPrompt?: string;
  enableGoogleSearch?: boolean;
  enableTools?: boolean;
  enableUrlContext?: boolean;
  enableCodeExecution?: boolean;
  enableThinking?: boolean;
  thinkingConfig?: {
    thinkingBudget?: number;
    includeThoughts?: boolean;
  };
  abortController?: AbortController;
  abortSignal?: AbortSignal;
  files?: any[];
  stream?: boolean;
}

export interface StreamChunk {
  type: 'content' | 'thought' | 'reasoning_complete' | 'done';
  content?: string;
}

export interface GeminiResponse {
  text?: string;
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
        thought?: boolean;
        executableCode?: { code: string; language?: string };
        codeExecutionResult?: { output: string };
      }>;
    };
  }>;
}

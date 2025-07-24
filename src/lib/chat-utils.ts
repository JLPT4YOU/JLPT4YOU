/**
 * Chat Utilities
 * Common functions for chat operations and message handling
 */

import { Chat, Message } from '@/components/chat/index';
import { GROQ_MODELS } from './groq-config';

/**
 * Detects URLs in text content
 */
export function detectUrls(text: string): string[] {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const matches = text.match(urlRegex);
  return matches || [];
}

/**
 * Detects code-related keywords in message content
 */
export function detectCodeKeywords(text: string, localizedKeywords: string[] = []): boolean {
  const baseKeywords = [
    'code', 'python', 'javascript', 'java', 'c++', 'c#', 'go', 'rust', 'php',
    'calculate', 'compute', 'algorithm', 'function', 'script', 'program',
    'sum of', 'factorial', 'fibonacci', 'prime numbers', 'sort', 'search',
    'data analysis', 'plot', 'graph', 'chart', 'visualization',
    'math', 'mathematics', 'equation', 'formula', 'solve'
  ];

  const allKeywords = [...baseKeywords, ...localizedKeywords];
  const lowerText = text.toLowerCase();
  return allKeywords.some(keyword => lowerText.includes(keyword));
}

/**
 * Generates a smart title for a chat based on the first message
 */
export async function generateChatTitle(
  content: string,
  maxLength: number = 50
): Promise<string> {
  // Simple title generation - can be enhanced with AI later
  const cleanContent = content
    .replace(/[^\w\s]/g, ' ') // Remove special characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();

  if (cleanContent.length <= maxLength) {
    return cleanContent;
  }

  // Find a good breaking point
  const words = cleanContent.split(' ');
  let title = '';
  
  for (const word of words) {
    if ((title + ' ' + word).length > maxLength) {
      break;
    }
    title += (title ? ' ' : '') + word;
  }

  return title || cleanContent.slice(0, maxLength);
}

/**
 * Validates chat data structure
 */
export function validateChat(chat: unknown): chat is Chat {
  if (!chat || typeof chat !== 'object') return false;
  
  const c = chat as any;
  return (
    typeof c.id === 'string' &&
    typeof c.title === 'string' &&
    c.timestamp instanceof Date &&
    Array.isArray(c.messages) &&
    c.messages.every(validateMessage)
  );
}

/**
 * Validates message data structure
 */
export function validateMessage(message: unknown): message is Message {
  if (!message || typeof message !== 'object') return false;
  
  const m = message as any;
  return (
    typeof m.id === 'string' &&
    typeof m.content === 'string' &&
    (m.role === 'user' || m.role === 'assistant') &&
    m.timestamp instanceof Date
  );
}

/**
 * Sanitizes user input for safety
 */
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
    .slice(0, 10000); // Limit length
}

/**
 * Formats file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Validates file type for upload
 */
export function validateFileType(file: File, allowedTypes: string[]): boolean {
  if (!file.type) return false;

  return allowedTypes.some(type => {
    if (type.endsWith('/*')) {
      const category = type.slice(0, -2);
      return file.type.startsWith(category);
    }
    return file.type === type;
  });
}

/**
 * Gets file extension from filename
 */
export function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  return lastDot !== -1 ? filename.slice(lastDot + 1).toLowerCase() : '';
}

/**
 * Checks if file is an image
 */
export function isImageFile(file: File): boolean {
  return file.type ? file.type.startsWith('image/') : false;
}

/**
 * Checks if file is a PDF
 */
export function isPdfFile(file: File): boolean {
  return file.type === 'application/pdf';
}

/**
 * Creates a safe filename for download
 */
export function createSafeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace unsafe characters
    .replace(/_+/g, '_') // Collapse multiple underscores
    .replace(/^_|_$/g, ''); // Remove leading/trailing underscores
}

/**
 * Debounces a function call
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttles a function call
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Creates a delay promise
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Safely parses JSON with fallback
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

/**
 * Copies text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const result = document.execCommand('copy');
      textArea.remove();
      return result;
    }
  } catch {
    return false;
  }
}

/**
 * Generates a unique ID
 */
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Checks if string is empty or whitespace only
 */
export function isEmpty(str: string): boolean {
  return !str || str.trim().length === 0;
}

/**
 * Truncates text to specified length with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Checks if current provider is Groq
 */
export function isGroqProvider(currentProvider?: string): boolean {
  return currentProvider === 'groq';
}

/**
 * Checks if model ID belongs to Groq
 */
export function isGroqModel(modelId?: string): boolean {
  if (!modelId) return false;

  // Check if model ID matches any Groq model patterns
  const groqModelIds = Object.values(GROQ_MODELS);
  return groqModelIds.includes(modelId as any);
}

/**
 * Checks if current provider or model supports file uploads
 * Returns false for Groq provider/models, true for others
 */
export function supportsFileUploads(currentProvider?: string, modelId?: string): boolean {
  // If provider is explicitly Groq, files are not supported
  if (isGroqProvider(currentProvider)) {
    return false;
  }

  // If model ID is a Groq model, files are not supported
  if (isGroqModel(modelId)) {
    return false;
  }

  // Default to true for other providers (like Gemini)
  return true;
}

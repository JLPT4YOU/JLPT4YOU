/**
 * Markdown Utilities
 * Helper functions for processing markdown content
 */

/**
 * Strip markdown formatting for preview display
 * Removes common markdown syntax while preserving readable text
 */
export function stripMarkdown(text: string): string {
  if (!text) return '';
  
  return text
    // Remove headers
    .replace(/^#{1,6}\s+/gm, '')
    // Remove bold and italic
    .replace(/\*{1,3}([^*]+)\*{1,3}/g, '$1')
    .replace(/_{1,3}([^_]+)_{1,3}/g, '$1')
    // Remove links but keep text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove inline code
    .replace(/`([^`]+)`/g, '$1')
    // Remove code blocks
    .replace(/```[\s\S]*?```/g, '')
    // Remove blockquotes
    .replace(/^>\s+/gm, '')
    // Remove horizontal rules
    .replace(/^[-*_]{3,}$/gm, '')
    // Remove list markers
    .replace(/^[\s]*[-*+]\s+/gm, '')
    .replace(/^[\s]*\d+\.\s+/gm, '')
    // Remove images
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    // Remove HTML tags
    .replace(/<[^>]+>/g, '')
    // Clean up multiple spaces and newlines
    .replace(/\s+/g, ' ')
    .replace(/\n{2,}/g, ' ')
    .trim();
}

/**
 * Get preview text from markdown
 * Strips markdown and truncates to specified length
 */
export function getMarkdownPreview(text: string, maxLength: number = 100): string {
  const stripped = stripMarkdown(text);
  
  if (stripped.length <= maxLength) {
    return stripped;
  }
  
  // Truncate at word boundary
  const truncated = stripped.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  
  if (lastSpace > maxLength * 0.8) {
    return truncated.substring(0, lastSpace) + '...';
  }
  
  return truncated + '...';
}

/**
 * Format chat preview text
 * Specifically for chat history sidebar
 */
export function formatChatPreview(message: string): string {
  if (!message) return '';
  
  // Strip markdown first
  const stripped = stripMarkdown(message);
  
  // Remove "iRIN:" or "User:" prefixes if present
  const cleaned = stripped
    .replace(/^(iRIN|User|Assistant|AI):\s*/i, '')
    .trim();
  
  // Limit to reasonable preview length
  return getMarkdownPreview(cleaned, 80);
}

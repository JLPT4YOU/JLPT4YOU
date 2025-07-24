/**
 * Enhanced Middleware for Dual-Mode Language Routing
 * Handles language detection, redirects, and regional targeting
 * Supports clean URLs for authenticated users and language-prefixed URLs for public access
 *
 * REFACTORED: 2025-01-24 - Modular implementation using middleware system
 * BACKUP CREATED: 2025-01-24 - Original middleware backed up before refactoring
 */

// Import the new modular middleware implementation
export { default, config } from './middleware/main'

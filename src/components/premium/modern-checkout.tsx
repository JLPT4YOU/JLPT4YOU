/**
 * Modern Premium Checkout Component (Legacy Compatibility)
 * Re-exports the modular checkout component for backward compatibility
 * 
 * REFACTORED: 2025-01-23 - Split into modular step components
 * Original: 576 lines → Modular: ~200 lines + separate components
 */

// Re-export everything from the modular checkout
export { ModernCheckoutInner as ModernCheckout } from './checkout';

/**
 * Analytics Types for JLPT4You
 * Proper TypeScript types for analytics and performance monitoring
 */

// Google Analytics gtag function type
export interface GtagFunction {
  (command: 'config', targetId: string, config?: Record<string, unknown>): void
  (command: 'event', eventName: string, eventParameters?: Record<string, unknown>): void
  (command: 'js', date: Date): void
  (command: 'set', config: Record<string, unknown>): void
}

// Extended Window interface with analytics
export interface WindowWithAnalytics extends Window {
  gtag?: GtagFunction
  dataLayer?: unknown[]
}

// Performance Navigation Timing interface
export interface PerformanceNavigationTimingExtended extends PerformanceNavigationTiming {
  customProperty?: string // Add custom properties if needed in future
}

// Connection interface for network information
export interface NetworkConnection {
  effectiveType: '2g' | '3g' | '4g' | 'slow-2g'
  downlink: number
  rtt: number
  saveData: boolean
  addEventListener: (type: string, listener: () => void) => void
  removeEventListener: (type: string, listener: () => void) => void
}

// Extended Navigator interface
export interface NavigatorWithConnection extends Navigator {
  connection?: NetworkConnection
}

// Memory information interface
export interface MemoryInfo {
  usedJSHeapSize: number
  totalJSHeapSize: number
  jsHeapSizeLimit: number
}

// Extended Performance interface
export interface PerformanceWithMemory extends Performance {
  memory?: MemoryInfo
}

// Web Vitals metric interface
export interface WebVitalMetric {
  name: string
  id: string
  value: number
  delta: number
  entries?: PerformanceEntry[]
}

// Analytics event parameters
export interface AnalyticsEventParams {
  event_category?: string
  event_label?: string
  value?: number
  non_interaction?: boolean
  custom_parameter?: string | number | boolean
}

// Performance metrics for analytics
export interface PerformanceAnalyticsData {
  dns_time?: number
  tcp_time?: number
  ttfb_time?: number
  download_time?: number
  dom_interactive_time?: number
  dom_complete_time?: number
  load_complete_time?: number
}

// Connection analytics data
export interface ConnectionAnalyticsData {
  effective_type: string
  downlink: number
  rtt: number
  save_data: boolean
}

// Memory analytics data
export interface MemoryAnalyticsData {
  usage_percentage: number
  used_heap_size: number
  total_heap_size: number
}

// Error analytics data
export interface ErrorAnalyticsData {
  error_message: string
  error_filename?: string
  error_line?: number
  error_column?: number
}

// Type guards for runtime checks
export function isWindowWithAnalytics(window: Window): window is WindowWithAnalytics {
  return 'gtag' in window && typeof (window as WindowWithAnalytics).gtag === 'function'
}

export function isNavigatorWithConnection(navigator: Navigator): navigator is NavigatorWithConnection {
  return 'connection' in navigator
}

export function isPerformanceWithMemory(performance: Performance): performance is PerformanceWithMemory {
  return 'memory' in performance
}

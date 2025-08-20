/**
 * Performance Monitor Component
 * Tracks Core Web Vitals and sends analytics data
 */

'use client'

import { useEffect } from 'react'
import {
  isWindowWithAnalytics,
  isNavigatorWithConnection,
  isPerformanceWithMemory,
  WindowWithAnalytics,
  PerformanceWithMemory
} from '@/types/analytics'

interface PerformanceMonitorProps {
  enableAnalytics?: boolean
  enableConsoleLogging?: boolean
}

export function PerformanceMonitor({
  enableAnalytics = true,
  enableConsoleLogging = false // Disabled console logging
}: PerformanceMonitorProps) {
  useEffect(() => {
    // Initialize performance monitoring (removed hook call)

    // Track page load performance
    if (typeof window !== 'undefined') {
      const trackPageLoad = () => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
        
        if (navigation) {
          const metrics = {
            dns: navigation.domainLookupEnd - navigation.domainLookupStart,
            tcp: navigation.connectEnd - navigation.connectStart,
            ttfb: navigation.responseStart - navigation.requestStart,
            download: navigation.responseEnd - navigation.responseStart,
            domInteractive: navigation.domInteractive - navigation.fetchStart,
            domComplete: navigation.domComplete - navigation.fetchStart,
            loadComplete: navigation.loadEventEnd - navigation.fetchStart
          }

          if (enableConsoleLogging) {

          }

          if (enableAnalytics && isWindowWithAnalytics(window)) {
            // Send to Google Analytics
            (window as WindowWithAnalytics).gtag!('event', 'page_load_performance', {
              dns_time: metrics.dns,
              tcp_time: metrics.tcp,
              ttfb_time: metrics.ttfb,
              download_time: metrics.download,
              dom_interactive_time: metrics.domInteractive,
              dom_complete_time: metrics.domComplete,
              load_complete_time: metrics.loadComplete
            })
          }
        }
      }

      // Track when page is fully loaded
      if (document.readyState === 'complete') {
        trackPageLoad()
      } else {
        window.addEventListener('load', trackPageLoad)
      }

      // Track resource loading errors
      const trackResourceErrors = (event: ErrorEvent) => {
        if (enableConsoleLogging) {
          console.error('Resource loading error:', event)
        }

        if (enableAnalytics && isWindowWithAnalytics(window)) {
          (window as WindowWithAnalytics).gtag!('event', 'resource_error', {
            error_message: event.message,
            error_filename: event.filename,
            error_line: event.lineno,
            error_column: event.colno
          })
        }
      }

      window.addEventListener('error', trackResourceErrors)

      // Cleanup
      return () => {
        window.removeEventListener('load', trackPageLoad)
        window.removeEventListener('error', trackResourceErrors)
      }
    }
  }, [enableAnalytics, enableConsoleLogging])

  return null // This component doesn't render anything
}

// Web Vitals tracking component
export function WebVitalsTracker() {
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Dynamic import to reduce bundle size
    import('web-vitals').then(({ onCLS, onINP, onFCP, onLCP, onTTFB }) => {
      const sendToAnalytics = (metric: { name: string; id: string; value: number; delta: number }) => {
        // Send to Google Analytics
        if (isWindowWithAnalytics(window)) {
          (window as WindowWithAnalytics).gtag!('event', metric.name, {
            event_category: 'Web Vitals',
            event_label: metric.id,
            value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
            non_interaction: true,
          })
        }

        // Send to other analytics services
        if (typeof window !== 'undefined' && isWindowWithAnalytics(window) && (window as WindowWithAnalytics).dataLayer) {
          (window as WindowWithAnalytics).dataLayer!.push({
            event: 'web_vitals',
            metric_name: metric.name,
            metric_value: metric.value,
            metric_id: metric.id,
            metric_delta: metric.delta
          })
        }

        // Log in development - Disabled
        // if (process.env.NODE_ENV === 'development') {
        //   console.log('Web Vital:', metric)
        // }
      }

      onCLS(sendToAnalytics)
      onINP(sendToAnalytics) // INP replaced FID in web-vitals v4+
      onFCP(sendToAnalytics)
      onLCP(sendToAnalytics)
      onTTFB(sendToAnalytics)
    })
  }, [])

  return null
}

// Connection quality monitor
export function ConnectionMonitor() {
  useEffect(() => {
    if (typeof window === 'undefined' || !isNavigatorWithConnection(navigator)) return

    const connection = navigator.connection
    if (!connection) return

    const trackConnection = () => {
      const connectionInfo = {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData
      }

      // Log connection info - Disabled
      // if (process.env.NODE_ENV === 'development') {
      //   console.log('Connection Info:', connectionInfo)
      // }

      // Send to analytics
      if (isWindowWithAnalytics(window)) {
        (window as WindowWithAnalytics).gtag!('event', 'connection_info', {
          effective_type: connectionInfo.effectiveType,
          downlink: connectionInfo.downlink,
          rtt: connectionInfo.rtt,
          save_data: connectionInfo.saveData
        })
      }

      // Adapt UI based on connection
      if (connectionInfo.effectiveType === 'slow-2g' || connectionInfo.effectiveType === '2g') {
        document.documentElement.classList.add('slow-connection')
      } else {
        document.documentElement.classList.remove('slow-connection')
      }
    }

    trackConnection()
    connection.addEventListener('change', trackConnection)

    return () => {
      connection.removeEventListener('change', trackConnection)
    }
  }, [])

  return null
}

// Memory usage monitor
export function MemoryMonitor() {
  useEffect(() => {
    if (typeof window === 'undefined' || !isPerformanceWithMemory(performance)) return

    const trackMemory = () => {
      const memory = (performance as PerformanceWithMemory).memory!
      
      const memoryInfo = {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
        usagePercentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
      }

      // Log memory info in development - Disabled
      // if (process.env.NODE_ENV === 'development') {
      //   console.log('Memory Usage:', memoryInfo)
      // }

      // Send to analytics if usage is high
      if (memoryInfo.usagePercentage > 80 && isWindowWithAnalytics(window)) {
        (window as WindowWithAnalytics).gtag!('event', 'high_memory_usage', {
          usage_percentage: Math.round(memoryInfo.usagePercentage),
          used_heap_size: memoryInfo.usedJSHeapSize,
          total_heap_size: memoryInfo.totalJSHeapSize
        })
      }
    }

    // Track memory usage every 30 seconds
    const interval = setInterval(trackMemory, 30000)
    trackMemory() // Initial check

    return () => clearInterval(interval)
  }, [])

  return null
}

// Comprehensive performance monitoring wrapper
export function ComprehensivePerformanceMonitor() {
  return (
    <>
      <PerformanceMonitor />
      <WebVitalsTracker />
      <ConnectionMonitor />
      <MemoryMonitor />
    </>
  )
}

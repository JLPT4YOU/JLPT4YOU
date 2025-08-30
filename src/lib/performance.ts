/**
 * Performance Monitoring and Core Web Vitals for JLPT4You
 * Optimized for international SEO and user experience
 */

// Type for navigator.userAgentData (experimental API)
interface NavigatorUserAgentData {
  brands?: Array<{ brand: string; version: string }>
  mobile?: boolean
  platform?: string
}

interface NavigatorWithUserAgentData extends Navigator {
  userAgentData?: NavigatorUserAgentData
}



// Core Web Vitals thresholds (Google's recommendations)
export const CORE_WEB_VITALS_THRESHOLDS = {
  LCP: {
    good: 2500,    // Largest Contentful Paint
    poor: 4000
  },
  FID: {
    good: 100,     // First Input Delay
    poor: 300
  },
  CLS: {
    good: 0.1,     // Cumulative Layout Shift
    poor: 0.25
  },
  FCP: {
    good: 1800,    // First Contentful Paint
    poor: 3000
  },
  TTFB: {
    good: 800,     // Time to First Byte
    poor: 1800
  }
} as const

// Performance metrics interface
export interface PerformanceMetrics {
  lcp?: number
  fid?: number
  cls?: number
  fcp?: number
  ttfb?: number
  timestamp: number
  url: string
  userAgent: string
  language: string
  country?: string
}

// Web Vitals measurement
export function measureWebVitals(onPerfEntry?: (metric: PerformanceMetrics) => void) {
  if (typeof window === 'undefined' || !onPerfEntry) return

  // Import web-vitals dynamically to reduce bundle size
  import('web-vitals').then(({ onCLS, onINP, onFCP, onLCP, onTTFB }) => {
    const baseMetric: Partial<PerformanceMetrics> = {
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      language: navigator.language,
      country: (navigator as NavigatorWithUserAgentData).userAgentData?.brands?.[0]?.brand || undefined
    }

    onCLS((metric: { value: number }) => {
      onPerfEntry({
        ...baseMetric,
        cls: metric.value
      } as PerformanceMetrics)
    })

    onINP((metric: { value: number }) => {
      onPerfEntry({
        ...baseMetric,
        fid: metric.value // INP replaces FID
      } as PerformanceMetrics)
    })

    onFCP((metric: { value: number }) => {
      onPerfEntry({
        ...baseMetric,
        fcp: metric.value
      } as PerformanceMetrics)
    })

    onLCP((metric: { value: number }) => {
      onPerfEntry({
        ...baseMetric,
        lcp: metric.value
      } as PerformanceMetrics)
    })

    onTTFB((metric: { value: number }) => {
      onPerfEntry({
        ...baseMetric,
        ttfb: metric.value
      } as PerformanceMetrics)
    })
  })
}

// Performance score calculation
export function calculatePerformanceScore(metrics: PerformanceMetrics): {
  score: number
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  details: Record<string, { value: number; score: number; status: 'good' | 'needs-improvement' | 'poor' }>
} {
  const details: Record<string, { value: number; score: number; status: 'good' | 'needs-improvement' | 'poor' }> = {}
  let totalScore = 0
  let metricCount = 0

  // LCP scoring
  if (metrics.lcp !== undefined) {
    const lcpScore = metrics.lcp <= CORE_WEB_VITALS_THRESHOLDS.LCP.good ? 100 :
                     metrics.lcp <= CORE_WEB_VITALS_THRESHOLDS.LCP.poor ? 50 : 0
    const lcpStatus = metrics.lcp <= CORE_WEB_VITALS_THRESHOLDS.LCP.good ? 'good' :
                      metrics.lcp <= CORE_WEB_VITALS_THRESHOLDS.LCP.poor ? 'needs-improvement' : 'poor'
    
    details.lcp = { value: metrics.lcp, score: lcpScore, status: lcpStatus }
    totalScore += lcpScore
    metricCount++
  }

  // FID scoring
  if (metrics.fid !== undefined) {
    const fidScore = metrics.fid <= CORE_WEB_VITALS_THRESHOLDS.FID.good ? 100 :
                     metrics.fid <= CORE_WEB_VITALS_THRESHOLDS.FID.poor ? 50 : 0
    const fidStatus = metrics.fid <= CORE_WEB_VITALS_THRESHOLDS.FID.good ? 'good' :
                      metrics.fid <= CORE_WEB_VITALS_THRESHOLDS.FID.poor ? 'needs-improvement' : 'poor'
    
    details.fid = { value: metrics.fid, score: fidScore, status: fidStatus }
    totalScore += fidScore
    metricCount++
  }

  // CLS scoring
  if (metrics.cls !== undefined) {
    const clsScore = metrics.cls <= CORE_WEB_VITALS_THRESHOLDS.CLS.good ? 100 :
                     metrics.cls <= CORE_WEB_VITALS_THRESHOLDS.CLS.poor ? 50 : 0
    const clsStatus = metrics.cls <= CORE_WEB_VITALS_THRESHOLDS.CLS.good ? 'good' :
                      metrics.cls <= CORE_WEB_VITALS_THRESHOLDS.CLS.poor ? 'needs-improvement' : 'poor'
    
    details.cls = { value: metrics.cls, score: clsScore, status: clsStatus }
    totalScore += clsScore
    metricCount++
  }

  // FCP scoring
  if (metrics.fcp !== undefined) {
    const fcpScore = metrics.fcp <= CORE_WEB_VITALS_THRESHOLDS.FCP.good ? 100 :
                     metrics.fcp <= CORE_WEB_VITALS_THRESHOLDS.FCP.poor ? 50 : 0
    const fcpStatus = metrics.fcp <= CORE_WEB_VITALS_THRESHOLDS.FCP.good ? 'good' :
                      metrics.fcp <= CORE_WEB_VITALS_THRESHOLDS.FCP.poor ? 'needs-improvement' : 'poor'
    
    details.fcp = { value: metrics.fcp, score: fcpScore, status: fcpStatus }
    totalScore += fcpScore * 0.5 // Lower weight for FCP
    metricCount += 0.5
  }

  // TTFB scoring
  if (metrics.ttfb !== undefined) {
    const ttfbScore = metrics.ttfb <= CORE_WEB_VITALS_THRESHOLDS.TTFB.good ? 100 :
                      metrics.ttfb <= CORE_WEB_VITALS_THRESHOLDS.TTFB.poor ? 50 : 0
    const ttfbStatus = metrics.ttfb <= CORE_WEB_VITALS_THRESHOLDS.TTFB.good ? 'good' :
                       metrics.ttfb <= CORE_WEB_VITALS_THRESHOLDS.TTFB.poor ? 'needs-improvement' : 'poor'
    
    details.ttfb = { value: metrics.ttfb, score: ttfbScore, status: ttfbStatus }
    totalScore += ttfbScore * 0.3 // Lower weight for TTFB
    metricCount += 0.3
  }

  const score = metricCount > 0 ? Math.round(totalScore / metricCount) : 0
  const grade = score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F'

  return { score, grade, details }
}

// Resource loading optimization
export function optimizeResourceLoading() {
  if (typeof window === 'undefined') return

  // Preload critical resources
  const preloadResources = [
    { href: '/favicon.svg', as: 'image', type: 'image/svg+xml' },
    { href: 'https://fonts.googleapis.com', rel: 'preconnect' },
    { href: 'https://fonts.gstatic.com', rel: 'preconnect', crossorigin: 'anonymous' }
  ]

  preloadResources.forEach(resource => {
    const link = document.createElement('link')
    link.rel = resource.rel || 'preload'
    link.href = resource.href
    if (resource.as) link.as = resource.as
    if (resource.type) link.type = resource.type
    if (resource.crossorigin) link.crossOrigin = resource.crossorigin
    document.head.appendChild(link)
  })

  // Prefetch next likely pages
  const prefetchPages = [
    '/auth/vn/login',
    '/auth/vn/register',
    '/jlpt/custom/n5',
    '/jlpt/custom/n4'
  ]

  prefetchPages.forEach(page => {
    const link = document.createElement('link')
    link.rel = 'prefetch'
    link.href = page
    document.head.appendChild(link)
  })
}

// Image optimization utilities
export function generateOptimizedImageProps(
  src: string,
  alt: string,
  width?: number,
  height?: number
) {
  return {
    src,
    alt,
    width,
    height,
    loading: 'lazy' as const,
    decoding: 'async' as const,
    style: {
      maxWidth: '100%',
      height: 'auto'
    }
  }
}

// Critical CSS inlining
export function inlineCriticalCSS(css: string) {
  if (typeof document === 'undefined') return

  const style = document.createElement('style')
  style.textContent = css
  style.setAttribute('data-critical', 'true')
  document.head.appendChild(style)
}

// Performance monitoring hook
export function usePerformanceMonitoring() {
  if (typeof window === 'undefined') return

  // Monitor performance on page load
  window.addEventListener('load', () => {
    measureWebVitals((metrics) => {
      const score = calculatePerformanceScore(metrics)
      
      // Log performance data in development, send to analytics in production
      if (process.env.NODE_ENV === 'development') {
        console.log('Performance Metrics:', {
          metrics,
          score: score.score,
          grade: score.grade,
          details: score.details
        })
      }

      // Send to analytics service (example)
      if (process.env.NODE_ENV === 'production') {
        // gtag('event', 'web_vitals', {
        //   metric_name: 'overall_score',
        //   metric_value: score.score,
        //   metric_grade: score.grade
        // })
      }
    })

    // Optimize resource loading
    optimizeResourceLoading()
  })
}

// Service Worker registration for caching
export function registerServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration)
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError)
      })
  })
}

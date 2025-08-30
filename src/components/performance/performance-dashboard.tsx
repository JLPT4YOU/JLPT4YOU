'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { 
  Activity, 
  Clock, 
  Zap, 
  Eye, 
  Download, 
  Wifi, 
  MemoryStick,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react'

interface PerformanceMetrics {
  // Core Web Vitals
  lcp: number | null // Largest Contentful Paint
  fid: number | null // First Input Delay
  cls: number | null // Cumulative Layout Shift
  fcp: number | null // First Contentful Paint
  ttfb: number | null // Time to First Byte
  
  // Navigation Timing
  domContentLoaded: number
  loadComplete: number
  
  // Memory
  memoryUsage: {
    used: number
    total: number
    limit: number
    percentage: number
  } | null
  
  // Connection
  connection: {
    effectiveType: string
    downlink: number
    rtt: number
  } | null
  
  // User Interactions
  interactions: Array<{
    type: string
    duration: number
    timestamp: number
    element: string
  }>
}

interface PerformanceScore {
  overall: number
  performance: number
  accessibility: number
  bestPractices: number
  seo: number
}

export function PerformanceDashboard() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    lcp: null,
    fid: null,
    cls: null,
    fcp: null,
    ttfb: null,
    domContentLoaded: 0,
    loadComplete: 0,
    memoryUsage: null,
    connection: null,
    interactions: []
  })
  
  const [score, setScore] = useState<PerformanceScore>({
    overall: 0,
    performance: 0,
    accessibility: 0,
    bestPractices: 0,
    seo: 0
  })
  
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const interactionObserver = useRef<PerformanceObserver | null>(null)

  // Initialize performance monitoring
  useEffect(() => {
    if (typeof window === 'undefined') return

    const initializeMonitoring = async () => {
      // Web Vitals monitoring
      const { onCLS, onFCP, onLCP, onTTFB } = await import('web-vitals')
      
      onLCP((metric) => {
        setMetrics(prev => ({ ...prev, lcp: metric.value }))
      })
      
      onFCP((metric) => {
        setMetrics(prev => ({ ...prev, fcp: metric.value }))
      })
      
      onCLS((metric) => {
        setMetrics(prev => ({ ...prev, cls: metric.value }))
      })
      
      onTTFB((metric) => {
        setMetrics(prev => ({ ...prev, ttfb: metric.value }))
      })

      // Navigation timing
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      if (navigation) {
        setMetrics(prev => ({
          ...prev,
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          loadComplete: navigation.loadEventEnd - navigation.loadEventStart
        }))
      }

      // Memory monitoring
      if ('memory' in performance) {
        const memory = (performance as any).memory
        setMetrics(prev => ({
          ...prev,
          memoryUsage: {
            used: memory.usedJSHeapSize,
            total: memory.totalJSHeapSize,
            limit: memory.jsHeapSizeLimit,
            percentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
          }
        }))
      }

      // Connection monitoring
      if ('connection' in navigator) {
        const connection = (navigator as any).connection
        setMetrics(prev => ({
          ...prev,
          connection: {
            effectiveType: connection.effectiveType,
            downlink: connection.downlink,
            rtt: connection.rtt
          }
        }))
      }

      setIsMonitoring(true)
    }

    initializeMonitoring()
  }, [])

  // User interaction tracking
  useEffect(() => {
    if (!isMonitoring) return

    const trackInteraction = (event: Event) => {
      const startTime = performance.now()
      
      requestAnimationFrame(() => {
        const duration = performance.now() - startTime
        const element = (event.target as HTMLElement)?.tagName || 'unknown'
        
        setMetrics(prev => ({
          ...prev,
          interactions: [
            ...prev.interactions.slice(-9), // Keep last 10 interactions
            {
              type: event.type,
              duration,
              timestamp: Date.now(),
              element
            }
          ]
        }))
      })
    }

    // Track various user interactions
    const events = ['click', 'keydown', 'scroll', 'touchstart']
    events.forEach(event => {
      document.addEventListener(event, trackInteraction, { passive: true })
    })

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, trackInteraction)
      })
    }
  }, [isMonitoring])

  // Calculate performance score
  useEffect(() => {
    const calculateScore = () => {
      let performanceScore = 100

      // LCP scoring (Good: <2.5s, Needs Improvement: 2.5-4s, Poor: >4s)
      if (metrics.lcp) {
        if (metrics.lcp > 4000) performanceScore -= 30
        else if (metrics.lcp > 2500) performanceScore -= 15
      }

      // FID scoring (Good: <100ms, Needs Improvement: 100-300ms, Poor: >300ms)
      if (metrics.fid) {
        if (metrics.fid > 300) performanceScore -= 25
        else if (metrics.fid > 100) performanceScore -= 10
      }

      // CLS scoring (Good: <0.1, Needs Improvement: 0.1-0.25, Poor: >0.25)
      if (metrics.cls) {
        if (metrics.cls > 0.25) performanceScore -= 25
        else if (metrics.cls > 0.1) performanceScore -= 10
      }

      // Memory usage scoring
      if (metrics.memoryUsage && metrics.memoryUsage.percentage > 80) {
        performanceScore -= 20
      }

      setScore(prev => ({
        ...prev,
        performance: Math.max(0, performanceScore),
        overall: Math.max(0, performanceScore)
      }))
    }

    calculateScore()
    setLastUpdate(new Date())
  }, [metrics])

  const refreshMetrics = () => {
    window.location.reload()
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 50) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreIcon = (score: number) => {
    if (score >= 90) return <CheckCircle className="h-4 w-4 text-green-600" />
    if (score >= 50) return <AlertTriangle className="h-4 w-4 text-yellow-600" />
    return <XCircle className="h-4 w-4 text-red-600" />
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Performance Dashboard</h1>
          <p className="text-muted-foreground">
            Đánh giá tốc độ trang web và trải nghiệm người dùng
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={isMonitoring ? "default" : "secondary"}>
            {isMonitoring ? "Đang theo dõi" : "Tạm dừng"}
          </Badge>
          <Button onClick={refreshMetrics} size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Làm mới
          </Button>
        </div>
      </div>

      {/* Overall Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Điểm tổng thể
          </CardTitle>
          <CardDescription>
            Cập nhật lần cuối: {lastUpdate.toLocaleTimeString('vi-VN')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="text-4xl font-bold flex items-center gap-2">
              {getScoreIcon(score.overall)}
              <span className={getScoreColor(score.overall)}>
                {score.overall}
              </span>
            </div>
            <div className="flex-1">
              <Progress value={score.overall} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="vitals" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="vitals">Core Web Vitals</TabsTrigger>
          <TabsTrigger value="timing">Navigation Timing</TabsTrigger>
          <TabsTrigger value="resources">Tài nguyên</TabsTrigger>
          <TabsTrigger value="interactions">Tương tác</TabsTrigger>
        </TabsList>

        <TabsContent value="vitals" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* LCP */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  LCP (Largest Contentful Paint)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics.lcp ? `${(metrics.lcp / 1000).toFixed(2)}s` : 'Đang đo...'}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Tốt: &lt;2.5s | Cần cải thiện: 2.5-4s | Kém: &gt;4s
                </p>
              </CardContent>
            </Card>

            {/* FCP */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  FCP (First Contentful Paint)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics.fcp ? `${(metrics.fcp / 1000).toFixed(2)}s` : 'Đang đo...'}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Tốt: &lt;1.8s | Cần cải thiện: 1.8-3s | Kém: &gt;3s
                </p>
              </CardContent>
            </Card>

            {/* CLS */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  CLS (Cumulative Layout Shift)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics.cls ? metrics.cls.toFixed(3) : 'Đang đo...'}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Tốt: &lt;0.1 | Cần cải thiện: 0.1-0.25 | Kém: &gt;0.25
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="timing" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  TTFB (Time to First Byte)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics.ttfb ? `${metrics.ttfb.toFixed(0)}ms` : 'Đang đo...'}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Thời gian server phản hồi
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  DOM Content Loaded
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics.domContentLoaded.toFixed(0)}ms
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Thời gian tải DOM
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="resources" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Memory Usage */}
            {metrics.memoryUsage && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <MemoryStick className="h-4 w-4" />
                    Sử dụng bộ nhớ
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Đã sử dụng</span>
                      <span>{(metrics.memoryUsage.used / 1024 / 1024).toFixed(1)} MB</span>
                    </div>
                    <Progress value={metrics.memoryUsage.percentage} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      {metrics.memoryUsage.percentage.toFixed(1)}% của giới hạn
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Connection */}
            {metrics.connection && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Wifi className="h-4 w-4" />
                    Kết nối mạng
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Loại kết nối</span>
                      <span className="font-medium">{metrics.connection.effectiveType}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Tốc độ tải</span>
                      <span>{metrics.connection.downlink} Mbps</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>RTT</span>
                      <span>{metrics.connection.rtt}ms</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="interactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Tương tác gần đây</CardTitle>
              <CardDescription>
                10 tương tác cuối cùng và thời gian phản hồi
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {metrics.interactions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Chưa có tương tác nào được ghi nhận
                  </p>
                ) : (
                  metrics.interactions.slice(-5).reverse().map((interaction, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-muted rounded">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {interaction.type}
                        </Badge>
                        <span className="text-sm">{interaction.element}</span>
                      </div>
                      <div className="text-sm font-medium">
                        {interaction.duration.toFixed(1)}ms
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

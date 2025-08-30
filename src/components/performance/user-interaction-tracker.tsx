'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  MousePointer,
  Keyboard,
  Scroll,
  Smartphone,
  Clock,
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  CheckCircle
} from 'lucide-react'

interface InteractionEvent {
  id: string
  type: 'click' | 'keydown' | 'scroll' | 'touch' | 'hover' | 'focus'
  element: string
  timestamp: number
  duration: number
  x?: number
  y?: number
  key?: string
  scrollY?: number
  target: string
}

interface PerformanceMetrics {
  averageResponseTime: number
  totalInteractions: number
  slowInteractions: number
  fastInteractions: number
  interactionsByType: Record<string, number>
  hourlyStats: Array<{
    hour: number
    interactions: number
    avgResponseTime: number
  }>
}

export function UserInteractionTracker() {
  const [isTracking, setIsTracking] = useState(false)
  const [interactions, setInteractions] = useState<InteractionEvent[]>([])
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    averageResponseTime: 0,
    totalInteractions: 0,
    slowInteractions: 0,
    fastInteractions: 0,
    interactionsByType: {},
    hourlyStats: []
  })
  const [showDetails, setShowDetails] = useState(false)
  
  const interactionStartTimes = useRef<Map<string, number>>(new Map())
  const observerRef = useRef<PerformanceObserver | null>(null)

  // Track user interactions
  const trackInteraction = useCallback((event: Event) => {
    if (!isTracking) return

    const startTime = performance.now()
    const eventId = `${event.type}-${Date.now()}-${Math.random()}`
    
    interactionStartTimes.current.set(eventId, startTime)

    // Use requestAnimationFrame to measure response time
    requestAnimationFrame(() => {
      const endTime = performance.now()
      const duration = endTime - startTime
      
      const target = event.target as HTMLElement
      const element = target?.tagName?.toLowerCase() || 'unknown'
      const targetInfo = target?.className ? `${element}.${target.className.split(' ')[0]}` : element

      const interaction: InteractionEvent = {
        id: eventId,
        type: event.type as any,
        element,
        timestamp: Date.now(),
        duration,
        target: targetInfo,
        ...(event.type === 'click' && {
          x: (event as MouseEvent).clientX,
          y: (event as MouseEvent).clientY
        }),
        ...(event.type === 'keydown' && {
          key: (event as KeyboardEvent).key
        }),
        ...(event.type === 'scroll' && {
          scrollY: window.scrollY
        })
      }

      setInteractions(prev => [interaction, ...prev.slice(0, 99)]) // Keep last 100 interactions
      interactionStartTimes.current.delete(eventId)
    })
  }, [isTracking])

  // Calculate metrics
  useEffect(() => {
    if (interactions.length === 0) return

    const now = new Date()
    const currentHour = now.getHours()
    
    // Calculate basic metrics
    const totalInteractions = interactions.length
    const averageResponseTime = interactions.reduce((sum, i) => sum + i.duration, 0) / totalInteractions
    const slowInteractions = interactions.filter(i => i.duration > 100).length
    const fastInteractions = interactions.filter(i => i.duration <= 50).length
    
    // Group by type
    const interactionsByType = interactions.reduce((acc, interaction) => {
      acc[interaction.type] = (acc[interaction.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Hourly stats (last 24 hours)
    const hourlyStats = Array.from({ length: 24 }, (_, i) => {
      const hour = (currentHour - i + 24) % 24
      const hourInteractions = interactions.filter(interaction => {
        const interactionHour = new Date(interaction.timestamp).getHours()
        return interactionHour === hour
      })
      
      return {
        hour,
        interactions: hourInteractions.length,
        avgResponseTime: hourInteractions.length > 0 
          ? hourInteractions.reduce((sum, i) => sum + i.duration, 0) / hourInteractions.length 
          : 0
      }
    }).reverse()

    setMetrics({
      averageResponseTime,
      totalInteractions,
      slowInteractions,
      fastInteractions,
      interactionsByType,
      hourlyStats
    })
  }, [interactions])

  // Setup event listeners
  useEffect(() => {
    if (!isTracking) return

    const events = ['click', 'keydown', 'scroll', 'touchstart', 'mouseenter', 'focus']
    
    events.forEach(eventType => {
      document.addEventListener(eventType, trackInteraction, { 
        passive: true,
        capture: true 
      })
    })

    // Setup Performance Observer for more detailed metrics
    if ('PerformanceObserver' in window) {
      observerRef.current = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'event') {
            // Handle event timing entries
            console.log('Event timing:', entry)
          }
        }
      })

      try {
        observerRef.current.observe({ entryTypes: ['event', 'first-input'] })
      } catch (e) {
        console.log('Performance Observer not fully supported')
      }
    }

    return () => {
      events.forEach(eventType => {
        document.removeEventListener(eventType, trackInteraction)
      })
      
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [isTracking, trackInteraction])

  const clearData = () => {
    setInteractions([])
    setMetrics({
      averageResponseTime: 0,
      totalInteractions: 0,
      slowInteractions: 0,
      fastInteractions: 0,
      interactionsByType: {},
      hourlyStats: []
    })
  }

  const exportData = () => {
    const data = {
      metrics,
      interactions: interactions.slice(0, 50), // Export last 50 interactions
      exportTime: new Date().toISOString()
    }
    
    const dataStr = JSON.stringify(data, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `user-interactions-${new Date().toISOString().split('T')[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const getResponseTimeColor = (duration: number) => {
    if (duration <= 50) return 'text-green-600'
    if (duration <= 100) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getResponseTimeIcon = (duration: number) => {
    if (duration <= 50) return <CheckCircle className="h-4 w-4 text-green-600" />
    if (duration <= 100) return <AlertCircle className="h-4 w-4 text-yellow-600" />
    return <AlertCircle className="h-4 w-4 text-red-600" />
  }

  const getInteractionIcon = (type: string) => {
    switch (type) {
      case 'click': return <MousePointer className="h-4 w-4" />
      case 'keydown': return <Keyboard className="h-4 w-4" />
      case 'scroll': return <Scroll className="h-4 w-4" />
      case 'touchstart': return <Smartphone className="h-4 w-4" />
      default: return <Activity className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">User Interaction Tracking</h2>
          <p className="text-muted-foreground">
            Theo dõi và đo lường tốc độ phản hồi khi user tương tác
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="tracking"
              checked={isTracking}
              onCheckedChange={setIsTracking}
            />
            <Label htmlFor="tracking">
              {isTracking ? 'Đang theo dõi' : 'Tạm dừng'}
            </Label>
          </div>
          {interactions.length > 0 && (
            <div className="flex gap-2">
              <Button onClick={exportData} variant="outline" size="sm">
                Xuất dữ liệu
              </Button>
              <Button onClick={clearData} variant="outline" size="sm">
                Xóa dữ liệu
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Tổng tương tác
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalInteractions}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Từ khi bắt đầu theo dõi
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Thời gian phản hồi TB
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.averageResponseTime.toFixed(1)}ms
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Tốt: &lt;50ms | Chấp nhận: &lt;100ms | Chậm: &gt;100ms
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              Tương tác nhanh
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {metrics.fastInteractions}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              ≤50ms phản hồi
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-600" />
              Tương tác chậm
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {metrics.slowInteractions}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              &gt;100ms phản hồi
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Interaction Types */}
      <Card>
        <CardHeader>
          <CardTitle>Loại tương tác</CardTitle>
          <CardDescription>
            Phân bố các loại tương tác của người dùng
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(metrics.interactionsByType).map(([type, count]) => (
              <div key={type} className="text-center p-3 bg-muted rounded-lg">
                <div className="flex justify-center mb-2">
                  {getInteractionIcon(type)}
                </div>
                <div className="font-medium">{count}</div>
                <div className="text-xs text-muted-foreground capitalize">{type}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Interactions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Tương tác gần đây</CardTitle>
              <CardDescription>
                20 tương tác mới nhất với thời gian phản hồi
              </CardDescription>
            </div>
            <Button
              onClick={() => setShowDetails(!showDetails)}
              variant="outline"
              size="sm"
            >
              {showDetails ? 'Ẩn chi tiết' : 'Hiện chi tiết'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {interactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {isTracking 
                ? 'Đang chờ tương tác từ người dùng...' 
                : 'Bật theo dõi để xem tương tác người dùng'
              }
            </div>
          ) : (
            <div className="space-y-2">
              {interactions.slice(0, 20).map((interaction) => (
                <div
                  key={interaction.id}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getInteractionIcon(interaction.type)}
                    <div>
                      <div className="font-medium text-sm">
                        {interaction.type} on {interaction.target}
                      </div>
                      {showDetails && (
                        <div className="text-xs text-muted-foreground">
                          {new Date(interaction.timestamp).toLocaleTimeString('vi-VN')}
                          {interaction.x && interaction.y && ` • (${interaction.x}, ${interaction.y})`}
                          {interaction.key && ` • Key: ${interaction.key}`}
                          {interaction.scrollY && ` • Scroll: ${interaction.scrollY}px`}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getResponseTimeIcon(interaction.duration)}
                    <span className={`font-medium ${getResponseTimeColor(interaction.duration)}`}>
                      {interaction.duration.toFixed(1)}ms
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Tips */}
      {metrics.slowInteractions > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              Gợi ý cải thiện hiệu suất
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p>• Có {metrics.slowInteractions} tương tác chậm (&gt;100ms)</p>
              <p>• Xem xét tối ưu hóa các thành phần UI có thời gian phản hồi cao</p>
              <p>• Sử dụng React.memo() cho các component không cần re-render</p>
              <p>• Debounce các sự kiện scroll và input</p>
              <p>• Lazy load các component nặng</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

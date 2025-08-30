'use client'

import React, { useState, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Play, 
  Square, 
  Download, 
  Clock, 
  Zap, 
  Eye,
  Activity,
  AlertTriangle,
  CheckCircle,
  BarChart3
} from 'lucide-react'

interface TestResult {
  url: string
  timestamp: number
  metrics: {
    loadTime: number
    domContentLoaded: number
    firstPaint: number
    firstContentfulPaint: number
    largestContentfulPaint: number
    timeToInteractive: number
    totalBlockingTime: number
    cumulativeLayoutShift: number
  }
  resources: {
    totalSize: number
    totalRequests: number
    jsSize: number
    cssSize: number
    imageSize: number
    fontSize: number
  }
  score: {
    performance: number
    accessibility: number
    bestPractices: number
    seo: number
  }
}

interface LoadTestConfig {
  url: string
  concurrent: number
  duration: number
  rampUp: number
}

export function PerformanceTester() {
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [currentTest, setCurrentTest] = useState<string>('')
  const [progress, setProgress] = useState(0)
  const [loadTestConfig, setLoadTestConfig] = useState<LoadTestConfig>({
    url: '',
    concurrent: 10,
    duration: 60,
    rampUp: 10
  })
  
  const abortController = useRef<AbortController | null>(null)

  // Single page performance test
  const runSinglePageTest = async (url: string) => {
    setIsRunning(true)
    setCurrentTest(`Testing: ${url}`)
    setProgress(0)

    try {
      // Simulate performance testing steps
      const steps = [
        'Khởi tạo test...',
        'Đang tải trang...',
        'Đo lường Core Web Vitals...',
        'Phân tích tài nguyên...',
        'Tính toán điểm số...',
        'Hoàn thành!'
      ]

      for (let i = 0; i < steps.length; i++) {
        setCurrentTest(steps[i])
        setProgress((i + 1) / steps.length * 100)
        await new Promise(resolve => setTimeout(resolve, 1000))
      }

      // Mock test results
      const result: TestResult = {
        url,
        timestamp: Date.now(),
        metrics: {
          loadTime: Math.random() * 3000 + 1000,
          domContentLoaded: Math.random() * 2000 + 500,
          firstPaint: Math.random() * 1500 + 300,
          firstContentfulPaint: Math.random() * 2000 + 500,
          largestContentfulPaint: Math.random() * 3000 + 1000,
          timeToInteractive: Math.random() * 4000 + 2000,
          totalBlockingTime: Math.random() * 500 + 100,
          cumulativeLayoutShift: Math.random() * 0.3
        },
        resources: {
          totalSize: Math.random() * 2000 + 500, // KB
          totalRequests: Math.floor(Math.random() * 50 + 20),
          jsSize: Math.random() * 800 + 200,
          cssSize: Math.random() * 200 + 50,
          imageSize: Math.random() * 1000 + 200,
          fontSize: Math.random() * 100 + 20
        },
        score: {
          performance: Math.floor(Math.random() * 40 + 60),
          accessibility: Math.floor(Math.random() * 30 + 70),
          bestPractices: Math.floor(Math.random() * 20 + 80),
          seo: Math.floor(Math.random() * 25 + 75)
        }
      }

      setTestResults(prev => [result, ...prev.slice(0, 9)]) // Keep last 10 results
    } catch (error) {
      console.error('Test failed:', error)
    } finally {
      setIsRunning(false)
      setCurrentTest('')
      setProgress(0)
    }
  }

  // Load testing simulation
  const runLoadTest = async () => {
    setIsRunning(true)
    setCurrentTest('Đang chạy load test...')
    
    try {
      const { concurrent, duration } = loadTestConfig
      const totalSteps = duration
      
      for (let i = 0; i < totalSteps; i++) {
        setProgress((i + 1) / totalSteps * 100)
        setCurrentTest(`Load test: ${i + 1}/${totalSteps}s - ${concurrent} concurrent users`)
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        if (abortController.current?.signal.aborted) {
          break
        }
      }
      
      setCurrentTest('Load test hoàn thành!')
    } catch (error) {
      console.error('Load test failed:', error)
    } finally {
      setIsRunning(false)
      setProgress(0)
      setTimeout(() => setCurrentTest(''), 2000)
    }
  }

  const stopTest = () => {
    if (abortController.current) {
      abortController.current.abort()
    }
    setIsRunning(false)
    setCurrentTest('')
    setProgress(0)
  }

  const exportResults = () => {
    const dataStr = JSON.stringify(testResults, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `performance-test-results-${new Date().toISOString().split('T')[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 50) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBadgeVariant = (score: number): "default" | "secondary" | "destructive" => {
    if (score >= 90) return 'default'
    if (score >= 50) return 'secondary'
    return 'destructive'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Performance Testing Tools</h2>
          <p className="text-muted-foreground">
            Công cụ test tốc độ trang web tự động và manual
          </p>
        </div>
        {testResults.length > 0 && (
          <Button onClick={exportResults} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Xuất kết quả
          </Button>
        )}
      </div>

      <Tabs defaultValue="single" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="single">Single Page Test</TabsTrigger>
          <TabsTrigger value="load">Load Testing</TabsTrigger>
          <TabsTrigger value="results">Kết quả</TabsTrigger>
        </TabsList>

        <TabsContent value="single" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Test hiệu suất trang đơn</CardTitle>
              <CardDescription>
                Đo lường Core Web Vitals và các metrics quan trọng
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Nhập URL để test (ví dụ: https://example.com)"
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !isRunning) {
                      const url = (e.target as HTMLInputElement).value
                      if (url) runSinglePageTest(url)
                    }
                  }}
                />
                <Button
                  onClick={() => {
                    const input = document.querySelector('input[placeholder*="URL"]') as HTMLInputElement
                    if (input?.value) runSinglePageTest(input.value)
                  }}
                  disabled={isRunning}
                >
                  {isRunning ? (
                    <>
                      <Square className="h-4 w-4 mr-2" />
                      Đang test...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Chạy test
                    </>
                  )}
                </Button>
              </div>

              {isRunning && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{currentTest}</span>
                    <Button onClick={stopTest} size="sm" variant="outline">
                      <Square className="h-4 w-4 mr-2" />
                      Dừng
                    </Button>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="p-3 bg-muted rounded-lg">
                  <Clock className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                  <div className="text-sm font-medium">Load Time</div>
                  <div className="text-xs text-muted-foreground">Thời gian tải trang</div>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <Zap className="h-6 w-6 mx-auto mb-2 text-yellow-600" />
                  <div className="text-sm font-medium">FCP</div>
                  <div className="text-xs text-muted-foreground">First Contentful Paint</div>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <Eye className="h-6 w-6 mx-auto mb-2 text-green-600" />
                  <div className="text-sm font-medium">LCP</div>
                  <div className="text-xs text-muted-foreground">Largest Contentful Paint</div>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <Activity className="h-6 w-6 mx-auto mb-2 text-purple-600" />
                  <div className="text-sm font-medium">CLS</div>
                  <div className="text-xs text-muted-foreground">Cumulative Layout Shift</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="load" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Load Testing</CardTitle>
              <CardDescription>
                Mô phỏng nhiều người dùng truy cập đồng thời
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="url">URL</Label>
                  <Input
                    id="url"
                    value={loadTestConfig.url}
                    onChange={(e) => setLoadTestConfig(prev => ({ ...prev, url: e.target.value }))}
                    placeholder="https://example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="concurrent">Concurrent Users</Label>
                  <Input
                    id="concurrent"
                    type="number"
                    value={loadTestConfig.concurrent}
                    onChange={(e) => setLoadTestConfig(prev => ({ ...prev, concurrent: parseInt(e.target.value) || 10 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (seconds)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={loadTestConfig.duration}
                    onChange={(e) => setLoadTestConfig(prev => ({ ...prev, duration: parseInt(e.target.value) || 60 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rampup">Ramp-up (seconds)</Label>
                  <Input
                    id="rampup"
                    type="number"
                    value={loadTestConfig.rampUp}
                    onChange={(e) => setLoadTestConfig(prev => ({ ...prev, rampUp: parseInt(e.target.value) || 10 }))}
                  />
                </div>
              </div>

              <Button
                onClick={runLoadTest}
                disabled={isRunning || !loadTestConfig.url}
                className="w-full"
              >
                {isRunning ? (
                  <>
                    <Square className="h-4 w-4 mr-2" />
                    Đang chạy load test...
                  </>
                ) : (
                  <>
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Bắt đầu Load Test
                  </>
                )}
              </Button>

              {isRunning && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{currentTest}</span>
                    <Button onClick={stopTest} size="sm" variant="outline">
                      <Square className="h-4 w-4 mr-2" />
                      Dừng
                    </Button>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          {testResults.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">
                  Chưa có kết quả test nào. Hãy chạy test để xem kết quả.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {testResults.map((result, index) => (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{result.url}</CardTitle>
                      <Badge variant="outline">
                        {new Date(result.timestamp).toLocaleString('vi-VN')}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Performance Scores */}
                      <div className="space-y-2">
                        <h4 className="font-medium">Điểm số</h4>
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span className="text-sm">Performance</span>
                            <Badge variant={getScoreBadgeVariant(result.score.performance)}>
                              {result.score.performance}
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Accessibility</span>
                            <Badge variant={getScoreBadgeVariant(result.score.accessibility)}>
                              {result.score.accessibility}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Core Metrics */}
                      <div className="space-y-2">
                        <h4 className="font-medium">Core Metrics</h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span>Load Time</span>
                            <span>{(result.metrics.loadTime / 1000).toFixed(2)}s</span>
                          </div>
                          <div className="flex justify-between">
                            <span>FCP</span>
                            <span>{(result.metrics.firstContentfulPaint / 1000).toFixed(2)}s</span>
                          </div>
                          <div className="flex justify-between">
                            <span>LCP</span>
                            <span>{(result.metrics.largestContentfulPaint / 1000).toFixed(2)}s</span>
                          </div>
                        </div>
                      </div>

                      {/* Resources */}
                      <div className="space-y-2">
                        <h4 className="font-medium">Tài nguyên</h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span>Total Size</span>
                            <span>{(result.resources.totalSize / 1024).toFixed(1)} MB</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Requests</span>
                            <span>{result.resources.totalRequests}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>JS Size</span>
                            <span>{(result.resources.jsSize / 1024).toFixed(1)} MB</span>
                          </div>
                        </div>
                      </div>

                      {/* Status */}
                      <div className="space-y-2">
                        <h4 className="font-medium">Trạng thái</h4>
                        <div className="space-y-1">
                          {result.score.performance >= 90 ? (
                            <div className="flex items-center gap-2 text-green-600">
                              <CheckCircle className="h-4 w-4" />
                              <span className="text-sm">Tốt</span>
                            </div>
                          ) : result.score.performance >= 50 ? (
                            <div className="flex items-center gap-2 text-yellow-600">
                              <AlertTriangle className="h-4 w-4" />
                              <span className="text-sm">Cần cải thiện</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-red-600">
                              <AlertTriangle className="h-4 w-4" />
                              <span className="text-sm">Kém</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

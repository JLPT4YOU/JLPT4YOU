'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import { 
  FileText, 
  Download, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  TrendingUp,
  TrendingDown,
  Clock,
  Zap,
  Eye,
  Activity,
  BarChart3,
  Target,
  Lightbulb
} from 'lucide-react'

interface PerformanceData {
  coreWebVitals: {
    lcp: number | null
    fid: number | null
    cls: number | null
    fcp: number | null
    ttfb: number | null
  }
  loadingMetrics: {
    domContentLoaded: number
    loadComplete: number
    resourceCount: number
    totalSize: number
  }
  userExperience: {
    totalInteractions: number
    averageResponseTime: number
    slowInteractions: number
    fastInteractions: number
  }
  technicalMetrics: {
    memoryUsage: number
    connectionType: string
    deviceType: string
    browserInfo: string
  }
}

interface ReportSection {
  title: string
  score: number
  status: 'good' | 'needs-improvement' | 'poor'
  metrics: Array<{
    name: string
    value: string
    benchmark: string
    status: 'good' | 'needs-improvement' | 'poor'
  }>
  recommendations: string[]
}

export function PerformanceReportGenerator() {
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null)
  const [report, setReport] = useState<ReportSection[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [reportText, setReportText] = useState('')
  const [overallScore, setOverallScore] = useState(0)

  // Collect performance data
  const collectPerformanceData = async (): Promise<PerformanceData> => {
    // Get Core Web Vitals
    const coreWebVitals = {
      lcp: null as number | null,
      fid: null as number | null,
      cls: null as number | null,
      fcp: null as number | null,
      ttfb: null as number | null
    }

    // Try to get web vitals if available
    try {
      const { onLCP, onFCP, onCLS, onTTFB } = await import('web-vitals')
      
      await new Promise<void>((resolve) => {
        let collected = 0
        const target = 4
        
        const checkComplete = () => {
          collected++
          if (collected >= target) resolve()
        }

        onLCP((metric) => {
          coreWebVitals.lcp = metric.value
          checkComplete()
        })
        
        onFCP((metric) => {
          coreWebVitals.fcp = metric.value
          checkComplete()
        })
        
        onCLS((metric) => {
          coreWebVitals.cls = metric.value
          checkComplete()
        })
        
        onTTFB((metric) => {
          coreWebVitals.ttfb = metric.value
          checkComplete()
        })

        // Timeout after 3 seconds
        setTimeout(resolve, 3000)
      })
    } catch (error) {
      console.log('Web vitals collection failed:', error)
    }

    // Get navigation timing
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    const resources = performance.getEntriesByType('resource')
    
    const loadingMetrics = {
      domContentLoaded: navigation ? navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart : 0,
      loadComplete: navigation ? navigation.loadEventEnd - navigation.loadEventStart : 0,
      resourceCount: resources.length,
      totalSize: resources.reduce((sum, resource) => sum + (resource.transferSize || 0), 0)
    }

    // Mock user experience data (in real app, this would come from tracking)
    const userExperience = {
      totalInteractions: Math.floor(Math.random() * 100 + 50),
      averageResponseTime: Math.random() * 100 + 30,
      slowInteractions: Math.floor(Math.random() * 10),
      fastInteractions: Math.floor(Math.random() * 40 + 30)
    }

    // Get technical metrics
    const memory = (performance as any).memory
    const connection = (navigator as any).connection
    
    const technicalMetrics = {
      memoryUsage: memory ? (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100 : 0,
      connectionType: connection ? connection.effectiveType : 'unknown',
      deviceType: /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
      browserInfo: navigator.userAgent.split(' ').slice(-2).join(' ')
    }

    return {
      coreWebVitals,
      loadingMetrics,
      userExperience,
      technicalMetrics
    }
  }

  // Generate performance report
  const generateReport = async () => {
    setIsGenerating(true)
    
    try {
      const data = await collectPerformanceData()
      setPerformanceData(data)

      const reportSections: ReportSection[] = []

      // Core Web Vitals Section
      const coreWebVitalsSection: ReportSection = {
        title: 'Core Web Vitals',
        score: 0,
        status: 'good',
        metrics: [],
        recommendations: []
      }

      let vitalsScore = 100
      
      if (data.coreWebVitals.lcp) {
        const lcpStatus = data.coreWebVitals.lcp <= 2500 ? 'good' : data.coreWebVitals.lcp <= 4000 ? 'needs-improvement' : 'poor'
        coreWebVitalsSection.metrics.push({
          name: 'Largest Contentful Paint (LCP)',
          value: `${(data.coreWebVitals.lcp / 1000).toFixed(2)}s`,
          benchmark: 'Good: ≤2.5s, Needs Improvement: ≤4.0s',
          status: lcpStatus
        })
        if (lcpStatus !== 'good') vitalsScore -= 25
      }

      if (data.coreWebVitals.fcp) {
        const fcpStatus = data.coreWebVitals.fcp <= 1800 ? 'good' : data.coreWebVitals.fcp <= 3000 ? 'needs-improvement' : 'poor'
        coreWebVitalsSection.metrics.push({
          name: 'First Contentful Paint (FCP)',
          value: `${(data.coreWebVitals.fcp / 1000).toFixed(2)}s`,
          benchmark: 'Good: ≤1.8s, Needs Improvement: ≤3.0s',
          status: fcpStatus
        })
        if (fcpStatus !== 'good') vitalsScore -= 20
      }

      if (data.coreWebVitals.cls !== null) {
        const clsStatus = data.coreWebVitals.cls <= 0.1 ? 'good' : data.coreWebVitals.cls <= 0.25 ? 'needs-improvement' : 'poor'
        coreWebVitalsSection.metrics.push({
          name: 'Cumulative Layout Shift (CLS)',
          value: data.coreWebVitals.cls.toFixed(3),
          benchmark: 'Good: ≤0.1, Needs Improvement: ≤0.25',
          status: clsStatus
        })
        if (clsStatus !== 'good') vitalsScore -= 25
      }

      coreWebVitalsSection.score = Math.max(0, vitalsScore)
      coreWebVitalsSection.status = vitalsScore >= 80 ? 'good' : vitalsScore >= 50 ? 'needs-improvement' : 'poor'

      if (coreWebVitalsSection.status !== 'good') {
        coreWebVitalsSection.recommendations = [
          'Tối ưu hóa hình ảnh và sử dụng định dạng WebP',
          'Sử dụng lazy loading cho hình ảnh',
          'Minify CSS và JavaScript',
          'Sử dụng CDN để tăng tốc độ tải',
          'Tối ưu hóa Critical Rendering Path'
        ]
      }

      reportSections.push(coreWebVitalsSection)

      // Loading Performance Section
      const loadingSection: ReportSection = {
        title: 'Loading Performance',
        score: 0,
        status: 'good',
        metrics: [
          {
            name: 'DOM Content Loaded',
            value: `${data.loadingMetrics.domContentLoaded.toFixed(0)}ms`,
            benchmark: 'Good: <1500ms',
            status: data.loadingMetrics.domContentLoaded <= 1500 ? 'good' : 'needs-improvement'
          },
          {
            name: 'Total Resources',
            value: data.loadingMetrics.resourceCount.toString(),
            benchmark: 'Good: <50 requests',
            status: data.loadingMetrics.resourceCount <= 50 ? 'good' : 'needs-improvement'
          },
          {
            name: 'Total Size',
            value: `${(data.loadingMetrics.totalSize / 1024 / 1024).toFixed(2)} MB`,
            benchmark: 'Good: <2MB',
            status: data.loadingMetrics.totalSize <= 2 * 1024 * 1024 ? 'good' : 'needs-improvement'
          }
        ],
        recommendations: []
      }

      const loadingScore = loadingSection.metrics.reduce((score, metric) => {
        return score - (metric.status !== 'good' ? 20 : 0)
      }, 100)

      loadingSection.score = Math.max(0, loadingScore)
      loadingSection.status = loadingScore >= 80 ? 'good' : loadingScore >= 50 ? 'needs-improvement' : 'poor'

      if (loadingSection.status !== 'good') {
        loadingSection.recommendations = [
          'Giảm số lượng HTTP requests',
          'Nén và tối ưu hóa tài nguyên',
          'Sử dụng HTTP/2 và compression',
          'Implement resource bundling',
          'Remove unused CSS và JavaScript'
        ]
      }

      reportSections.push(loadingSection)

      // User Experience Section
      const uxSection: ReportSection = {
        title: 'User Experience',
        score: 0,
        status: 'good',
        metrics: [
          {
            name: 'Average Response Time',
            value: `${data.userExperience.averageResponseTime.toFixed(1)}ms`,
            benchmark: 'Good: <50ms, Acceptable: <100ms',
            status: data.userExperience.averageResponseTime <= 50 ? 'good' : 
                   data.userExperience.averageResponseTime <= 100 ? 'needs-improvement' : 'poor'
          },
          {
            name: 'Fast Interactions',
            value: `${data.userExperience.fastInteractions}/${data.userExperience.totalInteractions}`,
            benchmark: 'Good: >80% fast interactions',
            status: (data.userExperience.fastInteractions / data.userExperience.totalInteractions) > 0.8 ? 'good' : 'needs-improvement'
          }
        ],
        recommendations: []
      }

      const uxScore = uxSection.metrics.reduce((score, metric) => {
        return score - (metric.status === 'poor' ? 30 : metric.status === 'needs-improvement' ? 15 : 0)
      }, 100)

      uxSection.score = Math.max(0, uxScore)
      uxSection.status = uxScore >= 80 ? 'good' : uxScore >= 50 ? 'needs-improvement' : 'poor'

      if (uxSection.status !== 'good') {
        uxSection.recommendations = [
          'Sử dụng React.memo() để tránh re-render không cần thiết',
          'Implement virtual scrolling cho danh sách dài',
          'Debounce input events',
          'Optimize component rendering',
          'Use Web Workers cho heavy computations'
        ]
      }

      reportSections.push(uxSection)

      setReport(reportSections)

      // Calculate overall score
      const overall = reportSections.reduce((sum, section) => sum + section.score, 0) / reportSections.length
      setOverallScore(overall)

      // Generate text report
      generateTextReport(reportSections, overall, data)

    } catch (error) {
      console.error('Failed to generate report:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const generateTextReport = (sections: ReportSection[], overall: number, data: PerformanceData) => {
    const timestamp = new Date().toLocaleString('vi-VN')
    
    let text = `# BÁO CÁO HIỆU SUẤT TRANG WEB\n\n`
    text += `**Thời gian tạo báo cáo:** ${timestamp}\n`
    text += `**Điểm tổng thể:** ${overall.toFixed(0)}/100\n\n`

    text += `## TỔNG QUAN\n\n`
    text += `Trang web đã được đánh giá qua ${sections.length} tiêu chí chính:\n`
    sections.forEach(section => {
      const status = section.status === 'good' ? '✅ Tốt' : 
                    section.status === 'needs-improvement' ? '⚠️ Cần cải thiện' : '❌ Kém'
      text += `- ${section.title}: ${section.score}/100 ${status}\n`
    })

    text += `\n## CHI TIẾT ĐÁNH GIÁ\n\n`
    
    sections.forEach(section => {
      text += `### ${section.title.toUpperCase()}\n`
      text += `**Điểm số:** ${section.score}/100\n\n`
      
      text += `**Metrics:**\n`
      section.metrics.forEach(metric => {
        const status = metric.status === 'good' ? '✅' : 
                      metric.status === 'needs-improvement' ? '⚠️' : '❌'
        text += `- ${metric.name}: ${metric.value} ${status}\n`
        text += `  *Benchmark: ${metric.benchmark}*\n`
      })

      if (section.recommendations.length > 0) {
        text += `\n**Khuyến nghị cải thiện:**\n`
        section.recommendations.forEach(rec => {
          text += `- ${rec}\n`
        })
      }
      text += `\n`
    })

    text += `## KẾT LUẬN VÀ HÀNH ĐỘNG\n\n`
    if (overall >= 80) {
      text += `Trang web có hiệu suất tốt. Tiếp tục duy trì và theo dõi thường xuyên.\n`
    } else if (overall >= 50) {
      text += `Trang web cần cải thiện hiệu suất. Ưu tiên thực hiện các khuyến nghị được đề xuất.\n`
    } else {
      text += `Trang web có hiệu suất kém và cần cải thiện ngay lập tức. Thực hiện tất cả các khuyến nghị.\n`
    }

    setReportText(text)
  }

  const downloadReport = () => {
    const blob = new Blob([reportText], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `performance-report-${new Date().toISOString().split('T')[0]}.md`
    link.click()
    URL.revokeObjectURL(url)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'needs-improvement': return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case 'poor': return <XCircle className="h-4 w-4 text-red-600" />
      default: return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-600'
      case 'needs-improvement': return 'text-yellow-600'
      case 'poor': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Performance Report Generator</h2>
          <p className="text-muted-foreground">
            Tạo báo cáo hiệu suất chi tiết với khuyến nghị cải thiện
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={generateReport} 
            disabled={isGenerating}
            className="flex items-center gap-2"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Đang tạo báo cáo...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4" />
                Tạo báo cáo
              </>
            )}
          </Button>
          {reportText && (
            <Button onClick={downloadReport} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Tải xuống
            </Button>
          )}
        </div>
      </div>

      {report.length > 0 && (
        <>
          {/* Overall Score */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Điểm tổng thể
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="text-4xl font-bold">
                  {overallScore.toFixed(0)}
                  <span className="text-lg text-muted-foreground">/100</span>
                </div>
                <div className="flex-1">
                  <Progress value={overallScore} className="h-3" />
                </div>
                <div className="text-right">
                  {overallScore >= 80 ? (
                    <Badge className="bg-green-100 text-green-800">Tốt</Badge>
                  ) : overallScore >= 50 ? (
                    <Badge className="bg-yellow-100 text-yellow-800">Cần cải thiện</Badge>
                  ) : (
                    <Badge className="bg-red-100 text-red-800">Kém</Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Report Sections */}
          <div className="grid gap-6">
            {report.map((section, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{section.title}</span>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(section.status)}
                      <span className={`font-bold ${getStatusColor(section.status)}`}>
                        {section.score}/100
                      </span>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Metrics */}
                  <div className="space-y-2">
                    <h4 className="font-medium">Metrics</h4>
                    {section.metrics.map((metric, metricIndex) => (
                      <div key={metricIndex} className="flex items-center justify-between p-2 bg-muted rounded">
                        <div>
                          <div className="font-medium text-sm">{metric.name}</div>
                          <div className="text-xs text-muted-foreground">{metric.benchmark}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(metric.status)}
                          <span className="font-medium">{metric.value}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Recommendations */}
                  {section.recommendations.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium flex items-center gap-2">
                        <Lightbulb className="h-4 w-4" />
                        Khuyến nghị cải thiện
                      </h4>
                      <ul className="space-y-1">
                        {section.recommendations.map((rec, recIndex) => (
                          <li key={recIndex} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-primary">•</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Report Preview */}
          {reportText && (
            <Card>
              <CardHeader>
                <CardTitle>Xem trước báo cáo</CardTitle>
                <CardDescription>
                  Báo cáo dạng text có thể tải xuống
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={reportText}
                  readOnly
                  className="min-h-[300px] font-mono text-sm"
                />
              </CardContent>
            </Card>
          )}
        </>
      )}

      {!isGenerating && report.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">Chưa có báo cáo</h3>
            <p className="text-muted-foreground mb-4">
              Nhấn "Tạo báo cáo" để bắt đầu đánh giá hiệu suất trang web
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

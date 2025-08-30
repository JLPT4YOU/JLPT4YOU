'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Database, 
  Trash2, 
  RefreshCw, 
  Zap, 
  BarChart3,
  Clock,
  HardDrive,
  Activity,
  AlertCircle,
  CheckCircle
} from 'lucide-react'

interface CacheStats {
  memoryCache: {
    size: number
    entries: string[]
  }
}

interface CacheHealth {
  status: string
  cacheSize: number
  uptime: number
  memory: {
    rss: number
    heapUsed: number
    heapTotal: number
    external: number
  }
  timestamp: string
}

export function CacheManagement() {
  const [stats, setStats] = useState<CacheStats | null>(null)
  const [health, setHealth] = useState<CacheHealth | null>(null)
  const [loading, setLoading] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [customUserId, setCustomUserId] = useState('')
  const [customEndpoints, setCustomEndpoints] = useState('')

  // Fetch cache statistics
  const fetchStats = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/performance/cache?action=stats')
      const data = await response.json()
      if (data.success) {
        setStats(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch cache stats:', error)
    } finally {
      setLoading(false)
    }
  }

  // Fetch cache health
  const fetchHealth = async () => {
    try {
      const response = await fetch('/api/performance/cache?action=health')
      const data = await response.json()
      if (data.success) {
        setHealth(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch cache health:', error)
    }
  }

  // Clear cache
  const clearCache = async (type: string, params: Record<string, string> = {}) => {
    try {
      setLoading(true)
      const searchParams = new URLSearchParams({ type, ...params })
      const response = await fetch(`/api/performance/cache?${searchParams}`, {
        method: 'DELETE'
      })
      const data = await response.json()
      
      if (data.success) {
        await fetchStats()
        await fetchHealth()
        setLastUpdate(new Date())
      }
      
      return data
    } catch (error) {
      console.error('Failed to clear cache:', error)
      return { success: false, error: 'Network error' }
    } finally {
      setLoading(false)
    }
  }

  // Warm cache
  const warmCache = async (type: string, payload: any = {}) => {
    try {
      setLoading(true)
      const response = await fetch('/api/performance/cache', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, ...payload })
      })
      const data = await response.json()
      
      if (data.success) {
        await fetchStats()
        await fetchHealth()
        setLastUpdate(new Date())
      }
      
      return data
    } catch (error) {
      console.error('Failed to warm cache:', error)
      return { success: false, error: 'Network error' }
    } finally {
      setLoading(false)
    }
  }

  // Auto-refresh data
  useEffect(() => {
    fetchStats()
    fetchHealth()
    
    const interval = setInterval(() => {
      fetchStats()
      fetchHealth()
    }, 30000) // Refresh every 30 seconds
    
    return () => clearInterval(interval)
  }, [])

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${minutes}m`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Cache Management</h2>
          <p className="text-muted-foreground">
            Quản lý và theo dõi cache để tối ưu performance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            Cập nhật: {lastUpdate.toLocaleTimeString('vi-VN')}
          </Badge>
          <Button onClick={() => { fetchStats(); fetchHealth(); }} size="sm" disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
        </div>
      </div>

      {/* Cache Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Trạng thái
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {health?.status === 'healthy' ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <span className="font-medium">
                {health?.status || 'Unknown'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Database className="h-4 w-4" />
              Cache Size
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.memoryCache.size || 0}
            </div>
            <p className="text-xs text-muted-foreground">entries</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Uptime
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {health ? formatUptime(health.uptime) : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">server uptime</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <HardDrive className="h-4 w-4" />
              Memory Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {health ? formatBytes(health.memory.heapUsed) : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              / {health ? formatBytes(health.memory.heapTotal) : 'N/A'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="operations" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="operations">Cache Operations</TabsTrigger>
          <TabsTrigger value="entries">Cache Entries</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
        </TabsList>

        <TabsContent value="operations" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Clear Cache */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trash2 className="h-5 w-5" />
                  Clear Cache
                </CardTitle>
                <CardDescription>
                  Xóa cache để giải phóng memory và force refresh
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={() => clearCache('all')} 
                  variant="destructive" 
                  className="w-full"
                  disabled={loading}
                >
                  Clear All Cache
                </Button>
                
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    onClick={() => clearCache('api')} 
                    variant="outline"
                    disabled={loading}
                  >
                    Clear API
                  </Button>
                  <Button 
                    onClick={() => clearCache('db')} 
                    variant="outline"
                    disabled={loading}
                  >
                    Clear DB
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="userId">Clear User Cache</Label>
                  <div className="flex gap-2">
                    <Input
                      id="userId"
                      placeholder="User ID"
                      value={customUserId}
                      onChange={(e) => setCustomUserId(e.target.value)}
                    />
                    <Button 
                      onClick={() => clearCache('user', { userId: customUserId })}
                      disabled={!customUserId || loading}
                    >
                      Clear
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Warm Cache */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Warm Cache
                </CardTitle>
                <CardDescription>
                  Pre-load data vào cache để cải thiện performance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={() => warmCache('critical')} 
                  className="w-full"
                  disabled={loading}
                >
                  Warm Critical Data
                </Button>

                <div className="space-y-2">
                  <Label htmlFor="warmUserId">Warm User Cache</Label>
                  <div className="flex gap-2">
                    <Input
                      id="warmUserId"
                      placeholder="User ID"
                      value={customUserId}
                      onChange={(e) => setCustomUserId(e.target.value)}
                    />
                    <Button 
                      onClick={() => warmCache('user', { userId: customUserId })}
                      disabled={!customUserId || loading}
                    >
                      Warm
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endpoints">Custom Endpoints</Label>
                  <Input
                    id="endpoints"
                    placeholder="/api/endpoint1,/api/endpoint2"
                    value={customEndpoints}
                    onChange={(e) => setCustomEndpoints(e.target.value)}
                  />
                  <Button 
                    onClick={() => warmCache('custom', { 
                      endpoints: customEndpoints.split(',').map(e => e.trim()).filter(Boolean)
                    })}
                    disabled={!customEndpoints || loading}
                    size="sm"
                  >
                    Warm Custom
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="entries" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cache Entries</CardTitle>
              <CardDescription>
                Danh sách các entries hiện có trong cache
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats?.memoryCache.entries.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Không có cache entries
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {stats?.memoryCache.entries.map((entry, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                      <span className="font-mono text-sm">{entry}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => clearCache('pattern', { pattern: entry })}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Memory Monitoring
              </CardTitle>
            </CardHeader>
            <CardContent>
              {health && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium">RSS Memory</div>
                    <div className="text-2xl font-bold">{formatBytes(health.memory.rss)}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Heap Used</div>
                    <div className="text-2xl font-bold">{formatBytes(health.memory.heapUsed)}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Heap Total</div>
                    <div className="text-2xl font-bold">{formatBytes(health.memory.heapTotal)}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">External</div>
                    <div className="text-2xl font-bold">{formatBytes(health.memory.external)}</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

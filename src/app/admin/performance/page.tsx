'use client'

import { PerformanceDashboard } from '@/components/performance/performance-dashboard'
import { PerformanceTester } from '@/components/performance/performance-tester'
import { UserInteractionTracker } from '@/components/performance/user-interaction-tracker'
import { PerformanceReportGenerator } from '@/components/performance/performance-report-generator'
import { CacheManagement } from '@/components/performance/cache-management'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function PerformancePage() {
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Simple admin check - in production, this should be more secure
    const checkAdminAccess = () => {
      // Check if user is admin (you can implement proper auth here)
      const isAdmin = process.env.NODE_ENV === 'development' ||
                     localStorage.getItem('admin_access') === 'true'

      if (!isAdmin) {
        router.push('/admin')
        return
      }

      setIsAuthorized(true)
      setIsLoading(false)
    }

    checkAdminAccess()
  }, [router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Đang kiểm tra quyền truy cập...</p>
        </div>
      </div>
    )
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Không có quyền truy cập</h1>
          <p className="text-muted-foreground">Bạn cần quyền admin để xem trang này.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Performance Analysis Center</h1>
          <p className="text-muted-foreground">
            Trung tâm đánh giá và theo dõi hiệu suất trang web toàn diện
          </p>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="testing">Testing</TabsTrigger>
            <TabsTrigger value="interactions">Interactions</TabsTrigger>
            <TabsTrigger value="cache">Cache</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <PerformanceDashboard />
          </TabsContent>

          <TabsContent value="testing">
            <PerformanceTester />
          </TabsContent>

          <TabsContent value="interactions">
            <UserInteractionTracker />
          </TabsContent>

          <TabsContent value="cache">
            <CacheManagement />
          </TabsContent>

          <TabsContent value="reports">
            <PerformanceReportGenerator />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

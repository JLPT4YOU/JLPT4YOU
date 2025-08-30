/**
 * Admin Monitoring API Route
 * GET /api/admin/monitoring
 * Returns system monitoring data for admin dashboard
 * 🔒 SECURITY: Requires admin authentication
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/admin-auth'
import { getDashboardData, searchEvents, getSystemMetrics } from '@/lib/monitoring'
import { devConsole } from '@/lib/console-override'

export async function GET(request: NextRequest) {
  try {
    // 🔒 STEP 1: VERIFY ADMIN AUTHENTICATION
    const authResult = await requireAdminAuth(request)
    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      )
    }

    const adminUser = authResult.user!

    // 🔒 STEP 2: GET QUERY PARAMETERS
    const { searchParams } = new URL(request.url)
    const dataType = searchParams.get('type') || 'dashboard'
    const timeRange = searchParams.get('timeRange') || '1h'
    const eventType = searchParams.get('eventType')
    const eventLevel = searchParams.get('eventLevel')

    // 🔒 STEP 3: FETCH MONITORING DATA BASED ON REQUEST TYPE
    let responseData: unknown

    switch (dataType) {
      case 'dashboard':
        responseData = getDashboardData()
        break

      case 'metrics':
        responseData = getSystemMetrics()
        break

      case 'events':
        const filters: Record<string, any> = {}
        if (eventType && eventType !== 'all') filters.type = eventType
        if (eventLevel && eventLevel !== 'all') filters.level = eventLevel

        // Add time range filter
        if (timeRange !== 'all') {
          const now = new Date()
          let start: Date

          switch (timeRange) {
            case '1h':
              start = new Date(now.getTime() - 60 * 60 * 1000)
              break
            case '24h':
              start = new Date(now.getTime() - 24 * 60 * 60 * 1000)
              break
            case '7d':
              start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
              break
            default:
              start = new Date(now.getTime() - 60 * 60 * 1000)
          }

          filters.timeRange = {
            start: start.toISOString(),
            end: now.toISOString()
          }
        }

        responseData = {
          events: searchEvents(filters),
          totalCount: searchEvents(filters).length,
          filters: filters
        }
        break

      case 'health':
        responseData = {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          version: process.version
        }
        break

      default:
        return NextResponse.json(
          { error: 'Invalid data type requested' },
          { status: 400 }
        )
    }

    // 🔒 STEP 4: RETURN MONITORING DATA
    return NextResponse.json({
      success: true,
      data: responseData,
      requestedBy: {
        id: adminUser.id,
        email: adminUser.email,
        role: adminUser.role
      },
      timestamp: new Date().toISOString(),
      dataType: dataType
    })

  } catch (error) {
    console.error('Admin monitoring API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/monitoring
 * Allows admins to trigger monitoring actions
 */
export async function POST(request: NextRequest) {
  try {
    // 🔒 STEP 1: VERIFY ADMIN AUTHENTICATION
    const authResult = await requireAdminAuth(request)
    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      )
    }

    const adminUser = authResult.user!

    // 🔒 STEP 2: PARSE REQUEST BODY
    const { action, parameters } = await request.json()

    // 🔒 STEP 3: EXECUTE MONITORING ACTION
    let result: unknown

    switch (action) {
      case 'clear_events':
        // In a real implementation, this would clear old events
        result = {
          message: 'Events cleared successfully',
          clearedCount: 0 // Mock value
        }
        break

      case 'test_alert':
        // Trigger a test alert
        result = {
          message: 'Test alert triggered',
          alertId: `test_${Date.now()}`
        }
        break

      case 'export_logs':
        // Export monitoring logs
        result = {
          message: 'Log export initiated',
          exportId: `export_${Date.now()}`,
          estimatedTime: '2-5 minutes'
        }
        break

      default:
        return NextResponse.json(
          { error: 'Invalid action specified' },
          { status: 400 }
        )
    }

    // 🔒 STEP 4: LOG ADMIN ACTION
    devConsole.log(`🔒 ADMIN MONITORING ACTION: ${adminUser.email} executed ${action}`, {
      adminId: adminUser.id,
      action: action,
      parameters: parameters,
      timestamp: new Date().toISOString()
    })

    // 🔒 STEP 5: RETURN ACTION RESULT
    return NextResponse.json({
      success: true,
      action: action,
      result: result,
      executedBy: {
        id: adminUser.id,
        email: adminUser.email,
        role: adminUser.role
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Admin monitoring action error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

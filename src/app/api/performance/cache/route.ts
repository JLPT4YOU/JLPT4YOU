/**
 * Performance Cache Management API
 * Provides endpoints to manage and monitor cache performance
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCacheStats, cacheInvalidation, memoryCache } from '@/lib/cache-utils';

// GET /api/performance/cache - Get cache statistics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'stats':
        const stats = getCacheStats();
        return NextResponse.json({
          success: true,
          data: stats,
          timestamp: new Date().toISOString()
        });

      case 'health':
        const health = {
          status: 'healthy',
          cacheSize: memoryCache.size(),
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          timestamp: new Date().toISOString()
        };
        return NextResponse.json({
          success: true,
          data: health
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Use ?action=stats or ?action=health'
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Cache API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// DELETE /api/performance/cache - Clear cache
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const pattern = searchParams.get('pattern');
    const userId = searchParams.get('userId');

    switch (type) {
      case 'all':
        cacheInvalidation.clearAll();
        return NextResponse.json({
          success: true,
          message: 'All cache cleared'
        });

      case 'user':
        if (!userId) {
          return NextResponse.json({
            success: false,
            error: 'userId parameter required for user cache invalidation'
          }, { status: 400 });
        }
        cacheInvalidation.invalidateUser(userId);
        return NextResponse.json({
          success: true,
          message: `User cache cleared for ${userId}`
        });

      case 'api':
        const endpoint = searchParams.get('endpoint');
        cacheInvalidation.invalidateApi(endpoint || undefined);
        return NextResponse.json({
          success: true,
          message: endpoint ? `API cache cleared for ${endpoint}` : 'All API cache cleared'
        });

      case 'db':
        const queryName = searchParams.get('queryName');
        cacheInvalidation.invalidateDb(queryName || undefined);
        return NextResponse.json({
          success: true,
          message: queryName ? `DB cache cleared for ${queryName}` : 'All DB cache cleared'
        });

      case 'pattern':
        if (!pattern) {
          return NextResponse.json({
            success: false,
            error: 'pattern parameter required for pattern-based invalidation'
          }, { status: 400 });
        }
        cacheInvalidation.invalidatePattern(pattern);
        return NextResponse.json({
          success: true,
          message: `Cache cleared for pattern: ${pattern}`
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid type. Use: all, user, api, db, or pattern'
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Cache invalidation error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// POST /api/performance/cache - Warm cache
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, userId, endpoints } = body;

    switch (type) {
      case 'critical':
        // Import cache warming utilities
        const { cacheWarming } = await import('@/lib/cache-utils');
        await cacheWarming.warmCriticalData();
        return NextResponse.json({
          success: true,
          message: 'Critical cache warmed'
        });

      case 'user':
        if (!userId) {
          return NextResponse.json({
            success: false,
            error: 'userId required for user cache warming'
          }, { status: 400 });
        }
        const { cacheWarming: userCacheWarming } = await import('@/lib/cache-utils');
        await userCacheWarming.warmUserData(userId);
        return NextResponse.json({
          success: true,
          message: `User cache warmed for ${userId}`
        });

      case 'custom':
        if (!endpoints || !Array.isArray(endpoints)) {
          return NextResponse.json({
            success: false,
            error: 'endpoints array required for custom cache warming'
          }, { status: 400 });
        }
        
        const results = await Promise.allSettled(
          endpoints.map((endpoint: string) =>
            fetch(`${request.nextUrl.origin}${endpoint}`).catch(() => null)
          )
        );
        
        const successful = results.filter(r => r.status === 'fulfilled').length;
        
        return NextResponse.json({
          success: true,
          message: `Cache warmed for ${successful}/${endpoints.length} endpoints`,
          details: {
            total: endpoints.length,
            successful,
            failed: endpoints.length - successful
          }
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid type. Use: critical, user, or custom'
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Cache warming error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

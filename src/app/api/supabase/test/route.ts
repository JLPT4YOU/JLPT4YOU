/**
 * Supabase Test API Route
 * Test Supabase connection and configuration
 */

import { NextRequest, NextResponse } from 'next/server'
import { runAllSupabaseTests } from '@/lib/supabase-test'

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Running Supabase tests via API...')
    
    const results = await runAllSupabaseTests()
    
    return NextResponse.json({
      success: true,
      message: 'Supabase tests completed',
      results,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ Supabase test API error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { testType } = await request.json()
    
    let result
    
    switch (testType) {
      case 'connection':
        const { testSupabaseConnection } = await import('@/lib/supabase-test')
        result = await testSupabaseConnection()
        break
        
      case 'auth':
        const { testSupabaseAuth } = await import('@/lib/supabase-test')
        result = await testSupabaseAuth()
        break
        
      case 'admin':
        const { testSupabaseAdmin } = await import('@/lib/supabase-test')
        result = await testSupabaseAdmin()
        break
        
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid test type. Use: connection, auth, or admin'
        }, { status: 400 })
    }
    
    return NextResponse.json({
      success: true,
      testType,
      result,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ Supabase specific test error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

/**
 * Debug API Route - Check Database Schema
 * Kiểm tra xem các trường mới đã được thêm vào bảng users chưa
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({
        error: 'Supabase admin client not available'
      }, { status: 500 })
    }

    // Kiểm tra cấu trúc bảng users bằng cách test từng cột
    let tableInfo = []
    const testColumns = ['id', 'email', 'name', 'display_name', 'avatar_icon', 'password_updated_at', 'created_at', 'updated_at']

    for (const column of testColumns) {
      try {
        const { data, error } = await supabaseAdmin
          .from('users')
          .select(column)
          .limit(1)

        if (!error) {
          tableInfo.push({ column_name: column, exists: true, status: 'OK' })
        } else {
          tableInfo.push({
            column_name: column,
            exists: false,
            error: error.message,
            status: 'MISSING'
          })
        }
      } catch (err) {
        tableInfo.push({
          column_name: column,
          exists: false,
          error: err instanceof Error ? err.message : 'Unknown error',
          status: 'ERROR'
        })
      }
    }

    const tableError = null

    if (tableError) {
      console.error('Table info error:', tableError)
      return NextResponse.json({
        error: 'Failed to get table info',
        details: tableError
      }, { status: 500 })
    }

    // Kiểm tra xem có user nào trong database không
    const { data: userCount, error: countError } = await supabaseAdmin
      .from('users')
      .select('id', { count: 'exact', head: true })

    if (countError) {
      console.error('User count error:', countError)
    }

    // Lấy thông tin một user mẫu (nếu có)
    const { data: sampleUser, error: sampleError } = await supabaseAdmin
      .from('users')
      .select('*')
      .limit(1)
      .single()

    if (sampleError && sampleError.code !== 'PGRST116') {
      console.error('Sample user error:', sampleError)
    }

    // Kiểm tra các trường cần thiết
    const requiredFields = ['display_name', 'avatar_icon', 'password_updated_at']
    const existingFields = tableInfo?.filter(col => col.exists).map(col => col.column_name) || []
    const missingFields = requiredFields.filter(field => !existingFields.includes(field))

    return NextResponse.json({
      success: true,
      data: {
        tableColumns: tableInfo,
        userCount: userCount || 0,
        sampleUser: sampleUser || null,
        requiredFields,
        existingFields,
        missingFields,
        schemaStatus: missingFields.length === 0 ? 'complete' : 'incomplete'
      }
    })

  } catch (error) {
    console.error('Schema check error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

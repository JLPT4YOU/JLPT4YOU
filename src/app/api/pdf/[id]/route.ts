/**
 * PDF Proxy API Route
 * GET /api/pdf/[id] - Serve PDF files through proxy to protect direct access
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { SessionValidator } from '@/lib/session-validator' // ✅ ADDED: Session validator
import {
  performSecurityCheck,
  getSecurityHeaders,
  validateFilePath,
  logSecurityEvent
} from '@/lib/pdf-security'
import { devConsole } from '@/lib/console-override'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/pdf/[id] - Proxy PDF file with authentication and security checks
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    // ✅ ENHANCED: Use SessionValidator for comprehensive authentication
    devConsole.log(`[PDF API] Validating session for book ID: ${id}`)

    const validationResult = await SessionValidator.validateSession(request, {
      enableRefresh: true,
      refreshThreshold: 5,
      enableUserValidation: true,
      logValidation: process.env.NODE_ENV === 'development',
      securityChecks: true
    })

    if (!validationResult.valid) {
      devConsole.log(`[PDF API] Session validation failed: ${validationResult.error}`)
      logSecurityEvent('unauthorized_access', {
        bookId: id,
        error: validationResult.error,
        validationMethod: validationResult.validationMethod
      }, 'medium')

      // ✅ ENHANCED: Provide more helpful error response
      const errorResponse = {
        error: 'Authentication required',
        message: 'Phiên đăng nhập đã hết hạn hoặc không hợp lệ',
        details: validationResult.error,
        validationMethod: validationResult.validationMethod,
        suggestions: [
          'Vui lòng đăng nhập lại',
          'Kiểm tra kết nối internet',
          'Thử làm mới trang'
        ]
      }

      return NextResponse.json(errorResponse, { status: 401 })
    }

    const user = validationResult.user || validationResult.session?.user
    if (!user) {
      devConsole.log(`[PDF API] No user found in validation result`)
      logSecurityEvent('no_user_found', { bookId: id }, 'medium')
      return NextResponse.json(
        { error: 'User not found' },
        { status: 401 }
      )
    }

    devConsole.log(`[PDF API] Session validation successful for user: ${user.email}`)
    devConsole.log(`[PDF API] Validation method: ${validationResult.validationMethod}`)

    // Perform comprehensive security check with user ID
    const securityCheck = performSecurityCheck(request, id, user.id)
    if (!securityCheck.allowed) {
      return NextResponse.json(
        {
          error: 'Access denied',
          reasons: securityCheck.reasons
        },
        {
          status: 403
        }
      )
    }



    // Get book information using service role to bypass RLS
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: book, error: bookError } = await supabaseAdmin
      .from('books')
      .select('id, file_url, file_name, title')
      .eq('id', id)
      .single()

    if (bookError || !book) {
      logSecurityEvent('book_not_found', { bookId: id, userId: user.id }, 'low')
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      )
    }

    // Extract file path from Supabase URL
    const url = new URL(book.file_url)
    const pathParts = url.pathname.split('/')
    const bucketIndex = pathParts.findIndex(part => part === 'books')
    
    if (bucketIndex === -1) {
      return NextResponse.json(
        { error: 'Invalid file URL' },
        { status: 400 }
      )
    }

    const filePath = pathParts.slice(bucketIndex + 1).join('/')

    // Validate file path for security
    if (!validateFilePath(filePath)) {
      logSecurityEvent('invalid_file_path', { bookId: id, filePath, userId: user.id }, 'high')
      return NextResponse.json(
        { error: 'Invalid file path' },
        { status: 400 }
      )
    }

    // Download file from Supabase Storage using service role
    const { data: fileData, error: downloadError } = await supabaseAdmin.storage
      .from('books')
      .download(filePath)

    if (downloadError || !fileData) {
      console.error('File download error:', downloadError)
      logSecurityEvent('file_download_error', {
        bookId: id,
        filePath,
        userId: user.id,
        error: downloadError?.message
      }, 'medium')
      return NextResponse.json(
        { error: 'File not found or access denied' },
        { status: 404 }
      )
    }

    // Convert blob to array buffer
    const arrayBuffer = await fileData.arrayBuffer()

    // Get security headers
    const securityHeaders = getSecurityHeaders(book.file_name)

    // Log successful access
    logSecurityEvent('pdf_access_success', {
      bookId: id,
      userId: user.id,
      fileSize: arrayBuffer.byteLength
    }, 'low')

    // Create response with PDF data
    const response = new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        ...securityHeaders,
        'Content-Length': arrayBuffer.byteLength.toString(),
      }
    })

    return response

  } catch (error) {
    console.error('PDF proxy error:', error)
    logSecurityEvent('pdf_proxy_error', {
      bookId: (await params).id,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 'high')
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

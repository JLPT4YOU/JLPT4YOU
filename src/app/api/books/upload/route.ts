/**
 * Simplified upload route for debugging
 */

import { NextRequest, NextResponse } from 'next/server'
// import { createClient } from '@/utils/supabase/client' // Currently unused
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { SessionValidator } from '@/lib/session-validator' // ✅ ADDED: Session validator
import { uploadBookPDF, validateFile } from '@/lib/storage'
import { devConsole } from '@/lib/console-override'

export async function POST(request: NextRequest) {
  try {
    devConsole.log('=== ENHANCED UPLOAD API ===')

    // ✅ ENHANCED: Use SessionValidator for authentication
    devConsole.log('[Upload API] Validating session...')

    const validationResult = await SessionValidator.validateSession(request, {
      enableRefresh: true,
      enableUserValidation: true,
      logValidation: process.env.NODE_ENV === 'development',
      securityChecks: true
    })

    if (!validationResult.valid) {
      devConsole.log(`[Upload API] Session validation failed: ${validationResult.error}`)
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const user = validationResult.user || validationResult.session?.user
    if (!user) {
      devConsole.log('[Upload API] No user found in validation result')
      return NextResponse.json(
        { error: 'User not found' },
        { status: 401 }
      )
    }

    devConsole.log(`[Upload API] Session validation successful for user: ${user.email}`)

    // Check if user is admin using service role
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()



    if (userError || userData?.role !== 'Admin') {
      return NextResponse.json(
        { error: 'Admin access required', debug: { userData, userError } },
        { status: 403 }
      )
    }



    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const title = formData.get('title') as string
    const author = formData.get('author') as string
    const description = formData.get('description') as string
    const category = formData.get('category') as string
    const pages = parseInt(formData.get('pages') as string) || 0
    const status = (formData.get('status') as string) || 'draft'



    // Validate required fields
    if (!file || !title || !author || !category) {
      return NextResponse.json(
        { error: 'Missing required fields: file, title, author, category' },
        { status: 400 }
      )
    }

    // Validate file
    const validation = validateFile(file)
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    // Upload file to storage
    let uploadResult
    try {
      uploadResult = await uploadBookPDF(file)
    } catch (uploadError) {
      console.error('File upload error:', uploadError)
      return NextResponse.json(
        { error: uploadError instanceof Error ? uploadError.message : 'File upload failed' },
        { status: 500 }
      )
    }

    // Create book record in database
    const bookData = {
      title,
      author,
      description: description || null,
      category,
      file_url: uploadResult.url,
      file_name: file.name,
      file_size: file.size,
      pages,
      status: status as 'draft' | 'published' | 'archived',
      uploaded_by: user.id
    }



    const { data: book, error: dbError } = await supabaseAdmin
      .from('books')
      .insert(bookData)
      .select()
      .single()

    if (dbError) {
      console.error('Book creation error:', dbError)
      
      // Try to clean up uploaded file
      try {
        const { deleteFile, extractPathFromUrl } = await import('@/lib/storage')
        const filePath = extractPathFromUrl(uploadResult.url)
        if (filePath) {
          await deleteFile('books', filePath)
        }
      } catch (cleanupError) {
        console.warn('Failed to cleanup uploaded file:', cleanupError)
      }

      return NextResponse.json(
        { error: 'Failed to create book record', debug: dbError },
        { status: 500 }
      )
    }



    return NextResponse.json({
      message: 'Book uploaded successfully',
      book
    }, { status: 201 })

  } catch (error) {
    console.error('Upload API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', debug: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

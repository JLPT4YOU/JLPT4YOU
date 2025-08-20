/**
 * Individual Book API Routes
 * GET /api/books/[id] - Get book by ID
 * PUT /api/books/[id] - Update book
 * DELETE /api/books/[id] - Delete book
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { SessionValidator } from '@/lib/session-validator' // ✅ ADDED: Session validator
import { BookUpdateInput } from '@/types/books'
import { deleteFile, extractPathFromUrl } from '@/lib/storage'
import { devConsole } from '@/lib/console-override'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/books/[id] - Get book by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    // Use service role to read books (bypass RLS for public access)
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: book, error } = await supabaseAdmin
      .from('books')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Book not found' },
          { status: 404 }
        )
      }
      
      console.error('Book fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch book' },
        { status: 500 }
      )
    }

    return NextResponse.json(book)

  } catch (error) {
    console.error('Book GET API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/books/[id] - Update book
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    // ✅ FIXED: Use proper Supabase SSR client for authentication
    const cookieStore = await cookies()

    // Create Supabase client with proper cookie handling (currently unused but kept for future use)
    // const supabase = createServerClient(
    //   process.env.NEXT_PUBLIC_SUPABASE_URL!,
    //   process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    //   {
    //     cookies: {
    //       get(name: string) {
    //         return cookieStore.get(name)?.value
    //       },
    //       set() {
    //         // API routes can't set cookies
    //       },
    //       remove() {
    //         // API routes can't remove cookies
    //       },
    //     },
    //   }
    // )

    // ✅ ENHANCED: Check authentication with SessionValidator
    devConsole.log(`[Books API] Validating session for book ID: ${id}`)

    const validationResult = await SessionValidator.validateSession(request, {
      enableRefresh: true,
      enableUserValidation: true,
      logValidation: process.env.NODE_ENV === 'development',
      securityChecks: true
    })

    if (!validationResult.valid) {
      devConsole.log(`[Books API] Session validation failed: ${validationResult.error}`)
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const user = validationResult.user || validationResult.session?.user
    if (!user) {
      devConsole.log(`[Books API] No user found in validation result`)
      return NextResponse.json(
        { error: 'User not found' },
        { status: 401 }
      )
    }

    devConsole.log(`[Books API] Session validation successful for user: ${user.email}`)

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
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    const updateData: BookUpdateInput = await request.json()

    devConsole.log('Updating book:', id, updateData)

    // Update book using service role
    const { data: book, error } = await supabaseAdmin
      .from('books')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Book not found' },
          { status: 404 }
        )
      }
      
      console.error('Book update error:', error)
      return NextResponse.json(
        { error: 'Failed to update book' },
        { status: 500 }
      )
    }

    return NextResponse.json(book)

  } catch (error) {
    console.error('Book PUT API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/books/[id] - Delete book
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    // ✅ FIXED: Check Authorization header first
    const authHeader = request.headers.get('authorization')
    let user: { id: string } | null = null

    if (authHeader && authHeader.startsWith('Bearer ')) {
      // Use SessionValidator for header-based auth
      const validationResult = await SessionValidator.validateSession(request, {
        enableRefresh: true,
        enableUserValidation: true,
        logValidation: process.env.NODE_ENV === 'development',
        securityChecks: true
      })

      if (!validationResult.valid) {
        devConsole.log(`[Books API] Session validation failed: ${validationResult.error}`)
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        )
      }

      user = validationResult.user || validationResult.session?.user || null
    } else {
      // Fallback to cookie-based auth
      const cookieStore = await cookies()
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get(name: string) {
              return cookieStore.get(name)?.value
            },
            set() {},
            remove() {},
          },
        }
      )

      const { data: { user: cookieUser }, error: authError } = await supabase.auth.getUser()
      if (authError || !cookieUser) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        )
      }
      user = cookieUser
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

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
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    // Get book to delete file
    const { data: book, error: fetchError } = await supabaseAdmin
      .from('books')
      .select('file_url')
      .eq('id', id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Book not found' },
          { status: 404 }
        )
      }

      console.error('Book fetch error:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch book' },
        { status: 500 }
      )
    }

    // Delete book from database
    const { error: deleteError } = await supabaseAdmin
      .from('books')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Book delete error:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete book from database' },
        { status: 500 }
      )
    }

    // Delete file from storage
    try {
      const filePath = extractPathFromUrl(book.file_url)

      if (filePath) {
        await deleteFile('books', filePath)
      } else {
        // Try alternative path extraction
        const urlParts = book.file_url.split('/books/')
        if (urlParts.length > 1) {
          const alternativePath = urlParts[1]
          await deleteFile('books', alternativePath)
        }
      }
    } catch (fileError) {
      console.warn('Failed to delete file from storage:', fileError)
      // Don't fail the request if file deletion fails
    }

    return NextResponse.json({ message: 'Book deleted successfully' })

  } catch (error) {
    console.error('Book DELETE API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

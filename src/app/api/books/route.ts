/**
 * Books API Routes
 * GET /api/books - List books
 * POST /api/books - Create book
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { BookCreateInput, BookListParams } from '@/types/books'
import { devConsole } from '@/lib/console-override'

/**
 * GET /api/books - List books with filtering
 */
export async function GET(request: NextRequest) {
  try {
    // Get Supabase client with session from cookies (currently unused but kept for future use)
    // const cookieStore = await cookies()
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { searchParams } = new URL(request.url)
    const categoryParam = searchParams.get('category')
    const category = categoryParam && categoryParam !== 'all' ? categoryParam as BookListParams['category'] : undefined
    const status = searchParams.get('status') as BookListParams['status']
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    devConsole.log('Books API params:', { category, status, search, limit, offset })

    // Use service role to read books (bypass RLS)
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    let query = supabaseAdmin
      .from('books')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Filter by status if provided, otherwise show all
    if (status) {
      query = query.eq('status', status)
    }

    // Filter by category if provided
    if (category) {
      query = query.eq('category', category)
    }

    // Search in title, author, description
    if (search) {
      query = query.or(`title.ilike.%${search}%,author.ilike.%${search}%,description.ilike.%${search}%`)
    }

    const { data: books, error, count } = await query

    devConsole.log('Books query result:', {
      booksCount: books?.length,
      totalCount: count,
      error: error?.message
    })

    if (error) {
      console.error('Books fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch books' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      books: books || [],
      total: count || 0,
      hasMore: (count || 0) > offset + limit
    })

  } catch (error) {
    console.error('Books API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/books - Create new book
 */
export async function POST(request: NextRequest) {
  try {
    // Get Supabase client with session from cookies (currently unused but kept for future use)
    // const cookieStore = await cookies()
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const { data: userData, error: userError } = await supabase
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

    const bookData: BookCreateInput = await request.json()

    // Validate required fields
    if (!bookData.title || !bookData.author || !bookData.file_url) {
      return NextResponse.json(
        { error: 'Missing required fields: title, author, file_url' },
        { status: 400 }
      )
    }

    // Insert book
    const { data: book, error } = await supabase
      .from('books')
      .insert({
        ...bookData,
        uploaded_by: user.id
      })
      .select()
      .single()

    if (error) {
      console.error('Book creation error:', error)
      return NextResponse.json(
        { error: 'Failed to create book' },
        { status: 500 }
      )
    }

    return NextResponse.json(book, { status: 201 })

  } catch (error) {
    console.error('Books POST API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

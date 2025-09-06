/**
 * Types for books and library management
 */

export type BookCategory = 'n1' | 'n2' | 'n3' | 'n4' | 'n5' | 'other'
export type BookStatus = 'draft' | 'published' | 'archived'

export interface Book {
  id: string
  title: string
  author: string
  description?: string
  category: BookCategory
  file_url: string
  file_name: string
  file_size: number
  pages: number
  status: BookStatus
  uploaded_by?: string
  created_at: string
  updated_at: string
  metadata?: Record<string, unknown>
}

export interface BookCreateInput {
  title: string
  author: string
  description?: string
  category: BookCategory
  file_url: string
  file_name: string
  file_size: number
  pages?: number
  status?: BookStatus
  metadata?: Record<string, unknown>
}

export interface BookUpdateInput {
  title?: string
  author?: string
  description?: string
  category?: BookCategory
  pages?: number
  status?: BookStatus
  metadata?: Record<string, unknown>
}

export interface BookUploadData {
  title: string
  author: string
  description?: string
  category: BookCategory
  pages?: number
  file: File
}

export interface BookListParams {
  category?: BookCategory
  status?: BookStatus
  search?: string
  limit?: number
  offset?: number
}

export interface BookListResponse {
  books: Book[]
  total: number
  hasMore: boolean
}

// Constants
export const BOOK_CATEGORIES: { value: BookCategory; label: string }[] = [
  { value: 'n5', label: 'JLPT N5' },
  { value: 'n4', label: 'JLPT N4' },
  { value: 'n3', label: 'JLPT N3' },
  { value: 'n2', label: 'JLPT N2' },
  { value: 'n1', label: 'JLPT N1' },
  { value: 'other', label: 'Khác' }
]

export const BOOK_STATUSES: { value: BookStatus; label: string }[] = [
  { value: 'draft', label: 'Bản nháp' },
  { value: 'published', label: 'Đã xuất bản' },
  { value: 'archived', label: 'Đã lưu trữ' }
]

export const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
export const ALLOWED_FILE_TYPES = ['application/pdf']

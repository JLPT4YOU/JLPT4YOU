"use client"

import React, { useState, useEffect } from 'react'
import {
  FileText,
  Edit,
  Trash2,
  Plus,
  Search,
  Book,
  Loader2,
  AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { UploadModal } from './upload-modal'
import { EditBookModal } from './edit-book-modal'
import { Book as BookType, BookCategory, BookStatus } from '@/types/books'
import { useToast } from '@/components/ui/toast'
import { createClient } from '@/utils/supabase/client'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'

export function LibraryManagement() {
  const [books, setBooks] = useState<BookType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<BookCategory | 'all'>('all')
  const [selectedStatus, setSelectedStatus] = useState<BookStatus | 'all'>('all')
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [editingBook, setEditingBook] = useState<BookType | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    bookId: string
    bookTitle: string
  }>({
    isOpen: false,
    bookId: '',
    bookTitle: ''
  })

  const { success, error: showError } = useToast()

  // Fetch books from API
  const fetchBooks = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get authentication token
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        throw new Error('Authentication required')
      }

      const params = new URLSearchParams()
      if (selectedCategory !== 'all') params.append('category', selectedCategory)
      if (selectedStatus !== 'all') params.append('status', selectedStatus)
      if (searchTerm) params.append('search', searchTerm)

      const response = await fetch(`/api/books?${params}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch books')
      }

      const data = await response.json()
      setBooks(data.books || [])
    } catch (err) {
      console.error('Error fetching books:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch books')
    } finally {
      setLoading(false)
    }
  }

  // Load books on component mount and when filters change
  useEffect(() => {
    fetchBooks()
  }, [selectedCategory, selectedStatus, searchTerm])

  // Handle book upload
  const handleBookUpload = (newBook: BookType) => {
    setBooks(prev => [newBook, ...prev])
    setShowUploadModal(false)
    success('Upload thành công!', `Sách "${newBook.title}" đã được upload thành công.`)
  }

  // Handle book update
  const handleBookUpdate = async (bookId: string, updateData: Partial<BookType>) => {
    try {
      // Get authentication token
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        throw new Error('Authentication required')
      }

      const response = await fetch(`/api/books/${bookId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(updateData)
      })
      
      if (!response.ok) {
        throw new Error('Failed to update book')
      }
      
      const updatedBook = await response.json()
      setBooks(prev => prev.map(book =>
        book.id === bookId ? updatedBook : book
      ))
      setEditingBook(null)
      success('Cập nhật thành công!', `Sách "${updatedBook.title}" đã được cập nhật.`)
    } catch (err) {
      console.error('Error updating book:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to update book'
      setError(errorMessage)
      showError('Cập nhật thất bại', errorMessage)
    }
  }

  // Handle book deletion
  const handleBookDelete = (bookId: string, bookTitle: string) => {
    setConfirmDialog({
      isOpen: true,
      bookId,
      bookTitle
    })
  }

  const confirmDelete = async () => {
    try {
      // Get authentication token
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        throw new Error('Authentication required')
      }

      // Include auth header with bearer token
      const response = await fetch(`/api/books/${confirmDialog.bookId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to delete book`)
      }

      // Remove book from local state
      setBooks(prev => prev.filter(book => book.id !== confirmDialog.bookId))

      // Show success message
      setError(null)
      success('Xóa thành công!', `Sách "${confirmDialog.bookTitle}" đã được xóa khỏi hệ thống.`)

    } catch (err) {
      console.error('Error deleting book:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete book'
      setError(errorMessage)
      showError('Xóa thất bại', errorMessage)
    } finally {
      setConfirmDialog({ isOpen: false, bookId: '', bookTitle: '' })
    }
  }

  // Filter books (client-side filtering for immediate response)
  const filteredBooks = books.filter(book => {
    const matchesSearch = book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         book.author.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || book.category === selectedCategory
    const matchesStatus = selectedStatus === 'all' || book.status === selectedStatus
    
    return matchesSearch && matchesCategory && matchesStatus
  })

  const getStatusColor = (status: BookStatus) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'draft':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'archived':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    }
  }

  const getStatusText = (status: BookStatus) => {
    switch (status) {
      case 'published':
        return 'Đã xuất bản'
      case 'draft':
        return 'Bản nháp'
      case 'archived':
        return 'Đã lưu trữ'
      default:
        return status
    }
  }

  const getCategoryText = (category: BookCategory) => {
    if (category === 'other') return 'Khác'
    return category.toUpperCase()
  }

  return (
    <div className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-destructive/10 border border-destructive/20 rounded-md">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <p className="text-destructive">{error}</p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setError(null)}
            className="ml-auto"
          >
            Đóng
          </Button>
        </div>
      )}

      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm sách, tác giả..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as BookCategory | 'all')}
              className="px-3 py-2 rounded-md border border-input bg-background text-foreground text-sm"
            >
              <option value="all">Tất cả level</option>
              <option value="n1">N1</option>
              <option value="n2">N2</option>
              <option value="n3">N3</option>
              <option value="n4">N4</option>
              <option value="n5">N5</option>
              <option value="other">Khác</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as BookStatus | 'all')}
              className="px-3 py-2 rounded-md border border-input bg-background text-foreground text-sm"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="published">Đã xuất bản</option>
              <option value="draft">Bản nháp</option>
              <option value="archived">Đã lưu trữ</option>
            </select>
          </div>
        </div>

        {/* Upload Button */}
        <Button onClick={() => setShowUploadModal(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Upload PDF mới
        </Button>
      </div>

      {/* Books Table */}
      <div className="bg-muted/20 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Đang tải sách...</span>
          </div>
        ) : filteredBooks.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <Book className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">Chưa có sách nào</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || selectedCategory !== 'all' || selectedStatus !== 'all' 
                ? 'Không tìm thấy sách phù hợp với bộ lọc'
                : 'Hãy upload sách đầu tiên của bạn'
              }
            </p>
            {!searchTerm && selectedCategory === 'all' && selectedStatus === 'all' && (
              <Button onClick={() => setShowUploadModal(true)} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Upload PDF mới
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/40">
                <tr>
                  <th className="text-left p-4 font-medium text-foreground">Sách</th>
                  <th className="text-left p-4 font-medium text-foreground">Level</th>
                  <th className="text-left p-4 font-medium text-foreground">Trạng thái</th>
                  <th className="text-left p-4 font-medium text-foreground">Thao tác</th>
                </tr>
              </thead>
              <tbody>
              {filteredBooks.map((book) => (
                <tr key={book.id} className="border-t border-border/50 hover:bg-muted/30">
                  <td className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-16 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                        <FileText className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-medium text-foreground line-clamp-1">{book.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-1">{book.author}</p>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{book.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="text-sm bg-primary/10 text-primary px-3 py-1 rounded-full font-medium">
                      {getCategoryText(book.category)}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={cn(
                      "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                      getStatusColor(book.status)
                    )}>
                      {getStatusText(book.status)}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 w-8 p-0"
                        onClick={() => setEditingBook(book)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        onClick={() => handleBookDelete(book.id, book.title)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
      </div>

      {/* Upload Modal */}
      <UploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUpload={handleBookUpload}
      />

      {/* Edit Modal */}
      <EditBookModal
        isOpen={!!editingBook}
        book={editingBook}
        onClose={() => setEditingBook(null)}
        onSave={(updatedData) => {
          if (editingBook) {
            handleBookUpdate(editingBook.id, updatedData)
          }
        }}
      />

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={confirmDialog.isOpen}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmDialog({ isOpen: false, bookId: '', bookTitle: '' })
          }
        }}
        onConfirm={confirmDelete}
        title="Xác nhận xóa sách"
        description={`Bạn có chắc chắn muốn xóa sách "${confirmDialog.bookTitle}"? Hành động này không thể hoàn tác.`}
        confirmText="Xóa sách"
        cancelText="Hủy"
        variant="destructive"
        icon={<Trash2 className="h-6 w-6 text-red-500" />}
      />
    </div>
  )
}

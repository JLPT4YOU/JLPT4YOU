// BACKUP: This file has been moved to language-aware routing
// New location: src/app/[lang]/library/book/[id]/page.tsx
// Date: 2025-01-27
// Reason: Fix 404 error for language-prefixed URLs like /vn/library/book/[id]

"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { ProtectedRoute } from "@/components/auth/protected-route"
import { SessionErrorBoundary } from "@/components/auth/session-error-boundary" // ✅ ADDED: Session error boundary
import { Book } from "@/types/books"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react"

// Dynamically import PDF viewer to avoid SSR issues
const PDFViewerClient = dynamic(
  () => import("@/components/pdf/pdf-viewer-client").then((mod) => ({ default: mod.PDFViewerClient })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin mr-2" />
        <span>Đang tải PDF viewer...</span>
      </div>
    )
  }
)

export default function BookReadingPage() {
  const params = useParams()
  const router = useRouter()
  const bookId = params.id as string
  
  const [book, setBook] = useState<Book | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchBook = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(`/api/books/${bookId}`)
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Sách không tồn tại')
          }
          throw new Error('Không thể tải thông tin sách')
        }

        const bookData = await response.json()
        setBook(bookData)
      } catch (err) {
        // Only log errors in development
        if (process.env.NODE_ENV === 'development') {
          console.error('Error fetching book:', err)
        }
        setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi')
      } finally {
        setLoading(false)
      }
    }

    if (bookId) {
      fetchBook()
    }
  }, [bookId])

  // Add basic developer tools detection (can be bypassed but adds friction)
  useEffect(() => {
    const detectDevTools = () => {
      const threshold = 160
      if (window.outerHeight - window.innerHeight > threshold ||
          window.outerWidth - window.innerWidth > threshold) {
        // Clear console in production to prevent debugging
        if (process.env.NODE_ENV === 'production') {
          console.clear()
          console.log('%cAccess Denied', 'color: red; font-size: 50px; font-weight: bold;')
          console.log('%cThis content is protected.', 'color: red; font-size: 20px;')
        }
      }
    }

    const interval = setInterval(detectDevTools, 1000)

    // Disable common keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // Disable F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
      if (e.key === 'F12' ||
          (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J')) ||
          (e.ctrlKey && e.key === 'u')) {
        e.preventDefault()
        return false
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      clearInterval(interval)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background">
          <div className="app-container app-section">
            <div className="app-content">
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin mr-2" />
                <span>Đang tải sách...</span>
              </div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  if (error || !book) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background">
          <div className="app-container app-section">
            <div className="app-content">
              <div className="flex flex-col items-center justify-center py-20">
                <AlertCircle className="h-12 w-12 text-destructive mb-4" />
                <h1 className="text-2xl font-bold text-foreground mb-2">
                  {error || 'Sách không tồn tại'}
                </h1>
                <p className="text-muted-foreground mb-6 text-center">
                  Sách bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.
                </p>
                <Button onClick={() => router.back()} variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Quay lại
                </Button>
              </div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  // Generate proxy URL for PDF
  const proxyUrl = `/api/pdf/${bookId}`

  return (
    <ProtectedRoute>
      <SessionErrorBoundary
        enableAutoRecovery={true}
        maxRecoveryAttempts={3}
        onError={(error, errorInfo) => {
          // Only log errors in development
          if (process.env.NODE_ENV === 'development') {
            console.error('📚 [BookReading] Session error:', error, errorInfo)
          }
        }}
        onRecoverySuccess={(method) => {
          // Only log recovery success in development
          if (process.env.NODE_ENV === 'development') {
            console.log('📚 [BookReading] Session recovered via:', method)
          }
        }}
        onRecoveryFailure={(error) => {
          // Only log recovery failures in development
          if (process.env.NODE_ENV === 'development') {
            console.error('📚 [BookReading] Session recovery failed:', error)
          }
        }}
      >
        <div className="min-h-screen bg-background">
          {/* PDF Viewer */}
          <PDFViewerClient
            fileUrl={proxyUrl}
            fileName={book.file_name}
            className="h-screen"
          />
        </div>
      </SessionErrorBoundary>
    </ProtectedRoute>
  )
}

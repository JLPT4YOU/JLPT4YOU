"use client"

import { useState, useRef } from 'react'
import { X, Upload, FileText, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { BookCategory, BookStatus, Book } from '@/types/books'
import { validateFile, formatFileSize } from '@/lib/storage'
import { createClient } from '@/utils/supabase/client'

interface BookData {
  title: string
  author: string
  description: string
  category: BookCategory
  pages: number
  status: BookStatus
}

interface UploadModalProps {
  isOpen: boolean
  onClose: () => void
  onUpload: (book: Book) => void
}

export function UploadModal({ isOpen, onClose, onUpload }: UploadModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    description: '',
    category: 'n5' as BookCategory,
    pages: 0,
    status: 'published' as BookStatus
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleFileSelect = (file: File) => {
    const validation = validateFile(file)
    if (validation.valid) {
      setSelectedFile(file)
      setErrors(prev => ({ ...prev, file: '' }))
    } else {
      setErrors(prev => ({ ...prev, file: validation.error || 'File không hợp lệ' }))
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.title.trim()) newErrors.title = 'Tên sách là bắt buộc'
    if (!formData.author.trim()) newErrors.author = 'Tác giả là bắt buộc'
    if (!formData.description.trim()) newErrors.description = 'Mô tả là bắt buộc'
    if (!formData.pages || formData.pages <= 0) newErrors.pages = 'Số trang phải lớn hơn 0'
    if (!selectedFile) newErrors.file = 'Vui lòng chọn file PDF'
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm() || !selectedFile) return

    setIsUploading(true)
    setErrors({})

    try {
      // Create form data for upload
      const uploadFormData = new FormData()
      uploadFormData.append('file', selectedFile)
      uploadFormData.append('title', formData.title)
      uploadFormData.append('author', formData.author)
      uploadFormData.append('description', formData.description)
      uploadFormData.append('category', formData.category)
      uploadFormData.append('pages', formData.pages.toString())
      uploadFormData.append('status', formData.status)

      // Get current session for Authorization header
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      const headers: Record<string, string> = {}
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }

      // Upload to API
      const response = await fetch('/api/books/upload', {
        method: 'POST',
        headers,
        body: uploadFormData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Upload failed')
      }

      const result = await response.json()

      // Call parent callback with the created book
      onUpload(result.book)

      // Reset form
      setFormData({
        title: '',
        author: '',
        description: '',
        category: 'n5',
        pages: 0,
        status: 'published'
      })
      setSelectedFile(null)
      setErrors({})

    } catch (error) {
      console.error('Upload error:', error)
      setErrors({
        submit: error instanceof Error ? error.message : 'Upload failed'
      })
    } finally {
      setIsUploading(false)
    }
  }



  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">Upload PDF mới</h2>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* File Upload */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">File PDF *</label>
            <div
              className={cn(
                "border-2 border-dashed rounded-xl p-8 text-center transition-colors",
                dragActive ? "border-primary bg-primary/5" : "border-border",
                errors.file ? "border-destructive" : ""
              )}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {selectedFile ? (
                <div className="space-y-2">
                  <FileText className="h-12 w-12 mx-auto text-primary" />
                  <p className="font-medium text-foreground">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedFile(null)}
                  >
                    Chọn file khác
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                  <p className="text-foreground">Kéo thả file PDF vào đây hoặc</p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Chọn file
                  </Button>
                  <p className="text-xs text-muted-foreground">Chỉ chấp nhận file PDF, tối đa 50MB</p>
                </div>
              )}
            </div>
            {errors.file && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                {errors.file}
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              className="hidden"
            />
          </div>

          {/* Book Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Tên sách *</label>
              <Input
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Nhập tên sách..."
                className={errors.title ? 'border-destructive' : ''}
              />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Tác giả *</label>
              <Input
                value={formData.author}
                onChange={(e) => handleInputChange('author', e.target.value)}
                placeholder="Nhập tên tác giả..."
                className={errors.author ? 'border-destructive' : ''}
              />
              {errors.author && (
                <p className="text-sm text-destructive">{errors.author}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Mô tả *</label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Nhập mô tả sách..."
              rows={3}
              className={cn(
                "w-full px-3 py-2 rounded-md border border-input bg-background text-foreground resize-none",
                errors.description ? 'border-destructive' : ''
              )}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Cấp độ</label>
              <select
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground"
              >
                <option value="n1">N1</option>
                <option value="n2">N2</option>
                <option value="n3">N3</option>
                <option value="n4">N4</option>
                <option value="n5">N5</option>
                <option value="other">Khác</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Trạng thái</label>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground"
              >
                <option value="published">Xuất bản chính thức</option>
                <option value="draft">Bản nháp</option>
                <option value="archived">Đã lưu trữ</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Số trang *</label>
              <Input
                type="number"
                value={formData.pages || ''}
                onChange={(e) => handleInputChange('pages', parseInt(e.target.value) || 0)}
                placeholder="0"
                min="1"
                className={errors.pages ? 'border-destructive' : ''}
              />
              {errors.pages && (
                <p className="text-sm text-destructive">{errors.pages}</p>
              )}
            </div>
          </div>

          {/* Error message */}
          {errors.submit && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <p className="text-sm text-destructive">{errors.submit}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isUploading}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isUploading || !selectedFile}
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang upload...
                </>
              ) : (
                'Upload sách'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

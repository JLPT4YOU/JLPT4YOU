"use client"

import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/lib/use-translation'
import { TranslationData } from '@/lib/i18n'

interface QuestionPaginationProps {
  currentPage: number
  totalPages: number
  questionsPerPage: number
  totalQuestions: number
  onPageChange: (page: number) => void
  translations?: TranslationData
}

export function QuestionPagination({
  currentPage,
  totalPages,
  questionsPerPage,
  totalQuestions,
  onPageChange,
  translations
}: QuestionPaginationProps) {
  const { t } = useTranslation(translations || {} as any)
  const startQuestion = (currentPage - 1) * questionsPerPage + 1
  const endQuestion = Math.min(currentPage * questionsPerPage, totalQuestions)

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = []
    const maxVisible = 7 // Maximum number of page buttons to show
    
    if (totalPages <= maxVisible) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Always show first page
      pages.push(1)
      
      if (currentPage > 3) {
        pages.push('ellipsis')
      }
      
      // Show pages around current page
      const start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)
      
      for (let i = start; i <= end; i++) {
        pages.push(i)
      }
      
      if (currentPage < totalPages - 2) {
        pages.push('ellipsis')
      }
      
      // Always show last page
      if (totalPages > 1) {
        pages.push(totalPages)
      }
    }
    
    return pages
  }

  if (totalPages <= 1) {
    return null
  }

  return (
    <div className="bg-background rounded-2xl p-6 md:p-8">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Info */}
        <div className="text-sm text-muted-foreground">
          {`Showing ${startQuestion}-${endQuestion} of ${totalQuestions} questions`}
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center gap-2">
          {/* Previous Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="flex items-center gap-1 rounded-xl bg-muted/30 hover:bg-accent/50"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden md:inline">{t('reviewAnswers.pagination.previous')}</span>
          </Button>

          {/* Page Numbers */}
          <div className="flex items-center gap-1">
            {getPageNumbers().map((page, index) => {
              if (page === 'ellipsis') {
                return (
                  <div key={`ellipsis-${index}`} className="px-2">
                    <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                  </div>
                )
              }

              return (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => onPageChange(page)}
                  className={cn(
                    "w-9 h-9 p-0 rounded-xl",
                    currentPage === page
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/20 hover:bg-accent/40"
                  )}
                >
                  {page}
                </Button>
              )
            })}
          </div>

          {/* Next Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="flex items-center gap-1 rounded-xl bg-muted/30 hover:bg-accent/50"
          >
            <span className="hidden md:inline">{t('reviewAnswers.pagination.next')}</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

"use client"

import { useTranslations } from '@/hooks/use-translations'
import { Button } from '@/components/ui/button'
import { AlertTriangle, X } from 'lucide-react'

interface ExitConfirmDialogProps {
  isOpen: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ExitConfirmDialog({ isOpen, onConfirm, onCancel }: ExitConfirmDialogProps) {
  const { t } = useTranslations()

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-in fade-in-0 duration-300"
        onClick={onCancel}
      />
      
      {/* Dialog */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 animate-in fade-in-0 zoom-in-95 duration-300">
        <div className="bg-background border border-border rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  {t('study.practice.confirmExit.title')}
                </h3>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="h-8 w-8 p-0 hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="mb-6 space-y-3">
            <p className="text-base text-foreground">
              {t('study.practice.confirmExit.message')}
            </p>
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
              <p className="text-sm text-amber-800 dark:text-amber-200 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                {t('study.practice.confirmExit.warning')}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={onCancel}
              className="min-w-[100px]"
            >
              {t('study.practice.confirmExit.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={onConfirm}
              className="min-w-[100px]"
            >
              {t('study.practice.confirmExit.confirm')}
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}

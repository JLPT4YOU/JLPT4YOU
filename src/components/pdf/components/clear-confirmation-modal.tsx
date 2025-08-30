import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ClearConfirmationModalProps {
  isOpen: boolean
  onConfirm: () => void
  onCancel: () => void
  onClearCurrentPage?: () => void
}

export function ClearConfirmationModal({
  isOpen,
  onConfirm,
  onCancel,
  onClearCurrentPage
}: ClearConfirmationModalProps) {
  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
        onClick={onCancel}
      >
        {/* Modal */}
        <div 
          className="bg-background border border-border rounded-lg shadow-lg max-w-md w-full mx-4 p-6"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">
              Làm sạch PDF
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="mb-6">
            <p className="text-muted-foreground">
              Bạn có chắc chắn muốn clear sạch toàn bộ chú thích trên <strong>TRANG NAY HOẶC TẤT CẢ CÁC TRANG</strong> của PDF này không?
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              ⚠️ Hành động này sẽ xóa tất cả nét vẽ trên trang này hoặc toàn bộ trang và không thể hoàn tác.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            {onClearCurrentPage && (
              <Button
                variant="outline"
                onClick={() => {
                  onClearCurrentPage()
                  onCancel()
                }}
                className="px-4"
              >
                Chỉ trang này
              </Button>
            )}
            <Button
              variant="destructive"
              onClick={onConfirm}
              className="px-4"
            >
              Toàn bộ PDF
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}

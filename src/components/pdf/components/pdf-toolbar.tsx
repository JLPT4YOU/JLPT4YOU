import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  Undo2,
  Redo2,
  PanelLeft,
  BrushCleaning,
  PenTool,
  Highlighter,
  Eraser,
  Maximize2,
  Scroll,
  FileText,
  Menu,
  Sun,
  Moon,
  ChevronDown,
  Download
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { PDFToolbarProps } from '../types'
import { ToolbarColorPicker } from './toolbar-color-picker'
import { PageIndicator } from './shared-page-indicator'
import { useState, useEffect, useRef, useCallback } from 'react'
import { PDF_CONFIG } from '../config/pdf-config'

export function PDFToolbar({
  pageNumber,
  numPages,
  scale,
  loading,
  showThumbnails,
  canUndo,
  canRedo,
  activeAnnotationTool,
  selectedColor,
  brushSize,
  hasAnnotations,
  viewMode,
  onToggleThumbnails,
  onZoomIn,
  onZoomOut,
  onRotate,
  onFitToWidth,
  onToggleViewMode,
  onPageJump,
  onDownload,
  onDraw,
  onHighlight,
  onEraser,
  onUndo,
  onRedo,
  onClearAll,
  onColorChange,
  onBrushSizeChange,
  onDrawingStart,
  showAnnotationDropdown = true,
}: PDFToolbarProps) {
  const [isMobile, setIsMobile] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)



  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Detect theme mode
  useEffect(() => {
    const checkTheme = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'))
    }

    checkTheme()
    // Listen for theme changes
    const observer = new MutationObserver(checkTheme)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })

    return () => observer.disconnect()
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (showDropdown && !target.closest('.dropdown-container')) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showDropdown])

  const toggleTheme = () => {
    document.documentElement.classList.toggle('dark')
  }

  // Auto-close annotation dropdown when drawing starts
  // This function is now just a pass-through since state is managed by parent
  const handleDrawingStartLocal = useCallback(() => {
    // Call the parent callback to close dropdown
    onDrawingStart?.()
  }, [onDrawingStart])

  return (
    <div
      className="flex items-center justify-between px-1 sm:px-4 py-2 sm:py-3 bg-background border-b border-border shadow-lg"
      role="toolbar"
      aria-label={PDF_CONFIG.ARIA_LABELS.TOOLBAR}
    >
      {/* Left - Sidebar Toggle */}
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleThumbnails}
          className={`h-7 w-7 sm:h-8 sm:w-8 p-0 rounded-md transition-colors ${
            showThumbnails
              ? 'text-foreground bg-accent hover:bg-accent/80'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent'
          }`}
          title={PDF_CONFIG.ARIA_LABELS.THUMBNAILS}
          aria-label={PDF_CONFIG.ARIA_LABELS.THUMBNAILS}
          aria-pressed={showThumbnails}
        >
          <PanelLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </Button>
      </div>

      {/* Center - Main Toolbar */}
      <div className="flex items-center gap-0.5 sm:gap-1 bg-card rounded-lg px-1 sm:px-3 py-1 sm:py-2 shadow-inner border border-border max-w-[calc(100vw-80px)] sm:max-w-none">
        {/* 1. Trang hiện tại / Tổng số trang - Hidden on mobile */}
        <PageIndicator
          variant="desktop"
          currentPage={pageNumber}
          totalPages={numPages}
          loading={loading}
          onPageJump={onPageJump}
        />

        {/* Separator - Hidden on mobile */}
        <div className="hidden sm:block w-px h-6 bg-border mx-1" />

        {/* 2. Nút thu nhỏ zoom (-) */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onZoomOut}
          disabled={scale <= 0.5}
          className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed rounded-md flex-shrink-0"
          title={PDF_CONFIG.ARIA_LABELS.ZOOM_OUT}
          aria-label={PDF_CONFIG.ARIA_LABELS.ZOOM_OUT}
        >
          <ZoomOut className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </Button>

        {/* 3. Tỷ lệ phần trăm zoom hiện tại - Hidden on mobile */}
        <div
          className="hidden sm:flex items-center px-2 py-1 bg-muted rounded-md min-w-[60px] justify-center flex-shrink-0"
          title="Sử dụng Ctrl + cuộn chuột hoặc chạm hai ngón tay để zoom"
        >
          <span className="text-sm font-medium text-foreground">
            {Math.round(scale * 100)}%
          </span>
        </div>

        {/* 4. Nút phóng to zoom (+) */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onZoomIn}
          disabled={scale >= 3.0}
          className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed rounded-md flex-shrink-0"
          title={PDF_CONFIG.ARIA_LABELS.ZOOM_IN}
          aria-label={PDF_CONFIG.ARIA_LABELS.ZOOM_IN}
        >
          <ZoomIn className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </Button>

        {/* 5. Nút fit to width */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onFitToWidth}
          className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md flex-shrink-0"
          title="Vừa khít màn hình"
          aria-label="Vừa khít màn hình"
        >
          <Maximize2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </Button>

        {/* Separator - Hidden on mobile */}
        <div className="hidden sm:block w-px h-6 bg-border mx-1" />

        {/* 8. Nút undo thao tác - Visible on mobile */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onUndo}
          disabled={!canUndo}
          className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed rounded-md flex-shrink-0"
          title="Hoàn tác"
        >
          <Undo2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </Button>

        {/* 9. Nút redo thao tác - Visible on mobile */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onRedo}
          disabled={!canRedo}
          className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed rounded-md flex-shrink-0"
          title="Làm lại"
        >
          <Redo2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </Button>

        {/* Separator - Hidden on mobile */}
        <div className="hidden sm:block w-px h-6 bg-border mx-1" />



        {/* 11. Nút xoay trang 90 độ - Smaller on mobile */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onRotate}
          className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md flex-shrink-0"
          title="Xoay trang"
        >
          <RotateCw className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </Button>

        {/* 12. Pen Tool - Smaller on mobile */}
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={onDraw}
            className={`h-7 w-7 sm:h-8 sm:w-8 p-0 rounded-md transition-colors flex-shrink-0 ${
              activeAnnotationTool === 'draw'
                ? 'dark:bg-white dark:text-black dark:hover:bg-white/90 light:bg-black light:text-white light:hover:bg-black/90 bg-black text-white hover:bg-black/90'
                : 'text-muted-foreground hover-muted'
            }`}
            title={PDF_CONFIG.ARIA_LABELS.DRAW}
            aria-label={PDF_CONFIG.ARIA_LABELS.DRAW}
            aria-pressed={activeAnnotationTool === 'draw'}
          >
            <PenTool className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </Button>

          {/* Universal annotation tool controls - always positioned at pen button */}
          {showAnnotationDropdown && (activeAnnotationTool === 'draw' || activeAnnotationTool === 'highlight' || activeAnnotationTool === 'eraser') && (
            <div className={`absolute top-full left-1/2 transform -translate-x-1/2 mt-2 z-50 bg-background border border-border rounded-lg shadow-lg ${
              activeAnnotationTool === 'eraser' 
                ? (isMobile ? 'p-2 min-w-[140px]' : 'p-3 min-w-[200px]')
                : (isMobile ? 'p-2 min-w-[160px]' : 'p-3 min-w-[200px]')
            }`}>
              <div className={`space-y-${isMobile ? '2' : '3'}`}>
                <div className={`text-center ${isMobile ? 'text-xs' : 'text-sm'} font-medium text-foreground`}>
                  {activeAnnotationTool === 'draw' ? 'Bút vẽ' :
                   activeAnnotationTool === 'highlight' ? 'Bút dạ quang' : 'Cục tẩy'}
                </div>
                
                {/* Brush Size */}
                {onBrushSizeChange && (
                  <div className="space-y-1">
                    <label className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground`}>Kích thước</label>
                    <div className={`flex items-center gap-${isMobile ? '1' : '2'}`}>
                      <span className={`${isMobile ? 'text-xs w-2' : 'text-sm w-3'}`}>1</span>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={brushSize || 2}
                        onChange={(e) => onBrushSizeChange(Number(e.target.value))}
                        className={`flex-1 ${isMobile ? 'h-1' : 'h-2'} bg-muted rounded-full appearance-none cursor-pointer`}
                      />
                      <span className={`${isMobile ? 'text-xs w-2' : 'text-sm w-3'}`}>10</span>
                    </div>
                  </div>
                )}
                
                {/* Color Picker - Only for pen and highlight */}
                {onColorChange && (activeAnnotationTool === 'draw' || activeAnnotationTool === 'highlight') && (
                  <div className="space-y-1">
                    <label className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground`}>Màu sắc</label>
                    <ToolbarColorPicker
                      selectedColor={selectedColor || '#000000'}
                      onColorChange={onColorChange}
                      activeAnnotationTool={activeAnnotationTool}
                      isMobileDropdown={true}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 13. Highlight Tool - Smaller on mobile */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onHighlight}
          className={`h-7 w-7 sm:h-8 sm:w-8 p-0 rounded-md transition-colors flex-shrink-0 ${
            activeAnnotationTool === 'highlight'
              ? 'dark:bg-white dark:text-black dark:hover:bg-white/90 light:bg-black light:text-white light:hover:bg-black/90 bg-black text-white hover:bg-black/90'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent'
          }`}
          title={PDF_CONFIG.ARIA_LABELS.HIGHLIGHT}
          aria-label={PDF_CONFIG.ARIA_LABELS.HIGHLIGHT}
          aria-pressed={activeAnnotationTool === 'highlight'}
        >
          <Highlighter className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </Button>

        {/* 14. Eraser Tool - Smaller on mobile */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onEraser}
          className={`h-7 w-7 sm:h-8 sm:w-8 p-0 rounded-md transition-colors flex-shrink-0 ${
            activeAnnotationTool === 'eraser'
              ? 'dark:bg-white dark:text-black dark:hover:bg-white/90 light:bg-black light:text-white light:hover:bg-black/90 bg-black text-white hover:bg-black/90'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent'
          }`}
          title={PDF_CONFIG.ARIA_LABELS.ERASER}
          aria-label={PDF_CONFIG.ARIA_LABELS.ERASER}
          aria-pressed={activeAnnotationTool === 'eraser'}
        >
          <Eraser className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </Button>


      </div>

      {/* Right - Dropdown Menu */}
      <div className="flex items-center relative dropdown-container">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowDropdown(!showDropdown)}
          className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md flex-shrink-0"
          title="Tùy chọn"
          aria-label="Tùy chọn"
          aria-expanded={showDropdown}
        >
          <Menu className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </Button>

        {/* Dropdown Menu */}
        {showDropdown && (
          <div className="absolute top-full right-0 mt-2 z-50 bg-background border border-border rounded-lg shadow-lg min-w-[200px] py-2">
            {/* View Mode Toggle */}
            <button
              onClick={() => {
                onToggleViewMode()
                setShowDropdown(false)
              }}
              className="w-full px-4 py-2 text-left hover:bg-accent flex items-center gap-3 text-sm"
            >
              {viewMode === 'continuous' ? (
                <>
                  <FileText className="h-4 w-4" />
                  <span>Chế độ trang đơn</span>
                </>
              ) : (
                <>
                  <Scroll className="h-4 w-4" />
                  <span>Chế độ cuộn liên tục</span>
                </>
              )}
            </button>

            {/* Separator */}
            <div className="h-px bg-border my-1" />

            {/* Download PDF - Hidden for security */}

            {/* Clear PDF */}
            <button
              onClick={() => {
                onClearAll()
                setShowDropdown(false)
              }}
              disabled={!hasAnnotations}
              className="w-full px-4 py-2 text-left hover-muted flex items-center gap-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <BrushCleaning className="h-4 w-4" />
              <span>Dọn sạch trang</span>
            </button>

            {/* Separator */}
            <div className="h-px bg-border my-1" />

            {/* Theme Toggle */}
            <button
              onClick={() => {
                toggleTheme()
                setShowDropdown(false)
              }}
              className="w-full px-4 py-2 text-left hover:bg-accent flex items-center gap-3 text-sm"
            >
              {isDarkMode ? (
                <>
                  <Sun className="h-4 w-4" />
                  <span>Chế độ sáng</span>
                </>
              ) : (
                <>
                  <Moon className="h-4 w-4" />
                  <span>Chế độ tối</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>


    </div>
  )
}

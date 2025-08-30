import { useState, useRef } from 'react'

export interface PageIndicatorProps {
  currentPage: number
  totalPages: number
  loading: boolean
  onPageJump: (page: number) => void
  variant: 'mobile' | 'desktop'
  className?: string
}

export function PageIndicator({ 
  currentPage, 
  totalPages, 
  loading, 
  onPageJump, 
  variant,
  className = '' 
}: PageIndicatorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleClick = () => {
    setIsEditing(true)
    setInputValue(currentPage.toString())
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  const handleSubmit = () => {
    const pageNum = parseInt(inputValue)
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
      onPageJump(pageNum)
    }
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit()
    } else if (e.key === 'Escape') {
      setIsEditing(false)
    }
  }

  const handleBlur = () => {
    handleSubmit()
  }

  // Mobile variant styles
  const mobileStyles = {
    container: "fixed bottom-4 left-1/2 transform -translate-x-1/2 z-40 bg-muted rounded-md px-3 py-1.5 shadow-lg backdrop-blur-sm min-w-[60px] flex items-center justify-center",
    text: "text-xs font-medium text-foreground",
    input: "w-8 text-xs font-medium text-center bg-transparent border-none outline-none text-foreground [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
    button: "text-xs font-medium text-foreground hover:text-primary transition-colors w-full h-full flex items-center justify-center"
  }

  // Desktop variant styles
  const desktopStyles = {
    container: "hidden sm:flex items-center px-3 py-1 bg-muted rounded-md min-w-[80px] justify-center flex-shrink-0",
    text: "text-sm font-medium text-foreground",
    input: "w-8 text-sm font-medium text-center bg-transparent border-none outline-none text-foreground [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
    button: "text-sm font-medium text-foreground hover:text-primary transition-colors w-full h-full flex items-center justify-center"
  }

  const styles = variant === 'mobile' ? mobileStyles : desktopStyles

  if (loading) {
    return (
      <div className={`${styles.container} ${className}`}>
        <span className={styles.text}>...</span>
      </div>
    )
  }

  return (
    <div className={`${styles.container} ${className}`}>
      {isEditing ? (
        <div className="flex items-center gap-1">
          <input
            ref={inputRef}
            type="number"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            className={styles.input}
            min="1"
            max={totalPages}
          />
          <span className={styles.text}>/ {totalPages}</span>
        </div>
      ) : (
        <button
          onClick={handleClick}
          className={styles.button}
        >
          {currentPage} / {totalPages}
        </button>
      )}
    </div>
  )
}

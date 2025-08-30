"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { useLoadingState } from "@/contexts/loading-context"

interface LoadingLinkProps {
  href: string
  children: React.ReactNode
  className?: string
  onClick?: () => void
  replace?: boolean
  scroll?: boolean
  prefetch?: boolean
  loadingDelay?: number
  loadingMessage?: string
}

export function LoadingLink({
  href,
  children,
  className,
  onClick,
  replace = false,
  scroll = true,
  prefetch = true,
  loadingDelay = 100,
  loadingMessage = "Đang chuyển trang..."
}: LoadingLinkProps) {
  const [isNavigating, setIsNavigating] = useState(false)
  const router = useRouter()
  const { startLoading, stopLoading, setMessage } = useLoadingState()

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Don't prevent default for external links or special keys
    if (
      href.startsWith('http') ||
      href.startsWith('mailto:') ||
      href.startsWith('tel:') ||
      e.metaKey ||
      e.ctrlKey ||
      e.shiftKey ||
      e.altKey
    ) {
      onClick?.()
      return
    }

    // Prevent default navigation
    e.preventDefault()

    // Set loading state
    setIsNavigating(true)
    setMessage(loadingMessage)
    startLoading()
    onClick?.()

    // Small delay to show loading state
    setTimeout(() => {
      if (replace) {
        router.replace(href, { scroll })
      } else {
        router.push(href, { scroll })
      }

      // Reset loading state after navigation
      setTimeout(() => {
        setIsNavigating(false)
        stopLoading()
      }, 300)
    }, loadingDelay)
  }

  return (
    <Link
      href={href}
      className={cn(
        "transition-opacity duration-200",
        isNavigating && "opacity-70 pointer-events-none",
        className
      )}
      onClick={handleClick}
      prefetch={prefetch}
    >
      {children}
    </Link>
  )
}

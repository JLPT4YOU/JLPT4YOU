"use client"

import { useCallback, useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

/**
 * Hook để lưu và khôi phục vị trí scroll khi chuyển ngôn ngữ
 * Giúp người dùng không bị mất vị trí đang đọc khi chuyển đổi ngôn ngữ
 */
export function useScrollPreservation() {
  const pathname = usePathname()
  const scrollPositionRef = useRef<number>(0)
  const isRestoringRef = useRef<boolean>(false)
  const STORAGE_KEY = 'landing-scroll-position'

  // Lưu vị trí scroll hiện tại
  const saveScrollPosition = useCallback(() => {
    const scrollY = window.scrollY
    scrollPositionRef.current = scrollY
    // Lưu vào sessionStorage để persist qua navigation
    sessionStorage.setItem(STORAGE_KEY, scrollY.toString())
  }, [])

  // Khôi phục vị trí scroll đã lưu
  const restoreScrollPosition = useCallback(() => {
    if (scrollPositionRef.current > 0) {
      isRestoringRef.current = true

      // Đợi DOM render xong và thử khôi phục nhiều lần nếu cần
      const attemptRestore = (attempts = 0) => {
        if (attempts > 10) return // Giới hạn số lần thử

        requestAnimationFrame(() => {
          // Kiểm tra xem trang đã có đủ chiều cao chưa
          const documentHeight = Math.max(
            document.body.scrollHeight,
            document.body.offsetHeight,
            document.documentElement.clientHeight,
            document.documentElement.scrollHeight,
            document.documentElement.offsetHeight
          )

          if (documentHeight > scrollPositionRef.current) {
            window.scrollTo({
              top: scrollPositionRef.current,
              behavior: 'instant'
            })

            // Reset flag sau khi khôi phục xong
            setTimeout(() => {
              isRestoringRef.current = false
            }, 100)
          } else {
            // Nếu trang chưa đủ cao, thử lại sau 50ms
            setTimeout(() => attemptRestore(attempts + 1), 50)
          }
        })
      }

      attemptRestore()
    }
  }, [])

  // Khôi phục scroll position khi pathname thay đổi (chuyển ngôn ngữ)
  useEffect(() => {
    if (pathname.includes('/landing')) {
      // Lấy scroll position từ sessionStorage
      const savedPosition = sessionStorage.getItem(STORAGE_KEY)
      if (savedPosition) {
        const position = parseInt(savedPosition, 10)
        scrollPositionRef.current = position

        // Đợi một chút để đảm bảo component đã mount và render xong
        const timer = setTimeout(() => {
          restoreScrollPosition()
        }, 150)

        return () => clearTimeout(timer)
      }
    }
  }, [pathname, restoreScrollPosition])

  // Cleanup khi component unmount
  useEffect(() => {
    return () => {
      scrollPositionRef.current = 0
      isRestoringRef.current = false
      // Xóa sessionStorage khi rời khỏi landing page
      if (!pathname.includes('/landing')) {
        sessionStorage.removeItem(STORAGE_KEY)
      }
    }
  }, [pathname])

  return {
    saveScrollPosition,
    restoreScrollPosition,
    isRestoring: isRestoringRef.current
  }
}

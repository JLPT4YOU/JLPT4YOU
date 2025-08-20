"use client"

import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"

interface ConditionalHeaderWrapperProps {
  children: React.ReactNode
}

export function ConditionalHeaderWrapper({ children }: ConditionalHeaderWrapperProps) {
  const pathname = usePathname()
  const [shouldHideFromClass, setShouldHideFromClass] = useState(false)

  // Check for hide-header class on body (for 404 page)
  useEffect(() => {
    const checkHideHeaderClass = () => {
      setShouldHideFromClass(document.body.classList.contains('hide-header'))
    }

    // Check initially
    checkHideHeaderClass()

    // Set up observer for class changes
    const observer = new MutationObserver(checkHideHeaderClass)
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class']
    })

    return () => observer.disconnect()
  }, [])

  // Check if current route should hide header
  const shouldHideHeader = () => {
    // Hide header if body has hide-header class (for 404 page)
    if (shouldHideFromClass) {
      return true
    }

    // Hide header for all auth-related routes
    if (pathname.startsWith('/auth/')) {
      return true
    }

    // Hide header for iRIN chat interface (full-screen chat experience)
    if (pathname === '/irin') {
      return true
    }

    // Hide header for book reading pages (full-screen reading experience)
    if (pathname.includes('/library/book/') && pathname.split('/').length >= 4) {
      return true
    }

    // Hide header for redirect routes (backward compatibility)
    const redirectRoutes = [
      '/', // Root page (landing)
      '/login',
      '/register',
      '/forgot-password',
      '/landing'
    ]

    if (redirectRoutes.includes(pathname)) {
      return true
    }

    // Hide header for old language-specific routes (if any remain)
    const oldLangRoutes = [
      '/en/landing',
      '/jp/landing',
      '/vn/landing',
      '/en/login',
      '/jp/login',
      '/vn/login',
      '/en/register',
      '/jp/register',
      '/vn/register',
      '/en/forgot-password',
      '/jp/forgot-password',
      '/vn/forgot-password'
    ]

    if (oldLangRoutes.includes(pathname)) {
      return true
    }

    return false
  }

  // Don't render header for auth pages and landing
  if (shouldHideHeader()) {
    return null
  }

  // Render header for all other pages (after successful login)
  return <>{children}</>
}

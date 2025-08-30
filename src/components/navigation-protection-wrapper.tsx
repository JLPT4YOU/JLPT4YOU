"use client"

import { usePathname } from 'next/navigation'
import { NavigationProtectionProvider } from '@/components/anti-cheat-system'

interface NavigationProtectionWrapperProps {
  children: React.ReactNode
}

export function NavigationProtectionWrapper({ children }: NavigationProtectionWrapperProps) {
  const pathname = usePathname()
  
  // Check if we're in challenge test mode
  const isChallengeTestActive = pathname.startsWith('/challenge/') && pathname.includes('/test')
  
  return (
    <NavigationProtectionProvider isActive={isChallengeTestActive}>
      {children}
    </NavigationProtectionProvider>
  )
} 
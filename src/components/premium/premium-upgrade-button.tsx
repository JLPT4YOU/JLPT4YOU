/**
 * Premium Upgrade Button Component
 * Reusable button component for premium upgrade navigation
 */

"use client"

import { Button } from '@/components/ui/button'
import { Crown } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'

interface PremiumUpgradeButtonProps {
  size?: 'sm' | 'default' | 'lg'
  variant?: 'default' | 'outline' | 'secondary'
  className?: string
  children?: React.ReactNode
  redirectToAuth?: boolean // Redirect to auth if not logged in
}

export function PremiumUpgradeButton({ 
  size = 'default',
  variant = 'default',
  className = '',
  children,
  redirectToAuth = false
}: PremiumUpgradeButtonProps) {
  const router = useRouter()
  const { user } = useAuth()

  const handleUpgrade = () => {
    if (!user && redirectToAuth) {
      router.push('/auth/register')
      return
    }

    if (!user) {
      alert('Vui lòng đăng nhập để nâng cấp Premium')
      return
    }

    if (user.role === 'Premium') {
      alert('Bạn đã là thành viên Premium!')
      return
    }

    router.push('/premium')
  }

  return (
    <Button
      onClick={handleUpgrade}
      size={size}
      variant={variant}
      className={className}
    >
      <Crown className="w-4 h-4 mr-2" />
      {children || 'Nâng cấp Premium'}
    </Button>
  )
}

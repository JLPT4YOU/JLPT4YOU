"use client"

import { useState, useEffect } from "react"
import { Eye, EyeOff, AlertTriangle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useTranslations } from "@/hooks/use-translations"

interface PasswordInputProps {
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  placeholder?: string
  className?: string
  showStrengthMeter?: boolean
  showCapsLockWarning?: boolean
  error?: string
  name?: string
  id?: string
}

export function PasswordInput({
  value,
  onChange,
  onBlur,
  placeholder = "Enter password",
  className,
  showStrengthMeter = false,
  showCapsLockWarning = true,
  error,
  name,
  id
}: PasswordInputProps) {
  const { t } = useTranslations()
  const [showPassword, setShowPassword] = useState(false)
  const [capsLockOn, setCapsLockOn] = useState(false)

  // Check caps lock status
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.getModifierState && e.getModifierState('CapsLock')) {
        setCapsLockOn(true)
      } else {
        setCapsLockOn(false)
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.getModifierState && e.getModifierState('CapsLock')) {
        setCapsLockOn(true)
      } else {
        setCapsLockOn(false)
      }
    }

    document.addEventListener('keypress', handleKeyPress)
    document.addEventListener('keyup', handleKeyUp)

    return () => {
      document.removeEventListener('keypress', handleKeyPress)
      document.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  // Password strength calculation
  const getPasswordStrength = (password: string) => {
    let strength = 0
    if (password.length >= 8) strength += 1
    if (/[a-z]/.test(password)) strength += 1
    if (/[A-Z]/.test(password)) strength += 1
    if (/[0-9]/.test(password)) strength += 1
    if (/[^A-Za-z0-9]/.test(password)) strength += 1
    return strength
  }

  const passwordStrength = showStrengthMeter ? getPasswordStrength(value) : 0

  const getStrengthColor = (strength: number) => {
    if (strength <= 1) return "bg-destructive"
    if (strength <= 2) return "bg-warning"
    if (strength <= 3) return "bg-warning"
    if (strength <= 4) return "bg-success"
    return "bg-success"
  }

  const getStrengthText = (strength: number) => {
    if (strength <= 1) return t ? t('auth.passwordInput.strengthWeak') : "Weak"
    if (strength <= 2) return t ? t('auth.passwordInput.strengthFair') : "Fair"
    if (strength <= 3) return t ? t('auth.passwordInput.strengthGood') : "Good"
    if (strength <= 4) return t ? t('auth.passwordInput.strengthStrong') : "Strong"
    return t ? t('auth.passwordInput.strengthVeryStrong') : "Very Strong"
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <Input
          id={id}
          name={name}
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          className={cn(
            "pr-10",
            error && "border-destructive focus-visible:ring-destructive",
            className
          )}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
          onClick={() => setShowPassword(!showPassword)}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Eye className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="sr-only">
            {showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
          </span>
        </Button>
      </div>

      {/* Caps Lock Warning */}
      {showCapsLockWarning && capsLockOn && value.length > 0 && (
        <div className="flex items-center app-gap-xs text-warning text-sm">
          <AlertTriangle className="h-4 w-4" />
          <span>Caps Lock đang bật</span>
        </div>
      )}

      {/* Password Strength Meter */}
      {showStrengthMeter && value.length > 0 && (
        <div className="space-y-2">
          <div className="flex app-gap-xs">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1 flex-1 rounded-full bg-muted",
                  i < passwordStrength && getStrengthColor(passwordStrength)
                )}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Độ mạnh mật khẩu: <span className="font-medium">{getStrengthText(passwordStrength)}</span>
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  )
}
